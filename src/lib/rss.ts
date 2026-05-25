// src/lib/rss.ts
import Parser from 'rss-parser';

export interface RssItem {
  title: string;
  link: string;
  pubDate: string;
  excerpt: string;
  sourceName: string;
  sourceLang: string;
}

interface RssSource {
  name: string;
  url: string;
  lang: string;
}

export const RSS_SOURCES: RssSource[] = [
  {
    name: 'Reddit r/Surveying',
    url: 'https://www.reddit.com/r/Surveying/.rss',
    lang: 'EN',
  },
  {
    name: 'Reddit r/photogrammetry',
    url: 'https://www.reddit.com/r/photogrammetry/.rss',
    lang: 'EN',
  },
  {
    name: 'Reddit r/drones',
    url: 'https://www.reddit.com/r/drones/.rss',
    lang: 'EN',
  },
  {
    name: 'Reddit r/lidar',
    url: 'https://www.reddit.com/r/lidar/.rss',
    lang: 'EN',
  },
  {
    name: 'Google News — LiDAR scanner',
    url: 'https://news.google.com/rss/search?q=lidar+scanner&hl=en',
    lang: 'EN',
  },
  {
    name: 'Google News — drone survey',
    url: 'https://news.google.com/rss/search?q=drone+survey&hl=en',
    lang: 'EN',
  },
  {
    name: 'Google News — photogrammetry',
    url: 'https://news.google.com/rss/search?q=photogrammetry&hl=en',
    lang: 'EN',
  },
];

const parser = new Parser({ timeout: 5000 });

/** Fetch un flux RSS et retourne ses items. Retourne [] si le flux échoue. */
async function fetchSource(source: RssSource): Promise<RssItem[]> {
  try {
    const feed = await parser.parseURL(source.url);
    return (feed.items ?? []).slice(0, 15).map((item) => ({
      title: item.title ?? '(sans titre)',
      link: item.link ?? '',
      pubDate: item.pubDate ?? item.isoDate ?? '',
      excerpt: item.contentSnippet ?? item.summary ?? '',
      sourceName: source.name,
      sourceLang: source.lang,
    }));
  } catch {
    // Source indisponible — on ignore silencieusement
    return [];
  }
}

/** Fetch toutes les sources en parallèle et retourne les items triés par date. */
export async function fetchAllFeeds(): Promise<RssItem[]> {
  const results = await Promise.all(RSS_SOURCES.map(fetchSource));
  const all = results.flat();

  // Trier du plus récent au plus ancien
  all.sort((a, b) => {
    const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
    const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
    return dateB - dateA;
  });

  return all;
}
