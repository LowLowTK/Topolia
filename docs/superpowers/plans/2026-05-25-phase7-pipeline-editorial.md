# Phase 7 — Pipeline éditorial IA assisté Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construire une page `/admin/studio` qui agrège des flux RSS (veille), permet de sauvegarder des sujets d'articles dans Supabase, et génère des prompts prêts à coller dans Claude.ai pour rédiger des brouillons MDX — sans aucune API payante.

**Architecture:** Page Astro SSR protégée par Clerk. Les flux RSS sont fetchés côté serveur à chaque chargement. Les sujets sauvegardés sont stockés dans Supabase (table `article_ideas`) via des routes API Astro. Le "prompt magique" est généré côté client en JavaScript pur et copié dans le presse-papier.

**Tech Stack:** Astro 6 SSR, TypeScript strict, Clerk (auth existant), Supabase (client existant dans `src/lib/supabase.ts`), `rss-parser` (npm), CSS variables (convention projet)

---

## Fichiers créés / modifiés

| Fichier | Action | Rôle |
|---|---|---|
| `src/middleware.ts` | Modifier | Ajouter protection `/admin/studio` |
| `src/lib/rss.ts` | Créer | Fetch + parsing des flux RSS |
| `src/lib/article-ideas.ts` | Créer | CRUD Supabase pour `article_ideas` |
| `src/pages/api/article-ideas/index.ts` | Créer | GET liste + POST création |
| `src/pages/api/article-ideas/[id].ts` | Créer | PATCH statut + DELETE |
| `src/pages/admin/studio.astro` | Créer | Page principale (onglets + modale prompt inline) |
| `src/components/studio/RssItem.astro` | Créer | Carte d'un article RSS |
| `src/components/studio/SujetCard.astro` | Créer | Carte d'un sujet sauvegardé |

---

## Task 1 : Table Supabase `article_ideas`

**Files:**
- Aucun fichier code — action dans le dashboard Supabase

- [ ] **Step 1 : Ouvrir Supabase SQL Editor**

Aller sur https://app.supabase.com → ton projet → SQL Editor → New query.

- [ ] **Step 2 : Créer la table**

Coller et exécuter ce SQL :

```sql
create table article_ideas (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  source_url text not null,
  source_lang text default 'EN',
  source_name text,
  excerpt text,
  status text default 'pending' check (status in ('pending','approved','drafting','draft','published','ignored')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Activer Row Level Security
alter table article_ideas enable row level security;

-- Seul le service role peut tout faire (pas d'accès public)
create policy "service_role_full_access" on article_ideas
  using (true)
  with check (true);
```

- [ ] **Step 3 : Vérifier**

Dans Supabase → Table Editor → tu dois voir la table `article_ideas` avec 9 colonnes.

---

## Task 2 : Installer `rss-parser`

**Files:**
- `package.json` (modifié automatiquement par npm)

- [ ] **Step 1 : Installer le package**

```bash
npm install rss-parser
```

- [ ] **Step 2 : Vérifier l'installation**

```bash
grep '"rss-parser"' package.json
```

Résultat attendu : une ligne avec `"rss-parser": "^3.x.x"`

- [ ] **Step 3 : Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install rss-parser for Phase 7 veille"
```

---

## Task 3 : Créer `src/lib/rss.ts`

**Files:**
- Create: `src/lib/rss.ts`

- [ ] **Step 1 : Créer le fichier**

```typescript
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
```

- [ ] **Step 2 : Vérifier la compilation TypeScript**

```bash
npm run build 2>&1 | head -30
```

Résultat attendu : build qui se termine sans erreur TypeScript sur `rss.ts`.

- [ ] **Step 3 : Commit**

```bash
git add src/lib/rss.ts
git commit -m "feat: add RSS fetching lib for Phase 7 veille"
```

---

## Task 4 : Créer `src/lib/article-ideas.ts`

**Files:**
- Create: `src/lib/article-ideas.ts`

- [ ] **Step 1 : Créer le fichier**

```typescript
// src/lib/article-ideas.ts
import { supabaseService } from './supabase';

export type ArticleStatus =
  | 'pending'
  | 'approved'
  | 'drafting'
  | 'draft'
  | 'published'
  | 'ignored';

