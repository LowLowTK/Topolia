import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { publishedOnly } from '../lib/content-helpers';

export async function GET(context: APIContext) {
  const articles = publishedOnly(await getCollection('articles'));
  const minutes = publishedOnly(await getCollection('minute-topo'));

  const items = [
    ...articles.map((entry) => ({
      title: entry.data.title,
      description: entry.data.excerpt,
      pubDate: entry.data.date,
      link: `/articles/${entry.id}/`,
      categories: entry.data.tags,
    })),
    ...minutes.map((entry) => ({
      title: `Minute topo — ${entry.data.title}`,
      description: entry.data.excerpt,
      pubDate: entry.data.date,
      link: `/minute-topo/${entry.id}/`,
      categories: entry.data.tags,
    })),
  ].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return rss({
    title: 'Topolia — Topographie moderne',
    description:
      'LiDAR, drone, photogrammétrie : tutoriels, comparatifs et retours terrain par un géomètre-topographe.',
    site: context.site ?? 'https://topolia.fr',
    items,
    customData: '<language>fr-FR</language>',
  });
}
