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
  while IFS= read -r ref; do
    [ -e "$ref" ] || missing+="  $loc:$lineno $ref"$'\n'
  done < <(printf '%s\n' "$text" \
    | perl -ne 'while (m{(?:^|[^/A-Za-z0-9_.-])(docs/(?:adr|lessons|runbooks|troubleshooting)/[A-Za-z0-9._-]+\.md)}g) { print "$1\n" }')
done <<< "$refs"

if [ -n "$missing" ]; then
  echo "check-doc-refs: paths named here that do not exist in this repo:"
  printf '%s' "$missing"
  echo "Point at the doc's current home (another repo or the vault: say which), or restore it."
  exit 1
fi
echo "check-doc-refs: OK"
