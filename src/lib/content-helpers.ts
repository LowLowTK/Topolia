/** Trie un tableau d'entries par date décroissante (plus récent en premier). */
export function sortByDateDesc<T extends { data: { date: Date } }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** Garde uniquement les entries publiées. */
export function publishedOnly<T extends { data: { isPublished: boolean } }>(entries: T[]): T[] {
  return entries.filter((e) => e.data.isPublished);
}

/** Formate une date en français long : "3 mai 2026". */
export function formatDateFR(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/** Formate une date en français court : "03/05/2026". */
export function formatDateMono(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR').format(date);
}

/** Groupe les entries par première lettre du titre (pour l'index glossaire). */
export function groupByFirstLetter<T extends { data: { title: string } }>(
  entries: T[],
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  const sorted = [...entries].sort((a, b) => a.data.title.localeCompare(b.data.title, 'fr'));
  for (const entry of sorted) {
    const letter = entry.data.title.charAt(0).toUpperCase();
    const key = /[A-Z]/.test(letter) ? letter : '#';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(entry);
  }
  return new Map([...map.entries()].sort(([a], [b]) => a.localeCompare(b, 'fr')));
}

/** Liste des catégories articles avec leur label affiché. */
export const ARTICLE_CATEGORIES = [
  { slug: 'tutoriels', label: 'Tutoriels' },
  { slug: 'astuces', label: 'Astuces' },
  { slug: 'scanner-statique', label: 'Scanner statique' },
  { slug: 'scanner-dynamique', label: 'Scanner dynamique' },
  { slug: 'drone', label: 'Drone & LiDAR' },
  { slug: 'comparatifs', label: 'Comparatifs' },
  { slug: 'cas-concrets', label: 'Cas concrets' },
] as const;

export type ArticleCategorySlug = (typeof ARTICLE_CATEGORIES)[number]['slug'];

/** Calcule un temps de lecture approximatif (200 mots/min). */
export function readingTimeFromBody(body: string): number {
  const cleaned = body
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const words = cleaned ? cleaned.split(' ').length : 0;
  return Math.max(1, Math.ceil(words / 200));
}
