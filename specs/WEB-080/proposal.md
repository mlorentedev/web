---
id: "WEB-080"
type: spec
status: verifying # draft | implementing | verifying | archived
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
3. **AI & Automations is a migration**, not a writing exercise: the four groups (Agents, Protocols, Workflows, Telemetry) from kubelab's `infra/k8s/base/services/homepage-templates/services.yaml.j2` at commit **`6cd9ab0ca594`** (kubelab#1326, 2026-08-23), each entry pointing at a real, mostly public, artifact.
4. **Topology and Flows are rendered at build from typed source with archify**: one committed IR per diagram, validated against `architecture.schema.json` (a malformed diagram fails the build), rendered deterministically and delivered as an extracted SVG carrying `aria`/`role` and real `<text>`; `visual-check` refuses horizontal overflow at 1440–2048 and the page is checked at 320 too. **The page never scrolls sideways**; a diagram wider than the viewport scrolls inside its own `<figure>` instead, because at 320 px it cannot be scaled to fit and stay legible (PR0 measured 7 px text projecting to 2.55 px — see `verification.md`).
5. **Bilingual**: every translatable string of the five sections has an `es` twin — in `i18n/ui.ts` or in the bilingual data fields (`descriptionEs`, `categoryEs`, `lab-ai.ts`). **Exception, by Risk §1:** stable identifiers inside the diagram SVGs (machine names, protocols, paths, environment names) are the same on both locales and are excluded from the twin test; a diagram's prose (caption, legend) lives outside the SVG and is covered.

## Out of scope

- **The harness material as a section of its own** → #236 (A1 chose essays, not a page). AI & Automations migrates the four groups from kubelab#1326 and nothing more.
- **`home.kubelab.live` back behind Authelia** → kubelab#456 (DASH-007e). A kubelab change; this spec does not touch it, it only stops competing with it.
- **A producer for the manifest** → #162 / kubelab#1347. The Lab consumes `platform.json` as committed; producing it from the cluster is separate work.
- **Live probes / client-side telemetry** (ADR-056 layers 2–3) → #40 / #120. This spec delivers layer 0: static at build, zero JS.

## Risks / open questions

