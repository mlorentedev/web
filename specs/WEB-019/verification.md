---
tags: [spec, verification, templates]
created: "2026-07-10"
---

# Verification - WEB-019

## Evidence

Map every acceptance criterion from `proposal.md` to concrete proof. Filled per increment as PRs land.

**Increment 1 — baked metrics:**
- [x] AC1 (component, ≥3 GitHub metrics + hive, both locales) -> `f1` PASS. `ProofSurface.astro`
      renders `[ 06 / Open source ]` with 3 `data-stat` (repos/stars/hive) + a `data-languages` tag
      list; `data-proof` present in `dist/index.html` and `dist/es/index.html`.
- [x] AC2 (build-time baked, no client fetch to see numbers) -> `f1` PASS. Live build baked real
      values (21 repos · 14 stars · 8 on Hive; langs Python·Go·MDX·JavaScript). ES labels localized
      ("Código abierto", "estrellas · Hive").
- [x] AC3 (fetch-failure fallback, build completes, check 0/0/0) -> `f2` PASS. Forced an unreachable
      API host (`api.github.invalid`): `astro build` exited 0, section still baked from `FALLBACK`
      (21/14/8). Source reverted. `astro check` 0/0/0 (39 files).

**Increment 2 — live hydration:** not started
**Increment 3 — heatmap:** not started

## Test status

- Type check: `npx astro check` -> **0 errors, 0 warnings, 0 hints** (39 files).
- Build: `npx astro build` -> **75 pages, Complete**.
- Manual smoke: forced build-time fetch failure (unreachable API) -> build completed on `FALLBACK`;
  `dist/{index,es/index}.html` both contain `data-proof` + the `[ 06 ]` "Open source"/"Código abierto"
  heading. Numbers identical on both locales, only labels translate.
- No regressions: existing `[ 00..05 ]` sections + the `ghchart` heatmap in `[ 02 ]` unchanged.

## Decisions made during implementation

- **Single API call, non-fork repos.** All metrics derive from one `GET /users/{u}/repos?per_page=100`
  call (repo count, stars, languages, Hive stars); dropped the separate `/users/{u}` call. Forks are
  filtered out so "public repos" reflects authored work (21, not the raw 22).
- **`deriveTopLanguages` is by-count, not by-bytes.** By-count needs no extra API calls; by-bytes would
  cost N `/languages` calls against the 60 req/hr unauth budget. Ships `Python·Go·MDX·JavaScript`.
- **"hive metric" = Hive repo stargazers** (flagship highlight), GitHub-sourced and distinct from the
  `[ 00 ]` band's "67–82% token reduction" claim — resolves the proposal's open question for inc. 1.
- **FALLBACK seeded from the live API (2026-07-10)** so an offline build shows honest numbers, not zeros.
- **The existing `ghchart` heatmap in `[ 02 ]` is left in place** — relocating/consolidating it into
  `[ 06 ]` is increment 3, tracked, not silent debt.

## Promotion candidates

- [ ] Lesson for `docs/lessons.md`? <tbd — candidate: build-time external fetch needs a committed/hardcoded fallback or a flaky API breaks deploys>
- [ ] ADR-worthy? <tbd — build-time bake + client-side progressive-enhancement hydration as the "no new infra" proof-surface pattern may be worth an in-repo ADR if it recurs for PS3+>
- [ ] Pattern candidate? <tbd>

## Archive checklist

- [ ] `proposal.md` frontmatter set to `status: archived` (only when ALL of #46 is done)
- [ ] Folder moved: `specs/WEB-019/` -> `specs/archive/WEB-019/`
- [ ] Bitácora #46 closed with PR links (ADR-018)
- [ ] Promotions above executed (if any)
