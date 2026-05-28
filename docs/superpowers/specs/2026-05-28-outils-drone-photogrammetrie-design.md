# Spec — Page "Outils recommandés pour la photogrammétrie drone"

**Date :** 2026-05-28
**Statut :** validé par Loïc
**URL cible :** `/ressources/outils-drone-photogrammetrie`

---

## Contexte & objectif

Créer une page statique unique listant les outils recommandés pour les dronistes en photogrammétrie. La page sert deux objectifs :

1. **Monétisation** — liens d'affiliation Amazon Associates (futur) et programmes directs éditeurs logiciels (Metashape, Pix4D, RealityCapture) avec UTM tracking dès maintenant.
2. **Positionnement SEO et DJI Partnership** — renforcer la crédibilité de topolia.fr comme ressource de référence francophone sur le sujet.

**Ce que cette page n'est PAS :** une boutique, une liste exhaustive, un contenu générique. Uniquement du matériel que Loïc utilise ou a testé.

---

## Approche retenue

**Option C — Page simple avec UTM tracking.**

Liens directs vers Amazon ou sites éditeurs, enrichis de paramètres UTM pour suivre les clics dans Cloudflare/Plausible sans infrastructure custom. Quand le trafic dépasse ~50 visiteurs/mois, migration vers `/go/[slug]` (déjà prévu dans BRIEF.md §19).

Pas de compte Amazon Associates au démarrage — liens placeholders, activation quand le compte est créé.

---

## Structure de la page

```
/ressources/outils-drone-photogrammetrie
│
├── [AffiliateDisclaimer] — bandeau transparence (haut de page)
├── Intro — 2-3 phrases contexte (matériel testé terrain)
│
├── Section 1 : Accessoires terrain
│   └── [ProductCard] × N  (mires GCP, jalons, targets, carnets…)
│
├── Section 2 : Informatique & stockage
│   └── [ProductCard] × N  (SSD, RAM, GPU)
│
├── Section 3 : Logiciels photogrammétrie
│   └── [ProductCard] × N  (Metashape, Pix4D, RealityCapture)
│
└── Note de bas de page — méthode de sélection
```

Sections futures (non incluses en v1) :

- Livres de référence
- Formations (produites par Loïc lui-même — produit distinct, pas affiliation)

---

## Composants à créer

### `src/components/ressources/AffiliateDisclaimer.astro`

Bandeau réutilisable, discret. Texte :

> _"Certains liens de cette page sont des liens d'affiliation. Si tu achètes via ces liens, je touche une petite commission — sans surcoût pour toi. C'est ce qui me permet de maintenir le site, financer les tests matériel et continuer à produire du contenu gratuit."_

Props : aucune. Réutilisable dans les articles futurs.

### `src/components/ressources/ProductCard.astro`

```typescript
interface Props {
  name: string;
  description: string;
  price?: string; // ex: "~89 €" — indicatif
  imageUrl?: string;
  affiliateUrl: string; // URL de base (UTM ajoutés automatiquement)
  source: 'amazon' | 'editeur' | 'autre';
  isPlaceholder?: boolean; // true = compte affilié pas encore actif
}
```

Layout carte :

```
[Image]   Nom du produit            [Badge : Amazon | Éditeur]
          Description courte (pourquoi recommandé, 1-2 phrases)
          Prix indicatif : ~XX €
          [Voir sur Amazon →] ou [Site officiel →]
```

### `src/pages/ressources/outils-drone-photogrammetrie.astro`

Page Astro (pas MDX). Importe `BaseLayout`, `AffiliateDisclaimer`, `ProductCard`.

SEO :

- `<title>` : "Outils pour la photogrammétrie drone — recommandations testées | Topolia"
- `description` : "Accessoires terrain, matériel informatique et logiciels testés par un géomètre-expert. Mes recommandations pour les dronistes en photogrammétrie."

---

## Contenu v1 (à compléter par Loïc)

Loïc renseigne uniquement les produits qu'il utilise réellement.

**Accessoires terrain** — mires GCP, jalons, targets au sol, carnets waterproof
**Informatique & stockage** — SSD NVMe externe, RAM 64 Go, GPU pour Metashape
**Logiciels** — Agisoft Metashape, Pix4D, RealityCapture (liens éditeurs directs)

---

## UTM tracking — convention

```
utm_source=topolia
utm_medium=ressources
utm_campaign=outils-drone
utm_content=[nom-produit-slug]
```

Exemple :

```
https://www.amazon.fr/dp/XXXXX?utm_source=topolia&utm_medium=ressources&utm_campaign=outils-drone&utm_content=mires-gcp
```

---

## Navigation

Ajouter un lien vers cette page dans le menu principal, sous une entrée "Ressources" (à créer si absente).

---

## Hors scope (phases suivantes)

- Système `/go/[slug]` — BRIEF.md §19, quand trafic le justifie
- Champs `affiliateLinks` dans le schema Content Layer
- Page `/partenaires`
- Amazon Associates tag — chercher `PLACEHOLDER_TAG` dans les composants quand compte créé
- Formations Loïc — spec séparé
