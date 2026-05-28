# Page Outils Drone Photogrammétrie — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Créer la page `/ressources/outils-drone-photogrammetrie` avec 2 composants réutilisables (bandeau affiliation + carte produit), 3 sections de produits avec UTM tracking, et un lien dans la navigation principale.

**Architecture:** Page Astro statique (pas MDX) utilisant `BaseLayout`. Deux nouveaux composants dans `src/components/ressources/`. Les liens produits embarquent des UTM automatiques. Les produits sont hardcodés dans la page v1 — pas de collection de contenu.

**Tech Stack:** Astro 6, TypeScript strict, CSS custom variables (pas Tailwind), `BaseLayout` existant.

---

## Fichiers à créer ou modifier

| Action   | Fichier |
|----------|---------|
| Créer    | `src/components/ressources/AffiliateDisclaimer.astro` |
| Créer    | `src/components/ressources/ProductCard.astro` |
| Créer    | `src/pages/ressources/outils-drone-photogrammetrie.astro` |
| Modifier | `src/components/Nav.astro` (ajouter entrée "Ressources") |

---

## Task 1 : Composant `AffiliateDisclaimer`

**Files:**
- Create: `src/components/ressources/AffiliateDisclaimer.astro`

- [ ] **Step 1 : Créer le composant**

Créer `src/components/ressources/AffiliateDisclaimer.astro` avec ce contenu exact :

```astro
---
// Bandeau de transparence affiliation — sans props, contenu fixe.
// Réutilisable dans les articles futurs via import direct.
---

<aside class="affiliate-disclaimer">
  <svg
    class="affiliate-disclaimer__icon"
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
  <p>
    Certains liens de cette page sont des <strong>liens d'affiliation</strong>. Si tu achètes
    via ces liens, je touche une petite commission — sans surcoût pour toi. C'est ce qui me
    permet de maintenir le site, financer les tests matériel et continuer à produire du contenu
    gratuit.
  </p>
</aside>

<style>
  .affiliate-disclaimer {
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
    padding: 0.875rem 1rem;
    background: var(--surface-alt, #f5f5f4);
    border-left: 3px solid var(--accent);
    border-radius: 0 6px 6px 0;
    margin-bottom: 2rem;
  }

  .affiliate-disclaimer__icon {
    flex-shrink: 0;
    margin-top: 2px;
    color: var(--accent);
  }

  .affiliate-disclaimer p {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.5;
    color: var(--ink-2);
  }

  .affiliate-disclaimer strong {
    color: var(--ink);
  }
</style>
```

- [ ] **Step 2 : Vérifier la compilation**

```powershell
cd C:\dev\topolia
npm run build
```

Attendu : build réussi, aucune erreur TypeScript. Si erreur → corriger avant de continuer.

- [ ] **Step 3 : Commiter**

```powershell
git add src/components/ressources/AffiliateDisclaimer.astro
git commit -m "feat(ressources): add AffiliateDisclaimer component"
```

---

## Task 2 : Composant `ProductCard`

**Files:**
- Create: `src/components/ressources/ProductCard.astro`

- [ ] **Step 1 : Créer le composant**

Créer `src/components/ressources/ProductCard.astro` :

