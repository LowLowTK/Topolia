# Phase 4 — Newsletter + Analytics + OG Images Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans.

**Goal:** Activer la newsletter via Brevo (API), Plausible Analytics (script tag), et générer dynamiquement les images Open Graph pour chaque article/page (partages réseaux sociaux propres).

**Architecture:** Endpoint API Astro en mode "on-demand" (`prerender = false`) pour le POST newsletter — exige l'ajout d'un adapter Node. Plausible : simple `<script>` dans `<head>` conditionné par variable d'env. OG images : route Astro qui génère une PNG via `satori` + `@resvg/resvg-js` à la demande au build.

**Tech Stack:** Brevo REST API v3, Plausible script, `satori` + `@resvg/resvg-js` pour OG, `@astrojs/node` adapter pour les endpoints serveur.

---

## Vue d'ensemble

```
src/
├── components/
│   ├── NewsletterInline.astro      — NEW : form newsletter avec validation client
│   └── PlausibleScript.astro       — NEW : <script> Plausible conditionné
├── lib/
│   ├── brevo.ts                    — NEW : client Brevo (subscribe contact)
│   └── og-template.ts              — NEW : template HTML pour les OG images
├── pages/
│   ├── newsletter.astro            — NEW : page dédiée d'inscription
│   ├── api/
│   │   └── newsletter.ts           — NEW : endpoint POST → Brevo
│   └── og/
│       └── [...slug].png.ts        — NEW : génération PNG dynamique
└── layouts/
    └── BaseLayout.astro            — MODIFY : ajout Plausible + URL OG dynamique
```

---

## Découpage en sous-phases

| # | Sous-phase | Livrable |
|---|---|---|
| **4.A** | Astro hybrid + adapter Node | `npm install @astrojs/node`, config |
| **4.B** | Brevo : lib + endpoint API + composant `<NewsletterInline />` + page `/newsletter` | Newsletter fonctionnelle si `BREVO_API_KEY` défini |
| **4.C** | Plausible : composant `<PlausibleScript />` + intégration dans `BaseLayout` | Tracking actif si `PUBLIC_PLAUSIBLE_DOMAIN` défini |
| **4.D** | OG images dynamiques : route `/og/[slug].png` + intégration `BaseLayout` | Image OG unique par article/page |
| **4.E** | Build final + commit |  |

---

## ⚠️ Avant de coder — décisions à valider

### 1. Adapter Astro

Les endpoints API (`/api/newsletter.ts`) et les routes dynamiques server-side (OG si on les rend on-demand) **exigent** un adapter. Pour rester compatible Vercel/Netlify gratuit :

| Option | Avantage | Inconvénient |
|---|---|---|
| **`@astrojs/node`** standalone | Marche partout, dev local OK | Pas l'idéal sur Vercel/Netlify serverless |
| **`@astrojs/vercel`** | Optimisé pour Vercel | Couple le repo à Vercel |
| **`@astrojs/netlify`** | Optimisé pour Netlify | Couple à Netlify |
| **Mode hybride + Brevo en client** | Pas d'adapter | Exposerait l'API key côté client → ❌ inacceptable |

**Recommandation :** `@astrojs/node` en mode `hybrid` — les pages statiques restent SSG, seules les routes `prerender: false` passent en SSR. Compatible avec n'importe quel hébergeur Node.

### 2. OG images — au build ou à la demande ?

| Approche | Description |
|---|---|
| **Au build (SSG)** | Génère un `.png` pour chaque article au moment du build. Sortie statique. Marche sans adapter. |
| **À la demande (SSR)** | Route `/og/[slug].png` rend à la volée. Sortie dynamique. Plus flexible mais demande l'adapter. |

**Recommandation : build-time.** Quelques dizaines d'articles → quelques dizaines de PNG. Pas besoin de SSR pour ça. Plus performant en prod.

### 3. Satori et compatibilité Windows

