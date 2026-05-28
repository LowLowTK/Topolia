#!/usr/bin/env node
/**
 * Agent orthographe & grammaire (Topolia.fr — §24.5 du BRIEF.md).
 *
 * Utilisé en pre-commit via lint-staged sur les fichiers .mdx modifiés.
 *
 * Deux passes :
 *  1. Regex tutoiement — bloque tout "vous / votre / vos / veuillez" qui se glisse.
 *  2. LanguageTool (API publique) — orthographe, grammaire, accords, typographie FR.
 *
 * Catégories LanguageTool ignorées : STYLE, REDUNDANCY, COLLOQUIALISMS (bruyantes).
 * Whitelist : anglicismes techniques + marques + acronymes métier (cf. WHITELIST_TERMS).
 *
 * Comportement réseau :
 *  - Connexion OK + erreurs trouvées → commit bloqué (exit 1)
 *  - Connexion OK + texte propre     → commit autorisé (exit 0)
 *  - Erreur réseau / API down        → warn + commit autorisé (mode tolérant)
 *  - Texte trop court                → ignoré
 */

import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

const LT_ENDPOINT = 'https://api.languagetool.org/v2/check';
const LT_LANGUAGE = 'fr-FR';
const LT_DISABLED_CATEGORIES = 'STYLE,REDUNDANCY,COLLOQUIALISMS,MISC';
// Règles LanguageTool trop bruyantes (suggestions de virgules incertaines, etc.)
const LT_DISABLED_RULES = [
  'COMMA_COMPOUND_SENTENCE',
  'COMMA_COMPOUND_SENTENCE_2',
  'FRENCH_WHITESPACE_STRICT',
  'COMMA_BEFORE_BUT',
  'COMMA_BEFORE_MAIS',
  'FR_SPELL_NUM',
  'ORDINAL_NUMBER',
  'CE_SE',
].join(',');
const MIN_TEXT_LENGTH = 50;

