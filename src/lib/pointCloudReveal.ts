/**
 * pointCloudReveal — scène Three.js (vanilla) pour la démo « nuage de points ».
 *
 * Un drone survole un modèle photogrammétrique et le « scanne » : le nuage de
 * points se peint là où il passe (relevé LiDAR), puis le modèle texturé
 * apparaît. Ensuite la scène reste vivante : rotation douce, le drone continue
 * de scanner en boucle, et le survol souris révèle une bulle de points.
 *
 * Conçu pour tourner dans l'iframe /visualisations/nuage-de-points (plein
 * écran sombre). Pas d'OrbitControls : on évite de piéger le scroll de la page.
 *
 * Port vanilla du composant React/R3F d'origine. `three` est déjà une
 * dépendance du projet ; les addons viennent de `three/examples/jsm`.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';

export interface PointCloudRevealOptions {
  /** GLB compressé (meshopt) à scanner. */
  modelUrl: string;
  /** Densité du nuage (0.2 → 2, défaut 1). */
  intensity?: number;
  /**
   * true (défaut) : l'intro démarre immédiatement. false : la scène reste
   * vide jusqu'au premier appel à `replay()` (déclenchement au scroll).
   */
  autoplay?: boolean;
}

const GROUP_Y = -0.85;
const MODEL_FIT_SIZE = 4.8;
const POINTER_HIT_DIST = 0.75;
const CLOUD_MID = new THREE.Color('#2fd4f0');

// Intro (secondes).
const INTRO_DUR = 11.5;
const INTRO_SCAN_START = 0.2;
const INTRO_SCAN_END = 10.5;

const VIEW_DIR = new THREE.Vector3(0.72, 0.46, 0.86).normalize();

interface ScanInfo {
  radius: number;
  fitRadius: number;
  height: number;
  cloudPositions: Float32Array | null;
  revealAttr: THREE.BufferAttribute | null;
}

function droneCruiseY(info: ScanInfo): number {
  return info.height + Math.max(0.6, info.radius * 0.28);
}

/* ------------------------------------------------------------------ */
/* Shaders                                                             */
/* ------------------------------------------------------------------ */

interface ScanUniforms {
  uScanCenter: { value: THREE.Vector3 };
  uScanRadius: { value: number };
  uScanActive: { value: number };
  uScan2Center: { value: THREE.Vector3 };
  uScan2Radius: { value: number };
  uScan2Active: { value: number };
  uTime: { value: number };
  uIntroMode: { value: number };
  uIntroMesh: { value: number };
  uIntroCloud: { value: number };
  uPixelRatio: { value: number };
  uSizeScale: { value: number };
}

function patchScanMaterial(material: THREE.Material, u: ScanUniforms) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uScanCenter = u.uScanCenter;
    shader.uniforms.uScanRadius = u.uScanRadius;
    shader.uniforms.uScanActive = u.uScanActive;
    shader.uniforms.uScan2Center = u.uScan2Center;
    shader.uniforms.uScan2Radius = u.uScan2Radius;
    shader.uniforms.uScan2Active = u.uScan2Active;
    shader.uniforms.uIntroMode = u.uIntroMode;
    shader.uniforms.uIntroMesh = u.uIntroMesh;

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vHpcWorldPos;')
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvHpcWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;',
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec3 vHpcWorldPos;
uniform vec3 uScanCenter; uniform float uScanRadius; uniform float uScanActive;
uniform vec3 uScan2Center; uniform float uScan2Radius; uniform float uScan2Active;
uniform float uIntroMode; uniform float uIntroMesh;
float hpcHash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }`,
      )
      .replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
if (uIntroMode > 0.5) {
  if (uIntroMesh < 0.999 && hpcHash(gl_FragCoord.xy) > uIntroMesh) discard;
} else {
  float d1 = distance(vHpcWorldPos, uScanCenter);
  float d2 = distance(vHpcWorldPos, uScan2Center);
  float gone = max(uScanRadius - d1, uScan2Radius - d2);
  if (gone > 0.0) { float tt = clamp(gone/0.22,0.0,1.0); if (hpcHash(gl_FragCoord.xy + vHpcWorldPos.y*91.7) < tt) discard; }
  float edge = max(exp(-abs(d1-uScanRadius)*16.0)*uScanActive, exp(-abs(d2-uScan2Radius)*16.0)*uScan2Active);
  gl_FragColor.rgb += vec3(0.20,0.89,1.0) * edge * 0.8;
}`,
      );
  };
  material.customProgramCacheKey = () => 'hpc-scan-dissolve';
}

