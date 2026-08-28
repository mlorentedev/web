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
