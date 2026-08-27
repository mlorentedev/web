---
id: "WEB-080"
type: spec
status: draft # draft | implementing | verifying | archived
created: "2026-08-27"
issue: "mlorentedev/web#181"   # repo#NNN — GitHub issue / Project item that tracks this spec
tags: [spec, proposal]
template_version: "1.0"
---

# WEB-080

> **Naming**: file lives at `<repo>/specs/WEB-080/proposal.md`. `WEB-080` is `AREA-NNN-slug` (e.g. `TOOL-001-secret-drift`).

## Why

<!-- from issue #181: WEB-080: rebuild the IDP section as the single public platform surface -->

The site has two public platform surfaces and neither is honest: `home.kubelab.live` renders `placeholder` because its widgets live on the mesh, and `/lab` here is 1,150 lines of hand-written HTML in a third design dialect — ten hue families, 88 off-scale text sizes, one `<section>`, zero `aria`, and a topology drawn by hand that nothing renders from source. A visitor who follows the hero's claim ("the infrastructure under the agents") lands on the one page that cannot prove it. The decision of 2026-08-25 is one public surface, this one; without this spec it stays the page that was built twice in one day without a spec and paid for with eleven correction PRs.

## What

`/lab` and `/es/lab` become the one public platform surface, and `IdpPage.astro` (1,150 lines) is gone.

1. **Five sections** — Services · Infra · Topology · Flows · AI & Automations — built from `Section`/`SectionHeading`, the site's colour tokens (`accent`, `ink`, `panel`, `ok`, `warn`, `danger`, `observe`) and its existing type scale. Same design language, different density; the dark inset panels are the single licensed differentiator. The register is the FAQ's ("zero port-forwarding rules on my residential USA network"), not Title-Case infrastructure marketing.
2. **Services and Infra render from `platform.json`** (`cluster`, `nodes`, `services`, `metrics`) through `platform.ts` — no hand-written rows; access boundaries made explicit per service.
3. **AI & Automations is a migration**, not a writing exercise: the four groups (Agents, Protocols, Workflows, Telemetry) from kubelab's `services.yaml.j2` (kubelab#1326), each entry pointing at a real, mostly public, artifact.
4. **Topology and Flows are rendered at build from typed source with archify**: one committed IR per diagram, validated against `architecture.schema.json` (a malformed diagram fails the build), rendered deterministically and delivered as an extracted SVG carrying `aria`/`role` and real `<text>`; `visual-check` refuses horizontal overflow at 1440–2048 and the page is checked at 320 too. Nothing scrolls sideways.
5. **Bilingual**: every visible string of the five sections has an `es` twin in `i18n/ui.ts` or in the bilingual data, diagrams included.

## Out of scope

- **The harness material as a section of its own** → #236 (A1 chose essays, not a page). AI & Automations migrates the four groups from kubelab#1326 and nothing more.
- **`home.kubelab.live` back behind Authelia** → kubelab#456 (DASH-007e). A kubelab change; this spec does not touch it, it only stops competing with it.
- **A producer for the manifest** → #162 / kubelab#1347. The Lab consumes `platform.json` as committed; producing it from the cluster is separate work.
- **Live probes / client-side telemetry** (ADR-056 layers 2–3) → #40 / #120. This spec delivers layer 0: static at build, zero JS.

## Risks / open questions

1. **Bilingual diagrams — decided.** archify never translates authored content, so a fully localised SVG means two IRs per diagram kept in sync by hand. **Rule:** one IR per diagram; node labels are identifiers that stay English on both locales (machine names, protocols, paths, environment names); every sentence of prose lives *outside* the SVG — `<figcaption>` and legend from `i18n/ui.ts` — so the ES page is a translation of the page, not a second drawing.
2. **[MUST RESOLVE BEFORE CODE] SVG extraction is not a first-class archify command.** `extractArchitectureSvg` lives in `delta/architecture-delta.mjs`; the site needs a small build wrapper (`site/scripts/diagrams.mjs`) and a decision on committed-vs-generated SVG. archify's `visual-check` covers 1440–2048 only, so the site keeps its own containment check at 320 px. Weight: ~21 KB per extracted SVG — inline (accessible, searchable) vs `<img loading="lazy">` (lighter; tension with #138). Measure one diagram end-to-end before the rest are authored.
3. **`platform.json` has no producer** (#162). "Measured rather than typed" is a claim the page cannot back on its own; the page prints the manifest's `generated_at` and source commit so staleness is visible. Without that it is #175 in better typography.
4. **The copy is writing work.** Only AI & Automations is a migration; Services, Infra, Topology and Flows need EN+ES prose in the FAQ's register. Budgeted as its own task per section, or the sections ship as tables without a voice.

## Acceptance criteria

- [ ] **AC1 — Design system, measured.** In the built HTML of `/lab`: colour utilities only from the token families (≤ 7 families: `accent`, `ink`, `panel`, `ok`, `warn`, `danger`, `observe`), **zero** arbitrary sizes (`text-[Npx]`), ≥ 5 `<section>` each opened by `SectionHeading`. A test (`site/tests/lab-audit.test.ts`) asserts it against `dist/`.
- [ ] **AC2 — Diagrams from source.** Every diagram has a committed archify IR that validates (`archify validate` → exit 0); a malformed IR **fails `npm run build`**; the delivered SVG carries `role`/`aria-*` and real `<text>`; **no horizontal scroll** at 320, 768, 1440 and 2048 (Playwright: `scrollWidth <= innerWidth`).
- [ ] **AC3 — Data, not hand-written rows.** Services and Infra show exactly the entries of `platform.json` (a test compares counts) and print the manifest's `generated_at` and source commit; every visible string has its `es` twin (a test over `ui.ts` + `astro check` with 0 errors).
- [ ] **AC4 — Faithful migration.** AI & Automations carries the four groups with the same entries and links as kubelab's `services.yaml.j2` at a pinned commit (a test compares counts and URLs).
- [ ] **AC5 — No regression.** `IdpPage.astro` deleted; `/lab` and `/es/lab` build; `IdpStrip.astro` on both landings still builds and reads from `platform.ts`, not from hand-written HTML; **0 axe violations** on `/lab` and `/es/lab` (Playwright + axe-core).
- [ ] **AC6 — Weight budget.** The built `/lab` page (HTML + inline SVG, fonts excluded) stays under a limit fixed after measuring the first diagram end-to-end (Risk 2) and recorded in `verification.md`; a test over `dist/` asserts it, so the tension with #138 is visible in CI rather than discovered later.

## References

- Bitácora: mlorentedev/web#181 (WEB-080). Evidence on the issue: A2 = C (2026-08-26), the diagram-toolchain comparison and baseline (2026-08-27), the proof-of-concept archify IR (41 lines, 9/9 checks).
- Decisions upstream: hero form C shipped in #247; `/idp` → `/lab` in #232; #236 keeps the harness out of this page; `platform.json` producer is #162 / kubelab#1347.
- Design language: `Section.astro`, `SectionHeading.astro`, `src/theme/tokens.mjs`, `tailwind.config` (`accent`/`ink`/`panel`/`ok`/`warn`/`danger`/`observe`); the style audit's measurements are in the issue body.
- Diagrams: archify skill at `.agents/skills/archify` (`bin/archify.mjs validate|deliver`, `bin/visual-check.mjs`, `delta/architecture-delta.mjs#extractArchitectureSvg`, `schemas/architecture.schema.json`); mermaid stays for notes (#176, #244/#248).
- ADRs: adr-053 (two-repo delivery), adr-056 (cockpit architecture — layer 0 only here), kubelab adr-046 (gated promotion).
