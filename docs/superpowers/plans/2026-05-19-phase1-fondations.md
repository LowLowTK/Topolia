# Phase 1 — Fondations Topolia.fr

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffolder le projet Astro Topolia.fr avec TypeScript strict, le système de design complet (tokens + animations), et les composants fondation (Logo, PulseLoader, BaseLayout, Nav, Footer).

**Architecture:** Astro 4 SSG, TypeScript strict, CSS custom properties (zéro Tailwind). Le design system vit entièrement dans `src/styles/global.css`. Les composants sont des fichiers `.astro` avec props typées via interfaces TypeScript. Aucun runtime JS côté client sauf pour le burger de la Nav mobile.

**Tech Stack:** Astro 4+, TypeScript strict, @astrojs/mdx, @astrojs/sitemap, CSS variables, Google Fonts (Onest + JetBrains Mono)

---

## Structure des fichiers

```
C:\dev\Topolia\
├── astro.config.mjs            — config Astro + intégrations mdx/sitemap
├── tsconfig.json               — TypeScript strict
├── .gitignore                  — exclure node_modules, dist, .env
├── .env.example                — template des variables d'env (§17)
├── public/
│   ├── favicon.svg             — favicon SVG (variante mono du Logo)
│   └── og/                     — dossier OG images (vide pour l'instant)
└── src/
    ├── styles/
    │   └── global.css          — tokens §4 + reset + breakpoints §14 + animations §6
    ├── components/
    │   ├── Logo.astro           — 5 variants : mark | wordmark | app-icon | mono | favicon
    │   ├── PulseLoader.astro    — animation Échos LiDAR (§6.5)
    │   ├── Nav.astro            — nav responsive (desktop horizontal / mobile burger+drawer)
    │   └── Footer.astro         — footer minimal
    └── layouts/
        └── BaseLayout.astro    — wrapper global : Nav + slot + Footer + SEO <head>
```

---

## Task 1 : Scaffold Astro avec TypeScript strict

**Files :**
- Create : `astro.config.mjs`, `tsconfig.json`, `package.json` (générés par Astro CLI)

- [ ] **Step 1 : Lancer le scaffold dans le répertoire courant**

```powershell
npm create astro@latest . -- --template minimal --typescript strict --no-install --no-git
```

Répondre `y` si le CLI demande confirmation d'écrire dans un répertoire existant.
Expected : message "Astro is ready" ou similaire.

- [ ] **Step 2 : Installer les dépendances**

```powershell
npm install
```

Expected : dossier `node_modules/` créé, aucune erreur npm.

- [ ] **Step 3 : Vérifier que le projet compile**

```powershell
npm run build
```

Expected : dossier `dist/` créé, zéro erreur TypeScript.

- [ ] **Step 4 : Ouvrir le dev server pour vérifier**

```powershell
npm run dev
```

Expected : `http://localhost:4321` répond avec la page Astro par défaut. Arrêter avec Ctrl+C.

---

## Task 2 : Installer et configurer les intégrations

**Files :**
- Modify : `astro.config.mjs`

- [ ] **Step 1 : Installer @astrojs/mdx et @astrojs/sitemap**

```powershell
npx astro add mdx sitemap --yes
```

Expected : le CLI modifie automatiquement `astro.config.mjs`. Vérifier que les deux intégrations apparaissent dans `integrations:`.

- [ ] **Step 2 : Vérifier + compléter `astro.config.mjs`**

Remplacer le contenu de `astro.config.mjs` par :

```js
// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://topolia.fr',
  integrations: [
    mdx(),
    sitemap(),
  ],
});
```

- [ ] **Step 3 : Vérifier le build avec les intégrations**

```powershell
npm run build
```

Expected : `dist/sitemap-index.xml` présent dans le build. Zéro erreur.

---

## Task 3 : Créer `src/styles/global.css`

**Files :**
- Create : `src/styles/global.css`

- [ ] **Step 1 : Créer le fichier avec tous les tokens §4, le reset, les breakpoints §14 et les 3 classes d'animation §6**

Créer `src/styles/global.css` avec ce contenu exact :

