#!/usr/bin/env bash
# Guard: every docs/{adr,lessons,runbooks,troubleshooting}/*.md path this repo names in
# its own operating surfaces exists in this repo. A doc that moves out (the bitácora
# runbook went to the vault on 2026-07-07) leaves every comment pointing at it dangling,
# and nothing else notices: the path is prose, so no build or link checker reads it.
# Scope: .github/, scripts/, docs/, AGENTS.md, README.md, Makefile. Out of scope on
# purpose: site/ and specs/, which quote other repositories' docs paths by design, and
# docs/lessons/, which quotes paths as they were when the lesson happened. A path
# inside a URL (preceded by '/') names another repo and is skipped.
# Sibling: dotfiles' scripts/check-doc-paths.sh checks backticked paths in agent
# instruction files; this one checks docs paths in comments and prose.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# -I skips binaries; --untracked so a new file is checked before it is added.
refs="$(git grep -nIE --untracked \
  '(^|[^/A-Za-z0-9_.-])docs/(adr|lessons|runbooks|troubleshooting)/[A-Za-z0-9._-]+\.md' \
  -- .github scripts docs ':!docs/lessons' AGENTS.md README.md Makefile 2>/dev/null || true)"

missing=""
while IFS= read -r line; do
  [ -n "$line" ] || continue
  loc="${line%%:*}"; rest="${line#*:}"; lineno="${rest%%:*}"; text="${rest#*:}"
  # Every path on the line, not only the first. Not `path`: zsh ties that name to $PATH.
  # The boundary character is never a letter, so stripping one non-'d' drops it.
  while IFS= read -r ref; do
    [ -e "$ref" ] || missing+="  $loc:$lineno $ref"$'\n'
  done < <(printf '%s\n' "$text" \
    | grep -oE '(^|[^/A-Za-z0-9_.-])docs/(adr|lessons|runbooks|troubleshooting)/[A-Za-z0-9._-]+\.md' \
    | sed -E 's/^[^d]//')
done <<< "$refs"

if [ -n "$missing" ]; then
  echo "check-doc-refs: paths named here that do not exist in this repo:"
  printf '%s' "$missing"
  echo "Point at the doc's current home (another repo or the vault: say which), or restore it."
  exit 1
fi

# An ADR number cited in the same surfaces is either this repo's (docs/adr/ADR-NNN-*.md)
# or listed in docs/adr/README.md with the repository it lives in. The numbers collide
# across repos (kubelab and dotfiles both have an ADR-018), so a bare citation that
# resolves nowhere here sends a reader to the wrong document (#361).
unmapped=""
while IFS= read -r adr; do
  [ -n "$adr" ] || continue
  compgen -G "docs/adr/${adr}-*.md" > /dev/null && continue
  grep -qE "^\| ${adr} \|" docs/adr/README.md 2>/dev/null || unmapped+="  $adr"$'\n'
done < <(git grep -ohIE --untracked 'ADR-[0-9]{3}' \
  -- .github scripts docs ':!docs/lessons' ':!docs/adr/README.md' AGENTS.md README.md Makefile 2>/dev/null | sort -u)

if [ -n "$unmapped" ]; then
  echo "check-doc-refs: ADR numbers cited here that are neither in docs/adr/ nor mapped in docs/adr/README.md:"
  printf '%s' "$unmapped"
  echo "Add a row naming the repository the ADR lives in."
  exit 1
fi
echo "check-doc-refs: OK"
