---
tags: [spec, verification]
created: "2026-10-17"
---

# Verification - WEB-158

## Evidence

- [x] AC1 (structure) -> `tests/home.test.mjs`: "the home's blocks come in order after the hero: story, skills, door,
  notes" and "the story, the skills and the notes are text"; `tests/skills.test.mjs`: "lists 11 items, each with
  exactly one link". Red before `HomeSkills` rendered, green after.
- [x] AC2 (one source) -> `tests/skills.test.mjs`: "both locales list the same proofs, in the same order", "site links
  in the skills block stay in their own locale"; both render `src/data/skills.ts`.
- [x] AC3 (proof) -> `tests/skills.test.mjs`: "every site link ... lands on a built page or an anchor on the home",
  "every external proof is public". Every external link answered 200 on 2026-10-17 (curl, by hand: CI tests run
  offline).
- [x] AC4 (honest copy) -> `tests/skills.test.mjs`: "no banned term and no unsourced figure", using the shared
  `tests/lib/banned.mjs`.

## Test status

- `cd site && npm run build && npm test` -> 319/319 pass at `1d24217`; 332/332 after the round-1 fixes. `npm run test:browser` -> the first screen still holds the
  label, the H1 and the door at 1280 and 400 px, both locales (WEB-140 AC1).
- Manual: screenshots of the ES block at 1280 and 400 px; one item per line, each proof link after its item.

## Decisions made during implementation

- **WEB-140 AC2 amended** in `specs/WEB-140/proposal.md`: five blocks (hero, story, skills, door, notes).
- **The AWS item links the story (`#story`)**, not an external artifact: its figure's only source is the CV, and the
  story quotes it ("a platform on Kubernetes and AWS … the infrastructure bill fell by 80%", both locales). The link
  says so ("in the story"). Noted on the issue. The story gained that sentence in #418; this branch was cut before
  #418 merged, so a build of the branch alone shows the older story (see the review round below).
- **Link text names the artifact** (ADR, runbook, PyPI, benchmark, MSc/BSc thesis), so a reader knows a thesis link
  proves part of a line (FPGA, EMVA 1288), not all of it.
- **The figure rule compares whole tokens** (`tests/lib/figures.mjs`, shared with `bio.test.mjs`): a figure is a digit
  run not touching a letter, so "K3s" is not one, and it is sourced only if `data/experience.ts` states the same
  token. "1288" is exempt by name. The first version extracted whole numbers but compared them as substrings of the
  file, which the review broke with "4%" (F2).
- **`data/experience.ts` is a figure ledger, not a rendered page.** Nothing imports it since WEB-140 dropped the
  Timeline; it records each career figure next to its role, from the CV, and the tests hold the copy to it. A
  reader's proof is the link on each item, not this file.
- **The banned register moved to `tests/lib/banned.mjs`**, shared with `retired-labels.test.mjs` instead of copied.

## Review round 1 (2026-10-18, `nan/deepseek-v4-flash`, FAIL at `1d24217`)

`review.md` holds the round. Each finding:

- **F1 Blocker, item 6's proof absent from the story** -> declined, with evidence: true of the reviewed sha only. The
  branch was cut from `3c67f51`, before #418 put the AWS and 80% sentence in the story; on `master` (`ca5b8e5`, where
  both are merged) the built `/` and `/es/` stories carry it. The decision note above is corrected to say where the
  sentence comes from.
- **F2 Major, the figure guard compared substrings** -> applied: `tests/lib/figures.mjs` compares whole tokens, and
  `bio.test.mjs` had the same flaw and uses it too. Red-green: "cut by 4%" fails `[en] … no unsourced figure` with
  `4`; "cut by 80%" passes. `tests/figures.test.mjs` holds the helper.
- **`features.json` states left `pending`** -> applied: set to `verified` with this round's evidence.
- **`home.skills` inside the timeline's comment group** -> applied: moved under `// Home sections`, next to
  `home.stack`, in both locales.
- **Stray double blank line in `retired-labels.test.mjs`** -> applied.
- **Repeated link text ("ADR", "ADR", "runbook", "runbook")** -> declined, decision: each link sits in its item's
  sentence, which names what it proves (WCAG 2.4.4 accepts link purpose from its list item). Manu confirmed the items
  as written.
- **Anglicisms in the ES copy** ("harness", "review", "benchmark", "self-hosted", "edge") -> declined, decision: trade
  anglicisms are accepted on `/es`; only a whole English string is a defect.

## Promotion candidates

- [ ] Lesson for `docs/lessons/`? no: nothing non-obvious beyond what the spec records.
- [ ] ADR? no: a content block inside a decided page structure.
- [ ] Pattern for `00_meta/patterns/`? no: single project.

## Archive checklist

- [ ] `proposal.md` frontmatter set to `status: archived`
- [ ] Folder moved: `specs/WEB-158/` -> `specs/archive/WEB-158/`
- [ ] Issue closed with the PR link (ADR-018)
