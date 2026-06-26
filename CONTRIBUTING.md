# Contributing to web

Frontend for **mlorente.dev** (and later kubelab.live). Code lives here; Kubernetes
manifests and the Go API stay in **kubelab** (ADR-053).

## Workflow

- **Trunk-based**: `master` is the only permanent branch. Use `feature/`, `fix/`,
  `chore/`, `docs/` branch prefixes. All PRs **squash-merge** to `master`.
- **Conventional commits**: `feat:`, `fix:`, `chore:`, `docs:` … Release automation
  reads these.
- **English only** in commits, branches, PR titles/bodies, and code comments.
- **No auto-merge.** Every PR merges after review + green CI.

## Local development

```bash
cd site
npm install
npm run dev        # Astro dev server; no cluster required
```

The site calls the API same-origin at a relative `/api` (ADR-054). For local dev
(no backend), set `PUBLIC_API_URL` to a real API host — host only; the call sites
add `/api/...`. See `site/src/data/site.ts`.

## Before you push

```bash
pre-commit install           # once, after clone (requires pre-commit)
pre-commit run --all-files
cd site && npm run build     # must pass
```

## Two-repo flow (ADR-053)

A push to `master` builds an immutable `sha-<short>` image, pushes it to Docker Hub,
and fires a `repository_dispatch` to **kubelab**, which promotes it to staging via
`toolkit deployment promote`. A change that also needs a manifest/overlay edit spans
**two repos** — open that PR in `kubelab`.
