# Topolia.fr — Brief de développement

> Document de spécification destiné à Claude Code (ou à toute autre IA / dev) pour le scaffolding et le développement du site Topolia.fr.
> Place-le à la racine du projet sous le nom `BRIEF.md` ou `CLAUDE.md`.
>
> Version initiale : 09 mai 2026. Mise à jour brainstorming : 19 mai 2026.

---

## 1. Mission & contexte

**Topolia.fr** est un site média + plateforme communautaire dédié à la topographie moderne. Le site couvre l'ensemble des technologies de numérisation 3D du terrain : **scanner laser statique** (Leica, Faro, Trimble, Riegl…), **scanner laser dynamique / mobile** (backpack, véhicule, rail), **LiDAR drone** (embarqué sur UAV), et **photogrammétrie** (drone ou terrestre). Le site publie des tutoriels, comparatifs, astuces terrain et tests matériel. Modèle freemium avec formations premium à venir en V2. Sert aussi de funnel naturel vers les apps **Topolia Scan** (iOS, beta) et **Topolia Desktop** (Windows pro).

**Cible** : géomètres, bureaux d'études, topographes, ingénieurs BTP, semi-pros (artisans, agents immo, archi) et curieux qui veulent monter en compétence sur les technologies de scan 3D — quelle que soit la modalité d'acquisition.

**Ton éditorial** : tutoiement direct, accessible, style YouTubeur tech. Pas de jargon gratuit, des exemples concrets, des opinions tranchées.

**Cadence** : 1 article par semaine au lancement, accélération possible avec assistance IA.

---

## 2. Décisions verrouillées (à ne pas re-litigater)

| | |
|---|---|
| Direction visuelle | **Signal** — SaaS modern tech, inspiré Linear/Vercel/Stripe |
| Identité de marque | Logo **Pulse** (anneaux concentriques) + wordmark `topolia.` |
| Animation signature | **3 variantes** selon contexte — voir §6 |
| Langue | FR au lancement ; archi i18n prête pour EN plus tard |
| Modèle économique | Freemium ; gros du contenu gratuit, formations payantes en V2 |
| Cible primaire | Pros + semi-pros mixés |

---

## 3. Stack technique

| Brique | Choix | Notes |
|---|---|---|
| Framework | **Astro 4+** | SSG, content collections, MDX |
| TypeScript | Strict | Toujours typer les props composant |
| Styling | **CSS variables + classes utilitaires** | Pas de Tailwind, on reste fidèle au système design |
| Contenu | **MDX** dans content collections + **Decap CMS** | Loïc édite en markdown ou via Decap |
| Auth membres | **Clerk** (recommandé) ou Supabase Auth | Pour commentaires + futures formations |
| Newsletter | **Brevo** | API REST, conformité RGPD, gratuit jusqu'à 300/jour |
| Analytics | **Plausible** | Privacy-first, pas de cookie banner |
| Paiement (V2) | **Stripe Checkout** | Pour formations payantes |
| Déploiement | **Vercel** ou **Netlify** | Build automatique sur push GitHub |
| Polices | **Onest** + **JetBrains Mono** | Via Google Fonts |

---

## 4. Design tokens (à copier dans `src/styles/global.css`)

```css
:root {
  /* ─── Backgrounds ─── */
  --bg: #FCFCFD;
  --bg-alt: #F5F7FA;
  --bg-warm: #FFFAF0;
  --surface: #FFFFFF;
  --bg-dark: #0F172A;
  --bg-dark-2: #1E293B;

  /* ─── Ink (text) ─── */
  --ink: #0F172A;
  --ink-2: #1E293B;
  --ink-3: #475569;
  --ink-muted: #64748B;
  --ink-light: #94A3B8;

  /* ─── Accents ─── */
  --accent: #2D5BFF;
  --accent-2: #06B6D4;
  --accent-grad: linear-gradient(135deg, #2D5BFF 0%, #06B6D4 100%);
  --accent-soft: rgba(45, 91, 255, 0.10);

  /* ─── Status colors ─── */
  --green: #10B981;
  --amber: #F59E0B;
  --rose: #F43F5E;

  /* ─── Hairlines ─── */
  --hairline: rgba(15, 23, 42, 0.07);
  --hairline-strong: rgba(15, 23, 42, 0.14);

  /* ─── Shadows ─── */
  --shadow-sm: 0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.04);
  --shadow-md: 0 4px 12px -2px rgba(15,23,42,0.08), 0 8px 24px -8px rgba(15,23,42,0.10);
  --shadow-lg: 0 12px 32px -8px rgba(15,23,42,0.12), 0 4px 12px -4px rgba(15,23,42,0.06);
  --shadow-glow: 0 0 0 1px rgba(45,91,255,0.10), 0 16px 48px -16px rgba(45,91,255,0.30);

  /* ─── Typography ─── */
  --display: 'Onest', sans-serif;
  --body: 'Onest', sans-serif;
  --mono: 'JetBrains Mono', monospace;

  /* ─── Spacing ─── */
  --container-max: 1280px;
  --container-padding: 32px;
  --content-max: 720px;
}

@import url('https://fonts.googleapis.com/css2?family=Onest:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
  background: var(--bg);
  color: var(--ink);
  font-family: var(--body);
  font-weight: 400;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

---

## 5. Logo Pulse (SVG inline pour `<Logo />`)

```html
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-label="Topolia">
  <defs>
    <linearGradient id="pulse-grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2D5BFF"/>
      <stop offset="100%" stop-color="#06B6D4"/>
    </linearGradient>
  </defs>
  <g fill="none" stroke="url(#pulse-grad)">
    <circle cx="50" cy="50" r="36" stroke-width="3" opacity="0.25"/>
    <circle cx="50" cy="50" r="26" stroke-width="3.5" opacity="0.5"/>
    <circle cx="50" cy="50" r="16" stroke-width="4" opacity="0.85"/>
  </g>
  <circle cx="50" cy="50" r="6" fill="url(#pulse-grad)"/>
</svg>
```

**Variants à exposer en props** : `mark` | `wordmark` | `app-icon` | `mono` | `favicon`

**Règles d'usage du mark :**
- Toujours sur fond neutre, jamais déformé
- Jamais animé en version statique print ou miniature < 16px
- Version fond sombre : stroke et fill blancs (pas de gradient)

---

## 6. Animations Pulse — 3 variantes

Règle CSS commune à toutes les variantes :

```css
.ring {
  transform-box: fill-box;
  transform-origin: center;
}
```

### 6.1 Sonar (usage par défaut — navbar, toutes tailles)

Chaque anneau pulse avec un décalage temporel de 0.35s. Subtil, jamais agressif.

```css
.sonar .r1 { animation: sn1 2.4s ease-in-out infinite 0s; }
.sonar .r2 { animation: sn1 2.4s ease-in-out infinite .35s; }
.sonar .r3 { animation: sn1 2.4s ease-in-out infinite .7s; }
.sonar .rd { animation: snd 2.4s ease-in-out infinite .9s; }

@keyframes sn1 { 0%,100% { opacity: .15; } 50% { opacity: .8; } }
@keyframes snd  { 0%,100% { transform: scale(.9); } 50% { transform: scale(1.1); } }
```

### 6.2 Onde sortante (hero page d'accueil uniquement)

Un anneau naît au centre (scale 0.1) et se propage vers l'extérieur jusqu'à disparaître (scale 1.3). Représente physiquement l'onde d'un scan LiDAR.

```css
.onde .r1 { animation: ow 2.2s ease-out infinite 0s; }
.onde .r2 { animation: ow 2.2s ease-out infinite .73s; }
.onde .r3 { animation: ow 2.2s ease-out infinite 1.46s; }
.onde .rd { animation: snd 2.2s ease-in-out infinite; }