```css
/* ─── Google Fonts ─── */
@import url('https://fonts.googleapis.com/css2?family=Onest:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

/* ─── Design tokens ─── */
:root {
  /* Backgrounds */
  --bg: #FCFCFD;
  --bg-alt: #F5F7FA;
  --bg-warm: #FFFAF0;
  --surface: #FFFFFF;
  --bg-dark: #0F172A;
  --bg-dark-2: #1E293B;

  /* Ink (text) */
  --ink: #0F172A;
  --ink-2: #1E293B;
  --ink-3: #475569;
  --ink-muted: #64748B;
  --ink-light: #94A3B8;

  /* Accents */
  --accent: #2D5BFF;
  --accent-2: #06B6D4;
  --accent-grad: linear-gradient(135deg, #2D5BFF 0%, #06B6D4 100%);
  --accent-soft: rgba(45, 91, 255, 0.10);

  /* Status */
  --green: #10B981;
  --amber: #F59E0B;
  --rose: #F43F5E;

  /* Hairlines */
  --hairline: rgba(15, 23, 42, 0.07);
  --hairline-strong: rgba(15, 23, 42, 0.14);

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.04);
  --shadow-md: 0 4px 12px -2px rgba(15,23,42,0.08), 0 8px 24px -8px rgba(15,23,42,0.10);
  --shadow-lg: 0 12px 32px -8px rgba(15,23,42,0.12), 0 4px 12px -4px rgba(15,23,42,0.06);
  --shadow-glow: 0 0 0 1px rgba(45,91,255,0.10), 0 16px 48px -16px rgba(45,91,255,0.30);

  /* Typography */
  --display: 'Onest', sans-serif;
  --body: 'Onest', sans-serif;
  --mono: 'JetBrains Mono', monospace;

  /* Layout */
  --container-max: 1280px;
  --container-padding: 32px;
  --content-max: 720px;
}

/* ─── Reset ─── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
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
img, video { max-width: 100%; display: block; }
a { color: inherit; }

/* ─── Utilitaires container ─── */
.container {
  width: 100%;
  max-width: var(--container-max);
  margin-inline: auto;
  padding-inline: var(--container-padding);
}
@media (max-width: 639px) {
  .container { padding-inline: 16px; }
}

/* ─── Breakpoints (mobile-first) ─── */
/* sm  ≥ 640px  — tablette portrait  */
/* md  ≥ 900px  — tablette paysage   */
/* lg  ≥ 1080px — desktop            */
/* xl  ≥ 1280px — desktop large      */

/* ─── Animation : règle commune aux anneaux SVG ─── */
.ring {
  transform-box: fill-box;
  transform-origin: center;
}

/* ─── Variante 1 : Sonar (navbar, usage par défaut) ─── */
.sonar .r1 { animation: sn1 2.4s ease-in-out infinite 0s; }
.sonar .r2 { animation: sn1 2.4s ease-in-out infinite .35s; }
.sonar .r3 { animation: sn1 2.4s ease-in-out infinite .7s; }
.sonar .rd { animation: snd 2.4s ease-in-out infinite .9s; }

@keyframes sn1 { 0%,100% { opacity: .15; } 50% { opacity: .8; } }
@keyframes snd  { 0%,100% { transform: scale(.9); } 50% { transform: scale(1.1); } }

/* ─── Variante 2 : Onde sortante (hero page d'accueil) ─── */
.onde .r1 { animation: ow 2.2s ease-out infinite 0s; }
.onde .r2 { animation: ow 2.2s ease-out infinite .73s; }
.onde .r3 { animation: ow 2.2s ease-out infinite 1.46s; }
.onde .rd { animation: snd 2.2s ease-in-out infinite; }

@keyframes ow {
  0%   { opacity: .8;  transform: scale(.1); }
  70%  { opacity: 0;   transform: scale(1.3); }
  100% { opacity: 0;   transform: scale(1.3); }
}

/* ─── Variante 3 : Veille douce (favicon, états idle) ─── */
.veille .r1 { animation: vl 4.5s ease-in-out infinite 0s; }
.veille .r2 { animation: vl 4.5s ease-in-out infinite .9s; }
.veille .r3 { animation: vl 4.5s ease-in-out infinite 1.8s; }
.veille .rd { animation: snd 4.5s ease-in-out infinite 2.5s; }

@keyframes vl { 0%,100% { opacity: .08; } 50% { opacity: .75; } }

/* ─── Animation Échos LiDAR (PulseLoader) ─── */
@keyframes pulseRing {
  0%   { transform: scale(0.4); opacity: 0; }
  20%  { opacity: 0.8; }
  100% { transform: scale(1.4); opacity: 0; }
}
```