export interface ArticleIdea {
  id: string;
  title: string;
  source_url: string;
  source_lang: string;
  source_name: string | null;
  excerpt: string | null;
  status: ArticleStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateArticleIdeaInput {
  title: string;
  source_url: string;
  source_lang?: string;
  source_name?: string;
  excerpt?: string;
}

/** Récupérer tous les sujets, du plus récent au plus ancien. */
export async function listArticleIdeas(): Promise<ArticleIdea[]> {
  const { data, error } = await supabaseService()
    .from('article_ideas')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Supabase listArticleIdeas : ${error.message}`);
  return data as ArticleIdea[];
}

/** Créer un nouveau sujet. */
export async function createArticleIdea(input: CreateArticleIdeaInput): Promise<ArticleIdea> {
  const { data, error } = await supabaseService()
    .from('article_ideas')
    .insert([input])
    .select()
    .single();

  if (error) throw new Error(`Supabase createArticleIdea : ${error.message}`);
  return data as ArticleIdea;
}

/** Mettre à jour le statut d'un sujet. */
export async function updateArticleStatus(
  id: string,
  status: ArticleStatus
): Promise<ArticleIdea> {
  const { data, error } = await supabaseService()
    .from('article_ideas')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Supabase updateArticleStatus : ${error.message}`);
  return data as ArticleIdea;
}

/** Supprimer définitivement un sujet. */
export async function deleteArticleIdea(id: string): Promise<void> {
  const { error } = await supabaseService().from('article_ideas').delete().eq('id', id);

  if (error) throw new Error(`Supabase deleteArticleIdea : ${error.message}`);
}
```

- [ ] **Step 2 : Vérifier la compilation**

```bash
npm run build 2>&1 | head -30
```

Résultat attendu : pas d'erreur TypeScript sur `article-ideas.ts`.

- [ ] **Step 3 : Commit**

```bash
git add src/lib/article-ideas.ts
git commit -m "feat: add article-ideas Supabase CRUD lib"
```

---

## Task 5 : Routes API article-ideas

**Files:**
- Create: `src/pages/api/article-ideas/index.ts`
- Create: `src/pages/api/article-ideas/[id].ts`

- [ ] **Step 1 : Créer le dossier et la route principale**

```typescript
// src/pages/api/article-ideas/index.ts
import type { APIRoute } from 'astro';
import { createArticleIdea, listArticleIdeas } from '../../../lib/article-ideas';

export const GET: APIRoute = async ({ locals }) => {
  const { userId } = locals.auth();
  if (!userId) {
    return new Response(JSON.stringify({ ok: false, message: 'Non autorisé.' }), { status: 401 });
  }

  try {
    const ideas = await listArticleIdeas();
    return new Response(JSON.stringify({ ok: true, data: ideas }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, message: String(err) }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  const { userId } = locals.auth();
  if (!userId) {
    return new Response(JSON.stringify({ ok: false, message: 'Non autorisé.' }), { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, source_url, source_lang, source_name, excerpt } = body;

    if (!title || !source_url) {
      return new Response(
        JSON.stringify({ ok: false, message: 'title et source_url sont requis.' }),
        { status: 400 }
      );
    }

    const idea = await createArticleIdea({ title, source_url, source_lang, source_name, excerpt });
    return new Response(JSON.stringify({ ok: true, data: idea }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, message: String(err) }), { status: 500 });
  }
};
```

- [ ] **Step 2 : Créer la route par ID**

```typescript
// src/pages/api/article-ideas/[id].ts
import type { APIRoute } from 'astro';
import { deleteArticleIdea, updateArticleStatus, type ArticleStatus } from '../../../lib/article-ideas';

const VALID_STATUSES: ArticleStatus[] = [
  'pending',
  'approved',
  'drafting',
  'draft',
  'published',
  'ignored',
];

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const { userId } = locals.auth();
  if (!userId) {
    return new Response(JSON.stringify({ ok: false, message: 'Non autorisé.' }), { status: 401 });
  }

  const id = params.id;
  if (!id) {
    return new Response(JSON.stringify({ ok: false, message: 'ID manquant.' }), { status: 400 });
  }

  try {
    const body = await request.json();
    const { status } = body;

    if (!VALID_STATUSES.includes(status)) {
      return new Response(
        JSON.stringify({ ok: false, message: `Statut invalide : ${status}` }),
        { status: 400 }
      );
    }

    const updated = await updateArticleStatus(id, status);
    return new Response(JSON.stringify({ ok: true, data: updated }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, message: String(err) }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const { userId } = locals.auth();
  if (!userId) {
    return new Response(JSON.stringify({ ok: false, message: 'Non autorisé.' }), { status: 401 });
  }

  const id = params.id;
  if (!id) {
    return new Response(JSON.stringify({ ok: false, message: 'ID manquant.' }), { status: 400 });
  }

  try {
    await deleteArticleIdea(id);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, message: String(err) }), { status: 500 });
  }
};
```

- [ ] **Step 3 : Vérifier la compilation**

```bash
npm run build 2>&1 | head -30
```

Résultat attendu : pas d'erreur sur les nouvelles routes.

- [ ] **Step 4 : Commit**

```bash
git add src/pages/api/article-ideas/
git commit -m "feat: add article-ideas API routes (GET, POST, PATCH, DELETE)"
```

---

## Task 6 : Étendre le middleware Clerk pour `/admin/studio`

**Files:**
- Modify: `src/middleware.ts`

- [ ] **Step 1 : Modifier le middleware**

Remplacer le contenu de `src/middleware.ts` par :

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/astro/server';

const isProtectedApi = createRouteMatcher(['/api/comments', '/api/article-ideas(.*)']);
const isProtectedPage = createRouteMatcher(['/admin/studio(.*)']);

export const onRequest = clerkMiddleware((auth, context) => {
  // Routes API protégées → 401 JSON si non connecté
  if (isProtectedApi(context.request)) {
    const { userId } = auth();
    if (!userId) {
      return new Response(JSON.stringify({ ok: false, message: 'Connexion requise.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Pages admin protégées → redirect vers /login si non connecté
  if (isProtectedPage(context.request)) {
    const { userId } = auth();
    if (!userId) {
      return Response.redirect(new URL('/login', context.request.url));
    }
  }
});
```

