# Phase 3 — Pages clés Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Construire les 9 pages publiques du site Topolia.fr (home, listings + détails articles/glossaire/chantiers, feed minute topo, à propos) avec leurs composants partagés et le layout 3 colonnes des articles, en suivant la direction visuelle Signal.

**Architecture:** Routes statiques générées par Astro depuis les content collections (Content Layer API). 3 nouvelles cards + 4 composants UI partagés + 1 nouveau layout `ArticleLayout`. Mobile-first, breakpoints du brief §14, tokens du §4. Aucun JS côté client sauf TableOfContents (scroll-spy léger) et ProgressBar (scroll listener).

**Tech Stack:** Astro 6 Content Layer API, TypeScript strict, CSS variables, MDX renderers, `getStaticPaths`.

---

## Vue d'ensemble — structure des fichiers

```
src/
├── components/
│   ├── ArticleCard.astro              — Card listing articles (NEW)
│   ├── ArticleHeader.astro            — Bandeau article (title, meta, hero) (NEW)
│   ├── AuthorBio.astro                — Bloc bio auteur (NEW)
│   ├── TableOfContents.astro          — TOC sticky (NEW, JS scroll-spy)
│   ├── ProgressBar.astro              — Barre progression lecture (NEW, JS scroll)
│   ├── CategoryFilter.astro           — Chips filtres catégorie (NEW)
│   ├── AlphabetIndex.astro            — Navigation A-Z glossaire (NEW)
│   └── RelatedContent.astro           — Liens croisés articles ↔ glossaire (NEW)
├── layouts/
│   └── ArticleLayout.astro            — Layout 3 colonnes pour pages article (NEW)
├── pages/
│   ├── index.astro                    — Home (REWRITE, remplace la démo Phase 1)
│   ├── articles/
│   │   ├── index.astro                — Liste articles + filtres (NEW)
│   │   └── [...slug].astro            — Page article détaillée (NEW)
│   ├── glossaire/
│   │   ├── index.astro                — Index alphabétique (NEW)
│   │   └── [...slug].astro            — Fiche glossaire (NEW)
│   ├── chantiers/
│   │   ├── index.astro                — Liste chantiers (NEW)
│   │   └── [...slug].astro            — Fiche chantier (NEW)
│   ├── minute-topo/
│   │   └── index.astro                — Feed vertical (NEW)
│   ├── a-propos.astro                 — À propos (NEW)
│   └── debug-content.astro            — SUPPRIMER en fin de phase
└── lib/
    └── content-helpers.ts             — Utils communs : tri date, filtre published, groupBy (NEW)
```

---

## Découpage en sous-phases

| # | Sous-phase | Livrable |
|---|---|---|
| **3.A** | Utils + composants partagés | `content-helpers.ts`, `ArticleCard`, `RelatedContent` |
| **3.B** | Layout article | `ArticleHeader`, `AuthorBio`, `TableOfContents`, `ProgressBar`, `ArticleLayout` |
| **3.C** | Pages listing | `articles/index`, `glossaire/index` (+ `AlphabetIndex`), `chantiers/index`, `minute-topo/index` (+ `CategoryFilter`) |
| **3.D** | Pages détail | `articles/[...slug]`, `glossaire/[...slug]`, `chantiers/[...slug]` |
| **3.E** | Home | refonte `pages/index.astro` |
| **3.F** | À propos | `pages/a-propos.astro` |
| **3.G** | Nettoyage + commit | supprimer `debug-content`, vérif build, commit |

---

## Sous-phase 3.A — Utils + composants partagés

### Task 1 : `src/lib/content-helpers.ts`

**Files :**
- Create : `src/lib/content-helpers.ts`

- [ ] **Step 1 : Helpers TypeScript pour les content collections**

```ts
import type { CollectionEntry } from 'astro:content';

/** Trie un tableau d'entries par date décroissante (plus récent en premier). */
export function sortByDateDesc<T extends { data: { date: Date } }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** Garde uniquement les entries publiées. */
export function publishedOnly<T extends { data: { isPublished: boolean } }>(entries: T[]): T[] {
  return entries.filter((e) => e.data.isPublished);
}

/** Formate une date en français court : "3 mai 2026". */
export function formatDateFR(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/** Formate une date en français mono : "03/05/2026". */
export function formatDateMono(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR').format(date);
}

/** Groupe les entries par première lettre du titre (pour l'index glossaire). */
export function groupByFirstLetter<T extends { data: { title: string } }>(
  entries: T[],
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const entry of entries) {
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
```

- [ ] **Step 2 : Build pour vérifier**

```powershell
npm run build
```

Expected : aucune erreur TypeScript.

---

### Task 2 : `src/components/ArticleCard.astro`

**Files :**
- Create : `src/components/ArticleCard.astro`

- [ ] **Step 1 : Créer la card article**

```astro
---
import type { CollectionEntry } from 'astro:content';
import { formatDateFR, ARTICLE_CATEGORIES } from '../lib/content-helpers';

interface Props {
  entry: CollectionEntry<'articles'>;
  size?: 'default' | 'compact';
}
const { entry, size = 'default' } = Astro.props;
const { title, excerpt, date, category, heroImage, heroImageAlt, isPremium } = entry.data;

const categoryLabel = ARTICLE_CATEGORIES.find((c) => c.slug === category)?.label ?? category;
---

<a href={`/articles/${entry.id}/`} class:list={['article-card', `article-card--${size}`]}>
  <div class="article-card-image-wrap">
    <img src={heroImage} alt={heroImageAlt} loading="lazy" decoding="async" />
    {isPremium && <span class="premium-badge">Premium</span>}
  </div>
  <div class="article-card-body">
    <span class="article-card-category">{categoryLabel}</span>
    <h3 class="article-card-title">{title}</h3>
    {size !== 'compact' && <p class="article-card-excerpt">{excerpt}</p>}
    <time class="article-card-date" datetime={date.toISOString()}>{formatDateFR(date)}</time>
  </div>
</a>

<style>
  .article-card {
    display: flex;
    flex-direction: column;
    background: var(--surface);
    border: 1px solid var(--hairline);
    border-radius: 14px;
    overflow: hidden;
    text-decoration: none;
    transition:
      border-color 0.15s,
      box-shadow 0.15s,
      transform 0.15s;
  }
  .article-card:hover {
    border-color: var(--accent);
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }

  .article-card-image-wrap {
    position: relative;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    background: var(--bg-alt);
  }
  .article-card-image-wrap img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s;
  }
  .article-card:hover .article-card-image-wrap img {
    transform: scale(1.04);
  }

  .premium-badge {
    position: absolute;
    top: 12px;
    right: 12px;
    padding: 4px 10px;
    background: var(--accent-grad);
    color: var(--surface);
    font-family: var(--mono);
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    border-radius: 999px;
  }

  .article-card-body {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 20px 22px 22px;
  }

  .article-card-category {
    font-family: var(--mono);
    font-size: 0.72rem;
    font-weight: 500;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--accent);
  }

  .article-card-title {
    font-family: var(--display);
    font-size: 1.2rem;
    font-weight: 700;
    letter-spacing: -0.015em;
    line-height: 1.3;
    color: var(--ink);
  }

  .article-card-excerpt {
    font-size: 0.92rem;
    color: var(--ink-3);
    line-height: 1.55;
  }

  .article-card-date {
    margin-top: auto;
    font-family: var(--mono);
    font-size: 0.78rem;
    color: var(--ink-muted);
  }

  .article-card--compact {
    flex-direction: row;
  }
  .article-card--compact .article-card-image-wrap {
    width: 120px;
    aspect-ratio: 1 / 1;
    flex-shrink: 0;
  }
  .article-card--compact .article-card-body {
    padding: 14px 18px;
    gap: 6px;
  }
  .article-card--compact .article-card-title {
    font-size: 1rem;
  }
</style>
```

---

### Task 3 : `src/components/RelatedContent.astro`

**Files :**
- Create : `src/components/RelatedContent.astro`

- [ ] **Step 1 : Composant générique de liens croisés**

Affiche une liste de liens vers d'autres contenus (articles / glossaire / chantiers). Utilisé dans la sidebar des pages détail.

```astro
---
interface RelatedLink {
  href: string;
  label: string;
  type: 'article' | 'glossaire' | 'chantier' | 'minute';
}

interface Props {
  title: string;
  items: RelatedLink[];
}
const { title, items } = Astro.props;

const typeIcon: Record<RelatedLink['type'], string> = {
  article: '◯',
  glossaire: '◇',
  chantier: '◈',
  minute: '◦',
};
---

{items.length > 0 && (
  <aside class="related-content">
    <h3 class="related-title">{title}</h3>
    <ul class="related-list">
      {items.map((item) => (
        <li>
          <a href={item.href} class="related-link">
            <span class="related-icon" aria-hidden="true">{typeIcon[item.type]}</span>
            <span class="related-label">{item.label}</span>
          </a>
        </li>
      ))}
    </ul>
  </aside>
)}

<style>
  .related-content {
    padding: 24px;
    background: var(--bg-alt);
    border-radius: 12px;
  }
  .related-title {
    font-family: var(--mono);
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--ink-muted);
    margin-bottom: 14px;
  }
  .related-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .related-link {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 8px 10px;
    border-radius: 6px;
    text-decoration: none;
    color: var(--ink-2);
    font-size: 0.9rem;
    line-height: 1.4;
    transition: background 0.15s, color 0.15s;
  }
  .related-link:hover {
    background: var(--surface);
    color: var(--accent);
  }
  .related-icon {
    color: var(--accent);
    font-size: 0.85rem;
    margin-top: 2px;
    flex-shrink: 0;
  }
</style>
```

