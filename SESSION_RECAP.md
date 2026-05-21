# Session recap — Topolia.fr

> Pour reprendre le projet sur un autre PC ou après une pause.
> Dernière mise à jour : 20 mai 2026.

---

## Où on en est

| Phase                                                                                     | Statut | Commit    |
| ----------------------------------------------------------------------------------------- | ------ | --------- |
| Phase 1 — Fondations (scaffold Astro, tokens, Logo, PulseLoader, Nav, Footer, BaseLayout) | ✅     | `4b22d76` |
| Phase 2 — Content collections (4 schémas Zod, 5 composants MDX, 3 cards, contenu de démo) | ✅     | `8acc95e` |
| Setup tooling (Husky + lint-staged + ESLint + Prettier + agent orthographe + CLAUDE.md)   | ✅     | `3c47d7c` |
| Phase 3 — Pages clés (home, listings, fiches détail, à propos, 26 pages)                  | ✅     | `94156cf` |
| Ajustement UX (hero plus court, ChantierCard refonte, placeholder enrichi)                | ✅     | `15d1af9` |
| Phase 4 — Newsletter Brevo + Plausible + OG images dynamiques + adapter Netlify           | ✅     | `a1323fd` |
| Phase 5 — Membres & commentaires (Clerk + Supabase)                                       | 🔲     | —         |
| Phase 6 — Decap CMS                                                                       | 🔲     | —         |
| Phase 7 — Pipeline IA assisté                                                             | 🔲     | —         |

---

## Site en ligne

- **Production** : https://topolia-site.netlify.app
- **Admin Netlify** : https://app.netlify.com/projects/topolia-site
- **Project ID Netlify** : `1c27377e-b34a-4065-a3ff-4499e2c7d513`
- **Team Netlify** : `Topolia`
- **Repo lié** : `LowLowTK/Topolia` sur `main` → **auto-deploy actif** à chaque `git push`
- **Domaine final prévu** : `topolia.fr` (sur OVH — DNS à pointer vers Netlify quand prêt)

---

## Stack et structure

- **Framework** : Astro 6.3 (Content Layer API)
- **Adapter** : `@astrojs/netlify` (output static + SSR function pour endpoints API)
- **TypeScript** : strict
- **Styling** : CSS variables uniquement — aucun Tailwind
- **Contenu** : MDX dans `src/content/{articles,glossaire,chantiers,minute-topo}/`
- **Polices** : Onest + JetBrains Mono via Google Fonts
- **Newsletter** : Brevo API v3
- **Analytics** : Plausible (script tag conditionné)
- **OG images** : générées au build via `sharp` (22 PNG)

Voir [`BRIEF.md`](./BRIEF.md) pour la spec complète, [`CLAUDE.md`](./CLAUDE.md) pour le quick start session.

---

## Repos et fichiers à connaître

```
C:\dev\Topolia\
├── BRIEF.md                              ← spec complète (§1 à §25)
├── CLAUDE.md                             ← quick start pour Claude Code
├── SESSION_RECAP.md                      ← ce fichier
├── docs/superpowers/plans/               ← plans détaillés par phase
│   ├── 2026-05-19-phase1-fondations.md
│   ├── 2026-05-19-phase2-content-collections.md
│   ├── 2026-05-20-phase3-pages-cles.md
│   └── 2026-05-20-phase4-newsletter-analytics-og.md
├── scripts/check-grammar.mjs             ← agent orthographe pre-commit
├── src/
│   ├── components/                       ← 16 composants Astro
│   ├── content/                          ← MDX (3 articles, 8 glossaire, 2 chantiers, 2 minutes)
│   ├── layouts/                          ← BaseLayout + ArticleLayout
│   ├── lib/                              ← brevo, content-helpers, og-template, reading-time
│   ├── pages/                            ← 13 fichiers .astro + 1 endpoint API + route OG
│   └── styles/global.css                 ← design tokens + animations Pulse
└── .env                                  ← LOCAL UNIQUEMENT, pas versionné
```

---

## Pour reprendre sur un autre PC

### 1. Cloner le repo

