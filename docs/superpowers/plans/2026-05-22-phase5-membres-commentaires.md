# Phase 5 — Membres & Commentaires Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter une auth Clerk + un système de commentaires modérés (Supabase) sur les articles et chantiers du site Topolia.fr.

**Architecture:** Astro passe en mode `hybrid` — les pages existantes restent statiques, seuls les endpoints API et les pages auth sont en SSR via l'adapter Netlify déjà installé. Clerk gère l'identité, Supabase stocke les commentaires, Astro fait le pont entre les deux. Notification email via l'API Brevo déjà en place.

**Tech Stack:** Astro 6 (hybrid), TypeScript strict, `@clerk/astro`, `@supabase/supabase-js`, Brevo API (notif), Netlify (SSR adapter).

**Spec de référence:** [docs/superpowers/specs/2026-05-22-phase5-membres-commentaires-design.md](../specs/2026-05-22-phase5-membres-commentaires-design.md)

---

## Pré-requis avant d'exécuter ce plan

L'utilisateur doit créer **deux comptes gratuits** et fournir les clés dans le `.env` local **avant** d'exécuter la Task 3 :

1. **Compte Clerk** (clerk.com) — créer une application Topolia → activer Magic Link + Google OAuth → noter :
   - `PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
2. **Compte Supabase** (supabase.com) → créer un projet `topolia` → noter :
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

Si ces clés ne sont pas disponibles, **interrompre l'exécution après Task 1** et redemander à l'utilisateur.

---

## Vue d'ensemble des fichiers

**Créés :**

- `src/middleware.ts` — middleware Clerk
- `src/lib/supabase.ts` — clients Supabase (anon + service role)
- `src/lib/comments.ts` — types + helpers métier commentaires
- `src/lib/brevo-notify.ts` — envoi d'email transactionnel via Brevo (modération)
- `src/pages/login.astro`
- `src/pages/signup.astro`
- `src/pages/api/comments.ts` — POST (créer un commentaire)
- `src/pages/api/comments/[contentType]/[contentId].ts` — GET (lire les commentaires approuvés)
- `src/components/Comments.astro`
- `src/components/CommentForm.astro`
- `src/components/CommentItem.astro`
- `supabase/migrations/001_comments.sql` — schéma SQL à exécuter une seule fois dans le dashboard Supabase

**Modifiés :**

- `astro.config.mjs` — passer en mode `hybrid` + ajouter l'intégration Clerk
- `package.json` — ajouter `@clerk/astro` et `@supabase/supabase-js`
- `.env.example` — ajouter les nouvelles variables
- `src/components/Nav.astro` — bouton "Se connecter" / `<UserButton />`
- `src/layouts/ArticleLayout.astro` — ajouter un `<slot name="comments" />` après l'article
- `src/pages/articles/[...slug].astro` — passer `<Comments>` au layout
- `src/pages/chantiers/[...slug].astro` — passer `<Comments>` au layout (vérifier d'abord si chantier utilise ArticleLayout ou un autre)
- `CLAUDE.md` — marquer Phase 5 ✅

---

## Conventions d'exécution

**Pas de framework de test installé** dans ce projet — la "vérification" de chaque task se fait via :

1. `npm run build` qui doit passer en vert
2. `npm run dev` + vérification manuelle dans le navigateur quand pertinent
3. `npm run lint` (ESLint) qui doit passer

**Pour chaque commit**, le hook lint-staged déclenchera ESLint + Prettier automatiquement. **Ne jamais utiliser `--no-verify`.**

Toujours pull avant la première task : `git pull`. Toujours push après chaque commit : `git push`.

---

### Task 1 : Installer les dépendances et basculer Astro en mode hybrid

**Files:**

- Modify: `package.json`
- Modify: `astro.config.mjs`
- Modify: `.env.example`

- [ ] **Step 1: Installer les deux nouveaux packages**

Run:

```bash
npm install @clerk/astro @supabase/supabase-js
```

Expected: deux dépendances ajoutées dans `package.json`, `package-lock.json` mis à jour.

- [ ] **Step 2: Modifier `astro.config.mjs` — mode hybrid + intégration Clerk**

Remplacer le contenu actuel de `astro.config.mjs` par :

```js
// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import netlify from '@astrojs/netlify';
import clerk from '@clerk/astro';