- [ ] **Step 2 : Build de vérification**

```powershell
npm run build
```

Expected : 0 erreur.

---

## Sous-phase 3.B — Layout article

### Task 4 : `src/components/ArticleHeader.astro`

**Files :**
- Create : `src/components/ArticleHeader.astro`

- [ ] **Step 1 : Bandeau d'en-tête d'article**

```astro
---
import { formatDateFR, ARTICLE_CATEGORIES } from '../lib/content-helpers';
import { formatReadingTime } from '../lib/reading-time';

interface Props {
  title: string;
  subtitle?: string;
  date: Date;
  category: string;
  author: string;
  heroImage: string;
  heroImageAlt: string;
  readingTime: number;
}
const { title, subtitle, date, category, author, heroImage, heroImageAlt, readingTime } = Astro.props;

const categoryLabel = ARTICLE_CATEGORIES.find((c) => c.slug === category)?.label ?? category;
---

<header class="article-header">
  <div class="container article-header-inner">
    <a href={`/articles/?cat=${category}`} class="article-eyebrow">{categoryLabel}</a>
    <h1 class="article-title">{title}</h1>
    {subtitle && <p class="article-subtitle">{subtitle}</p>}
    <div class="article-meta">
      <span class="article-author">Par {author === 'loic' ? 'Loïc' : author}</span>
      <span class="article-sep" aria-hidden="true">·</span>
      <time datetime={date.toISOString()}>{formatDateFR(date)}</time>
      <span class="article-sep" aria-hidden="true">·</span>
      <span>{formatReadingTime(readingTime)}</span>
    </div>
  </div>
  <div class="article-hero-image-wrap">
    <div class="container">
      <img src={heroImage} alt={heroImageAlt} class="article-hero-image" />
    </div>
  </div>
</header>

<style>
  .article-header {
    padding-top: 60px;
  }
  .article-header-inner {
    max-width: var(--content-max);
    text-align: left;
  }
  .article-eyebrow {
    display: inline-block;
    font-family: var(--mono);
    font-size: 0.78rem;
    font-weight: 500;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--accent);
    text-decoration: none;
    margin-bottom: 18px;
  }
  .article-eyebrow:hover {
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .article-title {
    font-family: var(--display);
    font-size: clamp(1.8rem, 5vw, 3rem);
    font-weight: 800;
    letter-spacing: -0.025em;
    line-height: 1.1;
    color: var(--ink);
  }
  .article-subtitle {
    margin-top: 16px;
    font-size: 1.2rem;
    color: var(--ink-3);
    line-height: 1.45;
  }
  .article-meta {
    margin-top: 28px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    font-family: var(--mono);
    font-size: 0.85rem;
    color: var(--ink-muted);
  }
  .article-author {
    color: var(--ink-2);
    font-weight: 500;
  }
  .article-sep {
    color: var(--ink-light);
  }
  .article-hero-image-wrap {
    margin-top: 40px;
  }
  .article-hero-image {
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    border-radius: 16px;
    background: var(--bg-alt);
    border: 1px solid var(--hairline);
  }
</style>
```

---

### Task 5 : `src/components/AuthorBio.astro`

**Files :**
- Create : `src/components/AuthorBio.astro`

- [ ] **Step 1 : Bloc bio auteur (Loïc seul pour l'instant)**

```astro
---
interface Props {
  author: string;
}
const { author } = Astro.props;

const bios: Record<string, { name: string; role: string; bio: string }> = {
  loic: {
    name: 'Loïc',
    role: 'Topographe, fondateur de Topolia',
    bio: "Sur le terrain depuis 2018, avec scanner statique, drone et backpack. J'écris ici ce que j'aurais voulu lire à mes débuts.",
  },
};

const profile = bios[author] ?? bios.loic;
---

<aside class="author-bio">
  <div class="author-avatar" aria-hidden="true">{profile.name.charAt(0)}</div>
  <div class="author-info">
    <p class="author-name">{profile.name}</p>
    <p class="author-role">{profile.role}</p>
    <p class="author-text">{profile.bio}</p>
  </div>
</aside>

<style>
  .author-bio {
    display: flex;
    gap: 16px;
    padding: 20px;
    background: var(--bg-alt);
    border-radius: 12px;
  }
  .author-avatar {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--accent-grad);
    color: var(--surface);
    font-family: var(--display);
    font-size: 1.4rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .author-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .author-name {
    font-family: var(--display);
    font-size: 1rem;
    font-weight: 700;
    color: var(--ink);
  }
  .author-role {
    font-family: var(--mono);
    font-size: 0.75rem;
    color: var(--ink-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .author-text {
    margin-top: 6px;
    font-size: 0.9rem;
    color: var(--ink-3);
    line-height: 1.5;
  }
</style>
```

---

### Task 6 : `src/components/TableOfContents.astro`

**Files :**
- Create : `src/components/TableOfContents.astro`

- [ ] **Step 1 : TOC depuis les headings du MDX**

```astro
---
import type { MarkdownHeading } from 'astro';

interface Props {
  headings: MarkdownHeading[];
}
const { headings } = Astro.props;

// On garde uniquement H2 et H3 pour ne pas surcharger
const tocHeadings = headings.filter((h) => h.depth >= 2 && h.depth <= 3);
---

{tocHeadings.length > 0 && (
  <nav class="toc" aria-label="Sommaire">
    <p class="toc-title">Sommaire</p>
    <ul class="toc-list">
      {tocHeadings.map((heading) => (
        <li class:list={['toc-item', `toc-item--h${heading.depth}`]}>
          <a href={`#${heading.slug}`} data-toc-link={heading.slug}>
            {heading.text}
          </a>
        </li>
      ))}
    </ul>
  </nav>
)}

<script>
  const links = document.querySelectorAll<HTMLAnchorElement>('[data-toc-link]');
  if (links.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            links.forEach((l) => l.classList.remove('toc-active'));
            const active = document.querySelector<HTMLAnchorElement>(
              `[data-toc-link="${entry.target.id}"]`,
            );
            active?.classList.add('toc-active');
          }
        });
      },
      { rootMargin: '-30% 0% -60% 0%' },
    );

    links.forEach((link) => {
      const id = link.dataset.tocLink;
      if (!id) return;
      const target = document.getElementById(id);
      if (target) observer.observe(target);
    });
  }
</script>

<style>
  .toc {
    font-family: var(--body);
  }
  .toc-title {
    font-family: var(--mono);
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-muted);
    margin-bottom: 14px;
  }
  .toc-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 2px;
    border-left: 1px solid var(--hairline);
  }
  .toc-item a {
    display: block;
    padding: 4px 12px;
    margin-left: -1px;
    font-size: 0.875rem;
    color: var(--ink-3);
    text-decoration: none;
    border-left: 1px solid transparent;
    transition: color 0.15s, border-color 0.15s;
    line-height: 1.4;
  }
  .toc-item a:hover {
    color: var(--ink);
  }
  .toc-item a.toc-active {
    color: var(--accent);
    border-left-color: var(--accent);
    font-weight: 500;
  }
  .toc-item--h3 a {
    padding-left: 24px;
    font-size: 0.82rem;
  }
</style>
```

---

### Task 7 : `src/components/ProgressBar.astro`

**Files :**
- Create : `src/components/ProgressBar.astro`

- [ ] **Step 1 : Barre de progression scroll**

```astro
<div class="progress-bar" role="progressbar" aria-label="Progression de lecture">
  <div class="progress-bar-fill" id="progress-bar-fill"></div>
</div>