- [ ] **Step 2 : Importer global.css dans la page index existante pour vérifier**

Ouvrir `src/pages/index.astro` et s'assurer que l'import est présent dans le frontmatter :

```astro
---
import '../styles/global.css';
---
<html lang="fr">
  <head><meta charset="utf-8" /><title>Topolia</title></head>
  <body><h1>Topolia — fondations OK</h1></body>
</html>
```

- [ ] **Step 3 : Build pour vérifier qu'il n'y a pas d'erreur CSS**

```powershell
npm run build
```

Expected : build réussi, zéro erreur.

---

## Task 4 : Créer `src/components/Logo.astro`

**Files :**
- Create : `src/components/Logo.astro`

- [ ] **Step 1 : Créer le composant Logo avec les 5 variants**

```astro
---
interface Props {
  variant?: 'mark' | 'wordmark' | 'app-icon' | 'mono' | 'favicon';
  size?: number;
  class?: string;
  animClass?: 'sonar' | 'onde' | 'veille' | '';
}

const {
  variant = 'mark',
  size = 40,
  class: className = '',
  animClass = '',
} = Astro.props;

const isMono = variant === 'mono';
---

{variant === 'mark' && (
  <svg
    class:list={['logo-mark', animClass, className]}
    width={size}
    height={size}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Topolia"
    role="img"
  >
    <defs>
      <linearGradient id="pulse-grad-mark" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#2D5BFF"/>
        <stop offset="100%" stop-color="#06B6D4"/>
      </linearGradient>
    </defs>
    <g fill="none" stroke="url(#pulse-grad-mark)">
      <circle class="ring r1" cx="50" cy="50" r="36" stroke-width="3" opacity="0.25"/>
      <circle class="ring r2" cx="50" cy="50" r="26" stroke-width="3.5" opacity="0.5"/>
      <circle class="ring r3" cx="50" cy="50" r="16" stroke-width="4" opacity="0.85"/>
    </g>
    <circle class="ring rd" cx="50" cy="50" r="6" fill="url(#pulse-grad-mark)"/>
  </svg>
)}

{variant === 'wordmark' && (
  <div class:list={['logo-wordmark', animClass, className]} style={`height: ${size}px;`}>
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="pulse-grad-wm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#2D5BFF"/>
          <stop offset="100%" stop-color="#06B6D4"/>
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#pulse-grad-wm)">
        <circle class="ring r1" cx="50" cy="50" r="36" stroke-width="3" opacity="0.25"/>
        <circle class="ring r2" cx="50" cy="50" r="26" stroke-width="3.5" opacity="0.5"/>
        <circle class="ring r3" cx="50" cy="50" r="16" stroke-width="4" opacity="0.85"/>
      </g>
      <circle class="ring rd" cx="50" cy="50" r="6" fill="url(#pulse-grad-wm)"/>
    </svg>
    <span class="logo-text" aria-label="Topolia">topolia.</span>
  </div>
)}

{variant === 'app-icon' && (
  <div class:list={['logo-app-icon', className]} style={`width: ${size}px; height: ${size}px;`}>
    <svg
      width="70%"
      height="70%"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Topolia"
      role="img"
    >
      <defs>
        <linearGradient id="pulse-grad-app" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#2D5BFF"/>
          <stop offset="100%" stop-color="#06B6D4"/>
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#pulse-grad-app)">
        <circle cx="50" cy="50" r="36" stroke-width="3" opacity="0.25"/>
        <circle cx="50" cy="50" r="26" stroke-width="3.5" opacity="0.5"/>
        <circle cx="50" cy="50" r="16" stroke-width="4" opacity="0.85"/>
      </g>
      <circle cx="50" cy="50" r="6" fill="url(#pulse-grad-app)"/>
    </svg>
  </div>
)}

{variant === 'mono' && (
  <svg
    class:list={['logo-mono', className]}
    width={size}
    height={size}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Topolia"
    role="img"
  >
    <g fill="none" stroke="currentColor">
      <circle cx="50" cy="50" r="36" stroke-width="3" opacity="0.25"/>
      <circle cx="50" cy="50" r="26" stroke-width="3.5" opacity="0.5"/>
      <circle cx="50" cy="50" r="16" stroke-width="4" opacity="0.85"/>
    </g>
    <circle cx="50" cy="50" r="6" fill="currentColor"/>
  </svg>
)}

{variant === 'favicon' && (
  <svg
    class:list={[className]}
    width={size}
    height={size}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Topolia"
    role="img"
  >
    <defs>
      <linearGradient id="pulse-grad-fav" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#2D5BFF"/>
        <stop offset="100%" stop-color="#06B6D4"/>
      </linearGradient>
    </defs>
    <g fill="none" stroke="url(#pulse-grad-fav)">
      <circle cx="50" cy="50" r="30" stroke-width="4" opacity="0.4"/>
      <circle cx="50" cy="50" r="18" stroke-width="5" opacity="0.8"/>
    </g>
    <circle cx="50" cy="50" r="7" fill="url(#pulse-grad-fav)"/>
  </svg>
)}

<style>
  .logo-wordmark {
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }
  .logo-text {
    font-family: var(--display);
    font-weight: 700;
    font-size: 1.25rem;
    letter-spacing: -0.03em;
    color: var(--ink);
    line-height: 1;
  }
  .logo-app-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-dark);
    border-radius: 22%;
  }
</style>
```

