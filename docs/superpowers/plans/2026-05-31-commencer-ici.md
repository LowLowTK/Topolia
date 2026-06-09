# Page Commencer Ici Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `/commencer-ici/` guide page that routes beginners and field pros to the right Topolia content, with sourced editorial copy, glossary links, SEO FAQ, and missing glossary entries.

**Architecture:** Add one static Astro page that uses existing content collections and layout components. Add focused MDX glossary entries for technical terms introduced by the page. Update the main navigation with a short "Commencer" link.

**Tech Stack:** Astro 6, Astro content collections, MDX glossary files, existing CSS variables and components.

---

## Files

| Action | File | Responsibility |
|---|---|---|
| Create | `src/pages/commencer-ici.astro` | Main guide page and SEO FAQ |
| Create | `src/content/glossaire/gsd.mdx` | Define GSD for drone photogrammetry |
| Create | `src/content/glossaire/ppk.mdx` | Define PPK positioning |
| Create | `src/content/glossaire/las.mdx` | Define LAS point cloud format |
| Create | `src/content/glossaire/laz.mdx` | Define LAZ compressed LAS format |
| Create | `src/content/glossaire/e57.mdx` | Define E57 scan exchange format |
| Create | `src/content/glossaire/orthophoto.mdx` | Define orthophoto |
| Create | `src/content/glossaire/maillage.mdx` | Define mesh/maillage |
| Create | `src/content/glossaire/classification.mdx` | Define point cloud classification |
| Create | `src/content/glossaire/georeferencement.mdx` | Define georeferencing |
| Modify | `src/components/Nav.astro` | Add "Commencer" navigation item |

---

## Task 1: Add Missing Glossary Entries

**Files:**
- Create: `src/content/glossaire/gsd.mdx`
- Create: `src/content/glossaire/ppk.mdx`
- Create: `src/content/glossaire/las.mdx`
- Create: `src/content/glossaire/laz.mdx`
- Create: `src/content/glossaire/e57.mdx`
- Create: `src/content/glossaire/orthophoto.mdx`
- Create: `src/content/glossaire/maillage.mdx`
- Create: `src/content/glossaire/classification.mdx`
- Create: `src/content/glossaire/georeferencement.mdx`

- [ ] **Step 1: Create concise, field-oriented MDX glossary files**

Each file must use the existing glossary schema and explain the term in human language.

- [ ] **Step 2: Run content validation**

Run: `npm run build`

Expected: Astro accepts every glossary entry.

- [ ] **Step 3: Commit**

Run:

```bash
git add src/content/glossaire
git commit -m "content: add glossary terms for commencer ici"
```

## Task 2: Create `/commencer-ici/` Page

**Files:**
- Create: `src/pages/commencer-ici.astro`

- [ ] **Step 1: Build the static page**

Create a page using `BaseLayout`, existing content collections, and editorial sections from the design spec.

- [ ] **Step 2: Link technical terms**

Every central term used in the copy must link to an existing or newly created glossary page.

- [ ] **Step 3: Add FAQ structured content in-page**

Add visible FAQ copy at the bottom. Keep answers short and useful.

- [ ] **Step 4: Run build**

Run: `npm run build`

Expected: page renders and no content collection errors.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/pages/commencer-ici.astro
git commit -m "feat: add commencer ici guide page"
```

## Task 3: Add Navigation Link

**Files:**
- Modify: `src/components/Nav.astro`

- [ ] **Step 1: Add a compact nav item**

Add `{ href: '/commencer-ici/', label: 'Commencer' }` near the start of `navLinks`.

- [ ] **Step 2: Run build**

Run: `npm run build`

Expected: build succeeds.

- [ ] **Step 3: Commit**

Run:

```bash
git add src/components/Nav.astro
git commit -m "feat: add commencer ici to navigation"
```

## Task 4: Local Preview

**Files:**
- No source file changes expected.

- [ ] **Step 1: Start dev server**

Run: `npm run dev -- --host 127.0.0.1`

Expected: local Astro URL printed by the dev server.

- [ ] **Step 2: Open page**

Open `/commencer-ici/` in the in-app browser or provide the URL.

- [ ] **Step 3: Visual QA**

Check desktop and mobile width for readability, wrapping, spacing and broken links.
