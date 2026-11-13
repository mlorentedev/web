---
id: "lesson-074-which-font-faces-a-first-screen-paints-follo"
type: lesson
status: active
title: "Which font faces a first screen paints follows the content, so a preload scoped to a breakpoint misses"
created: "2026-11-04"
owner: manu
tags: [web, performance, fonts, testing]
---

# Which font faces a first screen paints follows the content, so a preload scoped to a breakpoint misses

**Context**: WEB-181 asked whether the font preloads in `BaseLayout.astro` (Regular,
Bold, Black) match the faces the first screen paints. An audit had claimed Medium paints
above the fold and Bold does not, without measuring per viewport.

**Problem**: Measured with computed styles on visible text in the first 800 px, on `/`,
`/lab/`, `/ai/` and a note at 320 and 1440 px, half the claim held. Medium (500) is painted
on seven of the eight screens and was not preloaded. Bold is painted at 1440 on three pages,
and never at 320. The apparent fix was `media="(min-width: 640px)"` on the Bold preload,
because the nav row, whose current link is bold, appears at `sm`. A run at 639 px refuted
it: the note's text reflows at that width and a `<strong>` moves into the first screen.
Bold above the fold depends on the copy as well as the breakpoint. There was a second false
lead: the home page's bold `HARDWARE`/`SOFTWARE` labels are `font-mono`, the system family,
so they need no Roboto file at all.

The test that ships samples more than that first measurement: seven pages (`/`, `/lab/`,
`/ai/`, the note, and the three Spanish twins) at 320, 640 and 1440 px, 21 screens, with a
first screen 568 px tall at 320 (the smallest phone) and 800 px at the other two. There,
Medium is painted on 18 (all but `/`, `/es/` and the note at 320), and Bold on 10, at 640
and 1440 on `/lab/`, `/ai/`, the note and their twins, and never at 320.

**Solution**: Medium is preloaded. All four faces are preloaded with no `media`.
`site/tests/font-preloads.mjs` (in `test:browser`) prints the faces each sample screen
paints. It fails if a preloaded face is painted above the fold on no screen in the sample,
or if a face painted above the fold is not preloaded. Before the fix it failed with
`Roboto-Medium.woff2 is painted above the fold, and not preloaded`. It also fails on any
font preload that carries `media`: a sample of widths cannot see the ones between them, so
the 640 px scope above would pass at the sampled widths and miss the note at 639.

**Rule**: Before you scope a resource hint to a viewport, test the width on each side of
the breakpoint as well as the two ends. A layout breakpoint says where the chrome changes,
not where the content does, and reflow can move any inline style into the first screen.