```astro
---
interface Props {
  name: string;
  description: string;
  price?: string;        // ex: "~89 €" — indicatif, pas contractuel
  imageUrl?: string;
  affiliateUrl: string;  // URL de base sans UTM
  utmContent: string;    // slug produit pour utm_content, ex: "mires-gcp"
  source: 'amazon' | 'editeur' | 'autre';
  isPlaceholder?: boolean; // true = lien non encore affilié
}

const {
  name,
  description,
  price,
  imageUrl,
  affiliateUrl,
  utmContent,
  source,
  isPlaceholder = false,
} = Astro.props;

// Construction de l'URL avec UTM — tracké dans Cloudflare/Plausible.
// Quand le compte Amazon Associates sera actif, remplacer PLACEHOLDER_TAG
// dans affiliateUrl par le vrai tag (ex: &tag=topolia-21).
const separator = affiliateUrl.includes('?') ? '&' : '?';
const trackedUrl =
  `${affiliateUrl}${separator}` +
  `utm_source=topolia&utm_medium=ressources&utm_campaign=outils-drone&utm_content=${utmContent}`;

const sourceLabel: Record<Props['source'], string> = {
  amazon: 'Amazon',
  editeur: 'Site officiel',
  autre: 'Lien externe',
};

const ctaLabel: Record<Props['source'], string> = {
  amazon: 'Voir sur Amazon',
  editeur: 'Voir sur le site officiel',
  autre: 'Voir le produit',
};
---

<article class="product-card">
  {
    imageUrl && (
      <div class="product-card__image-wrap">
        <img src={imageUrl} alt={name} class="product-card__image" loading="lazy" />
      </div>
    )
  }
  <div class="product-card__body">
    <div class="product-card__header">
      <h3 class="product-card__name">{name}</h3>
      <span class={`product-card__badge product-card__badge--${source}`}>
        {sourceLabel[source]}
      </span>
    </div>
    <p class="product-card__description">{description}</p>
    <div class="product-card__footer">
      {price && <span class="product-card__price">{price}</span>}
      <a
        href={trackedUrl}
        target="_blank"
        rel="noopener noreferrer nofollow"
        class="product-card__cta"
        aria-label={`${ctaLabel[source]} — ${name}`}
      >
        {ctaLabel[source]} →
      </a>
    </div>
    {
      isPlaceholder && (
        <p class="product-card__placeholder-note">
          Lien non affilié pour l'instant — mis à jour dès l'activation du programme.
        </p>
      )
    }
  </div>
</article>

<style>
  .product-card {
    display: flex;
    gap: 1rem;
    padding: 1.25rem;
    background: var(--surface);
    border: 1px solid var(--hairline);
    border-radius: 10px;
    transition: box-shadow 0.2s ease;
  }

  .product-card:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }

  .product-card__image-wrap {
    flex-shrink: 0;
    width: 80px;
    height: 80px;
    border-radius: 6px;
    overflow: hidden;
    background: var(--surface-alt, #f5f5f4);
  }

  .product-card__image {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .product-card__body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .product-card__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .product-card__name {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--ink);
    line-height: 1.3;
  }

  .product-card__badge {
    flex-shrink: 0;
    font-size: 0.7rem;
    font-family: var(--mono);
    font-weight: 500;
    padding: 2px 7px;
    border-radius: 99px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .product-card__badge--amazon {
    background: #fff3cd;
    color: #856404;
  }

  .product-card__badge--editeur {
    background: #d1e7dd;
    color: #0a3622;
  }

  .product-card__badge--autre {
    background: var(--surface-alt, #f5f5f4);
    color: var(--ink-2);
  }

  .product-card__description {
    margin: 0;
    font-size: 0.9rem;
    color: var(--ink-2);
    line-height: 1.5;
  }

  .product-card__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 0.25rem;
  }

  .product-card__price {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--ink);
  }

  .product-card__cta {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--accent);
    text-decoration: none;
    white-space: nowrap;
  }

  .product-card__cta:hover {
    text-decoration: underline;
  }

  .product-card__placeholder-note {
    margin: 0;
    font-size: 0.75rem;
    color: var(--ink-2);
    font-style: italic;
    opacity: 0.7;
  }
</style>
```

- [ ] **Step 2 : Vérifier la compilation**

```powershell
npm run build
```

Attendu : build réussi. Si erreur TypeScript sur les props → vérifier que les types correspondent.

- [ ] **Step 3 : Commiter**

```powershell
git add src/components/ressources/ProductCard.astro
git commit -m "feat(ressources): add ProductCard component with UTM tracking"
```

---

## Task 3 : Page `/ressources/outils-drone-photogrammetrie`

