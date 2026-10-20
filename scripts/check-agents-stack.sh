#!/usr/bin/env bash
# Guard: the Astro and Tailwind CSS majors AGENTS.md names match site/package.json.
# Every agent reads AGENTS.md first, so a stale major sends each one to the wrong
# docs and config model (Tailwind 3's JS config vs Tailwind 4's CSS config). The
# Astro 7 migration bumped package.json and left AGENTS.md on Astro 5 (WEB-161):
# the stack line is prose, so no build or dependency update reads it.
# A name missing from either side fails too, so a reworded line cannot pass by
# no longer matching.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

fail=""
check() {
  local pkg="$1" entry="$2" label="$3" want have
  # `"astro": "^7.4.0"` -> 7. Only the first match: the key is unique in package.json.
  want="$(sed -nE "s/^[[:space:]]*\"$pkg\":[[:space:]]*\"[^0-9]*([0-9]+)\..*/\1/p" site/package.json | head -n1)"
  # Only the named Tech stack entry counts (`- **Framework:** Astro 7 ...`), so a
  # version mentioned anywhere else in the file cannot stand in for it.
  have="$(sed -nE "s/^- \*\*$entry:\*\* $label ([0-9]+).*/\1/p" AGENTS.md | head -n1)"
  if [ -z "$want" ]; then
    fail+="  site/package.json has no \"$pkg\" dependency"$'\n'
  elif [ -z "$have" ]; then
    fail+="  AGENTS.md has no \"- **$entry:** $label <major>\" entry"$'\n'
  elif [ "$want" != "$have" ]; then
    fail+="  $label: AGENTS.md says $have, site/package.json says $want"$'\n'
  fi
}
check astro Framework "Astro"
check tailwindcss Styling "Tailwind CSS"

if [ -n "$fail" ]; then
  echo "check-agents-stack: AGENTS.md and site/package.json disagree:"
  printf '%s' "$fail"
  echo "Update the Tech stack section of AGENTS.md (and anything it says about the old major)."
  exit 1
fi
echo "check-agents-stack: OK"
