/**
 * The release notes come from GitHub, not from release-please's changelog
 * writer (WEB-099).
 *
 * The default writer prints `closes #N` for every issue a commit mentions,
 * whatever verb the commit used (lesson 048). That text lands in the release
 * PR body, and GitHub reads it as a closing keyword, so a `Refs #N` commit
 * re-armed a close on the release PR. `changelog-type: github` asks GitHub's
 * generate-notes API instead, which lists merged PRs by URL and names no
 * issue. Previewed for v1.17.0 before the change: 128 lines, no bare `#N`,
 * no issue URL.
 *
 * The `Release closing refs` check stays: a PR title that says `closes #N`
 * would still reach the notes verbatim, and that check is what catches it.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(join(here, '../../release-please-config.json'), 'utf8'));

test('release notes are written by GitHub, not by the default changelog writer', () => {
  const types = [config['changelog-type'], ...Object.values(config.packages).map((p) => p['changelog-type'])];
  assert.equal(config['changelog-type'], 'github');
  // A package-level value overrides the top-level one, so none may set another.
  assert.deepEqual(types.filter((t) => t !== undefined && t !== 'github'), []);
});
