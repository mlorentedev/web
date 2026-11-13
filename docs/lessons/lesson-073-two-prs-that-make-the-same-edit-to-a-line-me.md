---
id: "lesson-073-two-prs-that-make-the-same-edit-to-a-line-me"
type: lesson
status: active
title: "Two PRs that make the same edit to a line merge without a conflict, so a hand-kept count ends one short"
created: "2026-11-04"
owner: manu
tags: [web, git, ci, testing]
---

# Two PRs that make the same edit to a line merge without a conflict, so a hand-kept count ends one short

**Context**: The lessons index opened with "N lessons", and `scripts/check-lessons.sh`
compared it with the files. Two PRs were open at once, each adding one lesson.

**Problem**: Each PR moved the line from "69 lessons" to "70 lessons", and each was green
on its own head. Git sees two identical edits to one line as agreement, not conflict, so
the merge kept "70 lessons" with no hunk to look at. The rows did conflict and were
resolved by hand, keeping both. Master had 71 files under "70 lessons", and the
push-triggered `hygiene` run went red on `e7a2898`. Branch protection does not require
an up-to-date base (`strict: false`, WEB-116), so no PR check ever saw the combined tree.

**Solution**: The index no longer states a count, and the check fails if one comes back
(WEB-185). `site/tests/check-lessons.test.mjs` replays the incident in a scratch repo with
the real index and script: two branches each add a lesson, both merge, the conflict is
resolved by keeping both rows. On the old index the check fails with
`says 73 lessons, found 74`; on the new one it passes.

**Rule**: Do not hand-write a value a script can derive from the files beside it. Every PR
that changes the files edits the same line the same way, and git merges identical edits
silently, so the value is wrong after the second merge and nothing conflicts to say so.
