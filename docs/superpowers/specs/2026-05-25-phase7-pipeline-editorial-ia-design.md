# Phase 7 — Pipeline éditorial IA assisté (Option C)

**Date** : 2026-05-25
**Statut** : Approuvé

---

## Contexte

Phase 7 du projet Topolia.fr. L'objectif est d'aider Loïc à trouver des sujets d'articles (veille) et à générer des brouillons (rédaction), **sans payer aucune API externe**. Toute l'intelligence artificielle passe par Claude.ai (site web, usage manuel) — pas par l'API Anthropic.

Les articles de démonstration existants dans le repo servent de corpus de référence pour la voix éditoriale.

---

## Décisions clés

| Sujet               | Décision                                                |
| ------------------- | ------------------------------------------------------- |
| API Anthropic       | ❌ Non utilisée — trop coûteuse pour le moment          |
| SerpAPI             | ❌ Remplacée par flux RSS gratuits                      |
| Rédaction IA        | ✅ Via Claude.ai (copier-coller manuel)                 |
| Stockage sujets     | ✅ Supabase (plan gratuit)                              |
| Veille              | ✅ RSS natif (Reddit, YouTube, Google News)             |
| Automatisation      | ✅ Semi-automatisée — pas de cron, déclenchement manuel |
| Netlify/Vercel cron | ❌ Non utilisé — process 100% manuel                    |

---

## Architecture générale

```
/admin/studio (Astro, protégé Clerk)
      │
      ├── Onglet "Veille" — flux RSS (fetch serveur, gratuit)
      │         └── Boutons : Sauvegarder / Préparer le prompt
      │
      └── Onglet "Mes sujets" — dashboard Supabase
                └── Statuts, actions, génération de prompt
```

---

## Page `/admin/studio`

### Accès

- Protégée par Clerk (middleware existant)
- Accessible uniquement à Loïc (et futurs délégués)
- Route Astro SSR : `src/pages/admin/studio.astro`

### Onglet 1 — Veille 📡

**Sources RSS surveillées :**

| Source                     | Flux                                                        |
| -------------------------- | ----------------------------------------------------------- |
| Reddit r/Surveying         | `https://www.reddit.com/r/Surveying/.rss`                   |
| Reddit r/photogrammetry    | `https://www.reddit.com/r/photogrammetry/.rss`              |
| Reddit r/drones            | `https://www.reddit.com/r/drones/.rss`                      |
| Reddit r/lidar             | `https://www.reddit.com/r/lidar/.rss`                       |
| Google News LiDAR          | `https://news.google.com/rss/search?q=lidar+scanner&hl=en`  |
| Google News drone survey   | `https://news.google.com/rss/search?q=drone+survey&hl=en`   |
| Google News photogrammetry | `https://news.google.com/rss/search?q=photogrammetry&hl=en` |
| YouTube (via RSS)          | Via YouTube Data API RSS (gratuit)                          |

**Affichage de chaque article :**

- Titre + source + drapeau langue (🇬🇧 🇩🇪 🇯🇵 🇸🇪 🇫🇷)
- Date de publication
- Extrait (description RSS)
- Bouton **"Sauvegarder"** → enregistre dans Supabase avec statut `pending`
- Bouton **"Préparer le prompt"** → affiche les 2 prompts (sans sauvegarder)

**Fetching RSS :**

- Côté serveur Astro (SSR) à chaque chargement de page
- Parsing XML natif (pas de lib externe)
- Timeout 5s par source — si une source ne répond pas, elle est ignorée silencieusement

---

### Onglet 2 — Mes sujets 📋

**Tableau de bord des sujets sauvegardés dans Supabase.**

**Colonnes :**

- Titre du sujet
- Source + langue
- Date de sauvegarde
- Statut (badge coloré)
- Actions

**Statuts disponibles :**

| Statut      | Couleur    | Signification                     |
| ----------- | ---------- | --------------------------------- |
| `pending`   | Gris       | Sauvegardé, pas encore traité     |
| `approved`  | Bleu       | Validé, à rédiger                 |
| `drafting`  | Orange     | Prompt généré, brouillon en cours |
| `draft`     | Vert clair | Brouillon prêt dans Decap CMS     |
| `published` | Vert       | Article publié sur le site        |
| `ignored`   | Rouge      | Sujet écarté                      |

**Actions par sujet :**

- Changer le statut (dropdown)
- Préparer le prompt (ouvre la modale 2 étapes)
- Supprimer définitivement

---

## Le prompt magique — 2 étapes

Accessible depuis l'onglet Veille ET l'onglet Mes sujets.

### Étape 1 — Résumé et angle

Prompt copié dans le presse-papier (bouton "Copier") :

