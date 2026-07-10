---
tags: [spec, verification, templates]
created: "2026-07-10"
---

# Verification - WEB-019

## Evidence

Map every acceptance criterion from `proposal.md` to concrete proof. Filled per increment as PRs land.

**Increment 1 — baked metrics:**
- [ ] AC1 (component, ≥3 GitHub metrics + hive, both locales) -> `f1` <tbd>
- [ ] AC2 (build-time baked, no client fetch to see numbers) -> `f1` <tbd>
- [ ] AC3 (fetch-failure fallback, build completes, check 0/0/0) -> `f2` <tbd>

**Increment 2 — live hydration:** <tbd>
**Increment 3 — heatmap:** <tbd>

## Test status

- Type check: `npx astro check` -> <tbd>
- Build: `npx astro build` -> <tbd>
- Manual smoke: force a build-time fetch failure (unreachable API) -> confirm `FALLBACK` renders and
  build completes; grep `dist/{index,es/index}.html` for `data-proof` + the `[ 06 ]` label.

## Decisions made during implementation

-

## Promotion candidates

- [ ] Lesson for `docs/lessons.md`? <tbd — candidate: build-time external fetch needs a committed/hardcoded fallback or a flaky API breaks deploys>
- [ ] ADR-worthy? <tbd — build-time bake + client-side progressive-enhancement hydration as the "no new infra" proof-surface pattern may be worth an in-repo ADR if it recurs for PS3+>
- [ ] Pattern candidate? <tbd>

## Archive checklist

- [ ] `proposal.md` frontmatter set to `status: archived` (only when ALL of #46 is done)
- [ ] Folder moved: `specs/WEB-019/` -> `specs/archive/WEB-019/`
- [ ] Bitácora #46 closed with PR links (ADR-018)
- [ ] Promotions above executed (if any)
