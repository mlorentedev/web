---
id: lesson-041-a-build-rendered-diagrams-width-is-set-by-it
type: lesson
status: active
created: "2026-09-04"
owner: manu
tags: [web, mermaid, astro, responsive, testing, verification]
---

# A build-rendered diagram's width is set by its rank direction, not by CSS

**Context**: The technical notes render ` ```mermaid ` fences to SVG at build time
(`@beoe/rehype-mermaid`, see `site/astro.config.mjs`). `#245` had already fixed
the *container* — the figure scrolls instead of pushing the page sideways — and
lesson [022](lesson-022-a-number-that-is-only-printed-is-never.md) recorded that
the check for it counted figures rather than measuring anything. `#244` was
still open: on a phone the diagrams were legible only as a scrollbar.

**Problem**: the overflow was not a layout defect the stylesheet could absorb.
The SVG's intrinsic width is decided by the graph itself: a `graph LR` whose
subgraphs sit side by side, or a `TB` graph with a wide fan-out of siblings,
lays every lane out horizontally and hands the page a `viewBox` of 1600–3600 px.
Scaled into a ~700 px prose column the text becomes unreadable; left at natural
size it scrolls. Measured before `#317`:

| note | diagram | rendered width |
|---|---|---|
| `network-topology-hybrid` | three ingress paths | 3573 px |
| `network-topology-hybrid` | platform topology | 1946 px |
| `headscale-self-hosted-tailscale` | WireGuard mesh | 1828 px |
| `building-a-homelab-idp` | fleet architecture | 1667 px |
| `fail-closed-agent-harnesses` | diagram 2 | 1623 px |

Nothing in the build noticed, because nothing read the number the build produced.

**Solution**: reshape the source, not the frame. Every wide diagram was rewritten
as `flowchart TD` with `direction TB` inside each subgraph, and the subgraphs that
Mermaid would otherwise place side by side were chained with invisible rank links
(`A ~~~ B`) so they stack. The widest went from 3573 px to 391 px; none is now
above 800 px. The measurement then became the guard: `site/tests/notes-diagrams.test.mjs`
walks every `dist/notes/*/index.html`, resolves each `/beoe/*.svg` it references,
parses the `viewBox` and asserts the width is at or under 1050 px, naming the
note and file when it is not.

**Rule**: when a generated artefact overflows, ask what decides its size before
reaching for `overflow-x: auto`. For Mermaid the answer is rank direction and
sibling fan-out — a scroll container hides the symptom and keeps the unreadable
text. Fix the layout in the source, then pin the property you fixed with a test
that reads the *rendered* output: the `viewBox` is the number that overflowed, so
it is the number to assert. The test lives in the ordinary `npm test` run and only
means something after `npm run build`, which CI does first (`pr-validation.yml`);
run locally without a `dist/` it walks nothing and passes — the same shape as
lesson [015](lesson-015-a-step-that-was-skipped-and-a-step-with-no.md).
