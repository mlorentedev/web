# AGENTS.md

> **Single Source of Truth for AI coding agents in this repo** (Claude Code,
> Copilot, Cursor, Codex). Repo-specific context lives here; the universal
> behaviour rules are referenced under §Workflow Rules — not duplicated.

## What this is

Frontend product repo for **mlorente.dev** (later also kubelab.live) — an Astro
static site built to a Docker image and deployed through the **kubelab** platform
(ADR-053). Code lives here; **K8s manifests and the Go API stay in kubelab**.

## Tech stack

- **Framework:** Astro 5 (static output) — islands architecture, zero JS by default.
  Staying on Astro 5 until the deliberate 6 migration (WEB-022).
- **Styling:** Tailwind CSS 3 + `@tailwindcss/typography`.
- **Content:** MDX (`@astrojs/mdx`); sitemap (`@astrojs/sitemap`).
- **Node:** pinned in `.nvmrc`. **Source root:** `site/`.
- **Image:** Docker → Docker Hub `mlorentedev/kubelab-web`.

## Two-repo flow (ADR-053)

- A push to `master` builds an immutable `sha-<short>` image → Docker Hub
  `mlorentedev/kubelab-web` → fires a `repository_dispatch` to `mlorentedev/kubelab`.
- kubelab's receiver runs `toolkit deployment promote --env staging --app web
  --version sha-<short>`; Argo CD syncs staging → (gated) prod.
- A change that also needs a manifest/overlay edit spans **two repos** — open the
  manifest PR in kubelab.

## Inner loop

From `site/`: `npm install && npm run dev` (Astro dev server, no cluster needed).
API base is same-origin `/api` (ADR-054); set `PUBLIC_API_URL` to a real API host for
local dev only (`site/src/data/site.ts`). `make help` lists repo tasks.

## Conventions

- Trunk-based: `master` only; `feature/|fix/|chore/|docs/` branches; squash-merge;
  Conventional Commits.
- **Atomic PRs** — one logical change per PR, ~300-line cap (tests, lockfiles,
  generated files excluded).
- PR body must include `Closes #N` for each issue it resolves (one per line).
- English in git/GitHub artifacts. No AI attribution. **Auto-merge forbidden.**
- `pre-commit install` after clone.

## Documentation & knowledge placement

Build/operate docs live in [`docs/`](docs/) (docs-as-code): ADRs in `docs/adr/`,
runbooks, troubleshooting, and project lessons in [`docs/lessons.md`](docs/lessons.md).
Cross-project patterns and session memory live in the maintainer's vault, not here.
Task/backlog state lives in the **bitácora** GitHub Project (issues), per ADR-018 —
not in git history or the vault.

## Spec-Driven Development

This repo follows the **Spec-Driven Development per feature** pattern. Canonical
workflow at `$VAULT_PATH/00_meta/skills/spec/SKILL.md` (`$VAULT_PATH` resolved via
machine.json per ADR-025 — never hardcode a literal path). Three subcommands:

| Trigger phrase | Subcommand |
|---|---|
| "create a spec for X", "scaffold spec X", "start working on X" | `init <feature-id>` |
| "fill in proposal for X", "help me write the proposal" | `fill <feature-id>` |
| "archive spec X", "close spec X" | `archive <feature-id>` |

Per-feature specs live at `specs/<feature-id>/`; archived at `specs/archive/<feature-id>/`
(never deleted — audit trail). **Skip SDD for:** typos, comment-only edits, mechanical
refactors, bug fixes <20 lines with obvious cause, doc-only changes.

## Workflow Rules (read before first tool call)

This repo opts in to the global behaviour rules in `$DOTFILES/AGENTS.md` (resolved
via machine.json per ADR-025; fallback `~/Projects/Workspace/dotfiles/AGENTS.md`) —
the canonical cross-agent SSOT: Standing Orders, Decision Hierarchy, Model Selection,
Security HALT rules, and Operational Rules (no AI attribution, English-only artifacts,
auto-merge forbidden). Read it once at session start and apply it. The repo-specific
notes above override only where they are more specific.
