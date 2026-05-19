# Phase 2 — Content collections & MDX

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Mettre en place les 4 content collections (articles, glossaire, chantiers, minute-topo) avec leurs schémas Zod, créer les composants MDX (Callout, CodeBlock, Figure, PullQuote, CompareTable) et les cards (GlossaryCard, ChantierCard, MinuteTopoCard), puis produire un jeu de contenu de démo réaliste (~13 entrées).

**Architecture:** Astro Content Collections type `content` (= MDX/MD). Les schémas Zod du brief §8 sont la source de vérité. Les composants MDX sont importés explicitement dans chaque `.mdx` (pattern clair et explicite, pas de magie globale). Les cards consomment `CollectionEntry<...>` typé et sont réutilisées plus tard en Phase 3 pour les listings.

**Tech Stack:** Astro Content Collections, Zod, MDX, TypeScript strict.

---

## Structure des fichiers à créer

```
src/
├── content/
│   ├── config.ts                            — 4 schémas Zod (§8.5 du brief)
│   ├── articles/                            — 3 articles MDX de démo
│   │   ├── workflow-drone-complet.mdx
│   │   ├── rtc360-vs-faro-focus.mdx
│   │   └── pdal-introduction.mdx
│   ├── glossaire/                           — 8 fiches MDX de démo
│   │   ├── copc.mdx
│   │   ├── lidar.mdx
│   │   ├── photogrammetrie.mdx
│   │   ├── nuage-de-points.mdx
│   │   ├── recalage.mdx
│   │   ├── slam.mdx
│   │   ├── gcp.mdx
│   │   └── rtk.mdx
│   ├── chantiers/                           — 2 chantiers MDX de démo
│   │   ├── facade-haussmannien.mdx
│   │   └── batiment-industriel-rennes.mdx
│   └── minute-topo/                         — 2 minutes topo MDX
│       ├── drift-50m.mdx
│       └── cloudcompare-export-rapide.mdx
├── lib/
│   └── reading-time.ts                      — utilitaire calcul temps de lecture
└── components/
    ├── mdx/                                 — composants disponibles dans MDX
    │   ├── Callout.astro                    — info | warning | tip | success
    │   ├── CodeBlock.astro                  — bloc code stylé (au-dessus du syntax-highlight Shiki)
    │   ├── Figure.astro                     — image + légende
    │   ├── PullQuote.astro                  — citation accent
    │   └── CompareTable.astro               — tableau comparatif 2 ou 3 colonnes
    ├── GlossaryCard.astro                   — carte fiche glossaire
    ├── ChantierCard.astro                   — carte chantier anonymisé
    └── MinuteTopoCard.astro                 — carte minute topo (compacte)
```

**Note Phase 3 :** Le rendu effectif des pages (`articles/[slug].astro`, listings, etc.) vient en Phase 3. Phase 2 valide uniquement via `npm run build` que les schémas Zod acceptent le contenu créé.

---

## Task 1 : Schémas Zod — `src/content/config.ts`

**Files :**
- Create : `src/content/config.ts`

- [ ] **Step 1 : Reprendre exactement les 4 schémas du brief §8.5**

```ts
import { defineCollection, z } from 'astro:content';

const articles = defineCollection({
  type: 'content',
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
  type: 'content',
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
  type: 'content',
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
  type: 'content',
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
```

- [ ] **Step 2 : `npm run build`** — doit échouer proprement avec "no entries found" pour chaque collection. C'est attendu : on n'a pas encore de contenu.

---

## Task 2 : Utilitaire `src/lib/reading-time.ts`

**Files :**
- Create : `src/lib/reading-time.ts`

Calcule un temps de lecture (en minutes) à partir du body brut. Vitesse de lecture FR moyenne ≈ 200 mots/min.

```ts
const WORDS_PER_MINUTE = 200;

export function readingTime(text: string): number {
  const cleaned = text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const words = cleaned ? cleaned.split(' ').length : 0;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

export function formatReadingTime(minutes: number): string {
  return `${minutes} min de lecture`;
}
```

---

## Task 3 : Composants MDX

**Files :**
- Create : `src/components/mdx/Callout.astro`
- Create : `src/components/mdx/CodeBlock.astro`
- Create : `src/components/mdx/Figure.astro`
- Create : `src/components/mdx/PullQuote.astro`
- Create : `src/components/mdx/CompareTable.astro`

### Callout.astro

Variants : `info` (bleu accent), `warning` (amber), `tip` (green), `success` (green plein).
Barre de gauche colorée, fond doux, icône emoji minimaliste.

