# Phase 5 — Membres & Commentaires (Design)

> Spec de la Phase 5 du site Topolia.fr.
> Brainstormée le 22 mai 2026.
> Référence : §20 du `BRIEF.md` (auth Clerk) + §17 (commentaires).

---

## 1. Objectif

Ouvrir le site aux contributions de la communauté topo via un système d'authentification et un système de commentaires modérés sur les articles et les chantiers.

**Non-objectifs de cette phase** (reportés en V2) :

- Réponses imbriquées aux commentaires
- Système de likes / "utile"
- Soumission de chantiers par les membres (§9.4 du brief)
- Espace formations payantes (Stripe)

---

## 2. Architecture

Astro passe en mode `hybrid` (`output: 'hybrid'` dans `astro.config.ts`). Toutes les pages existantes restent statiques. Seuls les nouveaux endpoints API et les pages auth tournent en SSR via l'adapter Netlify déjà installé.

```
Browser
  ↓
Netlify Edge (middleware Clerk — vérifie la session)
  ↓
Astro SSR (endpoints /api/comments/*)
  ↓
Supabase PostgreSQL (table comments)
```

Clerk gère 100% de l'identité (sessions, tokens, UI de login). Supabase stocke uniquement les commentaires. Astro fait le pont entre les deux — Clerk et Supabase ne se parlent jamais directement.

---

## 3. Authentification — Clerk

### 3.1 Méthodes activées

- **Magic link** (email)
- **Google OAuth**

Configuration faite dans le dashboard Clerk avant déploiement.

### 3.2 Pages auth

- `src/pages/login.astro` — wrap le composant `<SignIn />` de `@clerk/astro`
- `src/pages/signup.astro` — wrap le composant `<SignUp />` de `@clerk/astro`

Pas de formulaire d'auth codé à la main. Clerk fournit les composants stylables via CSS variables.

### 3.3 Middleware

`src/middleware.ts` utilise `clerkMiddleware()` de `@clerk/astro/server`.

Routes protégées :

- `POST /api/comments` — requiert une session Clerk valide

Toutes les autres routes restent publiques. Les pages articles et chantiers ne sont **jamais** protégées — seul l'acte de poster un commentaire l'est.

### 3.4 Intégration dans la Nav

Le composant `src/components/Nav.astro` ajoute :

- Si pas de session → bouton `Se connecter` vers `/login`
- Si session active → composant Clerk `<UserButton />` (avatar + menu déconnexion)

### 3.5 Variables d'environnement

```
PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
```

À ajouter dans `.env` local + dans les variables d'environnement Netlify.

---

## 4. Base de données — Supabase

### 4.1 Table `comments`

```sql
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
```

- `content_id` : slug de l'article ou du chantier (ex: `pourquoi-le-lidar`)
- `author_name` : prénom + initiale récupérés depuis Clerk au moment du POST
- `body` : texte brut, max 2000 caractères (validé côté serveur)

### 4.2 Row Level Security

```sql
alter table comments enable row level security;

create policy "Public can read approved comments"
  on comments for select
  using (status = 'approved');
```

Les lectures publiques utilisent la clé `anon`. Les écritures se font côté serveur Astro avec la clé `service_role` (jamais exposée au client).

### 4.3 Variables d'environnement

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx
```

> **Note V2** : Ajouter colonnes `parent_id` (uuid, nullable, fk vers `comments.id`) pour les réponses imbriquées et `likes_count` (int, default 0) pour les upvotes quand la communauté est active.

---

## 5. Composants & Pages

### 5.1 Nouveaux composants

| Composant                          | Rôle                                                                                                                                                               |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/components/Comments.astro`    | Conteneur. Props : `contentId`, `contentType`. Côté client : fetch `GET /api/comments/{contentType}/{contentId}` + render dynamique. Affiche le formulaire en bas. |
| `src/components/CommentForm.astro` | Textarea + bouton "Envoyer". Visible uniquement si session Clerk active. Sinon affiche CTA "Connecte-toi pour commenter" → `/login`.                               |
| `src/components/CommentItem.astro` | Un commentaire : nom auteur, date relative, texte.                                                                                                                 |

