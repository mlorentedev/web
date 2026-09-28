---
id: lesson-062-a-doc-moved-out-of-a-repo-leaves-every-copie
type: lesson
status: active
created: "2026-09-27"
owner: manu
tags: [web, docs, ci, hygiene]
---

# A doc moved out of a repo leaves every copied comment pointing at nothing

**Context**: `.github/workflows/add-to-project.yml` and `bitacora-status.yml` are
deployed into every repo linked to the bitácora board from canonical copies in the
dotfiles repo, by `scripts/bitacora-rollout.sh`. The header of this repo's
`bitacora-status.yml` ended with
`Full reference: docs/runbooks/guide-bitacora-setup.md §2 / §5 / §7.`

**Problem**: That runbook never existed in this repo. It lived in dotfiles and moved
to the vault as `00_meta/runbooks/bitacora-project-setup.md` on 2026-07-07. The
canonical copy was corrected, but this copy never received the correction. It went
unnoticed for almost three months: a path in a comment is prose, and no build, test
or link checker reads it. It surfaced when someone went looking for the runbook
while checking why an issue showed In Progress on the board.

Following the dangling path led to the larger defect. Both copies here had drifted
from the canonical ones. `add-to-project.yml` still lacked the retry and rate-limit
handling that keeps the board from losing items. The rollout that should have
delivered all of it crashed at the first repo with an open item, outside
`--backfill-only`. A dry run stopped at the third of 25 repos, and at least ten of
them carry the stale line.

**Solution**: the two workflows were synced byte-for-byte to the canonical copies
(web#432). The rollout crash is fixed in dotfiles#1788, and drift detection is
proposed in dotfiles#1787. `scripts/check-doc-refs.sh` fails when a
`docs/{adr,lessons,runbooks,troubleshooting}/*.md` path named in `.github/`,
`scripts/`, `docs/` (outside `docs/lessons/`), `AGENTS.md`, `README.md` or the
`Makefile` does not exist here. It runs in `repo-hygiene.yml` and as a pre-commit
hook, and on the tree before the sync it reported exactly this line. Some places are
left out on purpose, because they cite paths that exist elsewhere or no longer
exist:

- `site/` and `specs/` quote other repositories' docs paths.
- A path inside a URL names another repo.
- Lessons, this one included, quote paths as they were.

**Rule**: A dangling reference in a copied file is a symptom. Before fixing the
line, ask why the copy did not get the fix its source already has. When a doc moves
out of a repo, search every repo that copied a reference to it, not only the one it
left. A reference that only people read needs a check that fails, or it dangles
silently. A pointer to a doc in another repo or in the vault says so; a bare
`docs/...` path reads as local.
