---
id: lesson-021-an-svg-generator-that-namespaces-no-ids
type: lesson
status: active
created: "2026-08-31"
owner: manu
tags: [web, svg, accessibility, astro, WEB-080]
---

# An SVG generator that namespaces no ids is fine until you embed two of its outputs

**Context**: WEB-080 PR4 put both generated architecture diagrams on `/lab` as
inline SVG. PR0 had measured one diagram end to end — bytes, `role`, `aria`,
`<text>` counts, the 320 px legibility floor — and found nothing wrong.

**Problem**: archify namespaces nothing. Every diagram it generates reuses the
same identifiers:

```
id="0"  id="1"  id="arrowhead"  id="arrowhead-dashed"  id="arrowhead-emphasis"
id="archify-diagram-title"  id="archify-diagram-description"  … plus one per component
```

Inline two of them and the document has duplicate ids throughout. Three
consequences, in increasing order of how long they take to notice:

1. Invalid HTML.
2. `url(#arrowhead)` in the second diagram resolves into the **first** diagram's
   marker. Here both markers happen to look identical, so nothing changes
   visually.
3. **Both `aria-labelledby` attributes resolve to the first diagram's
   `<title>`** — so a screen reader announces "Eight machines, three Kubernetes
   clusters" for the delivery-pipeline diagram.

The page renders perfectly. Nothing in the build complains. The only symptom is
one a sighted reviewer cannot see, which is exactly the failure class `#244` was
about.

**Solution**: rewrite ids and every reference to them at build time, in
`LabDiagram.astro`, prefixing each with the diagram's name. Order matters —
rewrite the *references* first, while the original ids are still what they point
at:

```ts
svg
  .replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${prefix}-${id})`)
  .replace(/\b(href|xlink:href)="#([^"]+)"/g, …)
  .replace(/\b(aria-labelledby|aria-describedby|aria-controls)="([^"]+)"/g, …)
  .replace(/\bid="([^"]+)"/g, (_, id) => `id="${prefix}-${id}"`);
```

**Two guards, because the rewrite knows only four syntaxes.** If the generator
ever emits a fifth, the ids around it still get prefixed and that reference is
left pointing at a name no element has any more — silently, because it still
looks right. So:

- `assertFullyNamespaced()` fails the **build** if any reference does not resolve
  to a declared id. Proven by execution: injecting `clip-path="url(#offscope)"`
  fails with `1 reference(s) in topology.svg resolve to nothing`.
- `lab-sections.test.mjs` asserts **zero duplicate ids on the whole built
  document**, not just the diagram sections, because the failure is two SVGs
  sharing ids across the page.

**Takeaway**: a measurement of *one* instance does not cover *two*. Anything a
generator emits with a fixed name — ids, CSS class names, `<style>` blocks,
element names — is a global in the document you paste it into, and the collision
only exists at N ≥ 2. When PR0-style groundwork measures a single artifact, write
down that the multi-instance case is unmeasured rather than letting the green
receipt imply it.

**Related**: `#244` (an accessible name nobody checks), `lesson-019` (a guard
that cries wolf), `lesson-016` (a test that only ever runs against the fix).