@keyframes ow {
  0%   { opacity: .8;  transform: scale(.1); }
  70%  { opacity: 0;   transform: scale(1.3); }
  100% { opacity: 0;   transform: scale(1.3); }
}
```

### 6.3 Veille douce (favicon + états idle)

Alternance lente (4.5s) en cascade. Très discret.

```css
.veille .r1 { animation: vl 4.5s ease-in-out infinite 0s; }
.veille .r2 { animation: vl 4.5s ease-in-out infinite .9s; }
.veille .r3 { animation: vl 4.5s ease-in-out infinite 1.8s; }
.veille .rd { animation: snd 4.5s ease-in-out infinite 2.5s; }

@keyframes vl { 0%,100% { opacity: .08; } 50% { opacity: .75; } }
```

### 6.4 Règle d'usage par contexte

| Contexte | Variante |
|---|---|
| Navbar (toutes pages) | Sonar |
| Hero page d'accueil | Onde sortante |
| Favicon / loader / état idle | Veille douce |
| Splash screen / PulseLoader | Onde sortante |

### 6.5 Animation « Échos LiDAR » (splash / loader)

```css
@keyframes pulseRing {
  0%   { transform: scale(0.4); opacity: 0; }
  20%  { opacity: 0.8; }
  100% { transform: scale(1.4); opacity: 0; }
}

.pulse-loader .ring {
  transform-origin: 50px 50px;
  animation: pulseRing 2s cubic-bezier(0.16, 0.5, 0.5, 1) infinite;
}
.pulse-loader .ring:nth-child(2) { animation-delay: 0.5s; }
.pulse-loader .ring:nth-child(3) { animation-delay: 1s; }
```

---

## 7. Architecture du projet

```
topolia-site/
├── BRIEF.md
├── astro.config.mjs
├── tsconfig.json
├── package.json
├── public/
│   ├── favicon.svg
│   ├── og/
│   └── images/
├── src/
│   ├── components/
│   │   ├── Logo.astro
│   │   ├── PulseLoader.astro
│   │   ├── Nav.astro
│   │   ├── Footer.astro
│   │   ├── Hero.astro
│   │   ├── ArticleCard.astro
│   │   ├── ArticleHeader.astro
│   │   ├── GlossaryCard.astro       ← nouveau
│   │   ├── ChantierCard.astro       ← nouveau
│   │   ├── MinuteTopoCard.astro     ← nouveau
│   │   ├── TableOfContents.astro
│   │   ├── ProgressBar.astro
│   │   ├── Newsletter.astro
│   │   ├── PremiumTeaser.astro
│   │   ├── Comments.astro
│   │   ├── AuthorBio.astro
│   │   └── mdx/
│   │       ├── Callout.astro
│   │       ├── CodeBlock.astro
│   │       ├── Figure.astro
│   │       ├── PullQuote.astro
│   │       └── CompareTable.astro
│   ├── content/
│   │   ├── config.ts
│   │   ├── articles/
│   │   │   └── *.mdx
│   │   ├── glossaire/               ← nouveau
│   │   │   └── *.mdx
│   │   ├── chantiers/               ← nouveau
│   │   │   └── *.mdx
│   │   └── minute-topo/             ← nouveau
│   │       └── *.mdx
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   └── ArticleLayout.astro
│   ├── lib/
│   │   ├── brevo.ts
│   │   ├── reading-time.ts
│   │   └── auth.ts
│   ├── pages/
│   │   ├── index.astro
│   │   ├── articles/
│   │   │   ├── index.astro
│   │   │   └── [slug].astro
│   │   ├── glossaire/               ← nouveau
│   │   │   ├── index.astro
│   │   │   └── [slug].astro
│   │   ├── chantiers/               ← nouveau
│   │   │   ├── index.astro
│   │   │   └── [slug].astro
│   │   ├── minute-topo/             ← nouveau
│   │   │   └── index.astro
│   │   ├── apps/
│   │   │   ├── scan.astro
│   │   │   └── desktop.astro
│   │   ├── newsletter.astro
│   │   ├── a-propos.astro
│   │   └── api/
│   │       └── newsletter.ts
│   └── styles/
│       └── global.css
└── README.md
```

---

## 8. Modèles de contenu — Schémas Zod

### 8.1 Articles (existant)

```yaml
---
title: "Du vol drone au nuage de points : le workflow complet"
subtitle: "Étape par étape, sans raccourci."
date: 2026-05-03
category: "tutoriels"
tags: ["metashape", "drone", "photogrammetrie"]
author: "loic"
heroImage: "/images/articles/workflow-drone.jpg"
heroImageAlt: "Drone survolant un chantier"
excerpt: "Étape par étape, sans raccourci..."
isPremium: false
isPublished: true
---
```

### 8.2 Glossaire (nouveau)

```yaml
---
title: "COPC — Cloud Optimized Point Cloud"
date: 2026-05-19
difficulty: "intermediaire"     # debutant | intermediaire | expert
relatedArticles: ["workflow-lidar-complet"]
relatedChantiers: ["batiment-industriel-rennes"]
excerpt: "Format de nuage de points optimisé pour le streaming web."
isPublished: true
---
```

### 8.3 Chantiers anonymisés (nouveau)

```yaml
---
title: "Relevé de façade — immeuble haussmannien 5 niveaux"
date: 2026-05-19
surface: "850m²"
materiel: ["Leica RTC360", "DJI Matrice 4E", "CloudCompare"]
probleme: "Occlusions importantes côté cour, scanner repositionné 8 fois"
lecon: "Prévoir +40% de stations sur les géométries complexes"
tags: ["lidar", "facade", "urbain"]
isPublished: true
---
```

### 8.4 Minute topo (nouveau)

```yaml
---
title: "Pourquoi ton nuage de points drift à 50m de distance"
date: 2026-05-19
tags: ["lidar", "precision", "astuces"]
excerpt: "Une cause courante et comment l'éviter en 30 secondes."
isPublished: true
---
```

> Règle : `readingTime` d'une minute topo ne doit jamais dépasser 3 minutes.

### 8.5 `src/content/config.ts` complet

```ts
import { defineCollection, z } from 'astro:content';

const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    date: z.date(),
    category: z.enum(['tutoriels', 'astuces', 'scanner-statique', 'scanner-dynamique', 'drone', 'comparatifs', 'cas-concrets']),
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

