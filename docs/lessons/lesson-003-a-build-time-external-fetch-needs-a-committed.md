---
id: lesson-003-a-build-time-external-fetch-needs-a-committed
type: lesson
status: active
created: "2026-07-10"
owner: manu
tags: [web, lesson]
---

# A build-time external fetch needs a committed fallback, or a flaky API breaks deploys

**Context**: WEB-019 — baking GitHub telemetry (repo count, stars, top languages) into the
`[ 06 ]` proof surface at build time, via one unauthenticated `GET /users/{u}/repos` call.

**Problem**: Build-time fetching moves a third-party dependency onto the deploy path. The
unauthenticated GitHub budget is 60 req/hr, and the site builds on every push to `master` — so a
rate-limited or briefly unreachable API turns a routine content commit into a failed deploy, or
worse, silently bakes zeros into a page whose entire purpose is to look credible.

**Solution**: A `FALLBACK` constant committed in `github.ts`, seeded from a real live response
(2026-07-10) rather than zeros, with the fetch wrapped so any failure degrades to it. Proven by
pointing the client at an unreachable host (`api.github.invalid`): `astro build` exited 0 and the
section still rendered honest numbers.

**Rule**: Any external fetch on the build path ships with a committed fallback seeded from real
data, and the failure path is tested by forcing it (unreachable host), not assumed. Zeros are not a
fallback — on a proof surface they are a worse failure than stale numbers.
