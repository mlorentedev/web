#!/usr/bin/env bash
# Regenerates src/data/review-triage.json: every "## Review triage" comment on
# the last N merged pull requests that carry one. The /ai review ledger is
# drawn from this file at build time, so the table shows what the comments say.
#
#   scripts/fetch-review-triage.sh [N]   # default 10; needs gh, authenticated
set -euo pipefail
repo=mlorentedev/web
want=${1:-10}
out="$(dirname "$0")/../src/data/review-triage.json"
prs=()
for n in $(gh api "repos/$repo/pulls?state=closed&sort=updated&direction=desc&per_page=100" \
  --jq '[.[] | select(.merged_at != null)] | sort_by(.number) | reverse | .[].number'); do
  count=$(gh api "repos/$repo/issues/$n/comments?per_page=100" \
    --jq '[.[] | select(.body | startswith("## Review triage"))] | length')
  [ "$count" -gt 0 ] && prs+=("$n")
  [ "${#prs[@]}" -ge "$want" ] && break
done
{
  printf '{"repo":"%s","fetchedAt":"%s","pulls":[' "$repo" "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  sep=''
  for n in "${prs[@]}"; do
    printf '%s{"number":%s,"comments":' "$sep" "$n"
    gh api "repos/$repo/issues/$n/comments?per_page=100" \
      --jq '[.[] | select(.body | startswith("## Review triage")) | {id, url: .html_url, createdAt: .created_at, body}]'
    printf '}'
    sep=','
  done
  printf ']}\n'
} | jq . > "$out"
echo "wrote $out: ${prs[*]}"
