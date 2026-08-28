---
tags: [spec, tasks, templates]
created: "2026-08-27"
---

# Tasks - WEB-080

> TDD order. One task = one focused commit. Tick as you go. Reorder freely while spec is in `draft` state; freeze once you start `implementing`.
>
> **Inline markers**: `[P]` — no dependency on another unchecked task; `[AC<n>]` — helps satisfy acceptance criterion `<n>` in `proposal.md` (lets `/spec check` map coverage deterministically).
>
> **Shape**: seven atomic PRs, each ≤300 LOC of production diff (tests, IR JSON and generated SVG excluded). PR0 is a measurement that decides Risk 2; nothing in PR2+ is authored until it lands. The site has no test runner today: PR1 adds `node --test` (built into Node ≥ 20 — the repo pins **Node 22** in `.nvmrc` and `node:22-bookworm-slim` in the Dockerfile; no CI job selects anything newer) and Playwright is already present through the mermaid build step.

## Setup

- [x] Branch created from master: `feat/web-080-lab-redesign` (worktree `web-web080-wt`)
- [x] `proposal.md` is complete and acceptance criteria are testable
- [x] Risk 1 decided — one IR per diagram, English identifiers inside the SVG, translated prose outside (`proposal.md`, Risks §1)
- [x] Risk 2 resolved by PR0 — extraction wrapper works, **committed** decided (CI verifies, does not render; `#242` stands), one diagram measured at 320 px and weighed; the AC6 budget (150 KB) is written into `verification.md`

## Implementation

### PR0 — measure one diagram end-to-end (Risk 2, AC2, AC6) — **DONE**