// Termes techniques / marques / acronymes que LanguageTool prend pour des typos.
// Comparaison casse-insensible. Liste à enrichir au fil des nouveaux articles.
const WHITELIST_TERMS = [
  // Acronymes & standards
  'LiDAR',
  'SLAM',
  'GNSS',
  'IMU',
  'RTK',
  'GCP',
  'COPC',
  'LAS',
  'LAZ',
  'CSV',
  'PLY',
  'E57',
  'NTRIP',
  'PPK',
  'API',
  'CLI',
  'GUI',
  'JSON',
  'YAML',
  'MDX',
  'CSS',
  'HTML',
  'SDK',
  'UI',
  'UX',
  'MNT',
  'MNS',
  'BIM',
  'CAO',
  'RAM',
  'RGB',
  'RMS',
  'SIG',
  'REX',
  'BTP',
  'SEO',
  'OAuth',
  'NPM',
  // Anglicismes tech courants en topo
  'backpack',
  'handheld',
  'drift',
  'split',
  'workflow',
  'workflows',
  'cropper',
  'cropping',
  'mapping',
  'pipeline',
  'scanner',
  'scanners',
  'rover',
  'nadir',
  'open-source',
  'octree',
  // Marques scanner / drone
  'Leica',
  'Faro',
  'Trimble',
  'Riegl',
  'DJI',
  'BLK2GO',
  'BLK',
  'RTC360',
  'Matrice',
  'Zenmuse',
  'Mavic',
  'Phantom',
  'Inspire',
  'M4E',
  'M4D',
  'M4T',
  'M350',
  'WingtraOne',
  'Wingtra',
  // Réglementation drone EU
  'DGAC',
  'AlphaTango',
  'CofC',
  'STS-01',
  'STS-02',
  'STS',
  // Termes photo/mapping
  'rolling',
  'shutter',
  'GSD',
  'entreprise',
  'Care',
  // Logiciels
  'CloudCompare',
  'Metashape',
  'Agisoft',
  'RealityCapture',
  'Pix4D',
  'PDAL',
  'AutoCAD',
  'GeoSLAM',
  'NavVis',
  'Hovermap',
  'Emesent',
  'Recap',
  'Cyclone',
  'Scene',
  'Brevo',
  'Clerk',
  'Stripe',
  'Plausible',
  'Vercel',
  'Netlify',
  'Supabase',
  'Astro',
  'Tailwind',
  'Linear',
  'Decap',
  'Anthropic',
  'GitHub',
  'OVH',
  // Tech LiDAR / algos
  'LIO-SAM',
  'LIO',
  'FAST-LIO',
  'Cartographer',
  'Zeb',
  'VLX',
  'ARC',
  'L1',
  'L2',
  'L3',
  'Hexagon',
  // Termes métier
  'photogrammétrique',
  'photogrammétriques',
  // Marque Topolia
  'Topolia',
  'Loïc',
  // Termes JSX / framework
  'JSX',
  'TypeScript',
  'Husky',
  // Termes composés tech autorisés
  'multi-capteur',
  'multi-capteurs',
  'aiding',
  'GNSS-aiding',
  'cloud-to-cloud',
  'cible-à-cible',
  // Termes config PDAL et terminologie GPS
  'filters',
  'crop',
  'outlier',
  'range',
  'icp',
  'smrf',
  'coordinates',
  'FIX',
  'fix',
  'NOFIX',
  // Unités composées
  'k€',
  // Anglicismes techniques additionnels
  'viewer',
  'viewers',
  'Viewers',
  'optimized',
  'Optimized',
  'Optimize',
  'mapping',
  'writer',
  'writers',
  'Writer',
  'Writers',
  'install',
  'brew',
  'apt',
  'Conda',
  'conda',
  'real',
  'Real',
  'real-time',
  'Real-Time',
  'kinematic',
  'Kinematic',
  'processed',
  'Processed',
  'enterprise',
  'Enterprise',
  'registration',
  'Registration',
  'register',
  'Register',
  'REGISTER',
  'morphological',
  'Morphological',
  'filter',
  'Filter',
  'multi-trajet',
  'multi-trajets',
  'géoréférencé',
  'géoréférencée',
  // Logiciels / formats / écosystème
  'Potree',
  'CesiumJS',
  'loadercloud',
  'OpenDroneMap',
  'RealWorks',
  'Cyclone',
  'Scene',
  'ASPRS',
  'VFX',
  'UHF',
  // Marques NTRIP / réseaux GPS
  'Teria',
  'Orphéon',
  'Centipède',
  // Termes métier français polysémiques
  'topo',
  'statique',
  'dynamique',
  'allée',
  'allées',
  // Réglementation drone UAS (ajouts article L3)
  'EASA',
  'SORA',
  'VLOS',
  'BVLOS',
  'AGL',
  'CATS',
  'STS',
  'UAS',
  'UAS-OPS',
  'MANEX',
  'C3',
  'C5',
  'C6',
  // Marques / produits LiDAR drone (ajouts article L3)
  'Interpine',
  'Applanix',
  'POSPac',
  'NovAtel',
  'Inertial',
  'Terrasolid',
  'TerraScan',
  'TerraModeler',
  'Heliguy',
  'Dronavia',
  'Kronos',
  'Geomesure',
  'StudioSport',
  'DSLRPros',
  'DroneXL',
  'AVSS',
  'NZ',
  // Anglicismes / termes tech LiDAR
  'specs',
  'tenting',
  'Smooth',
  'smooth',
  'Gaussian',
  'Splatting',
  'splatting',
  'sub',
  'sub-centimétrique',
  'sub-centimétriques',
  'pulses',
  'pulse',
  'strips',
  'strip',
  'dataset',
  'datasets',
  'payload',
  'payloads',
  'firmware',
  'cluster',
  // Termes métier fr
  'télépilote',
  'télépilotes',
  'RMSE',
  'QL0',
  'QL1',
  'QL2',
  'QL3',
  'USGS',
  'DEP',
];

// Mots qui signalent un "vous" éditorial à corriger.
const TUTOIEMENT_REGEX = /\b(vous|votre|vos|veuillez|VOUS|Vous|Votre|Vos|Veuillez)\b/g;
const TUTOIEMENT_WHITELIST = [/rendez-vous/gi, /vous-mêmes?/gi, /sauve-qui-peut/gi];

