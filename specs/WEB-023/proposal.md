# WEB-023 — Release automation (semver image for prod)

> Issue: #10 · ADR-046 (prod tracks semver) · ADR-053 (platform/product split)

## Context

ADR-053 split web out of the kubelab monorepo. kubelab's `release.yml` +
`ci-publish.yml` previously ran release-please for `apps/web` and published the
semver image; that was removed from kubelab with the split. Staging works today
(immutable `sha-<short>` via `build-deploy.yml` + `repository_dispatch`). Prod
(ADR-046 — prod tracks semver, gated by kubelab's `promote-prod.yml`) has no web
artifact to promote: `promote-prod.yml` refuses a registry tag that does not exist.

## What

Re-home the release automation into web, single-app and simplified:

- `release-please-config.json` + `.release-please-manifest.json` (`release-type:
  simple`, root package, seed `0.1.0`, plain `vX.Y.Z` git tags).
- `release.yml`: release-please on `master`; on `release_created`, build + push the
  immutable multi-arch image `mlorentedev/kubelab-web:X.Y.Z`.
- Extract the existing `build-deploy.yml` `build` job into a reusable
  `build-image.yml` (`workflow_call`), reused by both the sha (staging) and semver
  (prod) paths — one build definition, arch + Dockerfile parity.

## Contract (confirmed)

kubelab `promote-prod.yml` is a manual `workflow_dispatch`: a human picks
`app=web` + a bare-semver `version` (e.g. `1.1.1`) that must already exist in the
registry. So web's only obligation is to publish `kubelab-web:X.Y.Z`. **No kubelab
change is needed** — `promote-prod.yml` already lists `web` as a choice.

## Reused vs simplified (not reinvented)

Ported from kubelab's proven setup; shed the monorepo-only weight:

- **Keep:** release-please-action@v5, reusable `workflow_call` docker build,
  multi-arch, Trivy + SARIF, immutable semver tag.
- **Drop:** multi-component manifest (web is one package → `simple`); the
  `web-vX.Y.Z` component tag → plain `vX.Y.Z`; the n8n build-notify webhook; the
  CalVer global bundle (`ci-release.yml`); the mutable `:latest` alias
  (ADR-046 is immutable-only).

## Acceptance criteria

1. Merging a `feat:`/`fix:` to `master` opens/updates a release PR (version + CHANGELOG).
2. Merging the release PR cuts a `vX.Y.Z` tag + GitHub release and pushes a
   multi-arch `mlorentedev/kubelab-web:X.Y.Z` to Docker Hub.
3. The staging path (sha image + dispatch) keeps working unchanged.
4. `toolkit deployment promote --env prod --app web --version X.Y.Z` finds the tag.

## Decisions / notes

- **Build prod by rebuild-from-release-commit** (not digest-retag): avoids a
  cross-workflow race; the shared reusable workflow guarantees arch/Dockerfile
  parity with what staging validated.
- Image tag = release-please `version` output (bare semver); git tag = `vX.Y.Z`.
- Release outputs are parsed defensively with `jq` (manifest mode keys them by
  package path, `.--version`) so a key-format change can never silently skip publish.
- The PR build check job name changes (reusable extraction) — update branch
  protection if it pins the old name.
- `RELEASE_PLEASE_PAT` optional (so the release PR triggers `pull_request` checks);
  falls back to `GITHUB_TOKEN` during rollout.

## Out of scope

Astro 6 (WEB-022), same-origin `/api` (WEB-021), kubelab-side manifests (ADR-053).