const POINTS_VERTEX = /* glsl */ `
uniform vec3 uScanCenter; uniform float uScanRadius; uniform float uScanActive;
uniform vec3 uScan2Center; uniform float uScan2Radius;
uniform float uIntroMode; uniform float uIntroCloud;
uniform float uTime; uniform float uPixelRatio; uniform float uSizeScale;
attribute vec3 aColor; attribute float aSize; attribute float aRand; attribute float aReveal;
varying vec3 vColor; varying float vAlpha; varying float vFlash;
void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  float d1 = distance(worldPos.xyz, uScanCenter);
  float reveal; float flash; vec3 activeCenter;
  if (uIntroMode > 0.5) {
    reveal = aReveal * uIntroCloud;
    float hdist = length(worldPos.xz - uScanCenter.xz);
    flash = exp(-hdist * 2.2) * uScanActive;
    activeCenter = uScanCenter;
  } else {
    float d2 = distance(worldPos.xyz, uScan2Center);
    float r1 = 1.0 - smoothstep(uScanRadius - 0.18, uScanRadius + 0.02, d1);
    float r2 = 1.0 - smoothstep(uScan2Radius - 0.18, uScan2Radius + 0.02, d2);
    reveal = max(r1, r2);
    flash = max(exp(-abs(d1-uScanRadius)*10.0)*step(0.001,uScanRadius), exp(-abs(d2-uScan2Radius)*10.0)*step(0.001,uScan2Radius));
    activeCenter = r1 >= r2 ? uScanCenter : uScan2Center;
  }
  float t = uTime * 0.7 + aRand * 6.28318;
  worldPos.xyz += vec3(sin(t*1.3), cos(t*1.7), sin(t*0.9)) * 0.012 * reveal;
  vec3 dir = normalize(worldPos.xyz - activeCenter + vec3(0.0001));
  worldPos.xyz += dir * flash * reveal * 0.05;
  vec4 mv = viewMatrix * worldPos;
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSize * uPixelRatio * uSizeScale * (30.0 / -mv.z) * reveal * (1.0 + flash * 1.6);
  vColor = aColor; vAlpha = reveal; vFlash = flash;
}`;

const POINTS_FRAGMENT = /* glsl */ `
varying vec3 vColor; varying float vAlpha; varying float vFlash;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float disc = smoothstep(0.5, 0.16, length(uv));
  if (disc * vAlpha < 0.02) discard;
  // Flash plus discret (teinté cyan, pas blanc pur) pour éviter la surbrillance.
  vec3 col = vColor + vec3(0.18, 0.5, 0.7) * vFlash * 0.5;
  // Opacité additive réduite : moins d'empilement blanc sur les zones denses.
  gl_FragColor = vec4(col, disc * vAlpha * 0.6);
}`;

/* ------------------------------------------------------------------ */
/* Échantillonnage du nuage                                            */
/* ------------------------------------------------------------------ */

interface TexPixels {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  flipY: boolean;
}

function readTexturePixels(tex: THREE.Texture, maxSize = 1024): TexPixels | null {
  const image = tex.image as (CanvasImageSource & { width: number; height: number }) | undefined;
  if (!image || !image.width) return null;
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  const w = Math.max(1, Math.round(image.width * scale));
  const h = Math.max(1, Math.round(image.height * scale));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(image, 0, 0, w, h);
  return { data: ctx.getImageData(0, 0, w, h).data, width: w, height: h, flipY: tex.flipY };
}

function sampleTextureColor(px: TexPixels, uv: THREE.Vector2, out: THREE.Color) {
  const u = ((uv.x % 1) + 1) % 1;
  const v = ((uv.y % 1) + 1) % 1;
  const x = Math.min(px.width - 1, Math.floor(u * px.width));
  const y = Math.min(px.height - 1, Math.floor((px.flipY ? 1 - v : v) * px.height));
  const i = (y * px.width + x) * 4;
  out.setRGB(px.data[i] / 255, px.data[i + 1] / 255, px.data[i + 2] / 255);
  out.convertSRGBToLinear();
}

/* ------------------------------------------------------------------ */
/* Drone procédural                                                    */
/* ------------------------------------------------------------------ */

const ROTOR_POS: [number, number, number][] = [
  [0.36, 0.04, 0.36],
  [-0.36, 0.04, 0.36],
  [0.36, 0.04, -0.36],
  [-0.36, 0.04, -0.36],
];

