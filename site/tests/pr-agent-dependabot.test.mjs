/**
 * The PR reviewer skips Dependabot-triggered runs.
 *
 * Dependabot runs read the Dependabot secrets store, which is empty here, so the
 * reviewer's credential is "" and its guard fails every dependency PR. The
 * dotfiles canon excludes that actor (HARNESS-080); this repository's copy lost
 * the line when only the guard step was ported (#337), and six Dependabot PRs
 * went red at once. The workflow is now a caller of the fleet's reusable one
 * (WEB-165), which repeats the exclusion; this file keeps the caller's own skip,
 * which saves the runner, and checks that the caller stays on that canon.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const workflow = readFileSync(join(here, '../../.github/workflows/pr-agent.yml'), 'utf8');

test('the review job skips runs triggered by Dependabot', () => {
  const condition = workflow.match(/^ {4}if: >\n((?: {6}.*\n)+)/m)?.[1];
  assert.ok(condition, 'the review job must have a multi-line `if:` — the shape this test reads');
  assert.match(
    condition,
    /github\.actor != 'dependabot\[bot\]'/,
    "the review job must exclude github.actor == 'dependabot[bot]' — its secrets store is empty",
  );
});

test('the reviewer is the fleet canon, pinned by commit, not a local port', () => {
  // A local port drifted from the canon once and lost every review to a stalled model (WEB-165).
  assert.match(
    workflow,
    /^ {4}uses: mlorentedev\/ci-workflows\/\.github\/workflows\/pr-agent\.yml@[0-9a-f]{40} # v\d+\.\d+\.\d+$/m,
    'the review job must call the ci-workflows reusable workflow, pinned to a full commit sha',
  );
  assert.doesNotMatch(workflow, /^ {6}- (?:name|uses):/m, 'the review job has steps again: a local port of the reviewer');
});