- [ ] **Step 2 : Vérifier la compilation**

```bash
npm run build 2>&1 | head -30
```

Résultat attendu : build OK, pas d'erreur TypeScript.

- [ ] **Step 3 : Commit**

```bash
git add src/middleware.ts
git commit -m "feat: protect /admin/studio and /api/article-ideas with Clerk"
```

---

## Task 7 : Composant `RssItem.astro`

**Files:**
- Create: `src/components/studio/RssItem.astro`

- [ ] **Step 1 : Créer le composant**

```astro
---
// src/components/studio/RssItem.astro
export interface Props {
  title: string;
  link: string;
  pubDate: string;
  excerpt: string;
  sourceName: string;
  sourceLang: string;
}

const { title, link, pubDate, excerpt, sourceName, sourceLang } = Astro.props;

const LANG_FLAGS: Record<string, string> = {
  EN: '🇬🇧',
  FR: '🇫🇷',
  DE: '🇩🇪',
  JP: '🇯🇵',
  SE: '🇸🇪',
};

const flag = LANG_FLAGS[sourceLang] ?? '🌐';

const dateFormatted = pubDate
  ? new Date(pubDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  : '';
---

<article class="rss-item">
  <div class="rss-item__meta">
    <span class="rss-item__flag" title={sourceLang}>{flag}</span>
    <span class="rss-item__source">{sourceName}</span>
    {dateFormatted && <span class="rss-item__date">{dateFormatted}</span>}
  </div>

  <h3 class="rss-item__title">
    <a href={link} target="_blank" rel="noopener noreferrer">{title}</a>
  </h3>

  {excerpt && <p class="rss-item__excerpt">{excerpt.slice(0, 180)}{excerpt.length > 180 ? '…' : ''}</p>}

  <div class="rss-item__actions">
    <button
      class="rss-item__btn rss-item__btn--save"
      data-title={title}
      data-url={link}
      data-lang={sourceLang}
      data-source={sourceName}
      data-excerpt={excerpt}
    >
      💾 Sauvegarder
    </button>
    <button
      class="rss-item__btn rss-item__btn--prompt"
      data-title={title}
      data-url={link}
    >
      ✨ Préparer le prompt
    </button>
  </div>
</article>

<style>
  .rss-item {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-4);
    background: var(--color-surface);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .rss-item__meta {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .rss-item__title {
    font-size: var(--text-base);
    margin: 0;
    line-height: 1.4;
  }

  .rss-item__title a {
    color: var(--color-text);
    text-decoration: none;
  }

  .rss-item__title a:hover {
    color: var(--color-primary);
    text-decoration: underline;
  }

  .rss-item__excerpt {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    margin: 0;
    line-height: 1.5;
  }

  .rss-item__actions {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
    margin-top: var(--space-1);
  }

  .rss-item__btn {
    border: none;
    border-radius: var(--radius-sm);
    padding: var(--space-1) var(--space-3);
    font-size: var(--text-sm);
    cursor: pointer;
    font-weight: 600;
  }

  .rss-item__btn--save {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    color: var(--color-text);
  }

  .rss-item__btn--save:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  .rss-item__btn--prompt {
    background: var(--color-primary);
    color: white;
  }

  .rss-item__btn--prompt:hover {
    opacity: 0.9;
  }
</style>
```