// https://astro.build/config
export default defineConfig({
  site: 'https://topolia.fr',
  output: 'hybrid',
  adapter: netlify(),
  integrations: [mdx(), sitemap(), clerk()],
});
```

- [ ] **Step 3: Mettre à jour `.env.example`**

Ouvrir `.env.example` et ajouter à la fin du fichier (créer le fichier s'il n'existe pas — copier les vars déjà présentes en local) :

```
# ── Auth (Clerk) ──
PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# ── DB (Supabase) ──
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx
```

- [ ] **Step 4: Vérifier que `npm run build` passe encore (avant d'avoir les vraies clés)**

Run:

```bash
npm run build
```

Expected: build OK. Le mode hybrid sans pages SSR ne casse rien. Si une erreur Clerk apparaît parce que les clés manquent, c'est attendu — passer à l'étape suivante.

> ⚠️ **STOP ICI si l'utilisateur n'a pas encore créé ses comptes Clerk + Supabase.** Demander les 5 clés (`PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) et les ajouter au `.env` local (pas `.env.example`).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json astro.config.mjs .env.example
git commit -m "feat(phase5): hybrid mode + Clerk/Supabase deps"
git push
```

---

### Task 2 : Créer le schéma SQL Supabase

**Files:**

- Create: `supabase/migrations/001_comments.sql`

- [ ] **Step 1: Créer le fichier SQL**

Créer `supabase/migrations/001_comments.sql` avec :

```sql
-- Table commentaires (Phase 5 Topolia)
create table comments (
  id            uuid primary key default gen_random_uuid(),
  content_id    text not null,
  content_type  text not null check (content_type in ('article', 'chantier')),
  clerk_user_id text not null,
  author_name   text not null,
  body          text not null,
  status        text not null default 'pending'
                check (status in ('pending', 'approved', 'rejected')),
  created_at    timestamptz default now()
);

create index comments_content_idx on comments (content_type, content_id, status);

alter table comments enable row level security;

create policy "Public can read approved comments"
  on comments for select
  using (status = 'approved');
```

- [ ] **Step 2: Exécuter le SQL dans Supabase**

Action manuelle utilisateur : ouvrir le dashboard Supabase → SQL Editor → coller le contenu de `001_comments.sql` → Run.

Vérifier dans `Table Editor` que la table `comments` est présente avec les bonnes colonnes.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/001_comments.sql
git commit -m "feat(phase5): schéma SQL table comments + RLS"
git push
```

---

### Task 3 : Client Supabase + types métier

**Files:**

- Create: `src/lib/supabase.ts`
- Create: `src/lib/comments.ts`

- [ ] **Step 1: Créer le client Supabase**

Créer `src/lib/supabase.ts` :

```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  throw new Error('SUPABASE_URL manquante dans .env');
}

/** Client lecture publique (RLS appliquée) — utilisable côté API publique. */
export const supabaseAnon: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY ?? '');

/** Client service role — bypass RLS. Jamais exposé côté client. */
export function supabaseService(): SupabaseClient {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY manquante (requise côté serveur).');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}
```

- [ ] **Step 2: Créer les types + helpers métier**

Créer `src/lib/comments.ts` :

```ts
import { supabaseAnon, supabaseService } from './supabase';

export type CommentContentType = 'article' | 'chantier';
export type CommentStatus = 'pending' | 'approved' | 'rejected';

export interface Comment {
  id: string;
  content_id: string;
  content_type: CommentContentType;
  clerk_user_id: string;
  author_name: string;
  body: string;
  status: CommentStatus;
  created_at: string;
}

const MAX_BODY_LENGTH = 2000;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface CreateCommentInput {
  contentId: string;
  contentType: CommentContentType;
  body: string;
  clerkUserId: string;
  authorName: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export function validateCreateInput(input: {
  contentId?: unknown;
  contentType?: unknown;
  body?: unknown;
}): ValidationError | null {
  const { contentId, contentType, body } = input;

  if (typeof contentType !== 'string' || (contentType !== 'article' && contentType !== 'chantier')) {
    return { field: 'contentType', message: "contentType doit être 'article' ou 'chantier'." };
  }
  if (typeof contentId !== 'string' || contentId.length === 0 || contentId.length > 200) {
    return { field: 'contentId', message: 'contentId requis (1-200 caractères).' };
  }
  if (!SLUG_REGEX.test(contentId)) {
    return { field: 'contentId', message: 'contentId doit être en kebab-case.' };
  }
  if (typeof body !== 'string') {
    return { field: 'body', message: 'body requis.' };
  }
  const trimmed = body.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_BODY_LENGTH) {
    return { field: 'body', message: `body doit faire 1-${MAX_BODY_LENGTH} caractères après trim.` };
  }
  return null;
}

export async function insertComment(input: CreateCommentInput): Promise<Comment> {
  const client = supabaseService();
  const { data, error } = await client
    .from('comments')
    .insert({
      content_id: input.contentId,
      content_type: input.contentType,
      clerk_user_id: input.clerkUserId,
      author_name: input.authorName,
      body: input.body.trim(),
      status: 'pending',
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Supabase insert failed: ${error?.message ?? 'unknown'}`);
  }
  return data as Comment;
}

