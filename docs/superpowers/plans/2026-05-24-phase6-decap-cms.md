# Phase 6 — Decap CMS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mettre en place une interface d'administration sur `/admin` permettant de créer et modifier les contenus MDX des 4 collections Astro directement depuis le navigateur, via GitHub OAuth.

**Architecture:** Deux fichiers statiques dans `public/admin/` — `index.html` charge l'interface Decap depuis CDN, `config.yml` déclare les 4 collections avec leurs champs. L'authentification passe par Netlify Identity (proxy OAuth GitHub). Les sauvegardes créent des commits directs sur la branche `main`. L'output Astro est `static`, donc les fichiers `public/` sont servis tels quels sans passer par le routeur Astro.

**Tech Stack:** Decap CMS 3.x (CDN), Netlify Identity (git-gateway backend), YAML config, HTML statique.

---

## Fichiers créés / modifiés

| Fichier | Action | Rôle |
|---|---|---|
| `public/admin/index.html` | Créer | Page admin — charge Decap depuis CDN |
| `public/admin/config.yml` | Créer | Config complète : backend, media, 4 collections |
| `src/layouts/BaseLayout.astro` | Modifier | Ajoute le script de redirect Netlify Identity |

---

## Task 1 : Page admin `index.html`

**Files:**
- Create: `public/admin/index.html`

- [ ] **Créer le fichier `public/admin/index.html`**

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex" />
    <title>Topolia — Admin</title>
    <script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>
  </head>
  <body>
    <script src="https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js"></script>
  </body>
</html>
```

- [ ] **Vérifier que le build passe**

```bash
npm run build
```

Résultat attendu : `build` termine sans erreur. Le fichier `dist/admin/index.html` doit être présent.

```bash
ls dist/admin/
```

- [ ] **Commit**

```bash
git add public/admin/index.html
git commit -m "feat(phase6): page admin Decap CMS"
```

---

## Task 2 : Config Decap — backend + media + collection articles

**Files:**
- Create: `public/admin/config.yml`

- [ ] **Créer `public/admin/config.yml` avec le backend, la config media et la collection articles**

```yaml
backend:
  name: git-gateway
  branch: main

local_backend: true

media_folder: public/images
public_folder: /images

locale: fr

collections:
  - name: articles
    label: Articles
    label_singular: Article
    folder: src/content/articles
    create: true
    slug: "{{slug}}"
    extension: mdx
    format: frontmatter
    media_folder: /public/images/articles
    public_folder: /images/articles
    fields:
      - { label: "Titre", name: title, widget: string }
      - { label: "Sous-titre", name: subtitle, widget: string, required: false }
      - label: "Date"
        name: date
        widget: datetime
        format: "YYYY-MM-DD"
        date_format: "DD/MM/YYYY"
        time_format: false
      - label: "Catégorie"
        name: category
        widget: select
        options:
          - { label: "Tutoriels", value: tutoriels }
          - { label: "Actualités", value: actualités }
          - { label: "Analyses", value: analyses }
          - { label: "Retours terrain", value: retours-terrain }
      - { label: "Tags", name: tags, widget: list, required: false }
      - { label: "Auteur", name: author, widget: string, default: loic }
      - { label: "Image hero", name: heroImage, widget: image, required: false }
      - { label: "Alt image hero", name: heroImageAlt, widget: string, required: false }
      - { label: "Extrait", name: excerpt, widget: text }
      - { label: "Premium", name: isPremium, widget: boolean, default: false }
      - { label: "Publié", name: isPublished, widget: boolean, default: false }
      - { label: "Contenu", name: body, widget: markdown }
