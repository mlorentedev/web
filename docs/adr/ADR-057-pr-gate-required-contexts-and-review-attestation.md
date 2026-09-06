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
2026-09-06; the values match the command #276 asked the owner to run.

Deliberately **not** required, each for a stated reason:

- **CodeRabbit.** Its OSS quota is exhausted most of the time and it reports
  success regardless, so requiring it gates on a check that means nothing. It
  stays registered as an *advisory* reviewer (below).
- **`review` (PR-Agent).** It can report success having published nothing, as
  on #271. The fix is the attestation check in section 3, not a required
  context.
- **`strict`.** Forces a rebase per merge and interacts badly with
  release-please regenerating its PR body. Separate decision if ever needed.

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
- Branch protection itself is remote state set by hand (#276's `gh api` call).
  It is not IaC and can drift; re-measure with the command in Context before
  trusting it.

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
