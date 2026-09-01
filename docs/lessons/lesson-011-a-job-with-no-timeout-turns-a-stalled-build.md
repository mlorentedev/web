---
id: lesson-011-a-job-with-no-timeout-turns-a-stalled-build
type: lesson
status: active
created: "2026-08-24"
owner: manu
tags: [web, ci-automation, docker, release-please]
---

# A job with no timeout turns one stalled build into a release that silently never publishes

**Context**: Docker Hub's tag list for `mlorentedev/kubelab-web` showed semver tags up to `1.10.0`
and nothing but `sha-*` after it, while GitHub showed a `v1.10.1` release from 2026-08-21.

**Problem**: The v1.10.1 release run sat in `Build staging image` from 01:00:29 to 07:00:43 and was
killed by GitHub's six-hour job ceiling. `promote-prod` declares `needs: build`, so it was skipped
along with the kubelab dispatch. Release-please had already succeeded, cut the tag and published the
GitHub release — so every outward signal said v1.10.1 had shipped, and no image existed.

Two things made it invisible rather than merely broken:

- **The job declared no `timeout-minutes`**, so it inherited the six-hour ceiling. A healthy
  multi-arch build here takes about four and a half minutes; the stall had roughly eighty times that
  much rope.
- **A skipped job reports nothing.** `promote-prod` being skipped is indistinguishable from a
  `promote-prod` that correctly had no work to do, which is the normal case on every non-release push.
  That half is drawn out on its own in
  [`lesson-015`](lesson-015-a-step-that-was-skipped-and-a-step-with-no.md).

Worth stating precisely, because the first read was wrong: this was **one** stalled run, not a
systematic failure. 1.8.0, 1.9.0 and 1.10.0 all published normally, and the other red runs from
2026-08-21 failed in about twenty seconds for an unrelated reason on non-release commits, where
`promote-prod` would have been skipped anyway. The arm64 leg under QEMU is slow but usually finishes;
it hung once, and once was enough to lose a release with no signal.

**Solution**: Remove emulation from the stage that does the work, and cap the job.

```dockerfile
FROM --platform=$BUILDPLATFORM node:22-alpine AS build
```

That is the line as it was written at the time; the base image has since moved to
`node:22-bookworm-slim` for unrelated reasons. What carries is the `--platform` pin, not the distro.

The Astro output is static HTML, CSS and JS with no native artifacts, so it is identical whatever
architecture built it; only the runtime stage needs to be per-arch, and it still is. Build-once /
promote-by-digest (ADR-055) is unaffected. Then `timeout-minutes: 20` against a healthy runtime of
about four and a half minutes.

**Rule**: In a multi-arch build, pin every stage that cannot produce architecture-dependent output to
`$BUILDPLATFORM` — paying QEMU for a byte-identical result buys only exposure to its failure modes.
Give every job a `timeout-minutes` sized to a few times its healthy runtime; the six-hour default
does not protect a pipeline, it hides a stall for six hours and then skips everything downstream,
where a skip looks exactly like a step that had nothing to do. And verify a publish against the
registry, never against the existence of a git tag or a GitHub release — those are created by a
different job than the one that pushes the image.
