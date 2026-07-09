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

## Implementation — increment 2 (experience timeline)

- [x] Create `src/data/experience.ts`: bilingual `Experience` + `localizeExperience()` helper; 4 roles condensed from `resume/data/cv.yml`.
- [x] Create `src/components/Timeline.astro`: props `{ lang }`; renders `[ 01 / My path | Mi camino ]` + 4 roles (period · role · company · location + highlight).
- [x] Add i18n keys `home.experience` + `experience.present` (EN + ES).
- [x] Place `<Timeline lang=… />` after the band on `index.astro` and `es/index.astro`; renumber sections (projects 01→02, stack 02→03, community 03→04, notes 04→05).

## Closing

- [x] `astro check` 0 errors (32 files)
- [x] `astro build` 74 pages; band + timeline in `dist/index.html` + `dist/es/index.html`
- [x] `verification.md` filled
- [ ] PR opened referencing this spec (increment 1 = #72 merged; increment 2 = this PR)

## Machine-readable features

See `features.json` (WEB-012-f1..f6). Pass-state gating: only the review harness flips `pending` → `passing`.
