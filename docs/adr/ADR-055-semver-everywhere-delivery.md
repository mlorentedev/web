# ADR-055: SemVer-everywhere delivery with build-once / promote-by-digest

- **Status:** Proposed
- **Date:** 2026-06-25
- **Deciders:** Manu Lorente
- **Extends / refines:** ADR-046 (prod tracks semver), ADR-053 (two-repo flow)
- **Scope:** web (this repo, image build + tagging) + kubelab (promotion side)

> **Note on numbering:** `ADR-055` is provisional — confirm against the vault's
> global ADR sequence before marking Accepted. The decision below is independent
> of the number.

## Context and problem statement

`web` is built to a Docker image and delivered through kubelab (ADR-053). Today
the pipeline speaks two version vocabularies and builds the image twice:

- **Staging** — every push to `master` builds `kubelab-web:sha-<short>`, fires a
  `repository_dispatch` to kubelab, which promotes that tag to staging.
- **Prod** — release-please cuts `vX.Y.Z`; `release.yml` then builds a *separate*
  `kubelab-web:X.Y.Z` image, which kubelab's manual gate promotes to prod.

Three problems follow:

1. **Build-twice / drift.** The prod image is rebuilt from the release commit —
   a commit that only adds the CHANGELOG + version bump and was *never built or
   tested as an image in staging*. The bytes that reach prod are not the bytes
   validated in staging (different digests; base-image and transitive-dep drift
   between two build times).
2. **Opaque staging identity.** `sha-<short>` is immutable but not
   self-describing — you cannot tell from the tag which release a staging build
   is a candidate for.
3. **Mixed vocabulary.** Staging speaks `sha-`, prod speaks semver — two schemes
   for one delivery stream, which reads as ad hoc rather than deliberate.

(Separately, the first release-please run cut an erroneous `0.2.0` by sweeping
inherited monorepo history; recovered in #17. That incident is about release
*baseline* hygiene, not the scheme here, but it reinforced the need for a single,
well-anchored source of version truth in the release path.)

## Decision

Adopt **SemVer for both channels, build the image once, and promote the digest.**

1. **Single version source — release-please.** Its *pending* version (recomputed
   on every push) drives the staging tag; its *released* version drives prod. No
   second bump engine (no `svu`/`git-cliff` competing with release-please).
2. **Staging = pre-release semver:** `X.Y.Z-rc.<N>`. Per the SemVer spec a
   pre-release sorts *below* its release (`X.Y.Z-rc.1 < X.Y.Z`), which is exactly
   "candidate that gets promoted to the release". Valid Docker tag (no `+`).
3. **Prod = clean `X.Y.Z`,** produced by **re-tagging the same image digest** that
   ran in staging — not a rebuild. The digest validated in staging is the digest
   that ships.
4. **Cross the repo boundary by digest/tag.** The `repository_dispatch` to kubelab
   carries the semver(-rc) tag; kubelab promotes the corresponding digest, so
   build-once holds end to end.

## Consequences

**Positive**

- Byte-identical staging ↔ prod — the promoted digest *is* the validated one.
- One monotonic semver vocabulary across the whole pipeline; prod releases stay
  clean; staging tags are self-describing and ordered.
- The release path has one authority for "what version is this", removing the
  class of bug behind the `0.2.0` incident.

**Negative / costs**

- **Tag sprawl** in Docker Hub (`-rc.N` per push) → needs a retention/cleanup
  policy (e.g. keep last N rc tags per minor, prune on release).
- **Cross-repo coordination.** web's dispatch payload changes from `sha-...` to
  `X.Y.Z-rc.N`; kubelab's receiver must accept the new format. The two repos must
  change in a coordinated order — **kubelab tolerant first** (accept both old and
  new tag shapes), then web flips the tag, then kubelab can drop the old shape.
- **Pipeline consolidation.** Computing the pending version requires
  release-please's output at staging-build time, so the staging and prod builds
  should key off a *single* release-please invocation rather than two independent
  workflows running release-please separately (which would double-create release
  PRs).

## Implementation sketch — web

Consolidate the master-push delivery around release-please's output:

- `release_created == true` → **promote** the staging digest to `X.Y.Z`
  (`docker buildx imagetools create` / `crane tag`), push, dispatch prod.
- else → build `X.Y.Z-rc.<run_number>` from the **pending** version, push,
  dispatch staging.
- Pull-request builds stay a Dockerfile-only validation (no push, no version).
- Keep `build-image.yml` as the shared build definition (arch + Dockerfile parity).

## Implementation sketch — kubelab

- Receiver accepts the semver(-rc) tag (tolerant of `sha-` during migration);
  promotion references the image **by digest** where possible.

## Alternatives considered

- **Option B — keep `sha-` for staging, clean semver for prod, promote digest.**
  Simpler (single version engine, no pending-version computation), build-once
  preserved, but staging stays `sha-`. Rejected as the target because it doesn't
  meet the semver-everywhere goal — but B is a **strict subset of A** and remains
  a valid incremental step / fallback (B → A is non-breaking).
- **Option C — semver everywhere but rebuild on release.** Minimal infra, no
  digest promotion, but keeps the build-twice drift and the staging `-dev`/`-rc`
  base can mismatch the eventually-cut version. Rejected.

## Related

- `bootstrap-sha` in `release-please-config.json` anchors the first clean release
  (`1.2.0`) past the `0.2.0` episode; removable after the first release PR merges.
- ADR-046 (prod semver) — this record extends its scope to staging.
- ADR-053 (two-repo flow) — the promotion boundary this decision crosses.
