/**
 * The PR reviewer skips Dependabot-triggered runs.
 *
 * Dependabot runs read the Dependabot secrets store, which is empty here, so the
 * reviewer's credential is "" and its guard fails every dependency PR. The
 * dotfiles canon excludes that actor (HARNESS-080); this repository's copy lost
 * the line when only the guard step was ported (#337), and six Dependabot PRs
 * went red at once. This asserts the exclusion survives the next port — until
 * the workflow becomes a reusable one called from a single canon, at which point
 * the line lives there and this file goes with it.
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