export const collections = { articles, glossaire, chantiers, 'minute-topo': minuteTopo };
```

---

## 9. Piliers éditoriaux & types de contenu

### 9.1 Les 5 catégories d'articles

| Slug | Label | Description |
|---|---|---|
| `tutoriels` | Tutoriels logiciels | Metashape, CloudCompare, RealityCapture, PDAL, etc. |
| `astuces` | Astuces terrain & workflows | Tips terrain, organisation, méthode |
| `scanner-statique` | Scanner statique | Leica, Faro, Trimble, Riegl — relevés sur station fixe |
| `scanner-dynamique` | Scanner dynamique / mobile | Backpack, véhicule, rail — acquisition en mouvement |
| `drone` | Drone & LiDAR embarqué | UAV photogrammétrie + LiDAR drone |
| `comparatifs` | Comparatifs & tests | Comparatifs produits, tests détaillés |
| `cas-concrets` | Cas concrets & retours | Études de cas, REX |

### 9.2 Les 3 nouveaux types de contenu

**Glossaire topographique**
Lexique des termes du métier, sérieusement rédigé en français. Fort potentiel SEO sur des requêtes peu concurrencées. Structure : définition courte (2-3 phrases) + cas d'usage terrain + liens croisés.

**Chantiers anonymisés**
Retours terrain sur de vrais projets sans nommer le client. Structure obligatoire :
1. Contexte mission (type de terrain, surface, contrainte)
2. Matériel déployé
3. Problème rencontré — ne jamais l'esquiver, c'est la partie la plus précieuse
4. Ce que j'aurais fait différemment

Règle éditoriale : ne jamais adoucir le problème rencontré. C'est ce que les cabinets ne publient pas, et c'est ce qui rend le contenu irremplaçable.

**La minute topo**
Format ultra-court, une astuce ou un fait technique en 2-3 paragraphes max. Maintient la cadence 1/semaine sans épuiser. Très partageable sur LinkedIn. Tag dédié `#minute-topo` dans le feed.

### 9.3 Maillage interne — règle de liaison

```
Glossaire ←──→ Articles longs
    ↑               ↑
    └──→ Chantiers ←┘
              ↑
         Minute topo
```

Règle : chaque contenu doit pointer vers au moins un autre type. Jamais un article sans lien vers le glossaire, jamais une fiche glossaire sans lien vers un chantier ou article.

---

### 9.4 Contributions communautaires — chantiers utilisateurs (V2+)

Les Chantiers anonymisés ne resteront pas un format réservé à Loïc. Les membres connectés pourront soumettre **leurs propres chantiers** via un formulaire dédié — l'objectif est de transformer le format en un référentiel partagé par toute la communauté topo, avec modération éditoriale.

**Principe :**
- Accessible uniquement aux utilisateurs connectés (auth Clerk — §20)
- Bouton **« Partager un chantier »** sur l'index `/chantiers/` (visible uniquement si auth)
- Formulaire avec les mêmes champs que le schéma Zod §8.3 :
  - Titre, date, surface, matériel (chips multi-select), problème, leçon, tags
  - Body en éditeur Markdown léger (textarea simple suffit en V2, MDX riche en V3)
