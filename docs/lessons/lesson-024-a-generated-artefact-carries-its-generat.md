---
id: lesson-024-a-generated-artefact-carries-its-generat
type: lesson
status: active
created: "2026-09-01"
owner: manu
tags: [web, svg, accessibility, astro, WEB-080]
---

# A generated artefact carries its generator's interaction model, not just its content

**Context**: WEB-080 PR7 ran axe-core over `/lab` for the first time. The page had
already been through six PRs, a design-system audit, a containment check at four
widths, a bilingual twin test and a whole-page token audit. All green.

**Problem**: axe reported `nested-interactive`, serious, on both diagrams.
archify emits every component as

```html
<g id="topology-node-gcp" tabindex="0" role="button" aria-pressed="false"
   aria-label="Focus gcp1, Argo CD hub, Always-on cloud">
```

That is *correct* markup — **in archify's own viewer**, which ships the script
that focuses a node and toggles `aria-pressed`. This page ships exactly one
script and it is the reachability console, so on the built page those seventeen
groups were **buttons that press nothing**.

Worse than useless. They sit inside `role="img"`, whose subtree is
*presentational*: every one of those `aria-label`s was pruned from the
accessibility tree and never announced — while `tabindex` kept all seventeen in
the tab order. A keyboard user tabbed through seventeen stops that said nothing
and did nothing, between the caption and the next section. Measured: **37 focus
stops on the page, 20 of them real.**

The page looks perfect. The markup reads as *more* accessible than the average
page, not less. Nothing in six PRs of checks could see it, because every check
asked whether the SVG carried `role` and `aria-*` — and it carried plenty.

**Solution**: strip the viewer's affordances at build, beside the id namespacing
that `lesson-021` added, and assert the strip did its job:

```ts
function stripViewerAffordances(svg: string): string {
  return svg
    .replace(/\s+tabindex="[^"]*"/g, '')
    .replace(/\s+role="button"/g, '')
    .replace(/\s+aria-pressed="[^"]*"/g, '')
    .replace(/\s+aria-label="Focus [^"]*"/g, '');
}
```

Two details that cost time and are worth carrying:

- **Rewriting the label instead of removing it was wrong.** Trimming
  `aria-label="Focus gcp1, …"` down to `"gcp1, …"` seemed conservative and axe
  answered with **17 `aria-prohibited-attr`**: with `role="button"` gone, a bare
  `<g>` has no role that permits a name. The label was inert either way. What it
  really was is markup that reads as per-node accessibility the page does not
  have.
- **The generator's next version will change the wording.** The strip matches
  `"Focus …"`; a future `"Select …"` leaves the label behind. That regression is
  *quieter* than the original, because axe reports `aria-prohibited-attr` as
  `incomplete` and a check that fails only on violations would not catch it. So
  `assertViewerAffordancesGone()` fails the **build** if any `aria-label`
  survives on a descendant. Proven by execution, not by reading: pointing the
  strip at a wording archify does not use fails with the eight surviving labels
  named.

Review suggested widening the rewrite to `aria-label="[^"]*"` instead. Declined,
and the reason generalises: **a blanket rewrite would one day silently eat a name
the generator adds for a good reason.** Assert the assumption; do not widen the
rewrite.

**Takeaway**: when you inline someone else's generated artefact, you inherit
three things — its content, its identifiers (`lesson-021`) and **its interaction
model**. The third is the one nobody checks, because it is invisible on screen
and it looks like quality. Ask what the artefact assumes about its host: what
scripts run, what roles wrap it, what the user can do. Where the host does not
honour those assumptions, the markup is not merely unused — it is a claim the
page cannot back, which on a page whose premise is "measured, not typed" is the
expensive kind of wrong.

**Related**: `lesson-021` (the same generator, its ids), `lesson-028` (fixing
this one exposed a second violation that had been passing by accident),
`lesson-019` (a guard nobody proves fires).
