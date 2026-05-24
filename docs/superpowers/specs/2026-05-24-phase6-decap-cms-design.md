# Spec — Phase 6 : Decap CMS

**Date :** 2026-05-24
**Statut :** Validé

---

## Objectif

Mettre en place une interface d'administration éditoriale sur `topolia.fr/admin` permettant à Loïc (et d'éventuels collaborateurs) de créer et modifier les contenus du site sans toucher aux fichiers MDX manuellement.

---

## Architecture

### Fichiers créés

```
public/
  admin/
    index.html      ← interface Decap CMS (chargée depuis CDN)
    config.yml      ← configuration des collections et champs
```

### Flux de travail

1. Loïc accède à `topolia.fr/admin`
2. Il se connecte via GitHub (Netlify Identity comme proxy OAuth)
3. Il crée ou modifie un contenu dans l'interface Decap
4. Decap commite directement sur la branche `main` de GitHub
5. Loïc déclenche manuellement un build depuis le dashboard Netlify quand il est prêt

### Brouillons

Le champ `isPublished: false` dans le frontmatter suffit pour masquer un article du site sans bloquer le commit. Pas de workflow éditorial complexe (branches/PRs) — inutile en solo.

---

## Authentification

- **Netlify Identity** activé sur le site (plan gratuit, jusqu'à 1 000 utilisateurs)
- **GitHub OAuth** activé comme provider dans Netlify Identity
- Loïc invité comme utilisateur admin via son email
- Ajout de collaborateurs futurs : leur donner accès au repo GitHub + les inviter dans Netlify Identity

---

## Collections

### Articles (`src/content/articles/`)

| Champ          | Type Decap                                                | Obligatoire         |
| -------------- | --------------------------------------------------------- | ------------------- |
| `title`        | string                                                    | oui                 |
| `subtitle`     | string                                                    | non                 |
| `date`         | datetime                                                  | oui                 |
| `category`     | select (tutoriels, actualités, analyses, retours-terrain) | oui                 |
| `tags`         | list                                                      | non                 |
| `author`       | string                                                    | oui                 |
| `heroImage`    | image                                                     | non                 |
| `heroImageAlt` | string                                                    | non                 |
| `excerpt`      | text                                                      | oui                 |
| `isPremium`    | boolean                                                   | oui (défaut: false) |
| `isPublished`  | boolean                                                   | oui (défaut: false) |
| body           | markdown                                                  | oui                 |

### Chantiers (`src/content/chantiers/`)

| Champ         | Type Decap | Obligatoire         |
| ------------- | ---------- | ------------------- |
| `title`       | string     | oui                 |
| `date`        | datetime   | oui                 |
| `surface`     | string     | non                 |
| `materiel`    | list       | non                 |
| `probleme`    | text       | non                 |
| `lecon`       | text       | non                 |
| `tags`        | list       | non                 |
| `isPublished` | boolean    | oui (défaut: false) |
| body          | markdown   | oui                 |

### Glossaire (`src/content/glossaire/`)

| Champ              | Type Decap                               | Obligatoire         |
| ------------------ | ---------------------------------------- | ------------------- |
| `title`            | string                                   | oui                 |
| `date`             | datetime                                 | oui                 |
| `difficulty`       | select (debutant, intermediaire, avance) | non                 |
| `relatedArticles`  | list                                     | non                 |
| `relatedChantiers` | list                                     | non                 |
| `excerpt`          | text                                     | oui                 |
| `isPublished`      | boolean                                  | oui (défaut: false) |
| body               | markdown                                 | oui                 |

### Minute Topo (`src/content/minute-topo/`)

| Champ         | Type Decap | Obligatoire         |
| ------------- | ---------- | ------------------- |
| `title`       | string     | oui                 |
| `date`        | datetime   | oui                 |
| `tags`        | list       | non                 |
| `excerpt`     | text       | oui                 |
| `isPublished` | boolean    | oui (défaut: false) |
| body          | markdown   | oui                 |

---

## Images

- Upload depuis l'interface Decap vers `public/images/` dans le repo
- Sous-dossiers par collection : `public/images/articles/`, `public/images/chantiers/`, etc.
- Les chemins générés par Decap correspondent aux chemins déjà utilisés dans les MDX existants

---

## Crédits Netlify

- Déploiement automatique Netlify **désactivé** (inchangé)
- ~4 builds manuels/mois pour 1 article/semaine = ~20 min sur 300 disponibles
- Aucun risque de dépassement

---

## Ce qu'on ne touche pas

- Les fichiers MDX existants (Decap les lit sans modification)
- La config Astro (`astro.config.mjs`)
- Les schémas Zod des content collections
- Le déploiement Netlify (on ajoute Identity, on ne change pas le reste)

---

## Étapes Netlify (à faire manuellement par Loïc)

Décrites au moment de l'implémentation, étape par étape :

1. Activer Netlify Identity
2. Activer GitHub comme provider OAuth
3. Inviter l'email admin
