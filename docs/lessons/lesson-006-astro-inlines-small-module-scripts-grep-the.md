---
id: lesson-006-astro-inlines-small-module-scripts-grep-the
type: lesson
status: active
created: "2026-07-10"
owner: manu
tags: [web, astro, verification]
---

# Astro inlines small module scripts — grep the HTML, not for an `_astro/*.js` chunk

**Context**: Verifying WEB-019 increment 2 — the client-side hydration island that refreshes the
`[ 06 ]` proof-surface numbers from the public GitHub REST API.

**Problem**: The obvious way to prove "the island shipped" is to look for an emitted JS chunk under
`dist/_astro/` and a `<script src="...">` pointing at it. Neither exists. Astro inlines sufficiently
small `<script type="module">` blocks directly into the HTML, so a verification that looks for an
external bundle concludes the island was never built — when it is in fact present, inline, in every
page that renders the component.

**Solution**: Verified by grepping the built HTML for the island's own markers instead — the cache
key `web:gh-metrics:v1`, the `deriveMetrics` symbol, the endpoint template, and the `data-value`
selector hooks — in both `dist/index.html` and `dist/es/index.html`.

**Rule**: To prove client JS shipped in an Astro build, grep the built **HTML** for a distinctive
string from the script body. Do not assert presence or absence from `dist/_astro/*.js` or a `src`
attribute: small module scripts get inlined and leave no external artifact.