<script>
  const fill = document.getElementById('progress-bar-fill');
  if (fill) {
    const update = () => {
      const scrolled = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const percent = max > 0 ? Math.min(100, (scrolled / max) * 100) : 0;
      fill.style.width = `${percent}%`;
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
  }
</script>

<style>
  .progress-bar {
    position: fixed;
    top: 64px;
    left: 0;
    right: 0;
    height: 2px;
    background: transparent;
    z-index: 90;
    pointer-events: none;
  }
  .progress-bar-fill {
    height: 100%;
    width: 0%;
    background: var(--accent-grad);
    transition: width 0.05s linear;
  }
</style>
```

---

### Task 8 : `src/layouts/ArticleLayout.astro`

**Files :**
- Create : `src/layouts/ArticleLayout.astro`

- [ ] **Step 1 : Layout 3 colonnes pour les pages article**

Wrappe le contenu MDX rendu, place la TOC à gauche (sticky), le contenu au centre, la sidebar (AuthorBio + Related) à droite.

```astro
---
import BaseLayout from './BaseLayout.astro';
import ArticleHeader from '../components/ArticleHeader.astro';
import TableOfContents from '../components/TableOfContents.astro';
import ProgressBar from '../components/ProgressBar.astro';
import AuthorBio from '../components/AuthorBio.astro';
import type { MarkdownHeading } from 'astro';

interface Props {
  title: string;
  subtitle?: string;
  description: string;
  date: Date;
  category: string;
  author: string;
  heroImage: string;
  heroImageAlt: string;
  readingTime: number;
  headings: MarkdownHeading[];
}
const props = Astro.props;
---

<BaseLayout title={props.title} description={props.description} ogImage={props.heroImage}>
  <ProgressBar />

  <ArticleHeader
    title={props.title}
    subtitle={props.subtitle}
    date={props.date}
    category={props.category}
    author={props.author}
    heroImage={props.heroImage}
    heroImageAlt={props.heroImageAlt}
    readingTime={props.readingTime}
  />

  <div class="container article-layout">
    <aside class="article-aside article-aside--left">
      <div class="sticky">
        <TableOfContents headings={props.headings} />
      </div>
    </aside>

    <article class="article-content prose">
      <slot />
    </article>

    <aside class="article-aside article-aside--right">
      <div class="sticky">
        <AuthorBio author={props.author} />
        <slot name="related" />
      </div>
    </aside>
  </div>
</BaseLayout>

<style>
  .article-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 48px;
    padding: 60px 0 100px;
  }

  .article-aside {
    display: none;
  }

  .article-content {
    max-width: var(--content-max);
    width: 100%;
    margin-inline: auto;
  }

  .sticky {
    position: sticky;
    top: 100px;
  }

  /* ── Typographie prose ── */
  .prose :global(h2) {
    font-family: var(--display);
    font-size: 1.6rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    margin: 56px 0 16px;
    color: var(--ink);
    scroll-margin-top: 100px;
  }
  .prose :global(h3) {
    font-family: var(--display);
    font-size: 1.2rem;
    font-weight: 700;
    margin: 36px 0 12px;
    color: var(--ink-2);
    scroll-margin-top: 100px;
  }
  .prose :global(p) {
    margin: 16px 0;
    font-size: 1.05rem;
    line-height: 1.7;
    color: var(--ink-2);
  }
  .prose :global(ul), .prose :global(ol) {
    margin: 16px 0 16px 24px;
    color: var(--ink-2);
    line-height: 1.7;
  }
  .prose :global(li) {
    margin: 6px 0;
  }
  .prose :global(a) {
    color: var(--accent);
    text-decoration: underline;
    text-underline-offset: 3px;
    text-decoration-thickness: 1px;
  }
  .prose :global(a:hover) {
    text-decoration-thickness: 2px;
  }
  .prose :global(strong) {
    color: var(--ink);
    font-weight: 600;
  }
  .prose :global(code) {
    font-family: var(--mono);
    font-size: 0.9em;
    padding: 2px 6px;
    background: var(--bg-alt);
    border-radius: 4px;
    color: var(--ink);
  }
  .prose :global(pre) {
    margin: 24px 0;
    padding: 18px 20px;
    background: var(--bg-dark);
    color: var(--surface);
    border-radius: 10px;
    overflow-x: auto;
    font-family: var(--mono);
    font-size: 0.875rem;
    line-height: 1.55;
  }
  .prose :global(pre code) {
    background: transparent;
    padding: 0;
    color: inherit;
  }
  .prose :global(blockquote) {
    margin: 24px 0;
    padding: 16px 22px;
    border-left: 3px solid var(--accent);
    background: var(--accent-soft);
    border-radius: 0 8px 8px 0;
    color: var(--ink-2);
    font-style: italic;
  }
  .prose :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 24px 0;
    font-size: 0.92rem;
  }
  .prose :global(th), .prose :global(td) {
    padding: 10px 14px;
    text-align: left;
    border-bottom: 1px solid var(--hairline);
  }
  .prose :global(th) {
    background: var(--bg-alt);
    font-weight: 600;
    color: var(--ink);
  }

  @media (min-width: 1080px) {
    .article-layout {
      grid-template-columns: 220px minmax(0, var(--content-max)) 260px;
      gap: 56px;
      justify-content: center;
    }
    .article-aside {
      display: block;
    }
  }
</style>
```

- [ ] **Step 2 : Build de vérification**

```powershell
npm run build
```

Expected : 0 erreur.

---

## Sous-phase 3.C — Pages listing

### Task 9 : `src/components/CategoryFilter.astro`

**Files :**
- Create : `src/components/CategoryFilter.astro`

- [ ] **Step 1 : Chips de filtrage par catégorie (client-side)**

```astro
---
import { ARTICLE_CATEGORIES } from '../lib/content-helpers';

interface Props {
  currentCategory?: string;
}
const { currentCategory } = Astro.props;
---

<nav class="cat-filter" aria-label="Filtrer par catégorie">
  <a
    href="/articles/"
    class:list={['cat-chip', { 'cat-chip--active': !currentCategory }]}
  >
    Tous
  </a>
  {ARTICLE_CATEGORIES.map((cat) => (
    <a
      href={`/articles/?cat=${cat.slug}`}
      class:list={['cat-chip', { 'cat-chip--active': currentCategory === cat.slug }]}
      data-cat={cat.slug}
    >
      {cat.label}
    </a>
  ))}
</nav>

<style>
  .cat-filter {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin: 32px 0 40px;
  }
  .cat-chip {
    padding: 8px 16px;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--ink-3);
    background: var(--surface);
    border: 1px solid var(--hairline);
    border-radius: 999px;
    text-decoration: none;
    transition:
      color 0.15s,
      border-color 0.15s,
      background 0.15s;
    min-height: 36px;
    display: inline-flex;
    align-items: center;
  }
  .cat-chip:hover {
    color: var(--ink);
    border-color: var(--hairline-strong);
  }
  .cat-chip--active {
    color: var(--surface);
    background: var(--ink);
    border-color: var(--ink);
  }
  .cat-chip--active:hover {
    color: var(--surface);
  }
  @media (max-width: 639px) {
    .cat-filter {
      flex-wrap: nowrap;
      overflow-x: auto;
      padding-bottom: 4px;
    }
    .cat-chip {
      flex-shrink: 0;
    }
  }
</style>
```

---

### Task 10 : `src/pages/articles/index.astro`

**Files :**
- Create : `src/pages/articles/index.astro`

- [ ] **Step 1 : Liste articles avec filtres catégorie (filtrage côté serveur via query param)**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import ArticleCard from '../../components/ArticleCard.astro';
import CategoryFilter from '../../components/CategoryFilter.astro';
import { getCollection } from 'astro:content';
import { sortByDateDesc, publishedOnly, ARTICLE_CATEGORIES } from '../../lib/content-helpers';

const cat = Astro.url.searchParams.get('cat') ?? '';
const validCat = ARTICLE_CATEGORIES.find((c) => c.slug === cat)?.slug;

const all = sortByDateDesc(publishedOnly(await getCollection('articles')));
const articles = validCat ? all.filter((a) => a.data.category === validCat) : all;

const currentLabel = validCat
  ? ARTICLE_CATEGORIES.find((c) => c.slug === validCat)?.label
  : undefined;
---

<BaseLayout
  title={currentLabel ? `Articles · ${currentLabel}` : 'Tous les articles'}
  description="Tutoriels, comparatifs, retours terrain — toute la topographie moderne expliquée sans filtre."
>
  <section class="container articles-listing">
    <header class="listing-header">
      <p class="listing-eyebrow">{articles.length} article{articles.length > 1 ? 's' : ''}</p>
      <h1 class="listing-title">
        {currentLabel ? <>Articles · <span class="accent">{currentLabel}</span></> : 'Tous les articles'}
      </h1>
      <p class="listing-sub">
        Tutoriels logiciels, comparatifs matériel, retours terrain. Filtre par catégorie ci-dessous.
      </p>
    </header>

    <CategoryFilter currentCategory={validCat} />

    {articles.length > 0 ? (
      <div class="articles-grid">
        {articles.map((entry) => <ArticleCard entry={entry} />)}
      </div>
    ) : (
      <p class="empty">Aucun article dans cette catégorie pour l'instant.</p>
    )}
  </section>
</BaseLayout>

<style>
  .articles-listing {
    padding: 60px 0 80px;
  }
  .listing-header {
    max-width: var(--content-max);
  }
  .listing-eyebrow {
    font-family: var(--mono);
    font-size: 0.78rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 14px;
  }
  .listing-title {
    font-family: var(--display);
    font-size: clamp(2rem, 5vw, 3.2rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.1;
    color: var(--ink);
  }
  .accent {
    background: var(--accent-grad);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .listing-sub {
    margin-top: 14px;
    font-size: 1.05rem;
    color: var(--ink-3);
    max-width: 540px;
  }
  .articles-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }
  .empty {
    padding: 60px 20px;
    text-align: center;
    color: var(--ink-muted);
    font-style: italic;
  }
</style>
```

