---
id: lesson-049-a-screenshot-control-that-passes-once-is-not
type: lesson
status: active
created: "2026-09-22"
owner: manu
tags: [web, verification, playwright, testing]
---

# A screenshot control that passes once is not a determinism proof

**Context**: WEB-022 PR4 claimed that Tailwind 4 changes no pixel, backed by `tests/visual-diff.mjs`. The evidence said "master against itself is 20/20 identical", from one pair of runs.

**Problem**: The independent adversarial review repeated the control and got **2 of 20 different** on `/lab` and `/es/lab`. The Lab's reachability console calls a live endpoint and prints the visitor's clock and the round-trip time, which differ on every load. The first pair of runs had simply caught the same values. With the network pinned, 4 of 20 still differed, by 137 to 1,016 px. Cropping the changed strip from both captures showed `08:31:51 PM · round trip: 9 ms` against `08:39:49 PM · round trip: 7 ms`.

**Solution**: The tool now serves the console the healthy fixture `lab-axe.mjs` already used, aborts every other outbound request, and replaces the two live readings (`[data-probe-clock]`, `[data-probe-latency]`) with fixed text. Three passes of one build are 20/20 identical. Tailwind 3 against Tailwind 4 was then re-measured at 20/20, 0 px, and the evidence was corrected rather than left standing.

**Rule**: Before a visual comparison says anything about a change, run the control at least three times, pin every runtime request, and fix every value that is live by design. When pixels do differ, crop and look at them before theorising; the DOM search here found nothing, and the picture answered in one step.