export async function listApprovedComments(
  contentType: CommentContentType,
  contentId: string,
): Promise<Comment[]> {
  const { data, error } = await supabaseAnon
    .from('comments')
    .select('id, content_id, content_type, clerk_user_id, author_name, body, status, created_at')
    .eq('content_type', contentType)
    .eq('content_id', contentId)
    .eq('status', 'approved')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Supabase select failed: ${error.message}`);
  }
  return (data ?? []) as Comment[];
}
```

- [ ] **Step 3: Vérifier que le build passe**

Run:

```bash
npm run build
```

Expected: PASS. Aucun fichier ne consomme encore ces helpers, on vérifie juste la compilation TS.

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase.ts src/lib/comments.ts
git commit -m "feat(phase5): client Supabase + helpers commentaires"
git push
```

---

### Task 4 : Notification email Brevo (modération)

**Files:**

- Create: `src/lib/brevo-notify.ts`

- [ ] **Step 1: Créer le module de notification**

Créer `src/lib/brevo-notify.ts` :

```ts
/**
 * Envoie un email transactionnel via Brevo pour notifier Loïc qu'un
 * nouveau commentaire est en attente de modération.
 * Doc : https://developers.brevo.com/reference/sendtransacemail
 */

const BREVO_SEND_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';
const MODERATOR_EMAIL = 'loicdu27620@gmail.com';
const FROM_EMAIL = 'noreply@topolia.fr';
const FROM_NAME = 'Topolia';

export interface ModerationNotice {
  contentType: 'article' | 'chantier';
  contentId: string;
  authorName: string;
  bodyPreview: string;
}

export interface NotifyResult {
  ok: boolean;
  message: string;
}

export async function notifyNewComment(
  notice: ModerationNotice,
  apiKey: string,
): Promise<NotifyResult> {
  const subject = `Nouveau commentaire en attente — ${notice.contentType}/${notice.contentId}`;
  const html = `
    <p>Un nouveau commentaire a été soumis et attend ta modération.</p>
    <ul>
      <li><strong>Auteur :</strong> ${escapeHtml(notice.authorName)}</li>
      <li><strong>Sur :</strong> ${notice.contentType}/${escapeHtml(notice.contentId)}</li>
    </ul>
    <blockquote>${escapeHtml(notice.bodyPreview)}</blockquote>
    <p>Ouvre le dashboard Supabase pour approuver ou rejeter.</p>
  `;

  try {
    const response = await fetch(BREVO_SEND_ENDPOINT, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: FROM_NAME, email: FROM_EMAIL },
        to: [{ email: MODERATOR_EMAIL }],
        subject,
        htmlContent: html,
      }),
    });

    if (response.ok) {
      return { ok: true, message: 'Notification envoyée.' };
    }
    const data: { message?: string } = await response.json().catch(() => ({}));
    return { ok: false, message: data?.message ?? `Brevo error ${response.status}` };
  } catch (err) {
    return { ok: false, message: `Erreur réseau : ${(err as Error).message}` };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
```

- [ ] **Step 2: Vérifier le build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/brevo-notify.ts
git commit -m "feat(phase5): notif email Brevo pour modération commentaires"
git push
```

---

### Task 5 : Middleware Clerk

**Files:**

- Create: `src/middleware.ts`

- [ ] **Step 1: Créer le middleware**

Créer `src/middleware.ts` :

```ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/astro/server';

const isProtectedApi = createRouteMatcher(['/api/comments']);

export const onRequest = clerkMiddleware((auth, context) => {
  if (isProtectedApi(context.request)) {
    const { userId } = auth();
    if (!userId) {
      return new Response(
        JSON.stringify({ ok: false, message: 'Connexion requise.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      );
    }
  }
});
```

- [ ] **Step 2: Vérifier le build**

Run:

```bash
npm run build
```

Expected: PASS. Si erreur "missing Clerk env vars", c'est attendu sans clés — vérifier que le `.env` local contient bien les clés Clerk avant de continuer.

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat(phase5): middleware Clerk protège POST /api/comments"
git push
```

---

### Task 6 : Pages `/login` et `/signup`

**Files:**

- Create: `src/pages/login.astro`
- Create: `src/pages/signup.astro`

- [ ] **Step 1: Créer la page login**

Créer `src/pages/login.astro` :

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { SignIn } from '@clerk/astro/components';

export const prerender = false;
---

<BaseLayout title="Connexion — Topolia" description="Connecte-toi à ton espace Topolia.">
  <section class="auth-section container">
    <h1 class="auth-title">Bon retour parmi nous.</h1>
    <p class="auth-subtitle">Connecte-toi pour commenter et participer à la communauté.</p>
    <div class="auth-widget">
      <SignIn signUpUrl="/signup" />
    </div>
  </section>
</BaseLayout>

<style>
  .auth-section {
    padding: 80px 0 120px;
    text-align: center;
  }
  .auth-title {
    font-family: var(--display);
    font-size: 2rem;
    font-weight: 700;
    color: var(--ink);
    margin: 0 0 12px;
  }
  .auth-subtitle {
    font-size: 1.05rem;
    color: var(--ink-3);
    margin: 0 0 40px;
  }
  .auth-widget {
    display: flex;
    justify-content: center;
  }
</style>
```

- [ ] **Step 2: Créer la page signup**

Créer `src/pages/signup.astro` :

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { SignUp } from '@clerk/astro/components';

export const prerender = false;
---

<BaseLayout title="Inscription — Topolia" description="Crée ton compte Topolia.">
  <section class="auth-section container">
    <h1 class="auth-title">Rejoins la communauté.</h1>
    <p class="auth-subtitle">Crée ton compte pour commenter et échanger avec d'autres topographes.</p>
    <div class="auth-widget">
      <SignUp signInUrl="/login" />
    </div>
  </section>
</BaseLayout>

<style>
  .auth-section {
    padding: 80px 0 120px;
    text-align: center;
  }
  .auth-title {
    font-family: var(--display);
    font-size: 2rem;
    font-weight: 700;
    color: var(--ink);
    margin: 0 0 12px;
  }
  .auth-subtitle {
    font-size: 1.05rem;
    color: var(--ink-3);
    margin: 0 0 40px;
  }
  .auth-widget {
    display: flex;
    justify-content: center;
  }
</style>
```

- [ ] **Step 3: Vérification visuelle**

Run:

```bash
npm run dev
```

Ouvrir http://localhost:4321/login et http://localhost:4321/signup. Vérifier que :

- Les widgets Clerk s'affichent
- Les méthodes Magic link + Google OAuth apparaissent (sinon les activer dans le dashboard Clerk)

Arrêter le serveur dev (`Ctrl+C`).

- [ ] **Step 4: Commit**

```bash
git add src/pages/login.astro src/pages/signup.astro
git commit -m "feat(phase5): pages /login et /signup avec widgets Clerk"
git push
```

---

### Task 7 : Mise à jour du Nav avec état d'auth

**Files:**

- Modify: `src/components/Nav.astro`

- [ ] **Step 1: Remplacer la zone droite du nav-inner (desktop) par un bloc auth**

Dans `src/components/Nav.astro`, au-dessus du bouton burger (ligne ~34), ajouter un nouveau bloc `<div class="nav-auth">` qui contient les composants Clerk. Le burger reste tel quel pour mobile.

Modifier la section frontmatter pour ajouter les imports en tête (ligne 2) :

```astro
---
import Logo from './Logo.astro';
import { SignedIn, SignedOut, UserButton } from '@clerk/astro/components';

const navLinks = [
  { href: '/articles/', label: 'Articles' },
  { href: '/glossaire/', label: 'Glossaire' },
  { href: '/chantiers/', label: 'Chantiers' },
  { href: '/minute-topo/', label: 'Minute topo' },
  { href: '/a-propos/', label: 'À propos' },
];

const currentPath = Astro.url.pathname;
---
```

Puis, juste avant le bouton `<button class="nav-burger">` (ligne ~34), ajouter :

```astro
<div class="nav-auth">
  <SignedOut>
    <a href="/login" class="nav-auth-cta">Se connecter</a>
  </SignedOut>
  <SignedIn>
    <UserButton afterSignOutUrl="/" />
  </SignedIn>
</div>
```

- [ ] **Step 2: Ajouter le CSS du bloc auth**

Dans le `<style>` du même fichier, ajouter avant la media query `@media (min-width: 900px)` :

```css
.nav-auth {
  display: none;
  align-items: center;
  gap: 12px;
  margin-left: 16px;
}

.nav-auth-cta {
  padding: 8px 16px;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--surface);
  background: var(--ink);
  border-radius: 8px;
  text-decoration: none;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  transition: opacity 0.15s;
}
.nav-auth-cta:hover {
  opacity: 0.85;
}
```

Puis dans la media query `@media (min-width: 900px)`, ajouter à l'intérieur :

```css
.nav-auth {
  display: flex;
}
```

- [ ] **Step 3: Vérification visuelle**

Run:

```bash
npm run dev
```

Ouvrir http://localhost:4321/.

- Non connecté : un bouton "Se connecter" doit apparaître à droite du nav (≥ 900px de large)
- Cliquer dessus → redirige vers `/login`
- Se connecter via Google ou Magic Link
- Revenir à la home → un avatar Clerk `<UserButton>` doit remplacer le bouton

Arrêter le serveur dev.

- [ ] **Step 4: Commit**

```bash
git add src/components/Nav.astro
git commit -m "feat(phase5): Nav affiche état Clerk (Se connecter / UserButton)"
git push
```

---

### Task 8 : Endpoint POST /api/comments

**Files:**

- Create: `src/pages/api/comments.ts`

- [ ] **Step 1: Créer l'endpoint**

Créer `src/pages/api/comments.ts` :

```ts
import type { APIRoute } from 'astro';
import { clerkClient } from '@clerk/astro/server';
import {
  validateCreateInput,
  insertComment,
  type CommentContentType,
} from '../../lib/comments';
import { notifyNewComment } from '../../lib/brevo-notify';

