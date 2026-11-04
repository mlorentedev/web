/**
 * Each pre-commit hook runs once per commit (#99).
 *
 * Hooks are dispatched machine-wide through `core.hooksPath`, so every hook
 * type git fires reaches pre-commit, and a hook with no `stages` runs at each
 * of them: the secret scan ran three times per commit. `default_stages` pins
 * the default to `pre-commit`.
 *
 * The secret scan keeps `pre-push` on purpose: a commit made with
 * `--no-verify` is still caught before it leaves the machine.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const config = readFileSync(new URL('../../.pre-commit-config.yaml', import.meta.url), 'utf8');

test('hooks default to the pre-commit stage only', () => {
  assert.match(config, /^default_stages:\s*\[pre-commit\]\s*$/m);
});

test('the secret scan also runs before a push', () => {
  const gitleaks = config.match(/- id: gitleaks\n((?:\s{8}.*\n)*)/)?.[1] ?? '';
  assert.match(gitleaks, /stages:\s*\[pre-commit, pre-push\]/, 'gitleaks lost its pre-push run');
});