function extractText(content) {
  return content
    .replace(/^---[\s\S]*?\n---/, '') // frontmatter YAML
    .replace(/^import\s+.+?from\s+.+?;?\s*$/gm, '') // imports MDX
    .replace(/```[\s\S]*?```/g, '') // blocs de code
    .replace(/`([^`\n]+)`/g, '$1') // code inline → contenu (sans backticks)
    .replace(/<[A-Z][^>]*\/>/g, '') // <Composant />
    .replace(/<[A-Z][\s\S]*?<\/[A-Z][^>]*>/g, '') // <Composant>…</Composant>
    .replace(/<\/?[A-Za-z][^>]*>/g, '') // balises restantes
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '') // commentaires JSX
    .replace(/\*\*([^*\n]+)\*\*/g, '$1') // **gras** → gras
    .replace(/\*([^*\n]+)\*/g, '$1') // *italique* → italique
    .replace(/__([^_\n]+)__/g, '$1') // __gras__
    .replace(/(?<!\w)_([^_\n]+)_(?!\w)/g, '$1') // _italique_
    .replace(/~~([^~\n]+)~~/g, '$1') // ~~barré~~
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [texte](url) → texte
    .replace(/^#{1,6}\s+(.+)$/gm, (_, line) => (/[.!?:;]$/.test(line) ? line : line + '.'))
    .replace(/^[-*+]\s+(.+)$/gm, (_, line) => (/[.!?:;]$/.test(line) ? line : line + '.'))
    .replace(/^\d+\.\s+(.+)$/gm, (_, line) => (/[.!?:;]$/.test(line) ? line : line + '.'))
    .replace(/[ \t]+/g, ' ') // espaces multiples internes
    .replace(/\n{3,}/g, '\n\n') // sauts de ligne excessifs
    .trim();
}

/** Vérifie si le texte erroné fait partie de la whitelist (casse-insensible).
 *  Matche dans les deux sens : term contient erroneous OU erroneous contient term.
 *  Ex : whitelist "cloud-to-cloud" couvre aussi le segment "cloud-to" matché par LT.
 */
function isWhitelisted(erroneous) {
  const lower = erroneous.toLowerCase().trim();
  if (lower.length === 0) return true;
  return WHITELIST_TERMS.some((term) => {
    const t = term.toLowerCase();
    return lower === t || lower.includes(t) || t.includes(lower);
  });
}

/** Filtre les matches LanguageTool dont la suggestion est seulement
 *  l'ajout OU la suppression d'une virgule (souvent un faux positif).
 *  Ex : "mais" → ", mais" (ajout)
 *  Ex : ", ou" → " ou" (suppression)
 */
function isCommaOnlySuggestion(match, text) {
  const erroneous = text.slice(match.offset, match.offset + match.length).trim();
  const replacement = match.replacements?.[0]?.value?.trim();
  if (!replacement) return false;
  const stripCommas = (s) => s.replace(/,/g, '').replace(/\s+/g, ' ').trim();
  return stripCommas(erroneous) === stripCommas(replacement);
}

/** Passe 1 : détecte tout "vous" résiduel après whitelist. */
function checkTutoiement(text) {
  let cleaned = text;
  for (const re of TUTOIEMENT_WHITELIST) cleaned = cleaned.replace(re, '∅');

  const matches = [...cleaned.matchAll(TUTOIEMENT_REGEX)];
  if (matches.length === 0) return [];

  return matches.map((m) => {
    const start = Math.max(0, m.index - 30);
    const end = Math.min(cleaned.length, m.index + m[0].length + 30);
    const snippet = cleaned.slice(start, end).replace(/\s+/g, ' ').trim();
    return `tutoiement : "...${snippet}..." → remplace "${m[0]}" par la forme tutoyée`;
  });
}

/** Passe 2 : LanguageTool API. */
async function checkLanguageTool(text) {
  const body = new URLSearchParams({
    text,
    language: LT_LANGUAGE,
    disabledCategories: LT_DISABLED_CATEGORIES,
    disabledRules: LT_DISABLED_RULES,
  });

  const response = await fetch(LT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const matches = data.matches || [];

  return matches
    .filter((m) => {
      const erroneous = text.slice(m.offset, m.offset + m.length);
      if (isWhitelisted(erroneous)) return false;
      if (isCommaOnlySuggestion(m, text)) return false;
      return true;
    })
    .map((m) => {
      const before = text.slice(Math.max(0, m.offset - 20), m.offset);
      const erroneous = text.slice(m.offset, m.offset + m.length);
      const after = text.slice(m.offset + m.length, m.offset + m.length + 20);
      const suggestion = m.replacements?.[0]?.value ?? '(pas de suggestion)';
      const context = `...${before}**${erroneous}**${after}...`.replace(/\s+/g, ' ');
      return `${m.rule.category.name} : ${context} → "${suggestion}" (${m.shortMessage || m.message})`;
    });
}

async function checkFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const text = extractText(content);

  if (text.length < MIN_TEXT_LENGTH) {
    console.log(`⏭️  ${basename(filePath)} — texte trop court, ignoré`);
    return true;
  }

  const errors = [];
  errors.push(...checkTutoiement(text));

  try {
    const ltErrors = await checkLanguageTool(text);
    errors.push(...ltErrors);
  } catch (err) {
    console.warn(`⚠️  ${basename(filePath)} — LanguageTool indisponible (${err.message}).`);
    console.warn('   Vérification grammaticale skippée, commit autorisé.');
  }

  if (errors.length === 0) {
    console.log(`✅ ${basename(filePath)} — orthographe & tutoiement OK`);
    return true;
  }

  console.error(`\n❌ Erreurs dans ${filePath} :\n`);
  errors.forEach((e, i) => console.error(`   ${i + 1}. ${e}`));
  console.error('');
  return false;
}

async function main() {
  const files = process.argv.slice(2);
  if (files.length === 0) {
    console.log('Aucun fichier à vérifier.');
    return;
  }

  let allOk = true;
  for (const file of files) {
    const ok = await checkFile(file);
    if (!ok) allOk = false;
  }

  if (!allOk) {
    console.error('Commit bloqué — corrige les erreurs ci-dessus, puis recommit.\n');
    process.exit(1);
  }
}

main();