**Note** : `Astro.url.searchParams` ne marche pas en mode SSG par défaut. Pour faire fonctionner le filtrage par query param, il faut passer la page en `prerender = false` OU filtrer côté client. Pour rester full SSG (plus simple, plus rapide), je vais **filtrer côté client** via le composant `CategoryFilter` qui pointera vers des routes `/articles/categorie/[cat]/` générées statiquement. Tâche 10b ci-dessous.

- [ ] **Step 2 : Plan B — filtrage SSG via routes catégorie**

Au lieu de query param, créer une route `/articles/c/[cat]/`. Modifier Task 10 pour qu'`articles/index.astro` affiche **tout sans filtre** + lien vers les pages catégorie. Et ajouter Task 10b.

**Décision pour le plan :** je garde `articles/index.astro` comme listing global, et j'ajoute une route `articles/c/[cat]/` pour les catégories.

**Mise à jour `articles/index.astro` (version finale)** :

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import ArticleCard from '../../components/ArticleCard.astro';
import CategoryFilter from '../../components/CategoryFilter.astro';
import { getCollection } from 'astro:content';
import { sortByDateDesc, publishedOnly } from '../../lib/content-helpers';

const articles = sortByDateDesc(publishedOnly(await getCollection('articles')));
---

<BaseLayout
  title="Tous les articles"
  description="Tutoriels, comparatifs, retours terrain — toute la topographie moderne expliquée sans filtre."
>
  <section class="container articles-listing">
    <header class="listing-header">
      <p class="listing-eyebrow">{articles.length} article{articles.length > 1 ? 's' : ''}</p>
      <h1 class="listing-title">Tous les articles</h1>
      <p class="listing-sub">
        Tutoriels logiciels, comparatifs matériel, retours terrain. Filtre par catégorie ci-dessous.
      </p>
    </header>

    <CategoryFilter />

    {articles.length > 0 ? (
      <div class="articles-grid">
        {articles.map((entry) => <ArticleCard entry={entry} />)}
      </div>
    ) : (
      <p class="empty">Aucun article publié pour l'instant.</p>
    )}
  </section>
</BaseLayout>

<style>
  /* (identique à au-dessus) */
  .articles-listing { padding: 60px 0 80px; }
  .listing-header { max-width: var(--content-max); }
  .listing-eyebrow {
    font-family: var(--mono); font-size: 0.78rem; letter-spacing: 0.05em;
    text-transform: uppercase; color: var(--accent); margin-bottom: 14px;
  }
  .listing-title {
    font-family: var(--display); font-size: clamp(2rem, 5vw, 3.2rem);
    font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; color: var(--ink);
  }
  .listing-sub { margin-top: 14px; font-size: 1.05rem; color: var(--ink-3); max-width: 540px; }
  .articles-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
  .empty { padding: 60px 20px; text-align: center; color: var(--ink-muted); font-style: italic; }
</style>
```

Et mettre à jour `CategoryFilter` pour pointer vers `/articles/c/${slug}/` :

Dans `CategoryFilter.astro`, changer `href={'/articles/?cat=${cat.slug}'}` en `href={'/articles/c/${cat.slug}/'}`.

---

### Task 10b : `src/pages/articles/c/[cat].astro`

**Files :**
- Create : `src/pages/articles/c/[cat].astro`

- [ ] **Step 1 : Route catégorie SSG**

```astro
---
import BaseLayout from '../../../layouts/BaseLayout.astro';
import ArticleCard from '../../../components/ArticleCard.astro';
import CategoryFilter from '../../../components/CategoryFilter.astro';
import { getCollection } from 'astro:content';
import { sortByDateDesc, publishedOnly, ARTICLE_CATEGORIES } from '../../../lib/content-helpers';

export async function getStaticPaths() {
  const all = sortByDateDesc(publishedOnly(await getCollection('articles')));
  return ARTICLE_CATEGORIES.map((cat) => ({
    params: { cat: cat.slug },
    props: {
      label: cat.label,
      articles: all.filter((a) => a.data.category === cat.slug),
    },
  }));
}

const { label, articles } = Astro.props;
const { cat } = Astro.params;
---

<BaseLayout
  title={`Articles · ${label}`}
  description={`Tous les articles Topolia dans la catégorie ${label}.`}
>
  <section class="container articles-listing">
    <header class="listing-header">
      <p class="listing-eyebrow">{articles.length} article{articles.length > 1 ? 's' : ''}</p>
      <h1 class="listing-title">
        Articles · <span class="accent">{label}</span>
      </h1>
    </header>

    <CategoryFilter currentCategory={cat} />

    {articles.length > 0 ? (
      <div class="articles-grid">
        {articles.map((entry) => <ArticleCard entry={entry} />)}
      </div>
    ) : (
      <p class="empty">Aucun article dans cette catégorie pour l'instant.</p>
    )}
  </section>
</BaseLayout>

<style>
  .articles-listing { padding: 60px 0 80px; }
  .listing-header { max-width: var(--content-max); }
  .listing-eyebrow {
    font-family: var(--mono); font-size: 0.78rem; letter-spacing: 0.05em;
    text-transform: uppercase; color: var(--accent); margin-bottom: 14px;
  }
  .listing-title {
    font-family: var(--display); font-size: clamp(2rem, 5vw, 3.2rem);
    font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; color: var(--ink);
  }
  .accent {
    background: var(--accent-grad); -webkit-background-clip: text;
    background-clip: text; color: transparent;
  }
  .articles-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
  .empty { padding: 60px 20px; text-align: center; color: var(--ink-muted); font-style: italic; }
</style>
```

---

### Task 11 : `src/components/AlphabetIndex.astro`

**Files :**
- Create : `src/components/AlphabetIndex.astro`

- [ ] **Step 1 : Navigation A-Z avec ancres**

```astro
---
interface Props {
  letters: string[]; // lettres effectivement présentes
}
const { letters } = Astro.props;

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('');
---

<nav class="alpha-index" aria-label="Index alphabétique">
  {ALPHABET.map((letter) => {
    const has = letters.includes(letter);
    return (
      <a
        href={has ? `#letter-${letter}` : undefined}
        class:list={['alpha-link', { 'alpha-link--disabled': !has }]}
        aria-disabled={!has}
      >
        {letter}
      </a>
    );
  })}
</nav>

<style>
  .alpha-index {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 14px 18px;
    background: var(--bg-alt);
    border-radius: 12px;
    border: 1px solid var(--hairline);
  }
  .alpha-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    font-family: var(--mono);
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--ink-2);
    text-decoration: none;
    border-radius: 6px;
    transition: background 0.15s, color 0.15s;
  }
  .alpha-link:hover {
    background: var(--surface);
    color: var(--accent);
  }
  .alpha-link--disabled {
    color: var(--ink-light);
    pointer-events: none;
    opacity: 0.5;
  }
</style>
```

---

### Task 12 : `src/pages/glossaire/index.astro`

**Files :**
- Create : `src/pages/glossaire/index.astro`

- [ ] **Step 1 : Index alphabétique du glossaire**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import GlossaryCard from '../../components/GlossaryCard.astro';
import AlphabetIndex from '../../components/AlphabetIndex.astro';
import { getCollection } from 'astro:content';
import { publishedOnly, groupByFirstLetter } from '../../lib/content-helpers';

const all = publishedOnly(await getCollection('glossaire'));
const grouped = groupByFirstLetter(all);
const letters = [...grouped.keys()];
---

<BaseLayout
  title="Glossaire de la topographie"
  description="Les termes essentiels de la topographie moderne, expliqués clairement. LiDAR, SLAM, COPC, recalage, RTK… tout y est."
>
  <section class="container glossary-page">
    <header class="listing-header">
      <p class="listing-eyebrow">{all.length} terme{all.length > 1 ? 's' : ''}</p>
      <h1 class="listing-title">
        Glossaire <span class="accent">topo</span>
      </h1>
      <p class="listing-sub">
        Les mots du métier, expliqués sans jargon inutile. Du débutant à l'expert.
      </p>
    </header>

    <div class="alpha-wrap">
      <AlphabetIndex letters={letters} />
    </div>

    <div class="letter-sections">
      {[...grouped.entries()].map(([letter, entries]) => (
        <section id={`letter-${letter}`} class="letter-section">
          <h2 class="letter-heading">{letter}</h2>
          <div class="letter-grid">
            {entries.map((entry) => <GlossaryCard entry={entry} />)}
          </div>
        </section>
      ))}
    </div>
  </section>
</BaseLayout>

<style>
  .glossary-page { padding: 60px 0 80px; }
  .listing-header { max-width: var(--content-max); }
  .listing-eyebrow {
    font-family: var(--mono); font-size: 0.78rem; letter-spacing: 0.05em;
    text-transform: uppercase; color: var(--accent); margin-bottom: 14px;
  }
  .listing-title {
    font-family: var(--display); font-size: clamp(2rem, 5vw, 3.2rem);
    font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; color: var(--ink);
  }
  .accent {
    background: var(--accent-grad); -webkit-background-clip: text;
    background-clip: text; color: transparent;
  }
  .listing-sub { margin-top: 14px; font-size: 1.05rem; color: var(--ink-3); max-width: 540px; }
  .alpha-wrap { margin: 36px 0 40px; }
  .letter-section { margin-top: 48px; scroll-margin-top: 80px; }
  .letter-heading {
    font-family: var(--display);
    font-size: 2.2rem;
    font-weight: 800;
    color: var(--ink-light);
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--hairline);
    letter-spacing: -0.02em;
  }
  .letter-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 16px;
  }
</style>
```