1. **Bilingual diagrams — decided.** archify never translates authored content, so a fully localised SVG means two IRs per diagram kept in sync by hand. **Rule:** one IR per diagram; node labels are identifiers that stay English on both locales (machine names, protocols, paths, environment names); every sentence of prose lives *outside* the SVG — `<figcaption>` and legend from `i18n/ui.ts` — so the ES page is a translation of the page, not a second drawing.
2. **~~[MUST RESOLVE BEFORE CODE]~~ RESOLVED by PR0 (2026-08-27).** `extractArchitectureSvg` lives in `delta/architecture-delta.mjs`, so the site has a wrapper: `site/scripts/diagrams.mjs`, `generate` (authoring, needs archify) and `verify` (build/CI, does not). **SVGs are committed**, `#242`'s exclusion of `.agents/` stands, and only the 12 KB schema is vendored; an `ir-sha256` stamp makes staleness a build failure. **Inline, not `<img>`** — an `<img>`-loaded SVG exposes none of its `role`/`aria-*` and is invisible to a `grep` over `dist/`, which is #244's defect. One diagram measured end-to-end: **21,929 B / 4,076 gzip**, 15 `role`, 25 `aria-*`, 36 `<text>`. archify's `visual-check` covers 1440–2048 only, so the site keeps its own containment check at 320 px — where the diagram cannot be scaled to fit (7 px text projects to 2.55 px) and instead scrolls inside its figure at a 754 px floor. Full numbers in `verification.md`.
3. **`platform.json` has no producer** (#162). "Measured rather than typed" is a claim the page cannot back on its own; the page prints the manifest's `generated_at` and source commit so staleness is visible. Without that it is #175 in better typography.
4. **The copy is writing work.** Only AI & Automations is a migration; Services, Infra, Topology and Flows need EN+ES prose in the FAQ's register. Budgeted as its own task per section, or the sections ship as tables without a voice.

## Acceptance criteria

- [x] **AC1 — Design system, measured.** In the built HTML of `/lab`: hued colour utilities only from the seven token families (`accent`, `ink`, `panel`, `ok`, `warn`, `danger`, `observe`; the hue-less neutrals `white`, `black`, `transparent`, `current` are allowed and are not families), **zero** arbitrary sizes (`text-[Npx]`), ≥ 5 `<section>` **each containing a `SectionHeading` eyebrow** (`[ NN / … ]`). One allowlist, shared by this criterion and `site/tests/lab-audit.test.mjs`, asserted against `dist/`.
- [x] **AC2 — Diagrams from source.** Every diagram has a committed archify IR that validates against the vendored schema; a malformed **or stale** IR **fails `npm run build`** (amended by PR0 — see `verification.md`, "Risk 2 resolved": CI verifies rather than renders, so staleness is caught by an `ir-sha256` stamp and the guarantee is strictly stronger than the original wording); the committed SVG carries `role`/`aria-*` and real `<text>`; **no horizontal scroll of the page** at 320, 768, 1440 and 2048 (Playwright: `scrollWidth <= innerWidth`), the diagram scrolling inside its own figure at a 754 px legibility floor.
- [x] **AC3 — Data, not hand-written rows.** Services and Infra show exactly the entries of `platform.json` (a test compares counts) and print the manifest's `generated_at` and source commit; every translatable string has its `es` twin — `lab.*` keys in `ui.ts` **and** every visible data field (`descriptionEs`, `categoryEs`, `lab-ai.ts`), identifiers excepted per What §5 (a test + `astro check` with 0 errors).
- [x] **AC4 — Faithful migration.** AI & Automations carries the four groups with the same entries as kubelab `infra/k8s/base/services/homepage-templates/services.yaml.j2` at commit `6cd9ab0ca5948297281b6d53798db97c562ea431`, and every entry pins that file's link verbatim as `sourceHref` (a test fixture holds the file at that commit and compares group names, entry names and the whole `sourceHref` set — reproducible regardless of what kubelab does next). **A link is *rendered* only where a public reader can follow it**, each entry declaring `public` / `mesh` / `private`, and any `url` that departs from its `sourceHref` carrying a note saying why.
  - **Amended by PR5 (2026-09-01), and the measurement is what forced it.** As written the criterion said "the same entries **and links**", which cannot be met on a public page: six of the thirteen links are unreachable from outside — four `*.kubelab.live` hosts behind Authelia (Argo CD answers nothing at all) and two pointing at the private repo `mlorentedev/knowledge` — and a seventh 404s for everyone, because the ADR behind it was renamed. The template feeds a homepage that lives **behind the mesh**, where every one of them is correct; this page is public, where they are not. Shipping them verbatim would have satisfied the letter of AC4 by putting six dead links on the Lab. So faithfulness moved to `sourceHref`, which is pinned, complete and machine-checked, and reachability became its own honest assertion. It is the boundary `platform.ts` already draws — "Public services only — internal endpoints are not shipped to the client" — and the one PR3 rendered. Evidence, including the first-hop HEAD table, in `verification.md` § PR5.
- [x] **AC5 — No regression.** `IdpPage.astro` deleted; `/lab` and `/es/lab` build; `IdpStrip.astro` on both landings still builds and reads from `platform.ts`, not from hand-written HTML; **0 axe violations** on `/lab` and `/es/lab` (Playwright + axe-core). The page ships **exactly one script** — the reachability console — and no hydrated island.
  - **Amended by PR6 (2026-09-01): the page was never "zero JS", and saying so is what let the console go five PRs unexamined.** Out of scope filed "live probes / client-side telemetry (ADR-056 layers 2–3)" under `#40` / `#120`; neither issue is about this console (`#40` is the RAG / interactive-CV epic, `#120` merges two metric bands on the home page). **ADR-056 §4.3 decided it deliberately** — a visitor asks the platform from their own browser instead of trusting the page — and an ADR outranks a spec's scoping note. What was actually wrong was *what it measured*: two of its three targets were `mlorentedev.github.io` docs sites for **libraries**, reported as `REACHABLE` and attributed by the page to a Jetson Nano and a Hetzner VPS, and the third hit the API's **root, which 404s** — invisible behind `mode: 'no-cors'`. So the criterion drops an untrue claim and gains an enforceable one: one script, named, counted. See `verification.md` § PR6.
- [x] **AC6 — Weight budget.** The built `/lab` page (HTML + inline SVG, fonts excluded) stays under a limit fixed after measuring the first diagram end-to-end (Risk 2) and recorded in `verification.md`; a test over `dist/` asserts it, so the tension with #138 is visible in CI rather than discovered later.

## References

- Bitácora: mlorentedev/web#181 (WEB-080). Evidence on the issue: A2 = C (2026-08-26), the diagram-toolchain comparison and baseline (2026-08-27), the proof-of-concept archify IR (41 lines, 9/9 checks).
- Decisions upstream: hero form C shipped in #247; `/idp` → `/lab` in #232; #236 keeps the harness out of this page; `platform.json` producer is #162 / kubelab#1347. AI & Automations source: kubelab `infra/k8s/base/services/homepage-templates/services.yaml.j2` @ `6cd9ab0ca5948297281b6d53798db97c562ea431`.
- Design language: `Section.astro`, `SectionHeading.astro`, `src/theme/tokens.mjs`, `tailwind.config` (`accent`/`ink`/`panel`/`ok`/`warn`/`danger`/`observe`); the style audit's measurements are in the issue body.
- Diagrams: archify skill at `.agents/skills/archify` (`bin/archify.mjs validate|deliver`, `bin/visual-check.mjs`, `delta/architecture-delta.mjs#extractArchitectureSvg`, `schemas/architecture.schema.json`); mermaid stays for notes (#176, #244/#248).
- ADRs: adr-053 (two-repo delivery), adr-056 (cockpit architecture — layer 0 only here), kubelab adr-046 (gated promotion).