function buildDrone(): { group: THREE.Group; rotors: THREE.Group[]; strobe: THREE.Group } {
  const g = new THREE.Group();
  g.visible = false;
  const carbon = () =>
    new THREE.MeshStandardMaterial({
      color: '#0b1018',
      metalness: 0.78,
      roughness: 0.28,
      emissive: '#103a4a',
      emissiveIntensity: 0.7,
    });
  const dark = () =>
    new THREE.MeshStandardMaterial({ color: '#0e1726', metalness: 0.6, roughness: 0.45 });
  const cyan = () => new THREE.MeshBasicMaterial({ color: '#5af2ff' });
  const add = (
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    pos?: [number, number, number],
    rot?: [number, number, number],
  ) => {
    const m = new THREE.Mesh(geo, mat);
    if (pos) m.position.set(...pos);
    if (rot) m.rotation.set(...rot);
    g.add(m);
    return m;
  };
  const addTo = (
    parent: THREE.Object3D,
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    pos?: [number, number, number],
    rot?: [number, number, number],
  ) => {
    const m = new THREE.Mesh(geo, mat);
    if (pos) m.position.set(...pos);
    if (rot) m.rotation.set(...rot);
    parent.add(m);
    return m;
  };

  add(
    new THREE.SphereGeometry(0.7, 16, 16),
    new THREE.MeshBasicMaterial({
      color: '#1ed0ff',
      transparent: true,
      opacity: 0.06,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  add(new THREE.BoxGeometry(0.46, 0.1, 0.62), carbon());
  add(
    new THREE.BoxGeometry(0.3, 0.08, 0.34),
    new THREE.MeshStandardMaterial({
      color: '#0e1622',
      metalness: 0.6,
      roughness: 0.2,
      emissive: '#0c3344',
      emissiveIntensity: 0.5,
    }),
    [0, 0.08, -0.02],
  );
  add(new THREE.BoxGeometry(0.02, 0.035, 0.52), cyan(), [0.235, 0.01, 0]);
  add(new THREE.BoxGeometry(0.02, 0.035, 0.52), cyan(), [-0.235, 0.01, 0]);
  add(new THREE.BoxGeometry(0.34, 0.035, 0.02), cyan(), [0, 0.01, 0.32]);
  add(
    new THREE.TorusGeometry(0.17, 0.014, 8, 32),
    new THREE.MeshBasicMaterial({
      color: '#2ad8ff',
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    [0, -0.05, 0],
    [-Math.PI / 2, 0, 0],
  );
  add(
    new THREE.BoxGeometry(0.12, 0.07, 0.12),
    new THREE.MeshStandardMaterial({ color: '#070b12', metalness: 0.7, roughness: 0.3 }),
    [0, -0.09, 0.04],
  );
  add(
    new THREE.SphereGeometry(0.07, 16, 16),
    new THREE.MeshStandardMaterial({ color: '#05080d', metalness: 0.6, roughness: 0.25 }),
    [0, -0.15, 0.04],
  );
  add(
    new THREE.CylinderGeometry(0.04, 0.04, 0.02, 16),
    new THREE.MeshBasicMaterial({ color: '#c4f7ff' }),
    [0, -0.2, 0.04],
    [Math.PI / 2, 0, 0],
  );
  add(new THREE.BoxGeometry(1.02, 0.035, 0.05), dark(), undefined, [0, Math.PI / 4, 0]);
  add(new THREE.BoxGeometry(1.02, 0.035, 0.05), dark(), undefined, [0, -Math.PI / 4, 0]);
  add(new THREE.BoxGeometry(0.03, 0.02, 0.46), dark(), [0.2, -0.17, 0]);
  add(new THREE.BoxGeometry(0.03, 0.02, 0.46), dark(), [-0.2, -0.17, 0]);

  const rotors: THREE.Group[] = [];
  for (const pos of ROTOR_POS) {
    const motorGroup = new THREE.Group();
    motorGroup.position.set(...pos);
    g.add(motorGroup);
    addTo(
      motorGroup,
      new THREE.CylinderGeometry(0.055, 0.06, 0.09, 14),
      new THREE.MeshStandardMaterial({ color: '#0a0f18', metalness: 0.7, roughness: 0.35 }),
    );
    addTo(
      motorGroup,
      new THREE.TorusGeometry(0.05, 0.008, 6, 18),
      new THREE.MeshBasicMaterial({ color: '#39e6ff' }),
      [0, 0.05, 0],
      [-Math.PI / 2, 0, 0],
    );
    const rotor = new THREE.Group();
    rotor.position.set(0, 0.08, 0);
    motorGroup.add(rotor);
    addTo(
      rotor,
      new THREE.BoxGeometry(0.42, 0.01, 0.045),
      new THREE.MeshStandardMaterial({ color: '#1a2740', metalness: 0.4, roughness: 0.6 }),
    );
    addTo(
      rotor,
      new THREE.BoxGeometry(0.42, 0.01, 0.045),
      new THREE.MeshStandardMaterial({ color: '#1a2740', metalness: 0.4, roughness: 0.6 }),
      undefined,
      [0, Math.PI / 2, 0],
    );
    addTo(
      rotor,
      new THREE.CircleGeometry(0.23, 28),
      new THREE.MeshBasicMaterial({
        color: '#6fe9ff',
        transparent: true,
        opacity: 0.14,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
      undefined,
      [-Math.PI / 2, 0, 0],
    );
    rotors.push(rotor);
  }

  add(
    new THREE.SphereGeometry(0.03, 10, 10),
    new THREE.MeshBasicMaterial({ color: '#ff2d4b' }),
    [-0.235, -0.01, 0.26],
  );
  add(
    new THREE.SphereGeometry(0.03, 10, 10),
    new THREE.MeshBasicMaterial({ color: '#2bff84' }),
    [0.235, -0.01, 0.26],
  );
  const strobe = new THREE.Group();
  g.add(strobe);
  addTo(
    strobe,
    new THREE.SphereGeometry(0.035, 10, 10),
    new THREE.MeshBasicMaterial({ color: '#ffffff' }),
    [0, 0.05, -0.3],
  );
  addTo(
    strobe,
    new THREE.SphereGeometry(0.09, 12, 12),
    new THREE.MeshBasicMaterial({
      color: '#bfeaff',
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    [0, 0.05, -0.3],
  );

  return { group: g, rotors, strobe };
}

function makeGridTexture(): THREE.CanvasTexture {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  ctx.strokeStyle = 'rgba(70,200,255,0.5)';
  ctx.lineWidth = 1;
  const ctr = size / 2;
  for (let r = 1; r <= 5; r++) {
    ctx.beginPath();
    ctx.arc(ctr, ctr, (r / 5.2) * ctr, 0, Math.PI * 2);
    ctx.globalAlpha = 0.5 - r * 0.07;
    ctx.stroke();
  }
  ctx.globalAlpha = 0.18;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(ctr, ctr);
    ctx.lineTo(ctr + Math.cos(a) * ctr, ctr + Math.sin(a) * ctr);
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 2;
  return t;
}

function nearestCloudPointToRay(
  pos: Float32Array,
  o: THREE.Vector3,
  d: THREE.Vector3,
  out: THREE.Vector3,
): number {
  const stride = Math.max(1, Math.floor(pos.length / 3 / 6000)) * 3;
  let best = Infinity;
  let bx = 0;
  let by = 0;
  let bz = 0;
  for (let i = 0; i < pos.length; i += stride) {
    const px = pos[i] - o.x;
    const py = pos[i + 1] - o.y;
    const pz = pos[i + 2] - o.z;
    let t = px * d.x + py * d.y + pz * d.z;
    if (t < 0) t = 0;
    const cx = px - t * d.x;
    const cy = py - t * d.y;
    const cz = pz - t * d.z;
    const ds = cx * cx + cy * cy + cz * cz;
    if (ds < best) {
      best = ds;
      bx = pos[i];
      by = pos[i + 1];
      bz = pos[i + 2];
    }
  }
  out.set(bx, by, bz);
  return Math.sqrt(best);
}

/* ------------------------------------------------------------------ */
/* Scène                                                               */
/* ------------------------------------------------------------------ */

export function initPointCloudReveal(
  canvas: HTMLCanvasElement,
  opts: PointCloudRevealOptions,
): () => void {
  const intensity = THREE.MathUtils.clamp(opts.intensity ?? 1, 0.2, 2);
  const autoplay = opts.autoplay ?? true;
  const isCoarse = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
  const reducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(4.6, 2.4, 5.6);

  scene.add(new THREE.AmbientLight(0x9db4d8, 0.55));
  const dir = new THREE.DirectionalLight(0xffe8c8, 1.6);
  dir.position.set(4, 6, 3);
  scene.add(dir);
  const p1 = new THREE.PointLight(0x22d3ee, 5);
  p1.position.set(-5, 2, -4);
  scene.add(p1);
  const p2 = new THREE.PointLight(0xc026d3, 2.5);
  p2.position.set(-3, 1, 4);
  scene.add(p2);

  const group = new THREE.Group();
  group.position.y = GROUP_Y;
  scene.add(group);

  const uniforms: ScanUniforms = {
    uScanCenter: { value: new THREE.Vector3(0, -999, 0) },
    uScanRadius: { value: 0 },
    uScanActive: { value: 0 },
    uScan2Center: { value: new THREE.Vector3(0, -999, 0) },
    uScan2Radius: { value: 0 },
    uScan2Active: { value: 0 },
    uTime: { value: 0 },
    uIntroMode: { value: 1 },
    uIntroMesh: { value: 0 },
    uIntroCloud: { value: 0 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 1.75) },
    uSizeScale: { value: 1 },
  };

  const info: ScanInfo = {
    radius: 2.35,
    fitRadius: 3.0,
    height: 2.3,
    cloudPositions: null,
    revealAttr: null,
  };

  // Grille au sol.
  const grid = new THREE.Mesh(
    new THREE.CircleGeometry(3.6, 48),
    new THREE.MeshBasicMaterial({
      map: makeGridTexture(),
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  grid.rotation.x = -Math.PI / 2;
  grid.position.y = 0.02;
  group.add(grid);

  // Faisceau.
  const beam = new THREE.Mesh(
    new THREE.ConeGeometry(1, 1, 28, 1, true),
    new THREE.MeshBasicMaterial({
      color: '#34e2ff',
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  beam.visible = false;
  group.add(beam);

  const { group: drone, rotors, strobe } = buildDrone();
  group.add(drone);

  // Chargement du modèle + échantillonnage du nuage.
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  let pointsMesh: THREE.Points | null = null;
  let disposed = false;

  loader.load(
    opts.modelUrl,
    (gltf) => {
      if (disposed) return;
      const root = gltf.scene;
      root.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(root);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const scale = MODEL_FIT_SIZE / Math.max(size.x, size.y, size.z);
      const offset = new THREE.Vector3(-center.x, -box.min.y, -center.z);
      const post = new THREE.Matrix4()
        .makeScale(scale, scale, scale)
        .multiply(new THREE.Matrix4().makeTranslation(offset.x, offset.y, offset.z));

      const meshes: { mesh: THREE.Mesh; matrix: THREE.Matrix4 }[] = [];
      const pixelsCache = new Map<string, TexPixels | null>();
      root.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (!mesh.isMesh) return;
        const map = (mesh.material as THREE.MeshStandardMaterial).map ?? null;
        const basic = new THREE.MeshBasicMaterial({
          map,
          vertexColors: Boolean(mesh.geometry.getAttribute('color')),
          side: THREE.DoubleSide,
        });
        patchScanMaterial(basic, uniforms);
        mesh.material = basic;
        if (map && !pixelsCache.has(map.uuid)) pixelsCache.set(map.uuid, readTexturePixels(map));
        meshes.push({ mesh, matrix: new THREE.Matrix4().multiplyMatrices(post, mesh.matrixWorld) });
      });

      // Modèle affiché (normalisé via groupes imbriqués).
      const scaleGroup = new THREE.Group();
      scaleGroup.scale.setScalar(scale);
      const offsetGroup = new THREE.Group();
      offsetGroup.position.copy(offset);
      offsetGroup.add(root);
      scaleGroup.add(offsetGroup);
      group.add(scaleGroup);

      // Nuage de points.
      const totalPoints = Math.round(55000 * intensity * (isCoarse ? 0.55 : 1));
      const positions = new Float32Array(totalPoints * 3);
      const colors = new Float32Array(totalPoints * 3);
      const sizes = new Float32Array(totalPoints);
      const rands = new Float32Array(totalPoints);
      const sample = new THREE.Vector3();
      const normal = new THREE.Vector3();
      const uv = new THREE.Vector2();
      const vcol = new THREE.Color();
      const col = new THREE.Color();
      let cursor = 0;
      const perMesh = Math.floor(totalPoints / meshes.length);
      meshes.forEach(({ mesh, matrix }, idx) => {
        const count = idx === meshes.length - 1 ? totalPoints - cursor : perMesh;
        const sampler = new MeshSurfaceSampler(mesh).build();
        const hasUV = Boolean(mesh.geometry.getAttribute('uv'));
        const hasVC = Boolean(mesh.geometry.getAttribute('color'));
        const map = (mesh.material as THREE.MeshBasicMaterial).map;
        const px = map ? pixelsCache.get(map.uuid) : null;
        for (let i = 0; i < count && cursor < totalPoints; i++, cursor++) {
          sampler.sample(sample, normal, hasVC ? vcol : undefined, hasUV ? uv : undefined);
          sample.applyMatrix4(matrix);
          if (px) {
            sampleTextureColor(px, uv, col);
            col.multiplyScalar(0.9 + Math.random() * 0.35);
          } else if (hasVC) {
            col.copy(vcol).multiplyScalar(0.9 + Math.random() * 0.35);
          } else {
            col.copy(CLOUD_MID);
          }
          positions[cursor * 3] = sample.x;
          positions[cursor * 3 + 1] = sample.y;
          positions[cursor * 3 + 2] = sample.z;
          colors[cursor * 3] = col.r;
          colors[cursor * 3 + 1] = col.g;
          colors[cursor * 3 + 2] = col.b;
          sizes[cursor] = 0.6 + Math.random() * 0.9;
          rands[cursor] = Math.random();
        }
      });

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
      geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
      geo.setAttribute('aRand', new THREE.BufferAttribute(rands, 1));
      const revealAttr = new THREE.BufferAttribute(new Float32Array(totalPoints), 1);
      geo.setAttribute('aReveal', revealAttr);

      const pmat = new THREE.ShaderMaterial({
        vertexShader: POINTS_VERTEX,
        fragmentShader: POINTS_FRAGMENT,
        uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      pointsMesh = new THREE.Points(geo, pmat);
      group.add(pointsMesh);

      const hx = (size.x * scale) / 2;
      const hz = (size.z * scale) / 2;
      info.radius = Math.max(hx, hz) + 0.35;
      info.fitRadius = Math.hypot(hx, hz) + 0.3;
      info.height = size.y * scale;
      info.cloudPositions = positions;
      info.revealAttr = revealAttr;
      fitCamera();
    },
    undefined,
    (err) => console.warn('[pointCloudReveal] échec chargement modèle', err),
  );

  /* --- Cadrage caméra --- */
  const fitTarget = new THREE.Vector3();
  function computeFitDistance(): number {
    const fov = (camera.fov * Math.PI) / 180;
    const vHalf = Math.tan(fov / 2);
    const hHalf = vHalf * Math.max(0.4, camera.aspect);
    // Cadrage serré : on inclut juste l'altitude du drone (pas de marge en plus).
    const ceiling = droneCruiseY(info) + 0.15;
    const halfH = ceiling * 0.5;
    const sphereR = Math.hypot(info.fitRadius, halfH);
    fitTarget.set(0, GROUP_Y + halfH, 0);
    // Facteur < 1 = plus proche que le cadrage « tout visible ».
    return (sphereR / Math.min(vHalf, hHalf)) * 0.65 + 0.1;
  }
  function fitCamera() {
    const d = computeFitDistance();
    camera.position.copy(VIEW_DIR).multiplyScalar(d).add(fitTarget);
    camera.lookAt(fitTarget);
  }

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    fitCamera();
  }
  window.addEventListener('resize', resize);
  document.addEventListener('fullscreenchange', resize);
  resize();

  /* --- Survol souris --- */
  const pointer = new THREE.Vector2(0, 0);
  let hovered = false;
  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    const r = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    hovered = true;
  };
  const onLeave = () => {
    hovered = false;
  };
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerleave', onLeave);

  /* --- Boucle d'animation --- */
  const clock = new THREE.Clock();
  const raycaster = new THREE.Raycaster();
  // started=false : on attend un appel à replay() (déclenchement au scroll).
  let started = reducedMotion ? true : autoplay;
  const introState = { active: autoplay && !reducedMotion, t: 0 };
  let introElapsed = 0;
  let firedDone = false;

  // Centres/rayons des bulles.
  const droneCenterLocal = new THREE.Vector3(0, -999, 0);
  const mouseCenterLocal = new THREE.Vector3(0, -999, 0);
  let mouseRadius = 0;
  let droneRadius = 0;
  const prevDrone = new THREE.Vector3();

  const _drone = new THREE.Vector3();
  const _target = new THREE.Vector3();
  const _local = new THREE.Vector3();
  const _virtual = new THREE.Vector3();
  const _ray = new THREE.Ray();
  const _inv = new THREE.Matrix4();
  const _dir = new THREE.Vector3();
  const _mid = new THREE.Vector3();
  const _quat = new THREE.Quaternion();
  const _up = new THREE.Vector3(0, 1, 0);
  const _introDir = new THREE.Vector3();
  const sd = THREE.MathUtils.smoothstep;
  const lerp = THREE.MathUtils.lerp;

  let raf = 0;
  function frame() {
    raf = requestAnimationFrame(frame);
    const delta = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    group.updateMatrixWorld();
    const maxRadius = info.radius * 0.37;

    // En attente du déclenchement (scroll) : scène vide.
    if (!started) {
      uniforms.uIntroMode.value = 1;
      uniforms.uIntroMesh.value = 0;
      uniforms.uIntroCloud.value = 0;
      drone.visible = false;
      beam.visible = false;
      renderer.render(scene, camera);
      return;
    }

    /* ---------- INTRO ---------- */
    if (introState.active) {
      if (!info.cloudPositions) {
        uniforms.uIntroMode.value = 1;
        uniforms.uIntroMesh.value = 0;
        uniforms.uIntroCloud.value = 0;
        renderer.render(scene, camera);
        return;
      }
      introElapsed += delta;
      const it = introElapsed;
      introState.t = it;
      if (it >= INTRO_SCAN_END && !firedDone) firedDone = true;
      if (it >= INTRO_DUR) {
        introState.active = false;
        uniforms.uIntroMode.value = 0;
      } else {
        // Balayage serpentin continu (demi-tours arrondis).
        const halfX = info.radius * 0.85;
        const halfZ = info.radius * 0.7;
        const passes = 3;
        const scanP = sd(it, INTRO_SCAN_START, INTRO_SCAN_END);
        const rowW = 1;
        const turnW = 0.5;
        const totalW = passes * rowW + (passes - 1) * turnW;
        const zAt = (i: number) => lerp(-halfZ, halfZ, i / (passes - 1));
        const xDir = (i: number) => (i % 2 === 0 ? 1 : -1);
        let pathX = halfX;
        let pathZ = zAt(passes - 1);
        let s = scanP * totalW;
        for (let i = 0; i < passes; i++) {
          if (s <= rowW) {
            const f = s / rowW;
            const d = xDir(i);
            pathX = d > 0 ? lerp(-halfX, halfX, f) : lerp(halfX, -halfX, f);
            pathZ = zAt(i);
            break;
          }
          s -= rowW;
          if (i < passes - 1) {
            if (s <= turnW) {
              const f = s / turnW;
              const xe = xDir(i) > 0 ? halfX : -halfX;
              pathZ = lerp(zAt(i), zAt(i + 1), sd(f, 0, 1));
              pathX = xe + Math.sin(f * Math.PI) * halfX * 0.14 * (xDir(i) > 0 ? 1 : -1);
              break;
            }
            s -= turnW;
          }
        }
        const cruiseY = droneCruiseY(info) + Math.sin(it * 0.7) * 0.12;
        const appear = sd(it, 0, 0.4);
        _drone.set(pathX, cruiseY, pathZ);
        droneCenterLocal.set(_drone.x, info.height * 0.5, _drone.z);

        const scanning = it >= INTRO_SCAN_START && it < INTRO_SCAN_END;
        const introCloud = it < INTRO_SCAN_END ? 1 : 1 - sd(it, INTRO_SCAN_END, INTRO_DUR);
        const introMesh = it < INTRO_SCAN_END ? 0 : sd(it, INTRO_SCAN_END, INTRO_DUR);
        const beamFactor =
          sd(it, INTRO_SCAN_START - 0.2, INTRO_SCAN_START + 0.5) *
          (1 - sd(it, INTRO_SCAN_END - 0.6, INTRO_SCAN_END));

        // Peinture par point.
        const pos = info.cloudPositions;
        const rev = info.revealAttr!.array as Float32Array;
        const brush2 = (info.radius * 0.4) ** 2;
        const inc = delta * 3.5;
        const fill = it >= INTRO_SCAN_END - 1 ? delta * 2.5 : 0;
        for (let i = 0, p = 0; i < rev.length; i++, p += 3) {
          if (rev[i] >= 1) continue;
          const dx = pos[p] - _drone.x;
          const dz = pos[p + 2] - _drone.z;
          if (scanning && dx * dx + dz * dz < brush2) rev[i] = Math.min(1, rev[i] + inc);
          else if (fill > 0) rev[i] = Math.min(1, rev[i] + fill);
        }
        info.revealAttr!.needsUpdate = true;

        drone.visible = true;
        drone.scale.setScalar(THREE.MathUtils.clamp(info.radius * 0.3, 0.3, 0.7) * appear);
        drone.position.copy(_drone);
        _dir.copy(_drone).sub(prevDrone);
        if (_dir.lengthSq() > 1e-7) {
          drone.rotation.y = THREE.MathUtils.damp(
            drone.rotation.y,
            Math.atan2(_dir.x, _dir.z),
            5,
            delta,
          );
          drone.rotation.z = THREE.MathUtils.damp(
            drone.rotation.z,
            THREE.MathUtils.clamp(-_dir.x * 20, -0.3, 0.3),
            4,
            delta,
          );
        }
        prevDrone.copy(_drone);
        for (const r of rotors) r.rotation.y += delta * 45;
        strobe.visible = Math.sin(t * 9) > 0.5;

        beam.visible = beamFactor > 0.02;
        if (beam.visible) {
          _dir.copy(_drone).sub(droneCenterLocal);
          const len = _dir.length();
          _mid.copy(_drone).add(droneCenterLocal).multiplyScalar(0.5);
          beam.position.copy(_mid);
          _dir.normalize();
          _quat.setFromUnitVectors(_up, _dir);
          beam.quaternion.copy(_quat);
          const br = info.radius * 0.14;
          beam.scale.set(br, len, br);
          (beam.material as THREE.MeshBasicMaterial).opacity = beamFactor * 0.18;
        }

        // Caméra : orbite lente finissant sur la pose canonique.
        const d = computeFitDistance();
        const k = sd(it, 0, INTRO_DUR);
        _introDir.copy(VIEW_DIR).applyAxisAngle(_up, (1 - k) * 1.4);
        camera.position
          .copy(_introDir)
          .multiplyScalar(d * lerp(1.35, 1.0, k))
          .add(fitTarget);
        camera.lookAt(fitTarget);

        _local.copy(droneCenterLocal).applyMatrix4(group.matrixWorld);
        uniforms.uScanCenter.value.copy(_local);
        uniforms.uScanRadius.value = 0;
        uniforms.uScanActive.value = scanning ? beamFactor : 0;
        uniforms.uScan2Radius.value = 0;
        uniforms.uScan2Active.value = 0;
        uniforms.uIntroMode.value = 1;
        uniforms.uIntroMesh.value = introMesh;
        uniforms.uIntroCloud.value = introCloud;
        uniforms.uTime.value = t;
        renderer.render(scene, camera);
        return;
      }
    }

    /* ---------- INTERACTIF ---------- */
    // Rotation douce du modèle pour garder la scène vivante.
    if (!reducedMotion) group.rotation.y += delta * 0.12;

    // Bulle drone (survol auto en boucle).
    let droneTargetR = 0;
    let droneShown = false;
    if (info.cloudPositions && !reducedMotion) {
      const ang = t * 0.24;
      const rXZ = info.radius * 0.52;
      _drone.set(
        Math.cos(ang) * rXZ,
        droneCruiseY(info) + Math.sin(t * 0.5) * 0.18,
        Math.sin(ang * 0.8 + 0.6) * rXZ * 0.85,
      );
      nearestCloudPointToRay(info.cloudPositions, _drone, new THREE.Vector3(0, -1, 0), _target);
      droneTargetR = maxRadius * (0.92 + 0.08 * Math.sin(t * 2));
      if (droneRadius < 0.05) droneCenterLocal.copy(_target);
      else droneCenterLocal.lerp(_target, 1 - Math.exp(-4 * delta));
      droneShown = true;
    }
    droneRadius = THREE.MathUtils.damp(droneRadius, droneTargetR, 3.2, delta);

    // Bulle souris.
    let mouseTargetR = 0;
    if (info.cloudPositions && hovered) {
      raycaster.setFromCamera(pointer, camera);
      _ray.copy(raycaster.ray);
      _inv.copy(group.matrixWorld).invert();
      _ray.applyMatrix4(_inv);
      const dist = nearestCloudPointToRay(
        info.cloudPositions,
        _ray.origin,
        _ray.direction,
        _target,
      );
      if (dist < POINTER_HIT_DIST) {
        mouseTargetR = maxRadius;
        if (mouseRadius < 0.05) mouseCenterLocal.copy(_target);
        else mouseCenterLocal.lerp(_target, 1 - Math.exp(-10 * delta));
      }
    }
    mouseRadius = THREE.MathUtils.damp(mouseRadius, mouseTargetR, 3.2, delta);

    // Drone + faisceau.
    drone.visible = droneShown;
    if (droneShown) {
      drone.scale.setScalar(THREE.MathUtils.clamp(info.radius * 0.3, 0.3, 0.7));
      drone.position.copy(_drone);
      _dir.copy(_drone).sub(prevDrone);
      if (_dir.lengthSq() > 1e-7) {
        drone.rotation.y = THREE.MathUtils.damp(
          drone.rotation.y,
          Math.atan2(_dir.x, _dir.z),
          5,
          delta,
        );
        drone.rotation.z = THREE.MathUtils.damp(
          drone.rotation.z,
          THREE.MathUtils.clamp(-_dir.x * 28, -0.35, 0.35),
          4,
          delta,
        );
      }
      prevDrone.copy(_drone);
      for (const r of rotors) r.rotation.y += delta * 45;
      strobe.visible = Math.sin(t * 9) > 0.5;
    }
    beam.visible = droneShown && droneRadius > 0.02;
    if (beam.visible) {
      _dir.copy(_drone).sub(droneCenterLocal);
      const len = _dir.length();
      _mid.copy(_drone).add(droneCenterLocal).multiplyScalar(0.5);
      beam.position.copy(_mid);
      _dir.normalize();
      _quat.setFromUnitVectors(_up, _dir);
      beam.quaternion.copy(_quat);
      const br = Math.max(0.04, droneRadius * 0.42);
      beam.scale.set(br, len, br);
      (beam.material as THREE.MeshBasicMaterial).opacity =
        THREE.MathUtils.clamp(droneRadius / maxRadius, 0, 1) * 0.16;
    }

    _local.copy(droneCenterLocal).applyMatrix4(group.matrixWorld);
    uniforms.uScanCenter.value.copy(_local);
    uniforms.uScanRadius.value = droneRadius;
    uniforms.uScanActive.value = THREE.MathUtils.clamp(droneRadius / maxRadius, 0, 1);
    _local.copy(mouseCenterLocal).applyMatrix4(group.matrixWorld);
    uniforms.uScan2Center.value.copy(_local);
    uniforms.uScan2Radius.value = mouseRadius;
    uniforms.uScan2Active.value = THREE.MathUtils.clamp(mouseRadius / maxRadius, 0, 1);
    uniforms.uIntroMode.value = 0;
    uniforms.uTime.value = t;

    // _virtual réservé à un éventuel repli ; évite l'avertissement "unused".
    void _virtual;

    renderer.render(scene, camera);
  }
  frame();

  /* --- Rejouer l'intro depuis le début --- */
  function replay() {
    started = true;
    introState.active = true;
    introState.t = 0;
    introElapsed = 0;
    firedDone = false;
    droneRadius = 0;
    mouseRadius = 0;
    droneCenterLocal.set(0, -999, 0);
    mouseCenterLocal.set(0, -999, 0);
    group.rotation.set(0, 0, 0);
    if (info.revealAttr) {
      (info.revealAttr.array as Float32Array).fill(0);
      info.revealAttr.needsUpdate = true;
    }
    uniforms.uIntroMode.value = 1;
    uniforms.uIntroMesh.value = 0;
    uniforms.uIntroCloud.value = 0;
  }

  /* --- Nettoyage --- */
  function dispose() {
    disposed = true;
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    document.removeEventListener('fullscreenchange', resize);
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerleave', onLeave);
    renderer.dispose();
  }

  return { replay, dispose };
}
