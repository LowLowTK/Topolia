# CLAUDE.md — Topolia.fr

> Fichier lu automatiquement par Claude Code à chaque ouverture de session.
> Pour la spec complète du projet, voir `BRIEF.md` à la racine.

---

## Stack

- **Astro 6** (Content Layer API) + **TypeScript strict**
- **CSS variables** uniquement — pas de Tailwind, pas de UI lib
- **MDX** pour tout le contenu (articles, glossaire, chantiers, minute topo)
- **Polices** : Onest + JetBrains Mono via Google Fonts
- **Intégrations Astro** : `@astrojs/mdx`, `@astrojs/sitemap`

Voir §3, §4 et §8 du BRIEF.md pour les détails.

---

## Règles Git multi-PC — non négociables

Le projet tourne sur plusieurs machines. Git est la seule infrastructure qui garantit que rien ne se perd.

**Début de session** :

```bash
git pull
```

**Fin de session** :

```bash
git add .
git commit -m "description courte de ce qui a été fait"
git push
```

Ne jamais fermer une session sans avoir pushé. Voir §24.1 du BRIEF.md.

---

## Règles de commit (Husky + lint-staged)

Chaque `git commit` déclenche automatiquement :

| Fichier modifié                            | Vérifications                                              |
| ------------------------------------------ | ---------------------------------------------------------- |
| `*.ts`, `*.astro`                          | ESLint (avec `--fix`) + Prettier                           |
| `*.mdx`                                    | Agent orthographe (`scripts/check-grammar.mjs`) + Prettier |
| `*.json`, `*.md`, `*.css`, `*.mjs`, `*.js` | Prettier                                                   |

Si une vérification échoue → **commit bloqué** avec message d'erreur explicite.

**Pour corriger** : applique les corrections, re-stage, recommit. Ne **jamais** utiliser `--no-verify`.

---

## Agent orthographe — `scripts/check-grammar.mjs`

Vérifie tout `.mdx` modifié avant chaque commit. Deux passes :

1. **Regex tutoiement** — bloque tout `vous / votre / vos / veuillez` qui se glisse (le site tutoie toujours).
2. **LanguageTool API publique** — orthographe, grammaire, accords, typographie française.

**Mode tolérant** : si le réseau est down ou que LanguageTool ne répond pas, l'agent affiche un warning mais autorise le commit. La passe regex tutoiement reste effective (locale).

Zéro dépendance npm, zéro clé API, zéro setup. Voir §24.5 du BRIEF.md.

---

## Règles de code

- **Composants** : `.astro`, props typées via interface TypeScript — **jamais** de prop non typée
- **CSS** : variables uniquement (cf. tokens §4 du brief) — **jamais** de couleur hardcodée
- **Images** : toujours `<Image>` d'Astro, jamais `<img>` nu (AVIF/WebP auto)
- **Accessibilité** : `aria-label` sur SVG décoratifs, `alt` obligatoire sur images, contrastes ≥ AA
- **Mobile-first** : breakpoints `640 / 900 / 1080 / 1280` px, targets tactiles min `44×44 px`

---

## Conventions de nommage

- **Fichiers** : `kebab-case` (`article-card.astro`, `minute-topo/`)
- **Composants** : `PascalCase` (`<ArticleCard />`, `<MinuteTopoCard />`)
- **Classes CSS** : `kebab-case`, BEM léger (`block__element--modifier`)
- **MDX composants** : dans `src/components/mdx/`, importés explicitement dans chaque `.mdx`

---

## État d'avancement

| Phase                            | Statut | Livrable                                                                                     |
| -------------------------------- | ------ | -------------------------------------------------------------------------------------------- |
| Phase 1 — Fondations             | ✅     | Astro scaffold, tokens, Logo (5 variants), PulseLoader, Nav, Footer, BaseLayout              |
| Phase 2 — Content collections    | ✅     | 4 schémas Zod, 5 composants MDX, 3 cards, contenu de démo                                    |
| Phase 3 — Pages clés             | ✅     | Home, listings + fiches articles/glossaire/chantiers, minute topo, à propos (26 pages)       |
| Phase 4 — Newsletter + Analytics | ✅     | Brevo API, Plausible, OG dynamiques, adapter Netlify                                         |
| Phase 5 — Membres & commentaires | ✅     | Clerk (magic link + Google), Supabase commentaires modérés, intégration articles + chantiers |
| Phase 6 — Decap CMS              | 🔲     | Admin éditorial                                                                              |
| Phase 7 — Pipeline IA            | 🔲     | Veille + rédaction + repurposing                                                             |

Page temporaire `/debug-content` supprimée à la fin de la Phase 3.

---

## Réflexes de session

**En début de session sur un nouveau PC** :

1. `git pull` pour récupérer la dernière version
2. Lire ce `CLAUDE.md`
3. Lire `BRIEF.md` si question sur la spec
4. `npm install` si `package-lock.json` a changé
5. Recréer `.env` à partir de `.env.example` si absent

**En fin de session** :

1. `npm run build` pour vérifier que rien n'est cassé
2. `git add . && git commit -m "..." && git push`

---

## Stratégie de déploiement — crédits Netlify

Le plan gratuit Netlify donne **300 crédits/mois**. Chaque build en consomme beaucoup (génération des images OG, SSR, etc.). Pour ne pas épuiser le quota :

**Pendant le développement :**

- Tester en local avec `npm run dev` (zéro crédit consommé)
- Pusher sur GitHub librement — ça ne déclenche **pas** de build Netlify si le déploiement automatique est désactivé
- Vérifier que le build passe en local avec `npm run build` avant de déployer

**Pour déployer en production :**

- Uniquement quand une phase entière est terminée ou qu'un gros ajout est validé en local
- Déclencher manuellement depuis le dashboard Netlify : **Deploys → Trigger deploy**
- Ou activer le déploiement auto temporairement, pousser, puis le désactiver

**À désactiver dans Netlify pour éviter les builds automatiques :**
Dashboard Netlify → Site configuration → Build & deploy → **Stop auto publishing** (désactive les déploiements automatiques à chaque push Git).

---

## Liens rapides

- Brief complet → [BRIEF.md](./BRIEF.md)
- Plans de phase → [docs/superpowers/plans/](./docs/superpowers/plans/)
- Tokens de design → [§4 du BRIEF.md](./BRIEF.md#4-design-tokens)
- Animations Pulse → [§6 du BRIEF.md](./BRIEF.md#6-animations-pulse--3-variantes)
- Sécurité avant prod → [§22.7 du BRIEF.md](./BRIEF.md#227-checklist-sécurité-avant-mise-en-prod)
