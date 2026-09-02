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
