---
id: "lesson-086-a-variable-font-pinned-to-the-weights-in-use"
type: lesson
status: active
title: "A variable font pinned to the weights in use costs half the bytes of a static file per weight"
created: "2026-11-12"
owner: manu
tags: [web, performance, fonts]
---

# A variable font pinned to the weights in use costs half the bytes of a static file per weight

**Context**: WEB-197 added two families to Roboto: Archivo for headings and JetBrains
Mono for everything in `font-mono`. Roboto ships one static subset per weight (four
files of about 27 KB each, #138). The markup asks the mono face for 400, 500 and 600, and
the headings for 500 to 800.

**Problem**: The static route repeats every outline once per weight. Three static
JetBrains Mono subsets came to 69 KB. The full variable file instead keeps axes nobody
uses: Archivo's full subset carries the width axis and the whole weight range, 39 KB.
The mono face also had to take box drawing (U+2500 to U+257F): the trees in code blocks
had always come from the next family in the stack, which is harmless while every
character in the block comes from that system mono, and misaligned once the rest of the
line is set in a face with a different advance width.

**Solution**: `scripts/subset-fonts.mjs` passes `variationAxes` to `subset-font`,
which instances the variable font through HarfBuzz: Archivo pinned to `wdth: 100` and
`wght` 600 to 800 (28.6 KB), JetBrains Mono to `wght` 400 to 600 with box drawing
(34.2 KB). Each `@font-face` declares the range the markup asks for (`500 800`,
`400 600`); a weight below the file's range renders at its lightest instance.
`tests/fonts.test.mjs` raises the per-file cap to 36 KB, still far below any full face,
and fails if box drawing appears outside `<pre>` or `<code>`, the only text set in the
face that carries it.

**Rule**: Before shipping a family in more than one weight, subset its variable source
with the axes pinned to the range the markup uses, and compare that one file with the
static files it replaces. Give a subset only the extra ranges of the family that sets
them, and test where those characters may appear.
