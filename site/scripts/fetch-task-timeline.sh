#!/usr/bin/env bash
# Regenerates src/data/task-timeline.json: the timestamped events of one real
# task, read from the GitHub API. The /ai page draws its phases from this file.
#
#   scripts/fetch-task-timeline.sh <pr>   # needs gh, authenticated
#
# The task is a merged pull request that closes an issue. Its work starts at the
# last comment on that issue before the PR opened (where the plan was stated).
set -euo pipefail
repo=mlorentedev/web
pr=${1:?usage: fetch-task-timeline.sh <pr>}
out="$(dirname "$0")/../src/data/task-timeline.json"

pull=$(gh api "repos/$repo/pulls/$pr")
opened=$(jq -r .created_at <<<"$pull")
issue=$(jq -r '.body | capture("(?i)closes #(?<n>[0-9]+)").n' <<<"$pull")
[ "$(jq -r .merged_at <<<"$pull")" != null ] || { echo "#$pr is not merged" >&2; exit 1; }

{
  gh api "repos/$repo/issues/$issue/comments?per_page=100" | jq --arg t "$opened" \
    '[.[] | select(.created_at < $t)] | last | {kind: "plan", at: .created_at, url: .html_url}'
  gh api "repos/$repo/pulls/$pr/commits?per_page=100" \
    --jq '.[] | {kind: "commit", at: .commit.author.date, url: .html_url}'
  jq '{kind: "opened", at: .created_at, url: .html_url}' <<<"$pull"
  gh api "repos/$repo/issues/$pr/comments?per_page=100" --jq '.[]
    | if (.body | contains("pr-agent:review")) then {kind: "review", at: .created_at, url: .html_url}
      elif (.body | startswith("## Review triage")) then {kind: "triage", at: .created_at, url: .html_url}
      else empty end'
  jq '{kind: "merged", at: .merged_at, url: .html_url}' <<<"$pull"
} | jq -s --arg repo "$repo" --argjson pr "$pr" --argjson issue "$issue" \
  --arg fetched "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  '{repo: $repo, pr: $pr, issue: $issue, fetchedAt: $fetched, events: sort_by(.at)}' > "$out"
echo "wrote $out"
