# ADR-058: What `mlorentedev/kubelab-web:latest` means, and who may consume it

- **Status:** Accepted
- **Date:** 2026-09-07
- **Deciders:** Manu Lorente
- **Extends / refines:** ADR-055 (build-once / promote-by-digest), ADR-046 D2 (kubelab's staging lane publishes no mutable alias)
- **Scope:** web (`.github/workflows/release.yml`, `README.md`), and the contract kubelab relies on when it pins an image

> Closes WEB-079 (#173) AC3 and AC4. The mechanism has worked since 1.11.0; what
> was never written down is what the alias *promises*. This file is that promise.

## Context

`release.yml`'s promote step writes `-t "${IMAGE}:${VERSION}"` and
`-t "${IMAGE}:latest"` in a single `docker buildx imagetools create` call, so a
completed release moves both together. #173 opened because the alias had frozen
at `1.1.1` (2026-06-15) through nine releases — not because the code was wrong,
but because the promote step had never run against a completed release.

It has now run against five. Measured 2026-09-07, digest = `sha256sum` over
`docker buildx imagetools inspect --raw` (the multi-arch manifest **list**, not
one platform's image):

```text
latest    981e221a43bf5d22
1.15.0    981e221a43bf5d22
1.14.0    0255aacc795c5875
```

`latest` and `1.15.0` are one object under two names. The mechanism is sound.

**What was still undecided** is the meaning, and #173 was right that an alias
meaning different things in two repos of one platform is its own defect. Two
facts sharpen it, both measured rather than remembered:

- **No environment consumes it.** Production pins an immutable semver tag
  (kubelab `overlays/prod/generated/deployments.yaml`), staging pins a `sha-*`
  tag. Neither resolves `latest`. Its staleness was therefore never the cause of
  the frozen production deploy (#190) — that was a coincidence of dates, not one
  mechanism.
- **No document consumed it either.** As of this ADR, `grep -n 'latest\|docker run' README.md`
  returned nothing. The alias had zero declared consumers, human or machine —
  which is what made AC4 ("consider removing it") a live option rather than a
  formality.

## Decision

**`latest` means: the newest completed semver release of this site's image, byte-identical to that semver tag. It exists for humans, and no environment may pin it.**

Three parts, each checkable:

1. **Newest completed release.** It moves only in the promote step, only when a
   release PR merges, and only by re-tagging the digest staging validated. It is
   never written by a push build — a `sha-*` image is not a release.
2. **Human-facing only.** Its sole sanctioned consumer is a person running the
   published image to look at the site. `README.md` now carries that `docker run`
   line, so the alias has exactly one declared consumer instead of none.
3. **Not pinnable.** No Kubernetes manifest, overlay, Helm value or CI job in
   either repo may reference `:latest`. ADR-055 already calls a mutable tag in
   the cluster the antipattern; this states the same rule from the publisher's
   side, so it can be enforced where the tag is written, not only where it is
   read.

**Consistency across the platform.** kubelab's `api` publishes `latest` on the
same terms — `kubelab-api:latest` and `kubelab-api:1.1.1` share a digest — while
ADR-046 D2 keeps mutable aliases off the *staging* lane. Both repos therefore
mean the same thing by `latest`: the newest release, never the newest build.

## Consequences

- The alias stays, with upkeep that is already automatic (one `-t` flag in a
  step that runs per release).
- A `latest` that disagrees with the newest semver tag by digest is now a
  defect with a name, not an ambiguity. The check is the three-line
  `imagetools inspect --raw | sha256sum` comparison above.
- If the README line is ever removed, the alias returns to zero declared
  consumers and this decision should be revisited toward deletion rather than
  left standing on habit.
- **Deleting it is not a free action.** Docker Hub keeps serving the last value
  of a deleted alias to nobody, but a reader who has seen `latest` work will
  read its absence as a broken publish. If it goes, it goes with the README line
  and a note in `docs/`.

## Alternatives considered

- **Delete the alias (#173 AC4).** Genuinely attractive at the time: nothing
  consumed it, and "an alias nobody is allowed to depend on is a trap with
  upkeep". Rejected because the upkeep is one flag in a step that already runs,
  the trap is closed by part 3 above being written down and enforceable, and a
  public image whose `latest` 404s is a worse first impression than one that is
  correct. The honest version of "keep" required giving it a real consumer,
  which is why the README line is part of this decision and not a separate
  nicety.
- **Point `latest` at the newest `sha-*` build.** Rejected: it would make
  `latest` mean the opposite in web and in kubelab's staging lane, which is the
  exact defect #173 identified.

## Related

- #173 (WEB-079), #190, #172 (WEB-078) — the release that never published.
- ADR-055 (semver everywhere, promote by digest), ADR-046 D2 (kubelab).
