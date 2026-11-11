---
id: lesson-084-a-check-that-only-runs-after-merge-blocked-e
type: lesson
status: active
created: "2026-11-10"
owner: manu
tags: [ci, release, testing]
---

# A check that only runs after merge blocked every deploy for four days, with every PR green

**Context**: The release workflow tests the published image before it tells kubelab
to deploy it. One step, `tests/nginx-cache-probe.mjs`, starts the image and asks it for
real assets. It finds them by following links: `/`, then the first note on `/notes/`,
then a `/beoe/` diagram on that note. A pull request publishes no image, so the step
runs only on `master`.

**Problem**: #624 put the series first on `/notes/`. The first note link became
`why-build-homelab`, which has no diagram, so the probe found no asset and failed.
Every release from `8449aaa` (2026-11-06) to `93a3f01` (2026-11-11) failed at that
step, and staging stayed on `sha-656d9a7`. Seven merges never reached staging. Every
pull request was green, because the probe never ran on one. The failure went unnoticed
until someone asked why the site had not changed.

**Solution**: The search moved to `tests/lib/probe-assets.mjs`. It now tries every
note on the index until one has a diagram. The probe calls it over HTTP, and the new
`tests/probe-assets.test.mjs` calls it on `dist/` in every pull request. A page change
that leaves the probe nothing to find now fails the pull request that makes it.

**Rule**: When a check can only run after merge, run its inputs in the pull request: the
part that reads the build can almost always run on `dist/`. And check that the last
deploy succeeded before calling a merged change done. A merged change is not shipped.
