---
tags: [spec, verification, templates]
created: "2026-08-27"
---

# Verification - WEB-080

## Evidence

> Required for the final PR: light-theme screenshots of `/lab` and `/es/lab` at **320 px** and **1440 px**, committed under `specs/WEB-080/evidence/`, plus the archify `visual-check` receipt for each diagram. Evidence for the human reviewer, not a test.


Map every acceptance criterion from `proposal.md` to concrete proof (commit hash, test name, or observed behavior).

- [ ] AC1 design system measured -> commit `<hash>` / `site/tests/lab-audit.test.mjs`
- [ ] AC2 diagrams from source, no horizontal scroll -> commit `<hash>` / `lab-diagrams.test.mjs` + `lab-containment.mjs` + archify `visual-check` receipts
- [ ] AC3 data-driven + `es` twins -> commit `<hash>` / `lab-data.test.mjs` + `astro check`
- [ ] AC4 faithful migration -> commit `<hash>` / `lab-ai-migration.test.mjs` (pinned kubelab commit below) + link HEAD-check output
- [ ] AC5 no regression, 0 axe violations -> commit `<hash>` / `npm run build` + `lab-axe.mjs`; `IdpPage.astro` absent
- [ ] AC6 weight budget -> commit `<hash>` / `lab-weight.test.mjs`; budget and PR0 measurements recorded under Decisions

## Test status

- Test suite: `<command> -> <output / coverage %>`
- Manual smoke test: what was exercised, what was observed
- No regressions in existing test suite: yes / no (if no, document)

## Decisions made during implementation

Brief log of non-obvious trade-offs or course corrections taken during the work. Routine choices belong in commit messages, not here.

-
-

## Promotion candidates

Before archiving, flag what (if anything) should be promoted to the vault. If all three are "no", archive in repo is the only persistence.

- [ ] Lesson for the repo's `docs/lessons/`? <yes / no - one line of what>
- [ ] ADR-worthy decision for the repo's `docs/adr/adr-XXX.md`? <yes / no - one line of what>
- [ ] New pattern candidate for `00_meta/patterns/`? Only if this recurs in >1 project. <yes / no - one line>

## Archive checklist

- [ ] `proposal.md` frontmatter set to `status: archived`
- [ ] Folder moved: `specs/WEB-080/` -> `specs/archive/WEB-080/`
- [ ] Bitácora board ticket for this spec moved to Done / closed with PR link (ADR-018)
- [ ] Promotions above executed (if any)