```astro
---
interface Props {
  type?: 'info' | 'warning' | 'tip' | 'success';
  title?: string;
}
const { type = 'info', title } = Astro.props;

const icons: Record<string, string> = {
  info: 'ⓘ',
  warning: '⚠',
  tip: '✦',
  success: '✓',
};
---

<aside class:list={['callout', `callout--${type}`]} role="note">
  <span class="callout-icon" aria-hidden="true">{icons[type]}</span>
  <div class="callout-body">
    {title && <p class="callout-title">{title}</p>}
    <div class="callout-content"><slot /></div>
  </div>
</aside>

<style>
  .callout {
    display: flex;
    gap: 14px;
    padding: 16px 18px;
    border-radius: 10px;
    border-left: 3px solid;
    margin: 24px 0;
    font-size: 0.95rem;
    line-height: 1.55;
  }
  .callout-icon {
    font-size: 1.15rem;
    line-height: 1.4;
    flex-shrink: 0;
  }
  .callout-title {
    font-weight: 600;
    margin-bottom: 4px;
    color: var(--ink);
  }
  .callout-content :global(p) { margin: 0; }
  .callout-content :global(p + p) { margin-top: 8px; }
  .callout-content :global(a) {
    color: var(--accent);
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .callout--info {
    background: var(--accent-soft);
    border-color: var(--accent);
    color: var(--ink-2);
  }
  .callout--warning {
    background: rgba(245, 158, 11, 0.08);
    border-color: var(--amber);
    color: var(--ink-2);
  }
  .callout--tip {
    background: rgba(16, 185, 129, 0.08);
    border-color: var(--green);
    color: var(--ink-2);
  }
  .callout--success {
    background: var(--green);
    border-color: var(--green);
    color: var(--surface);
  }
  .callout--success .callout-title { color: var(--surface); }
</style>
```

### CodeBlock.astro

Wrapper qui ajoute un header (langage + bouton copier) au-dessus du `<pre>` Shiki d'Astro. Pour MDX, on s'en sert via `<CodeBlock lang="bash">...</CodeBlock>` ou on laisse les fences markdown classiques (qui passent par Shiki natif).

```astro
---
interface Props {
  lang?: string;
  filename?: string;
}
const { lang = 'text', filename } = Astro.props;
---

<figure class="code-block">
  <header class="code-block-header">
    {filename ? (
      <span class="code-filename">{filename}</span>
    ) : (
      <span class="code-lang">{lang}</span>
    )}
  </header>
  <div class="code-block-body"><slot /></div>
</figure>

<style>
  .code-block {
    margin: 24px 0;
    border: 1px solid var(--hairline);
    border-radius: 10px;
    overflow: hidden;
    background: var(--bg-dark);
  }
  .code-block-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 14px;
    background: var(--bg-dark-2);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
  .code-filename,
  .code-lang {
    font-family: var(--mono);
    font-size: 0.75rem;
    color: var(--ink-light);
    letter-spacing: 0.02em;
  }
  .code-block-body :global(pre) {
    margin: 0;
    padding: 16px 18px;
    background: transparent !important;
    font-family: var(--mono);
    font-size: 0.875rem;
    line-height: 1.55;
    overflow-x: auto;
  }
</style>
```

### Figure.astro

```astro
---
interface Props {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
}
const { src, alt, caption, width, height } = Astro.props;
---

<figure class="figure">
  <img src={src} alt={alt} width={width} height={height} loading="lazy" decoding="async" />
  {caption && <figcaption class="figure-caption">{caption}</figcaption>}
</figure>

<style>
  .figure {
    margin: 32px 0;
  }
  .figure img {
    width: 100%;
    height: auto;
    border-radius: 10px;
    border: 1px solid var(--hairline);
  }
  .figure-caption {
    margin-top: 10px;
    font-size: 0.875rem;
    color: var(--ink-muted);
    text-align: center;
    font-style: italic;
  }
</style>
```

### PullQuote.astro

```astro
---
interface Props {
  cite?: string;
}
const { cite } = Astro.props;
---

<blockquote class="pull-quote">
  <p class="pull-quote-text"><slot /></p>
  {cite && <footer class="pull-quote-cite">— {cite}</footer>}
</blockquote>

<style>
  .pull-quote {
    margin: 40px 0;
    padding: 24px 28px;
    border-left: 4px solid var(--accent);
    background: var(--bg-alt);
    border-radius: 0 12px 12px 0;
  }
  .pull-quote-text {
    font-family: var(--display);
    font-size: 1.35rem;
    font-weight: 500;
    line-height: 1.45;
    letter-spacing: -0.01em;
    color: var(--ink-2);
  }
  .pull-quote-cite {
    margin-top: 12px;
    font-size: 0.9rem;
    color: var(--ink-muted);
  }
</style>
```

### CompareTable.astro

Tableau structuré via props pour rester typé. Pour usage MDX classique on peut aussi passer en slot, mais une API explicite est plus lisible.

