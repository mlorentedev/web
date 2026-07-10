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

## Implementation — increment 3 (ES parity + componentization)

- [x] Extract 4 shared bilingual section components: `ProjectsSection` `[ 02 ]`, `StackSection` `[ 03 ]`, `CommunitySection` `[ 04 ]`, `LatestNotesSection` `[ 05 ]` (stack/community labels bilingual; notes filtered per lang with `notes.empty` fallback).
- [x] Rewrite `index.astro` (EN) to compose Hero + band + timeline + the 4 sections — frontmatter reduced to `lang` only (removed inline stack/notes/duplicated markup).
- [x] Rewrite `es/index.astro` to compose the same components → structural parity, ES localized.
- [x] Preserve the ES newsletter essay: `git mv es-home.mdx es-newsletter.mdx` (`page: newsletter`) + new `es/newsletter.astro` route at `/es/newsletter`.
- [ ] KNOWN: `en-home.mdx` (empty, `page: home`) now orphaned — left in place (not deleted; empty stub), flagged for a future decision.

## Closing

- [x] `astro check` 0 errors (37 files)
- [x] `astro build` 75 pages (+1 = `/es/newsletter`); parity 00–05 on both landings
- [x] `verification.md` filled
- [ ] PR opened referencing this spec (increments 1 #72 + 2 #74 merged; increment 3 = this PR)

## Machine-readable features

See `features.json` (WEB-012-f1..f6). Pass-state gating: only the review harness flips `pending` → `passing`.
