/**
 * Génère un SVG 1200×630 pour les images Open Graph.
 * Réutilise l'identité visuelle de HeroPlaceholder (point cloud + Pulse marks).
 */

export interface OGTemplateOptions {
  title: string;
  category?: string;
  palette?: 'default' | 'warm';
}

const accentDefault = { from: '#2D5BFF', to: '#06B6D4' };
const accentWarm = { from: '#F59E0B', to: '#FBBF24' };

// Point cloud — positions fixées pour SSG reproductible
const DOTS = [
  { x: 100, y: 200, r: 3, o: 0.5 },
  { x: 180, y: 320, r: 4, o: 0.7 },
  { x: 260, y: 240, r: 3, o: 0.6 },
  { x: 340, y: 380, r: 5, o: 0.8 },
  { x: 420, y: 180, r: 3, o: 0.5 },
  { x: 500, y: 300, r: 4, o: 0.7 },
  { x: 580, y: 220, r: 3, o: 0.6 },
  { x: 660, y: 360, r: 4, o: 0.7 },
  { x: 740, y: 260, r: 3, o: 0.5 },
  { x: 820, y: 180, r: 5, o: 0.8 },
  { x: 900, y: 320, r: 3, o: 0.6 },
  { x: 980, y: 240, r: 4, o: 0.7 },
  { x: 1060, y: 380, r: 3, o: 0.5 },
  { x: 1100, y: 200, r: 3, o: 0.6 },
  { x: 150, y: 450, r: 3, o: 0.5 },
  { x: 280, y: 480, r: 4, o: 0.6 },
  { x: 420, y: 470, r: 3, o: 0.5 },
  { x: 560, y: 440, r: 3, o: 0.55 },
  { x: 700, y: 480, r: 4, o: 0.65 },
  { x: 840, y: 460, r: 3, o: 0.5 },
  { x: 980, y: 470, r: 3, o: 0.55 },
  { x: 1080, y: 440, r: 3, o: 0.5 },
];

export function generateOGSvg({ title, category, palette = 'default' }: OGTemplateOptions): string {
  const accent = palette === 'warm' ? accentWarm : accentDefault;
  const safeTitle = escapeXml(title);
  const safeCategory = escapeXml((category ?? 'Topolia').toUpperCase());

  // Word-wrap manuel sur 3 lignes max, 28 chars par ligne env.
  const lines = wrapText(safeTitle, 28).slice(0, 3);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#1E293B"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${accent.from}"/>
      <stop offset="100%" stop-color="${accent.to}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  ${DOTS.map(
    (d) => `<circle cx="${d.x}" cy="${d.y}" r="${d.r}" fill="url(#accent)" opacity="${d.o}"/>`,
  ).join('\n  ')}

  <!-- Mark Pulse principal à droite -->
  <g transform="translate(1010, 220)" opacity="0.35">
    <circle cx="0" cy="0" r="120" fill="none" stroke="url(#accent)" stroke-width="3"/>
    <circle cx="0" cy="0" r="80" fill="none" stroke="url(#accent)" stroke-width="4"/>
    <circle cx="0" cy="0" r="48" fill="none" stroke="url(#accent)" stroke-width="5"/>
    <circle cx="0" cy="0" r="18" fill="url(#accent)"/>
  </g>

  <!-- Wordmark topolia. -->
  <g transform="translate(70, 70)">
    <g transform="translate(0, -12) scale(0.4)">
      <circle cx="50" cy="50" r="36" fill="none" stroke="url(#accent)" stroke-width="3" opacity="0.25"/>
      <circle cx="50" cy="50" r="26" fill="none" stroke="url(#accent)" stroke-width="3.5" opacity="0.5"/>
      <circle cx="50" cy="50" r="16" fill="none" stroke="url(#accent)" stroke-width="4" opacity="0.85"/>
      <circle cx="50" cy="50" r="6" fill="url(#accent)"/>
    </g>
    <text x="55" y="32" font-family="Onest, sans-serif" font-size="28" font-weight="700" fill="#FCFCFD">topolia.</text>
  </g>

  <!-- Catégorie -->
  <text x="70" y="380" font-family="JetBrains Mono, monospace" font-size="22" font-weight="500" fill="${accent.from}" letter-spacing="2">${safeCategory}</text>

  <!-- Titre -->
  ${lines
    .map(
      (line, i) =>
        `<text x="70" y="${445 + i * 70}" font-family="Onest, sans-serif" font-size="60" font-weight="800" fill="#FCFCFD" letter-spacing="-1.5">${line}</text>`,
    )
    .join('\n  ')}
</svg>`;
}

function escapeXml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length <= maxChars) {
      current = (current + ' ' + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}