`satori` + `@resvg/resvg-js` ont des binaires natifs. Sur Windows ça marche, mais le déploiement Vercel a parfois besoin d'un peu de config. À tester.

**Alternative plus simple :** réutiliser le `HeroPlaceholder.astro` existant comme template SVG, le convertir en PNG via `sharp` (déjà installé par Astro). Moins de dépendances.

**Recommandation : sharp-based.** On a déjà un visuel cohérent avec le HeroPlaceholder. On le génère en PNG via sharp, point.

### 4. Page `/newsletter` — minimaliste ou riche ?

Le brief §11 demande "Page `/newsletter`" — pas de spec détaillée. Deux niveaux possibles :

| Niveau | Contenu |
|---|---|
| **Minimal** | Hero + formulaire + 3 bullet points "ce que tu reçois" + CTA |
| **Riche** | Hero + form + témoignages + archive des derniers numéros + double opt-in flow visualisé |

**Recommandation : minimal.** On n'a aucun témoignage ni archive de newsletter encore.

---

## Sous-phase 4.A — Adapter Node + mode hybrid

### Task 1 : Installer et configurer `@astrojs/node`

**Files :**
- Modify : `astro.config.mjs`
- Modify : `package.json` (via npm install)

- [ ] **Step 1 : Installer**

```powershell
npm install @astrojs/node
```

- [ ] **Step 2 : Configurer en mode hybrid**

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://topolia.fr',
  output: 'static', // par défaut SSG, prerender: false individuel pour les routes serveur
  adapter: node({ mode: 'standalone' }),
  integrations: [mdx(), sitemap()],
});
```

Note : Astro 6 utilise `output: 'static'` + `prerender: false` ponctuel pour le mode hybride.

- [ ] **Step 3 : Build de vérification**

```powershell
npm run build
```

Expected : Build OK, ~26 pages comme avant. L'adapter Node ne change rien tant qu'aucune route n'a `prerender = false`.

---

## Sous-phase 4.B — Newsletter Brevo

### Task 2 : Client Brevo dans `src/lib/brevo.ts`

**Files :**
- Create : `src/lib/brevo.ts`

- [ ] **Step 1 : Fonction d'inscription d'un contact**

```ts
/**
 * Client minimal Brevo API v3 — inscription d'un contact à une liste.
 * Doc : https://developers.brevo.com/reference/createcontact
 */

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/contacts';

export interface BrevoSubscribeResult {
  ok: boolean;
  status: number;
  message: string;
}