- [ ] **Step 2 : Commit**

```bash
git add src/components/studio/RssItem.astro
git commit -m "feat: add RssItem card component"
```

---

## Task 8 : Composant `SujetCard.astro`

**Files:**
- Create: `src/components/studio/SujetCard.astro`

- [ ] **Step 1 : Créer le composant**

```astro
---
// src/components/studio/SujetCard.astro
import type { ArticleIdea, ArticleStatus } from '../../lib/article-ideas';

export interface Props {
  idea: ArticleIdea;
}

const { idea } = Astro.props;

const STATUS_LABELS: Record<ArticleStatus, string> = {
  pending: 'En attente',
  approved: 'Approuvé',
  drafting: 'En rédaction',
  draft: 'Brouillon prêt',
  published: 'Publié',
  ignored: 'Ignoré',
};

const STATUS_COLORS: Record<ArticleStatus, string> = {
  pending: 'grey',
  approved: 'blue',
  drafting: 'orange',
  draft: 'green-light',
  published: 'green',
  ignored: 'red',
};

const LANG_FLAGS: Record<string, string> = {
  EN: '🇬🇧', FR: '🇫🇷', DE: '🇩🇪', JP: '🇯🇵', SE: '🇸🇪',
};

const ALL_STATUSES: ArticleStatus[] = ['pending', 'approved', 'drafting', 'draft', 'published', 'ignored'];

const flag = LANG_FLAGS[idea.source_lang] ?? '🌐';
const dateFormatted = new Date(idea.created_at).toLocaleDateString('fr-FR', {
  day: 'numeric', month: 'short', year: 'numeric',
});
---

<article class="sujet-card" data-id={idea.id}>
  <div class="sujet-card__meta">
    <span>{flag}</span>
    {idea.source_name && <span class="sujet-card__source">{idea.source_name}</span>}
    <span class="sujet-card__date">{dateFormatted}</span>
    <span class={`sujet-card__status sujet-card__status--${STATUS_COLORS[idea.status]}`}>
      {STATUS_LABELS[idea.status]}
    </span>
  </div>

  <h3 class="sujet-card__title">{idea.title}</h3>

  {idea.excerpt && (
    <p class="sujet-card__excerpt">
      {idea.excerpt.slice(0, 160)}{idea.excerpt.length > 160 ? '…' : ''}
    </p>
  )}

  <div class="sujet-card__actions">
    <select class="sujet-card__select status-select" data-id={idea.id} value={idea.status}>
      {ALL_STATUSES.map((s) => (
        <option value={s} selected={s === idea.status}>{STATUS_LABELS[s]}</option>
      ))}
    </select>

    <a href={idea.source_url} target="_blank" rel="noopener" class="sujet-card__btn sujet-card__btn--link">
      🔗 Source
    </a>

    <button
      class="sujet-card__btn sujet-card__btn--prompt"
      data-title={idea.title}
      data-url={idea.source_url}
    >
      ✨ Prompt
    </button>

    <button
      class="sujet-card__btn sujet-card__btn--delete delete-btn"
      data-id={idea.id}
      aria-label="Supprimer ce sujet"
    >
      🗑️
    </button>
  </div>
</article>

<style>
  .sujet-card {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-4);
    background: var(--color-surface);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .sujet-card__meta {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    flex-wrap: wrap;
  }

  .sujet-card__title {
    font-size: var(--text-base);
    margin: 0;
  }

  .sujet-card__excerpt {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    margin: 0;
  }

  .sujet-card__status {
    padding: 2px 8px;
    border-radius: var(--radius-full);
    font-weight: 600;
    font-size: var(--text-xs);
  }

  .sujet-card__status--grey    { background: #e5e5e5; color: #555; }
  .sujet-card__status--blue    { background: #dbeafe; color: #1d4ed8; }
  .sujet-card__status--orange  { background: #ffedd5; color: #c2410c; }
  .sujet-card__status--green-light { background: #dcfce7; color: #15803d; }
  .sujet-card__status--green   { background: #bbf7d0; color: #166534; }
  .sujet-card__status--red     { background: #fee2e2; color: #b91c1c; }

  .sujet-card__actions {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
    align-items: center;
    margin-top: var(--space-1);
  }

  .sujet-card__select {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--space-1) var(--space-2);
    font-size: var(--text-sm);
    background: var(--color-surface);
    color: var(--color-text);
    cursor: pointer;
  }

  .sujet-card__btn {
    border: none;
    border-radius: var(--radius-sm);
    padding: var(--space-1) var(--space-3);
    font-size: var(--text-sm);
    cursor: pointer;
    font-weight: 600;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
  }

  .sujet-card__btn--link {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    color: var(--color-text);
  }

  .sujet-card__btn--prompt {
    background: var(--color-primary);
    color: white;
  }

  .sujet-card__btn--delete {
    background: none;
    border: 1px solid var(--color-border);
    color: var(--color-text-muted);
    margin-left: auto;
  }

  .sujet-card__btn--delete:hover {
    border-color: #b91c1c;
    color: #b91c1c;
  }
</style>
```

