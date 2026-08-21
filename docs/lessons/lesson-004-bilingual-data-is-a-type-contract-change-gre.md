---
id: lesson-004-bilingual-data-is-a-type-contract-change-gre
type: lesson
status: active
created: "2026-07-09"
owner: manu
tags: [web, i18n, typescript]
---

# Bilingual data is a type-contract change — grep ALL consumers, not the obvious ones

**Context**: WEB-026 then WEB-012 — restructuring `portfolio.ts` (and later the landing section data) from a flat single-language shape into per-language `{ en, es }` objects read through a `localize(item, locale)` helper.

**Problem**: Changing a data module's shape from `{ title, description }` to `{ en: {…}, es: {…} }` is a breaking type change for *every* importer. The estimate assumed ~2 consumers; there were actually **5** — `index.astro`, `projects.astro`, both `tags/[tag].astro` pages, and the `ProjectCard` component. The missed call sites don't fail at the edit site; they surface downstream as `astro check` type errors or wrong-language renders.

**Solution**: Before touching the shape, grep all of `src/` for every import of the module *and* every field access (`project.title`, `.description`, …), then migrate all sites in the same PR. `astro check` (0/0/0) is the backstop that proves no consumer was left on the old shape.

**Rule**: Treat a data-module shape change as a public-contract change: enumerate every consumer by grep first (imports + field accesses), migrate them atomically, and let the type-checker prove completeness. "It's just a data file" undercounts the blast radius.
