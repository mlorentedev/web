# ADR-057: One stable required context on `master`, and what "reviewed" means here

- **Status:** Accepted
- **Date:** 2026-09-02 (merge of #276)
- **Deciders:** Manu Lorente
- **Extends / refines:** ADR-055 (delivery; the release PR this gate exempts)
- **Scope:** web (this repo: `.github/workflows/pr-validation.yml`, `.github/workflows/pr-agent.yml`, `harness/`)

> Records a decision that was taken and landed across #276 (the gate), #159 (the
> attestation registry) and #283 (the reviewer pool), and written up in
> `docs/lessons/lesson-029`. Nothing in this file is new; it exists so the reason
> the gate is shaped the way it is survives the next edit to the workflow.

## Context

Before #276, `master` required **zero** status checks. Issue #275 measured it:

```text
$ gh api repos/mlorentedev/web/branches/master/protection
required_status_checks.contexts : null
$ gh api repos/mlorentedev/web/rulesets --jq length
0
```

Branch protection existed (admins enforced, linear history on) but had no
checks attached, so a pull request was mergeable with `Test`, `Validate build`
and GitGuardian all red. Every gate this repo had built was advisory, and #269
had merged untriaged as the proof.

Attaching the existing jobs was not a fix. `validate` reports as
`Validate build / Build pr-<N>` because `pr-validation.yml` passes
`tag: pr-${{ github.event.pull_request.number }}` to the reusable build. A
required context that names one PR matches no other PR, so requiring it would
have been one more rule that cannot fire.

Separately, a green `review` job from PR-Agent did not mean a review existed:
on #271 the action reported success having published nothing. "Reviewed" had
no definition a machine could check.

## Decision

### 1. One aggregator job with a name that never changes

`pr-validation.yml` carries a job named **`PR gate`** that depends on every
job the PR must pass (`needs: [test, validate, closing-refs]` at the time of
writing). Three properties are load-bearing:

- **`if: always()`.** Without it the job is skipped when a dependency fails,
  and a skipped required check does not block a merge; GitHub reports it
  neutral. The job has to run and fail.
- **Every result is compared to `success` explicitly.** `needs` treats a
  skipped dependency as satisfied, so a job skipped by a path filter, cancelled,
  or never started would otherwise read as a pass.
- **The list is derived, not restated.** The step reads `toJSON(needs)` through
  `env`, so every job in `needs` is checked by construction and `needs` is the
  only list to edit. It also refuses an empty `needs`, because a gate with no
  dependencies passes green having verified nothing. The first version of the
  job kept a second, hand-written list of results and drifted; `lesson-029`
  records why that shape is worse than no gate.

### 2. Required contexts on `master`

Branch protection on `master` requires exactly:

| Context | Source | Why |
|---|---|---|
| `PR gate` | `pr-validation.yml`, job `gate` | The single stable name; covers every job in its `needs`. |
| `GitGuardian Security Checks` | GitGuardian app | Secret detection, independent of this repo's workflows. |

`strict` (branch must be up to date) is **off**. Verified against the API on
2026-09-06 and again on 2026-09-22; the values match the command #276 asked the
owner to run.

Deliberately **not** required, each for a stated reason:

- **CodeRabbit.** Its OSS quota is exhausted most of the time and it reports
  success regardless, so requiring it gates on a check that means nothing. It
  stays registered as an *advisory* reviewer (below).
- **`review` (PR-Agent).** It can report success having published nothing, as
  on #271. The fix is the attestation check in section 3, not a required
  context.