```astro
---
interface Row {
  feature: string;
  values: string[];
}
interface Props {
  columns: string[];
  rows: Row[];
}
const { columns, rows } = Astro.props;
---

<div class="compare-wrap">
  <table class="compare-table">
    <thead>
      <tr>
        <th></th>
        {columns.map((col) => <th>{col}</th>)}
      </tr>
    </thead>
    <tbody>
      {rows.map((row) => (
        <tr>
          <th scope="row">{row.feature}</th>
          {row.values.map((v) => <td>{v}</td>)}
        </tr>
      ))}
    </tbody>
  </table>
</div>

<style>
  .compare-wrap {
    margin: 32px 0;
    overflow-x: auto;
    border: 1px solid var(--hairline);
    border-radius: 10px;
  }
  .compare-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }
  .compare-table th,
  .compare-table td {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid var(--hairline);
  }
  .compare-table thead th {
    background: var(--bg-alt);
    font-weight: 600;
    color: var(--ink-2);
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .compare-table tbody th[scope="row"] {
    font-weight: 600;
    color: var(--ink-2);
    background: var(--bg);
  }
  .compare-table tbody tr:last-child th,
  .compare-table tbody tr:last-child td {
    border-bottom: none;
  }
</style>
```

- [ ] **Vérifier build**

```powershell
npm run build
```

