---
tags: [spec, verification, templates]
created: "2026-08-27"
---

# Verification - WEB-080

## Evidence

> Required for the final PR: light-theme screenshots of `/lab` and `/es/lab` at **320 px** and **1440 px**, committed under `specs/WEB-080/evidence/`, plus the archify `visual-check` receipt for each diagram. Evidence for the human reviewer, not a test.


Map every acceptance criterion from `proposal.md` to concrete proof (commit hash, test name, or observed behavior).

- [x] AC1 design system measured -> `238bc41` (audit written) → `dded86b` (green whole-page) / `site/tests/lab-audit.test.mjs` — **6/6**, 5 off-token families and 3 arbitrary type sizes both to 0
- [x] AC2 diagrams from source, no horizontal scroll -> `4b36950` (pipeline) → `cd4ae24` (on the page) / `lab-diagrams.test.mjs` **6/6** + `lab-containment.mjs` **8/8** at 320/768/1440/2048 on both locales + the `visual-check` receipts under `evidence/pr2-*`
- [x] AC3 data-driven + `es` twins -> `238bc41` (manifest provenance) → `752db33` / `3932c49` (rows) / `lab-data.test.mjs` **10/10** + `astro check` **0 errors, 0 warnings, 0 hints** over 59 files
- [x] AC4 faithful migration -> `975e569` / `lab-ai-migration.test.mjs` **9/9** against the pinned fixture (kubelab `6cd9ab0ca594`) + the first-hop HEAD table in § PR5. **Amended** — see `proposal.md` AC4
- [x] AC5 no regression, 0 axe violations -> `dded86b` + `1366e2d` (cut-over, XSS fix) → `ca9faef` (axe) / `npm run build` 0 errors + `lab-axe.mjs` **0 violations on both locales, at 320 and 1440, in both console states** (43 rules at 1440, 44 at 320); `IdpPage.astro` absent; 1 `<script>`, 0 `astro-island`. **Amended** — see `proposal.md` AC5
- [x] AC6 weight budget -> `ca9faef` / `lab-weight.test.mjs` **5/5** — 103,927 B (en) and 104,490 B (es) against **150,000 B**, 69%; budget and PR0 measurements under "AC6 budget, fixed from these numbers"

## Test status

- **Test suite**: `cd site && npm test` → **94 tests, 94 pass, 0 fail** across 8 files. The two browser checks are separate because they need Chromium: `npm run test:browser` → 8/8 contained, `npm run test:a11y` → 0 violations on 8 runs (2 locales × 2 widths × 2 console states). `npm run build` → `astro check` **0 errors, 0 warnings, 0 hints** over 59 files, build clean.
- **Manual smoke test**: the reachability console driven in a real browser against the live `api.kubelab.live/health`, both locales — `4/4 healthy` / `4/4 sanos`, four component rows, the server's clock beside the visitor's, 278 ms round trip, **0 console errors** (§ PR6). Full-page screenshots at 320 and 1440 on both locales under `evidence/pr6-*`.
- **No regressions in the existing suite**: yes. It grew 62 → 79 → 89 → 94 across PR4–PR7 with no test removed and none disabled. `lab-audit` joined the `npm test` glob in PR6 and `lab-weight` in PR7, both as PR1 said they would; `lab-containment` and `lab-axe` are the browser pair, both wired into `pr-validation.yml`.
- **Non-vacuity, checked rather than assumed**: `lab-axe.mjs` returns exit 1 when the provenance link's underline is reverted in `dist/` alone, and only on the locale mutated; `scripts/diagrams.mjs verify` exits 1 on the malformed fixture and 0 on a real IR. Both in § PR7 — the second because the recorded command was vacuous until PR7 measured it.

## PR0 — the measurement that resolves Risk 2

