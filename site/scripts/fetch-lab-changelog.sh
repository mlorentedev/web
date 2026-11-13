#!/usr/bin/env bash
# Regenerates src/data/lab-changelog.json: one row for each of the newest N days
# on which a kubelab pull request merged whose title is a `feat(<scope>):`
# outside the spec, docs and staging scopes, that day's newest such PR. kubelab
# merges a dozen features on a busy day, so N rows of PRs would show one day. The Lab's changelog is drawn from this file at build time, so the
# build never calls the GitHub API and one commit always renders one page.
#
#   scripts/fetch-lab-changelog.sh [N]   # default 12; needs gh, authenticated
set -euo pipefail
repo=mlorentedev/kubelab
want=${1:-12}
out="$(dirname "$0")/../src/data/lab-changelog.json"
filter='^feat\((?!(spec|docs|staging)\))[a-z0-9-]+\): '
rows='[]'
days() { jq '[.[].date] | unique | length'; }
for page in $(seq 1 10); do
  batch=$(gh api "repos/$repo/pulls?state=closed&sort=updated&direction=desc&per_page=100&page=$page" |
    jq --arg re "$filter" '[.[] | select(.merged_at != null) | select(.title | test($re))
      | {pr: .number, date: .merged_at[0:10], mergedAt: .merged_at, title}]')
  rows=$(jq -n --argjson a "$rows" --argjson b "$batch" '$a + $b | unique_by(.pr)')
  # One day past N, so the oldest day kept is not cut by a page boundary.
  [ "$(days <<<"$rows")" -gt "$want" ] && break
done
if [ "$(days <<<"$rows")" -lt "$want" ]; then
  echo "found matching merged PRs on $(days <<<"$rows") of $want days; $out left as it was" >&2
  exit 1
fi
jq -n --arg repo "$repo" --arg at "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --arg re "$filter" \
  --argjson rows "$rows" --argjson want "$want" \
  '{repo: $repo, fetchedAt: $at, filter: $re,
    rows: ($rows | group_by(.date) | map(max_by(.mergedAt)) | sort_by(.mergedAt) | reverse
      | .[0:$want] | map({pr, date, title}))}' > "$out"
echo "wrote $out: $(jq -r '[.rows[].pr] | join(" ")' "$out")"