export async function subscribeContact(
  email: string,
  listId: number,
  apiKey: string,
): Promise<BrevoSubscribeResult> {
  if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return { ok: false, status: 400, message: 'Email invalide.' };
  }

  try {
    const response = await fetch(BREVO_ENDPOINT, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        email,
        listIds: [listId],
        updateEnabled: true, // si le contact existe déjà, on l'ajoute à la liste
      }),
    });

    if (response.ok) {
      return {
        ok: true,
        status: response.status,
        message: 'Inscription enregistrée. À très vite par email.',
      };
    }

    // Code 400 + message "Contact already exist" → considère comme succès
    const data = await response.json().catch(() => ({}));
    if (response.status === 400 && /already/i.test(data?.message ?? '')) {
      return {
        ok: true,
        status: 200,
        message: 'Tu es déjà inscrit. Pas besoin de recommencer.',
      };
    }

    return {
      ok: false,
      status: response.status,
      message: data?.message ?? 'Erreur Brevo inconnue.',
    };
  } catch (err) {
    return {
      ok: false,
      status: 500,
      message: `Erreur réseau : ${(err as Error).message}`,
    };
  }
}
```

---

### Task 3 : Endpoint API `/api/newsletter.ts`

**Files :**
- Create : `src/pages/api/newsletter.ts`

- [ ] **Step 1 : POST endpoint serveur**

```ts
import type { APIRoute } from 'astro';
import { subscribeContact } from '../../lib/brevo';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const apiKey = import.meta.env.BREVO_API_KEY;
  const listId = Number(import.meta.env.BREVO_LIST_ID ?? '0');

  if (!apiKey || !listId) {
    return new Response(
      JSON.stringify({
        ok: false,
        message: "Newsletter pas encore configurée (manque BREVO_API_KEY ou BREVO_LIST_ID).",
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ ok: false, message: 'Corps de requête invalide.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const email = (body.email ?? '').trim().toLowerCase();
  if (!email) {
    return new Response(
      JSON.stringify({ ok: false, message: 'Email manquant.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const result = await subscribeContact(email, listId, apiKey);
  return new Response(JSON.stringify(result), {
    status: result.ok ? 200 : result.status,
    headers: { 'Content-Type': 'application/json' },
  });
};
```

---

### Task 4 : Composant `<NewsletterInline />`

**Files :**
- Create : `src/components/NewsletterInline.astro`

- [ ] **Step 1 : Form HTML + validation client + appel fetch**

```astro
---
interface Props {
  title?: string;
  description?: string;
  variant?: 'light' | 'dark';
}
const {
  title = 'Reste à jour',
  description = 'Un email par semaine : article + astuce + retour terrain. Pas de bruit.',
  variant = 'light',
} = Astro.props;
---

<form class:list={['newsletter-form', `newsletter-form--${variant}`]} data-newsletter-form>
  <div class="newsletter-text">
    <h3 class="newsletter-title">{title}</h3>
    <p class="newsletter-description">{description}</p>
  </div>
  <div class="newsletter-input-row">
    <label class="visually-hidden" for="newsletter-email">Adresse email</label>
    <input
      id="newsletter-email"
      type="email"
      name="email"
      required
      autocomplete="email"
      placeholder="ton@email.fr"
      class="newsletter-input"
    />
    <button type="submit" class="newsletter-submit">S'inscrire</button>
  </div>
  <p class="newsletter-message" data-newsletter-message aria-live="polite"></p>
  <p class="newsletter-note">Sans spam. Désinscription en un clic à tout moment.</p>
</form>

<script>
  const forms = document.querySelectorAll<HTMLFormElement>('[data-newsletter-form]');
  for (const form of forms) {
    const msg = form.querySelector<HTMLParagraphElement>('[data-newsletter-message]');
    const btn = form.querySelector<HTMLButtonElement>('.newsletter-submit');
    if (!msg || !btn) continue;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = form.querySelector<HTMLInputElement>('input[name="email"]');
      if (!input) return;
      const email = input.value.trim();

      msg.textContent = '';
      msg.classList.remove('newsletter-message--ok', 'newsletter-message--error');
      btn.disabled = true;
      btn.textContent = 'Envoi…';

      try {
        const res = await fetch('/api/newsletter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        msg.textContent = data.message;
        msg.classList.add(data.ok ? 'newsletter-message--ok' : 'newsletter-message--error');
        if (data.ok) input.value = '';
      } catch {
        msg.textContent = 'Erreur réseau, réessaye dans un instant.';
        msg.classList.add('newsletter-message--error');
      } finally {
        btn.disabled = false;
        btn.textContent = "S'inscrire";
      }
    });
  }
</script>

<style>
  .newsletter-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 32px;
    border-radius: 16px;
    border: 1px solid var(--hairline);
    background: var(--surface);
  }
  .newsletter-form--dark {
    background: var(--bg-dark-2);
    border-color: rgba(255, 255, 255, 0.06);
    color: var(--surface);
  }
  .newsletter-title {
    font-family: var(--display);
    font-size: 1.4rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: inherit;
  }
  .newsletter-description {
    margin-top: 6px;
    font-size: 0.95rem;
    color: var(--ink-3);
    line-height: 1.5;
  }
  .newsletter-form--dark .newsletter-description {
    color: var(--ink-light);
  }
  .newsletter-input-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .newsletter-input {
    flex: 1 1 240px;
    min-height: 44px;
    padding: 10px 14px;
    border: 1px solid var(--hairline-strong);
    border-radius: 8px;
    background: var(--bg);
    color: var(--ink);
    font-family: inherit;
    font-size: 0.95rem;
  }
  .newsletter-input:focus {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .newsletter-submit {
    min-height: 44px;
    padding: 10px 22px;
    border: none;
    border-radius: 8px;
    background: var(--ink);
    color: var(--surface);
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    transition:
      transform 0.15s,
      box-shadow 0.15s;
  }
  .newsletter-submit:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
  .newsletter-submit:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .newsletter-form--dark .newsletter-submit {
    background: var(--accent-grad);
  }
  .newsletter-message {
    font-size: 0.875rem;
    min-height: 1.2em;
    margin: 0;
  }
  .newsletter-message--ok {
    color: var(--green);
  }
  .newsletter-message--error {
    color: var(--rose);
  }
  .newsletter-note {
    font-size: 0.78rem;
    color: var(--ink-muted);
  }
  .newsletter-form--dark .newsletter-note {
    color: var(--ink-light);
  }
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
```

---

### Task 5 : Page `/newsletter.astro`

**Files :**
- Create : `src/pages/newsletter.astro`

- [ ] **Step 1 : Page d'inscription dédiée**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import NewsletterInline from '../components/NewsletterInline.astro';
---

<BaseLayout
  title="Newsletter"
  description="Un email par semaine sur la topographie moderne. Article + astuce + retour terrain. Pas de spam, désabonnement en un clic."
>
  <section class="container newsletter-page">
    <header class="page-header">
      <p class="eyebrow">Newsletter Topolia</p>
      <h1 class="page-title">
        Un email par <span class="accent">semaine</span>.
      </h1>
      <p class="page-sub">
        Le nouvel article de la semaine, une astuce que je viens d'apprendre, un retour terrain
        intéressant. C'est court, c'est précis, c'est sans spam.
      </p>
    </header>

    <NewsletterInline
      title="Inscris-toi"
      description="Brevo gère la liste. RGPD-friendly. Désinscription en un clic."
    />

    <section class="content-section">
      <h2>Ce que tu vas recevoir</h2>
      <ul>
        <li>Le <strong>nouvel article</strong> publié cette semaine</li>
        <li>Une <strong>minute topo</strong> — astuce ultra-courte</li>
        <li>De temps en temps un <strong>retour de chantier</strong> intéressant</li>
        <li>Et c'est tout — aucun email promo, aucun lien sponsorisé non identifié</li>
      </ul>

      <h2>Ce que tu ne vas pas recevoir</h2>
      <ul>
        <li>Du marketing déguisé en contenu</li>
        <li>Trois emails par semaine pour te rappeler que je suis là</li>
        <li>Des séquences de relance automatiques</li>
      </ul>

      <h2>Et techniquement</h2>
      <p>
        La newsletter est gérée par <strong>Brevo</strong> (ex-Sendinblue), hébergé en France et
        RGPD-compliant. Tu peux te désabonner en un clic depuis n'importe quel email.
      </p>
    </section>
  </section>
</BaseLayout>

<style>
  .newsletter-page {
    padding: 60px 0 80px;
    max-width: var(--content-max);
  }
  .page-header {
    margin-bottom: 40px;
  }
  .eyebrow {
    font-family: var(--mono);
    font-size: 0.8rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 14px;
  }
  .page-title {
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
  .page-sub {
    margin-top: 16px;
    font-size: 1.1rem;
    color: var(--ink-3);
    line-height: 1.55;
  }
  .content-section {
    margin-top: 56px;
  }
  .content-section h2 {
    font-family: var(--display);
    font-size: 1.4rem;
    font-weight: 700;
    margin: 40px 0 14px;
    color: var(--ink);
  }
  .content-section ul {
    margin: 14px 0 14px 22px;
    color: var(--ink-2);
    line-height: 1.7;
  }
  .content-section li {
    margin: 6px 0;
  }
  .content-section p {
    margin: 14px 0;
    font-size: 1rem;
    color: var(--ink-2);
    line-height: 1.65;
  }
  .content-section strong {
    color: var(--ink);
    font-weight: 600;
  }
</style>
```

---

### Task 6 : Intégrer `<NewsletterInline />` sur la home

**Files :**
- Modify : `src/pages/index.astro` (remplacer le placeholder newsletter-cta par le composant)

- [ ] **Step 1 : Remplacer la section newsletter de la home**

Dans `src/pages/index.astro`, remplacer :

```astro
<section class="newsletter-cta">
  <div class="container">
    <div class="newsletter-inner">
      <h2>Reste à jour</h2>
      <p>Un email par semaine : ...</p>
      <p class="newsletter-note">Newsletter active en Phase 4 — patience.</p>
    </div>
  </div>
</section>
```

Par :

```astro
<section class="home-section home-section--cta">
  <div class="container">
    <div class="newsletter-cta-wrap">
      <NewsletterInline variant="dark" />
    </div>
  </div>
</section>
```

Et ajouter l'import :

```astro
import NewsletterInline from '../components/NewsletterInline.astro';
```

Ajouter dans le style :

```css
.home-section--cta {
  padding: 64px 0 80px;
  background: var(--bg-dark);
}
.newsletter-cta-wrap {
  max-width: 600px;
  margin-inline: auto;
}
```

Et **supprimer** les anciens styles `.newsletter-cta`, `.newsletter-inner`, `.newsletter-note` qui ne sont plus utilisés.

---

### Task 7 : Build + test sans BREVO_API_KEY

- [ ] **Build**

```powershell
npm run build
```

Expected : 27 pages (+1 newsletter) + endpoint `/api/newsletter` listé en server route.

- [ ] **Test API en local sans clé**

```powershell
npm run dev
# dans un autre terminal :
curl -X POST http://localhost:4321/api/newsletter -H "Content-Type: application/json" -d '{"email":"test@test.fr"}'
```

Expected : `503 Service Unavailable` + message "Newsletter pas encore configurée".

---

## Sous-phase 4.C — Plausible Analytics

### Task 8 : Composant `<PlausibleScript />`

**Files :**
- Create : `src/components/PlausibleScript.astro`

- [ ] **Step 1 : Script conditionné par var d'env**

```astro
---
const domain = import.meta.env.PUBLIC_PLAUSIBLE_DOMAIN;
---

{
  domain && (
    <script
      is:inline
      defer
      data-domain={domain}
      src="https://plausible.io/js/script.js"
    />
  )
}
```

Note : `is:inline` empêche Astro de bundler le script.

---

### Task 9 : Intégrer dans `BaseLayout`

**Files :**
- Modify : `src/layouts/BaseLayout.astro`

- [ ] **Step 1 : Importer + insérer dans `<head>`**

Dans `src/layouts/BaseLayout.astro`, ajouter dans le frontmatter :

```astro
import PlausibleScript from '../components/PlausibleScript.astro';
```

Et dans `<head>` (avant `</head>`) :

```astro
<PlausibleScript />
```

- [ ] **Step 2 : Build**

```powershell
npm run build
```

Expected : aucun changement HTML si `PUBLIC_PLAUSIBLE_DOMAIN` n'est pas défini.

---

## Sous-phase 4.D — OG images dynamiques

### Approche retenue : génération au build via sharp + SVG

Le `HeroPlaceholder.astro` produit déjà un SVG cohérent. On va le réutiliser et le convertir en PNG via `sharp` (déjà disponible avec Astro).

### Task 10 : `src/lib/og-template.ts`

**Files :**
- Create : `src/lib/og-template.ts`

- [ ] **Step 1 : Génère le SVG OG image pour un titre + catégorie**

```ts
/**
 * Génère un SVG 1200x630 pour les images Open Graph.
 * Réutilise l'identité visuelle de HeroPlaceholder (point cloud + Pulse marks).
 */

interface OGTemplateOptions {
  title: string;
  category?: string;
  palette?: 'default' | 'warm';
}

const accentDefault = { from: '#2D5BFF', to: '#06B6D4' };
const accentWarm = { from: '#F59E0B', to: '#FBBF24' };

// Positions fixes des dots scattered (point cloud) — adaptées au 1200x630
const DOTS = [
  { x: 100, y: 200, r: 3, o: 0.5 }, { x: 180, y: 320, r: 4, o: 0.7 },
  { x: 260, y: 240, r: 3, o: 0.6 }, { x: 340, y: 380, r: 5, o: 0.8 },
  { x: 420, y: 180, r: 3, o: 0.5 }, { x: 500, y: 300, r: 4, o: 0.7 },
  { x: 580, y: 220, r: 3, o: 0.6 }, { x: 660, y: 360, r: 4, o: 0.7 },
  { x: 740, y: 260, r: 3, o: 0.5 }, { x: 820, y: 180, r: 5, o: 0.8 },
  { x: 900, y: 320, r: 3, o: 0.6 }, { x: 980, y: 240, r: 4, o: 0.7 },
  { x: 1060, y: 380, r: 3, o: 0.5 }, { x: 1100, y: 200, r: 3, o: 0.6 },
  { x: 150, y: 450, r: 3, o: 0.5 }, { x: 280, y: 480, r: 4, o: 0.6 },
  { x: 420, y: 470, r: 3, o: 0.5 }, { x: 560, y: 440, r: 3, o: 0.55 },
  { x: 700, y: 480, r: 4, o: 0.65 }, { x: 840, y: 460, r: 3, o: 0.5 },
  { x: 980, y: 470, r: 3, o: 0.55 }, { x: 1080, y: 440, r: 3, o: 0.5 },
];

export function generateOGSvg({ title, category, palette = 'default' }: OGTemplateOptions): string {
  const accent = palette === 'warm' ? accentWarm : accentDefault;
  const safeTitle = escapeXml(title);
  const safeCategory = escapeXml(category ?? 'Topolia');

  // Word-wrap manuel : on coupe le titre tous les ~24 chars en sortie de mot
  const lines = wrapText(safeTitle, 28).slice(0, 3); // max 3 lignes

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#1E293B"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${accent.from}"/>
      <stop offset="100%" stop-color="${accent.to}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  ${DOTS.map((d) => `<circle cx="${d.x}" cy="${d.y}" r="${d.r}" fill="url(#accent)" opacity="${d.o}"/>`).join('\n  ')}

  <!-- Mark Pulse principal à droite -->
  <g transform="translate(1010, 220)" opacity="0.35">
    <circle cx="0" cy="0" r="120" fill="none" stroke="url(#accent)" stroke-width="3"/>
    <circle cx="0" cy="0" r="80" fill="none" stroke="url(#accent)" stroke-width="4"/>
    <circle cx="0" cy="0" r="48" fill="none" stroke="url(#accent)" stroke-width="5"/>
    <circle cx="0" cy="0" r="18" fill="url(#accent)"/>
  </g>

  <!-- Wordmark topolia. en haut à gauche -->
  <g transform="translate(70, 70)">
    <g transform="translate(0, -12) scale(0.4)">
      <circle cx="50" cy="50" r="36" fill="none" stroke="url(#accent)" stroke-width="3" opacity="0.25"/>
      <circle cx="50" cy="50" r="26" fill="none" stroke="url(#accent)" stroke-width="3.5" opacity="0.5"/>
      <circle cx="50" cy="50" r="16" fill="none" stroke="url(#accent)" stroke-width="4" opacity="0.85"/>
      <circle cx="50" cy="50" r="6" fill="url(#accent)"/>
    </g>
    <text x="55" y="32" font-family="Onest, sans-serif" font-size="28" font-weight="700" fill="#FCFCFD">topolia.</text>
  </g>

  <!-- Catégorie -->
  <text x="70" y="380" font-family="JetBrains Mono, monospace" font-size="22" font-weight="500" fill="${accent.from}" letter-spacing="2">${safeCategory.toUpperCase()}</text>

  <!-- Titre (jusqu'à 3 lignes) -->
  ${lines
    .map(
      (line, i) =>
        `<text x="70" y="${445 + i * 70}" font-family="Onest, sans-serif" font-size="60" font-weight="800" fill="#FCFCFD" letter-spacing="-1.5">${line}</text>`,
    )
    .join('\n  ')}
</svg>`;
}

function escapeXml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length <= maxChars) {
      current = (current + ' ' + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}
```

---

### Task 11 : Route OG images `/og/[...slug].png.ts`

**Files :**
- Create : `src/pages/og/[...slug].png.ts`

- [ ] **Step 1 : Génération PNG via sharp**

```ts
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { generateOGSvg } from '../../lib/og-template';
import { ARTICLE_CATEGORIES } from '../../lib/content-helpers';
import sharp from 'sharp';

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
    // Articles : palette default, catégorie = label catégorie
    ...articles.map((a) => ({
      slug: `articles/${a.id}`,
      title: a.data.title,
      category: ARTICLE_CATEGORIES.find((c) => c.slug === a.data.category)?.label ?? 'Topolia',
      palette: 'default' as const,
    })),
    // Glossaire : palette default, catégorie = "Glossaire"
    ...glossaire.map((g) => ({
      slug: `glossaire/${g.id}`,
      title: g.data.title,
      category: 'Glossaire',
      palette: 'default' as const,
    })),
    // Chantiers : palette warm
    ...chantiers.map((c) => ({
      slug: `chantiers/${c.id}`,
      title: c.data.title,
      category: 'Retour de chantier',
      palette: 'warm' as const,
    })),
    // Minutes : palette default
    ...minutes.map((m) => ({
      slug: `minute-topo/${m.id}`,
      title: m.data.title,
      category: 'Minute topo',
      palette: 'default' as const,
    })),
    // Pages générales
    { slug: 'home', title: 'La topo, comme tu la fais vraiment.', category: 'Topolia', palette: 'default' as const },
    { slug: 'articles-index', title: 'Tous les articles', category: 'Topolia', palette: 'default' as const },
    { slug: 'glossaire-index', title: 'Glossaire topo', category: 'Topolia', palette: 'default' as const },
    { slug: 'chantiers-index', title: 'Chantiers anonymisés', category: 'Topolia', palette: 'warm' as const },
    { slug: 'a-propos', title: 'À propos de Topolia', category: 'Topolia', palette: 'default' as const },
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
  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
```

---

### Task 12 : Adapter `BaseLayout` pour utiliser les bonnes OG images

**Files :**
- Modify : `src/layouts/BaseLayout.astro`

- [ ] **Step 1 : Calculer l'URL OG depuis le path courant**

Modifier `src/layouts/BaseLayout.astro` :

```astro
---
import Nav from '../components/Nav.astro';
import Footer from '../components/Footer.astro';
import PlausibleScript from '../components/PlausibleScript.astro';
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
  ogImage,
  canonicalUrl,
} = Astro.props;

const siteUrl = import.meta.env.PUBLIC_SITE_URL ?? 'https://topolia.fr';
const canonical = canonicalUrl ?? `${siteUrl}${Astro.url.pathname}`;
const fullTitle = title === 'Topolia' ? title : `${title} — Topolia`;

// Calcul de l'URL OG image automatique selon le path
function inferOgSlug(pathname: string): string {
  const cleaned = pathname.replace(/^\/+|\/+$/g, '');
  if (cleaned === '') return 'home';
  if (cleaned === 'articles') return 'articles-index';
  if (cleaned === 'glossaire') return 'glossaire-index';
  if (cleaned === 'chantiers') return 'chantiers-index';
  if (cleaned === 'minute-topo') return 'minute-topo';
  if (cleaned === 'a-propos') return 'a-propos';
  // /articles/[slug] /glossaire/[slug] /chantiers/[slug]
  if (cleaned.startsWith('articles/') || cleaned.startsWith('glossaire/') || cleaned.startsWith('chantiers/')) {
    return cleaned;
  }
  return 'home';
}

const ogSlug = ogImage ? null : inferOgSlug(Astro.url.pathname);
const ogImageUrl = ogImage ? `${siteUrl}${ogImage}` : `${siteUrl}/og/${ogSlug}.png`;
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

    <meta property="og:type" content="website" />
    <meta property="og:url" content={canonical} />
    <meta property="og:title" content={fullTitle} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={ogImageUrl} />
    <meta property="og:locale" content="fr_FR" />
    <meta property="og:site_name" content="Topolia" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={fullTitle} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={ogImageUrl} />

    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

    <PlausibleScript />
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

- [ ] **Step 2 : Build complet**

```powershell
npm run build
```

Expected : 26 pages HTML + ~18 PNG OG (1 par article/fiche/page principale) + sitemap.

---

## Sous-phase 4.E — Vérification + commit

### Task 13 : Build + tests visuels

- [ ] **Step 1 : Build complet**

```powershell
npm run build
```

Expected :
- ~26 pages HTML
- ~18 PNG dans `dist/og/`
- Sitemap

- [ ] **Step 2 : Test newsletter offline**

```powershell
npm run dev
```

Aller sur `http://localhost:4321/newsletter` → soumettre un email → message "Newsletter pas encore configurée" (503).

- [ ] **Step 3 : Vérif OG image**

Aller sur `http://localhost:4321/og/articles/workflow-drone-complet.png` → image PNG rendue.

Test sur https://www.opengraph.xyz/ après déploiement.

---

### Task 14 : Commit

- [ ] **Step 1**

```powershell
git add -A
git -c user.email=loicdu27620@gmail.com -c user.name=Loic commit -m "feat(phase4): newsletter Brevo, Plausible, OG images dynamiques"
```

- [ ] **Step 2 : Update CLAUDE.md → Phase 4 ✅**

---

## Self-review

✅ **Couverture spec §11 Phase 4** :
- API endpoint `/api/newsletter` → Brevo ✅ (Task 3)
- `<NewsletterInline />` avec validation client ✅ (Task 4)
- Page `/newsletter` ✅ (Task 5)
- Plausible script tag dans BaseLayout ✅ (Task 8-9)
- OG images dynamiques par article ✅ (Task 10-12)

⚠️ **Points d'attention** :

1. **Hosting** : avec `@astrojs/node` standalone, le déploiement doit pouvoir lancer un serveur Node. Vercel/Netlify supportent ça via leurs respectifs `@astrojs/vercel`/`@astrojs/netlify`. Si tu cibles déjà l'un des deux, on remplacera l'adapter au moment du déploiement.

2. **Brevo Double opt-in** : le code actuel ajoute directement à la liste. Si tu veux du double opt-in (utilisateur confirme via email avant inscription effective), Brevo le fait via "DOI templates" — config à activer côté dashboard Brevo, le code n'a pas besoin de bouger.

3. **OG images sur SSG vs runtime** : on génère **toutes les images au build**. Si tu ajoutes un article, il faut rebuild. Acceptable pour un site qui rebuild à chaque push.

4. **Pas de tests automatisés** : on suit le pattern des phases précédentes (validation manuelle via `npm run build` + dev visuel). Tests Vitest possible en future itération.