export const prerender = false;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request, locals }) => {
  const auth = locals.auth();
  const userId = auth?.userId;
  if (!userId) {
    return json({ ok: false, message: 'Connexion requise.' }, 401);
  }

  let body: { contentId?: unknown; contentType?: unknown; body?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, message: 'Corps JSON invalide.' }, 400);
  }

  const validation = validateCreateInput(body);
  if (validation) {
    return json({ ok: false, message: validation.message, field: validation.field }, 400);
  }

  const user = await clerkClient(locals as never).users.getUser(userId);
  const firstName = user.firstName?.trim() ?? '';
  const lastInitial = user.lastName?.trim()?.[0]?.toUpperCase() ?? '';
  const authorName = firstName ? (lastInitial ? `${firstName} ${lastInitial}.` : firstName) : 'Anonyme';

  try {
    const comment = await insertComment({
      contentId: body.contentId as string,
      contentType: body.contentType as CommentContentType,
      body: body.body as string,
      clerkUserId: userId,
      authorName,
    });

    const brevoKey = import.meta.env.BREVO_API_KEY;
    if (brevoKey) {
      await notifyNewComment(
        {
          contentType: comment.content_type,
          contentId: comment.content_id,
          authorName: comment.author_name,
          bodyPreview: comment.body.slice(0, 200),
        },
        brevoKey,
      );
    }
    return json({ ok: true, message: 'Commentaire reçu. Il sera publié après modération.' }, 201);
  } catch (err) {
    return json({ ok: false, message: (err as Error).message }, 500);
  }
};
```

- [ ] **Step 2: Vérifier le build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/pages/api/comments.ts
git commit -m "feat(phase5): POST /api/comments (auth Clerk + insert Supabase + notif Brevo)"
git push
```

