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

- [x] Branch created from master: `feat/web-080-lab-data` (worktree `web-web080-wt`). The original `feat/web-080-lab-redesign` carried PR #250 and was squash-merged and deleted with it; each PR since branches from master afresh.
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
- [x] **[AC1] Semantic colour mapping decided** (2026-08-31, Manu): **no category may claim `warn` or `danger`** — those stay reserved for real status. `cloud` left amber and `security` left rose, which had been rendering the healthy DNS gateway as broken and every cloud host as a warning. Five families for seven types, so two pairs share one at different shades, both pairings meaning something: `frontend`+`messagebus` on `accent` (both carry traffic in), `cloud`+`external` on `panel` (both are "not our Kubernetes"). `messagebus` left `observe`, where it had been colliding with `database` for no reason. **Residual, stated rather than hidden:** cloud, security and external are three neutrals and only their icons make them unmistakable; spending `observe` or `ok` on one is the lever if it proves too subtle. Verified by rendering the extracted SVG under the site's own tokens — archify's viewer uses archify's palette and cannot show this

### PR1 — data layer and the test harness (AC3, AC1 scaffolding)

- [x] [P] [AC3] Write failing test `site/tests/lab-data.test.mjs`: `platform.json` has `generated_at` and `source_commit`; `platform.ts` exposes them typed; every `lab.*` key in `i18n/ui.ts` exists in both `en` and `es`; **and every visible data field has its `es` twin** — `descriptionEs`/`categoryEs` in `platform.ts` today, `lab-ai.ts` from PR5 — with the identifier exception of proposal What §5. **Written over every namespace, not `lab.*`**: no key is called that yet (the page's strings are still `idp.*`, 161 keys), so a `lab.*`-scoped twin test would be vacuous on the very PR that introduces it. The twin pairs on the data are derived from the entries rather than hard-coded, so a new translatable field is covered the day it appears. 10/10 green
- [x] [AC3] Add `generated_at` + `source_commit` to `platform.json`/`platform.ts` (typed, printed by the page in PR3). Values are honest rather than invented: the manifest still carries the content written by `df583db` (#179, 2026-08-24), the last commit to change it — `c8d4d7e` only renamed the file. **`snake_case` against this file's `camelCase` is deliberate**: they are #162's producer contract, and the spec names them
- [x] [AC1] Write failing test over `dist/lab/index.html`: hued families ⊆ {accent, ink, panel, ok, warn, danger, observe} (`white`/`black`/`transparent`/`current` allowed as hue-less neutrals — the **same allowlist as AC1**, now exported from `src/theme/tokens.mjs` and consumed by both `tailwind.config.mjs` and the test, so there is genuinely one), zero `text-\[\d+px\]`, ≥ 5 `<section` **each containing a `SectionHeading` eyebrow**
  - **Filed as `tests/lab-audit.mjs`, not `lab-audit.test.mjs`** — out of the `npm test` glob until PR6, exactly as PR0 did with `lab-containment.mjs`. Five PRs of red CI is the signal-destroying failure of lesson-019; it runs on demand with `npm run test:audit` and joins the glob when `lab.astro` stops composing `IdpPage.astro`
  - **Measured red on today's page**: 10 hued families outside the token layer (amber, blue, cyan, emerald, gray, purple, rose, slate, teal, yellow) and 3 arbitrary type sizes in 154 places. **The "1 section" in this spec was wrong** — the page already has 7 `<section>`s, each with its eyebrow, so that third check passes today and guards the rebuild instead of driving it
- [x] (housekeeping) `test` / `test:browser` scripts landed in PR0 — note that **`node --test tests/` does not work on Node 26** (it resolves the directory as a module); the script uses the glob `node --test "tests/*.test.mjs"`, which works on 22 and 26. **`test` job added to `pr-validation.yml`**: checkout, `setup-node` from `.nvmrc`, `npm ci`, then **`npm run build` before `npm test`** — the audit and weight tests read `dist/`, which the Docker build never exposes, and the build step also brings `astro check` and the `prebuild` diagram verification into CI as their own signal

### PR2 — second diagram + captions (AC2, AC3)

- [x] [AC2] Author `site/src/diagrams/flows.architecture.json` through the PR0 pipeline; receipts committed under `evidence/pr2-*.visual-check.json`. **Scoped to the delivery path this repo can prove** — `release.yml` and ADR-055, one push → one multi-arch image → `repository_dispatch` → staging overlay → Argo CD, and the release re-tagging that same digest for prod. archify's linter rejected the first layout for an edge crossing three unrelated nodes; the grid was reorganised so the semver path runs straight down the right-hand column. 26,419 B / 4,608 gzip. **Both receipts read `containment: fail` and neither is one** — the failing condition is `overflowY` of archify's own viewer page, `overflowX` is false at every width and readability is 9 px against a 6 px floor; `verification.md` explains it
- [x] [AC3] `<figcaption>` and legend strings for both diagrams in `ui.ts`, EN and ES — the **first four `lab.*` keys**, which is the namespace the rest of the page moves to in PR6. Twin test green (22/22). The prose that Risk §1 keeps out of the SVG lives here: verified that the extracted SVG carries only node labels, tags and one- or two-word edge labels — archify's `cards` stay in the viewer HTML and never reach it, so the two longest edge labels were shortened to match topology's register (`dispatch`, `same digest`)

### PR3 — Services and Infra sections (AC1, AC3)

- [ ] [AC3] Write failing test: the built `/lab` lists exactly `platform.json.services.length` service rows and `nodes.length` node rows, and prints `generated_at` + `source_commit`
- [ ] [AC1] [AC3] Build `LabServices.astro` and `LabInfra.astro` on `Section`/`SectionHeading` + tokens, rendering from `platform.ts`; access boundaries per service explicit; EN+ES prose in the FAQ register (writing task, budgeted here)
- [ ] [AC1] `lab-audit` green for the families and sizes these two sections emit

### PR4 — Topology and Flows sections (AC1, AC2)

- [ ] [AC2] `LabTopology.astro` / `LabFlows.astro` embed the generated SVGs the way PR0 decided, with the PR2 captions; `lab-containment` green at all four widths — now enabled in CI
- [ ] [AC1] EN+ES prose for both sections; `lab-audit` still green
- [ ] **[AC2] Decide what happens to the `tag` line.** Found in PR2: every component's `tag` is present as `<text>` in the extracted SVG (`Conventional Commits`, `sha-abc1234`, `no rebuild`, `K3s, 1 node`, `no K8s`…) and **does not render in archify's viewer**, on both diagrams. So no `visual-check` receipt has ever shown it, and embedding the SVG may put a third line on every node that nobody has reviewed. Look at the page before writing the prose: either the tags earn their place, or they come out of the IRs. Whichever way, re-measure against AC6 — the text is already in the bytes either way

### PR5 — AI & Automations migration (AC4)

- [ ] [P] [AC4] Write failing test `site/tests/lab-ai-migration.test.mjs`: `site/src/data/lab-ai.ts` carries the four groups (Agents, Protocols, Workflows, Telemetry) with the same entry count and URLs as kubelab `infra/k8s/base/services/homepage-templates/services.yaml.j2` at commit `6cd9ab0ca5948297281b6d53798db97c562ea431` — the file at that commit is committed as the test fixture `site/tests/fixtures/services.yaml.j2` so the comparison never moves
- [ ] [AC4] Migrate the data (bilingual descriptions; links verified with a HEAD request script, output pasted in `verification.md`) and build `LabAutomations.astro`

### PR6 — cut over and delete (AC5, AC6)

- [ ] [AC5] `lab.astro` / `es/lab.astro` compose the five sections; `IdpStrip.astro` reads from `platform.ts`; delete `IdpPage.astro`; both landings and both Lab pages build
- [ ] [AC5] Write `site/tests/lab-axe.mjs` (Playwright + axe-core, dev dependency): 0 violations on `/lab` and `/es/lab`; fix what it finds
- [ ] [AC6] Write failing test `site/tests/lab-weight.test.mjs` against the budget from PR0; make it pass
- [ ] [AC5] Screenshots at 320 and 1440 (light) of `/lab` and `/es/lab` under `specs/WEB-080/evidence/`; `verification.md` filled
- [x] **[AC1] Arbitrary-colour hole closed** (done ahead of PR6, 2026-08-31). It matched utilities that *name a Tailwind palette colour*, so `text-red-500` is caught and **`bg-[#7c3aed]` is not** — an arbitrary hex sails through the check whose whole point is that the page uses the token layer. Left open deliberately in PR1: hardening a test CI does not yet run would have reopened a review window for nothing. It stops being deliberate the moment the file is renamed to `lab-audit.test.mjs`. `colourEscapes()` now catches `[#hex]`, `rgb(`, `rgba(`, `hsl(`, `hsla(`, `oklch(`, `lab(` and `color(`, and is exported so a fixture test proves it fires — four values it must catch, four arbitrary non-colours (`text-[10px]`, `w-[754px]`, `grid-cols-[1fr_auto]`) it must not. Green on today's page, which uses named palette colours rather than raw values

## Closing

- [ ] Every acceptance criterion from `proposal.md` is covered by at least one test
- [ ] Every acceptance criterion has a matching entry in `features.json` with a non-vacuous verification command
- [ ] Type checks pass (`astro check` 0 errors)
- [ ] Lint passes
- [ ] No unrelated changes in the diff (no scope creep)
- [ ] `verification.md` filled in
- [ ] PRs opened referencing this spec folder; `adversarial-review` before `/spec archive`