- Soumission → entrée en base Supabase `chantier_submissions` avec `status: 'pending'`
- Modération par Loïc avant publication (jamais d'auto-publish)
- Une fois approuvé : génération automatique du `.mdx` correspondant dans `src/content/chantiers/` + commit auto déclenchant un redeploy Netlify
- L'auteur apparaît crédité (prénom + initiale ou pseudonyme, jamais nom complet client)

**Statuts dans Supabase :**

```
pending     → soumis par un membre, en attente de relecture
reviewing   → Loïc travaille dessus
approved    → validé, en cours de publication automatique
published   → article généré et visible sur le site
rejected    → refusé (raison communiquée à l'auteur)
```

**Pourquoi cette feature :**

- Multiplie la valeur du format chantier (effet réseau, diversité des matériels et régions)
- Crée une **raison forte de s'inscrire** à l'espace membre — pas juste un commentaire à laisser
- Renforce la position de Topolia comme communauté de référence, pas juste un blog perso
- Alimente le pipeline éditorial sans charge de production côté Loïc

**Garde-fous éditoriaux non négociables :**

- **Modération systématique** avant publication, jamais d'auto-publish
- **Anonymisation client obligatoire** — rappel explicite dans le formulaire, refus si le nom du client ou du chantier identifiable est cité
- **Structure obligatoire** identique aux chantiers de Loïc : contexte / matériel / problème / leçon — refus si une section manque
- **Pas de modification après publication** sans nouvelle validation Loïc
- **Droit de retrait** côté auteur ou côté Topolia à tout moment

**Phase de réalisation :** V2 — après la Phase 5 (espace membre opérationnel) et l'arrivée des premiers commentaires. Pas avant d'avoir au moins **20 chantiers maison** publiés, pour donner le ton et l'exemple de qualité attendu.

---

## 10. Monétisation & espace membre

**Modèle freemium :**
- Tout le contenu blog est gratuit (articles, glossaire, chantiers, minute topo)
- L'inscription newsletter est gratuite
- Les formations sont payantes à l'unité via Stripe
- L'espace membre débloque l'accès aux formations achetées + possibilité de commenter

**Stack monétisation :**
- **Stripe** — paiement des formations à l'unité, intégration en V2
- **Clerk** — authentification espace membre, gratuit jusqu'à 10 000 utilisateurs actifs/mois

**Ce que ça implique techniquement en V2 :**
- Pages formations avec paywall Stripe
- Route `/membre` protégée par Clerk
- Webhooks Stripe → Clerk pour déverrouiller l'accès après paiement
- Supabase potentiellement pour stocker les progressions de formation

**Règle éditoriale** : une formation ne sort que si tu as déjà 5-10 articles gratuits sur le sujet. Le contenu gratuit valide l'intérêt avant d'investir dans la production.

---

## 11. Plan de développement — 6 phases

### Phase 1 — Fondations (jours 1-2)

- [ ] `npm create astro@latest` (template minimal, TypeScript strict)
- [ ] Installer les intégrations : `@astrojs/mdx`, `@astrojs/sitemap`
- [ ] Créer `src/styles/global.css` avec tous les tokens du §4
- [ ] Composant `<Logo />` avec props `variant` (mark | wordmark | app-icon | mono | favicon)
- [ ] Composant `<PulseLoader />` avec animation Échos LiDAR
- [ ] Ajouter les 3 classes d'animation CSS (`.sonar`, `.onde`, `.veille`) dans global.css
- [ ] Layout `<BaseLayout>` avec `<Nav>` + `<Footer>` + meta SEO de base
- [ ] Favicon SVG + Open Graph image générique

### Phase 2 — Content collections & MDX (jours 3-4)

- [ ] Setup `src/content/config.ts` avec les 4 schémas Zod du §8
- [ ] Créer 2-3 articles de démo en MDX
- [ ] Créer 5-10 fiches glossaire de démo
- [ ] Créer 1-2 chantiers de démo
- [ ] Composants MDX dans `src/components/mdx/`
- [ ] Composants `<GlossaryCard />`, `<ChantierCard />`, `<MinuteTopoCard />`

### Phase 3 — Pages clés (jours 5-7)

- [ ] **Home** (`index.astro`) : hero + mockup produit + grid articles + proof social
- [ ] **Article type** (`articles/[slug].astro`) : layout 3 colonnes + auteur bio + related
- [ ] **Liste articles** (`articles/index.astro`) avec filtres par catégorie
- [ ] **Glossaire index** (`glossaire/index.astro`) avec recherche alphabétique
- [ ] **Fiche glossaire** (`glossaire/[slug].astro`)
- [ ] **Chantiers index** (`chantiers/index.astro`)
- [ ] **Fiche chantier** (`chantiers/[slug].astro`)
- [ ] **Minute topo** (`minute-topo/index.astro`) — feed court
- [ ] **À propos** (`a-propos.astro`)

### Phase 4 — Newsletter + Analytics (jours 8-9)

- [ ] API endpoint `/api/newsletter` → Brevo
- [ ] Composant `<NewsletterInline />` avec validation client
- [ ] Page `/newsletter`
- [ ] Plausible script tag dans `<BaseLayout>`
- [ ] OG images dynamiques par article

### Phase 5 — Membres & commentaires (jours 10-12)

- [ ] Setup Clerk
- [ ] Pages `/login` et `/signup`
- [ ] Composant `<Comments>` avec auth required
- [ ] Backend commentaires (Supabase)

### Phase 6 — Decap CMS (jour 13+)

- [ ] Configurer Decap CMS dans `public/admin/`
- [ ] OAuth GitHub pour Loïc
- [ ] Documenter dans README

### V2 — plus tard

- Pages produits Topolia Scan + Topolia Desktop
- Stripe Checkout pour formations payantes
- Espace membre avec progression formations
- Vidéos intégrées
- i18n (FR + EN)

---

## 12. Conventions de code

- **Composants** : `.astro`, props typées avec interface TypeScript
- **CSS** : modules CSS scoped dans les composants Astro, classes en `kebab-case`
- **Pas de Tailwind** — CSS variables + classes utilitaires custom
- **Naming fichiers** : `kebab-case`
- **Naming composants** : `PascalCase`
- **MDX** : article body en MDX pour embarquer les composants Astro
- **Images** : utiliser `<Image>` d'Astro (AVIF/WebP auto)
- **Accessibilité** : `aria-label` sur les SVG décoratifs, `alt` sur toutes les images, contrastes ≥ AA

---

## 13. Références visuelles

Quatre fichiers HTML servent de référence absolue pour le design. **À garder ouverts pendant le dev** :

| Fichier | Sert à... |
|---|---|
| `topolia-direction-d-signal.html` | Page d'accueil cible |
| `topolia-page-article.html` | Page article type |
| `topolia-logo-explorations.html` | Identité — version **Pulse pure** (concept N°03) |
| `topolia-logo-pulse-t.html` | Animation loader Échos LiDAR + mockups app |

---

## 14. Responsive & mobile — non-négociable

Le site doit être **mobile-first**. 50–70 % du trafic d'un site média vient du mobile.

### Breakpoints

```css
@media (min-width: 640px)  { /* sm — tablette portrait */ }
@media (min-width: 900px)  { /* md — tablette paysage */ }
@media (min-width: 1080px) { /* lg — desktop */ }
@media (min-width: 1280px) { /* xl — desktop large */ }
```

### Adaptations clés

**Nav** — desktop : liens horizontaux. Mobile < 900px : burger + drawer plein écran.

**Page d'accueil** — hero titre en `clamp(36px, 8vw, 88px)`. Articles : 1 colonne au lieu de 3.

**Page article** — 3 colonnes → 1 colonne. TOC devient bouton flottant bottom sheet. Code blocks scrollables horizontalement.

### Targets tactiles

Tous les éléments cliquables font minimum **44×44 px**.

### Performance mobile (cibles Lighthouse)

- LCP ≤ 2.5s — FID ≤ 100ms — CLS ≤ 0.1 — Score ≥ 90

---

## 15. Premier prompt à donner à Claude Code

```
Je veux créer le projet Topolia.fr — un site média sur la topographie
moderne (LiDAR, drone, photogrammétrie).

Lis le fichier BRIEF.md à la racine, qui contient toute la spec :
direction visuelle "Signal", stack Astro, design tokens, architecture
du projet, modèles de contenu et plan en 6 phases.

Démarre par la PHASE 1 — FONDATIONS :
1. Scaffolder un projet Astro avec TypeScript strict
2. Installer @astrojs/mdx et @astrojs/sitemap
3. Configurer les Google Fonts Onest + JetBrains Mono
4. Créer src/styles/global.css avec TOUS les tokens du §4 du brief
   + les 3 classes d'animation CSS du §6 (.sonar, .onde, .veille)
5. Créer le composant <Logo /> avec ses 5 variants
6. Créer le composant <PulseLoader /> avec animation Échos LiDAR
7. Créer <BaseLayout> avec <Nav> + <Footer> minimaux

Avant de coder, propose-moi un plan détaillé pour la Phase 1.
Je validerai avant que tu ne commences à écrire du code.
```

---

## 16. Outils tiers à provisionner avant le dev

- [ ] Acheter `topolia.app` sur OVH (~15€/an) → pointer vers topolia.fr en attendant
- [ ] Créer compte **Brevo** → récupérer API key
- [ ] Créer compte **Plausible** → ajouter topolia.fr
- [ ] Créer compte **Clerk** → récupérer publishable key + secret
- [ ] Créer repo **GitHub** privé `topolia-site`
- [ ] Connecter le repo à **Vercel** ou **Netlify**
- [ ] Configurer le DNS de **topolia.fr** vers l'hébergeur
- [ ] (V2) compte **Stripe** pour les formations

---

## 17. Variables d'environnement attendues

```bash
# Newsletter
BREVO_API_KEY=xkeysib-xxxxx
BREVO_LIST_ID=2

# Auth (Clerk)
PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Analytics
PUBLIC_PLAUSIBLE_DOMAIN=topolia.fr

# Site
PUBLIC_SITE_URL=https://topolia.fr
```

---

## 18. Phase 7 — Pipeline éditorial IA assisté

> À attaquer **après** que le site soit en prod et que tu aies publié au moins 5-10 articles à la main. Ces articles servent de corpus de référence pour calibrer la voix des agents.

### 18.1 Vision générale

Le pipeline ne remplace pas l'expertise terrain — il automatise tout ce qui ne la requiert pas. Loïc reste le seul auteur au sens éditorial. L'IA fait le travail de recherche, de structure et de première rédaction. Loïc valide, complète avec son vécu, et signe.

Le système doit aussi être **délégable** : une interface admin claire permet à quelqu'un d'autre de gérer la veille et de préparer les brouillons sans toucher au code.

---

### 18.2 Agent 1 — Veille mondiale toutes langues

**Principe** : chaque lundi matin à 8h, l'agent parcourt les sources mondiales (pas uniquement françaises — l'angle Topolia c'est justement d'apporter en France ce que le public français n'a pas encore vu), analyse les contenus, et dépose 7-10 sujets dans l'interface admin.

**Sources surveillées :**

| Source | Requêtes / sujets |
|---|---|
| Reddit | r/Surveying, r/photogrammetry, r/drones, r/gis, r/lidar |
| YouTube | "lidar scanner", "drone survey", "photogrammetry tutorial", "faro leica riegl review" |
| Google News | "terrestrial laser scanner", "mobile lidar", "drone LiDAR 2026", "photogrammetry software" |
| Sites fabricants | Leica Geosystems, Faro, Trimble, Riegl, DJI Enterprise — pages news/blog |
| ArXiv / ResearchGate | Nouveautés académiques applicables terrain |
| Forums pros | Surveyors Forum, Land Surveyors United |

**Toutes langues** : EN prioritaire, mais DE, JP, SE (pays avancés sur le LiDAR) sont aussi pertinents. L'agent traduit et adapte le contexte automatiquement.

**Priorités de sujets :**
- Nouveaux appareils / firmware (fort intérêt immédiat)
- Comparatifs entre modèles concurrents
- Workflows inédits ou optimisations non connues en France
- Controverses ou retours négatifs terrain (rare, très lu)
- Mises à jour logicielles majeures (CloudCompare, Metashape, RealityCapture...)

**Output dans l'interface admin** — pour chaque sujet proposé :

```json
{
  "title": "Le nouveau Faro Focus Premium vs Leica RTC360 : qui gagne vraiment sur chantier ?",
  "source_lang": "EN",
  "source_url": "https://...",
  "pillar": "comparatifs",
  "angle": "Le comparatif Faro vs Leica existe en anglais mais jamais fait sérieusement en français avec des données terrain. Angle : test pratique sur 3 types de chantiers typiques FR (façade, intérieur industriel, espace ouvert).",
  "urgency": 4,
  "type": "article",
  "estimated_reading_time": 9,
  "status": "pending"
}
```

---

### 18.3 Interface admin `/admin/studio`

Accessible uniquement à Loïc (et aux délégués autorisés via Clerk). Pas de frontend public.

**Vue principale — Tableau de bord sujets :**

```
┌─────────────────────────────────────────────────────────────┐
│  📡 Veille du 19 mai — 8 sujets proposés                    │
├──────────┬──────────────────────────────┬──────┬────────────┤
│ Urgence  │ Titre                        │Pilier│ Action     │
├──────────┼──────────────────────────────┼──────┼────────────┤
│ ●●●●○    │ Faro Focus Premium vs RTC360 │ Comp │ [Rédiger]  │
│ ●●●●○    │ DJI L3 Pro : premier test    │ Drone│ [Rédiger]  │
│ ●●●○○    │ PDAL 2.8 — nouveautés clés   │ Tuto │ [Rédiger]  │
│ ●●○○○    │ Leica BLK ARC : 6 mois après │ Dyn. │ [Ignorer]  │
│ ...      │ ...                          │ ...  │ ...        │
└──────────┴──────────────────────────────┴──────┴────────────┘
```

**Actions disponibles :**
- `[Rédiger]` — lance l'Agent 2 sur ce sujet, génère le brouillon
- `[Ignorer]` — archive le sujet sans rédaction
- `[Modifier]` — ajuster le titre ou l'angle avant de lancer la rédaction
- `[Déléguer]` — assigne le brouillon à un collaborateur pour finalisation

---

### 18.4 Agent 2 — Rédaction brouillon complet

**Déclenché manuellement** depuis l'interface admin après validation du sujet par Loïc.

**Ce que l'agent produit — un brouillon MDX complet :**

```
1. Titre optimisé SEO + titre alternatif plus accrocheur
2. Excerpt (2-3 phrases, pour le feed et la newsletter)
3. Structure de l'article (H2 + H3 proposés, modifiables)
4. Introduction rédigée dans la voix Topolia
5. Chaque section rédigée avec :
   - Le contenu factuel sourcé
   - Les passages <!-- À VÉRIFIER PAR LOÏC --> marqués clairement
   - Les callouts <Callout> suggérés aux bons endroits
6. Conclusion avec CTA vers les apps Topolia si pertinent
7. Tags suggérés + catégorie
8. Sources citées avec URLs
```

**Ce que l'agent NE fait PAS :**
- Inventer des chiffres ou des mesures terrain — il laisse un `[DONNÉE TERRAIN LOÏC]`
- Rédiger les anecdotes personnelles — il laisse un `[RETOUR TERRAIN LOÏC]`
- Publier — tout output en `status: 'draft'`, jamais `published`

**Prompt système de l'agent :**

```
Tu es l'assistant éditorial de Topolia.fr — site français de référence
sur la topographie moderne (scanner laser statique, scanner dynamique,
LiDAR drone, photogrammétrie).

TON ÉDITORIAL :
- Tutoiement systématique, direct, jamais corporate
- Style YouTubeur tech : accessible mais pas condescendant
- Opinions tranchées autorisées et encouragées
- Jargon technique expliqué simplement à la première occurrence
- Exemples concrets, chiffres réels, pas de généralités

RÈGLES ABSOLUES :
- Marquer <!-- À VÉRIFIER --> sur tout fait non confirmé par une source
- Marquer [DONNÉE TERRAIN LOÏC] partout où une mesure ou expérience réelle est nécessaire
- Marquer [RETOUR TERRAIN LOÏC] pour les anecdotes et retours d'expérience
- Jamais publier — status: draft obligatoire
- Toujours citer les sources avec URLs complètes
- Langue : français, même si les sources sont en anglais
```

---

### 18.5 Agent 3 — Repurposing 1 article → N formats

**Déclenché manuellement** une fois un article publié.

| Format | Output |
|---|---|
| LinkedIn | Post 1200-1500 caractères, hook fort, 3-5 points clés, CTA vers l'article |
| Newsletter | Email 300-400 mots dans la voix Brevo, lien + tease du prochain article |
| Minute topo | Extraction d'une astuce de l'article en format court (< 3 min de lecture) |
| Script vidéo | Structure narration pour une future vidéo YouTube sur le même sujet |

---

### 18.6 Architecture technique

```
┌─────────────────────────────────────────┐
│         /admin/studio (Clerk auth)       │
│  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ Tableau  │  │ Éditeur  │  │Repurp. │ │
│  │ sujets   │  │brouillon │  │1 → N   │ │
│  └────┬─────┘  └────┬─────┘  └───┬────┘ │
└───────┼─────────────┼────────────┼──────┘
        │             │            │
        ▼             ▼            ▼
┌─────────────────────────────────────────┐
│           Anthropic Claude API          │
│  claude-sonnet-4-6 (rédaction, analyse) │
│  claude-haiku-4-5  (classification)     │
└──────────────┬──────────────────────────┘
               │
        ┌──────┴──────┐
        │   Supabase  │  ← stockage sujets, brouillons, statuts
        └─────────────┘

Vercel Cron → lundi 8h → Agent 1 veille → dépôt Supabase
```

---

### 18.7 Statuts des articles dans Supabase

```
pending    → sujet proposé par la veille, pas encore traité
approved   → sujet validé par Loïc, en attente de rédaction
drafting   → Agent 2 en cours de rédaction
draft      → brouillon prêt, en attente de relecture Loïc
reviewing  → Loïc travaille dessus
ready      → article finalisé, prêt à publier
published  → publié sur le site
ignored    → sujet écarté
```

---

### 18.8 Variables d'environnement supplémentaires

```bash
ANTHROPIC_API_KEY=sk-ant-xxxxx
OPENAI_API_KEY=sk-xxxxx            # Whisper si transcription vocale
SERPAPI_KEY=xxxxx                  # Recherche SEO
CRON_SECRET=un_secret_long_aleatoire
YOUTUBE_API_KEY=xxxxx
REDDIT_CLIENT_ID=xxxxx
REDDIT_CLIENT_SECRET=xxxxx
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx    # Côté serveur uniquement
```

---

### 18.9 Garde-fous éditoriaux — non négociables

1. **Jamais de publication automatique.** Tout passe par Loïc ou un délégué autorisé.
2. **Jamais inventer.** Chiffres, mesures, citations sans source → `<!-- À VÉRIFIER -->`.
3. **Voix Topolia toujours.** Tutoiement, direct, opinions assumées.
4. **Sources obligatoires.** Tout brouillon sans URL de source est rejeté par l'agent lui-même.
5. **Contenu terrain irremplaçable.** L'agent ne simule jamais un retour d'expérience — il laisse le placeholder pour Loïc.
6. **Délégation traçable.** Chaque action dans l'admin est loggée (qui, quoi, quand) dans Supabase.

---

### 18.10 Roadmap d'implémentation Phase 7

| Sous-phase | Livrable | Effort | Quand |
|---|---|---|---|
| 7.1 | Setup Supabase + table `article_ideas` | 0.5 jour | Avant tout |
| 7.2 | Agent 1 veille + cron Vercel + email Brevo | 2 jours | Premier livrable |
| 7.3 | Interface admin `/admin/studio` — tableau sujets | 2 jours | Pour gérer la veille |
| 7.4 | Agent 2 rédaction brouillon + éditeur dans l'admin | 3 jours | Le plus rentable |
| 7.5 | Agent 3 repurposing | 1 jour | Après validation du reste |
| 7.6 | Système de délégation (rôles Clerk) | 1 jour | Quand tu as un collaborateur |

---

## 19. Stratégie de monétisation complète

### 19.1 Vue d'ensemble des 5 leviers

| Levier | Quand | Potentiel | Effort |
|---|---|---|---|
| Formations payantes | Dès V2 | Moyen — récurrent | Fort (production) |
| Affiliation logiciels | Dès l'audience établie | Fort — commissions élevées | Faible une fois en place |
| Affiliation matériel | Dès l'audience établie | Très fort — produits chers | Faible une fois en place |
| Sponsoring / article partenaire | Quand les marques viennent | Variable | Moyen |
| Revendeur agréé | Long terme | Très fort | Fort (accréditation) |

---

### 19.2 Affiliation logiciels — priorités

**Metashape (Agisoft) — priorité n°1**

Logiciel de photogrammétrie de référence en France. Programme revendeur officiel disponible.
- Licence Pro : ~3 500€ — commission estimée 15-20% → ~700€ par vente
- Contact : https://www.agisoft.com/downloads/resellers/
- Stratégie : produire 3-5 tutoriels Metashape de qualité AVANT de candidater. Agisoft regarde le contenu existant.

**DJI Enterprise — priorité n°1 ex aequo**

Programme partenaire officiel : DJI Enterprise Authorized Retailer.
- Drones Enterprise (Matrice 4E, Matrice 350), capteurs LiDAR (L2, Zenmuse L1)
- Prix unitaires : 5 000€ à 30 000€ selon bundle
- Contact : https://enterprise.dji.com/fr/dealer-locator
- Stratégie : tests terrain documentés + comparatifs DJI vs concurrents. DJI soutient activement les créateurs sérieux.

**RealityCapture (Epic Games)**
- Alternative à Metashape, populaire pour les grands projets
- Programme affilié disponible, commissions intéressantes

**Pix4D**
- Concurrent direct Metashape, très utilisé en BTP et cadastre
- Programme revendeur structuré

---

### 19.3 Affiliation matériel

**Amazon Associates** — à activer dès le lancement, zéro barrière d'entrée.
- Commissions 3-5% sur accessoires terrain, trépieds, tablettes durci, batteries, stockage
- Lien d'inscription : https://partenaires.amazon.fr

**Revendeurs spécialisés géomètre**
Certains distributeurs pros (Hexagon, Trimble dealers, distributeurs Faro) ont des programmes de recommandation non publics. À négocier directement une fois l'audience établie.

---

### 19.4 Sponsoring & articles partenaires

**Règles non négociables :**
- Mention "article sponsorisé" ou "en partenariat avec [Marque]" obligatoire en haut d'article (loi Sapin II)
- L'avis reste honnête même sponsorisé — les défauts sont mentionnés
- Maximum 1 article sponsorisé pour 4 articles éditoriaux
- Tarif à fixer quand l'audience dépasse 5 000 visiteurs/mois

**Ce que tu peux proposer aux marques :**
- Article de test / comparatif sponsorisé
- Mention en newsletter
- Formation co-brandée (ex. "Formation Metashape certifiée Topolia")

---

### 19.5 Revendeur agréé — vision long terme

Leica, Faro, Trimble vendent via des réseaux agréés. Relation commerciale directe avec marges négociées. Conditions : crédibilité établie, structure juridique, engagement de volume. Vision à 2-3 ans — topolia.fr construit exactement la crédibilité nécessaire.

---

### 19.6 Ce qu'il faut prévoir techniquement

- **Tag `#partenariat`** — composant `<SponsoredBadge />` affiché automatiquement si `isSponsored: true`
- **Page `/partenaires`** transparente listant tous les partenariats actifs
- **Redirections `/go/[slug]`** — page Astro qui redirige vers le lien affilié et logue le clic dans Plausible

```ts
// Ajout au schéma Zod articles
isSponsored: z.boolean().default(false),
sponsorName: z.string().optional(),
affiliateLinks: z.array(z.object({
  label: z.string(),
  url: z.string(),
  program: z.string(),
})).default([]),
```

---

### 19.7 Ordre de priorité recommandé

```
Maintenant      → Amazon Associates (zéro barrière)
                → Écrire 3-5 tutoriels Metashape de qualité
                → Écrire 3-5 tests/comparatifs DJI documentés

3-6 mois        → Candidater programme Agisoft Metashape
                → Candidater DJI Enterprise Partner
                → Activer liens affiliés RealityCapture + Pix4D

6-12 mois       → Premiers articles sponsorisés
                → Négocier avec revendeurs spécialisés

12-24 mois      → Explorer revendeur agréé Leica / Faro / Trimble
                → Formation co-brandée avec un éditeur logiciel
```

---

## 20. Vision long terme — Topolia Cloud (V3, non planifié)

Noté pour ne pas l'oublier. **Ne pas planifier maintenant.**

Viewer web de nuages de points avec pages client personnalisées. Modèle SaaS à l'usage (stockage, durée d'accès). Domaine naturel : `topolia.app`.