---

### Task 13 : `src/pages/chantiers/index.astro`

**Files :**
- Create : `src/pages/chantiers/index.astro`

- [ ] **Step 1 : Liste chantiers**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import ChantierCard from '../../components/ChantierCard.astro';
import { getCollection } from 'astro:content';
import { sortByDateDesc, publishedOnly } from '../../lib/content-helpers';

const chantiers = sortByDateDesc(publishedOnly(await getCollection('chantiers')));
---

<BaseLayout
  title="Chantiers anonymisés"
  description="Retours terrain réels : ce qui a marché, ce qui a planté, ce que j'aurais fait différemment. Les chantiers qu'on ne publie nulle part."
>
  <section class="container chantiers-listing">
    <header class="listing-header">
      <p class="listing-eyebrow">{chantiers.length} chantier{chantiers.length > 1 ? 's' : ''}</p>
      <h1 class="listing-title">
        Chantiers <span class="accent">anonymisés</span>
      </h1>
      <p class="listing-sub">
        Vrais projets, vrais problèmes, vraies leçons. Sans cabinet ni client nommés.
        Ce que les bureaux ne publient pas, mais que tout topographe veut lire.
      </p>
    </header>

    {chantiers.length > 0 ? (
      <div class="chantiers-grid">
        {chantiers.map((entry) => <ChantierCard entry={entry} />)}
      </div>
    ) : (
      <p class="empty">Aucun chantier publié pour l'instant.</p>
    )}
  </section>
</BaseLayout>

<style>
  .chantiers-listing { padding: 60px 0 80px; }
  .listing-header { max-width: var(--content-max); margin-bottom: 40px; }
  .listing-eyebrow {
    font-family: var(--mono); font-size: 0.78rem; letter-spacing: 0.05em;
    text-transform: uppercase; color: var(--amber); margin-bottom: 14px;
  }
  .listing-title {
    font-family: var(--display); font-size: clamp(2rem, 5vw, 3.2rem);
    font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; color: var(--ink);
  }
  .accent {
    background: var(--accent-grad); -webkit-background-clip: text;
    background-clip: text; color: transparent;
  }
  .listing-sub { margin-top: 14px; font-size: 1.05rem; color: var(--ink-3); max-width: 580px; }
  .chantiers-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
  }
  .empty { padding: 60px 20px; text-align: center; color: var(--ink-muted); font-style: italic; }
</style>
```

---

### Task 14 : `src/pages/minute-topo/index.astro`

**Files :**
- Create : `src/pages/minute-topo/index.astro`

- [ ] **Step 1 : Feed vertical des minutes topo**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import MinuteTopoCard from '../../components/MinuteTopoCard.astro';
import { getCollection } from 'astro:content';
import { sortByDateDesc, publishedOnly } from '../../lib/content-helpers';

const minutes = sortByDateDesc(publishedOnly(await getCollection('minute-topo')));
---

<BaseLayout
  title="Minute topo"
  description="Une astuce ou un fait technique par semaine, en moins de 3 minutes de lecture. Pour que ton skill terrain progresse sans y passer la soirée."
>
  <section class="container minute-listing">
    <header class="listing-header">
      <p class="listing-eyebrow">Feed minute topo</p>
      <h1 class="listing-title">
        La <span class="accent">minute topo</span>
      </h1>
      <p class="listing-sub">
        Une astuce terrain par semaine, format ultra-court. À lire entre deux stations
        ou dans le train du retour. Moins de 3 minutes garanties.
      </p>
    </header>

    {minutes.length > 0 ? (
      <div class="minute-feed">
        {minutes.map((entry) => <MinuteTopoCard entry={entry} />)}
      </div>
    ) : (
      <p class="empty">Aucune minute topo pour l'instant.</p>
    )}
  </section>
</BaseLayout>

<style>
  .minute-listing { padding: 60px 0 80px; }
  .listing-header { max-width: var(--content-max); margin-bottom: 40px; }
  .listing-eyebrow {
    font-family: var(--mono); font-size: 0.78rem; letter-spacing: 0.05em;
    text-transform: uppercase; color: var(--accent); margin-bottom: 14px;
  }
  .listing-title {
    font-family: var(--display); font-size: clamp(2rem, 5vw, 3.2rem);
    font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; color: var(--ink);
  }
  .accent {
    background: var(--accent-grad); -webkit-background-clip: text;
    background-clip: text; color: transparent;
  }
  .listing-sub { margin-top: 14px; font-size: 1.05rem; color: var(--ink-3); max-width: 580px; }
  .minute-feed {
    max-width: var(--content-max);
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .empty { padding: 60px 20px; text-align: center; color: var(--ink-muted); font-style: italic; }
</style>
```

- [ ] **Build de vérification**

```powershell
npm run build
```

Expected : 4 pages listing rendues + 7 routes catégorie articles + sitemap.

---

## Sous-phase 3.D — Pages détail

### Task 15 : `src/pages/articles/[...slug].astro`

**Files :**
- Create : `src/pages/articles/[...slug].astro`

- [ ] **Step 1 : Page article détaillée avec layout 3 colonnes + related**

Avec la Content Layer API en Astro 6, on utilise `render(entry)` depuis `astro:content` au lieu de `entry.render()`.

```astro
---
import ArticleLayout from '../../layouts/ArticleLayout.astro';
import RelatedContent from '../../components/RelatedContent.astro';
import { getCollection, render } from 'astro:content';
import { publishedOnly } from '../../lib/content-helpers';
import { readingTime } from '../../lib/reading-time';

export async function getStaticPaths() {
  const articles = publishedOnly(await getCollection('articles'));
  return articles.map((entry) => ({
    params: { slug: entry.id },
    props: { entry },
  }));
}

const { entry } = Astro.props;
const { Content, headings } = await render(entry);
const minutes = readingTime(entry.body ?? '');

// Articles connexes : 3 derniers de la même catégorie, hors l'article courant.
const allArticles = publishedOnly(await getCollection('articles'));
const related = allArticles
  .filter((a) => a.data.category === entry.data.category && a.id !== entry.id)
  .slice(0, 3)
  .map((a) => ({
    href: `/articles/${a.id}/`,
    label: a.data.title,
    type: 'article' as const,
  }));
---

<ArticleLayout
  title={entry.data.title}
  subtitle={entry.data.subtitle}
  description={entry.data.excerpt}
  date={entry.data.date}
  category={entry.data.category}
  author={entry.data.author}
  heroImage={entry.data.heroImage}
  heroImageAlt={entry.data.heroImageAlt}
  readingTime={minutes}
  headings={headings}
>
  <Content />
  <RelatedContent slot="related" title="À lire aussi" items={related} />
</ArticleLayout>
```

- [ ] **Step 2 : Build**

```powershell
npm run build
```

Expected : 3 pages article rendues.

---

### Task 16 : `src/pages/glossaire/[...slug].astro`

**Files :**
- Create : `src/pages/glossaire/[...slug].astro`

- [ ] **Step 1 : Fiche glossaire**

Page plus simple (pas de TOC, pas de hero image — c'est un terme court).

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import RelatedContent from '../../components/RelatedContent.astro';
import { getCollection, render } from 'astro:content';
import { publishedOnly, formatDateFR } from '../../lib/content-helpers';

export async function getStaticPaths() {
  const entries = publishedOnly(await getCollection('glossaire'));
  return entries.map((entry) => ({
    params: { slug: entry.id },
    props: { entry },
  }));
}

const { entry } = Astro.props;
const { Content } = await render(entry);

const difficultyLabel: Record<string, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  expert: 'Expert',
};

// Articles connexes déclarés dans le frontmatter
const allArticles = publishedOnly(await getCollection('articles'));
const allChantiers = publishedOnly(await getCollection('chantiers'));

const relatedArticles = (entry.data.relatedArticles ?? [])
  .map((id) => allArticles.find((a) => a.id === id))
  .filter((a): a is NonNullable<typeof a> => Boolean(a))
  .map((a) => ({ href: `/articles/${a.id}/`, label: a.data.title, type: 'article' as const }));

const relatedChantiers = (entry.data.relatedChantiers ?? [])
  .map((id) => allChantiers.find((c) => c.id === id))
  .filter((c): c is NonNullable<typeof c> => Boolean(c))
  .map((c) => ({ href: `/chantiers/${c.id}/`, label: c.data.title, type: 'chantier' as const }));
---

