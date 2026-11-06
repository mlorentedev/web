---
id: lesson-082-a-job-budget-spent-by-one-download-reports
type: lesson
status: active
created: "2026-11-06"
owner: manu
tags: [web, ci, github-actions]
---

# A job budget spent by one download reports a cancelled test, not the download

**Context**: The `Test` job has `timeout-minutes: 10`. Before the build it downloads
Chromium for the diagram renderer with `npx playwright install --with-deps chromium`,
uncached, on every run. That step normally takes 47 s.

**Problem**: On one run the download took 7 min 08 s. The job hit its budget while axe
was still passing pages, and `PR gate` said `test (cancelled) did not succeed`. Every test
that ran had passed, and nothing named the step that spent the time. A job-level timeout
cancels whatever runs last, so the report blames the tests.

**Solution**: Chromium is cached under `~/.cache/ms-playwright`, keyed on the Playwright
version npm resolved, and downloaded only on a miss. The download and the apt install of
its system libraries are separate steps, and each has its own `timeout-minutes`, so a
stall fails on the step that stalled. `tests/delivery-gate.test.mjs` fails if any
`playwright install` step loses its budget or the download stops being cache-gated.

**Rule**: Give any network-bound step its own `timeout-minutes` under the job's. The job
budget is a backstop, and the failure it reports names the wrong step.