```bash
git clone https://github.com/<ton-compte>/topolia-site.git
cd topolia-site
npm install
```

### 2. Recréer le `.env` local

Le `.env` n'est pas versionné. Le recréer à partir de `.env.example` à la racine :

```bash
# Site (obligatoire pour les URLs OG en local)
PUBLIC_SITE_URL=https://topolia.fr

# Newsletter (Brevo) — Phase 4 (optionnel : 503 propre sans)
BREVO_API_KEY=xkeysib-xxxxx
BREVO_LIST_ID=2

# Analytics (Plausible) — Phase 4 (optionnel : script non injecté sans)
PUBLIC_PLAUSIBLE_DOMAIN=topolia.fr
```

Les clés sont à récupérer dans les dashboards des services respectifs.

### 3. Vérifier que tout marche

```bash
npm run build              # doit générer ~27 pages HTML + 22 PNG OG
npm run dev                # http://localhost:4321
npx eslint .               # 0 erreur
npx prettier --check .     # tout conforme
```

### 4. Vérifier l'auth Netlify si redéploiement nécessaire

```bash
npx netlify-cli status     # vérifie qui est loggé
# si pas loggé : npx netlify-cli login
# le site est déjà lié via .netlify/state.json (versionné dans le repo)
```

### 5. Déployer manuellement

```bash
npx netlify-cli deploy --build --prod
```

---

## Workflow Git multi-PC (rappel)

```bash
# Début de session
git pull

# Fin de session
git add .
git commit -m "description courte"
git push
```

**Husky bloque le commit** si :

- Erreur ESLint ou Prettier sur `.ts`/`.astro` modifiés
- Faute orthographique ou « vous » détecté dans `.mdx` modifiés (LanguageTool API + regex)

Pour corriger : applique les corrections, re-stage, recommit. **Ne jamais utiliser `--no-verify`**.

---

## Variables d'env Netlify (production)

À configurer dans **Netlify → Project settings → Environment variables** :

| Variable                  | Valeur                 | Quand ajouter               |
| ------------------------- | ---------------------- | --------------------------- |
| `BREVO_API_KEY`           | clé Brevo dashboard    | Quand newsletter prête      |
| `BREVO_LIST_ID`           | ID liste Brevo (ex. 2) | Quand newsletter prête      |
| `PUBLIC_PLAUSIBLE_DOMAIN` | `topolia.fr`           | Quand Plausible configuré   |
| `PUBLIC_SITE_URL`         | `https://topolia.fr`   | Au moment du switch domaine |

Sans ces variables, le site fonctionne quand même — l'endpoint newsletter renvoie 503 propre, Plausible n'est pas injecté.

---

## Prochaines étapes (Phase 5+)

### Phase 5 — Membres & commentaires

- Setup Clerk (auth magic link + Google OAuth) — §20 du brief
- Pages `/login` et `/signup`
- Composant `<Comments>` avec auth required
- Backend Supabase pour le stockage

### Phase 6 — Decap CMS

- Configurer Decap CMS dans `public/admin/`
- OAuth GitHub pour Loïc

### Phase 7 — Pipeline éditorial IA

- À attaquer après 5-10 articles publiés à la main
- Agent veille (Reddit, YouTube, Google News, ArXiv…)
- Agent rédaction brouillon
- Agent repurposing (LinkedIn, newsletter, minute topo)
- Interface admin `/admin/studio` (Clerk auth)

---

## Identité Git

Git n'est pas configuré globalement sur ce PC. Les commits utilisent un identité inline :

```bash
git -c user.email=loicdu27620@gmail.com -c user.name=Loic commit -m "..."
```

Si tu veux configurer pour le repo local :

```bash
git config user.email "loicdu27620@gmail.com"
git config user.name "Loic"
```

---

## Liens utiles

- Production : <https://topolia-site.netlify.app>
- Brief : [BRIEF.md](./BRIEF.md)
- Quick start Claude Code : [CLAUDE.md](./CLAUDE.md)
- Plans détaillés : [docs/superpowers/plans/](./docs/superpowers/plans/)