Taken 2026-08-27 on `topology.architecture.json` (the proof-of-concept IR recovered
from #181: 8 components, 8 connections, 4,362 bytes), rendered with the archify
build vendored at `.agents/skills/archify` (v2.16.0-dev.0), `--quality showcase`.
Commands and scripts are in the PR0 commit; these are their outputs.

### What one diagram weighs

| Artifact | Bytes | gzip |
|---|---|---|
| Source IR (`topology.architecture.json`) | 4,362 | — |
| Full archify HTML artifact (`deliver`) | 705,565 | — |
| Extracted SVG, as `extractArchitectureSvg` returns it | 19,129 | 3,192 |
| CSS subset the SVG needs, archify's own palette | 3,841 | 1,262 |
| **Committed SVG as `npm run diagrams` writes it** | **21,929** | **4,076** |

`deliver` reported 9/9 checks, composition `pass`, 0 errors, 0 warnings. The
committed SVG is smaller than the sum above because the pipeline supplies one
block of theme variables from the site's tokens instead of copying archify's two
(dark base + light override).

### Four findings that shaped the pipeline

1. **The extracted SVG carries no styles at all.** It uses 29 classes
   (`c-*`, `s-*`, `t-*`, `a-*`, `m-*`) with zero `<style>` and zero `style=`:
   archify keeps geometry in the SVG and theme in the viewer's stylesheet so the
   viewer can switch themes live. Pulled out of the viewer it renders colourless.
   The stylesheet lives whole in `assets/template.html` — **791 top-level rules,
   185,582 bytes** — of which **35 rules / 2,712 bytes** target classes this SVG
   actually carries. (#181 estimated "37 rules, 2.9 KB"; that estimate was right,
   and it was the subset, not the block.)
2. **archify supports this explicitly.** `assets/template.html` says so in a
   comment: *"The variables also target a standalone exported SVG, whose root
   carries data-preset and data-theme directly."* The wrapper therefore re-anchors
   `:root,[data-theme="dark"]` to `svg` and `[data-theme="light"]` to
   `svg[data-theme="light"]`, and stamps `data-theme` on the root. **0 unresolved
   `var(--…)`** after that. The `<svg>` already carries `data-preset="classic"`.
3. **`xmlns` is absent** from the extracted SVG, as #181 found. Harmless inline in
   HTML5; fatal for a standalone `.svg` file or an `<img src>`. The wrapper adds it.
4. **Render is deterministic, including across Node majors.** Two runs on Node
   26.3.0 produced an identical artifact SHA
   (`d20c475c71732101df78bd1171d98dffa641d35e4b4aa8255cd59e373056a33a`), and Node
   22.13.1 — the version `.nvmrc` pins — produced **the same bytes**. Committed
   SVGs and CI-regenerated SVGs are therefore interchangeable on content; the
   choice is about where archify has to exist, not about churn.
5. **Rendering is deterministic across an archify version change too** (measured
   2026-08-31, closing #252). Every measurement in this document was taken against
   `2.16.0-dev.0`, an *unreleased* build, because `skills-lock.json` pins no ref —
   and the `skills` CLI has no option to pin one: `skills add <owner>/<repo>`
   always takes the default branch. Upstream has since tagged `v2.16.0`. Updating
   to it and re-rendering both diagrams produced **byte-identical output**:

   | | before (`2.16.0-dev.0`) | after (`2.16.0`) |
   |---|---|---|
   | `topology.svg` | `051910e8c9732c78…` | `051910e8c9732c78…` |
   | `flows.svg` | `013b154dbb13be51…` | `013b154dbb13be51…` |

   `git diff` reports no change; the suite stays 22/22. So the numbers above hold
   and the repository is no longer measured against an unreleased build.

   **What this does not prove** is that a *future* archify release renders the
   same, and nothing can — the tool cannot pin, and CI deliberately does not
   render (#242). What protects the site is that the SVG is **committed**: the
   build consumes bytes in git, never the renderer, and the `ir-sha256` stamp
   fails the build if the IR and the SVG stop agreeing. A drifting upstream can
   therefore change what the *next* `npm run diagrams` produces, and cannot change
   what the site ships without that showing up as a reviewable diff.

### 320 px: the diagram cannot be scaled down to fit

The IR's viewBox is 880×640. Scaled to a 320 px viewport that is a factor of
**0.364**, and the SVG's font sizes are attributes in viewBox units — 7, 8, 9, 10,
11 and 12 px:

| Authored | Projected at 320 px |
|---|---|
| 7 px (sublabel) | **2.55 px** |
| 9 px (tag) | 3.28 px |
| 12 px (label) | 4.37 px |

archify's own readability floor is 6 px projected, and its `visual-check` already
refused this diagram once at 1440–2048 for a sublabel at 5.09 px. **Nothing is
legible at 320 px if the diagram is scaled to the viewport.** Scaling to fit is
what #245 did for the mermaid diagrams, and that commit says plainly it does not
make a wide diagram readable — which is why #244 stays open.

**Resolution:** the diagram keeps a legible minimum width and scrolls inside its
own container; the *page* never scrolls sideways, which is what AC2 asserts.
Minimum width = 880 × (6 / 7) = **754 px**, the width at which the smallest
authored text reaches archify's own floor. Verified with Playwright at all four
widths in the `<figure style="overflow-x:auto">` shape:

```
320px   scrollWidth=320   innerWidth=320   overflow=no   svg=754x548
768px   scrollWidth=768   innerWidth=768   overflow=no   svg=754x548
1440px  scrollWidth=1440  innerWidth=1440  overflow=no   svg=754x548
2048px  scrollWidth=2048  innerWidth=2048  overflow=no   svg=754x548
```

## PR2 — the `visual-check` receipts say `fail`, and it is not AC2's failure

Committed as evidence: `evidence/pr2-flows.visual-check.json` and
`evidence/pr2-topology.visual-check.json`. **Both report
`containment: fail`, and both are fine.** Read past the top-level verdict:

| | topology | flows |
|---|---|---|
| `overflowX` at 1440 / 1600 / 1920 / 2048 | `false` | `false` |
| `overflowY` | `true` | `true` |
| `readabilityOk` | `true` | `true` |
| smallest projected node text | 9 px | 9 px (floor is 6) |

The failing condition is `overflowY` — **archify's own standalone viewer page is
taller than the window** (1214 px of viewer chrome, legend and dock inside a
900 px window). It is a property of the viewer, not of either diagram, and the
two diagrams behave identically, so it is not a regression introduced by the
second one.

AC2 asserts the *page* does not scroll **horizontally**, and every viewport
reports `overflowX: false`. The site never ships archify's viewer: it inlines the
extracted SVG into its own `<figure>`, and that shape is what
`site/tests/lab-containment.mjs` measures at 320, 768, 1440 and 2048. **The
receipt is evidence about the renderer; `lab-containment.mjs` is the evidence
about the page**, and only the second one is what AC2 is written against.

Recorded here rather than left for a reviewer to trip over, because a committed
artefact that says `fail` and is not a failure is exactly the thing that gets
believed later without being read.

Computed style confirmed the injected CSS applies (`.c-cloud` fill resolves to
`rgba(251, 191, 36, 0.18)`).

### AC6 budget, fixed from these numbers

Today's `/lab` ships **28,041 bytes of hand-written diagram markup** carrying
0 `<svg>`, 0 `aria`, 0 `role` (#181's baseline). Two committed SVGs cost
**43,858 bytes** raw / ~8,150 gzip and carry 30 `role`, 50 `aria-*`, 72 `<text>`.

**Budget: the built `/lab` HTML including both inline SVGs stays under 150 KB
uncompressed**, fonts excluded. Derivation: two diagrams at 21,929 B = 43,858 B,
leaving ~106 KB for five sections of markup and prose — roughly 3.8× the entire
current diagram block, against a page that is losing 449 lines of hand-written
HTML. Asserted by `site/tests/lab-weight.test.mjs` over `dist/lab/index.html`.

**The unit, settled in PR7: 150 KB means 150,000 bytes.** This document was not
self-consistent about it and nobody noticed until a test had to name a number.
The page figures recorded through PR4–PR6 — 94.6, 102.3, 103.0 — are byte counts
divided by **1024**, while the "leaving ~106 KB" in the derivation above is
decimal. The two readings differ by 3,600 bytes. `lab-weight.test.mjs` takes the
**stricter** one, 150,000, because it is the only choice that cannot leave the
guard weaker than the sentence it enforces; nothing turns on it either way, with
46 KB of headroom. Page weights are quoted in bytes from here on.

### Risk 2 resolved: CI verifies, it does not render

`#242` installed archify as an authoring-time skill and kept its 6.7 MB payload
out of git on purpose — *"Vendoring somebody else's renderer into this repository
buys nothing the lock file does not already give"* — while `#250`'s AC2 requires
a malformed IR to fail `npm run build`, which runs where archify is absent. Both
are merged; they could not both stand as written.

**Decided (Manu, 2026-08-27): CI verifies, it does not regenerate.** `#242`'s
stance survives intact. What CI needs is not the renderer but the data contract:
`vendor/archify-schemas/` holds `architecture.schema.json` + `common.schema.json`
(12 KB of declarative JSON), and `ajv` validates them as an ordinary npm
dependency pinned in the lockfile. The renderer stays in `.agents/`, restored
from `skills-lock.json`, and only a person authoring a diagram needs it.

Not rendering in CI opens one gap — an IR edited without re-rendering would ship
a page disagreeing with its own source — and `scripts/diagrams.mjs` closes it by
stamping the IR's sha256 into the generated SVG. `verify` recomputes it. Drift
becomes impossible by accident; only deliberate tampering with both files escapes,
which is not the failure mode that happens.

**AC2 is amended accordingly**: "a malformed IR fails `npm run build`" becomes
"a malformed **or stale** IR fails `npm run build`" — a strictly stronger claim
than the original, and one CI can actually make.

Proven end to end, and **not only locally** — the review asked for confirmation
in the CI environment, so each case was also run through `docker build` with the
repository's own Dockerfile (Node 22, `npm ci --include=dev`, `COPY site/ ./`):

| Case | `npm run build` | `docker build` | Message |
|---|---|---|---|
| IR replaced with the malformed fixture | **1** | **1** | `does not validate` |
| IR passing the schema with broken references | **1** | — | `has broken references` |
| IR edited, SVG not regenerated | **1** | **1** | `changed since its SVG was generated` |
| Both in sync | **0** | **0** (CI, `Build pr-251`) | 79 pages built |

### What the schema cannot check, and what was added

Review finding (Major, CodeRabbit): `common.schema.json#/$defs/id` constrains an
identifier's *shape*, not whether it resolves. Verified — an IR with a connection
to a nonexistent component, or with two components sharing an id, validated with
exit 0. Referential integrity is a relation between parts of the document, so no
JSON Schema can express it.

`topologyErrors()` now runs after schema validation over the four places that
reference a component id — `connections[].from`/`.to`, `boundaries[].wraps[]`,
`meta.views[].focus[]` — plus duplicate `components[].id`. Covered by a second
fixture, `dangling.architecture.json`, which passes the schema and fails on
references; the tests assert each fixture fails *for its own reason*, so neither
can pass by accidentally breaking the other way.

### Provenance caveat

Everything above was measured with archify **`2.16.0-dev.0`**, an unreleased
development build (upstream `HEAD` `9a50605`, 2026-08-27; latest release
`v2.15.0`). `skills-lock.json` pins no ref, so `npx skills add` fetches the
default branch, which moves. Recorded in `site/vendor/archify-schemas/README.md`
so a future mismatch is diagnosable. The committed SVG does not depend on this —
it is committed — but re-rendering on a newer archify may change its bytes, in
which case the numbers here are re-measured before the AC6 budget is trusted.

## PR3 — Services and Infra, measured on both locales

Receipt: `evidence/pr3-sections.visual-check.json`; screenshots
`evidence/pr3-{en,es}-{320,1440}.png`.

Headless Chromium against the built `dist/`, four widths × two locales:

| | 320 | 768 | 1440 | 2048 |
|---|---|---|---|---|
| `/lab` scrolls sideways | no | no | no | no |
| `/es/lab` scrolls sideways | no | no | no | no |
| service rows | 14 | 14 | 14 | 14 |
| node rows | 9 | 9 | 9 | 9 |
| `<script>` inside a rebuilt section | 0 | 0 | 0 | 0 |

**This is not the AC2 containment check.** That one is `lab-containment.mjs` over
the diagram figures, and it belongs to PR4 — the diagrams are not on the page
yet. This measures only that mounting these two sections did not make the page
scroll, and it is recorded because Spanish runs about 20% longer than English
and the 320 px column is where that would show first.

### Nine rows, not eight

`platform.nodes.length` is 9 and `cluster.activeNodes` is 8. They
disagree legitimately: one machine is on `standby`, powered down. The section
renders it dimmed and labelled rather than filtering it out, so the difference
reads as a retired node rather than as a counting error, and
`lab-sections.test.mjs` asserts against `nodes.length` with that reason in its
failure message.

### The spec's failing test was already passing

`tasks.md` budgeted PR3's red test as the row counts. Measured on the old page
before writing it: `data-service-row` already appeared **14** times and
`data-node-row` **9** — green before a line was written, the same way "the page
has 1 section" was wrong in PR1 (it had seven). Both are kept as regression
guards and recorded as guards.

What was genuinely red, and is what PR3 actually delivered: the provenance
(`generated_at` and `source_commit` appeared **0** times anywhere in the built
page), the machine-readable access boundary, the token-layer audit scoped to
these sections, and zero client JavaScript.

### AC1 progress, whole page

Still red until PR6 deletes `IdpPage.astro`, by design — but the number moved:
**677 off-token utilities → 336** on `dist/lab/index.html`. The ten families are
unchanged because the remaining five sections still use them.

## PR5 — the migration is faithful to its source, and honest about its links

`npm test` **79/79**, `npm run build` 0 errors, `npm run test:browser` green at
320/768/1440/2048 on both locales.

### AC4 as written could not be met, and the measurement is why

The criterion said the section carries "the same entries **and links**" as the
kubelab template. Every link was checked from a public path before a line of the
section was written. Seven of the thirteen are fine. The rest are not:

```
HOP1  FINAL PUBLIC-DNS       URL
404   404   140.82.112.3     https://github.com/mlorentedev/knowledge
200   200   140.82.112.4     https://github.com/mlorentedev/kubelab/blob/master/docs/adr/adr-064-agentic-observability-and-auto-triage.md
000   000   162.55.57.175    https://argo.kubelab.live
404   404   140.82.114.4     https://github.com/mlorentedev/knowledge/blob/master/00_meta/patterns/pattern-spec-driven-development.md
200   200   140.82.112.3     https://github.com/mlorentedev/kubelab/pulls
200   200   140.82.112.3     https://github.com/mlorentedev/kubelab/tree/master/docs/lessons
404   404   140.82.114.4     https://github.com/mlorentedev/kubelab/blob/master/docs/adr/adr-038-sops-age-encryption-for-secrets.md
200   200   140.82.112.3     https://github.com/mlorentedev/kubelab/blob/master/docs/adr/adr-038-secret-delivery-paths.md
302   200   162.55.57.175    https://n8n.kubelab.live  -> https://auth.kubelab.live/?rd=...
302   200   162.55.57.175    https://status.kubelab.live  -> https://status.kubelab.live/dashboard
302   200   162.55.57.175    https://grafana.kubelab.live/explore  -> https://auth.kubelab.live/?rd=...
200   200   140.82.112.3     https://github.com/mlorentedev/kubelab
```

So: **two private** (`mlorentedev/knowledge` is a private repo — a 404 for every
visitor), **one stale** (ADR-038 was renamed `adr-038-secret-delivery-paths.md`;
it 404s for everyone, the maintainer included), and **four mesh**. AC4 is amended
in `proposal.md` rather than quietly reinterpreted: faithfulness lives in
`sourceHref`, pinned and machine-checked entry by entry, and reachability became
its own assertion.

### Three ways this measurement could have lied

- **`-L` reports 200 for everything Authelia gates.** The first version of the
  check followed redirects and returned 200 for `n8n` and `grafana` — a login
  page is a perfectly good 200, it is just not the thing linked. Hence `HOP1`,
  without `-L`: the first hop is what says whether a reader arrives where the
  link claims. `FINAL` was never going to be anything but green.
- **This machine is a tailnet node** (`100.64.0.1`, `msi`), so "it works from
  here" proves nothing. DNS was resolved through `@1.1.1.1` rather than MagicDNS
  — the `PUBLIC-DNS` column — and every `*.kubelab.live` name answers
  `162.55.57.175`, a public VPS, so the route really is the public internet.
  `argo.kubelab.live` has that public A record and still answers nothing at 25 s,
  which is why it is recorded as unreachable rather than as merely gated.
- **`status.kubelab.live` returning 200 is not a public status page.** That 200
  is Uptime Kuma's admin SPA at `/dashboard`. The public surface would be
  `/status/<slug>`, and the fixture names the slug:
  `curl -s https://status.kubelab.live/api/status-page/kubelab` returns
  `{"status":"fail","msg":"Status Page Not Found"}` (404). No public status page
  exists, so the two entries pointing there are `mesh` like the rest.

### Reading the fixture without a YAML parser

`services.yaml.j2` is a Jinja template: `href` values interpolate
`{{ global.base_domain }}` (`kubelab.live`, from `infra/config/values/common.yaml`
at the same commit) and the `Nodes` group is a `{% for %}` loop. It is read
line-wise instead — the file is frozen at `6cd9ab0c`, verified on extraction by
`sha256` against the blob, so there is nothing for a line-based reader to go
stale against, and no YAML or Jinja dependency enters a frontend repo to read
80 lines.

### AC1 and AC6, whole page

| | master `a069642` | PR5 |
|---|---|---|
| off-token families | 5 (cyan, emerald, gray, purple, slate) | 5, unchanged |
| distinct off-token utilities | 21 | 21, unchanged |
| occurrences on `dist/lab/index.html` | 60 | 60, unchanged |
| page weight | 92.4 KB | 102.3 KB (`/es/lab` 102.9 KB) |

The new section is entirely inside the token layer: it adds a section without
adding an off-token utility. What remains is all in the `IdpPage.astro` markup
PR6 deletes. (Counted with `offTokenFamilies` over `dist/`; the 677 → 336 figures
in § PR3 used a different method and are **not** comparable to these.)

Weight is **102.3 KB against the 150 KB budget**, +9.9 KB for the section.

### Looked at, not only asserted

`evidence/pr5-{en,es}-{320,1440}.png`. Two things the tests could not have told me:

- **`Public` next to `open ↗` is not PR3's duplicate, and the badge stays.** It
  looks like the same defect — two elements saying one thing — but it is not.
  PR3's case was two spans both saying *there is no address*. Here the badge is
  one of three mutually exclusive states in a column every row shares, and the
  anchor is the affordance. Dropping it on the five public rows would ragged the
  column and leave "public" implied by the presence of a link rather than stated.
- **The capture itself needed three attempts, and the first two produced wrong
  images that the script reported as successes.** Element screenshots stitch the
  sticky header over the middle of the section; `fullPage` with a `boundingBox()`
  clip captures the top of the *document*, because that clip is in document
  coordinates and `boundingBox()` is viewport-relative. Both wrote a plausible
  PNG and exited 0. Fixed by sizing the viewport to the section so nothing
  scrolls and nothing sticks — worth recording because "the command succeeded"
  and "the artefact is right" came apart twice in five minutes.

### Debt found and filed

kubelab's `services.yaml.j2` on `master` still carries
`adr-038-sops-age-encryption-for-secrets.md`, so its homepage has the same dead
link. Root cause: the ADR was renamed and the template was not updated. Filed
against kubelab rather than fixed here — it is that repo's file.

Fixed in scope: `IdpPage.astro` still imported `ServiceIcon` after PR3 moved the
service rows into `LabServices.astro`, which `astro check` had been reporting as
`ts(6133)` since. One line, removed.

## PR6 — the cut-over, and the console that was measuring the wrong thing

`npm test` **89/89** (`lab-audit` now inside the glob), `npm run build` 0 errors
0 warnings, `npm run test:browser` green at 320/768/1440/2048 on both locales.
`IdpPage.astro` deleted — 357 lines, from 1,150 when the spec opened.

### AC1 is green, whole page

| | master `a069642` | PR6 |
|---|---|---|
| off-token families | 5 (cyan, emerald, gray, purple, slate) | **0** |
| distinct off-token utilities | 21 | **0** |
| arbitrary type sizes | 3 (`text-[10px]`, `[11px]`, `[12px]`) | **0** |
| page weight | 92.4 KB | 103.0 KB (`/es/lab` 103.6 KB) |
| external JS | 7,961 B | **0** — the one script inlines |

`tests/lab-audit.mjs` is renamed `lab-audit.test.mjs` and joins `npm test`, which
PR1 said would happen "the moment `lab.astro` stops composing `IdpPage.astro`".

### The console was proving that GitHub's CDN is up

Measured 2026-09-01, before touching it. Its three targets:

```
mlorentedev.github.io/pollex/   → server: GitHub.com   (GitHub Pages, edge iad)
mlorentedev.github.io/hive/     → server: GitHub.com   (GitHub Pages, edge iad)
api.kubelab.live                → HTTP 404, server: cloudflare
```

Pollex and Hive are **libraries**, published as documentation on GitHub Pages —
Manu's correction, and the DNS confirms it. `platform.json` attributed them to
node `jetson` and node `vps`. So the page said "verify my homelab", checked
GitHub's CDN, and reported success. The third target was the API's **root**,
which 404s; `mode: 'no-cors'` returns an opaque response, so the console could
not tell 404 from 200 and called that reachable too.

It also **fired all three 800 ms after load, unprompted** — every visitor's IP
reaching GitHub without being asked, on a site that had just removed GA4 for
privacy (`#105`–`#108`).

### What it reads now, and why that is a different claim

ADR-056 §4.3 says reading real status "would require CORS headers on the kubelab
side and is out of scope here". **That clause is stale.** Measured:

```
$ curl -sS -D- https://api.kubelab.live/health
HTTP/2 200
access-control-allow-origin: *
{"service":"cubelab-api","status":"healthy","checks":[
  {"component":"cache","status":"healthy","message":"Redis connection successful"},
  {"component":"database","status":"healthy",...},
  {"component":"email","status":"healthy",...},
  {"component":"external_services","status":"healthy",...}],
 "timestamp":"2026-09-02T02:13:01Z"}
```

So the console does a plain `fetch` and renders what the API said: four
subsystems with their own statuses, and **the server's clock beside the
visitor's**. That last pair is the payload `no-cors` could never deliver and the
one thing a cached response cannot fake — hence `cache: 'no-store'`.

Verified in a real browser, both locales, both widths:

```
en/320:  status="4/4 healthy" componentes=4 reloj="server · you: 08:40:31 PM · 08:40:31 PM" errores=0
en/1440: status="4/4 healthy" componentes=4 reloj="server · you: 08:40:35 PM · 08:40:35 PM" errores=0
es/320:  status="4/4 sanos"   componentes=4 reloj="servidor · tú: 08:40:39 PM · 08:40:39 PM" errores=0
es/1440: status="4/4 sanos"   componentes=4 reloj="servidor · tú: 08:40:42 PM · 08:40:42 PM" errores=0
```

Round trip 278 ms. `evidence/pr6-probe-{en,es}-{320,1440}.png`.

**Targets come from the manifest now.** Until this PR all three "public" services
carried a `healthEndpoint` equal to their own root — which is not a health
endpoint, and made the field useless for selecting anything. It is set only where
one genuinely exists, so `services.filter(s => s.healthEndpoint)` yields exactly
the API and the console cannot drift from the data the way a hard-coded list did.
The auto-run stays, and is now defensible: the one request goes to Manu's own API,
not to a third party, and it means a reader who never clicks still sees a live
result.

### The SLO grid lost a card, and that is the section working

The old grid's second card, "Edge Ingress p95", read **`~42ms`**. Grepping the
repository returns **one** hit: the markup itself. Not in `platform.json`, not in
a spec, not in a measurement. On a page whose claim is "measured, not typed",
directly above a provenance line naming the commit the figures came from, an
invented number is the most expensive thing that could be on it. It is not
carried through. An honest ingress percentile needs a producer — `#162`.

`inferenceLatency` renders as **"not measured"**, which is what the manifest
says, and is kept: a card admitting it has no number is worth more here than one
quietly inventing one.

### Copy untouched, on purpose

`context.md` records the hero wording as blocked on `#182` — the referentes audit
produced three positioning options and its output was never persisted. The hero
and story strings move from `idp.*` to `lab.*` **verbatim**. Restructuring markup
does not need that answer; rewriting sentences does.

## Decisions made during implementation

Brief log of non-obvious trade-offs or course corrections taken during the work. Routine choices belong in commit messages, not here.

- **Inline SVG, not `<img loading="lazy">`** (Risk 2's open cost). An SVG loaded
  through `<img>` exposes none of its 15 `role` / 25 `aria-*` to the
  accessibility tree — only `alt` survives — and its `<text>` is invisible to a
  `grep` over `dist/`, which is exactly the defect #244 recorded against the
  mermaid diagrams. Inline is the only mode in which AC2's accessibility payload
  is real. The weight it costs is 4,427 bytes gzipped per diagram, which does not
  move the #138 font problem.
- **Diagrams scroll inside their own container at a 754 px floor** rather than
  scaling to the viewport — see the 320 px measurement above.
- **A link is rendered only where a reader can follow it** (PR5). Six of the
  thirteen migrated entries render as a name, a description and a boundary badge
  with no anchor at all. The alternative — link everything, as AC4 literally
  asked — puts six dead ends on a public page, and a `mesh` badge beside a link
  that bounces to a login is a worse lie than no link. `sourceHref` keeps the
  migration auditable either way.
- **`lab.services.access.*` promoted to `lab.access.*`** (PR5). Two sections now
  state an access boundary, so the strings are named once rather than twice.
  `private` is new; `public` and `mesh` moved, and `LabServices.astro` reads the
  moved keys. Same one-name-per-concept reason as `#261`.
- **The `urlNote` field is data, not copy.** It records why one link departs from
  its source, and nothing renders it: it is a maintainer's note in one language,
  and every string this page shows has an `es` twin.

## PR7 — the two checks the spec asked for, and what the first of them found

Measured 2026-09-01. Commits `ca9faef` and `12fdbba`.

### axe was red, and none of the three findings were cosmetic

Run before writing the test, per lesson-023 — this spec has twice budgeted a red
driver that was already green. This time it was genuinely red: **3 violations,
8 nodes, identical on `/lab` and `/es/lab` and identical in both console states.**

| rule | impact | nodes | what it actually was |
| --- | --- | --- | --- |
| `nested-interactive` | serious | 2 | 17 phantom buttons inside the diagrams |
| `color-contrast` | serious | 5 | `opacity-60` on the standby row (×3), `ink-400` at 12 px (×2) |
| `link-in-text-block` | serious | 1 | the provenance commit hash, told apart by colour alone |

**`nested-interactive` is the one worth reading twice.** archify emits every
component `<g>` as `tabindex="0" role="button" aria-pressed="false"
aria-label="Focus <node>, …"`. In archify's own viewer that is a real control:
it ships the script that focuses a node and toggles `aria-pressed`. This page
ships **exactly one script and it is the console** — AC5 as amended — so on the
built page those 17 `<g>`s were buttons that press nothing. And they sit inside
`role="img"`, whose subtree is *presentational*: their labels were never
announced, while `tabindex` kept every one of them in the tab order. A keyboard
user tabbed through seventeen stops that said nothing and did nothing, between
the caption and the next section. **37 focus stops on the page, 20 of them real.**

It is exactly the defect class PR4 hit with the duplicate ids: invisible on
screen, and the markup reads as *more* accessible, not less. Nothing before an
axe pass could have found it.

Stripped in `LabDiagram.astro`, beside the id namespacing and with the same
self-enforcing shape — `assertViewerAffordancesGone` refuses to render a diagram that
can still be tabbed into, so a future archify that makes a node focusable some
other way fails the build instead of quietly restoring this. Done at render
rather than in `scripts/diagrams.mjs generate` because the SVGs are committed and
CI only verifies their `ir-sha256`: fixing it in the generator would need archify
present to re-render and would make the file on disk differ from what archify
produces. The page carries the constraint, so the page applies it.

The `aria-label`s go with them rather than being reworded. Rewriting
`"Focus gcp1, Argo CD hub"` down to `"gcp1, Argo CD hub"` was the first attempt,
and axe answered with **17 `aria-prohibited-attr`**: with `role="button"` gone, a
bare `<g>` has no role that permits a name. It was inert either way — pruned by
`role="img"` — so what it really was is markup that reads as per-node
accessibility the page does not have. The diagram is named by `aria-labelledby` →
`<title>`, which is what `lab-sections.test.mjs` asserts and what is left standing.
Page-level `aria-*` inside the two SVGs: 25/28 → **9/10**, all of it load-bearing.

**Both contrast findings were mechanisms, not decisions.** `opacity-60` on the
standby infra row composited `ink-500` to #a6aab3 (**2.32:1**) and `ink-600` to
#9399a1 (**2.87:1**), against a 4.5:1 floor — so the one row that exists to be
*read*, because it explains why `activeNodes` is 8 and `nodes.length` is 9, was
the least readable thing in the section. Opacity was never available there:
`ink-500` measures **4.83:1** at full strength, so any value under ~0.97 fails.
PR3's decision holds — the machine is still shown and still labelled — and the
row is now set apart by a tinted ground (`ink-500` on `ink-50` = **4.63:1**),
which also stops dimming the two things that were never the point, the machine's
name and its status dot. The diagram source line moved `ink-400` (**2.53:1** at
12 px) to `ink-500`. `link-in-text-block` was the provenance hash: `accent-700`
is 4.9:1 on white and perfectly readable, but **1.1:1 against the `ink-500` prose
it sits in**, with no underline — so on the one line that offers to prove the
page's central claim, nothing told a reader who cannot separate teal from grey
that the hash was a link. Underlined.

**And the fourth finding is the other half of the first.** Below the 754 px
legibility floor the diagram scrolls inside its container (PR4's design, and what
`lab-containment` asserts). A scroll container that no keyboard can reach is a
diagram whose right-hand half does not exist for anyone not using a mouse — and
the rule **passed before the strip, by accident**, because the 17 fake buttons
counted as "focusable content". So the page went from *reachable only by tabbing
through seventeen controls that announce nothing* to *not reachable at all*, and
neither state was ever right. The container is now one real stop: `tabindex="0"`,
`role="group"` (not `region`, which would add a landmark per diagram) and a name
that says what it is and which diagram it belongs to, with a token focus ring.
**37 focus stops → 22, and the two that remain scroll something.**

After: **0 violations on both locales, at both widths, in both console states** —
43 rules passed at 1440 and 44 at 320, the extra one being the scrollable-region
rule that only applies where something scrolls.

### The one thing axe could not decide, left visible

79 `color-contrast` results come back `incomplete`: the `<text>` nodes inside the
diagrams, where the background is SVG geometry rather than a CSS colour and axe
cannot compute a ratio. That is a limit of automated checking — not a pass, not a
failure. The check **prints the count on every run instead of filtering it out**,
because a check that hides what it could not decide is making a claim it did not
earn. The diagram palette is covered instead by the token audit (AC1) and by
PR4's rendered screenshots.

### Two things that make the pass mean something

Both answer the failure this spec has already hit twice — a command exiting 0
having measured the wrong thing (§ PR6, the screenshots).

1. **It proves the run happened.** A 404 and an axe bundle that never injected
   both yield `violations: []`, indistinguishable from a clean page. So the HTTP
   status is asserted and `passes` must be non-empty: a page axe never looked at
   cannot have passed 43 rules. The axe bundle is resolved from the test file
   rather than the working directory, for the same reason `serve.mjs` resolves
   `dist/` that way — a check that only works when invoked from `site/` will one
   day be invoked from elsewhere and report a clean page it never audited.
2. **It pins the console's response.** The console fetches
   `api.kubelab.live/health` on load and paints `ok-400` rows on success,
   `warn-400` on failure — different colours, so a contrast verdict computed
   against the live API would depend on whether Manu's VPS is up, which CI has no
   business asking. The route is fulfilled from a fixture and each locale is
   audited **twice, healthy and degraded**, so both colour paths are covered.

Verified non-vacuous rather than assumed: reverting the link underline **in
`dist/` alone** returns exit 1, and only on the locale mutated.

```
✗ /lab @ 1440px [healthy] — 1 violation(s):
    SERIOUS link-in-text-block: Links must be distinguishable without relying on color (1 node(s))
✗ /lab @ 1440px [degraded] — 1 violation(s): …
✓ /es/lab @ 1440px [healthy] — 0 violations, 43 rules passed, 79 result(s) axe could not decide
✓ /es/lab @ 1440px [degraded] — 0 violations, 43 rules passed, 79 result(s) axe could not decide
exit=1
```

### AC6: green on arrival, and that is the point

`lab-weight.test.mjs` passed the moment it was written — 103,927 B (en) and
104,490 B (es) against 150,000 B, **69%, 46 KB of headroom**. It is written
anyway because AC6 asks for the tension with `#138` to be visible in CI rather
than discovered later, and because the next person to inline a diagram should
find out from a failing test rather than from a Lighthouse run. The unit
ambiguity it forced is settled above.

The page got *lighter* in this PR despite gaining a fix: 105,472 B → 103,927 B.
The strip removed 1,901 bytes of `tabindex`, `role="button"`, `aria-pressed` and
dead labels; the focusable scroll container added 356 back.

### A verification command that was asserting nothing

`features.json` recorded AC2's negative case as
`! node scripts/diagrams.mjs tests/fixtures/malformed.architecture.json`. It
exits 1 — but on a **usage error**, because the `verify` subcommand is missing,
so the file is never opened. Measured: a path that does not exist scores
identically, and so would a perfectly valid IR. The `!` then turned that into a
pass. Corrected to `… verify tests/fixtures/malformed.architecture.json`, which
exits 1 with `does not validate`, and the positive case
(`verify src/diagrams/topology.architecture.json` → exit 0) added beside it so
the pair discriminates in both directions. This is what the Closing checklist's
"non-vacuous verification command" is for; it only surfaced because PR7 ran every
command in the file verbatim instead of trusting it.

### Housekeeping

`serveDist()` moved from `lab-containment.mjs` to `tests/lib/serve.mjs` when
`lab-axe.mjs` became the second browser check to need it — the same split PR3
made for `tests/lib/audit.mjs`, and for the same reason. `test:a11y` wired into
`pr-validation.yml` beside `test:browser`; the Chromium install the job already
does for the diagram renderer covers both.

## Promotion candidates

Before archiving, flag what (if anything) should be promoted to the vault. If all three are "no", archive in repo is the only persistence.

- [x] Lesson for the repo's `docs/lessons/`? **Yes — its own PR, following `#265`.** Five, in the order they cost time: (1) *a generated artefact carries its generator's interaction model* — archify's per-node buttons are correct in archify's viewer and are 17 dead tab stops on a page with no script, and this is the same defect class as PR4's un-namespaced ids, so the consumer of a generated artefact owns what it does in the consumer's context; (2) *a link check with `curl -IL` reports 200 for every Authelia-gated host*, because a login page is a perfectly good 200 — check the first hop, and pin DNS when the checking machine is a tailnet node; (3) *a handoff's "already committed" must be verified before building on it* — PR5's fixture was not there; (4) *an acceptance criterion written for content that lives behind the mesh cannot be met verbatim on a public page* — audience is part of a spec; (5) *a recorded verification command can assert nothing and still exit the right way* — AC2's negative case exited 1 on a usage error for five PRs.
- [ ] ADR-worthy decision for the repo's `docs/adr/adr-XXX.md`? **No new ADR here — one amendment owed elsewhere.** kubelab's ADR-056 §4.3 says reading real status "would require CORS headers on the kubelab side and is out of scope"; `api.kubelab.live/health` has served `access-control-allow-origin: *` for some time and the console now reads it, so that clause is stale. It is a kubelab file, so it is a kubelab change (§ PR6).
- [ ] New pattern candidate for `00_meta/patterns/`? **Flagged, not claimed.** "A generated artefact carries its generator's assumptions into every consumer" now has two instances *inside this one spec* (ids, affordances) but only one project. It becomes a pattern the first time it recurs somewhere that is not the Lab; until then the repo lesson is the right home. Curator's call, not this spec's.

## Archive checklist

- [ ] `proposal.md` frontmatter set to `status: archived`
- [ ] Folder moved: `specs/WEB-080/` -> `specs/archive/WEB-080/`
- [ ] Bitácora board ticket for this spec moved to Done / closed with PR link (ADR-018)
- [ ] Promotions above executed (if any)
