---
id: lesson-055-a-registry-login-outlives-the-step-that-need
type: lesson
status: active
created: "2026-09-23"
owner: manu
tags: [web, ci, security, docker]
---

# A registry login outlives the step that needed it

**Context**: #389 made the release test the image that ships. `test.yml` logs in to
Docker Hub so its pulls count against the account rather than the runner's anonymous
allowance, extracts the tree the image serves by digest, and then runs `npm test`,
the browser containment check and axe against that tree.

**Problem**: The login is not scoped to the pull that needed it. `docker/login-action`
writes the credential to `~/.docker/config.json`, and the credential is the
push-capable `DOCKERHUB_TOKEN` the build uses. The action does log out by default
(`logout: true`), but in its post step, at the end of the job. Until then the file is
readable by every later step: the test suite, Playwright, axe, and any dependency code
they load. None of them needs it. CodeRabbit flagged this on #389 as Major. Nothing in
the suite could have noticed, because every check passes with the token present.

**Solution**: A `Logout from Docker Hub` step runs `docker logout docker.io` straight
after `Extract the tree the image serves`, with `if: always() && inputs.image != ''`
so that a failed extraction drops the token too (`.github/workflows/test.yml`).
`site/tests/delivery-gate.test.mjs` asserts the step's condition and command, and that
it comes after the extraction and before `Test`. Moving it later, or dropping
`always()`, fails the suite.

**Rule**: A login is a file, and it lasts until something deletes it. When a job logs
in with a credential that can write and then runs code you did not write, log out
before that code starts, under `if: always()`, and pin the step order with a test. The
action's end-of-job cleanup comes after the steps that matter.

Same PR, same method of testing what ships:
[lesson 051](lesson-051-a-copy-into-the-base-image-s-web-root-merges.md),
[lesson 052](lesson-052-a-target-arg-in-a-build-platform-stage-build.md).
