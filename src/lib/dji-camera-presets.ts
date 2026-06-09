export interface DjiCameraPreset {
  id: string;
  group: string;
  label: string;
  sensorWidth: number;
  sensorHeight: number;
  imageWidth: number;
  imageHeight: number;
  focal: number;
  note: string;
}

export interface DjiMissionDronePreset {
  id: string;
  group: string;
  label: string;
  cameraPresetId: string;
  speed: number;
  batteryMinutes: number;
  note: string;
}

export const djiCameraPresets: DjiCameraPreset[] = [
  {
    id: 'dji-mavic-3e-wide',
    group: 'Drones compacts / Enterprise',
    label: 'DJI Mavic 3 Enterprise - grand-angle',
    sensorWidth: 17.3,
    sensorHeight: 13,
    imageWidth: 5280,
    imageHeight: 3956,
    focal: 12.29,
    note: '4/3 CMOS 20 MP, image 5280 x 3956. Focale réelle estimée depuis 24 mm équivalent.',
  },
  {
    id: 'dji-matrice-4e-wide',
    group: 'Drones compacts / Enterprise',
    label: 'DJI Matrice 4E - grand-angle',
    sensorWidth: 17.3,
    sensorHeight: 13,
    imageWidth: 5280,
    imageHeight: 3956,
    focal: 12.29,
    note: '4/3 CMOS 20 MP, image 5280 x 3956. Focale réelle estimée depuis 24 mm équivalent.',
  },
  {
    id: 'dji-mavic-3m-rgb',
    group: 'Drones compacts / Enterprise',
    label: 'DJI Mavic 3M - caméra RGB',
    sensorWidth: 17.3,
    sensorHeight: 13,
    imageWidth: 5280,
    imageHeight: 3956,
    focal: 12.29,
    note: 'Caméra RGB 4/3 CMOS 20 MP, image 5280 x 3956. Ne concerne pas les capteurs multispectraux.',
  },
  {
    id: 'dji-phantom-4-rtk',
    group: 'Phantom RTK',
    label: 'DJI Phantom 4 RTK',
    sensorWidth: 13.2,
    sensorHeight: 8.8,
    imageWidth: 5472,
    imageHeight: 3648,
    focal: 8.8,
    note: 'Capteur 1 pouce 20 MP, focale réelle 8,8 mm, image 5472 x 3648 en ratio 3:2.',
  },
  {
    id: 'dji-zenmuse-p1-24',
    group: 'Zenmuse P1',
    label: 'DJI Zenmuse P1 - objectif 24 mm',
    sensorWidth: 35.9,
    sensorHeight: 24,
    imageWidth: 8192,
    imageHeight: 5460,
    focal: 24,
    note: 'Capteur plein format 45 MP, image 8192 x 5460, objectif DJI DL 24 mm.',
  },
  {
    id: 'dji-zenmuse-p1-35',
    group: 'Zenmuse P1',
    label: 'DJI Zenmuse P1 - objectif 35 mm',
    sensorWidth: 35.9,
    sensorHeight: 24,
    imageWidth: 8192,
    imageHeight: 5460,
    focal: 35,
    note: 'Capteur plein format 45 MP, image 8192 x 5460, objectif DJI DL 35 mm.',
  },
  {
    id: 'dji-zenmuse-p1-50',
    group: 'Zenmuse P1',
    label: 'DJI Zenmuse P1 - objectif 50 mm',
    sensorWidth: 35.9,
    sensorHeight: 24,
    imageWidth: 8192,
    imageHeight: 5460,
    focal: 50,
    note: 'Capteur plein format 45 MP, image 8192 x 5460, objectif DJI DL 50 mm.',
  },
  {
    id: 'dji-zenmuse-l2-rgb',
    group: 'Zenmuse LiDAR / RGB',
    label: 'DJI Zenmuse L2 - caméra RGB',
    sensorWidth: 17.3,
    sensorHeight: 13,
    imageWidth: 5280,
    imageHeight: 3956,
    focal: 12.29,
    note: 'Caméra RGB mapping 4/3 CMOS 20 MP, image 5280 x 3956. Utile pour les missions LiDAR + couleur.',
  },
  {
    id: 'dji-matrice-30-wide',
    group: 'Inspection / secours',
    label: 'DJI Matrice 30 / 30T - grand-angle',
    sensorWidth: 6.4,
    sensorHeight: 4.8,
    imageWidth: 4000,
    imageHeight: 3000,
    focal: 4.5,
    note: 'Caméra grand-angle 1/2 pouce 12 MP, image 4000 x 3000. Pratique en inspection, moins adaptée à la photogrammétrie topo fine.',
  },
];

