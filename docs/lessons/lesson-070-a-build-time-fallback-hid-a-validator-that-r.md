---
id: "lesson-070-a-build-time-fallback-hid-a-validator-that-r"
type: lesson
status: active
title: "A build-time fallback hid a validator that rejected the real upstream response"
created: "2026-11-04"
owner: manu
tags: [web, build, testing, privacy]
---

# A build-time fallback hid a validator that rejected the real upstream response

**Context**: The GitHub contribution chart was embedded from `ghchart.rshah.org`, the
site's only request to another origin, so every visitor's IP reached a third party. The
fix fetches the SVG once at build time and serves it from the site
(`site/src/pages/github-activity.svg.ts`). The chart is decorative, so a failed fetch
falls back to an empty chart of the same size instead of failing the release, and
anything that is not an SVG counts as a failure.

**Problem**: The first build "succeeded" with an empty chart. The upstream had answered
`200 image/svg+xml` with 53,932 bytes, but the body opens with
`<?xml …?>` and then `<!DOCTYPE svg …>` before `<svg`, and the validator only allowed the
XML declaration. The fallback did exactly what it was built to do, so the only trace was a
`console.warn` in a long build log. Every test passed, because each one checked only that
an SVG was served.

**Solution**: The validator now accepts an optional `<!DOCTYPE>` after the declaration,
written from the upstream's real first bytes (`fetch(...).then(r => r.text())`, sliced),
not from what an SVG is assumed to look like. `tests/github-activity.test.mjs` asserts
`data-fallback` is absent whenever `CI` is set. CI has the network, so a changed or
missing upstream turns a PR red instead of quietly shipping an empty chart. Locally,
offline, the fallback is still allowed.

**Rule**: A fallback that keeps a build green hides every failure of the step it
guards, including the validator's own. Write the validator against a captured real
response, and make the fallback fail in CI, where the network is there and its use means
something broke.