- [x] [P] [AC2] `site/tests/lab-diagrams.test.mjs`: every `site/src/diagrams/*.architecture.json` validates against the vendored schema; the committed SVG exists and carries ≥ 1 `role`, ≥ 10 `aria-*`, ≥ 8 `<text>`, `xmlns` and its stylesheet; **its `ir-sha256` stamp matches the IR**; **and the negative case**: `site/tests/fixtures/malformed.architecture.json` through `scripts/diagrams.mjs verify` exits non-zero. 5/5 green
- [x] [AC2] `site/src/diagrams/topology.architecture.json`, recovered from the proof-of-concept IR on #181 (8 components, 8 connections), English identifiers only
- [x] [AC2] `site/scripts/diagrams.mjs`, two modes: `generate` (authoring — `deliver`, `extractArchitectureSvg`, re-theme to the site's tokens, add `xmlns`, stamp) and `verify` (build/CI — schema + stamp, no renderer). `prebuild` wires `verify` into `npm run build`
- [x] [AC2] Vendor `site/vendor/archify-schemas/` (12 KB) + `ajv`; **`.agents/` stays ignored, `#242` stands**
- [x] [AC6] Measured: 21,929 B / 4,076 gzip per diagram; inline chosen over `<img>` with the reason; budget fixed at **150 KB** for the built page. All in `verification.md`
- [x] [AC2] `site/tests/lab-containment.mjs` (Playwright): `scrollWidth <= innerWidth` on `/lab` and `/es/lab` at 320, 768, 1440, 2048, plus a 754 px legibility floor — red until PR4, out of CI until then (`npm run test:browser`)
- [ ] **[AC1] Open for Manu: the semantic colour mapping** in `diagrams.mjs` (`TODO(manu)`). Structure and text are settled; which token family carries which archify component `type` is a domain call — see the PR note

### PR1 — data layer and the test harness (AC3, AC1 scaffolding)

- [ ] [P] [AC3] Write failing test `site/tests/lab-data.test.mjs`: `platform.json` has `generated_at` and `source_commit`; `platform.ts` exposes them typed; every `lab.*` key in `i18n/ui.ts` exists in both `en` and `es`; **and every visible data field has its `es` twin** — `descriptionEs`/`categoryEs` in `platform.ts` today, `lab-ai.ts` from PR5 — with the identifier exception of proposal What §5
- [ ] [AC3] Add `generated_at` + `source_commit` to `platform.json`/`platform.ts` (typed, printed by the page in PR3) and make the i18n twin test pass for the keys that exist today
- [ ] [AC1] Write failing test `site/tests/lab-audit.test.mjs` over `dist/lab/index.html`: hued families ⊆ {accent, ink, panel, ok, warn, danger, observe} (`white`/`black`/`transparent`/`current` allowed as hue-less neutrals — the **same allowlist as AC1**, exported from one place), zero `text-\[\d+px\]`, ≥ 5 `<section` **each containing a `SectionHeading` eyebrow** — red on today's page (10 families, 88 arbitrary sizes, 1 section), which is the point
- [ ] (housekeeping) `test` / `test:browser` scripts landed in PR0 — note that **`node --test tests/` does not work on Node 26** (it resolves the directory as a module); the script uses the glob `node --test "tests/*.test.mjs"`, which works on 22 and 26. Still owed here: a `test` job in `pr-validation.yml` that checks out, `setup-node` from `.nvmrc`, and runs **`npm run build` then `npm test` in `site/`** — the audit tests read `dist/`, which the existing Docker build never exposes

### PR2 — second diagram + captions (AC2, AC3)

- [ ] [AC2] Author `site/src/diagrams/flows.architecture.json` (GitOps → ingress → DNS) through the PR0 pipeline; `visual-check` receipt committed as evidence
- [ ] [AC3] `<figcaption>` and legend strings for both diagrams in `ui.ts`, EN and ES; twin test green

### PR3 — Services and Infra sections (AC1, AC3)

- [ ] [AC3] Write failing test: the built `/lab` lists exactly `platform.json.services.length` service rows and `nodes.length` node rows, and prints `generated_at` + `source_commit`
- [ ] [AC1] [AC3] Build `LabServices.astro` and `LabInfra.astro` on `Section`/`SectionHeading` + tokens, rendering from `platform.ts`; access boundaries per service explicit; EN+ES prose in the FAQ register (writing task, budgeted here)
- [ ] [AC1] `lab-audit` green for the families and sizes these two sections emit

### PR4 — Topology and Flows sections (AC1, AC2)

- [ ] [AC2] `LabTopology.astro` / `LabFlows.astro` embed the generated SVGs the way PR0 decided, with the PR2 captions; `lab-containment` green at all four widths — now enabled in CI
- [ ] [AC1] EN+ES prose for both sections; `lab-audit` still green

### PR5 — AI & Automations migration (AC4)

- [ ] [P] [AC4] Write failing test `site/tests/lab-ai-migration.test.mjs`: `site/src/data/lab-ai.ts` carries the four groups (Agents, Protocols, Workflows, Telemetry) with the same entry count and URLs as kubelab `infra/k8s/base/services/homepage-templates/services.yaml.j2` at commit `6cd9ab0ca5948297281b6d53798db97c562ea431` — the file at that commit is committed as the test fixture `site/tests/fixtures/services.yaml.j2` so the comparison never moves
- [ ] [AC4] Migrate the data (bilingual descriptions; links verified with a HEAD request script, output pasted in `verification.md`) and build `LabAutomations.astro`

### PR6 — cut over and delete (AC5, AC6)

- [ ] [AC5] `lab.astro` / `es/lab.astro` compose the five sections; `IdpStrip.astro` reads from `platform.ts`; delete `IdpPage.astro`; both landings and both Lab pages build
- [ ] [AC5] Write `site/tests/lab-axe.mjs` (Playwright + axe-core, dev dependency): 0 violations on `/lab` and `/es/lab`; fix what it finds
- [ ] [AC6] Write failing test `site/tests/lab-weight.test.mjs` against the budget from PR0; make it pass
- [ ] [AC5] Screenshots at 320 and 1440 (light) of `/lab` and `/es/lab` under `specs/WEB-080/evidence/`; `verification.md` filled

## Closing

- [ ] Every acceptance criterion from `proposal.md` is covered by at least one test
- [ ] Every acceptance criterion has a matching entry in `features.json` with a non-vacuous verification command
- [ ] Type checks pass (`astro check` 0 errors)
- [ ] Lint passes
- [ ] No unrelated changes in the diff (no scope creep)
- [ ] `verification.md` filled in
- [ ] PRs opened referencing this spec folder; `adversarial-review` before `/spec archive`