```
Tu es un consultant éditorial pour Topolia.fr, site français de référence sur la topographie moderne (scanner laser, LiDAR drone, photogrammétrie).

Voici un article source :
URL : [URL]
Titre original : [TITRE]

Fais-moi :
1. Un résumé en français en 5-6 phrases
2. Une évaluation : est-ce pertinent pour le public Topolia (topographes, géomètres, passionnés de LiDAR) ? Oui/Non/Partiel
3. Si pertinent, propose un angle d'article en français — ce qui n'existe pas encore en français, ce qui apporte une valeur ajoutée terrain

Sois direct et concis.
```

### Étape 2 — Brouillon MDX complet

Visible après l'étape 1, bouton "Passer à la rédaction" :

```
Tu es l'assistant éditorial de Topolia.fr — site français de référence sur la topographie moderne.

TON ÉDITORIAL :
- Tutoiement systématique, direct, jamais corporate
- Style tech accessible : opinions tranchées, jargon expliqué à la 1ère occurrence
- Exemples concrets, chiffres réels, pas de généralités

SUJET : [TITRE DU SUJET]
ANGLE : [ANGLE VALIDÉ À L'ÉTAPE 1]
SOURCE : [URL]

Rédige un brouillon d'article MDX complet avec :
1. Titre SEO + titre alternatif accrocheur
2. Excerpt (2-3 phrases pour le feed)
3. Introduction dans la voix Topolia
4. Structure H2/H3 proposée
5. Chaque section rédigée avec :
   - Contenu factuel sourcé
   - <!-- À VÉRIFIER PAR LOÏC --> sur tout fait non confirmé
   - [DONNÉE TERRAIN LOÏC] pour les mesures et expériences réelles
   - [RETOUR TERRAIN LOÏC] pour les anecdotes
6. Conclusion avec CTA
7. Tags suggérés + catégorie

RÈGLES ABSOLUES :
- status: draft — jamais published
- Citer les sources avec URLs complètes
- Langue : français même si la source est en anglais
- Ne jamais inventer de chiffres ou retours terrain
```

---

## Base de données Supabase

### Table `article_ideas`

```sql
create table article_ideas (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  source_url text not null,
  source_lang text default 'EN',
  source_name text,          -- "Reddit r/Surveying", "Google News", etc.
  excerpt text,              -- description RSS
  status text default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### Sécurité Supabase

- Row Level Security (RLS) activé
- Seul le service role (côté serveur Astro) peut lire/écrire
- Pas d'accès public

---

## Variables d'environnement nécessaires

Déjà présentes dans `.env` pour Supabase (Phase 5) :

```bash
SUPABASE_URL=               # déjà configuré
SUPABASE_ANON_KEY=          # déjà configuré
SUPABASE_SERVICE_ROLE_KEY=  # déjà configuré
```

Aucune nouvelle clé API nécessaire.

---

## Flux utilisateur complet

```
1. Loïc ouvre /admin/studio
2. Onglet Veille → les flux RSS se chargent
3. Il lit les articles, repère un sujet intéressant
4. "Sauvegarder" → sujet ajouté dans Mes sujets (statut: pending)
5. "Préparer le prompt" → modale s'ouvre avec Étape 1
6. Loïc copie le prompt, le colle dans Claude.ai
7. Claude.ai lui donne le résumé + l'angle
8. Si l'angle est bon → il revient, clique "Passer à la rédaction"
9. Copie le prompt Étape 2 → le colle dans Claude.ai
10. Claude.ai génère le brouillon MDX complet
11. Loïc copie le MDX → le colle dans Decap CMS
12. Il finalise avec son vécu terrain, publie
13. Il revient dans Mes sujets → change le statut en "published"
```

---

## Sous-phases d'implémentation

| Sous-phase | Livrable                                         | Effort estimé |
| ---------- | ------------------------------------------------ | ------------- |
| 7.1        | Setup Supabase table `article_ideas`             | 0.5 jour      |
| 7.2        | Page `/admin/studio` squelette + auth Clerk      | 0.5 jour      |
| 7.3        | Onglet Veille — fetch RSS + affichage            | 1 jour        |
| 7.4        | Bouton "Préparer le prompt" — modale 2 étapes    | 0.5 jour      |
| 7.5        | Onglet Mes sujets — dashboard Supabase + statuts | 1 jour        |

**Total estimé : ~3.5 jours**

---

## Ce qui n'est PAS dans ce scope

- ❌ Cron automatique (Agent 1 veille automatisée)
- ❌ API Anthropic intégrée dans le site
- ❌ Agent 3 repurposing (LinkedIn, newsletter) — prévu Phase 7.5+ si besoin
- ❌ Système de délégation (rôles Clerk) — prévu plus tard
- ❌ Publication automatique — Loïc reste le seul à publier, toujours via Decap CMS

---

## Garde-fous éditoriaux

1. **Jamais de publication automatique** — tout passe par Decap CMS et Loïc
2. **Jamais inventer** — les marqueurs `[DONNÉE TERRAIN LOÏC]` sont dans le prompt
3. **Voix Topolia toujours** — tutoiement et style direct dans le prompt système
4. **Status draft obligatoire** — rappelé dans le prompt étape 2