- [ ] **Step 2 : Commit**

```bash
git add src/components/studio/SujetCard.astro
git commit -m "feat: add SujetCard component with status management"
```

---

## Task 9 : Page principale `src/pages/admin/studio.astro`

**Files:**
- Create: `src/pages/admin/studio.astro`

- [ ] **Step 1 : Créer le dossier admin et la page**

```astro
---
// src/pages/admin/studio.astro
import BaseLayout from '../../layouts/BaseLayout.astro';
import RssItem from '../../components/studio/RssItem.astro';
import SujetCard from '../../components/studio/SujetCard.astro';
import { fetchAllFeeds } from '../../lib/rss';
import { listArticleIdeas } from '../../lib/article-ideas';

// Récupérer les flux RSS et les sujets sauvegardés en parallèle
const [rssItems, ideas] = await Promise.all([
  fetchAllFeeds(),
  listArticleIdeas(),
]);
---

<BaseLayout title="Studio éditorial — Topolia" description="Interface de veille et rédaction">
  <div class="studio">
    <header class="studio__header">
      <h1 class="studio__title">📡 Studio éditorial</h1>
      <p class="studio__subtitle">Veille mondiale + générateur de brouillons</p>
    </header>

    <!-- Navigation onglets -->
    <nav class="studio__tabs" role="tablist">
      <button
        class="studio__tab studio__tab--active"
        role="tab"
        aria-selected="true"
        aria-controls="tab-veille"
        id="btn-veille"
      >
        📡 Veille ({rssItems.length} articles)
      </button>
      <button
        class="studio__tab"
        role="tab"
        aria-selected="false"
        aria-controls="tab-sujets"
        id="btn-sujets"
      >
        📋 Mes sujets ({ideas.length})
      </button>
    </nav>

    <!-- Onglet Veille -->
    <div id="tab-veille" role="tabpanel" aria-labelledby="btn-veille" class="studio__panel">
      {rssItems.length === 0 ? (
        <p class="studio__empty">Aucun article récupéré. Vérifie ta connexion et recharge la page.</p>
      ) : (
        <div class="studio__grid">
          {rssItems.map((item) => (
            <RssItem
              title={item.title}
              link={item.link}
              pubDate={item.pubDate}
              excerpt={item.excerpt}
              sourceName={item.sourceName}
              sourceLang={item.sourceLang}
            />
          ))}
        </div>
      )}
    </div>

    <!-- Onglet Mes sujets -->
    <div id="tab-sujets" role="tabpanel" aria-labelledby="btn-sujets" class="studio__panel studio__panel--hidden">
      {ideas.length === 0 ? (
        <p class="studio__empty">Aucun sujet sauvegardé. Va dans l'onglet Veille pour en ajouter.</p>
      ) : (
        <div class="studio__grid" id="sujets-grid">
          {ideas.map((idea) => (
            <SujetCard idea={idea} />
          ))}
        </div>
      )}
    </div>
  </div>

  <!-- Modale prompt magique (vide, remplie dynamiquement par JS) -->
  <div class="prompt-modal" id="prompt-modal" role="dialog" aria-modal="true" aria-label="Prompt magique" hidden>
    <div class="prompt-modal__backdrop"></div>
    <div class="prompt-modal__box">
      <button class="prompt-modal__close" aria-label="Fermer">✕</button>
      <h2 class="prompt-modal__title">Prompt magique</h2>
      <p class="prompt-modal__subtitle" id="modal-subtitle"></p>
      <div class="prompt-modal__steps" id="modal-steps"></div>
    </div>
  </div>
</BaseLayout>

<script>
  // ── Tabs ──────────────────────────────────────────────────────────────
  const btnVeille = document.getElementById('btn-veille')!;
  const btnSujets = document.getElementById('btn-sujets')!;
  const tabVeille = document.getElementById('tab-veille')!;
  const tabSujets = document.getElementById('tab-sujets')!;

  function activateTab(tab: 'veille' | 'sujets') {
    const isVeille = tab === 'veille';
    btnVeille.classList.toggle('studio__tab--active', isVeille);
    btnSujets.classList.toggle('studio__tab--active', !isVeille);
    btnVeille.setAttribute('aria-selected', String(isVeille));
    btnSujets.setAttribute('aria-selected', String(!isVeille));
    tabVeille.classList.toggle('studio__panel--hidden', !isVeille);
    tabSujets.classList.toggle('studio__panel--hidden', isVeille);
  }

  btnVeille.addEventListener('click', () => activateTab('veille'));
  btnSujets.addEventListener('click', () => activateTab('sujets'));

  // ── Sauvegarder un article RSS ─────────────────────────────────────────
  document.querySelectorAll<HTMLButtonElement>('.rss-item__btn--save').forEach((btn) => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.textContent = '⏳ Sauvegarde…';

      const res = await fetch('/api/article-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: btn.dataset.title,
          source_url: btn.dataset.url,
          source_lang: btn.dataset.lang,
          source_name: btn.dataset.source,
          excerpt: btn.dataset.excerpt,
        }),
      });

      if (res.ok) {
        btn.textContent = '✅ Sauvegardé !';
      } else {
        btn.textContent = '❌ Erreur';
        btn.disabled = false;
      }
    });
  });

  // ── Prompt magique ─────────────────────────────────────────────────────
  function buildPromptEtape1(title: string, url: string): string {
    return `Tu es un consultant éditorial pour Topolia.fr, site français de référence sur la topographie moderne (scanner laser, LiDAR drone, photogrammétrie).

