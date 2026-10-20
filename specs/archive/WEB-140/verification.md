---
tags: [spec, verification, templates]
created: "2026-09-24"
---

# Verification - WEB-140

## Evidence

Run on 2026-10-19 from `chore/web-140-close-spec` at master `b9874f2` (v1.16.0), Node 24.11.1, after
`npm run build` (astro check: 0 errors; 87 pages).

- [x] AC1 (first screen) -> `tests/home-first-screen.mjs`: `/` and `/es/` at 1280x720 and 400x740 show the label,
  the H1 and the door (4/4). Landed with #419 (`93bd8df`).
- [x] AC2 (structure) -> `tests/home.test.mjs`: both index pages are stubs rendering `HomePage` (#410, `2f45626`);
  one `<h1>` per locale; none of the five retired sections (#416, `fa4ee79`); blocks in order story, skills, door,
  notes, the order amended by WEB-158 (#461, `ca5b8e5`). Prod 1.16.0 serves one `<h1>` and the four
  `data-home-block` sections on `/` and `/es/` (curl, 2026-10-19).
- [x] AC3 (one source) -> `tests/home.test.mjs` "one source": the home's offer and door `mailto` equal `/contact`'s,
  en and es (4 tests). Landed with #419 (`93bd8df`).
- [x] AC4 (proof in the story) -> `tests/bio.test.mjs` (12/12): `/lab` and `/ai` linked in each locale, every site
  link resolves to a built page, every figure is in `experience.ts`, no figure in the agents sentence, 300 to 450
  words. Landed with #418 (`6a88239`); whole-token figures hardened in #467 (`efdb8cf`).
- [x] AC5 (honesty) -> `tests/home.test.mjs` "honesty" (home and contact, en and es; 4 tests) and "states no node or
  service count and no uptime" (en and es).
- [x] AC6 (no regressions) -> `npm test` 355/355, 0 fail, 0 skipped.

## Test status

- `cd site && npm run build && npm test` -> 355/355 pass. `node tests/home-first-screen.mjs` -> 4/4.
- Both `--test-name-pattern` commands in `features.json` were checked to select tests: "one source" runs 4 and
  "honesty" runs 4. A pattern that matches nothing exits 0.
- Manual smoke test: prod `/` and `/es/` fetched on 2026-10-19 carry the new structure (above).
- No regressions in the existing suite: yes.

## Decisions made during implementation

Brief log of non-obvious trade-offs or course corrections taken during the work. Routine choices belong in commit messages, not here.

- **PR 1 (HomePage) is checked by the built HTML, not only by `visual-diff.mjs`.** `dist/index.html` and
  `dist/es/index.html` are byte-identical before and after. `visual-diff.mjs compare` reports 12 elements
  (`opacity`, `position`) on `/` and `/es/`, but two captures of the *same* build report the same 12: they are the
  hero's `animate-pulse` dot and IdpStrip's `animate-ping`, sampled at different frames. Read that count as the
  noise floor for the home until IdpStrip leaves it (PR 2).

- **PR 3 (the story) corrects the draft to the author's answers instead of rewriting it.** Manu answered the five
  claims flagged on the PR on 2026-10-17: the Seville 15+ h/week and the Shenzhen role stand as drafted; field
  application engineering is *part of* the job he does today, not the whole of it; the integration bottleneck is told
  without a duration ("weeks" had no source); and the role since 2019 is worked between Spain and the US, which is
  what `experience.ts` already says. Only those sentences changed, so no unconfirmed claim entered the copy.

## Review dispositions

Review `review.md` (nan/glm5.3-flash, PASS-WITH-GAPS, at `c841b05`). The contract set is closed by the verdict, so
the stale `tasks.md` rows are dispositioned here, not ticked.

- **Finding 1, stale closing rows in `tasks.md`.** Declined as edits. "Lint passes": there is no lint script in
  `site/package.json`; lint is the pre-commit hooks, which ran in CI on every WEB-140 PR. "PR opened referencing
  this spec folder" and "One branch per PR": the work landed as #410, #416, #418, #419, #461 and #467, each from its
  own branch. "No unrelated changes": true of WEB-140's own changes; the launcher's base also carries WEB-141,
  WEB-158 and CI work, each with its own spec or review.
- **Finding 2, promotion candidates unanswered.** Applied below (answered with Manu on 2026-10-19).
- **Finding 3, the ES story links the EN-only `/projects/`.** Ticketed as #474 (WEB-162): pin it with a test, or
  localize the page.
- **Finding 4, AC1 samples two widths.** Declined: sampling fixed viewports is the accepted trade for layout tests,
  and the reviewer marked it SPECULATIVE and not gating.

## Promotion candidates

- [x] Lesson for `docs/lessons/`? no: the non-obvious lesson this spec produced, that a drafted claim about the author is a question, is already lesson 063.
- [x] ADR? no: a content and positioning decision inside the site, recorded in this spec and in the vault's `brand-package.md`; no architecture changes.
- [x] Pattern for `00_meta/patterns/`? no: single project; nothing recurs in another repo.

## Archive checklist

- [x] `proposal.md` frontmatter set to `status: archived`
- [x] Folder moved: `specs/WEB-140/` -> `specs/archive/WEB-140/`
- [ ] Bitácora board ticket for this spec moved to Done / closed with PR link (ADR-018)
- [x] Promotions above executed (if any): none to execute, all three are "no"
