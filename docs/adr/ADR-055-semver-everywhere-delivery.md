# ADR-055: SemVer releases + build-once / promote-by-digest delivery

- **Status:** Accepted
- **Date:** 2026-06-25
- **Deciders:** Manu Lorente
- **Extends / refines:** ADR-046 (prod tracks semver), ADR-053 (two-repo flow)
- **Scope:** web (this repo, image build + tagging) + kubelab (GitOps manifests)

> **Numbering:** `ADR-055` is provisional — confirm against the vault's global ADR
> sequence. The decision is independent of the number.
>
> **Supersedes the first draft of this ADR** (PR #18), which leaned toward
> per-commit SemVer pre-release tags on staging (`X.Y.Z-rc.N`). Grounding research
> (see Sources) showed that adds real complexity for cosmetic gain and bends the
> `-rc` convention. The substance of "professional" delivery is **build-once +
> immutable promotion**, not the staging tag string. Reoriented to Option B.

## Context

`web` is built to a Docker image and delivered through kubelab (ADR-053):

- **Staging** — every push to `master` builds `kubelab-web:sha-<short>` (immutable)
  and fires a `repository_dispatch`. kubelab's receiver runs `toolkit deployment
  promote`, which regenerates `infra/k8s/overlays/staging/generated/deployments.yaml`
  with that image tag and opens a PR; on merge **Argo CD** syncs staging.
- **Prod** — release-please cuts `vX.Y.Z`; today `release.yml` **rebuilds** a
  separate `kubelab-web:X.Y.Z` image; `promote-prod.yml` writes it into the prod
  overlay; Argo CD syncs prod.

The image tag lives **in git, per environment** (`overlays/<env>/generated/
deployments.yaml`) as the declarative desired state Argo CD reconciles to.

### The actual defect

Not the `sha-` tag — that is fine. The defect is that **`release.yml` rebuilds**
the prod image from the release commit. That image (a) is built at a different
time than the staging image (base-layer / transitive-dep drift) and (b) was never
run in staging as those exact bytes. Prod ships something staging never validated.

## Decision — Option B (build-once, promote the digest)

1. **Staging keeps the immutable `sha-<short>` tag.** Pinning the image to its
   source commit is a documented traceability best practice, and per-environment
   schemes (sha for continuous, semver for releases) are standard. release-please
   remains the single source of the semver line.
2. **Prod = clean `X.Y.Z`, produced by re-tagging the validated staging digest**
   (`docker buildx imagetools create -t …:X.Y.Z …:sha-<short>`) — **not a
   rebuild.** The bytes Argo CD runs in prod are the exact bytes validated in
   staging.
3. **kubelab's GitOps manifests are unchanged.** They reference the image by its
   immutable tag in git per environment; prod's `:X.Y.Z` now resolves to the
   staging-validated digest.

## Why this is the professional baseline (and why the manifest tag is NOT an antipattern)

The "professional" substance is the **promotion model and immutability**, not the
tag string:

- **Build once, never rebuild between environments** — the exact digest that
  passed staging is promoted to prod. This is the gold standard; it is precisely
  what the current rebuild violates.
- **An image tag committed to git per environment is canonical GitOps, not
  hardcoding.** Git is the declarative SSOT of desired state; Argo CD reconciles
  the cluster to it. The *antipattern* is committing a **mutable** tag (`:latest`,
  `:staging`, `:main`) — Argo CD can't see when its digest changes, so the cluster
  drifts. kubelab commits **immutable** tags (`sha-<short>`, `X.Y.Z`) via an
  automated, PR-gated promotion (`values/<env>.yaml` → `toolkit promote` →
  regenerated overlay → PR → sync). That is the correct pattern.
- **Per-environment tag schemes are explicitly endorsed** (sha/edge for
  continuous, controlled semver for prod).

### Optional hardening (not adopted)

Pinning the manifest by **digest** (`…@sha256:…`) instead of tag is the maximally
immutable form, but it costs readability (the version is no longer visible in the
manifest) and adds tag→digest resolution to the promote tooling. Immutable tags +
re-tagging the validated digest already give build-once. Revisit only under a
specific threat model (e.g. a shared registry where tags could be force-repushed).

## Consequences

**Positive**
- Fixes the rebuild defect: prod runs the staging-validated bytes.
- Minimal blast radius — only web's `release.yml` changes (build → re-tag);
  kubelab is untouched; prod manifests stay readable (`:1.2.0`).
- One version engine (release-please); no next-version prediction.

**Negative / accepted**
- Staging tags stay `sha-<short>` (not semver). Accepted — a best practice, not a
  smell; the only thing given up is "which release is this a candidate for"
  readability, which the dispatch payload and staging PR title already carry.

## Implementation

- **web `release.yml`:** on `release_created`, do **not** `docker build`; re-tag
  the already-built `sha-<short>` digest to `X.Y.Z` and push. The release-commit's
  own `sha-<short>` image (built by `build-deploy.yml` on the same push) is the one
  to re-tag, so the prod digest equals that commit's staging digest. Consolidating
  the two builds to remove the cross-workflow race is the cleanest form.
- **web `build-deploy.yml`:** unchanged (staging stays `sha-<short>`).
- **kubelab:** unchanged. (PR #765, which widened the receiver to also accept
  `X.Y.Z-rc.N`, is unnecessary for B — close it, or keep as forward-compat for a
  future Option A.)

## Alternatives considered

- **Option A — per-commit SemVer pre-release tags on staging** (`X.Y.Z-rc.N`).
  Semver everywhere, but: requires predicting the next version between releases
  (undefined when only chores have landed); `-rc` conventionally means a
  post-sign-off candidate, not every commit (the continuous form is
  `X.Y.Z-dev.N+<sha>`); and it adds a version engine. Higher complexity for
  cosmetic gain. Rejected as the baseline; remains possible future polish.
- **Option C — semver everywhere but rebuild on release.** Keeps the rebuild
  defect. Rejected.

## Sources

- Image promotion / never rebuild between environments — devopscube; container
  image tagging best practices (include the git SHA; pin prod by digest).
- Argo CD Image Updater update strategies (immutable tags; digest strategy for
  mutable / env-named tags; per-environment semver constraints).
- GitVersion continuous-deployment versioning (pre-release label + sha build
  metadata).

## Related

- `bootstrap-sha` in `release-please-config.json` anchors the first clean release
  (`1.2.0`) past the `0.2.0` episode; removable after the first release PR merges.
- ADR-046 (prod semver) — extended here to the full delivery model.
- ADR-053 (two-repo flow) — the promotion boundary.
