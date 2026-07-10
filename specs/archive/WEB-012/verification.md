---
tags: [spec, verification]
created: "2026-07-09"
---

# Verification - WEB-012 (increment 1: credibility band)

## Evidence

- [x] AC1 (component, 4 stats) -> `f1` PASS. `CredibilityBand.astro`; 4 `data-stat` entries (services/tokens/projects/notes) under `[ 00 / By the numbers ]`.
- [x] AC2 (both landings, after hero) -> `f2` PASS. `data-credibility-band` in `dist/index.html` + `dist/es/index.html`, placed after `<Hero />`, before `[ 01 / What I build ]`.
- [x] AC3 (derived counts) -> `f3` PASS. projects=8 (`projects.length`), notes=15 (published) — identical on EN/ES; ES labels translated.
- [x] AC4 (check + build) -> `f4` PASS. `astro check` 0/0/0 (30 files); `astro build` 74 pages.

**Increment 2 — experience timeline:**
- [x] `f5` PASS. `Timeline.astro` renders 4 `data-role` entries on `/` and `/es/`, labelled `[ 01 / My path | Mi camino ]`.
- [x] `f6` PASS. Bilingual: EN "My path" / ES "Mi camino" + "Ingeniero de Plataforma y Aplicaciones" / "España / EE. UU." / "2019 — Actualidad"; landing numbering `00 01 02 03 04 05` (no gaps). `astro check` 0/0/0 (32 files); build 74 pages.

**Increment 3 — ES parity + componentization:**
- [x] `f7` PASS. EN + ES landings compose the same 4 shared components; both numbered `00..05`; ES landing has 8 ProjectCards + translated stack/community ("Con qué trabajo", "Orquestación", "Observabilidad", "Constructores de IA", "Remero en activo", "Próximamente", "Todas las notas").
- [x] `f8` PASS. Spanish essay preserved at `/es/newsletter` (`lazarillo` present there, 0 on `/es/` home). `astro check` 0/0/0 (37 files); `astro build` 75 pages.
- Decision: user chose **full parity** (2026-07-09) knowing the essay leaves the home; preserved it at `/es/newsletter` rather than delete (don't-destroy-content). `en-home.mdx` left as an empty orphan, flagged.

## Test status

- Type check: `npx astro check` -> **0 errors, 0 warnings, 0 hints** (30 files).
- Build: `npx astro build` -> **74 pages, Complete**.
- Manual smoke: dev server hot-reloaded the band onto `/` and `/es/`; `dist/` grep confirms EN "By the numbers" (40 · 67–82% · 8 · 15) and ES "En números" (servicios · homelab / menos tokens · Hive / proyectos publicados / notas de campo) with identical numbers.

## Decisions made during implementation

- **Note count is language-agnostic, not per-locale.** All 16 notes are `lang: en`; a per-lang filter rendered "0 notas de campo" on the ES band. The band shows total published notes (a proof-of-output fact) — same numbers on both bands, only labels translate.
- **15 published notes is honest** — the single placeholder note is also the only `draft: true`, so it's excluded; the count matches what `/notes` shows.
- **"40 services" stays hardcoded** to mirror the hero's "40-service homelab" claim — a live count is PS1/WEB-019 (proof surface), out of scope here.

## Promotion candidates

- [ ] Lesson for `docs/lessons.md`? <tbd at archive>
- [ ] ADR-worthy? no (increment of a decided epic; design in ADR-045 / vault analysis)
- [ ] Pattern candidate? no

## Archive checklist

- [ ] `proposal.md` status -> archived
- [ ] Folder moved to `specs/archive/WEB-012/` (only when the WHOLE of #42 is done — this is increment 1; keep #42 open)
- [ ] Bitácora #42 updated with increment-1 PR link (issue stays OPEN for increments 2–3)