---

### Task 9 : Endpoint GET /api/comments/[contentType]/[contentId]

**Files:**

- Create: `src/pages/api/comments/[contentType]/[contentId].ts`

- [ ] **Step 1: Créer l'endpoint**

Créer `src/pages/api/comments/[contentType]/[contentId].ts` :

```ts
import type { APIRoute } from 'astro';
import { listApprovedComments, type CommentContentType } from '../../../../lib/comments';

export const prerender = false;

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=30' },
  });
}

export const GET: APIRoute = async ({ params }) => {
  const contentType = params.contentType;
  const contentId = params.contentId;

  if (contentType !== 'article' && contentType !== 'chantier') {
    return json({ ok: false, message: "contentType doit être 'article' ou 'chantier'." }, 400);
  }
  if (!contentId || contentId.length > 200 || !SLUG_REGEX.test(contentId)) {
    return json({ ok: false, message: 'contentId invalide.' }, 400);
  }

  try {
    const comments = await listApprovedComments(contentType as CommentContentType, contentId);
    return json({ ok: true, comments });
  } catch (err) {
    return json({ ok: false, message: (err as Error).message }, 500);
  }
};
```

- [ ] **Step 2: Vérifier le build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add 'src/pages/api/comments/[contentType]/[contentId].ts'
git commit -m "feat(phase5): GET /api/comments/[contentType]/[contentId]"
git push
```

---

### Task 10 : Composant CommentItem

**Files:**

- Create: `src/components/CommentItem.astro`

- [ ] **Step 1: Créer le composant**

Créer `src/components/CommentItem.astro` :

```astro
---
interface Props {
  authorName: string;
  createdAt: string; // ISO timestamp
  body: string;
}

const { authorName, createdAt, body } = Astro.props;

const date = new Date(createdAt);
const formatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const dateLabel = formatter.format(date);
---

<article class="comment-item">
  <header class="comment-head">
    <span class="comment-author">{authorName}</span>
    <time class="comment-date" datetime={createdAt}>{dateLabel}</time>
  </header>
  <p class="comment-body">{body}</p>
</article>

<style>
  .comment-item {
    padding: 20px 0;
    border-bottom: 1px solid var(--hairline);
  }
  .comment-item:last-child {
    border-bottom: none;
  }
  .comment-head {
    display: flex;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 8px;
  }
  .comment-author {
    font-weight: 600;
    color: var(--ink);
    font-size: 0.95rem;
  }
  .comment-date {
    color: var(--ink-light);
    font-size: 0.85rem;
  }
  .comment-body {
    margin: 0;
    color: var(--ink-2);
    font-size: 1rem;
    line-height: 1.6;
    white-space: pre-wrap;
  }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/CommentItem.astro
git commit -m "feat(phase5): composant CommentItem"
git push
```

---

### Task 11 : Composant CommentForm

**Files:**

- Create: `src/components/CommentForm.astro`

- [ ] **Step 1: Créer le composant**

Créer `src/components/CommentForm.astro` :

```astro
---
import { SignedIn, SignedOut } from '@clerk/astro/components';

interface Props {
  contentId: string;
  contentType: 'article' | 'chantier';
}

const { contentId, contentType } = Astro.props;
---