- [ ] **Step 2 : Build pour vérifier le composant**

```powershell
npm run build
```

Expected : zéro erreur TypeScript ou Astro. Le composant est valide.

---

## Task 5 : Créer `src/components/PulseLoader.astro`

**Files :**
- Create : `src/components/PulseLoader.astro`

- [ ] **Step 1 : Créer le composant PulseLoader**

```astro
---
interface Props {
  size?: number;
  class?: string;
}

const { size = 80, class: className = '' } = Astro.props;
---

<div class:list={['pulse-loader-wrap', className]} aria-label="Chargement" role="status">
  <svg
    class="pulse-loader"
    width={size}
    height={size}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="pulse-loader-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#2D5BFF"/>
        <stop offset="100%" stop-color="#06B6D4"/>
      </linearGradient>
    </defs>
    <!-- Anneaux d'écho LiDAR — naissent au centre et se propagent vers l'extérieur -->
    <circle class="ring" cx="50" cy="50" r="36" fill="none" stroke="url(#pulse-loader-grad)" stroke-width="2.5"/>
    <circle class="ring" cx="50" cy="50" r="26" fill="none" stroke="url(#pulse-loader-grad)" stroke-width="3"/>
    <circle class="ring" cx="50" cy="50" r="16" fill="none" stroke="url(#pulse-loader-grad)" stroke-width="3.5"/>
    <!-- Point central stable -->
    <circle cx="50" cy="50" r="5" fill="url(#pulse-loader-grad)"/>
  </svg>
</div>

<style>
  .pulse-loader-wrap {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .pulse-loader .ring {
    transform-origin: 50px 50px;
    animation: pulseRing 2s cubic-bezier(0.16, 0.5, 0.5, 1) infinite;
  }
  .pulse-loader .ring:nth-child(2) { animation-delay: 0.5s; }
  .pulse-loader .ring:nth-child(3) { animation-delay: 1s; }

  @keyframes pulseRing {
    0%   { transform: scale(0.4); opacity: 0; }
    20%  { opacity: 0.8; }
    100% { transform: scale(1.4); opacity: 0; }
  }
</style>
```

- [ ] **Step 2 : Build pour vérifier**

```powershell
npm run build
```

Expected : zéro erreur.

---

## Task 6 : Créer `src/components/Nav.astro`

**Files :**
- Create : `src/components/Nav.astro`

- [ ] **Step 1 : Créer la navigation responsive**

Desktop (≥ 900px) : liens horizontaux + Logo wordmark.
Mobile (< 900px) : Logo + burger button → drawer plein écran.

