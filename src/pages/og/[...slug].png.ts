import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import sharp from 'sharp';
import { generateOGSvg } from '../../lib/og-template';
import { ARTICLE_CATEGORIES } from '../../lib/content-helpers';

interface OGEntry {
  slug: string;
  title: string;
  category: string;
  palette: 'default' | 'warm';
}

export async function getStaticPaths() {
  const articles = await getCollection('articles');
  const glossaire = await getCollection('glossaire');
  const chantiers = await getCollection('chantiers');
  const minutes = await getCollection('minute-topo');

  const entries: OGEntry[] = [
    ...articles.map((a) => ({
      slug: `articles/${a.id}`,
      title: a.data.title,
      category: ARTICLE_CATEGORIES.find((c) => c.slug === a.data.category)?.label ?? 'Topolia',
      palette: 'default' as const,
    })),
    ...glossaire.map((g) => ({
      slug: `glossaire/${g.id}`,
      title: g.data.title,
      category: 'Glossaire',
      palette: 'default' as const,
    })),
    ...chantiers.map((c) => ({
      slug: `chantiers/${c.id}`,
      title: c.data.title,
      category: 'Retour de chantier',
      palette: 'warm' as const,
    })),
    ...minutes.map((m) => ({
      slug: `minute-topo/${m.id}`,
      title: m.data.title,
      category: 'Minute topo',
      palette: 'default' as const,
    })),
    {
      slug: 'home',
      title: 'La topo, comme tu la fais vraiment.',
      category: 'Topolia',
      palette: 'default' as const,
    },
    {
      slug: 'articles-index',
      title: 'Tous les articles',
      category: 'Topolia',
      palette: 'default' as const,
    },
    {
      slug: 'glossaire-index',
      title: 'Glossaire topo',
      category: 'Topolia',
      palette: 'default' as const,
    },
    {
      slug: 'chantiers-index',
      title: 'Chantiers anonymisés',
      category: 'Topolia',
      palette: 'warm' as const,
    },
    {
      slug: 'minute-topo-index',
      title: 'La minute topo',
      category: 'Topolia',
      palette: 'default' as const,
    },
    {
      slug: 'a-propos',
      title: 'À propos de Topolia',
      category: 'Topolia',
      palette: 'default' as const,
    },
    {
      slug: 'newsletter',
      title: 'Newsletter Topolia',
      category: 'Topolia',
      palette: 'default' as const,
    },
  ];

  return entries.map((entry) => ({
    params: { slug: entry.slug },
    props: entry,
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { title, category, palette } = props as OGEntry;
  const svg = generateOGSvg({ title, category, palette });
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