Contraintes techniques à garder en tête le jour J :
- Conversion obligatoire en format streamable (COPC ou Potree octree) en amont
- Coût stockage à modéliser (S3 ou équivalent) + politique d'expiration des liens
- Ce n'est pas un feature du site blog — c'est un troisième produit Topolia à part entière

---

## 20. Authentification — Clerk

### 20.1 Méthodes de connexion activées

Activer uniquement dans le dashboard Clerk :
- **Magic link** — l'utilisateur entre son email, reçoit un lien cliquable, pas de mot de passe. Idéal pour un public pro qui ne veut pas gérer un compte de plus.
- **Google OAuth** — "Continuer avec Google", un clic. Méthode préférée de la majorité.

Ne pas activer : GitHub OAuth (pas pertinent pour cette cible), mot de passe classique (génère du support "mot de passe oublié").

### 20.2 Intégration Astro

Clerk fournit des composants tout faits — zéro code d'auth à écrire :

```astro
---
// src/pages/login.astro
import { SignIn } from '@clerk/astro/components';
---
<SignIn />
```

### 20.3 Protection des pages formations

```ts
// src/pages/formations/[slug].astro
---
import { auth } from '@clerk/astro/server';
import { clerkClient } from '@clerk/astro/server';

const { userId } = auth();
if (!userId) return redirect('/login');

const user = await clerkClient.users.getUser(userId);
const formations = user.privateMetadata.formations ?? [];

if (!formations.includes(Astro.params.slug)) {
  return redirect(`/formations/${Astro.params.slug}/acheter`);
}
---
<!-- Contenu de la formation — jamais rendu si pas d'accès -->
```

