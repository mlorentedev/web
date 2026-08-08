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

**Increment 2 — live hydration:**
- [x] AC (JS updates baked numbers from public REST + TTL'd localStorage cache; failure keeps baked
      value, no empty state / layout shift) -> `f4` PASS (static + derivation). Island inlined on both
      `dist/{index,es/index}.html`: cache key `web:gh-metrics:v1`, shared `deriveMetrics`
      (`stargazers_count`), endpoint template, `FALLBACK`, one `<script type="module">`. `data-value`
      hooks present for the selector. Shared `deriveMetrics` proven on live data by the baked build
      (21/14/8). `astro check` 0/0/0 (39 files); build 75 pages. DOM/localStorage glue is standard
      browser API, unverifiable in-repo (no browser test harness); recommend a manual browser spot-check.

**Increment 3 — heatmap:** **not built.** The decision was to relocate the existing tokenless
`ghchart.rshah.org` `<img>` from `[ 02 ]` into `[ 06 ]` (~10 lines) rather than self-host a
GraphQL+token heatmap. It was deferred, then #46 was closed without it. The heatmap therefore
still renders in `[ 02 ]` (`ProjectsSection.astro`, `projects.astro`) — working, just not
consolidated into the proof surface. Not debt: a deliberate descope, recorded here.

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

- [x] Lesson for `docs/lessons.md`? **Two written** — "A build-time external fetch needs a committed
      fallback, or a flaky API breaks deploys" (the candidate named here) and "Astro inlines small
      module scripts — grep the HTML, not for an `_astro/*.js` chunk" (surfaced while verifying
      increment 2, queued in the 2026-07-10 handoff and unwritten until now).
- [x] ADR-worthy? **No — deferred deliberately.** The bake + progressive-enhancement pattern has
      exactly one instance (PS2). The trigger stated here was "if it recurs for PS3+", and PS3 does
      not exist. Writing an ADR from a single instance would document a habit, not a decision.
- [x] Pattern candidate? **No.** Nothing here generalizes past this repo: it is Astro-specific build
      behaviour plus one API's rate budget. Both belong in `docs/lessons.md`, which is where they went.

## Archive checklist

- [x] `proposal.md` frontmatter set to `status: archived`
- [x] Folder moved: `specs/WEB-019/` -> `specs/archive/WEB-019/`
- [x] Bitácora #46 closed (closed 2026-08-07, before this archive — the loop was reopened to run it)
- [x] Promotions above executed

> **Archived with increment 3 descoped.** The original gate read "only when ALL of #46 is done";
> #46 was closed with 2 of 3 increments built. Archiving matches reality rather than blocking on an
> increment the issue closure already gave up on.
