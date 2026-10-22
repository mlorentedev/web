---
id: lesson-066-a-jq-default-turns-a-missing-output-into-the
type: lesson
status: active
created: "2026-10-22"
owner: manu
tags: [web, ci, release-please]
---

# A jq default turns a missing output into the answer no

**Context**: `release.yml` decides whether a push cut a release by reading release-please's
outputs. The gate read `jq -r '.["release_created"] // .[".--release_created"] // "false"'`,
and its comment said the fallback meant "an output-format change can never silently skip
the publish" (WEB-117).

**Problem**: The fallback was the silent skip. If both keys go missing, which has already
happened once when release-please renamed its outputs, `created` becomes `false` and
`promote-prod` is skipped as "no release". Every job stays green, and the result is a tag
with no image, the same outcome as WEB-078. The fix itself needed a guard against a second
trap: jq's `//` replaces `false` as well as a missing key. A gate written as
`.releases_created // "absent"` would therefore read a boolean "no release" as "unknown".

**Solution**: `scripts/release-gate.sh` discriminates on `releases_created`, the one key
present on every push. It reads that key with `has(...)` rather than `//`, so absent and
false stay distinct. It requires the per-release keys only when a release was created, and
fails naming the keys it saw. `site/tests/release-gate.test.mjs` runs the gate on the
shapes measured on 2026-10-21, and on renamed copies of them. The old inline gate, given a
renamed shape, printed `created=false` and exited 0; the script exits 1.

**Rule**: Never give a decision-carrying field a default that equals one of its answers.
Read it fail-closed: present means use it, absent means stop. In jq, test presence with
`has()`. `//` is not a presence test, because it fires on `false` and `null` alike. When a
comment claims a fallback prevents a silent failure, check whether the fallback is that
failure.