```

> ⚠️ `local_backend: true` est temporaire pour les tests locaux. Il sera retiré en Task 5.

- [ ] **Vérifier que le build passe**

```bash
npm run build
```

Résultat attendu : build OK, pas d'erreur.

- [ ] **Commit**

```bash
git add public/admin/config.yml
git commit -m "feat(phase6): config Decap — backend + collection articles"
```

---

## Task 3 : Ajouter les collections chantiers, glossaire et minute-topo

**Files:**
- Modify: `public/admin/config.yml`

- [ ] **Ajouter les 3 collections restantes à la fin du fichier `public/admin/config.yml`**

Ajouter ces blocs sous la collection `articles` (même niveau d'indentation) :

```yaml
  - name: chantiers
    label: Chantiers
    label_singular: Chantier
    folder: src/content/chantiers
    create: true
    slug: "{{slug}}"
    extension: mdx
    format: frontmatter
    media_folder: /public/images/chantiers
    public_folder: /images/chantiers
    fields:
      - { label: "Titre", name: title, widget: string }
      - label: "Date"
        name: date
        widget: datetime
        format: "YYYY-MM-DD"
        date_format: "DD/MM/YYYY"
        time_format: false
      - { label: "Surface", name: surface, widget: string, required: false }
      - { label: "Matériel utilisé", name: materiel, widget: list, required: false }
      - { label: "Problème rencontré", name: probleme, widget: text, required: false }
      - { label: "Leçon apprise", name: lecon, widget: text, required: false }
      - { label: "Tags", name: tags, widget: list, required: false }
      - { label: "Publié", name: isPublished, widget: boolean, default: false }
      - { label: "Contenu", name: body, widget: markdown }

  - name: glossaire
    label: Glossaire
    label_singular: Terme
    folder: src/content/glossaire
    create: true
    slug: "{{slug}}"
    extension: mdx
    format: frontmatter
    fields:
      - { label: "Titre", name: title, widget: string }
      - label: "Date"
        name: date
        widget: datetime
        format: "YYYY-MM-DD"
        date_format: "DD/MM/YYYY"
        time_format: false
      - label: "Difficulté"
        name: difficulty
        widget: select
        required: false
        options:
          - { label: "Débutant", value: debutant }
          - { label: "Intermédiaire", value: intermediaire }
          - { label: "Avancé", value: avance }
      - { label: "Articles liés", name: relatedArticles, widget: list, required: false }
      - { label: "Chantiers liés", name: relatedChantiers, widget: list, required: false }
      - { label: "Extrait", name: excerpt, widget: text }
      - { label: "Publié", name: isPublished, widget: boolean, default: false }
      - { label: "Contenu", name: body, widget: markdown }

  - name: minute-topo
    label: Minute Topo
    label_singular: Minute Topo
    folder: src/content/minute-topo
    create: true
    slug: "{{slug}}"
    extension: mdx
    format: frontmatter
    fields:
      - { label: "Titre", name: title, widget: string }
      - label: "Date"
        name: date
        widget: datetime
        format: "YYYY-MM-DD"
        date_format: "DD/MM/YYYY"
        time_format: false
      - { label: "Tags", name: tags, widget: list, required: false }
      - { label: "Extrait", name: excerpt, widget: text }
      - { label: "Publié", name: isPublished, widget: boolean, default: false }
      - { label: "Contenu", name: body, widget: markdown }
```

- [ ] **Vérifier que le build passe**

```bash
npm run build
```

Résultat attendu : build OK, pas d'erreur.

- [ ] **Commit**

```bash
git add public/admin/config.yml
git commit -m "feat(phase6): config Decap — collections chantiers, glossaire, minute-topo"
```

---

## Task 4 : Script redirect Netlify Identity dans BaseLayout

**Files:**
- Modify: `src/layouts/BaseLayout.astro`

Après un login OAuth, Netlify redirige vers la racine du site avec un token dans l'URL. Ce script intercepte ce token et renvoie l'utilisateur vers `/admin/`.

- [ ] **Ajouter le script juste avant `</body>` dans `src/layouts/BaseLayout.astro`**

```astro
  <script>
    if (window.netlifyIdentity) {
      window.netlifyIdentity.on('init', (user) => {
        if (!user) {
          window.netlifyIdentity.on('login', () => {
            document.location.href = '/admin/';
          });
        }
      });
    }
  </script>
  </body>
```

Remplace la ligne `</body>` existante (ligne 86).

- [ ] **Vérifier que le build passe**

```bash
npm run build
```

Résultat attendu : build OK, pas d'erreur TypeScript, pas d'avertissement.

- [ ] **Commit**

```bash
git add src/layouts/BaseLayout.astro
git commit -m "feat(phase6): script redirect Netlify Identity dans BaseLayout"
```

---

## Task 5 : Test local de l'interface admin

Cette task vérifie que l'interface fonctionne avant de pousser sur GitHub.

- [ ] **Ouvrir 2 terminaux**

**Terminal 1 — serveur Decap local :**
```bash
npx decap-server
```
Résultat attendu : `Netlify CMS Proxy Server listening on port 8081`

**Terminal 2 — serveur Astro :**
```bash
npm run dev
```
Résultat attendu : site disponible sur `http://localhost:4321`

