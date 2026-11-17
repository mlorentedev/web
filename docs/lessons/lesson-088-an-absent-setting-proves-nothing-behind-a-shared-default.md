---
id: "lesson-088-an-absent-setting-proves-nothing-behind-a-shared-default"
type: lesson
status: active
title: "Once a build runs a shared action, an absent setting proves nothing: the action's default fills it"
created: "2026-11-16"
owner: manu
tags: [web, ci-automation, docker, testing]
---

# Once a build runs a shared action, an absent setting proves nothing: the action's default fills it

**Context**: CI-010 (mlorentedev/ci-workflows#11). The image builds moved from a local `docker/build-push-action` step to ci-workflows' `docker-build` composite (pull requests) and `docker-publish` reusable workflow (master). WEB-202's test guarded the registry layer cache with `assert.doesNotMatch(code, /type=gha/)`: the build must not touch the Actions cache.

**Problem**: That assertion still passes after the move, and it no longer means anything. The composite's own default is `cache-from: type=gha` and a `cache-to` of `type=gha,mode=max` unless `cache-write` is `'false'`. Delete the overrides from `build-image.yml` and the step has no `type=gha` in it, so the test is green, while the build writes the Actions cache again: the eviction WEB-202 fixed.

**Solution**: `site/tests/delivery-gate.test.mjs` asserts the overrides themselves. The pull request build must read `type=registry,ref=${{ env.IMAGE }}:buildcache` and carry `cache-write: 'false'`. The release build must name the registry `buildcache` tag in both `cache-from` and `cache-to` (`mode=max`). Six mutations of the workflows were run against the new tests: pin by tag, `load: 'false'`, `cache-write: 'true'`, `SITE_COMMIT` dropped from the release build, `mode=min`, and a different `sarif-category`. Each turned a test red.

**Rule**: When a workflow delegates to a shared action, a test of the form "X is not set" is only meaningful if the action's default for X is also safe. Read the callee's defaults, and assert the value you need where the default is the thing you are avoiding.
