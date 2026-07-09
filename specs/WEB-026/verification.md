---
tags: [spec, verification, templates]
created: "2026-07-09"
---

# Verification - WEB-026

## Evidence

Map every acceptance criterion from `proposal.md` to concrete proof (commit hash, test name, or observed behavior). Maps to `features.json` (WEB-026-f1..f4).

- [x] AC1 (single component, both pages, no dup markup) -> `features.json` **f1** PASS. `src/components/ProjectCard.astro` created; imported by `index.astro` + `projects.astro`; the `border border-gray-200 rounded-md p-4` card block no longer appears in either page.
- [x] AC2 (bilingual data, localize by locale) -> **f2** PASS. `/tags/kubernetes` renders "5 physical nodes"; `/es/tags/kubernetes` renders "5 nodos físicos" — same project, resolved by `Astro.currentLocale` through `localize()`.
- [x] AC3 (non-empty metric per card) -> **f3** PASS. 8 `data-metric` badges rendered on `/projects` and 8 on `/` (one per project).
- [x] AC4 (types + build) -> **f4** PASS. `astro check` 0/0/0; `astro build` 74 pages.

## Test status

- Type check: `npx astro check` -> **0 errors, 0 warnings, 0 hints** (29 files). Also cleared a pre-existing unused-`page` hint in `index.astro`.
- Build: `npx astro build` -> **74 pages built, Complete** (unchanged page count — no routes added/removed).
- Manual smoke test: inspected `dist/index.html` — KubeLab card = border + linked title + cyan `data-metric` badge ("5-node bare-metal K8s") + description + tags + "View project →". Confirmed `bg-cyan-50` utility is generated in `dist/_astro/*.css` (not purged).
- No regressions: yes. Tag pages still render matching projects (now via `localize()`); notes/sitemap unchanged.

## Decisions made during implementation

Brief log of non-obvious trade-offs or course corrections taken during the work. Routine choices belong in commit messages, not here.

- **Blast radius was 5 consumers, not 2.** `tags/[tag].astro` + `es/tags/[tag].astro` also read `project.title`/`description`. Kept their own markup (out of scope) but routed the map param through `localize()` so they compile against the new type with no visual change.
- **Metric on its own line (badge), not beside the title** — variable-width metrics ("3s" vs "20 plugs, bulk-provisioned") would overflow a 2-col grid card if docked next to the title.
- **ES metric strings authored but not yet rendered** — no ES surface uses `ProjectCard` today (ES landing/list is WEB-012). Data is bilingual-ready; ES metrics light up when WEB-012 ships. Not debt — a deliberate forward-provision matching the "full ES translation now" decision.
- **Follow-up ticketed, not deferred silently**: unifying the tag-page card into `ProjectCard` (adds metric + drops the corner GitHub link) is a deliberate design change → filed as a separate issue rather than smuggled into this PR.

## Promotion candidates

Before archiving, flag what (if anything) should be promoted to the vault. If all three are "no", archive in repo is the only persistence.

- [ ] Lesson for the repo's `docs/lessons.md`? **maybe** — "a bilingual data-model change is a type-contract change; grep ALL consumers before editing (here: 5, not the obvious 2)". Decide at archive.
- [ ] ADR-worthy decision for the repo's `docs/adr/adr-XXX.md`? **no** — component extraction + bilingual data shape is routine, no cross-cutting architectural commitment.
- [ ] New pattern candidate for `00_meta/patterns/`? **no** — repo-local.

## Archive checklist

- [ ] `proposal.md` frontmatter set to `status: archived`
- [ ] Folder moved: `specs/WEB-026/` -> `specs/archive/WEB-026/`
- [ ] Bitácora board ticket for this spec moved to Done / closed with PR link (ADR-018)
- [ ] Promotions above executed (if any)