- [ ] **Ouvrir `http://localhost:4321/admin/` dans le navigateur**

En mode `local_backend: true`, Decap se connecte au proxy local sans authentification. L'interface doit s'afficher avec les 4 collections dans la barre latérale gauche : Articles, Chantiers, Glossaire, Minute Topo.

- [ ] **Vérifier les collections**

Cliquer sur chaque collection et vérifier que :
- Les entrées existantes s'affichent dans la liste
- Un clic sur une entrée affiche le formulaire avec les bons champs
- Le bouton "New Article" (ou équivalent) affiche un formulaire vide avec tous les champs

- [ ] **Tester la création d'un article de test**

1. Cliquer sur "Articles" → "New Article"
2. Remplir les champs minimum : titre, date, catégorie, extrait, `isPublished: false`
3. Cliquer "Save" — vérifier qu'un fichier MDX apparaît dans `src/content/articles/`
4. Supprimer ce fichier de test manuellement (ne pas le commiter)

```bash
ls src/content/articles/
```

- [ ] **Arrêter les 2 terminaux** (Ctrl+C dans chacun)

---

## Task 6 : Retirer `local_backend` + build final + push

**Files:**
- Modify: `public/admin/config.yml`

- [ ] **Retirer la ligne `local_backend: true` du fichier `public/admin/config.yml`**

La ligne à supprimer :
```yaml
local_backend: true
```

Le fichier doit commencer ainsi après modification :
```yaml
backend:
  name: git-gateway
  branch: main

media_folder: public/images
```

- [ ] **Build final**

```bash
npm run build
```

Résultat attendu : build OK, pas d'erreur.

- [ ] **Commit et push**

```bash
git add public/admin/config.yml
git commit -m "feat(phase6): retrait local_backend — prêt pour production"
git push
```

---

## Task 7 : Configuration Netlify (étapes manuelles — Loïc)

Ces étapes se font sur le dashboard Netlify. Elles ne nécessitent pas de modifier le code.

**Durée estimée : 10 minutes.**

### Étape 1 — Activer Netlify Identity

1. Aller sur [app.netlify.com](https://app.netlify.com)
2. Sélectionner le site Topolia
3. Aller dans **Site configuration → Identity**
4. Cliquer **Enable Identity**

### Étape 2 — Activer GitHub comme provider OAuth

1. Toujours dans **Identity**, descendre jusqu'à **Registration**
2. Passer "Registration preferences" à **Invite only** (pour que seul toi puisses te connecter)
3. Descendre jusqu'à **External providers**
4. Cliquer **Add provider → GitHub**
5. Laisser les paramètres par défaut → **Enable GitHub**

### Étape 3 — Activer Git Gateway

1. Toujours dans **Identity**, descendre jusqu'à **Services**
2. Cliquer **Enable Git Gateway**
3. GitHub te demandera d'autoriser Netlify → accepter

### Étape 4 — T'inviter comme utilisateur admin

1. Dans **Identity**, cliquer **Invite users**
2. Entrer ton email `loicdu27620@gmail.com`
3. Cliquer **Send**
4. Ouvrir l'email reçu → cliquer le lien d'invitation
5. Créer ton mot de passe Netlify Identity (ce mot de passe sera utilisé pour l'admin)

### Étape 5 — Déclencher un build production

1. Aller dans **Deploys**
2. Cliquer **Trigger deploy → Deploy site**
3. Attendre que le build soit vert

### Étape 6 — Tester l'admin en production

1. Aller sur `https://topolia.fr/admin/`
2. Cliquer **Login with Netlify Identity**
3. Choisir **Continue with GitHub**
4. Vérifier que l'interface Decap s'affiche avec les 4 collections

---

## Limitation connue — composants MDX

Les articles existants utilisent des composants MDX (`import Callout from '...'`). L'éditeur Decap est un éditeur markdown standard — il ne connaît pas les composants Astro.

**En pratique :**
- Pour les articles simples (texte, titres, listes) : Decap fonctionne parfaitement
- Pour les articles avec `<Callout>`, `<TwoColumns>`, etc. : écrire le contenu dans Decap, puis ajouter les imports et composants à la main dans le fichier MDX via VS Code ou GitHub

Cette limitation est inhérente à Decap CMS et ne nécessite pas de contournement pour l'usage actuel.