**Files:**
- Create: `src/pages/ressources/outils-drone-photogrammetrie.astro`

- [ ] **Step 1 : Créer le dossier et la page**

Créer `src/pages/ressources/outils-drone-photogrammetrie.astro` :

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import AffiliateDisclaimer from '../../components/ressources/AffiliateDisclaimer.astro';
import ProductCard from '../../components/ressources/ProductCard.astro';

// Données produits — à compléter par Loïc avec ce qu'il utilise vraiment.
// isPlaceholder: true = lien pas encore affilié, affiché avec note visuelle.

const accessoiresTerrain = [
  {
    name: 'Mires GCP — targets de calage au sol',
    description:
      'Indispensables pour caler le nuage de points et le modèle 3D sur des coordonnées réelles. Je les utilise systématiquement sur chaque chantier drone.',
    price: '~35 €',
    affiliateUrl: 'https://www.amazon.fr/s?k=mires+gcp+drone+photogrammetrie',
    utmContent: 'mires-gcp',
    source: 'amazon' as const,
    isPlaceholder: true,
  },
  {
    name: 'Jalons topographiques',
    description:
      'Pour matérialiser les points de contrôle sur le terrain avant le vol. Pliables et légers à transporter.',
    price: '~25 €',
    affiliateUrl: 'https://www.amazon.fr/s?k=jalon+topographique',
    utmContent: 'jalons-topo',
    source: 'amazon' as const,
    isPlaceholder: true,
  },
  {
    name: 'Carnet de terrain waterproof',
    description:
      'Pour noter les coordonnées des GCP sur le terrain, même par temps pluvieux. Rite In The Rain ou équivalent.',
    price: '~15 €',
    affiliateUrl: 'https://www.amazon.fr/s?k=carnet+terrain+waterproof',
    utmContent: 'carnet-waterproof',
    source: 'amazon' as const,
    isPlaceholder: true,
  },
];

const informatique = [
  {
    name: 'SSD externe NVMe — transfert rapide',
    description:
      'Indispensable pour déplacer les fichiers LAS/E57 entre le PC de terrain et la machine de traitement. Préférer 1 To minimum, USB 3.2 Gen2.',
    price: '~80 €',
    affiliateUrl: 'https://www.amazon.fr/s?k=ssd+externe+nvme+1to+usb+3.2',
    utmContent: 'ssd-externe-nvme',
    source: 'amazon' as const,
    isPlaceholder: true,
  },
  {
    name: 'RAM 64 Go DDR5 — traitement Metashape',
    description:
      'Metashape et Pix4D sont très gourmands en RAM lors du traitement dense. 64 Go est le minimum confortable pour des projets > 500 photos.',
    price: '~140 €',
    affiliateUrl: 'https://www.amazon.fr/s?k=ram+64go+ddr5+pc',
    utmContent: 'ram-64go',
    source: 'amazon' as const,
    isPlaceholder: true,
  },
];

const logiciels = [
  {
    name: 'Agisoft Metashape Professional',
    description:
      'Mon logiciel de référence pour la photogrammétrie. Traitement dense, nuage de points, MNT, orthophoto. Version Professional indispensable pour l\'export professionnel.',
    price: '~3 499 €',
    affiliateUrl: 'https://www.agisoft.com/buy/',
    utmContent: 'metashape-pro',
    source: 'editeur' as const,
    isPlaceholder: true,
  },
  {
    name: 'Pix4Dmatic',
    description:
      'Alternative à Metashape, particulièrement adapté aux grands chantiers en lot. Abonnement mensuel ou annuel.',
    price: 'Sur devis',
    affiliateUrl: 'https://www.pix4d.com/product/pix4dmatic/',
    utmContent: 'pix4dmatic',
    source: 'editeur' as const,
    isPlaceholder: true,
  },
  {
    name: 'RealityCapture',
    description:
      'Le plus rapide des trois pour les grands nuages. Modèle à la consommation (pay-per-input) depuis le rachat par Epic Games — intéressant pour les chantiers ponctuels.',
    price: 'Pay-per-input',
    affiliateUrl: 'https://www.capturingreality.com/',
    utmContent: 'reality-capture',
    source: 'editeur' as const,
    isPlaceholder: true,
  },
];
---

