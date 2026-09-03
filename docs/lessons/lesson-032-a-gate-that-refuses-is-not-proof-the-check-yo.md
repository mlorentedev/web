---
id: lesson-032-a-gate-that-refuses-is-not-proof-the-check-yo
type: lesson
status: active
created: "2026-09-02"
owner: manu
tags: [web, verification, spec-driven-development]
---

# A gate that refuses is not proof the check you added is the one that fired

**Context**: `#283` added `harness/reviewer-pool.json` so `dotf spec archive`
would refuse an adversarial review signed by the same model family that wrote
the implementation — the shortfall that had held WEB-080's archive. The obvious
way to prove it worked was to run the archive and watch it refuse.

**Problem**: It refused, and the refusal was about something else entirely:

```
$ dotf spec archive WEB-080
Error: review.md is stale: tasks.md changed after reviewed_sha 410699dd
```

`checkReviewGate` runs staleness first (`review.go:322`) and the pool check
after (`:330`), so the short-circuit meant `checkReviewerPool` was never
reached. Reading only the exit status, the conclusion "the new gate works" would
have been wrong in a way nothing would have contradicted — the command failed,
the spec did not archive, and the desired outcome and the misleading one are the
same shape.

Worse, the staleness itself was invisible at a glance: `tasks.md` had moved a
single line of *prose* after the reviewed SHA, a `assertNothingFocusable` →
`assertViewerAffordancesGone` rename from a later PR. Nothing about the change
was semantic; the checker watches `contractFiles` and does not care.

**Solution**: State the gap instead of closing it by assertion. `#283` shipped
saying, in the PR body and the commit message, that the pool refusal was
verified by *reading* `review.go:322-330` and not by executing it. The execution
proof arrived one step later and in the opposite direction: after the re-review
on `nan/deepseek-v4-flash` cleared the staleness with a fresh `reviewed_sha`,
`dotf spec archive WEB-080` ran the pool check for real and **admitted** the
reviewer. The mechanism was then demonstrated in both directions — refusing for
one reason, admitting for another — and neither run alone would have done it.

**Rule**: When a guard is one of several in a chain, a failing command proves
only that *some* link failed. Read the error text, name which check fired, and
if it is not yours, say the coverage is by inspection until a run reaches it.
"The gate refused" is a claim about the chain; "my check refused" is a claim
about the change, and only the second is evidence that the change works. See
also [A test that only ever runs against the fix proves
nothing](lesson-016-a-test-that-only-ever-runs-against-the-fix.md) and [A step
that was skipped and a step with nothing to do look
identical](lesson-015-a-step-that-was-skipped-and-a-step-with-no.md).