```astro
---
import Logo from './Logo.astro';

const navLinks = [
  { href: '/articles/', label: 'Articles' },
  { href: '/glossaire/', label: 'Glossaire' },
  { href: '/chantiers/', label: 'Chantiers' },
  { href: '/minute-topo/', label: 'Minute topo' },
  { href: '/a-propos/', label: 'À propos' },
];

const currentPath = Astro.url.pathname;
---

<header class="nav-header">
  <div class="container nav-inner">
    <a href="/" class="nav-logo" aria-label="Topolia — accueil">
      <Logo variant="wordmark" size={32} animClass="sonar" />
    </a>

    <!-- Navigation desktop -->
    <nav class="nav-links" aria-label="Navigation principale">
      {navLinks.map(link => (
        <a
          href={link.href}
          class:list={['nav-link', { 'nav-link--active': currentPath.startsWith(link.href) }]}
        >
          {link.label}
        </a>
      ))}
    </nav>

    <!-- Burger mobile -->
    <button
      class="nav-burger"
      aria-label="Ouvrir le menu"
      aria-expanded="false"
      aria-controls="nav-drawer"
      id="nav-burger-btn"
    >
      <span class="burger-bar"></span>
      <span class="burger-bar"></span>
      <span class="burger-bar"></span>
    </button>
  </div>
</header>

<!-- Drawer mobile -->
<div class="nav-drawer" id="nav-drawer" aria-hidden="true">
  <div class="nav-drawer-inner">
    <nav aria-label="Menu mobile">
      {navLinks.map(link => (
        <a
          href={link.href}
          class:list={['nav-drawer-link', { 'nav-drawer-link--active': currentPath.startsWith(link.href) }]}
        >
          {link.label}
        </a>
      ))}
    </nav>
  </div>
</div>
<div class="nav-overlay" id="nav-overlay" aria-hidden="true"></div>

<script>
  const burger = document.getElementById('nav-burger-btn')!;
  const drawer = document.getElementById('nav-drawer')!;
  const overlay = document.getElementById('nav-overlay')!;

  function openMenu() {
    drawer.setAttribute('aria-hidden', 'false');
    drawer.classList.add('nav-drawer--open');
    overlay.classList.add('nav-overlay--visible');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Fermer le menu');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    drawer.setAttribute('aria-hidden', 'true');
    drawer.classList.remove('nav-drawer--open');
    overlay.classList.remove('nav-overlay--visible');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Ouvrir le menu');
    document.body.style.overflow = '';
  }

  burger.addEventListener('click', () => {
    const isOpen = drawer.classList.contains('nav-drawer--open');
    isOpen ? closeMenu() : openMenu();
  });

  overlay.addEventListener('click', closeMenu);

  document.querySelectorAll('.nav-drawer-link').forEach(link => {
    link.addEventListener('click', closeMenu);
  });
</script>

<style>
  .nav-header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(252, 252, 253, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--hairline);
  }

  .nav-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
  }

  .nav-logo {
    display: inline-flex;
    align-items: center;
    text-decoration: none;
    flex-shrink: 0;
  }

  /* ── Desktop links ── */
  .nav-links {
    display: none;
    align-items: center;
    gap: 4px;
  }

  .nav-link {
    padding: 8px 12px;
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--ink-3);
    text-decoration: none;
    border-radius: 8px;
    transition: color 0.15s, background 0.15s;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
  }

  .nav-link:hover { color: var(--ink); background: var(--bg-alt); }
  .nav-link--active { color: var(--accent); }

  /* ── Burger ── */
  .nav-burger {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
    width: 44px;
    height: 44px;
    padding: 10px;
    background: none;
    border: none;
    cursor: pointer;
    border-radius: 8px;
  }
  .nav-burger:hover { background: var(--bg-alt); }

  .burger-bar {
    display: block;
    width: 22px;
    height: 2px;
    background: var(--ink);
    border-radius: 2px;
    transition: opacity 0.2s, transform 0.2s;
  }

  /* ── Drawer ── */
  .nav-drawer {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: var(--surface);
    transform: translateX(100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow-y: auto;
  }

  .nav-drawer--open { transform: translateX(0); }

  .nav-drawer-inner {
    padding: 80px 24px 40px;
  }

  .nav-drawer-link {
    display: flex;
    align-items: center;
    min-height: 56px;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--ink);
    text-decoration: none;
    border-bottom: 1px solid var(--hairline);
    transition: color 0.15s;
  }

  .nav-drawer-link:hover,
  .nav-drawer-link--active { color: var(--accent); }

  .nav-overlay {
    position: fixed;
    inset: 0;
    z-index: 150;
    background: rgba(15, 23, 42, 0.4);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s;
  }
  .nav-overlay--visible { opacity: 1; pointer-events: auto; }

  /* ── Responsive ── */
  @media (min-width: 900px) {
    .nav-links { display: flex; }
    .nav-burger { display: none; }
    .nav-drawer { display: none; }
    .nav-overlay { display: none; }
  }
</style>
```

