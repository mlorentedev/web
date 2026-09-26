---
tags: [spec, verification, templates]
created: "2026-09-24"
---

# Verification - WEB-140

## Evidence

Map every acceptance criterion from `proposal.md` to concrete proof (commit hash, test name, or observed behavior).

- [ ] Criterion 1 -> commit `<hash>` / test `<name>`
- [ ] Criterion 2 -> commit `<hash>` / test `<name>`
- [ ] Criterion 3 -> commit `<hash>` / test `<name>`

## Test status

- Test suite: `<command> -> <output / coverage %>`
- Manual smoke test: what was exercised, what was observed
- No regressions in existing test suite: yes / no (if no, document)

## Decisions made during implementation

Brief log of non-obvious trade-offs or course corrections taken during the work. Routine choices belong in commit messages, not here.

- **PR 1 (HomePage) is checked by the built HTML, not only by `visual-diff.mjs`.** `dist/index.html` and
  `dist/es/index.html` are byte-identical before and after. `visual-diff.mjs compare` reports 12 elements
  (`opacity`, `position`) on `/` and `/es/`, but two captures of the *same* build report the same 12: they are the
  hero's `animate-pulse` dot and IdpStrip's `animate-ping`, sampled at different frames. Read that count as the
  noise floor for the home until IdpStrip leaves it (PR 2).

## Promotion candidates

Before archiving, flag what (if anything) should be promoted to the vault. If all three are "no", archive in repo is the only persistence.

- [ ] Lesson for the repo's `docs/lessons/`? <yes / no - one line of what>
- [ ] ADR-worthy decision for the repo's `docs/adr/adr-XXX.md`? <yes / no - one line of what>
- [ ] New pattern candidate for `00_meta/patterns/`? Only if this recurs in >1 project. <yes / no - one line>

## Archive checklist

- [ ] `proposal.md` frontmatter set to `status: archived`
- [ ] Folder moved: `specs/WEB-140/` -> `specs/archive/WEB-140/`
- [ ] Bitácora board ticket for this spec moved to Done / closed with PR link (ADR-018)
- [ ] Promotions above executed (if any)