### 5.2 Intégration dans les pages existantes

- `src/pages/articles/[...slug].astro` → ajoute `<Comments contentId={slug} contentType="article" />` après le body de l'article
- `src/pages/chantiers/[...slug].astro` → ajoute `<Comments contentId={slug} contentType="chantier" />` après le body du chantier

### 5.3 Nouvelles pages

- `src/pages/login.astro`
- `src/pages/signup.astro`

---

## 6. API Endpoints

### 6.1 `POST /api/comments.ts`

**Auth :** session Clerk requise (middleware refuse 401 sinon).

**Body JSON :**

```json
{
  "contentId": "pourquoi-le-lidar",
  "contentType": "article",
  "body": "Super article, merci."
}
```

**Validation serveur :**

- `body` : 1 à 2000 caractères, trim
- `contentType` : ∈ `['article', 'chantier']`
- `contentId` : string, max 200 chars, kebab-case

**Action :**

1. Récupère `clerk_user_id` et `author_name` depuis la session Clerk
2. Insère dans Supabase avec `status: 'pending'`
3. Envoie un email à `loicdu27620@gmail.com` via API Brevo : "Nouveau commentaire en attente sur [contentType]/[contentId]"
4. Retourne `{ ok: true }`

### 6.2 `GET /api/comments/[contentType]/[contentId].ts`

**Auth :** publique.

**Action :**

1. Lit les commentaires `approved` pour ce `content_type` + `content_id` depuis Supabase (clé `anon`)
2. Retourne `{ comments: [...] }` triés par `created_at` ascendant

**Pourquoi un endpoint et pas un fetch direct au render ?** Les pages articles et chantiers doivent rester **statiques** (SSG) pour préserver les perfs. Le composant `<Comments>` fetch les commentaires côté client après l'hydratation — un petit délai mais zéro impact sur le TTFB.

Seules les routes auth (`/login`, `/signup`) et l'endpoint `POST /api/comments` sont en SSR. Tout le reste reste prerender.

---

## 7. Flow de modération

```
User poste un commentaire
  ↓
POST /api/comments → status: 'pending' en base
  ↓
Email Brevo automatique à loicdu27620@gmail.com
"Nouveau commentaire en attente sur [titre]"
  ↓
Loïc ouvre dashboard Supabase → table editor
  ↓
Passe status à 'approved' ou 'rejected'
  ↓
Le commentaire apparaît (ou non) sur le site au prochain rendu
```

Aucune interface admin dédiée pour cette phase. La modération se fait depuis le dashboard Supabase directement.

---

## 8. Récapitulatif des dépendances

| Service  | Rôle                             | Tier                            |
| -------- | -------------------------------- | ------------------------------- |
| Clerk    | Auth + sessions                  | Gratuit jusqu'à 10 000 MAU      |
| Supabase | DB PostgreSQL                    | Gratuit (2 projets, 500 MB)     |
| Brevo    | Email modération (déjà en place) | Gratuit jusqu'à 300 emails/jour |
| Netlify  | Hébergement SSR (déjà en place)  | Gratuit                         |

**Nouveaux packages npm :**

- `@clerk/astro`
- `@supabase/supabase-js`

---

## 9. Critères de succès

- [ ] Un visiteur peut créer un compte via magic link ou Google
- [ ] Un visiteur connecté voit son avatar dans la nav
- [ ] Un visiteur connecté peut poster un commentaire sur un article ou un chantier
- [ ] Le commentaire n'apparaît pas immédiatement (status pending)
- [ ] Loïc reçoit un email de notification à chaque nouveau commentaire
- [ ] Après approbation manuelle dans Supabase, le commentaire apparaît sur la page
- [ ] Aucune page existante n'est cassée (les pages statiques restent statiques)
- [ ] Build Netlify passe en vert

---

## 10. Notes V2 à ne pas perdre

- Réponses imbriquées (un niveau) — ajout colonne `parent_id`
- Bouton "👍 utile" par commentaire — ajout colonne `likes_count` + table `comment_likes`
- Interface admin `/admin/comments` au lieu de modérer depuis Supabase directement
- Soumission de chantiers par les membres (§9.4 du brief, V2)