Voici un article source :
URL : ${url}
Titre original : ${title}

Fais-moi :
1. Un résumé en français en 5-6 phrases
2. Une évaluation : est-ce pertinent pour le public Topolia (topographes, géomètres, passionnés de LiDAR) ? Oui/Non/Partiel
3. Si pertinent, propose un angle d'article en français — ce qui n'existe pas encore en français, ce qui apporte une valeur ajoutée terrain

Sois direct et concis.`;
  }

  function buildPromptEtape2(title: string, url: string): string {
    return `Tu es l'assistant éditorial de Topolia.fr — site français de référence sur la topographie moderne.

TON ÉDITORIAL :
- Tutoiement systématique, direct, jamais corporate
- Style tech accessible : opinions tranchées, jargon expliqué à la 1ère occurrence
- Exemples concrets, chiffres réels, pas de généralités

SUJET : ${title}
SOURCE : ${url}

Rédige un brouillon d'article MDX complet avec :
1. Titre SEO + titre alternatif accrocheur
2. Excerpt (2-3 phrases pour le feed)
3. Introduction dans la voix Topolia
4. Structure H2/H3 proposée
5. Chaque section rédigée avec :
   - Contenu factuel sourcé
   - <!-- À VÉRIFIER PAR LOÏC --> sur tout fait non confirmé
   - [DONNÉE TERRAIN LOÏC] pour les mesures et expériences réelles
   - [RETOUR TERRAIN LOÏC] pour les anecdotes
6. Conclusion avec CTA
7. Tags suggérés + catégorie