- [ ] **Step 2 : Build pour vérifier**

```powershell
npm run build
```

Expected : zéro erreur TypeScript ou Astro.

---

## Task 7 : Créer `src/components/Footer.astro`

**Files :**
- Create : `src/components/Footer.astro`

- [ ] **Step 1 : Créer le footer minimal**

```astro
---
import Logo from './Logo.astro';

const year = new Date().getFullYear();

const footerLinks = [
  { href: '/articles/', label: 'Articles' },
  { href: '/glossaire/', label: 'Glossaire' },
  { href: '/chantiers/', label: 'Chantiers' },
  { href: '/newsletter/', label: 'Newsletter' },
  { href: '/a-propos/', label: 'À propos' },
];
---

<footer class="footer">
  <div class="container footer-inner">
    <div class="footer-brand">
      <Logo variant="wordmark" size={28} />
      <p class="footer-tagline">La topographie moderne, sans filtre.</p>
    </div>

    <nav class="footer-nav" aria-label="Liens footer">
      {footerLinks.map(link => (
        <a href={link.href} class="footer-link">{link.label}</a>
      ))}
    </nav>

    <p class="footer-copy">
      &copy; {year} Topolia.fr — Tous droits réservés
    </p>
  </div>
</footer>

<style>
  .footer {
    border-top: 1px solid var(--hairline);
    background: var(--bg-alt);
    padding: 48px 0 32px;
    margin-top: auto;
  }

  .footer-inner {
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  .footer-brand {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .footer-tagline {
    font-size: 0.875rem;
    color: var(--ink-muted);
  }

  .footer-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .footer-link {
    padding: 6px 10px;
    font-size: 0.875rem;
    color: var(--ink-3);
    text-decoration: none;
    border-radius: 6px;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    transition: color 0.15s, background 0.15s;
  }

  .footer-link:hover { color: var(--ink); background: var(--hairline); }

  .footer-copy {
    font-size: 0.8rem;
    color: var(--ink-light);
  }

  @media (min-width: 900px) {
    .footer-inner {
      flex-direction: row;
      align-items: flex-start;
      justify-content: space-between;
      flex-wrap: wrap;
    }
    .footer-copy {
      width: 100%;
    }
  }
</style>
```

- [ ] **Step 2 : Build pour vérifier**

```powershell
npm run build
```

Expected : zéro erreur.

---

## Task 8 : Créer `src/layouts/BaseLayout.astro`

**Files :**
- Create : `src/layouts/BaseLayout.astro`
- Modify : `src/pages/index.astro` — utiliser BaseLayout

- [ ] **Step 1 : Créer le layout de base**

```astro
---
import Nav from '../components/Nav.astro';
import Footer from '../components/Footer.astro';
import '../styles/global.css';

interface Props {
  title: string;
  description?: string;
  ogImage?: string;
  canonicalUrl?: string;
}

const {
  title,
  description = 'Topolia.fr — La topographie moderne : LiDAR, drone, photogrammétrie. Tutoriels, comparatifs et astuces terrain.',
  ogImage = '/og/default.png',
  canonicalUrl,
} = Astro.props;

const siteUrl = import.meta.env.PUBLIC_SITE_URL ?? 'https://topolia.fr';
const canonical = canonicalUrl ?? `${siteUrl}${Astro.url.pathname}`;
const fullTitle = title === 'Topolia' ? title : `${title} — Topolia`;
---

<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="generator" content={Astro.generator} />

    <title>{fullTitle}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />

    <!-- Open Graph -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content={canonical} />
    <meta property="og:title" content={fullTitle} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={`${siteUrl}${ogImage}`} />
    <meta property="og:locale" content="fr_FR" />
    <meta property="og:site_name" content="Topolia" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={fullTitle} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={`${siteUrl}${ogImage}`} />

    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  </head>
  <body>
    <Nav />
    <main>
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

- [ ] **Step 2 : Mettre à jour `src/pages/index.astro` pour utiliser BaseLayout**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="Topolia" description="La topographie moderne, sans filtre.">
  <div class="container" style="padding-top: 80px; padding-bottom: 80px;">
    <h1 style="font-size: clamp(2rem, 6vw, 4rem); font-weight: 800; letter-spacing: -0.03em;">
      Topolia — fondations Phase 1 ✓
    </h1>
    <p style="margin-top: 16px; color: var(--ink-3);">
      Design system, Logo, PulseLoader, Nav et Footer opérationnels.
    </p>
  </div>
</BaseLayout>
```