La vérification est **côté serveur** — le contenu ne descend jamais dans le navigateur si les droits ne sont pas là. Impossible à contourner côté client.

### 20.4 Flux utilisateur complet

```
Clique "Accéder à la formation"
        ↓
Non connecté → redirigé /login
        ↓
Google OAuth ou Magic link email
        ↓
Connecté → redirigé vers la formation
        ↓
Pas encore acheté → redirigé /formations/X/acheter
        ↓
Paiement Stripe confirmé → webhook → droits Clerk mis à jour
        ↓
Formation accessible
```

---

## 21. Paiement — Stripe

### 21.1 Flux de paiement

```
Utilisateur clique "Acheter"
        ↓
Stripe Checkout (page hébergée par Stripe, zéro donnée CB chez toi)
        ↓
Paiement confirmé → Stripe envoie webhook POST /api/webhooks/stripe
        ↓
Endpoint lit l'event, récupère l'email, trouve le compte Clerk
        ↓
clerkClient.users.updateMetadata() → ajoute la formation aux droits
        ↓
Utilisateur redirigé vers la formation — accès accordé
```

### 21.2 Variables d'environnement Stripe

```bash
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
```

### 21.3 Endpoint webhook

```ts
// src/pages/api/webhooks/stripe.ts
export const prerender = false;
import Stripe from 'stripe';

export const POST = async ({ request }) => {
  const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY);
  const sig = request.headers.get('stripe-signature');
  const body = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, import.meta.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return new Response('Webhook signature invalide', { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const formationSlug = session.metadata.formation_slug;
    const clerkUserId = session.metadata.clerk_user_id;

    const user = await clerkClient.users.getUser(clerkUserId);
    const formations = user.privateMetadata.formations ?? [];

    await clerkClient.users.updateUserMetadata(clerkUserId, {
      privateMetadata: { formations: [...formations, formationSlug] }
    });
  }

  return new Response(JSON.stringify({ received: true }));
};
```

