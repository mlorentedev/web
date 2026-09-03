---
id: lesson-035-a-green-delivery-job-is-the-pipelines-claim
type: lesson
status: active
created: "2026-09-02"
owner: manu
tags: [web, delivery, ci-automation, verification]
---

# A green delivery job is the pipeline's claim, not the delivery

**Context**: Verifying the 1.12.0 release end to end. `Release & Deploy` ran on
`f98a705` and every job reported success:

```
Compute tag · Release Please · Build sha-f98a705 · Notify kubelab (staging) · Promote digest to semver
```

Five green squares, one release tag, one published image. The reasonable reading
is that 1.12.0 shipped.

**Problem**: It did not, and two of those five jobs cannot tell you whether it
did.

`Notify kubelab (staging)` is a `curl` at GitHub's `/dispatches` endpoint. It is
green when that endpoint returns 2xx — that is, when kubelab **received** an
event. Whatever kubelab then does or fails to do happens in another repository,
under another workflow, and reports nowhere near this square.

`Promote digest to semver` is worse, because its name suggests a deployment.
It runs `docker buildx imagetools create` and nothing else: it re-tags a
manifest in the registry. Prod is shipped by kubelab's own `Promote Prod`, which
is `workflow_dispatch` only — a human has to remember to run it.

Nobody had, since 16 June. Checked against the cluster:

```
infra/k8s/overlays/prod/generated/deployments.yaml:91  image: …/kubelab-web:1.1.1
Promote Prod runs:  2026-06-16 ×2, both workflow_dispatch, none since
docker hub:         1.2.0 … 1.12.0 all present, none ever promoted
```

**Production had been serving `1.1.1` for eleven consecutive releases**, while
every release pipeline in this repository went green every time. `#190` — nobody
has subscribed to the newsletter since June — is that fact seen from the outside.

**Solution**: Verify by consequence, one command per link, and never let a job's
name stand in for what it does.

```
digest      imagetools inspect --raw | sha256sum   sha-f98a705 == 1.12.0 == latest   ✅
artefacts   docker cp from the published image     82 pages, 2 ir-sha256 stamps      ✅
staging     gh pr list --repo …/kubelab            #1582 open, awaiting merge        ⏳
prod        overlay pin + Promote Prod run list    1.1.1, last run 2026-06-16        ❌
```

The chain is only as long as its last verified link, and four of those five green
squares said nothing about the last two rows.

**Rule**: A job that hands work to another system is green when the **handoff**
succeeded, never when the work did. Read what each delivery job actually runs,
then verify the far end by its own consequence — the pinned image in the
overlay, the running version, the tag in the registry. Where a step's name
implies more than it does (`Promote digest to semver` re-tags; it does not
promote anything to production), rename it or say so in a comment, because the
next reader will trust the name.

The deeper fix is to stop relying on a human to bridge the gap: the promotion PR
should open itself, leaving the human the merge and not the remembering. Filed
as `#295` and `kubelab#1585`. See also [`lesson-015`](lesson-015-a-step-that-was-skipped-and-a-step-with-no.md) — a step that was skipped and a step
with nothing to do look identical.
