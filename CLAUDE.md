# web — Project Instructions

> Read `AGENTS.md` (repo root) first — the canonical cross-agent behaviour SSOT
> (deployed from dotfiles). This file adds web-repo-specific notes only.

## What this is

Frontend product repo for **mlorente.dev** (later also kubelab.live) — an Astro
static site built to a Docker image and deployed through the **kubelab** platform
(ADR-053). Code lives here; **K8s manifests and the Go API stay in kubelab**.

## Two-repo flow (ADR-053)

- A push to `master` builds an immutable `sha-<short>` image → Docker Hub
  `mlorentedev/kubelab-web` → fires a `repository_dispatch` to `mlorentedev/kubelab`.
- kubelab's receiver runs `toolkit deployment promote --env staging --app web
  --version sha-<short>`; Argo CD syncs staging → (gated) prod.
- A change that also needs a manifest/overlay edit spans **two repos** — open the
  manifest PR in kubelab.

## Inner loop

From `site/`: `npm install && npm run dev` (Astro dev server, no cluster needed).
API base via `PUBLIC_API_URL` (`site/src/data/site.ts`).

## Conventions

- Trunk-based: `master` only; `feature/|fix/|chore/|docs/` branches; squash-merge;
  conventional commits.
- English in git/GitHub artifacts. No AI attribution. **Auto-merge forbidden.**
- `pre-commit install` after clone.

## Knowledge placement

Build/operate docs live in `docs/` (`adr/`, `runbooks/`, `troubleshooting/`,
`lessons.md`). Cross-project patterns go to the vault `00_meta/`, not here.