export const djiCameraPresetGroups = [
  'Drones compacts / Enterprise',
  'Phantom RTK',
  'Zenmuse P1',
  'Zenmuse LiDAR / RGB',
  'Inspection / secours',
];

export const djiMissionDronePresets: DjiMissionDronePreset[] = [
  {
    id: 'mission-matrice-4e',
    group: 'Photogrammétrie compacte',
    label: 'DJI Matrice 4E',
    cameraPresetId: 'dji-matrice-4e-wide',
    speed: 8,
    batteryMinutes: 27,
    note: 'Profil terrain prudent pour M4E : capteur grand-angle 4/3, vitesse 8 m/s, autonomie utile 27 min.',
  },
  {
    id: 'mission-mavic-3e',
    group: 'Photogrammétrie compacte',
    label: 'DJI Mavic 3 Enterprise',
    cameraPresetId: 'dji-mavic-3e-wide',
    speed: 8,
    batteryMinutes: 25,
    note: 'Profil terrain prudent pour Mavic 3E : capteur grand-angle 4/3, vitesse 8 m/s, autonomie utile 25 min.',
  },
  {
    id: 'mission-mavic-3m',
    group: 'Agriculture / multispectral',
    label: 'DJI Mavic 3M - RGB',
    cameraPresetId: 'dji-mavic-3m-rgb',
    speed: 7,
    batteryMinutes: 24,
    note: 'Profil centré sur la caméra RGB du Mavic 3M. Les capteurs multispectraux ne sont pas utilisés dans le calcul GSD.',
  },
  {
    id: 'mission-phantom-4-rtk',
    group: 'Photogrammétrie historique',
    label: 'DJI Phantom 4 RTK',
    cameraPresetId: 'dji-phantom-4-rtk',
    speed: 7,
    batteryMinutes: 20,
    note: 'Profil terrain prudent pour Phantom 4 RTK : vitesse 7 m/s, autonomie utile 20 min.',
  },
  {
    id: 'mission-m350-p1-35',
    group: 'Plateformes lourdes',
    label: 'DJI Matrice 350 RTK + Zenmuse P1 35 mm',
    cameraPresetId: 'dji-zenmuse-p1-35',
    speed: 9,
    batteryMinutes: 35,
    note: 'Profil grande emprise avec P1 35 mm. Ajuste selon charge utile, vent et marge retour.',
  },
  {
    id: 'mission-m300-p1-35',
    group: 'Plateformes lourdes',
    label: 'DJI Matrice 300 RTK + Zenmuse P1 35 mm',
    cameraPresetId: 'dji-zenmuse-p1-35',
    speed: 9,
    batteryMinutes: 32,
    note: 'Profil grande emprise avec P1 35 mm. Ajuste selon charge utile, batteries et conditions.',
  },
  {
    id: 'mission-m350-l2',
    group: 'LiDAR / RGB',
    label: 'DJI Matrice 350 RTK + Zenmuse L2 RGB',
    cameraPresetId: 'dji-zenmuse-l2-rgb',
    speed: 8,
    batteryMinutes: 32,
    note: 'Profil pour la caméra RGB du L2. Le calcul estime la partie photo, pas la performance LiDAR.',
  },
  {
    id: 'mission-matrice-30',
    group: 'Inspection',
    label: 'DJI Matrice 30 / 30T',
    cameraPresetId: 'dji-matrice-30-wide',
    speed: 6,
    batteryMinutes: 25,
    note: 'Profil inspection. Utile pour ordre de grandeur, moins adapté à une photogrammétrie topo fine.',
  },
];

export const djiMissionDronePresetGroups = [
  'Photogrammétrie compacte',
  'Agriculture / multispectral',
  'Photogrammétrie historique',
  'Plateformes lourdes',
  'LiDAR / RGB',
  'Inspection',
];
