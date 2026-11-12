---
id: "lesson-068-a-pr-build-renders-the-local-variant-of-the-"
type: lesson
status: active
title: "A PR build renders the local variant of the footer, so a defect only the shipped variant carries passed every PR check"
created: "2026-11-03"
owner: manu
tags: [web, testing, ci, build]
---

# A PR build renders the local variant of the footer, so a defect only the shipped variant carries passed every PR check

**Context**: #541 added a build chip to the footer. With a `SITE_COMMIT` (every image
`release.yml` builds) it renders `synced`, a coloured dot and an outbound link to the
commit. Without one (any local or PR build) it renders `local` and links `/version.json`.

**Problem**: The PR passed every check and merged. Then "Test shipped image" failed on
master, which ran the same suite against the served tree: the dot used `bg-emerald-500`
(a raw family the Lab audit forbids), and the outbound link lacked `target="_blank"` and
`rel="noopener noreferrer"`, which three link-safety tests require. Neither markup
exists in a build without a commit, and the PR job built without one. The release gate
did its job, since nothing reached staging, but only after merge, with master red.

**Solution**: The dot uses the `ok` token and the link carries `target` and `rel`. The PR
build in `test.yml` now runs with `SITE_COMMIT` set to the head's short sha and exports
it through `$GITHUB_ENV`, so the tests (which assert the commit `dist/version.json`
states) agree with the build. Locally, `SITE_COMMIT=abc1234 npm run build && SITE_COMMIT=abc1234 npm test`
went from 11 failures to 474 passing; a build without the variable passes as well.

**Rule**: When markup depends on a build input, the PR must build the variant that
ships. The variant a developer sees locally is the one least likely to reach a reader.
Before merging such a change, build it both ways and run the suite on each.