<BaseLayout title={entry.data.title} description={entry.data.excerpt}>
  <article class="container glossary-page">
    <a href="/glossaire/" class="back-link">← Retour au glossaire</a>

    <header class="glossary-header">
      <span class:list={['difficulty', `difficulty--${entry.data.difficulty}`]}>
        {difficultyLabel[entry.data.difficulty]}
      </span>
      <h1 class="glossary-title">{entry.data.title}</h1>
      <p class="glossary-excerpt">{entry.data.excerpt}</p>
      <p class="glossary-date">
        Mis à jour le <time datetime={entry.data.date.toISOString()}>
          {formatDateFR(entry.data.date)}
        </time>
      </p>
    </header>

    <div class="glossary-content prose">
      <Content />
    </div>

    <div class="glossary-related">
      <RelatedContent title="Articles liés" items={relatedArticles} />
      <RelatedContent title="Chantiers liés" items={relatedChantiers} />
    </div>
  </article>
</BaseLayout>

<style>
  .glossary-page {
    padding: 40px 0 80px;
    max-width: var(--content-max);
  }
  .back-link {
    display: inline-block;
    font-family: var(--mono);
    font-size: 0.85rem;
    color: var(--ink-3);
    text-decoration: none;
    margin-bottom: 32px;
    padding: 6px 10px;
    border-radius: 6px;
  }
  .back-link:hover {
    color: var(--accent);
    background: var(--accent-soft);
  }
  .glossary-header {
    padding-bottom: 32px;
    border-bottom: 1px solid var(--hairline);
    margin-bottom: 32px;
  }
  .difficulty {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 999px;
    font-family: var(--mono);
    font-size: 0.72rem;
    font-weight: 500;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    margin-bottom: 16px;
  }
  .difficulty--debutant { background: rgba(16, 185, 129, 0.12); color: var(--green); }
  .difficulty--intermediaire { background: var(--accent-soft); color: var(--accent); }
  .difficulty--expert { background: rgba(244, 63, 94, 0.10); color: var(--rose); }
  .glossary-title {
    font-family: var(--display);
    font-size: clamp(1.8rem, 5vw, 2.8rem);
    font-weight: 800;
    letter-spacing: -0.025em;
    line-height: 1.15;
    color: var(--ink);
  }
  .glossary-excerpt {
    margin-top: 16px;
    font-size: 1.15rem;
    color: var(--ink-3);
    line-height: 1.5;
  }
  .glossary-date {
    margin-top: 18px;
    font-family: var(--mono);
    font-size: 0.78rem;
    color: var(--ink-muted);
  }
  .glossary-related {
    margin-top: 48px;
    display: grid;
    gap: 20px;
  }
  @media (min-width: 640px) {
    .glossary-related { grid-template-columns: 1fr 1fr; }
  }

  /* Prose typo identique à ArticleLayout (DRY violation acceptée vu la simplicité) */
  .prose :global(h2) { font-family: var(--display); font-size: 1.4rem; font-weight: 700; margin: 32px 0 12px; color: var(--ink); }
  .prose :global(h3) { font-family: var(--display); font-size: 1.1rem; font-weight: 700; margin: 24px 0 10px; color: var(--ink-2); }
  .prose :global(p) { margin: 14px 0; font-size: 1.02rem; line-height: 1.65; color: var(--ink-2); }
  .prose :global(ul), .prose :global(ol) { margin: 14px 0 14px 22px; color: var(--ink-2); line-height: 1.65; }
  .prose :global(li) { margin: 4px 0; }
  .prose :global(a) { color: var(--accent); text-decoration: underline; text-underline-offset: 3px; }
  .prose :global(strong) { color: var(--ink); font-weight: 600; }
  .prose :global(table) { width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 0.9rem; }
  .prose :global(th), .prose :global(td) { padding: 8px 12px; text-align: left; border-bottom: 1px solid var(--hairline); }
  .prose :global(th) { background: var(--bg-alt); font-weight: 600; }
</style>
```

---

### Task 17 : `src/pages/chantiers/[...slug].astro`

**Files :**
- Create : `src/pages/chantiers/[...slug].astro`

- [ ] **Step 1 : Fiche chantier**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getCollection, render } from 'astro:content';
import { publishedOnly, formatDateFR } from '../../lib/content-helpers';

export async function getStaticPaths() {
  const entries = publishedOnly(await getCollection('chantiers'));
  return entries.map((entry) => ({
    params: { slug: entry.id },
    props: { entry },
  }));
}

const { entry } = Astro.props;
const { Content } = await render(entry);
const { title, date, surface, materiel, probleme, lecon, tags } = entry.data;
---

<BaseLayout
  title={title}
  description={`${probleme}. Leçon : ${lecon}`}
>
  <article class="container chantier-page">
    <a href="/chantiers/" class="back-link">← Retour aux chantiers</a>

    <header class="chantier-header">
      <span class="chantier-eyebrow">Retour de chantier</span>
      <h1 class="chantier-title">{title}</h1>

      <dl class="chantier-meta">
        <div>
          <dt>Date</dt>
          <dd><time datetime={date.toISOString()}>{formatDateFR(date)}</time></dd>
        </div>
        {surface && (
          <div>
            <dt>Surface</dt>
            <dd>{surface}</dd>
          </div>
        )}
        {materiel.length > 0 && (
          <div>
            <dt>Matériel</dt>
            <dd>
              <ul class="materiel-list">
                {materiel.map((m) => <li>{m}</li>)}
              </ul>
            </dd>
          </div>
        )}
      </dl>

      <div class="chantier-summary">
        <div class="summary-card summary-card--probleme">
          <p class="summary-label">Le problème</p>
          <p class="summary-text">{probleme}</p>
        </div>
        <div class="summary-card summary-card--lecon">
          <p class="summary-label">La leçon</p>
          <p class="summary-text">{lecon}</p>
        </div>
      </div>
    </header>

    <div class="chantier-content prose">
      <Content />
    </div>

    {tags.length > 0 && (
      <footer class="chantier-tags">
        {tags.map((tag) => <span class="chantier-tag">#{tag}</span>)}
      </footer>
    )}
  </article>
</BaseLayout>

<style>
  .chantier-page {
    padding: 40px 0 80px;
    max-width: var(--content-max);
  }
  .back-link {
    display: inline-block;
    font-family: var(--mono);
    font-size: 0.85rem;
    color: var(--ink-3);
    text-decoration: none;
    margin-bottom: 32px;
    padding: 6px 10px;
    border-radius: 6px;
  }
  .back-link:hover {
    color: var(--amber);
    background: var(--bg-warm);
  }
  .chantier-eyebrow {
    font-family: var(--mono);
    font-size: 0.78rem;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--amber);
  }
  .chantier-title {
    margin-top: 14px;
    font-family: var(--display);
    font-size: clamp(1.8rem, 5vw, 2.8rem);
    font-weight: 800;
    letter-spacing: -0.025em;
    line-height: 1.15;
    color: var(--ink);
  }
  .chantier-meta {
    margin-top: 28px;
    display: grid;
    gap: 16px;
    padding: 20px;
    background: var(--bg-warm);
    border: 1px solid var(--hairline);
    border-radius: 12px;
  }
  .chantier-meta dt {
    font-family: var(--mono);
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--ink-muted);
    margin-bottom: 4px;
  }
  .chantier-meta dd {
    font-size: 0.95rem;
    color: var(--ink-2);
  }
  .materiel-list {
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .materiel-list li {
    padding: 3px 9px;
    background: var(--surface);
    border: 1px solid var(--hairline);
    border-radius: 6px;
    font-size: 0.85rem;
  }
  .chantier-summary {
    margin-top: 28px;
    display: grid;
    gap: 16px;
  }
  .summary-card {
    padding: 18px 20px;
    border-radius: 12px;
    border-left: 3px solid;
  }
  .summary-card--probleme {
    background: rgba(244, 63, 94, 0.06);
    border-color: var(--rose);
  }
  .summary-card--lecon {
    background: rgba(16, 185, 129, 0.06);
    border-color: var(--green);
  }
  .summary-label {
    font-family: var(--mono);
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--ink-muted);
    margin-bottom: 6px;
  }
  .summary-text {
    font-size: 1rem;
    color: var(--ink-2);
    line-height: 1.5;
  }
  .chantier-content {
    margin-top: 40px;
  }
  .chantier-tags {
    margin-top: 48px;
    padding-top: 24px;
    border-top: 1px solid var(--hairline);
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .chantier-tag {
    font-family: var(--mono);
    font-size: 0.8rem;
    color: var(--ink-muted);
  }
  @media (min-width: 640px) {
    .chantier-summary { grid-template-columns: 1fr 1fr; }
  }

  /* Prose typo (idem glossaire) */
  .prose :global(h2) { font-family: var(--display); font-size: 1.4rem; font-weight: 700; margin: 32px 0 12px; color: var(--ink); }
  .prose :global(h3) { font-family: var(--display); font-size: 1.1rem; font-weight: 700; margin: 24px 0 10px; color: var(--ink-2); }
  .prose :global(p) { margin: 14px 0; font-size: 1.02rem; line-height: 1.65; color: var(--ink-2); }
  .prose :global(ul), .prose :global(ol) { margin: 14px 0 14px 22px; color: var(--ink-2); line-height: 1.65; }
  .prose :global(li) { margin: 4px 0; }
  .prose :global(a) { color: var(--accent); text-decoration: underline; text-underline-offset: 3px; }
  .prose :global(strong) { color: var(--ink); font-weight: 600; }
</style>
```

