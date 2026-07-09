---
tags: [spec, tasks]
created: "2026-07-09"
---

# Tasks - WEB-012 (increment 1: credibility band)

> No unit-test harness (static Astro site; maintainer is the review harness). Verification = `astro check` + `astro build` + grep `dist/`.

## Setup

- [x] Branch created from main: `feat/WEB-012`
- [x] `proposal.md` complete, scope narrowed to the band increment
- [x] No open questions blocking (design locked; metrics decided)

## Implementation

- [x] [AC1][AC3] Create `src/components/CredibilityBand.astro`: props `{ lang }`; derives `projects.length` + published note count (language-agnostic); renders `[ 00 / … ]` label + 4 stats (40 services, 67–82% tokens, 8 projects, 15 notes).
- [x] Add `credibility.*` i18n keys to `src/i18n/ui.ts` (EN + ES): heading + 4 stat labels.
- [x] [AC2] Place `<CredibilityBand lang={lang} />` on `index.astro` after the hero, before `[ 01 / What I build ]`.
- [x] [AC2] Place `<CredibilityBand lang="es" />` on `es/index.astro` after `<Hero />`.
- [x] Refactor: confirmed section numbering reads 00 → 01 → 02 on the EN landing.

## Closing

- [x] `astro check` 0 errors
- [x] `astro build` 74 pages; band in `dist/index.html` + `dist/es/index.html`
- [x] `verification.md` filled
- [ ] PR opened referencing this spec

## Machine-readable features

See `features.json` (WEB-012-f1..f4). Pass-state gating: only the review harness flips `pending` → `passing`.