<div class="comment-form-wrap">
  <SignedOut>
    <div class="comment-form-cta">
      <p>Tu dois être connecté pour commenter.</p>
      <a href="/login" class="comment-form-cta-btn">Se connecter</a>
    </div>
  </SignedOut>

  <SignedIn>
    <form
      class="comment-form"
      data-content-id={contentId}
      data-content-type={contentType}
    >
      <label for="comment-body" class="comment-form-label">
        Ajoute ton commentaire
      </label>
      <textarea
        id="comment-body"
        name="body"
        class="comment-form-textarea"
        rows="4"
        maxlength="2000"
        required
        placeholder="Partage ton retour, ton expérience, une question…"
      ></textarea>
      <div class="comment-form-actions">
        <span class="comment-form-hint">Modéré avant publication.</span>
        <button type="submit" class="comment-form-submit">Envoyer</button>
      </div>
      <p class="comment-form-status" role="status" aria-live="polite"></p>
    </form>
  </SignedIn>
</div>

<script>
  const form = document.querySelector<HTMLFormElement>('.comment-form');
  if (form) {
    const statusEl = form.querySelector<HTMLParagraphElement>('.comment-form-status');
    const submitBtn = form.querySelector<HTMLButtonElement>('.comment-form-submit');
    const textarea = form.querySelector<HTMLTextAreaElement>('textarea[name="body"]');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!statusEl || !submitBtn || !textarea) return;

      const body = textarea.value.trim();
      if (!body) {
        statusEl.textContent = 'Le commentaire est vide.';
        statusEl.dataset.state = 'error';
        return;
      }

      submitBtn.disabled = true;
      statusEl.textContent = 'Envoi en cours…';
      statusEl.dataset.state = 'pending';

      try {
        const response = await fetch('/api/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentId: form.dataset.contentId,
            contentType: form.dataset.contentType,
            body,
          }),
        });
        const data = (await response.json()) as { ok: boolean; message: string };
        statusEl.textContent = data.message;
        statusEl.dataset.state = data.ok ? 'ok' : 'error';
        if (data.ok) {
          textarea.value = '';
        }
      } catch (err) {
        statusEl.textContent = `Erreur réseau : ${(err as Error).message}`;
        statusEl.dataset.state = 'error';
      } finally {
        submitBtn.disabled = false;
      }
    });
  }
</script>

<style>
  .comment-form-wrap {
    margin: 32px 0;
  }

  .comment-form-cta {
    padding: 24px;
    background: var(--bg-alt);
    border-radius: 12px;
    text-align: center;
  }
  .comment-form-cta p {
    margin: 0 0 16px;
    color: var(--ink-3);
  }
  .comment-form-cta-btn {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 8px 20px;
    background: var(--ink);
    color: var(--surface);
    border-radius: 8px;
    text-decoration: none;
    font-weight: 500;
    transition: opacity 0.15s;
  }
  .comment-form-cta-btn:hover {
    opacity: 0.85;
  }

  .comment-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .comment-form-label {
    font-weight: 600;
    color: var(--ink);
    font-size: 0.95rem;
  }
  .comment-form-textarea {
    width: 100%;
    padding: 12px 14px;
    font-family: inherit;
    font-size: 1rem;
    line-height: 1.5;
    color: var(--ink);
    background: var(--surface);
    border: 1px solid var(--hairline);
    border-radius: 8px;
    resize: vertical;
    min-height: 100px;
  }
  .comment-form-textarea:focus {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .comment-form-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }
  .comment-form-hint {
    color: var(--ink-light);
    font-size: 0.85rem;
  }
  .comment-form-submit {
    min-height: 44px;
    padding: 8px 20px;
    background: var(--accent);
    color: var(--surface);
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s;
  }
  .comment-form-submit:hover:not(:disabled) {
    opacity: 0.9;
  }
  .comment-form-submit:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .comment-form-status {
    margin: 0;
    font-size: 0.9rem;
    min-height: 1.2em;
  }
  .comment-form-status[data-state='ok'] {
    color: var(--green);
  }
  .comment-form-status[data-state='error'] {
    color: var(--rose);
  }
  .comment-form-status[data-state='pending'] {
    color: var(--ink-3);
  }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/CommentForm.astro
git commit -m "feat(phase5): composant CommentForm avec auth Clerk + POST /api/comments"
git push
```

---

### Task 12 : Composant Comments (conteneur)

**Files:**

- Create: `src/components/Comments.astro`

- [ ] **Step 1: Créer le composant**

Créer `src/components/Comments.astro` :

```astro
---
import CommentForm from './CommentForm.astro';

interface Props {
  contentId: string;
  contentType: 'article' | 'chantier';
}

const { contentId, contentType } = Astro.props;
---

<section class="comments-section" aria-labelledby="comments-title">
  <h2 id="comments-title" class="comments-title">Commentaires</h2>

  <div
    class="comments-list"
    data-content-id={contentId}
    data-content-type={contentType}
  >
    <p class="comments-empty" data-state="loading">Chargement des commentaires…</p>
  </div>

  <CommentForm contentId={contentId} contentType={contentType} />
</section>