- [ ] **Build de vérification**

```powershell
npm run build
```

Expected : 3 articles + 8 glossaire + 2 chantiers rendus + sitemap.

---

## Sous-phase 3.E — Home

### Task 18 : Refonte `src/pages/index.astro`

**Files :**
- Modify : `src/pages/index.astro` (remplace la page de démo Phase 1)

- [ ] **Step 1 : Hero massif + sections teaser**

Structure :
1. Hero plein écran avec Onde sortante (Logo onde) + titre clamp(36px, 8vw, 88px) + sub + CTA
2. Section "Derniers articles" — 3 cards les plus récentes
3. Section "Glossaire teaser" — 3 cards aléatoires du glossaire
4. Section "Chantiers" — les 2 chantiers (sur 1 ligne desktop)
5. Section "Minute topo" — 3 dernières en feed compact
6. CTA newsletter (placeholder Phase 4)

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Logo from '../components/Logo.astro';
import ArticleCard from '../components/ArticleCard.astro';
import GlossaryCard from '../components/GlossaryCard.astro';
import ChantierCard from '../components/ChantierCard.astro';
import MinuteTopoCard from '../components/MinuteTopoCard.astro';
import { getCollection } from 'astro:content';
import { sortByDateDesc, publishedOnly } from '../lib/content-helpers';

const articles = sortByDateDesc(publishedOnly(await getCollection('articles'))).slice(0, 3);
const glossaire = publishedOnly(await getCollection('glossaire'))
  .sort(() => Math.random() - 0.5)
  .slice(0, 3);
const chantiers = sortByDateDesc(publishedOnly(await getCollection('chantiers')));
const minutes = sortByDateDesc(publishedOnly(await getCollection('minute-topo'))).slice(0, 3);
---

<BaseLayout
  title="Topolia"
  description="La topographie moderne, sans filtre. Tutoriels, comparatifs, retours terrain — LiDAR, drone, photogrammétrie."
>
  <!-- Hero -->
  <section class="hero">
    <div class="container hero-grid">
      <div class="hero-text">
        <p class="hero-eyebrow">Topographie moderne · sans filtre</p>
        <h1 class="hero-title">
          La topo, <span class="hero-accent">comme tu la fais vraiment.</span>
        </h1>
        <p class="hero-sub">
          Scanner statique, scanner dynamique, LiDAR drone, photogrammétrie.
          Tutoriels qui marchent, comparatifs honnêtes, chantiers anonymisés
          que les cabinets ne publient pas.
        </p>
        <div class="hero-cta">
          <a href="/articles/" class="btn btn--primary">Lire les articles</a>
          <a href="/glossaire/" class="btn btn--secondary">Explorer le glossaire</a>
        </div>
      </div>
      <div class="hero-visual">
        <Logo variant="mark" size={240} animClass="onde" />
      </div>
    </div>
  </section>

  <!-- Derniers articles -->
  <section class="home-section">
    <div class="container">
      <header class="home-section-header">
        <h2>Derniers articles</h2>
        <a href="/articles/" class="see-all">Voir tous →</a>
      </header>
      <div class="cards-grid cards-grid--articles">
        {articles.map((entry) => <ArticleCard entry={entry} />)}
      </div>
    </div>
  </section>

  <!-- Glossaire teaser -->
  <section class="home-section home-section--alt">
    <div class="container">
      <header class="home-section-header">
        <h2>Glossaire <span class="muted">— pour s'y retrouver</span></h2>
        <a href="/glossaire/" class="see-all">Tout le glossaire →</a>
      </header>
      <div class="cards-grid cards-grid--glossary">
        {glossaire.map((entry) => <GlossaryCard entry={entry} />)}
      </div>
    </div>
  </section>

  <!-- Chantiers -->
  <section class="home-section">
    <div class="container">
      <header class="home-section-header">
        <h2>Chantiers <span class="muted">anonymisés</span></h2>
        <a href="/chantiers/" class="see-all">Tous les chantiers →</a>
      </header>
      <div class="cards-grid cards-grid--chantiers">
        {chantiers.map((entry) => <ChantierCard entry={entry} />)}
      </div>
    </div>
  </section>

  <!-- Minute topo -->
  <section class="home-section home-section--alt">
    <div class="container">
      <header class="home-section-header">
        <h2>Minute topo <span class="muted">— une astuce par semaine</span></h2>
        <a href="/minute-topo/" class="see-all">Le feed complet →</a>
      </header>
      <div class="minute-feed">
        {minutes.map((entry) => <MinuteTopoCard entry={entry} />)}
      </div>
    </div>
  </section>

  <!-- Newsletter teaser -->
  <section class="newsletter-cta">
    <div class="container">
      <div class="newsletter-inner">
        <h2>Reste à jour</h2>
        <p>Un email par semaine : le nouvel article, une astuce, un retour terrain. Pas de bruit, pas de spam.</p>
        <p class="newsletter-note">Newsletter active en Phase 4 — patience.</p>
      </div>
    </div>
  </section>
</BaseLayout>

