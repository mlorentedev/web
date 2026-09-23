---
id: lesson-048-release-please-writes-closes-for-every-issue
type: lesson
status: active
created: "2026-09-22"
owner: manu
tags: [web, release-please, github, ci-automation]
---

# release-please writes `closes` for every issue a commit mentions, `Refs` included

**Context**: WEB-022. Every commit of the migration said `Refs #7`, deliberately, because #7 had to stay open until the spec archived. After #380 merged, the release PR #382 read `… (#380) (aef8f88), closes #7`, and `Release closing refs` (#289) went red.

**Problem**: `Refs` is not a closing keyword, and the parser knows it. Run on #380's message, `@conventional-commits/parser`, the one release-please uses, returns `{"action":"Refs","issue":"7"}`. The changelog template then prints `closes` for every reference, whatever its action. So the release PR re-arms a close for **any** open issue a releasable commit mentions. [Lesson 034](lesson-034-a-release-pr-closes-every-issue-its-commits.md) found that a `closes` is copied; this one found that no `closes` is needed at all.

**Solution**: Nothing was edited by hand. The PR that archives the spec closes #7 legitimately, and the next regeneration of the release body then refers to a closed issue, so the guard turns green by itself. **Confirmed:** #386 merged and closed #7, release-please regenerated #382 (head `68495d5`), and `Release closing refs` passed with the body still reading `closes #7`. GitHub's `closingIssuesReferences` then reported only a closed issue. Merge order: archive PR first, release PR second.

**Rule**: Any `#N` in a releasable commit will read `closes #N` on the release PR. When an issue must outlive a release, either merge its closing PR first, or keep `#N` out of `feat`/`fix` commits (use a `docs`/`test` commit, or the PR body, for the reference).
