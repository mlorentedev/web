---
id: lesson-030-github-s-answer-about-a-merge-is-not-gro
type: lesson
status: active
created: "2026-09-02"
owner: manu
tags: [web, git, github, verification, WEB-080]
---

# GitHub's answer about a merge is not ground truth, and neither is `git`'s ancestry

**Context**: two PRs were open at the end of WEB-080 — `#276` (the `PR gate`
context) and `#279` (a path-traversal fix in the test server). The session
needed three facts before handing over: are they mergeable, did they merge, and
did the change actually land.

**Problem**: the three obvious commands each gave an answer that was wrong,
absent, or true-but-misleading, and two of them looked authoritative.

**1. `mergeable` sat on `null` indefinitely.**

```
$ gh pr view 276 --json mergeable,mergeStateStatus
mergeable=UNKNOWN  state=UNKNOWN
$ gh api repos/mlorentedev/web/pulls/276 --jq '.mergeable'
null
```

GitHub computes mergeability lazily, in a background job kicked off by the
request. The documented recipe is to poll until it is non-null — but it never
became non-null here, across several minutes and a REST request specifically
issued to trigger the computation. **`UNKNOWN` is not "conflicted" and it is not
"clean"; it is "no answer", and code that treats it as either is guessing.**

The local equivalent needs no service and answers immediately:

```bash
git merge-tree --write-tree origin/master "origin/$branch" >/dev/null 2>&1 \
  && echo "merges clean" || echo "conflict"
```

**2. `git merge-base --is-ancestor` said the commits were not in `master` — and
the changes were.**

```
017a90f   ancestor of master: NO
026733d   ancestor of master: NO
```

Both PRs had merged. This repo squash-merges (§4), so the branch commits are not
ancestors of anything: master carries a *new* commit with the same tree
contribution and a different identity. This is the same trap as `git cherry`
recorded on 2026-08-31 — patch-ids do not survive a squash either. **Ancestry
answers "is this commit in the history", and after a squash the honest answer is
no while the change is fully present.**

**3. `gh run list --commit <sha>` returned nothing for a commit with five green
checks.**

```
$ gh run list --commit 017a90f --limit 10
(no output)
$ gh api repos/mlorentedev/web/commits/017a90f/check-runs --jq '.total_count'
5
```

An empty run list reads exactly like "CI never ran", which was the conclusion
being drawn until the second command contradicted it. **`check-runs` on the
commit is the query that answers "what has reported on this SHA".**

**Solution**: ask the question about the thing you actually care about.

| Question | Do not ask | Ask |
|---|---|---|
| Will this merge cleanly? | `gh pr view --json mergeable` | `git merge-tree --write-tree origin/master origin/<branch>` |
| Did this change land? | `git merge-base --is-ancestor` | `git diff --quiet origin/master:<path> <sha>:<path>`, per file |
| What has CI said about this SHA? | `gh run list --commit` | `gh api repos/O/R/commits/<sha>/check-runs` |

The middle row is the general form of the 2026-08-31 note, and it is worth
stating positively: **verify a squash merge by content.** For a small PR that is
a per-file `git diff --quiet` between master and the branch head, which reports
byte-level identity and does not care how the commit got there.

One more, cheap and worth doing every time: `git diff A..B` and `git diff A...B`
answer different questions, and the two-dot form against a moved `master` prints
the *inverse* of what you expect — it showed the new files as deletions, which
read as "master is missing them" when it meant "master already has them".
`...` (merge-base) is almost always the one you want when comparing a branch to
a trunk that has moved under it.

**Takeaway**: every one of these commands was answering its own question
correctly. The defect was reading them as answers to a question they were never
asked — "is it merged" as ancestry, "is it mergeable" as a boolean that is always
present, "did CI run" as a workflow-run listing. When a tool's answer would
change what you do next, spend the one extra command to ask the property
directly, and prefer the local query that computes rather than the remote one
that caches.

**Related**: `lesson-027` (a record that something was done is not evidence),
`lesson-022` (a number that is only printed is never questioned), `lesson-003`
(`grep -c` counts lines, not matches).