- **`strict`.** Re-read and declined again on 2026-09-22 (#343), with the
  reasons measured rather than inherited:
  - *What `strict: false` costs is now bounded.* A PR's checks run against its
    own head, so with a stale base the merge commit is a tree nothing tested.
    Until #343 that commit was exactly what `release.yml` built, dispatched to
    staging and later re-tagged for prod. `release.yml` now runs the same suite
    (`test.yml`) on the merge commit and `build` needs it, so a semantic
    conflict between two green PRs surfaces as a red master push that publishes
    no image. `strict` would only move that detection from after the merge to
    before it.
  - *The release-please cost is real, not hypothetical.* release-please does not
    re-push its branch when a push produces no changelog change: `#312` merged
    with its head on `bc95720` while master was already on `3b2195d` (`#339`, a
    `chore:`). Under `strict` that release PR would have been `BEHIND` and
    needed an update-branch before it could ship, and so would every open
    Dependabot PR after each merge.
  - Revisit if a red master push from a stale-base merge is ever observed:
    that is the event `strict` prevents, and it has not happened yet.

**Approvals are not required, and that is the decision** —
`required_approving_review_count` is `0` (`enforce_admins: true`,
verified against the API 2026-09-07). This is a single-maintainer repo: setting
it to 1 would mean no pull request could ever merge without recruiting a second
GitHub account, so the rule would be satisfied by inventing an approver rather
than by adding a reviewer. The human gate here is the **deliberate merge** —
auto-merge is forbidden repo-wide (`allow_auto_merge=false`), so a person reads
the diff and clicks. **What GitHub enforces is exactly the two required contexts
in section 2 and nothing else.** The attestation in section 3 reddens the
`review` job, which section 2 deliberately leaves un-required — so a PR with no
published review is *mergeable*, and what stops it is the person, not the
platform. That is the same shape as this paragraph: the enforcement is real, and
it stops one step short of where a reader might assume. What a person supplies
is the judgement to merge and the refusal to merge unreviewed work.
Recorded because a protection that reads as enforced but
is convention is worse than one that is honestly named — anyone auditing this
repo should find the answer here rather than infer it from a `0`.

### 3. What "reviewed" means: the attestation registry

A PR is reviewed when a comment on it carries a **review marker** from a
**registered reviewer**. Both are declared in
[`harness/review-attestation.json`](../../harness/review-attestation.json)
(#159), not in prose:

- `github-actions` is PR-Agent, posting through `GITHUB_TOKEN`; its marker is
  `## PR Reviewer Guide`. It is the reviewer of record.
- `coderabbitai` is **advisory**: its review attests, but its decline
  (`rate limited by coderabbit.ai`) yields *pending*, never *refused*.
- Release PRs are **exempt by signature** (`.release-please-manifest.json` and
  `CHANGELOG.md` in the diff): a release PR restates commits already on
  `master`, each reviewed when it merged.

**The attestation check.** The last step of `pr-agent.yml`, `Fail if no review
was published`, runs `if: always()` after the PR-Agent action. It reads the
`github-actions` marker from the registry **on the default branch** (so a PR
cannot rewrite the marker it is checked against), pages through the PR's
comments, and fails the job if no comment contains it. A green PR-Agent action
therefore cannot stand in for a review that was never posted; the failure names
the likely cause (NaN concurrency limit reached).

**Disposition, not just presence.** Reviewer output is dispositioned on the PR
under the heading `## Review triage` (the registry's `triage.marker`), each
finding applied, ticketed or declined with a reason. `dotf pr triage-queue`
reads the registry and lists PRs whose newest reviewer output is newer than
their newest triage; it is run at session start and before reporting PR work
complete. Merging unreviewed is allowed, silently is not: the escape is the
label `merged-unreviewed` plus a `## Unreviewed merge rationale` section on the
PR, both declared in the registry.

### 4. Adversarial reviews: the reviewer pool

For a change that closes a spec, the review before archive must not come from
the model family that implemented it. The allow-list of model ids permitted to
sign a `review.md`, with each entry's provider, model and scoped credential, is
[`harness/reviewer-pool.json`](../../harness/reviewer-pool.json) (#283, closing
#277). `dotf spec review` draws a reviewer from it and `dotf spec archive`
refuses a review signed outside it. Its `$comment` carries the incident that
put it here (WEB-080, reviewed by `claude-sonnet-5` against a `claude-opus-5`
implementation, caught only because the reviewer said so in prose) and the
reason kubelab's copy was not the source.

## Consequences

- A red `Test`, `Validate build` or `Release closing refs` now blocks a merge,
  and so does a skipped or cancelled one.
- The suite behind `Test` is `test.yml`, called by both `pr-validation.yml` and
  `release.yml` (#343). On a push to master it runs before `build`, so the
  merge commit is tested before it becomes an image. A red master push is
  therefore possible and means "nothing shipped", not "something broken
  shipped". `site/tests/delivery-gate.test.mjs` asserts both callers and that
  no job that ships can start without it.
- Adding a job to the PR's obligations is one edit: add it to `gate.needs`.
  Nothing else in the gate has to change, and the derived check makes that
  sentence true rather than a claim (`lesson-029`, `lesson-017`).
- Renaming the `gate` job, or the workflow's job name `PR gate`, silently
  detaches branch protection; the required context is a string on the remote.
  Treat the name as an interface.
- Two files under `harness/` are now load-bearing for CI and for `dotf`:
  `review-attestation.json` (which comment counts as a review, and where triage
  is recorded) and `reviewer-pool.json` (who may sign an adversarial review).
  No test in this repo guards their contents; they are held by review.
- Branch protection itself was set by hand (#276's `gh api` call). Since
  2026-09-23 it is declared in kubelab, in `infra/config/values/common.yaml`
  under `ci.branch_protection` → `mlorentedev/web` → `master`, with the values in
  section 2. `make branch-protection-check` there (`toolkit tools
  branch-protection --check --all`) compares the live object with that entry and
  fails on any difference. The check is not scheduled yet: reading protection
  needs `administration: read`, which a workflow's own token cannot have, and
  the CI GitHub App meant to carry it does not exist. Until then kubelab's
  manual `Branch protection drift` workflow, or the make target, is the way to
  re-measure. A change to section 2 is a change to that entry too.

## Alternatives considered

- **Require the existing job contexts.** Rejected: `Validate build / Build pr-N`
  names a PR, so it gates nothing (Context).
- **Require the `review` context.** Rejected: success without a published
  review was already observed (#271). The attestation step is the mechanism.
- **A GitHub ruleset instead of classic protection.** Not taken up; classic
  protection was already in place with admins enforced, and the gap was the
  empty contexts list, not the mechanism.

## Related

- #275 (measurement), #276 (the gate, merged 2026-09-02), #159 (attestation
  registry and PR-Agent workflow), #277 / #283 (reviewer pool)
- `docs/lessons/lesson-029` (a gate that restates its `needs` list),
  `lesson-019` (a guard that cannot fail), `lesson-015` (skipped and nothing-to-do
  look identical), `lesson-032` (a refusal is not proof of which check fired)
- ADR-055 (release PRs, the exempt signature)