<BaseLayout
  title="Outils pour la photogrammétrie drone — recommandations testées"
  description="Accessoires terrain, matériel informatique et logiciels testés par un géomètre-expert. Mes recommandations pour les dronistes en photogrammétrie."
>
  <main class="ressources-page">
    <div class="ressources-page__container">

      <header class="ressources-page__header">
        <h1 class="ressources-page__title">Outils recommandés pour la photogrammétrie drone</h1>
        <p class="ressources-page__intro">
          Ce sont les outils que j'utilise ou que j'ai testés dans mon activité de géomètre-expert.
          Pas de liste exhaustive — uniquement ce qui m'a prouvé son utilité sur le terrain.
        </p>
      </header>

      <AffiliateDisclaimer />

      <section class="ressources-section">
        <h2 class="ressources-section__title">Accessoires terrain</h2>
        <p class="ressources-section__subtitle">
          Le matériel de terrain pour préparer et cadrer un vol photogrammétrique dans les règles.
        </p>
        <div class="ressources-section__grid">
          {accessoiresTerrain.map((p) => <ProductCard {...p} />)}
        </div>
      </section>

      <section class="ressources-section">
        <h2 class="ressources-section__title">Informatique & stockage</h2>
        <p class="ressources-section__subtitle">
          La photogrammétrie dense est CPU et RAM intensive — voici ce qui fait la différence.
        </p>
        <div class="ressources-section__grid">
          {informatique.map((p) => <ProductCard {...p} />)}
        </div>
      </section>

      <section class="ressources-section">
        <h2 class="ressources-section__title">Logiciels photogrammétrie</h2>
        <p class="ressources-section__subtitle">
          Les trois références du marché. J'utilise principalement Metashape au quotidien.
        </p>
        <div class="ressources-section__grid">
          {logiciels.map((p) => <ProductCard {...p} />)}
        </div>
      </section>

      <footer class="ressources-page__footer">
        <p>
          <strong>Comment je sélectionne ces outils :</strong> je ne liste que ce que j'utilise
          dans mon activité ou que j'ai eu l'occasion de tester sérieusement. Les prix sont
          indicatifs et peuvent varier. Pour toute question sur un outil, tu peux me contacter
          directement.
        </p>
      </footer>

    </div>
  </main>
</BaseLayout>

<style>
  .ressources-page {
    padding: 3rem 1.5rem 5rem;
  }

  .ressources-page__container {
    max-width: var(--content-max, 800px);
    margin: 0 auto;
  }

  .ressources-page__header {
    margin-bottom: 2rem;
  }

  .ressources-page__title {
    font-size: clamp(1.6rem, 4vw, 2.4rem);
    font-weight: 700;
    color: var(--ink);
    line-height: 1.2;
    margin: 0 0 1rem;
  }

  .ressources-page__intro {
    font-size: 1.05rem;
    color: var(--ink-2);
    line-height: 1.6;
    margin: 0;
  }

  .ressources-section {
    margin-bottom: 3rem;
  }

  .ressources-section__title {
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--ink);
    margin: 0 0 0.4rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid var(--accent);
    display: inline-block;
  }

  .ressources-section__subtitle {
    font-size: 0.9rem;
    color: var(--ink-2);
    margin: 0.5rem 0 1.25rem;
  }

  .ressources-section__grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .ressources-page__footer {
    margin-top: 3rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--hairline);
    font-size: 0.875rem;
    color: var(--ink-2);
    line-height: 1.6;
  }

  .ressources-page__footer strong {
    color: var(--ink);
  }
</style>
```

- [ ] **Step 2 : Lancer le dev server et vérifier visuellement**

```powershell
npm run dev
```

Ouvrir dans le navigateur : `http://localhost:4321/ressources/outils-drone-photogrammetrie`

