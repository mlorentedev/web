---
id: "lesson-078-an-allowlist-for-upstream-input-refused-the"
type: lesson
status: active
title: "An allowlist for upstream input refused the site's own fallback, so the test failed under the wrong message"
created: "2026-11-05"
owner: manu
tags: [web, testing, ci, security]
---

# An allowlist for upstream input refused the site's own fallback, so the test failed under the wrong message

**Context**: The build fetches the GitHub contribution chart and serves it from this site
(#549). A body that is not an SVG of rectangles and text is refused by an allowlist
(`site/src/lib/safe-svg.mjs`), and a failed fetch serves an empty chart marked
`data-fallback`. The test ran the allowlist over the built file, then, in CI only, failed on
the marker with "the upstream fetch failed".

**Problem**: The allowlist describes what upstream may send, and the empty chart is not
upstream's: its `data-fallback` attribute is not on the list. So when ghchart answered
HTTP 500, the allowlist assertion fired first, as "attribute data-fallback on <svg>", and the
message written for that case never showed. The same assertion failed every offline local
build, although the file header said locally the file was checked only for being an SVG.
The outage also turned every PR red over an image none of them touched.

**Solution**: `site/src/lib/empty-chart.mjs` builds the empty chart with the reason in its
attribute (`HTTP 500`, `refused: element <script>`, escaped), and recognises it by its exact
shape, so only that document skips the allowlist. CI fails when the reason is a refusal
(upstream sent something that is not a chart) and skips, naming the cause, when the fetch
failed. The allowlist was not widened.

**Rule**: A check written for third-party input is not the check for your own fallback.
Recognise your output by its whole shape, carry the reason it was produced, and decide in
the test which reasons a PR should answer for.
