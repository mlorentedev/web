---
id: lesson-052-a-target-arg-in-a-build-platform-stage-build
type: lesson
status: active
created: "2026-09-23"
owner: manu
tags: [web, docker, buildkit, delivery]
---

# A TARGET ARG in a build-platform stage builds it once per platform

**Context**: The image is built for `linux/amd64,linux/arm64`. Its build stage is `FROM --platform=$BUILDPLATFORM`, meant as "build the static site once, natively, and copy it into each platform's runtime stage". While writing #376's extractor, both platforms of one digest were extracted and compared.

**Problem**: On `sha-641b26a` the amd64 and arm64 halves served different trees: 36 of 116 files, all diagram SVGs and the ten notes that link them. The stage also declared `ARG TARGETPLATFORM`, `ARG TARGETOS` and `ARG TARGETARCH`, used by nothing, inherited from the monorepo Dockerfile. An ARG in scope becomes part of every later RUN's cache key, so the stage was two stages, one per target, both on the build host. Two builds of the site meant two sets of the diagram renderer's random ids (#378). Staging happened to serve amd64 (4 of 4 requests), and nothing pins the pod's architecture.

**Solution**: Deleting the three ARG lines. Measured both ways with a local build for `linux/amd64,linux/386` and `--progress=plain`: the old Dockerfile ran `RUN npm run build` twice, as `[linux/amd64 build 10/10]` and `[linux/amd64->386 build 10/10]`; without the ARGs it ran once, and the two runtime trees were identical. Grep for `->` too: the second vertex is named for the host *and* the target, and a pattern that expects one platform name misses it. `served-tree.test.mjs` asserts the stage declares no `TARGET*` ARG, and the release extractor refuses any digest whose platforms serve different trees.

**Rule**: In a stage pinned to `$BUILDPLATFORM`, declare a `TARGET*` ARG only when the stage uses it to cross-compile. Otherwise it silently builds once per platform, and any non-determinism in the build turns one digest into several artifacts. To know what a multi-platform image serves, extract each platform, not the one your machine pulls.
