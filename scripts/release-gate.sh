#!/usr/bin/env bash
# Decide whether this push cut a release, from release-please's outputs (WEB-117).
#
#   OUTPUTS='<toJSON(steps.release.outputs)>' scripts/release-gate.sh
#
# Writes `created` and `version` to $GITHUB_OUTPUT (stdout when unset). The
# previous inline gate defaulted a missing key to "false", so a renamed output
# skipped `promote-prod` as "no release" with every job green. That is #172,
# a tag with no image, by another route. An absent key is not a negative
# answer, so here it fails the job.
#
# Measured shapes (web release.yml runs, 2026-10-21):
#   - push without a release: `releases_created: "false"`, and no per-release keys
#   - release push: `releases_created`, `release_created` and `version` at top
#     level (simple mode); manifest mode keys the last two by path, as
#     `.--release_created` and `.--version`
# `releases_created` is the one key present on every push, so it is the
# discriminator, and the per-release keys are only required once it says true.
set -euo pipefail

: "${OUTPUTS:?OUTPUTS must hold toJSON(steps.release.outputs)}"
out="${GITHUB_OUTPUT:-/dev/stdout}"

fail() {
  echo "::error::$1"
  echo "::error::release-please outputs were: $(jq -c 'keys' <<<"$OUTPUTS")"
  exit 1
}

# `has`, not `//`: jq's `//` also replaces a boolean false, which would turn a
# real "no release" into "absent".
released=$(jq -r 'if has("releases_created") then .releases_created | tostring else "absent" end' <<<"$OUTPUTS")
case "$released" in
  false)
    echo "created=false" >>"$out"
    echo "version=" >>"$out"
    exit 0
    ;;
  true) ;;
  *) fail "releases_created is '$released', not true or false: release-please's outputs changed shape, so whether this push cut a release is unknown" ;;
esac

created=$(jq -r '.release_created // .[".--release_created"] // "absent"' <<<"$OUTPUTS")
[ "$created" = "true" ] ||
  fail "releases_created is true but neither release_created nor .--release_created is true (got '$created'), so the release cannot be attributed"

version=$(jq -r '.version // .[".--version"] // ""' <<<"$OUTPUTS")
[[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] ||
  fail "a release was created but version / .--version is '$version', not a bare semver; promote-prod would tag nothing that exists"

echo "created=true" >>"$out"
echo "version=$version" >>"$out"
