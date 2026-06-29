---
tags: [spec, verification, templates]
created: "2026-06-27"
---

# Verification - WEB-027

## Evidence

Map every acceptance criterion from `proposal.md` to concrete proof (commit hash, test name, or observed behavior).

- [x] Criterion 1 (typed SSOT, flags default off, no `any`) -> `features.ts` (`as const`, `youtube: false`, exported `Features` type); `npx astro check` -> 0 errors.
- [x] Criterion 2 (flag OFF -> no footer anchor in `dist/`, ON -> present) -> build + `grep -rl 'youtube.com/@mlorentedev' dist/`: OFF no match, ON matches every page.
- [x] Criterion 3 (toggle only the flag flips output) -> edited only `features.ts` `false`->`true`->`false`, rebuilt each time; anchor appears then disappears, no other file changed.
- [x] Criterion 4 (`youtube: ''` hack removed) -> `site.ts` holds the real URL; empty-string variant absent.
- [x] Criterion 5 (self-documenting) -> top-of-file "How to add a flag" 3-step note + one-line `/** */` per flag.
- [x] Criterion 6 (no regression, 74 pages) -> `npm run build` -> "74 page(s) built"; diff scoped to 3 files.

## Test status

- Build / typecheck: `npx astro check` -> 0 errors, 0 warnings, 1 hint (pre-existing `ts(6133)` in `index.astro`, untouched). `npm run build` -> 74 page(s) built.
- Manual smoke test: toggled `features.youtube` OFF/ON/OFF, rebuilt each time, grepped `dist/` for the footer URL `youtube.com/@mlorentedev` — absent when off, present (all pages, Footer is global) when on.
- No regressions in existing test suite: yes — page count unchanged at 74; working-tree diff limited to `Footer.astro`, `site.ts`, `features.ts`.
- `features.json` states left at `pending` (no automated harness in repo); evidence captured per entry. Reviewer/harness flips to `passing` on confirmation per the pass-state gate.

## Decisions made during implementation

Brief log of non-obvious trade-offs or course corrections taken during the work. Routine choices belong in commit messages, not here.

- `as const` (literal `false`) over an explicit `boolean` interface: literal types let the bundler dead-code-eliminate the disabled JSX branch (the proposal's "no leaked markup/link" risk), confirmed by the empty `grep` of `dist/` when off. Exported a `Features = typeof features` type so consumers/helpers stay typed without `any`.
- Acceptance criterion 2 in `proposal.md` loosely says `grep -r "youtube" dist/` finds none, but the site has a content tag literally named "youtube" (`/tags/youtube/`), so a bare grep always hits. Narrowed the executable check (in `features.json`) to the footer URL `youtube.com/@mlorentedev` — the precise signal for "is the footer anchor present".

## Promotion candidates

Before archiving, flag what (if anything) should be promoted to the vault. If all three are "no", archive in repo is the only persistence.

- [x] Lesson for the repo's `docs/lessons.md`? yes — verify the *precise* signal (footer URL), not a broad token (`grep "youtube"`), when content taxonomy can share the keyword.
- [ ] ADR-worthy decision for the repo's `docs/adr/adr-XXX.md`? no — build-time-only rationale is already captured under ADR-055 (promote-by-digest); the flag module is an implementation detail, not an architecture decision.
- [x] New pattern candidate for `00_meta/patterns/`? yes (deferred to archive) — `pattern-feature-flags.md`: typed build-time flag SSOT, defaults-off, direct boolean access. Promote only once a 2nd project adopts it (Regla del 3).

## Archive checklist

- [ ] `proposal.md` frontmatter set to `status: archived`
- [ ] Folder moved: `specs/WEB-027/` -> `specs/archive/WEB-027/`
- [ ] Bitácora board ticket for this spec moved to Done / closed with PR link (ADR-018)
- [ ] Promotions above executed (if any)