<style>
  /* ── Hero ── */
  .hero {
    padding: 80px 0 60px;
    overflow: hidden;
  }
  .hero-grid {
    display: grid;
    gap: 48px;
    align-items: center;
  }
  .hero-eyebrow {
    font-family: var(--mono);
    font-size: 0.85rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 20px;
  }
  .hero-title {
    font-family: var(--display);
    font-size: clamp(2.2rem, 8vw, 5rem);
    font-weight: 800;
    letter-spacing: -0.035em;
    line-height: 1.02;
    color: var(--ink);
  }
  .hero-accent {
    background: var(--accent-grad);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .hero-sub {
    margin-top: 24px;
    font-size: 1.15rem;
    color: var(--ink-3);
    max-width: 560px;
    line-height: 1.55;
  }
  .hero-cta {
    margin-top: 36px;
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    min-height: 48px;
    padding: 12px 22px;
    border-radius: 10px;
    font-weight: 600;
    font-size: 0.95rem;
    text-decoration: none;
    transition:
      transform 0.15s,
      box-shadow 0.15s,
      background 0.15s;
  }
  .btn--primary {
    background: var(--ink);
    color: var(--surface);
  }
  .btn--primary:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
  .btn--secondary {
    background: transparent;
    color: var(--ink-2);
    border: 1px solid var(--hairline-strong);
  }
  .btn--secondary:hover {
    background: var(--bg-alt);
  }
  .hero-visual {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  /* ── Sections home ── */
  .home-section {
    padding: 64px 0;
  }
  .home-section--alt {
    background: var(--bg-alt);
  }
  .home-section-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 32px;
  }
  .home-section-header h2 {
    font-family: var(--display);
    font-size: clamp(1.5rem, 3.5vw, 2.1rem);
    font-weight: 800;
    letter-spacing: -0.025em;
    color: var(--ink);
  }
  .muted {
    color: var(--ink-muted);
    font-weight: 500;
  }
  .see-all {
    font-family: var(--mono);
    font-size: 0.85rem;
    color: var(--accent);
    text-decoration: none;
  }
  .see-all:hover {
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .cards-grid {
    display: grid;
    gap: 20px;
  }
  .cards-grid--articles { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
  .cards-grid--glossary { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
  .cards-grid--chantiers { grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
  .minute-feed {
    display: flex;
    flex-direction: column;
    gap: 14px;
    max-width: var(--content-max);
    margin-inline: auto;
  }

  /* ── Newsletter ── */
  .newsletter-cta {
    padding: 80px 0;
    background: var(--bg-dark);
    color: var(--surface);
  }
  .newsletter-inner {
    text-align: center;
    max-width: 600px;
    margin-inline: auto;
  }
  .newsletter-inner h2 {
    font-family: var(--display);
    font-size: clamp(1.6rem, 4vw, 2.4rem);
    font-weight: 800;
    letter-spacing: -0.025em;
  }
  .newsletter-inner p {
    margin-top: 16px;
    color: var(--ink-light);
    font-size: 1.05rem;
    line-height: 1.55;
  }
  .newsletter-note {
    margin-top: 24px;
    font-family: var(--mono);
    font-size: 0.8rem;
    color: var(--ink-muted);
    font-style: italic;
  }

  @media (min-width: 900px) {
    .hero-grid {
      grid-template-columns: 1.5fr 1fr;
      gap: 80px;
    }
  }
</style>
```

---

## Sous-phase 3.F — À propos

### Task 19 : `src/pages/a-propos.astro`

**Files :**
- Create : `src/pages/a-propos.astro`

- [ ] **Step 1 : Page à propos**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Logo from '../components/Logo.astro';
---

<BaseLayout
  title="À propos"
  description="Pourquoi Topolia existe, qui je suis, et ce que tu vas trouver ici."
>
  <section class="container apropos-page">
    <header class="apropos-header">
      <Logo variant="mark" size={120} animClass="sonar" />
      <p class="eyebrow">À propos</p>
      <h1 class="apropos-title">
        Topolia, c'est <span class="accent">quoi exactement ?</span>
      </h1>
    </header>

    <div class="apropos-content prose">
      <h2>L'idée de départ</h2>
      <p>
        Quand j'ai commencé la topo en 2018, j'ai galéré à trouver du contenu sérieux
        en français sur les scanners laser, le LiDAR drone et la photogrammétrie.
        Beaucoup de marketing constructeur, peu de retours terrain honnêtes,
        encore moins de tutoriels qui marchent vraiment quand tu es sur un chantier.
      </p>
      <p>
        Topolia, c'est l'inverse. Du contenu écrit par quelqu'un qui fait le métier,
        pour des gens qui le font. Avec des chiffres réels, des erreurs assumées,
        et des outils qu'on utilise vraiment.
      </p>

      <h2>Qui je suis</h2>
      <p>
        Loïc, topographe indépendant basé à Rennes. Six ans de terrain avec scanner
        statique (Leica RTC360 principalement), backpack LiDAR (BLK2GO) et drone
        photogrammétrie / LiDAR (Matrice 4E + Zenmuse L2).
      </p>
      <p>
        En parallèle, je développe deux applis qui me servent au quotidien :
        <strong>Topolia Scan</strong> (iOS, en beta) et <strong>Topolia Desktop</strong>
        (Windows pro, en cours). Le site est la vitrine éditoriale qui supporte
        ces produits — mais surtout, c'est l'endroit où je partage ce que j'apprends.
      </p>

      <h2>Ce que tu trouves ici</h2>
      <ul>
        <li>
          <strong>Articles tutoriels et comparatifs</strong> — workflows complets,
          tests matériel, méthodes terrain. Un nouveau par semaine.
        </li>
        <li>
          <strong>Glossaire</strong> — les termes du métier, expliqués clairement.
          De LiDAR à COPC en passant par SLAM et RTK.
        </li>
        <li>
          <strong>Chantiers anonymisés</strong> — vrais projets, vrais problèmes,
          vraies leçons. Ce que les cabinets ne publient jamais.
        </li>
        <li>
          <strong>Minute topo</strong> — une astuce ultra-courte par semaine,
          moins de 3 minutes de lecture.
        </li>
      </ul>

      <h2>Ce que tu ne trouves pas</h2>
      <ul>
        <li>Du marketing déguisé en article</li>
        <li>Des tutoriels copiés-collés sans avoir testé l'outil</li>
        <li>Du jargon pour faire savant — sauf si le terme est vraiment nécessaire</li>
        <li>Le tutoiement corporate « vous » qui rend tout contenu sans saveur</li>
      </ul>

      <h2>Et après ?</h2>
      <p>
        En V2, des formations payantes pour aller au-delà du blog. Quand il y aura
        assez de contenu gratuit pour valider l'intérêt. Pas avant.
      </p>
      <p>
        En V3, peut-être un viewer web pour partager des nuages de points avec
        tes clients. Mais on n'y est pas encore.
      </p>

      <h2>On reste en contact ?</h2>
      <p>
        La newsletter arrive en Phase 4 du dev. En attendant,
        <a href="/articles/">parcours les articles</a>
        ou <a href="/glossaire/">explore le glossaire</a>.
      </p>
    </div>
  </section>
</BaseLayout>

<style>
  .apropos-page {
    padding: 60px 0 80px;
    max-width: var(--content-max);
  }
  .apropos-header {
    text-align: center;
    margin-bottom: 56px;
  }
  .eyebrow {
    margin-top: 24px;
    font-family: var(--mono);
    font-size: 0.8rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 14px;
  }
  .apropos-title {
    font-family: var(--display);
    font-size: clamp(1.8rem, 5vw, 3rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.1;
    color: var(--ink);
  }
  .accent {
    background: var(--accent-grad);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .apropos-content {
    margin-top: 40px;
  }
  .prose h2 {
    font-family: var(--display);
    font-size: 1.5rem;
    font-weight: 700;
    margin: 48px 0 14px;
    color: var(--ink);
  }
  .prose p {
    margin: 14px 0;
    font-size: 1.05rem;
    line-height: 1.7;
    color: var(--ink-2);
  }
  .prose ul {
    margin: 18px 0 18px 22px;
    color: var(--ink-2);
    line-height: 1.7;
  }
  .prose li {
    margin: 8px 0;
  }
  .prose a {
    color: var(--accent);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .prose strong {
    color: var(--ink);
    font-weight: 600;
  }
</style>
```

---

## Sous-phase 3.G — Nettoyage + commit

### Task 20 : Supprimer `debug-content.astro`

**Files :**
- Delete : `src/pages/debug-content.astro`

- [ ] **Step 1 : Suppression**

```powershell
Remove-Item src/pages/debug-content.astro
```

---

### Task 21 : Vérification finale

- [ ] **Step 1 : Build complet**

```powershell
npm run build
```

Expected : ~25 pages au total :
- 1 home
- 1 articles/index
- 7 articles/c/[cat]
- 3 articles/[slug]
- 1 glossaire/index
- 8 glossaire/[slug]
- 1 chantiers/index
- 2 chantiers/[slug]
- 1 minute-topo/index
- 1 a-propos
- + sitemap

- [ ] **Step 2 : Lint + format**

```powershell
npx eslint . ; npx prettier --check .
```

Expected : 0 erreur, 0 warning.

- [ ] **Step 3 : Dev server visuel**

```powershell
npm run dev
```

Vérifier dans le navigateur (`http://localhost:4321`) :
- `/` — hero + 4 sections
- `/articles/` — liste 3 articles + filtres
- `/articles/c/tutoriels/` — 2 articles (workflow + pdal)
- `/articles/workflow-drone-complet/` — page article avec TOC, AuthorBio, Related
- `/glossaire/` — index alphabétique avec navigation A-Z
- `/glossaire/lidar/` — fiche glossaire
- `/chantiers/` — 2 chantiers
- `/chantiers/facade-haussmannien/` — fiche chantier avec dl meta + summary cards
- `/minute-topo/` — feed 2 minutes
- `/a-propos/` — page à propos

---

### Task 22 : Commit Phase 3

- [ ] **Step 1 : Commit**

```powershell
git add -A
git -c user.email=loicdu27620@gmail.com -c user.name=Loic commit -m "feat(phase3): pages clés — home, listings, détails, à propos"
```

Expected : hook Husky passe (ESLint+Prettier sur .ts/.astro, agent orthographe sur .mdx — mais aucun .mdx modifié dans cette phase).

- [ ] **Step 2 : Mise à jour CLAUDE.md état d'avancement**

Mettre Phase 3 à ✅ dans le tableau d'avancement.

```
| Phase 3 — Pages clés | ✅ | Home, listings, détails, à propos — 25 pages générées |
```

- [ ] **Step 3 : Commit de l'update CLAUDE.md**

```powershell
git add CLAUDE.md
git -c user.email=loicdu27620@gmail.com -c user.name=Loic commit -m "docs: mise à jour CLAUDE.md — Phase 3 terminée"
```

---

## Self-review du plan

✅ **Couverture spec §11 Phase 3** :
- Home ✅ (Task 18)
- Article type avec layout 3 colonnes + author bio + related ✅ (Task 4-8, 15)
- Liste articles avec filtres ✅ (Task 9-10, 10b)
- Glossaire index avec recherche alphabétique ✅ (Task 11, 12)
- Fiche glossaire ✅ (Task 16)
- Chantiers index ✅ (Task 13)
- Fiche chantier ✅ (Task 17)
- Minute topo feed ✅ (Task 14)
- À propos ✅ (Task 19)

✅ **Architecture brief §7** :
- ArticleCard, ArticleHeader, AuthorBio, TableOfContents, ProgressBar — tous prévus
- Tous les composants `src/components/mdx/` existants (Callout, CodeBlock…) sont rendus dans ArticleLayout via `<Content />`

✅ **Responsive §14** :
- Breakpoints 640/900/1080/1280 respectés
- Mobile-first : layouts en colonne unique par défaut, grilles à partir de 900px
- Targets tactiles 44×44px sur cat-chip, btn, back-link

✅ **Tutoiement §1** :
- Tout le copy utilise "tu" (vérifié dans hero, sub, apropos)

⚠️ **Points d'attention** :
- Les heroImages des articles pointent vers `/images/articles/*.jpg` qui n'existent pas → l'`<img>` rendra "broken image" en attendant. On verra à la fin de Phase 3 si on ajoute des images placeholder.
- La page `/articles/?cat=X` était initialement prévue avec query param, remplacée par routes statiques `/articles/c/[cat]/`. Plus SSG-friendly, recommandation maintenue.
