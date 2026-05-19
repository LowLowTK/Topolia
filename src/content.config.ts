import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articles = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    date: z.date(),
    category: z.enum([
      'tutoriels',
      'astuces',
      'scanner-statique',
      'scanner-dynamique',
      'drone',
      'comparatifs',
      'cas-concrets',
    ]),
    tags: z.array(z.string()).default([]),
    author: z.string().default('loic'),
    heroImage: z.string(),
    heroImageAlt: z.string(),
    excerpt: z.string(),
    isPremium: z.boolean().default(false),
    isPublished: z.boolean().default(true),
  }),
});

const glossaire = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/glossaire' }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    difficulty: z.enum(['debutant', 'intermediaire', 'expert']),
    relatedArticles: z.array(z.string()).default([]),
    relatedChantiers: z.array(z.string()).default([]),
    excerpt: z.string(),
    isPublished: z.boolean().default(true),
  }),
});

const chantiers = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/chantiers' }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    surface: z.string().optional(),
    materiel: z.array(z.string()).default([]),
    probleme: z.string(),
    lecon: z.string(),
    tags: z.array(z.string()).default([]),
    isPublished: z.boolean().default(true),
  }),
});

const minuteTopo = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/minute-topo' }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    tags: z.array(z.string()).default([]),
    excerpt: z.string(),
    isPublished: z.boolean().default(true),
  }),
});

export const collections = {
  articles,
  glossaire,
  chantiers,
  'minute-topo': minuteTopo,
};
