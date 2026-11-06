---
id: lesson-083-a-job-budget-spent-by-one-download-reports
type: lesson
status: active
created: "2026-11-06"
owner: manu
tags: [web, ci, github-actions]
---

# A job budget spent by one slow download reports a cancelled test, not the download

**Context**: The `Test` job has `timeout-minutes: 10`. Before the build it downloads
Chromium for the diagram renderer with `npx playwright install --with-deps chromium`,
uncached, on every run. That step normally takes 47 s.

**Problem**: On three runs the step took 7 to 8 minutes, almost all of it apt fetching
21 MB of fonts from the runner's Ubuntu mirror at 53 kB/s. The job hit its budget while
axe was still passing pages, and `PR gate` said `test (cancelled) did not succeed`. Every
test that ran had passed, and nothing named the step that spent the time. A job-level
timeout cancels whatever runs last, so the report blames the tests. Raising the job budget
to 20 minutes (#617) stopped the cancellations, but every run still paid for the fetch.

**Solution**: Both halves are cached, keyed on the Playwright version npm resolved. The
browser is cached under `~/.cache/ms-playwright` and downloaded only on a miss. For the
system libraries, apt is pointed at a cached directory and told to keep what it downloads,
so a warm run installs from local `.deb` files; that cache's key also carries the runner
image version, which pins the package versions. Each install step has its own
`timeout-minutes` under the job's, so a stall fails on the step that stalled.
`tests/delivery-gate.test.mjs` fails if a `playwright install` step loses its budget, the
download stops being cache-gated, or apt stops keeping its downloads in the cached directory.

**Rule**: Give any network-bound step its own `timeout-minutes` under the job's. The job
budget is a backstop, and the failure it reports names the wrong step.
