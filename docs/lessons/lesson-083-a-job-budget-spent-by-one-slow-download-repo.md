---
id: "lesson-083-a-job-budget-spent-by-one-slow-download-repo"
type: lesson
status: active
title: "A job budget spent by one slow download reports a cancelled test, not the download"
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
system libraries, apt is pointed at a cached directory and told to keep what it downloads:

```sh
printf 'Dir::Cache::Archives "%s";\nBinary::apt::APT::Keep-Downloaded-Packages "true";\n' \
  "$HOME/.cache/playwright-apt" | sudo tee /etc/apt/apt.conf.d/90-playwright-cache
npx playwright install-deps chromium
```

A warm run then installs from local `.deb` files. That cache's key also carries the runner
image version, so each image starts its own cache. This does not pin package versions: if
the mirror publishes a newer package, apt still downloads it. Each cache is saved by its own
step right after its install, because the combined action saves in a post step that is
skipped when a later step fails. Each install step has its own `timeout-minutes`, under the
job's. `site/tests/delivery-gate.test.mjs` fails if a `playwright install` step loses its
budget, the download stops being cache-gated, a save step goes missing, or apt stops
keeping its downloads in the cached directory.

**Rule**: Give any network-bound step its own `timeout-minutes`, and leave the job enough
budget for that step's full timeout after the steps before it. A step timeout fails on that
step only if it fires before the job's own timeout. The job budget is a backstop, and the
failure it reports names the wrong step.
