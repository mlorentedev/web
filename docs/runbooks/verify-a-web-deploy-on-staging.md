---
id: runbook-verify-a-web-deploy-on-staging
type: runbook
status: active
created: "2026-09-27"
owner: manu
tags: [web, delivery, staging, verification]
---

# Verify a web deploy on staging

Use this after a PR merges to `master`, to confirm the change is what
`https://staging.mlorente.dev` serves. A green release job means only that the pipeline
claims it delivered ([lesson 035](../lessons/lesson-035-a-green-delivery-job-is-the-pipelines-claim.md)).
Only the page is evidence of the delivery.

## Why the version endpoint is not enough

`/version.json` and `<meta name="version">` name the last **release**, not the commit. On
2026-09-27 staging and prod both answered `1.15.1`, while staging ran `sha-751eecd`, eight
commits later. Until WEB-150 (#435) adds the commit, read which commit is deployed from
kubelab (step 3). Check the change itself by content (step 4).

## Steps

1. **The push built and dispatched.** On the merge commit's run of `release.yml`, the
   `Notify kubelab (staging)` job must be green, not skipped
   ([lesson 015](../lessons/lesson-015-a-step-that-was-skipped-and-a-step-with-no.md)):

   ```bash
   gh run list --repo mlorentedev/web --workflow release.yml --branch master --limit 3
   ```

2. **kubelab opened or updated the deploy PR.** The dispatch opens
   `chore(staging): deploy web sha-<short>`. When an earlier one is still open, the
   dispatch updates it in place: on 2026-09-26 one merge of kubelab#1854 deployed #425
   and #426 together. Its sha must equal the tip of `origin/master`:

   ```bash
   git fetch -q origin && git rev-parse --short origin/master
   gh pr list --repo mlorentedev/kubelab --state open --search "deploy web in:title"
   ```

   Manu merges it. An agent does not. Argo CD then syncs staging.

3. **The overlay names the commit.** After the merge:

   ```bash
   gh api repos/mlorentedev/kubelab/contents/infra/config/values/staging.yaml \
     --jq .content | base64 -d | grep -A12 '^    web:' | grep 'version:'
   ```

4. **The page shows what only this change has.** Pick a marker that the previous
   deploy could not render, and read it from the served HTML with a fresh request:

   | Change | Marker checked (2026-09) |
   |---|---|
   | measured access table (#426) | `/lab` tally reads 4/2/4/4, 14 rows, the measurement date |
   | measured spend (#425) | `/lab/idp` shows `$25.10 · September 2026`, `/es/lab/idp` `25,10 US$` |
   | console retired (#428) | `/lab` and `/es/lab` ship 0 `<script>` |

   ```bash
   curl -s https://staging.mlorente.dev/lab/ | grep -o '<script' | wc -l
   ```

   Count matches, not lines: the HTML is minified, so `grep -c` counts one
   ([lesson 003](../lessons/lesson-003-grep-c-counts-matching-lines-not-matches-use.md)).
   A small script may be inlined rather than shipped as an `_astro/*.js` chunk
   ([lesson 006](../lessons/lesson-006-astro-inlines-small-module-scripts-grep-the.md)).
   Check both locales.

## When no deploy PR appears

Step 1 was green, yet no deploy PR appeared. The usual cause is a token. Staging received
nothing between 2026-09-08 and 2026-09-22 because a PAT had been rotated in web but not in
kubelab. Read the receiver's run in kubelab (`gh run list --repo mlorentedev/kubelab`),
then fix the secret on the side that holds the stale one. After that, re-run the web job:
the re-run sends the dispatch again. Before the fix, a re-run fails the same way.

When the web job itself is red, fix that first. `Require the tag to name the tested digest`
refuses to dispatch a tag that has moved since the suite ran, and that refusal is correct.