Build attendu : toujours en erreur "no entries" (normal jusqu'à Task 6+).

---

## Task 4 : Cards — `GlossaryCard`, `ChantierCard`, `MinuteTopoCard`

**Files :**
- Create : `src/components/GlossaryCard.astro`
- Create : `src/components/ChantierCard.astro`
- Create : `src/components/MinuteTopoCard.astro`

### GlossaryCard.astro

```astro
---
import type { CollectionEntry } from 'astro:content';

interface Props {
  entry: CollectionEntry<'glossaire'>;
}
const { entry } = Astro.props;
const { title, difficulty, excerpt } = entry.data;

const difficultyLabel: Record<typeof difficulty, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  expert: 'Expert',
};
---

<a href={`/glossaire/${entry.slug}/`} class="glossary-card">
  <span class:list={['difficulty', `difficulty--${difficulty}`]}>
    {difficultyLabel[difficulty]}
  </span>
  <h3 class="glossary-title">{title}</h3>
  <p class="glossary-excerpt">{excerpt}</p>
  <span class="glossary-link">Lire la définition →</span>
</a>

<style>
  .glossary-card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 24px;
    background: var(--surface);
    border: 1px solid var(--hairline);
    border-radius: 12px;
    text-decoration: none;
    transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
  }
  .glossary-card:hover {
    border-color: var(--accent);
    box-shadow: var(--shadow-md);
    transform: translateY(-1px);
  }
  .difficulty {
    align-self: flex-start;
    padding: 3px 9px;
    border-radius: 999px;
    font-family: var(--mono);
    font-size: 0.7rem;
    font-weight: 500;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .difficulty--debutant { background: rgba(16, 185, 129, 0.12); color: var(--green); }
  .difficulty--intermediaire { background: var(--accent-soft); color: var(--accent); }
  .difficulty--expert { background: rgba(244, 63, 94, 0.10); color: var(--rose); }
  .glossary-title {
    font-family: var(--display);
    font-size: 1.15rem;
    font-weight: 700;
    letter-spacing: -0.01em;
    color: var(--ink);
    line-height: 1.3;
  }
  .glossary-excerpt {
    font-size: 0.9rem;
    color: var(--ink-3);
    line-height: 1.5;
  }
  .glossary-link {
    margin-top: auto;
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--accent);
  }
</style>
```

### ChantierCard.astro

```astro
---
import type { CollectionEntry } from 'astro:content';

interface Props {
  entry: CollectionEntry<'chantiers'>;
}
const { entry } = Astro.props;
const { title, surface, materiel, tags } = entry.data;
---

<a href={`/chantiers/${entry.slug}/`} class="chantier-card">
  <header class="chantier-header">
    <span class="chantier-eyebrow">Retour de chantier</span>
    {surface && <span class="chantier-surface">{surface}</span>}
  </header>
  <h3 class="chantier-title">{title}</h3>
  {materiel.length > 0 && (
    <ul class="chantier-materiel">
      {materiel.slice(0, 3).map((m) => <li>{m}</li>)}
    </ul>
  )}
  {tags.length > 0 && (
    <ul class="chantier-tags">
      {tags.map((tag) => <li>#{tag}</li>)}
    </ul>
  )}
</a>

<style>
  .chantier-card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 24px;
    background: var(--bg-warm);
    border: 1px solid var(--hairline);
    border-radius: 12px;
    text-decoration: none;
    transition: border-color 0.15s, transform 0.15s;
  }
  .chantier-card:hover {
    border-color: var(--amber);
    transform: translateY(-1px);
  }
  .chantier-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }
  .chantier-eyebrow {
    font-family: var(--mono);
    font-size: 0.7rem;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--amber);
  }
  .chantier-surface {
    font-family: var(--mono);
    font-size: 0.8rem;
    color: var(--ink-muted);
  }
  .chantier-title {
    font-family: var(--display);
    font-size: 1.15rem;
    font-weight: 700;
    letter-spacing: -0.01em;
    color: var(--ink);
    line-height: 1.3;
  }
  .chantier-materiel {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    list-style: none;
  }
  .chantier-materiel li {
    padding: 3px 8px;
    background: var(--surface);
    border: 1px solid var(--hairline);
    border-radius: 6px;
    font-size: 0.75rem;
    color: var(--ink-3);
  }
  .chantier-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    list-style: none;
    margin-top: auto;
  }
  .chantier-tags li {
    font-family: var(--mono);
    font-size: 0.75rem;
    color: var(--ink-muted);
  }
</style>
```

### MinuteTopoCard.astro

Compact, type "tweet" pour le feed.

```astro
---
import type { CollectionEntry } from 'astro:content';

interface Props {
  entry: CollectionEntry<'minute-topo'>;
}
const { entry } = Astro.props;
const { title, date, excerpt, tags } = entry.data;

const formattedDate = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
}).format(date);
---

<article class="minute-card">
  <header class="minute-header">
    <span class="minute-badge">Minute topo</span>
    <time datetime={date.toISOString()}>{formattedDate}</time>
  </header>
  <h3 class="minute-title">{title}</h3>
  <p class="minute-excerpt">{excerpt}</p>
  {tags.length > 0 && (
    <ul class="minute-tags">
      {tags.map((tag) => <li>#{tag}</li>)}
    </ul>
  )}
</article>

<style>
  .minute-card {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 20px 22px;
    background: var(--surface);
    border: 1px solid var(--hairline);
    border-left: 3px solid var(--accent);
    border-radius: 8px;
  }
  .minute-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .minute-badge {
    font-family: var(--mono);
    font-size: 0.7rem;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--accent);
  }
  .minute-header time {
    font-family: var(--mono);
    font-size: 0.75rem;
    color: var(--ink-muted);
  }
  .minute-title {
    font-family: var(--display);
    font-size: 1.05rem;
    font-weight: 700;
    letter-spacing: -0.01em;
    color: var(--ink);
    line-height: 1.35;
  }
  .minute-excerpt {
    font-size: 0.9rem;
    color: var(--ink-3);
    line-height: 1.55;
  }
  .minute-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    list-style: none;
  }
  .minute-tags li {
    font-family: var(--mono);
    font-size: 0.75rem;
    color: var(--ink-muted);
  }
</style>
```

---

## Task 5 : 3 articles MDX de démo

**Files :**
- Create : `src/content/articles/workflow-drone-complet.mdx`
- Create : `src/content/articles/rtc360-vs-faro-focus.mdx`
- Create : `src/content/articles/pdal-introduction.mdx`

Chaque article :
- Frontmatter complet validé par le schéma Zod
- Body MDX avec au moins 1 `<Callout>` et 1 autre composant MDX (au choix : Figure, PullQuote ou CompareTable) pour vérifier le rendu
- Tutoiement systématique (ton brief)
- 600–900 mots minimum pour être réaliste

### Article 1 : `workflow-drone-complet.mdx`

Category `tutoriels`. Couvre le workflow drone → nuage de points (préparation vol, GCP, photogrammétrie Metashape, export).

```mdx
---
title: "Du vol drone au nuage de points : le workflow complet"
subtitle: "Étape par étape, sans raccourci."
date: 2026-05-03
category: "tutoriels"
tags: ["metashape", "drone", "photogrammetrie", "workflow"]
author: "loic"
heroImage: "/images/articles/workflow-drone.jpg"
heroImageAlt: "Drone DJI Mavic 3 Enterprise survolant un chantier de construction"
excerpt: "De la préparation du vol à l'export du nuage de points dense : le workflow drone photogrammétrie complet, sans rien zapper."
isPremium: false
isPublished: true
---

import Callout from '../../components/mdx/Callout.astro';
import PullQuote from '../../components/mdx/PullQuote.astro';

Tu viens d'acheter un drone, ou tu galères avec un workflow qui te donne des résultats inégaux d'un chantier à l'autre. Cet article te détaille toute la chaîne, du briefing client à l'export du nuage de points livrable.

## 1. La préparation du vol — 50 % du job

Si je devais ne garder qu'une leçon de trois ans de drone topo, ce serait celle-là : un mauvais vol ne se rattrape pas en post-traitement. Le calcul photogrammétrique amplifie tes erreurs, il ne les corrige pas.

**Ce que tu prépares avant d'arriver sur site :**

- Un plan de vol avec recouvrement **frontal 80 % / latéral 70 %** minimum sur un terrain plat. Pour du bâti complexe ou de la végétation, monte à 85/75.
- Une grille de **GCP (Ground Control Points)** — au minimum 5 cibles bien réparties, 8 si la surface dépasse l'hectare.
- Une vérification météo : pas de vent > 25 km/h, pas de pluie dans les 2h précédentes (les flaques cassent la photogrammétrie).

<Callout type="warning" title="Le piège du soleil rasant">
Évite les vols entre 17h et 19h en été. Les ombres longues créent des zones noires que Metashape interprète comme du bruit. Vise plutôt entre 10h et 15h, ou alors un ciel uniformément couvert (bonus : pas de surex sur les toits clairs).
</Callout>

## 2. Le vol lui-même

Sur DJI Pilot ou DJI Terra, charge ton plan, vérifie l'orientation du capteur (nadir pour une cartographie classique, oblique à 45° si tu veux du 3D fidèle sur les façades) et lance.

Pendant le vol, surveille trois choses :

1. **L'autonomie** : prévoir une batterie en plus de ce que l'app indique.
2. **La couverture GPS** : sur les vols RTK, ne lance pas tant que tu n'es pas en `FIX`.
3. **Le bon recouvrement** : si tu vois que ton drone "saute" des bandes, arrête et redémarre proprement.

## 3. Traitement Metashape — les bons réglages

Voici un workflow Metashape Pro qui marche à 95 % du temps sans bricolage :

1. **Aligner les photos** → précision `Élevée`, paires `Génériques`, points clés `40 000`, points liens `10 000`.
2. **Importer les GCP**, repérer manuellement les cibles sur 3-4 photos minimum chacun, puis `Optimiser` la caméra.
3. **Construire le nuage dense** → qualité `Élevée`, filtrage `Modéré`. Sur un PC moyen, table sur 4-8h pour 500 photos.
4. **Exporter** en `.las` ou `.laz` pour la suite (CloudCompare, AutoCAD Civil 3D, etc.).

<PullQuote cite="Loïc — Topolia">
La qualité `Très élevée` te fait gagner 5 % de densité pour 4× le temps de calcul. Sauf cas spécifique (relevé patrimonial fin), reste sur `Élevée`.
</PullQuote>

## 4. Contrôle qualité avant livraison

Ne livre jamais sans avoir ouvert le nuage dans CloudCompare et vérifié trois choses :

- **Erreur RMS** sur les GCP : sous 3 cm en planimétrique pour un livrable cadastral.
- **Pas de "trous"** dans la couverture — un toit manquant, c'est immédiatement repéré par le client.
- **Densité homogène** : si une zone est nettement moins dense, c'est probablement un défaut de recouvrement à corriger.

## 5. Et après ?

Le nuage est un livrable, mais c'est rarement le livrable final. Le client attend souvent :

- Une **orthophoto** (Metashape la génère depuis le maillage)
- Un **MNT/MNS** au pas de 5 ou 10 cm
- Parfois un **modèle CAO** sur les bâtiments — c'est là que CloudCompare et AutoCAD prennent le relais

Bon vol.
```

### Article 2 : `rtc360-vs-faro-focus.mdx`

Category `comparatifs`. Comparatif Leica RTC360 vs Faro Focus Premium. Utilise `<CompareTable>`.

```mdx
---
title: "Leica RTC360 vs Faro Focus Premium : le comparatif terrain"
subtitle: "Lequel choisir en 2026 selon ton usage."
date: 2026-04-22
category: "comparatifs"
tags: ["leica", "faro", "scanner-statique", "comparatif"]
author: "loic"
heroImage: "/images/articles/rtc360-vs-faro.jpg"
heroImageAlt: "Scanner Leica RTC360 et Faro Focus Premium côte à côte sur un trépied"
excerpt: "Deux scanners haut de gamme, deux philosophies. Test sur trois chantiers types — façade, intérieur industriel, monument historique."
isPremium: false
isPublished: true
---

import Callout from '../../components/mdx/Callout.astro';
import CompareTable from '../../components/mdx/CompareTable.astro';

Si tu hésites entre le **Leica RTC360** et le **Faro Focus Premium**, c'est que tu es sur un budget 80-120 k€ et que tu vas vivre avec ce scanner les 5 prochaines années. Autant choisir avec les bonnes informations.

J'ai testé les deux sur trois chantiers différents en mars 2026. Voilà ce qui en sort.

## La fiche technique en un tableau

<CompareTable
  columns={['Leica RTC360', 'Faro Focus Premium']}
  rows={[
    { feature: 'Portée', values: ['130 m', '350 m'] },
    { feature: 'Vitesse', values: ['2 M pts/s', '2 M pts/s'] },
    { feature: 'Précision (10 m)', values: ['1,9 mm', '1 mm'] },
    { feature: 'Poids', values: ['5,35 kg', '4,2 kg'] },
    { feature: 'Autonomie batterie', values: ['~ 4 h', '~ 4,5 h'] },
    { feature: 'Prix indicatif', values: ['~ 100 k€', '~ 85 k€'] },
  ]}
/>

Sur le papier, le Faro semble gagnant. Sur le terrain, c'est plus nuancé.

## Test 1 — Façade haussmannien 5 niveaux

**Contexte :** rue parisienne, 25 stations prévues sur 2 demi-journées.

Le RTC360 a un avantage net : la fonction `Visual Inertial System` (VIS) qui pré-recalle les stations en temps réel. Sur ce type de relevé répétitif, je gagne **30 % de temps terrain** vs le Faro.

Le Faro rattrape une partie du retard au bureau : son logiciel `Scene` recale plus rapidement les nuages en post-prod.

<Callout type="info" title="Mon avis sur ce chantier">
Si tu fais beaucoup de relevés urbains où tu enchaînes les stations courtes, le RTC360 te paiera sa différence de prix en gain de temps.
</Callout>

## Test 2 — Intérieur industriel (hangar 5000 m²)

**Contexte :** grand volume, peu d'occlusions, distances longues.

Le Faro prend l'avantage. Sa portée 350 m permet de couvrir le hangar en **8 stations** là où le RTC360 en demande **14**. Sur ce type de chantier, le Faro est plus rentable.

## Test 3 — Monument historique (chapelle XVIIe)

**Contexte :** précision millimétrique requise, beaucoup de détails ornementaux.

Le Faro gagne sur la précision pure (1 mm vs 1,9 mm à 10 m). Mais le RTC360 est plus rapide à mettre en station et à déplacer dans des escaliers étroits — sa poignée intégrée fait la différence sur ce type de chantier.

## Ma recommandation

| Si tu fais surtout... | Choisis... |
|---|---|
| Du relevé urbain rapide, enchaînement de stations | RTC360 |
| De l'industriel, grands volumes, longues portées | Faro Focus Premium |
| Du patrimoine et de la précision pure | Faro Focus Premium |
| Du polyvalent terrain compliqué (escaliers, accès) | RTC360 |

Aucun des deux n'est universellement meilleur. La question juste, c'est **« quel mix de chantiers je fais réellement ? »**.

[DONNÉE TERRAIN LOÏC] — affiner avec les chiffres précis du chantier rue de Rivoli après le bilan d'avril.
```

### Article 3 : `pdal-introduction.mdx`

Category `tutoriels`. Introduction à PDAL (outil CLI ligne de commande LiDAR).

```mdx
---
title: "PDAL : le couteau suisse en ligne de commande pour tes nuages de points"
subtitle: "Filtrer, recaller, convertir — sans GUI."
date: 2026-04-10
category: "tutoriels"
tags: ["pdal", "lidar", "cli", "automation"]
author: "loic"
heroImage: "/images/articles/pdal-intro.jpg"
heroImageAlt: "Capture d'écran d'un terminal exécutant une pipeline PDAL"
excerpt: "PDAL, c'est l'outil que tu n'utilises pas tant que tu n'en as pas besoin — et que tu ne lâches plus une fois que tu l'as adopté."
isPremium: false
isPublished: true
---

import Callout from '../../components/mdx/Callout.astro';

Si tu fais du LiDAR un peu sérieusement, tu vas vite te heurter à un mur : CloudCompare est génial pour explorer un nuage, mais pour appliquer le même traitement à 200 fichiers `.las` la nuit, ça devient ingérable.

C'est là que PDAL entre en scène.

## Qu'est-ce que PDAL ?

**PDAL** (Point Data Abstraction Library) est une bibliothèque open-source qui te permet de manipuler des nuages de points **en ligne de commande**, via des pipelines JSON.

Concrètement, tu décris une suite d'opérations dans un fichier `.json`, tu lances PDAL, et il enchaîne tout : lecture, filtres, écriture. Comme un Photoshop d'actions mais pour les points.

## Installation

Sur Windows, le plus simple est Conda :

```bash
conda install -c conda-forge pdal
```

Sur Mac/Linux, `brew install pdal` ou `apt install pdal`.

## Ton premier pipeline

Voilà un pipeline minimal qui prend un `.las`, garde uniquement les points classifiés comme `sol` (classe 2), et exporte en `.laz` compressé :

```json
{
  "pipeline": [
    "entree.las",
    {
      "type": "filters.range",
      "limits": "Classification[2:2]"
    },
    {
      "type": "writers.las",
      "filename": "sortie.laz",
      "compression": "laszip"
    }
  ]
}
```

Lance-le avec :

```bash
pdal pipeline mon-pipeline.json
```

<Callout type="tip" title="Astuce productivité">
Combine PDAL avec un script bash ou PowerShell pour traiter un dossier entier en une commande. C'est typiquement ce qui te fait passer de 2h de manip à 5 minutes de café pendant que ça tourne.
</Callout>

## Les filtres que j'utilise tout le temps

- **`filters.range`** — filtrer par classification, altitude, intensité
- **`filters.outlier`** — supprimer les points aberrants (oiseaux, drone qui passe…)
- **`filters.crop`** — découper un polygone d'emprise
- **`filters.icp`** — recalage entre deux nuages
- **`filters.smrf`** — extraction sol automatique (Simple Morphological Filter)

## Quand utiliser PDAL plutôt que CloudCompare ?

- Tu fais le **même traitement sur N fichiers** → PDAL gagne
- Tu veux **scripter / automatiser** → PDAL gagne
- Tu veux **explorer visuellement** un nuage → CloudCompare gagne
- Tu fais une **opération ponctuelle** que tu ne referas pas → CloudCompare gagne

Les deux sont complémentaires. Sur Topolia, j'utilise CloudCompare pour cadrer une méthode, puis PDAL pour l'appliquer à la chaîne.

## Pour aller plus loin

La doc officielle PDAL ([pdal.io](https://pdal.io)) est excellente. Tu trouveras la liste complète des filtres + des exemples concrets.

[À VÉRIFIER] — la commande `conda install` sur Windows ARM64 ne fonctionne pas, à confirmer avec le forum.
```

---

## Task 6 : 8 fiches glossaire de démo

**Files (chacune ~80-150 mots, schéma respecté) :**

- Create : `src/content/glossaire/copc.mdx` (difficulty: intermediaire)
- Create : `src/content/glossaire/lidar.mdx` (debutant)
- Create : `src/content/glossaire/photogrammetrie.mdx` (debutant)
- Create : `src/content/glossaire/nuage-de-points.mdx` (debutant)
- Create : `src/content/glossaire/recalage.mdx` (intermediaire)
- Create : `src/content/glossaire/slam.mdx` (expert)
- Create : `src/content/glossaire/gcp.mdx` (intermediaire)
- Create : `src/content/glossaire/rtk.mdx` (intermediaire)

Structure type (à adapter pour chaque) :

```mdx
---
title: "COPC — Cloud Optimized Point Cloud"
date: 2026-05-19
difficulty: "intermediaire"
relatedArticles: []
relatedChantiers: []
excerpt: "Format de nuage de points optimisé pour le streaming web."
isPublished: true
---

**COPC** (Cloud Optimized Point Cloud) est un format de nuage de points basé sur LAZ, conçu pour être lu efficacement depuis un stockage objet HTTP (S3, Cloudflare R2, etc.) sans tout télécharger.

## Pourquoi ça compte

Un fichier LAS ou LAZ classique doit être téléchargé en entier avant d'être affiché. Sur un nuage de 50 Go, c'est rédibitoire. Avec COPC, le viewer ne lit que les zones et niveaux de détail visibles à l'écran — comme Google Maps fait pour les tuiles d'image.

## Usage typique

- Stockage cloud avec accès web direct
- Viewers comme Potree, CesiumJS, ou ceux basés sur `loadercloud`
- Bibliothèque PDAL (`writers.copc`) pour la conversion depuis du LAS standard
```

Les 8 fiches suivent ce même format, contenu adapté au sujet, 100-200 mots chacune.

---

## Task 7 : 2 chantiers anonymisés

**Files :**
- Create : `src/content/chantiers/facade-haussmannien.mdx`
- Create : `src/content/chantiers/batiment-industriel-rennes.mdx`

Structure obligatoire du brief §9.2 :
1. Contexte mission
2. Matériel déployé
3. Problème rencontré (ne jamais l'esquiver)
4. Ce que j'aurais fait différemment

### `facade-haussmannien.mdx`

```mdx
---
title: "Relevé de façade — immeuble haussmannien 5 niveaux"
date: 2026-03-15
surface: "850m²"
materiel: ["Leica RTC360", "DJI Matrice 4E", "CloudCompare"]
probleme: "Occlusions importantes côté cour, scanner repositionné 8 fois"
lecon: "Prévoir +40% de stations sur les géométries complexes en milieu urbain dense"
tags: ["lidar", "facade", "urbain", "rtc360"]
isPublished: true
---

## Contexte

Bureau d'études parisien, commande de relevé pour ravalement complet d'un immeuble haussmannien rue de Rivoli — 5 niveaux + comble, 22 m de hauteur côté rue. Livrable attendu : nuage de points colorisé + plans 2D ortho-rectifiés.

## Matériel

- Leica RTC360 pour la façade rue et la cour
- DJI Matrice 4E avec sensor RGB pour la toiture (le scanner ne couvrait pas l'angle)
- CloudCompare pour le recalage et le contrôle qualité

## Le problème

La cour intérieure est étroite (~7m × 12m) avec des balcons en encorbellement à chaque niveau. Conséquence : **les balcons des étages supérieurs masquent les façades du dessous depuis tout angle accessible au scanner**.

J'avais prévu 16 stations sur la cour. J'en ai fait 24. Et il manque encore quelques zones derrière les ferronneries.

## Ce que j'aurais fait différemment

1. **Pré-visiter la cour avant le devis.** Une simple visite Google Street View ne montre pas l'encorbellement.
2. **Prévoir le drone pour la cour aussi**, pas seulement la toiture. Un vol manuel à 2 m/s aurait complété les zones manquantes en 20 min.
3. **Facturer un forfait de complétion** côté contrat — quand on découvre une géométrie complexe à la station 5, on ne peut pas demander un avenant en cours de chantier sans tendre la relation client.

Le job a été livré, mais avec 1,5 jour de terrain en plus de ce qui était devisé. Marge nette : autour de zéro.
```

### `batiment-industriel-rennes.mdx`

Suivre la même structure, contexte différent : hangar industriel à Rennes, scanner mobile/backpack (Leica BLK2GO ou similaire), problème lié aux racks métalliques qui créent du bruit, etc.

---

## Task 8 : 2 minutes topo

**Files :**
- Create : `src/content/minute-topo/drift-50m.mdx`
- Create : `src/content/minute-topo/cloudcompare-export-rapide.mdx`

Règle §8.4 : `readingTime` ≤ 3 minutes. Donc max ~500-600 mots.

### `drift-50m.mdx`

```mdx
---
title: "Pourquoi ton nuage de points drift à 50m de distance"
date: 2026-05-12
tags: ["lidar", "precision", "astuces"]
excerpt: "Une cause courante et comment l'éviter en 30 secondes de réglage."
isPublished: true
---

Tu as scanné un long couloir ou une zone linéaire, et tu remarques que ton nuage commence à dériver après 30-50m. Le mur devrait être parallèle, mais il s'écarte progressivement de la ligne de référence.

**Cause la plus probable :** ton scanner mobile ou ton backpack n'a pas eu assez de **points de boucle** dans son trajet.

## Comment éviter ça

Pendant l'acquisition, repasse par ton point de départ ou par une zone déjà scannée toutes les 30 à 50 m. Le SLAM utilise ces "fermetures de boucle" pour recaler ses estimations de position en temps réel. Sans boucle, l'erreur s'accumule linéairement.

## Le vrai test

Si tu fais un long couloir A → B → A, ton point final doit retomber à moins de 2-3 cm de ton point de départ. Au-delà, ton SLAM a dérivé et tu vas devoir recaler manuellement.

C'est tout. 30 secondes de planification d'acquisition économisent 3h de post-traitement.
```

### `cloudcompare-export-rapide.mdx`

Astuce : raccourci pour exporter un sous-ensemble de nuage en LAS via la calculatrice de scalaires de CloudCompare. ~300 mots.

---

## Task 9 : Vérification build complète

- [ ] **Step 1 : Build complet**

```powershell
npm run build
```

Expected : aucune erreur Zod (toutes les frontmatter validées), aucune erreur MDX (tous les imports résolus), `sitemap-index.xml` généré. Les pages individuelles ne sont **pas** encore rendues (pas de routes en Phase 2) — c'est normal.

- [ ] **Step 2 : Vérifier que les types Astro:content sont bien régénérés**

```powershell
npx astro sync
```

Expected : zéro erreur, types injectés dans `.astro/types.d.ts`.

- [ ] **Step 3 : Test rapide via un fichier de pages temporaire (optionnel)**

Pour visualiser le contenu sans attendre la Phase 3, créer temporairement `src/pages/debug-content.astro` :

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { getCollection } from 'astro:content';
import GlossaryCard from '../components/GlossaryCard.astro';
import ChantierCard from '../components/ChantierCard.astro';
import MinuteTopoCard from '../components/MinuteTopoCard.astro';

const articles = await getCollection('articles');
const glossaire = await getCollection('glossaire');
const chantiers = await getCollection('chantiers');
const minutes = await getCollection('minute-topo');
---

<BaseLayout title="Debug content">
  <div class="container" style="padding: 60px 0;">
    <h1>Debug content</h1>
    <p>Articles: {articles.length} | Glossaire: {glossaire.length} | Chantiers: {chantiers.length} | Minutes: {minutes.length}</p>

    <h2 style="margin-top:48px;">Glossaire</h2>
    <div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:16px;">
      {glossaire.map((e) => <GlossaryCard entry={e} />)}
    </div>

    <h2 style="margin-top:48px;">Chantiers</h2>
    <div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:16px;">
      {chantiers.map((e) => <ChantierCard entry={e} />)}
    </div>

    <h2 style="margin-top:48px;">Minutes topo</h2>
    <div style="display:grid; gap:14px;">
      {minutes.map((e) => <MinuteTopoCard entry={e} />)}
    </div>
  </div>
</BaseLayout>
```

Lancer `npm run dev` et vérifier `http://localhost:4321/debug-content`. Cette page sera supprimée en Phase 3 (les vraies routes la rendront caduque).

---

## Task 10 : Commit

- [ ] **Step 1 : `git status` pour revoir les changements**

```powershell
git status
```

- [ ] **Step 2 : Commit propre**

```powershell
git -c user.email=loicdu27620@gmail.com -c user.name=Loic add -A
git -c user.email=loicdu27620@gmail.com -c user.name=Loic commit -m "feat(phase2): content collections, composants MDX et cards, contenu de démo"
```

---

## Récapitulatif

| Fichier | Statut |
|---|---|
| `src/content/config.ts` | Créé — 4 schémas Zod |
| `src/lib/reading-time.ts` | Créé — utilitaire |
| `src/components/mdx/Callout.astro` | Créé |
| `src/components/mdx/CodeBlock.astro` | Créé |
| `src/components/mdx/Figure.astro` | Créé |
| `src/components/mdx/PullQuote.astro` | Créé |
| `src/components/mdx/CompareTable.astro` | Créé |
| `src/components/GlossaryCard.astro` | Créé |
| `src/components/ChantierCard.astro` | Créé |
| `src/components/MinuteTopoCard.astro` | Créé |
| `src/content/articles/*.mdx` | 3 articles de démo |
| `src/content/glossaire/*.mdx` | 8 fiches |
| `src/content/chantiers/*.mdx` | 2 chantiers |
| `src/content/minute-topo/*.mdx` | 2 minutes |
| `src/pages/debug-content.astro` | Créé (temporaire — supprimé en Phase 3) |