---

## 22. Sécurité — checklist complète

> Section critique. Un site avec paiement et authentification doit être irréprochable sur la sécurité, sous peine d'être signalé comme malveillant par les navigateurs, antivirus, et filtres email.

### 22.1 HTTPS — obligatoire

Vercel et Netlify activent HTTPS automatiquement via Let's Encrypt. Ne jamais servir une page de login ou de paiement en HTTP. Vérifier que la redirection HTTP → HTTPS est active.

### 22.2 En-têtes de sécurité HTTP

À configurer dans `vercel.json` ou `netlify.toml`. Ces en-têtes empêchent les attaques XSS, clickjacking, et injection de contenu malveillant — leur absence fait sonner les scanners de sécurité.

```json
// vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains; preload"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com https://clerk.topolia.fr; frame-src https://js.stripe.com; connect-src 'self' https://api.clerk.dev https://api.brevo.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com;"
        }
      ]
    }
  ]
}
```

### 22.3 Validation des webhooks Stripe

Ne jamais faire confiance à un webhook sans vérifier la signature. Le code du §21.3 le fait déjà avec `stripe.webhooks.constructEvent()`. Si la signature ne correspond pas → réponse 400, l'event est ignoré.

### 22.4 Données de paiement — règle absolue

**Jamais de numéro de carte bancaire sur tes serveurs.** Stripe Checkout héberge la page de paiement sur ses propres domaines (checkout.stripe.com). Tu ne touches jamais les données CB. C'est la raison pour laquelle on utilise Stripe Checkout et pas une intégration custom.

### 22.5 Variables d'environnement

- Ne jamais committer le `.env` dans Git (vérifier que `.gitignore` le bloque)
- Les clés préfixées `PUBLIC_` sont exposées côté client — n'y mettre que ce qui peut l'être (clé publiable Stripe, domaine Plausible)
- Les clés secrètes (Stripe secret, Clerk secret, Brevo API key, Anthropic) restent côté serveur uniquement

### 22.6 Réputation du domaine email (anti-spam)

Les emails de newsletter et magic link envoyés depuis `@topolia.fr` doivent être configurés pour ne pas finir en spam ni être marqués comme phishing.

**SPF** — déclare quels serveurs sont autorisés à envoyer pour topolia.fr :
```
TXT @ "v=spf1 include:sendinblue.com ~all"
```

**DKIM** — signature cryptographique des emails. Brevo te fournit la clé à ajouter en DNS :
```
TXT mail._domainkey "v=DKIM1; k=rsa; p=MIGfMA0..."
```

**DMARC** — politique de gestion des emails qui échouent SPF/DKIM :
```
TXT _dmarc "v=DMARC1; p=quarantine; rua=mailto:dmarc@topolia.fr"
```

Ces 3 enregistrements DNS sont **obligatoires** avant d'envoyer le premier email. Sans eux, les magic links de Clerk et les newsletters Brevo atterrissent en spam ou sont bloqués.

### 22.7 Checklist sécurité avant mise en prod