<script>
  interface CommentDto {
    id: string;
    author_name: string;
    created_at: string;
    body: string;
  }

  function escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(iso: string): string {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  }

  function renderComments(container: HTMLElement, comments: CommentDto[]) {
    if (comments.length === 0) {
      container.innerHTML =
        '<p class="comments-empty" data-state="empty">Pas encore de commentaire. Sois le premier.</p>';
      return;
    }
    container.innerHTML = comments
      .map(
        (c) => `
          <article class="comment-item">
            <header class="comment-head">
              <span class="comment-author">${escapeHtml(c.author_name)}</span>
              <time class="comment-date" datetime="${c.created_at}">${formatDate(c.created_at)}</time>
            </header>
            <p class="comment-body">${escapeHtml(c.body)}</p>
          </article>
        `,
      )
      .join('');
  }

  const list = document.querySelector<HTMLElement>('.comments-list');
  if (list) {
    const contentId = list.dataset.contentId;
    const contentType = list.dataset.contentType;
    fetch(`/api/comments/${contentType}/${contentId}`)
      .then((r) => r.json() as Promise<{ ok: boolean; comments?: CommentDto[]; message?: string }>)
      .then((data) => {
        if (!data.ok || !data.comments) {
          list.innerHTML = `<p class="comments-empty" data-state="error">Impossible de charger les commentaires.</p>`;
          return;
        }
        renderComments(list, data.comments);
      })
      .catch((err) => {
        list.innerHTML = `<p class="comments-empty" data-state="error">Erreur réseau : ${err.message}</p>`;
      });
  }
</script>

<style>
  .comments-section {
    max-width: var(--content-max);
    margin: 60px auto 0;
    padding-top: 40px;
    border-top: 1px solid var(--hairline);
  }
  .comments-title {
    font-family: var(--display);
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--ink);
    margin: 0 0 24px;
  }
  .comments-list {
    margin: 0 0 24px;
  }
  .comments-empty {
    color: var(--ink-light);
    font-size: 0.95rem;
    padding: 16px 0;
  }
  .comments-empty[data-state='error'] {
    color: var(--rose);
  }

  /* Items rendus dynamiquement — styles dupliqués depuis CommentItem.astro pour s'appliquer au innerHTML */
  .comments-list :global(.comment-item) {
    padding: 20px 0;
    border-bottom: 1px solid var(--hairline);
  }
  .comments-list :global(.comment-item):last-child {
    border-bottom: none;
  }
  .comments-list :global(.comment-head) {
    display: flex;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 8px;
  }
  .comments-list :global(.comment-author) {
    font-weight: 600;
    color: var(--ink);
    font-size: 0.95rem;
  }
  .comments-list :global(.comment-date) {
    color: var(--ink-light);
    font-size: 0.85rem;
  }
  .comments-list :global(.comment-body) {
    margin: 0;
    color: var(--ink-2);
    font-size: 1rem;
    line-height: 1.6;
    white-space: pre-wrap;
  }
</style>
```

> Note : le composant `CommentItem.astro` (Task 10) reste utilisé si jamais on veut rendre des commentaires côté serveur plus tard. Pour cette phase, le rendu est 100% client (innerHTML) pour préserver le SSG des pages articles.

- [ ] **Step 2: Commit**

```bash
git add src/components/Comments.astro
git commit -m "feat(phase5): composant Comments — fetch + render côté client"
git push
```

---

### Task 13 : Intégrer Comments dans la page Article

**Files:**

- Modify: `src/layouts/ArticleLayout.astro`
- Modify: `src/pages/articles/[...slug].astro`

- [ ] **Step 1: Ajouter un slot `comments` dans ArticleLayout**

Dans `src/layouts/ArticleLayout.astro`, modifier la zone `<article class="article-content prose">` (ligne ~45) pour ajouter un `<slot name="comments" />` après le slot principal :

```astro
<article class="article-content prose">
  <slot />
  <slot name="comments" />
</article>
```

- [ ] **Step 2: Passer Comments depuis la page article**

Dans `src/pages/articles/[...slug].astro`, ajouter l'import en frontmatter (après ligne 6) :

```ts
import Comments from '../../components/Comments.astro';
```

Puis ajouter le slot comments à côté du slot related (après ligne 44) :

```astro
<Comments slot="comments" contentId={entry.id} contentType="article" />
```

Le bloc final ressemble à :

```astro
<ArticleLayout ...>
  <Content />
  <Comments slot="comments" contentId={entry.id} contentType="article" />
  <RelatedContent slot="related" title="À lire aussi" items={related} />
</ArticleLayout>
```

- [ ] **Step 3: Vérification visuelle**

Run:

```bash
npm run dev
```

Ouvrir un article : http://localhost:4321/articles/[un-slug-existant]/. Vérifier :

- La section "Commentaires" apparaît en bas de l'article
- Le message "Pas encore de commentaire. Sois le premier." s'affiche (table vide)
- Connecté : le formulaire est présent
- Déconnecté : un CTA "Se connecter" est présent

Tester un POST de bout en bout :

1. Connecte-toi
2. Écris un commentaire et envoie
3. Vérifie le message "Commentaire reçu. Il sera publié après modération."
4. Vérifie dans le dashboard Supabase qu'une ligne a été créée avec `status: pending`
5. Passe le status à `approved` manuellement
6. Recharge la page → le commentaire apparaît

Arrêter le serveur dev.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/ArticleLayout.astro src/pages/articles/[...slug].astro
git commit -m "feat(phase5): Comments intégrés dans les pages articles"
git push
```

