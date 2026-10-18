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

- `cd site && npm run build && npm test` -> 319/319 pass. `npm run test:browser` -> the first screen still holds the
  label, the H1 and the door at 1280 and 400 px, both locales (WEB-140 AC1).
- Manual: screenshots of the ES block at 1280 and 400 px; one item per line, each proof link after its item.

## Decisions made during implementation

- **WEB-140 AC2 amended** in `specs/WEB-140/proposal.md`: five blocks (hero, story, skills, door, notes).
- **The AWS item links the story (`#story`)**, not an external artifact: its figure's only source is the CV, already
  quoted in the story. The link says so ("in the story"). Noted on the issue.
- **Link text names the artifact** (ADR, runbook, PyPI, benchmark, MSc/BSc thesis), so a reader knows a thesis link
  proves part of a line (FPGA, EMVA 1288), not all of it.
- **The figure rule matches whole numbers only** (`\b\d+\b`), so "K3s" is not a figure; "1288" is exempt by name.
- **The banned register moved to `tests/lib/banned.mjs`**, shared with `retired-labels.test.mjs` instead of copied.

## Promotion candidates

- [ ] Lesson for `docs/lessons/`? no: nothing non-obvious beyond what the spec records.
- [ ] ADR? no: a content block inside a decided page structure.
- [ ] Pattern for `00_meta/patterns/`? no: single project.

## Archive checklist

- [ ] `proposal.md` frontmatter set to `status: archived`
- [ ] Folder moved: `specs/WEB-158/` -> `specs/archive/WEB-158/`
- [ ] Issue closed with the PR link (ADR-018)
