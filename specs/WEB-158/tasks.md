---
tags: [spec, tasks]
created: "2026-10-17"
---

# Tasks - WEB-158

> TDD order. One task = one focused commit. `[AC<n>]` maps to `proposal.md`.

## Setup

- [x] Branch from `origin/master`: `feat/web-158-skills-list` (worktree `feat-web-158-skills-list`)
- [x] `proposal.md` complete; the eleven items confirmed by Manu (2026-10-17, #459)
- [x] No open questions left in Risks (the AC2 amendment and the employer constraint were decided with Manu)

## Implementation

- [ ] Refactor: move the §7 `banned` patterns from `tests/retired-labels.test.mjs` to `tests/lib/banned.mjs` and
  import them back, so the skills test reuses the same list. `npm test` unchanged.
- [ ] [AC1] Write failing test in `tests/home.test.mjs`: blocks in order `story, skills, door, notes`; the skills block
  is text only. Run: FAIL (no skills block).
- [ ] [AC2] [AC3] [AC4] Write failing `tests/skills.test.mjs`: eleven `<li>` per locale, one link each, same targets
  across locales, site links resolve, external links on the allowlist and never private repos, no banned family, no
  figure outside `experience.ts`. Run: FAIL.
- [ ] [AC2] Add `src/data/skills.ts` (bilingual items with one `href` each) and `components/HomeSkills.astro`; add the
  `home.skills` key to `i18n/ui.ts` in both locales.
- [ ] [AC1] Render `HomeSkills` in `HomePage.astro` between `HomeStory` and `HomeDoor`. Run `npm run build && npm test`:
  PASS.
- [ ] [AC1] `npm run test:browser`: the first screen still holds the label, the H1 and the door (WEB-140 AC1).

## Closing

- [ ] Every acceptance criterion covered by a test
- [ ] `features.json` entries with a non-vacuous verification command
- [ ] `verification.md` filled in; WEB-140 AC2 amendment noted there
- [ ] PR opened referencing this spec folder
