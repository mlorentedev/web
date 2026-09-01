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

- [x] [AC3] Write failing test — `site/tests/lab-sections.test.mjs`, **in the `npm test` glob**, over both locales. 18 red / 3 green. It is in CI where `lab-audit.mjs` is not, because it judges only the sections actually rebuilt (`data-lab-section="<name>"`, `REBUILT` grows per PR), so it goes green with its own PR instead of staying red until PR6
  - **The counts this spec budgeted as the driver were already green.** Measured 2026-09-01 on the old page: `data-service-row` appears **14** times and `data-node-row` **9** — exactly `services.length` and `nodes.length`. Same mistake as "the page has 1 section" in PR1, kept for the same reason: it guards the rebuild against regression, but nobody should read it passing as evidence PR3 did anything
  - **What was genuinely red**: nothing printed `generated_at` or `source_commit` anywhere (0 occurrences), no machine-readable access boundary, the token-layer audit, and zero JS
  - **`nodes.length` (9), never `cluster.activeNodes` (8).** They differ legitimately — one node is `standby` — so a page rendering `activeNodes` rows would hide it and the test would bless it. Asserted with that reason in the failure message
  - Also split the pure parsing into `tests/lib/audit.mjs`, imported by both suites. `lab-audit.mjs` calls `test()` at the top level, so importing a helper from it would have **re-registered its red assertions inside the importing suite** and turned CI red from an `import`. The fixture tests for the guards moved to `audit-helpers.test.mjs`, which is a net gain: they now run in CI, where `test:audit` never did
- [x] [AC1] [AC3] Build `LabServices.astro` and `LabInfra.astro` on `Section`/`SectionHeading` + tokens, rendering from `platform.ts`; access boundaries per service explicit; EN+ES prose in the FAQ register (writing task, budgeted here). Plus `LabProvenance.astro` — the first thing to render PR1's `generated_at`/`source_commit`
  - **Static, no tabs.** `proposal.md` Out of scope rules it: "This spec delivers layer 0: **static at build, zero JS**." The old section carried four filter tabs over 14 rows and one of them (Staging) matched nothing — `env` only ever holds `common` or `prod`. Grouping by category at build time says the same thing without a script; `initServiceTabs`/`initNodeTabs` deleted with the markup they drove
  - **Access is not status.** `public` takes `accent` (a link you can follow) and `mesh` takes the neutral `panel`; `ok`/`warn`/`danger` stay reserved for real status, per the #251 mapping. A private service is not a degraded one
  - **Infra density decided with Manu (2026-09-01)**: name, role, and one spec line of `runtime · arch · cpu · ram · location`. `summary`, `os`, `storage` and `provider` come out — twelve fields do not fit at 320 px. The standby node renders dimmed and labelled rather than filtered, which is what makes `activeNodes` (8) ≠ `nodes.length` (9) legible instead of looking like an error
  - **Found by looking at the render, not by a test**: every mesh row carried `Mesh only` *and* `No public address` — the same sentence twice, on eleven of fourteen rows. The badge is the whole statement; the second span and its i18n key are gone
- [x] [AC1] `lab-audit` green for the families and sizes these two sections emit — enforced by `lab-sections.test.mjs` scoped to `data-lab-section`, 21/21 on both locales. Whole-page `lab-audit` is still red by design (PR6), but measurably less so: **677 off-token utilities → 336**
- [x] [AC2 pre-check] Page does not scroll sideways at 320 px or 1440 px with the new sections mounted (`document.documentElement.scrollWidth > innerWidth` false at both). The full four-width containment check stays PR4's

### PR4 — Topology and Flows sections (AC1, AC2)

- [x] [AC2] **One `LabDiagram.astro`, used twice**, not the `LabTopology`/`LabFlows` pair budgeted here: they differ only by which file they read and which strings they use, and two files that must stay identical are the drift `Section`/`SectionHeading` were extracted to stop. Both SVGs inline, with the PR2 captions. `lab-containment` **green at all four widths on both locales and enabled in CI**
  - **Two SVGs on one page collide, and PR0 could not have seen it.** archify namespaces nothing: every diagram uses `id="0"`, `id="arrowhead"`, `id="archify-diagram-title"` and one id per component. Inlining two gave the document duplicate ids throughout, `url(#arrowhead)` in the second resolving into the first, and **both `aria-labelledby` targets pointing at the topology diagram's title** — a screen reader announcing the wrong diagram's name. It looks fine, which is what makes it the kind of defect that ships. `namespaceIds()` prefixes every id and every reference at build time; **0 duplicate ids on the built page**, asserted
  - **`readFileSync(new URL(…, import.meta.url))` works in `dev` and fails the build** — `import.meta.url` resolves to the *bundled* chunk, so it went looking for `dist/diagrams/generated/topology.svg`. Vite's `?raw` import instead, which also makes the SVG a known dependency so editing one invalidates the cache
  - **`lang="en"` stays on the SVG on both locales.** Not an oversight: Risk §1 keeps identifiers inside and prose outside, so marking the subtree `en` is what makes a screen reader pronounce `Traefik` and `sha-abc1234` as English on the Spanish page
- [x] [AC1] EN+ES prose for both sections; `lab-audit` still green — 62/62 in `npm test`
  - **The topology caption contradicted the Infra section, two screens apart.** It said "Eight machines" while Infra says nine. The diagram has eight components because the ninth is powered down and not drawn; the caption now says that instead of disagreeing. **Found by looking at the page, not by a test**