- [ ] HTTPS actif et redirection HTTP → HTTPS vérifiée
- [ ] En-têtes de sécurité HTTP configurés (§22.2)
- [ ] SPF + DKIM + DMARC configurés sur le DNS topolia.fr
- [ ] `.env` absent du repo Git
- [ ] Webhook Stripe avec vérification de signature
- [ ] Aucune donnée CB transitant par tes serveurs
- [ ] CSP testé sur [securityheaders.com](https://securityheaders.com)
- [ ] Score SSL A+ sur [ssllabs.com/ssltest](https://ssllabs.com/ssltest)
- [ ] Test envoi email sur [mail-tester.com](https://mail-tester.com) — score ≥ 9/10
- [ ] Pages de login et paiement testées sur [virustotal.com](https://virustotal.com)

---

## 24. Règles de travail — multi-PC obligatoire

> Section à lire avant de toucher au code sur n'importe quelle machine.

### 24.1 Git + GitHub — non négociable

Le projet tourne sur plusieurs machines. Git est la seule infrastructure qui garantit que le code est toujours synchronisé et qu'aucun travail n'est perdu.

**Setup initial (première machine uniquement) :**
```bash
git init
git add .
git commit -m "init"
git remote add origin https://github.com/ton-compte/topolia-site
git push -u origin main
```

**Récupérer le projet sur une nouvelle machine :**
```bash
git clone https://github.com/ton-compte/topolia-site
cd topolia-site
npm install
```

**Réflexe obligatoire à chaque session :**
```bash
# Début de session — toujours avant de coder
git pull

# Fin de session — toujours avant de fermer la machine
git add .
git commit -m "description courte de ce qui a été fait"
git push
```

Ne jamais fermer une session sans avoir pushé. Si tu changes de PC sans avoir pushé, tu perds le travail de la session.

**En fin de session, dire à Claude Code :**
> "On arrête là pour aujourd'hui. Fais le commit et le push Git avec un message qui résume ce qu'on a fait."

**En début de session sur un autre PC, dire à Claude Code :**
> "Lis le BRIEF.md et le CLAUDE.md à la racine. Fais un `git pull` pour récupérer la dernière version. Dis-moi où on en est et ce qu'on avait prévu de faire ensuite."

---

### 24.2 Le fichier `.env` — à recréer sur chaque machine

Le `.env` contient les clés API — il n'est **jamais** dans Git (le `.gitignore` le bloque). C'est la seule chose que Git ne synchronise pas volontairement.

Sur chaque nouvelle machine, recréer le `.env` manuellement en se basant sur le `.env.example` versionné dans le repo et les valeurs listées aux §17 et §18.8 de ce brief.

Les clés elles-mêmes sont à récupérer dans les dashboards des services (Brevo, Clerk, Stripe, Anthropic, etc.).

---

### 24.3 Husky + lint-staged — commits propres

Hook Git `pre-commit` qui vérifie le code avant chaque commit. Si ESLint ou Prettier détecte une erreur → commit bloqué. Garantit que le code pushé est toujours propre, peu importe la machine.

```bash
npm install husky lint-staged --save-dev
```

**Prompt à donner à Claude Code pour l'installer :**
```
Installe et configure Husky + lint-staged :
- Hook pre-commit qui lance ESLint + Prettier sur les fichiers modifiés
- Si une erreur → commit bloqué
- Si tout est propre → commit autorisé
Propose-moi les fichiers de config avant de les créer.
```

---

### 24.4 CLAUDE.md — mémoire de session

Fichier lu automatiquement par Claude Code à chaque ouverture de session. Contient les règles essentielles pour que Claude Code reprenne le contexte sans avoir à relire tout le brief.

**Contenu du `CLAUDE.md` à créer à la racine :**

```markdown
# CLAUDE.md — Topolia.fr

Lis BRIEF.md pour la spec complète du projet.

## Stack
- Astro 4 + TypeScript strict
- CSS variables uniquement — pas de Tailwind
- MDX pour le contenu

## Règles Git (multi-PC)
- Début de session : `git pull` obligatoire
- Fin de session : `git add . && git commit -m "..." && git push` obligatoire
- Ne jamais fermer sans avoir pushé

## Règles de commit
- Husky vérifie ESLint + Prettier avant chaque commit
- Si erreur → corriger avant de recommitter
- Message de commit : description courte et précise de ce qui a changé

## Règles de code
- Jamais de composant sans props TypeScript typées
- Jamais de couleur hardcodée — toujours les CSS variables du §4 du brief
- Toujours `<Image>` d'Astro pour les images, jamais `<img>` nu

## Agent orthographe
- Tout texte ajouté au site passe par l'agent orthographe avant commit
- Voir §24.5 du brief pour le détail
```

**Prompt à donner à Claude Code pour le créer :**
```
Crée un fichier CLAUDE.md à la racine basé sur le §24.4 du BRIEF.md.
```

---

### 24.5 Agent orthographe & grammaire — permanent

Tout texte ajouté au site (articles MDX, composants, UI strings, meta descriptions, alt text) passe par un agent de vérification orthographique et grammaticale avant d'être commité.

**Ce que l'agent vérifie :**
- Orthographe française (accents, accords, conjugaisons)
- Grammaire et syntaxe
- Cohérence du ton (tutoiement — signaler tout « vous » qui se glisse)
- Typographie française (guillemets « », espaces insécables avant : ; ! ?, majuscules après point)

**Ce que l'agent ne touche pas :**
- Le code (TypeScript, CSS, Astro)
- Les slugs et identifiants techniques
- Les URLs et noms de variables
- Les anglicismes techniques (LiDAR, SLAM, workflow…) et les marques (Leica, Faro, DJI…)

**Implémentation retenue : LanguageTool + regex tutoiement**

Approche **gratuite et hors-ligne friendly**, sans dépendance npm ni clé API :

1. **Passe 1 — Regex tutoiement** (locale) : détecte tout `vous / votre / vos / veuillez` qui se glisse, avec whitelist pour `rendez-vous`, `vous-mêmes`.
2. **Passe 2 — LanguageTool API publique** (`api.languagetool.org/v2/check`) : orthographe, grammaire, accords, typographie. Limite 20 req/min en anonyme — largement suffisant en pre-commit.

**Mode tolérant** : si LanguageTool est indisponible (réseau, rate limit), l'agent affiche un warning mais autorise le commit. La passe regex tutoiement reste effective (locale, sans dépendance).

**Intégration dans le workflow :**

Le hook Husky `pre-commit` déclenche l'agent sur tous les fichiers `.mdx` modifiés. Si des erreurs sont détectées → le commit est bloqué avec la liste des corrections suggérées.

```json
// package.json — lint-staged config
{
  "lint-staged": {
    "*.{ts,astro}": ["eslint --fix", "prettier --write"],
    "*.mdx": ["node scripts/check-grammar.mjs", "prettier --write"]
  }
}
```

**Script `scripts/check-grammar.mjs`** — version officielle dans le repo (≈ 130 lignes, zéro dépendance npm, `fetch` natif Node 22).

Logique :
1. Pour chaque fichier passé en argument par lint-staged :
2. Extraire le texte brut (retirer frontmatter, imports MDX, blocs de code, composants `<X />`, balises, commentaires JSX).
3. Passe regex tutoiement → liste d'occurrences avec contexte.
4. Passe LanguageTool : `POST` avec `text`, `language=fr-FR`, `disabledCategories=STYLE,REDUNDANCY,COLLOQUIALISMS`.
5. Si erreurs → liste numérotée + `process.exit(1)`. Sinon → `✅`.

**Pourquoi pas un LLM (Claude / GPT) ?** Évalué et testé : LanguageTool est aussi bon (souvent meilleur) sur les fautes strictes, et la regex tutoiement suffit pour le contrôle éditorial du « vous ». Aucun coût récurrent, aucune clé API à gérer en local pour chaque dev. Réservé pour la Phase 7 (pipeline IA) où la valeur ajoutée d'un LLM est ailleurs (rédaction, recherche, repurposing).

**Prompt à donner à Claude Code pour l'installer :**
```
Implémente l'agent orthographe du §24.5 du BRIEF.md :
- Crée scripts/check-grammar.mjs (LanguageTool + regex tutoiement)
- Intègre-le dans lint-staged sur les fichiers .mdx
- Teste-le sur un fichier MDX de démo avec fautes volontaires
Propose-moi le code avant de l'écrire.
```

---

### 24.6 Résumé en une ligne

**Début de session : `git pull` — Fin de session : `git add . && git commit -m "..." && git push`**

---


## 25. Notes pour le futur Loïc

- **La direction visuelle est verrouillée** (Signal). Toute nouvelle page s'aligne sur les 4 fichiers HTML de référence.
- **Le ton tutoiement direct est non-négociable**. Pas de glissement vers du « vous » corporate.
- **Le gradient bleu→cyan est précieux**. Réservé aux moments forts. Ne pas saturer.
- **Le mark Pulse est une marque, pas une décoration**. Toujours sur fond neutre, jamais déformé.
- **Les chantiers anonymisés ne s'adoucissent pas**. Le problème rencontré reste intact — c'est ce qui les rend uniques.
- **Le contenu prime**. Si on choisit entre une feature flashy et la lisibilité d'un article, la lisibilité gagne.
- **La sécurité n'est pas optionnelle**. Faire la checklist du §22.7 avant chaque mise en prod.
- **Git avant tout**. Pas de session sans `git pull` au début et `git push` à la fin. Voir §24.

---

*Brief v1 généré le 09 mai 2026. Mis à jour le 19 mai 2026 (session 1) — glossaire, chantiers, minute topo, animations Pulse, domaines, vision V3. Mis à jour le 19 mai 2026 (session 2) — auth Clerk, paiement Stripe, sécurité, pipeline IA détaillé, affiliation Metashape/DJI, workflow Git multi-PC. Direction Signal verrouillée. Logo Pulse adopté.*