---

### Task 14 : Intégrer Comments dans la page Chantier

**Files:**

- Modify: `src/pages/chantiers/[...slug].astro`

- [ ] **Step 1: Vérifier le layout utilisé par chantier**

Run:

```bash
head -20 src/pages/chantiers/[...slug].astro
```

Expected: voir quel layout est utilisé. Deux cas :

- **Cas A** : utilise `ArticleLayout` → procéder comme Task 13
- **Cas B** : utilise un autre layout (`ChantierLayout` ou inline) → ajouter le `<Comments>` directement dans le markup de la page après le contenu principal

- [ ] **Step 2: Ajouter Comments**

**Cas A (ArticleLayout) :**

Dans `src/pages/chantiers/[...slug].astro`, ajouter l'import en frontmatter :

```ts
import Comments from '../../components/Comments.astro';
```

Puis dans le markup, ajouter :

```astro
<Comments slot="comments" contentId={entry.id} contentType="chantier" />
```

**Cas B (autre layout) :**

Ajouter l'import et placer `<Comments contentId={entry.id} contentType="chantier" />` après le bloc principal (généralement après `<Content />` ou équivalent). Adapter si nécessaire pour wrapper le composant dans un container `<section class="container">` pour respecter la largeur.

- [ ] **Step 3: Vérification visuelle**

Run:

```bash
npm run dev
```

Ouvrir un chantier : http://localhost:4321/chantiers/[un-slug-existant]/. Vérifier que la section Commentaires apparaît correctement.

Arrêter le serveur dev.

- [ ] **Step 4: Commit**

```bash
git add src/pages/chantiers/[...slug].astro
git commit -m "feat(phase5): Comments intégrés dans les pages chantiers"
git push
```

---

### Task 15 : Configurer les variables d'environnement Netlify

**Files:** aucun (action manuelle dans le dashboard Netlify)

- [ ] **Step 1: Ajouter les 5 variables dans Netlify**

Action manuelle : dashboard Netlify → topolia → Site settings → Environment variables → Add a variable. Ajouter une par une :

- `PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Valeurs identiques à celles du `.env` local.

- [ ] **Step 2: Déclencher un re-deploy**

Action manuelle : dashboard Netlify → Deploys → Trigger deploy → "Deploy site". Ou bien push un commit vide :

```bash
git commit --allow-empty -m "chore: trigger Netlify redeploy avec env vars Phase 5"
git push
```

- [ ] **Step 3: Vérifier le site en prod**

Ouvrir https://topolia.fr/articles/[un-slug]/ et vérifier que la section Commentaires s'affiche, et que le bouton "Se connecter" fonctionne.

---

### Task 16 : Mise à jour CLAUDE.md

**Files:**

- Modify: `CLAUDE.md`

- [ ] **Step 1: Marquer Phase 5 comme terminée**

Dans `CLAUDE.md`, dans le tableau "État d'avancement", remplacer la ligne :

```
| Phase 5 — Membres & commentaires | 🔲     | Clerk, Supabase                                                                        |
```

par :

```
| Phase 5 — Membres & commentaires | ✅     | Clerk (magic link + Google), Supabase commentaires modérés, intégration articles + chantiers |
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: Phase 5 marquée terminée dans CLAUDE.md"
git push
```

---

## Récapitulatif final

À la fin de l'exécution :

- ✅ Auth Clerk fonctionnelle (Magic link + Google)
- ✅ Pages `/login` et `/signup`
- ✅ Nav affiche bouton "Se connecter" ou `<UserButton />` selon état
- ✅ Table `comments` créée dans Supabase avec RLS
- ✅ Endpoint `POST /api/comments` protégé par Clerk
- ✅ Endpoint `GET /api/comments/[contentType]/[contentId]` public
- ✅ Composant `<Comments>` chargé client-side sur articles + chantiers
- ✅ Email Brevo envoyé à chaque nouveau commentaire
- ✅ Modération via dashboard Supabase
- ✅ Pages articles + chantiers restent **statiques** (SSG préservé)
- ✅ Variables d'env Netlify configurées
- ✅ Site déployé en prod fonctionnel

---

## Notes V2 (rappel)

À ne pas faire dans cette phase, à garder en tête pour plus tard :

- Réponses imbriquées (colonne `parent_id`)
- Likes ("👍 utile") + colonne `likes_count` + table `comment_likes`
- Interface admin `/admin/comments` au lieu du dashboard Supabase
- Soumission de chantiers par les membres (§9.4 du brief)