Vérifier :
- Le bandeau disclaimer s'affiche en haut avec la bordure accent
- Les 3 sections apparaissent avec leurs titres
- Les ProductCard s'affichent avec badge, description, prix, lien CTA
- Les badges "Amazon" sont jaunes, "Éditeur" sont verts
- Les cartes sans image ne laissent pas de trou

- [ ] **Step 3 : Vérifier le build final**

```powershell
npm run build
```

Attendu : build réussi, aucune erreur TypeScript.

- [ ] **Step 4 : Commiter**

```powershell
git add src/pages/ressources/outils-drone-photogrammetrie.astro
git commit -m "feat(ressources): add outils drone photogrammétrie page with UTM links"
```

---

## Task 4 : Ajouter "Ressources" dans la navigation

**Files:**
- Modify: `src/components/Nav.astro`

- [ ] **Step 1 : Localiser le tableau `navLinks` dans Nav.astro**

Ouvrir `src/components/Nav.astro`. Trouver le tableau :

```javascript
const navLinks = [
  { href: '/articles/', label: 'Articles' },
  { href: '/glossaire/', label: 'Glossaire' },
  { href: '/chantiers/', label: 'Chantiers' },
  { href: '/minute-topo/', label: 'Minute topo' },
  { href: '/a-propos/', label: 'À propos' },
];
```

- [ ] **Step 2 : Ajouter l'entrée Ressources**

Remplacer ce tableau par :

```javascript
const navLinks = [
  { href: '/articles/', label: 'Articles' },
  { href: '/glossaire/', label: 'Glossaire' },
  { href: '/chantiers/', label: 'Chantiers' },
  { href: '/minute-topo/', label: 'Minute topo' },
  { href: '/ressources/outils-drone-photogrammetrie', label: 'Ressources' },
  { href: '/a-propos/', label: 'À propos' },
];
```

- [ ] **Step 3 : Vérifier visuellement dans le dev server**

Si le dev server tourne encore :

Vérifier sur n'importe quelle page que "Ressources" apparaît dans la barre de nav, entre "Minute topo" et "À propos". Cliquer dessus — doit amener sur la page outils. L'état actif (surligné) doit s'activer quand on est sur `/ressources/...`.

- [ ] **Step 4 : Build final**

```powershell
npm run build
```

Attendu : build réussi.

- [ ] **Step 5 : Commiter**

```powershell
git add src/components/Nav.astro
git commit -m "feat(nav): add Ressources link to main navigation"
```

---

## Après l'implémentation — checklist Loïc

Une fois la page en ligne sur Netlify :

- [ ] Remplacer les URLs Amazon de recherche (`/s?k=...`) par les URLs de produits spécifiques que tu utilises vraiment
- [ ] Quand le compte Amazon Associates est actif : chercher `PLACEHOLDER_TAG` dans `ProductCard.astro` et ajouter le tag affilié dans chaque `affiliateUrl` Amazon (`&tag=TON-TAG-21`)
- [ ] Mettre `isPlaceholder: false` sur les liens où l'affiliation est active
- [ ] Contacter Agisoft pour le programme revendeur (BRIEF.md §19 — 15-20% commission)

---

## Notes techniques

**UTM content unique par produit** : le `utmContent` de chaque ProductCard est un slug unique (ex: `mires-gcp`, `ssd-externe-nvme`). Dans Plausible ou Cloudflare, filtrer sur `utm_campaign=outils-drone` pour voir quel produit génère le plus de clics.

**`rel="noopener noreferrer nofollow"`** : le `nofollow` est obligatoire sur les liens affiliés pour respecter les guidelines Google et éviter une pénalité SEO.

**Evolution `/go/[slug]`** : quand le trafic justifie, remplacer `affiliateUrl + UTM` dans `ProductCard` par `/go/${utmContent}` et créer la page de redirection tracée. Aucun changement sur la page principale.
