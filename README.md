# mlorente.dev

Frontend for **mlorente.dev** — a personal site / portfolio built with [Astro](https://astro.build).
The code lives in this repo; it is built to a Docker image and deployed through the
**[kubelab](https://github.com/mlorentedev/kubelab)** platform (ADR-053). Kubernetes
manifests and the Go API stay in kubelab.

> Later this repo will also serve `kubelab.live`. Today it ships `mlorente.dev` only.

## Local development

No cluster required:

```bash
cd site
npm install
npm run dev        # Astro dev server
```

The API base URL is read from `PUBLIC_API_URL` (see `site/src/data/site.ts`).

```bash
PUBLIC_API_URL=https://api.kubelab.live npm run dev
```

## Project structure

```text
.
├── Dockerfile        # build: Astro static output → nginx (build context = repo root, COPY site/…)
├── site/             # the Astro app
│   ├── astro.config.mjs
│   ├── package.json
│   ├── tailwind.config.mjs
│   ├── public/       # static assets
│   └── src/
│       ├── components/
│       ├── content/  # content collections (notes, projects)
│       ├── data/     # site config (site.ts)
│       ├── layouts/
│       ├── pages/
│       └── styles/
├── CLAUDE.md         # agent instructions (two-repo flow)
└── docs/             # build/operate docs (adr, runbooks, troubleshooting, lessons)
```

## Deployment — the two-repo flow (ADR-053)

This repo holds **code**; the platform repo (`kubelab`) holds the **K8s manifests**. Delivery is push-based:

1. A push to `master` builds an immutable `sha-<short>` image and pushes it to Docker Hub
   (`mlorentedev/kubelab-web`).
2. On success, CI fires a `repository_dispatch` (`web-image-published`) to `mlorentedev/kubelab`.
3. kubelab's receiver runs `toolkit deployment promote --env staging --app web --version sha-<short>`;
   Argo CD syncs the new tag to staging, then prod via the gated promotion.

A change that **also** needs a manifest/overlay edit spans two repos — open that PR in `kubelab`.

## Conventions

- **Trunk-based**: `master` only; `feature/` `fix/` `chore/` `docs/` branches; **squash-merge**.
- **Conventional commits** (`feat:`, `fix:`, `chore:`, `docs:` …) drive release automation.
- **English** in all git/GitHub artifacts. **Auto-merge is disabled** — every PR merges after review.
- Run `pre-commit install` after cloning.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full workflow.