RÈGLES ABSOLUES :
- status: draft — jamais published
- Citer les sources avec URLs complètes
- Langue : français même si la source est en anglais
- Ne jamais inventer de chiffres ou retours terrain`;
  }

  function openPromptModal(title: string, url: string) {
    const modal = document.getElementById('prompt-modal')!;
    const subtitle = document.getElementById('modal-subtitle')!;
    const steps = document.getElementById('modal-steps')!;

    subtitle.textContent = title;

    const p1 = buildPromptEtape1(title, url);
    const p2 = buildPromptEtape2(title, url);

    steps.innerHTML = `
      <div class="prompt-modal__step">
        <div class="prompt-modal__step-header">
          <span class="prompt-modal__step-badge">Étape 1</span>
          <strong>Résumé et angle</strong>
        </div>
        <p class="prompt-modal__step-desc">Copie ce prompt dans <a href="https://claude.ai" target="_blank" rel="noopener">Claude.ai</a>, lis le résumé, valide l'angle.</p>
        <pre class="prompt-modal__code" id="prompt-1">${p1}</pre>
        <button class="prompt-modal__copy" data-text="${encodeURIComponent(p1)}">📋 Copier l'étape 1</button>
      </div>
      <div class="prompt-modal__divider">↓ Si l'angle est bon, passe à l'étape 2</div>
      <div class="prompt-modal__step">
        <div class="prompt-modal__step-header">
          <span class="prompt-modal__step-badge prompt-modal__step-badge--2">Étape 2</span>
          <strong>Brouillon MDX complet</strong>
        </div>
        <p class="prompt-modal__step-desc">Copie ce prompt dans Claude.ai pour obtenir le brouillon MDX à coller dans Decap CMS.</p>
        <pre class="prompt-modal__code" id="prompt-2">${p2}</pre>
        <button class="prompt-modal__copy" data-text="${encodeURIComponent(p2)}">📋 Copier l'étape 2</button>
      </div>
    `;

    // Attacher les listeners de copie
    steps.querySelectorAll<HTMLButtonElement>('.prompt-modal__copy').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const text = decodeURIComponent(btn.dataset.text ?? '');
        await navigator.clipboard.writeText(text);
        const original = btn.textContent;
        btn.textContent = '✅ Copié !';
        setTimeout(() => { btn.textContent = original; }, 2000);
      });
    });

    modal.removeAttribute('hidden');
  }

  // Boutons "Préparer le prompt" dans Veille
  document.querySelectorAll<HTMLButtonElement>('.rss-item__btn--prompt').forEach((btn) => {
    btn.addEventListener('click', () => {
      openPromptModal(btn.dataset.title ?? '', btn.dataset.url ?? '');
    });
  });

  // Boutons "Prompt" dans Mes sujets
  document.querySelectorAll<HTMLButtonElement>('.sujet-card__btn--prompt').forEach((btn) => {
    btn.addEventListener('click', () => {
      openPromptModal(btn.dataset.title ?? '', btn.dataset.url ?? '');
    });
  });

  // Fermer la modale
  document.querySelector('.prompt-modal__close')?.addEventListener('click', () => {
    document.getElementById('prompt-modal')?.setAttribute('hidden', '');
  });
  document.querySelector('.prompt-modal__backdrop')?.addEventListener('click', () => {
    document.getElementById('prompt-modal')?.setAttribute('hidden', '');
  });

  // ── Changer le statut d'un sujet ──────────────────────────────────────
  document.querySelectorAll<HTMLSelectElement>('.status-select').forEach((select) => {
    select.addEventListener('change', async () => {
      const id = select.dataset.id;
      const status = select.value;
      await fetch(`/api/article-ideas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    });
  });

  // ── Supprimer un sujet ─────────────────────────────────────────────────
  document.querySelectorAll<HTMLButtonElement>('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Supprimer ce sujet définitivement ?')) return;
      const id = btn.dataset.id;
      const res = await fetch(`/api/article-ideas/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const card = btn.closest<HTMLElement>('.sujet-card');
        card?.remove();
      }
    });
  });
</script>

<style>
  .studio {
    max-width: 1100px;
    margin: 0 auto;
    padding: var(--space-6) var(--space-4);
  }

  .studio__header {
    margin-bottom: var(--space-6);
  }

  .studio__title {
    font-size: var(--text-3xl);
    margin: 0 0 var(--space-1);
  }

  .studio__subtitle {
    color: var(--color-text-muted);
    margin: 0;
  }

  .studio__tabs {
    display: flex;
    gap: var(--space-2);
    border-bottom: 2px solid var(--color-border);
    margin-bottom: var(--space-6);
  }

  .studio__tab {
    background: none;
    border: none;
    padding: var(--space-2) var(--space-4);
    font-size: var(--text-base);
    cursor: pointer;
    color: var(--color-text-muted);
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    font-weight: 500;
  }

  .studio__tab--active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
    font-weight: 700;
  }

  .studio__panel--hidden {
    display: none;
  }

  .studio__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: var(--space-4);
  }

  .studio__empty {
    text-align: center;
    color: var(--color-text-muted);
    padding: var(--space-12) 0;
  }

  /* Modale — styles inline dans la page */
  .prompt-modal {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-4);
  }
  .prompt-modal[hidden] { display: none; }
  .prompt-modal__backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.6);
  }
  .prompt-modal__box {
    position: relative;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    max-width: 700px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
  }
  .prompt-modal__close {
    position: absolute;
    top: var(--space-3);
    right: var(--space-3);
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    color: var(--color-text-muted);
    padding: var(--space-1);
  }
  .prompt-modal__title { font-size: var(--text-xl); margin: 0 0 var(--space-1); }
  .prompt-modal__subtitle {
    color: var(--color-text-muted);
    font-size: var(--text-sm);
    margin: 0 0 var(--space-5);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .prompt-modal__step {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-4);
    margin-bottom: var(--space-3);
  }
  .prompt-modal__step-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-2);
  }
  .prompt-modal__step-badge {
    background: var(--color-primary);
    color: white;
    font-size: var(--text-xs);
    font-weight: 700;
    padding: 2px 8px;
    border-radius: var(--radius-full);
  }
  .prompt-modal__step-badge--2 { opacity: 0.8; }
  .prompt-modal__step-desc { font-size: var(--text-sm); color: var(--color-text-muted); margin: 0 0 var(--space-3); }
  .prompt-modal__code {
    background: var(--color-code-bg, #1e1e1e);
    color: var(--color-code-text, #d4d4d4);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    padding: var(--space-3);
    border-radius: var(--radius-sm);
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 200px;
    overflow-y: auto;
    margin-bottom: var(--space-2);
  }
  .prompt-modal__copy {
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    padding: var(--space-2) var(--space-4);
    font-size: var(--text-sm);
    cursor: pointer;
    font-weight: 600;
  }
  .prompt-modal__divider {
    text-align: center;
    color: var(--color-text-muted);
    font-size: var(--text-sm);
    padding: var(--space-2) 0;
  }
</style>
```

- [ ] **Step 2 : Vérifier en local**

```bash
npm run dev
```

Ouvrir http://localhost:4321/admin/studio dans le navigateur.
- Si non connecté → redirigé vers /login ✅
- Si connecté → page Studio visible avec les deux onglets ✅
- Onglet Veille → articles RSS affichés ✅
- Bouton "Préparer le prompt" → modale s'ouvre ✅
- Bouton "Sauvegarder" → sujet apparaît dans "Mes sujets" ✅

- [ ] **Step 3 : Vérifier le build**

```bash
npm run build
```

Résultat attendu : build sans erreur.

- [ ] **Step 4 : Commit**

```bash
git add src/pages/admin/ src/components/studio/
git commit -m "feat: Phase 7 — /admin/studio avec veille RSS et prompt magique 2 étapes"
```

---

## Task 10 : Push final

- [ ] **Step 1 : Vérifier l'état git**

```bash
git status
git log --oneline -8
```

- [ ] **Step 2 : Push**

```bash
git push
```

---

## Checklist finale de vérification manuelle

Après le push, tester en local avec `npm run dev` :

- [ ] `/admin/studio` redirige vers `/login` si non connecté
- [ ] Une fois connecté, la page s'affiche avec les deux onglets
- [ ] L'onglet Veille charge des articles RSS (peut prendre 3-5 secondes)
- [ ] Le bouton "Préparer le prompt" ouvre la modale avec les 2 étapes
- [ ] Le bouton "Copier" copie le texte dans le presse-papier
- [ ] Le bouton "Sauvegarder" ajoute le sujet dans Supabase
- [ ] L'onglet "Mes sujets" affiche les sujets sauvegardés
- [ ] Le dropdown de statut met bien à jour Supabase
- [ ] Le bouton 🗑️ supprime le sujet après confirmation