- [ ] **Step 3 : Build final de vérification**

```powershell
npm run build
```

Expected : build réussi, zéro erreur, `dist/index.html` contient le markup complet.

---

## Task 9 : Créer le favicon SVG et les dossiers publics

**Files :**
- Create : `public/favicon.svg`
- Create : `public/og/` (dossier vide — placeholder)

- [ ] **Step 1 : Créer `public/favicon.svg`**

Version mono (pas de gradient — le gradient ne s'affiche pas bien en tout-petit) :

```svg
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <g fill="none" stroke="#2D5BFF">
    <circle cx="50" cy="50" r="30" stroke-width="4" opacity="0.4"/>
    <circle cx="50" cy="50" r="18" stroke-width="5" opacity="0.8"/>
  </g>
  <circle cx="50" cy="50" r="7" fill="#2D5BFF"/>
</svg>
```

- [ ] **Step 2 : Créer `public/og/default.png`**

Pour l'instant, créer un fichier `.gitkeep` dans `public/og/` pour que le dossier soit versionné. L'OG image par défaut sera générée en Phase 4.

```powershell
New-Item -ItemType Directory -Force public/og
New-Item -ItemType File -Force public/og/.gitkeep
```

---

## Task 10 : Fichiers de configuration + git init

**Files :**
- Create : `.gitignore`
- Create : `.env.example`

- [ ] **Step 1 : Créer `.gitignore`**

```
node_modules/
dist/
.astro/
.env
.env.local
.DS_Store
Thumbs.db
```

- [ ] **Step 2 : Créer `.env.example`**

```bash
# Site
PUBLIC_SITE_URL=https://topolia.fr

# Newsletter (Brevo)
BREVO_API_KEY=xkeysib-xxxxx
BREVO_LIST_ID=2

# Auth (Clerk)
PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Analytics (Plausible)
PUBLIC_PLAUSIBLE_DOMAIN=topolia.fr
```

- [ ] **Step 3 : Initialiser git et faire le premier commit**

```powershell
git init
git add astro.config.mjs tsconfig.json package.json package-lock.json .gitignore .env.example public src
git commit -m "feat(phase1): fondations — Astro scaffold, design tokens, Logo, PulseLoader, Nav, Footer, BaseLayout"
```

Expected : commit créé sur la branche `main`.

- [ ] **Step 4 : Vérification finale — dev server**

```powershell
npm run dev
```

Ouvrir `http://localhost:4321` et vérifier :
- [ ] La page charge sans erreur console
- [ ] La Nav affiche le Logo avec l'animation sonar
- [ ] Le burger s'ouvre sur mobile (DevTools < 900px)
- [ ] Le Footer est présent
- [ ] Les polices Onest + JetBrains Mono se chargent (onglet Network → Fonts)
- [ ] Aucune erreur TypeScript dans le terminal

---

## Récapitulatif des fichiers créés

| Fichier | Statut |
|---|---|
| `astro.config.mjs` | Modifié — mdx + sitemap |
| `tsconfig.json` | Généré par CLI (strict) |
| `.gitignore` | Créé |
| `.env.example` | Créé |
| `src/styles/global.css` | Créé — tokens + reset + animations |
| `src/components/Logo.astro` | Créé — 5 variants |
| `src/components/PulseLoader.astro` | Créé — Échos LiDAR |
| `src/components/Nav.astro` | Créé — responsive |
| `src/components/Footer.astro` | Créé — minimal |
| `src/layouts/BaseLayout.astro` | Créé — SEO + Nav + Footer |
| `src/pages/index.astro` | Modifié — utilise BaseLayout |
| `public/favicon.svg` | Créé — version mono |
| `public/og/.gitkeep` | Créé — placeholder |
