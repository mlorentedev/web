---
id: lesson-054-a-push-to-a-merged-pr-s-branch-succeeds-and
type: lesson
status: active
created: "2026-09-23"
owner: manu
tags: [web, git, pull-requests, review]
---

# A push to a merged PR's branch succeeds and lands nowhere

**Context**: #396 (the bio) was open with green CI. Its review asked for two fixes, which were committed as `37116f0`. Separately, the owner asked for a rewording, committed as `e12ab8c`. Both were pushed to the PR branch, and the triage comment said "applied in `37116f0`".

**Problem**: The owner had merged #396 at `33a230d` about a minute before the first of those pushes. `git push` to the branch of a merged PR succeeds: the branch still exists and nothing rejects the push. The commits then sit on a branch no PR will ever merge. Nothing failed, and the triage comment reported fixes as applied that master never received. It only surfaced at handoff, when `gh pr view 396 --json headRefOid` showed `33a230d` and not the last commit.

**Solution**: The two commits were cherry-picked onto a fresh branch from `origin/master` and opened as #399. A correction was posted on #396 so its triage record does not claim what master lacks.

**Rule**: Before pushing a follow-up to a PR branch, ask whether the PR is still open (`gh pr view <N> --json state,headRefOid`). A push only reaches master through an open PR. Record a review fix as "applied" only when **both** hold: the PR is `OPEN` and its `headRefOid` is your commit. It then lands on master with the merge. If the state is `MERGED`, the `headRefOid` is the head the merge used (here `33a230d`). A squash merge makes `git merge-base --is-ancestor` against master say nothing, so compare that oid with your commit. If it is not yours, the fix is not on master and needs a new PR.