- [x] **[AC2] `tag` line: KEPT.** Rendered both extracted SVGs under the site's own tokens — the only way to see it, since archify's viewer uses archify's palette. It renders as a light third line and earns its place: on topology it carries the diagram's central claim (`K3s, 1 node` vs `no K8s`), on flows it carries ADR-055's (`one digest`, `no rebuild`). **Two of nine flows nodes had no tag**; filled (`needs a PAT`, `merged by hand`) — the second documents the staging gate that this session found the hard way
- [x] **[AC1] Three greys on topology, fixed by re-typing rather than re-colouring** (Manu, 2026-09-01). PR2 recorded "cloud, security and external are three neutrals" as a residual with "spend `observe` or `ok`" as the lever. Rendered, it was 5 of 8 nodes indistinguishable — but the typing was the error: RPi3 runs Uptime Kuma and the Jetson runs local inference, so neither is `external`, and RPi4 is the gateway traffic passes through, not a security appliance. `rpi3`/`jet` → `backend`, `rpi4` → `messagebus`. Grey now means exactly one thing, "rented cloud", and the legend went from 6 entries to 4. **No palette change; the residual is closed rather than deferred**
- [x] **[AC6] Re-measured after keeping the tags**: `topology.svg` 21,340 B / 3,957 gzip, `flows.svg` 26,261 B / 4,537 gzip, 47,601 B inline. Built page **94,630 B (en) / 95,100 B (es) against the 150 KB budget — 63%, 55 KB of headroom**, and PR6 still deletes `IdpPage.astro`
- [x] **`lab-containment.mjs` fixed twice while enabling it.** It required a server already listening on :4321 and reported eight connection refusals as eight containment failures — it now serves `dist/` itself. And its "scrolling internally" counter looked at `<figure>` rather than the scroller, so it printed **0 at 320 px**, which cannot be true of a 754 px diagram in a 320 px viewport. The number was decoration nobody questioned; it is now counted on the right element **and asserted** — below the floor, every diagram must scroll or the check fails
  - Caught a real defect immediately: `min-w-[754px]` sat on a padded wrapper, so `p-3` took 24 px off and the diagram rendered at **730 px**, under the legibility floor, at 320 and 768 on both locales. The floor belongs on the SVG, not on its container

### PR5 — AI & Automations migration (AC4)

- [ ] [P] [AC4] Write failing test `site/tests/lab-ai-migration.test.mjs`: `site/src/data/lab-ai.ts` carries the four groups (Agents, Protocols, Workflows, Telemetry) with the same entry count and URLs as kubelab `infra/k8s/base/services/homepage-templates/services.yaml.j2` at commit `6cd9ab0ca5948297281b6d53798db97c562ea431` — the file at that commit is committed as the test fixture `site/tests/fixtures/services.yaml.j2` so the comparison never moves
- [ ] [AC4] Migrate the data (bilingual descriptions; links verified with a HEAD request script, output pasted in `verification.md`) and build `LabAutomations.astro`

### PR6 — cut over and delete (AC5, AC6)

- [ ] [AC5] `lab.astro` / `es/lab.astro` compose the five sections; `IdpStrip.astro` reads from `platform.ts`; delete `IdpPage.astro`; both landings and both Lab pages build
- [ ] [AC5] Write `site/tests/lab-axe.mjs` (Playwright + axe-core, dev dependency): 0 violations on `/lab` and `/es/lab`; fix what it finds
- [ ] [AC6] Write failing test `site/tests/lab-weight.test.mjs` against the budget from PR0; make it pass
- [ ] [AC5] Screenshots at 320 and 1440 (light) of `/lab` and `/es/lab` under `specs/WEB-080/evidence/`; `verification.md` filled
- [x] **[AC1] Arbitrary-colour hole closed** (done ahead of PR6, 2026-08-31). It matched utilities that *name a Tailwind palette colour*, so `text-red-500` is caught and **`bg-[#7c3aed]` is not** — an arbitrary hex sails through the check whose whole point is that the page uses the token layer. Left open deliberately in PR1: hardening a test CI does not yet run would have reopened a review window for nothing. It stops being deliberate the moment the file is renamed to `lab-audit.test.mjs`. `colourEscapes()` now catches `[#hex]`, `rgb(`, `rgba(`, `hsl(`, `hsla(`, `oklch(`, `lab(` and `color(`, and is exported so a fixture test proves it fires — six values it must catch — including Tailwind's `[color:…]` type hint, which names a colour without containing one — and four it must not: one token utility (`bg-accent-700`) and three arbitrary non-colours (`text-[10px]`, `w-[754px]`, `grid-cols-[1fr_auto]`). Green on today's page, which uses named palette colours rather than raw values

## Closing

- [ ] Every acceptance criterion from `proposal.md` is covered by at least one test
- [ ] Every acceptance criterion has a matching entry in `features.json` with a non-vacuous verification command
- [ ] Type checks pass (`astro check` 0 errors)
- [ ] Lint passes
- [ ] No unrelated changes in the diff (no scope creep)
- [ ] `verification.md` filled in
- [ ] PRs opened referencing this spec folder; `adversarial-review` before `/spec archive`
