---
id: lesson-038-a-guard-proposed-in-a-ticket-is-a-hypothesis
type: lesson
status: active
created: "2026-09-04"
owner: manu
tags: [web, verification, gitops-delivery, adr]
---

# A guard proposed in a ticket is a hypothesis — backtest it against known-good history before building it

**Context**: `kubelab#1585` automated the prod promotion so a release opens its
own promotion PR. Its "worth considering while here" section proposed a check
that reads as obviously correct:

> ADR-055 promises prod ships the exact bytes staging validated. Today that is a
> convention. The promote step could assert it: resolve the digest behind the
> semver tag and the digest behind the `sha-*` tag the **staging overlay pins**,
> and refuse when they differ.

The issue was mine, written a day earlier. Closing it meant either building the
check or saying why not, so it got measured against the promotion that had just
happened — `1.13.0`, the first fully automated one:

```
digest(1.13.0)                        = c1b8ccb0…   (sha-a76e8fa, the release commit)
digest(staging overlay's sha-69c0d4c) = 47d5da40…   (the commit before it)
```

**The check would have refused a promotion that was correct**, and not as an
edge case — on *every* automated release. The staging deploy PR for a release
commit opens on the same push and waits for a human merge (ADR-046), while
`promote-prod` runs two seconds after the release dispatch. The two are never
equal at the moment the check would run.

**Problem**: The proposal was not careless. It was derived from ADR-055 — from
the sentence *"the bytes Argo CD runs in prod are the exact bytes validated in
staging"*, which appears in the Decision and again in the Positive consequences.
What the ADR actually **decided** is in its Implementation section, and it is a
different claim:

> re-tag the already-built `sha-<short>` digest to `X.Y.Z`. **The release-commit's
> own `sha-<short>` image** is the one to re-tag, so the prod digest equals **that
> commit's** staging digest.

That is **artifact identity** — one build, re-tagged, never rebuilt — and it held
perfectly (`1.13.0` == `latest` == `sha-a76e8fa`, one manifest). The summary
sentence reads as **execution order**: that staging *ran* those bytes first.
ADR-055 never decided execution order; ADR-046 and ADR-037 govern it, and under
them prod may legitimately be ahead of staging. A ticket faithfully encoded the
imprecise sentence, and the result was a guard that would fire on correct
behaviour ([`#302`](https://github.com/mlorentedev/web/issues/302) amends the ADR).

A guard that fires on correct behaviour is worse than no guard: it gets
disabled, or it trains everyone to merge past a red check. Building it first and
discovering that during the first real release is how a delivery path acquires an
override that outlives the reason for it.

**Solution**: Before implementing a proposed check, resolve its inputs against
history that is already known to be good, and write the numbers down.

Here that cost two registry lookups and one file read, and it produced a better
artifact than the check would have been: the closing comment on `kubelab#1585`
records the measurement **and** declares the comparison a rejected non-check with
its reason, so it is not proposed a third time.

**Rule**:

- **A check written in prose is a hypothesis about data you have not looked at.**
  Backtest it against a known-good case before writing the code. The cheapest
  version — resolve both sides by hand, once — is usually enough to kill it.
- **The failure mode to test for is the false positive, not the false negative.**
  A check that misses something leaves you where you were. A check that refuses
  correct behaviour actively damages the path it guards.
- **When a ticket and an ADR disagree, the ADR's Implementation section is the
  decision and its summary sentences are the paraphrase.** Quote the section that
  decided. If the paraphrase is what people keep acting on, that is a defect in
  the ADR, so file it — this is
  [`kubelab` lesson-388](https://github.com/mlorentedev/kubelab/blob/master/docs/lessons/process-method/lesson-388-a-decision-reaches-only-as-far-as-the-artefact-at-the-point-of-use.md)'s
  tell, a question that keeps coming back.
- **Closing an issue means dispositioning its suggestions, not just its ACs.** A
  "worth considering" section that nobody answers is re-proposed by the next
  reader with the same reasoning and none of the measurement. Record the rejection
  where the suggestion lives.

**Tags**: `#verification` `#gitops-delivery` `#adr` `#issue-302` `#kubelab-1585`
