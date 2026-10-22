#!/usr/bin/env node
/**
 * Decide from release-please's outputs whether a release was cut (WEB-117).
 *
 *   OUTPUTS='${{ toJSON(steps.release.outputs) }}' node site/scripts/release-gate.mjs
 *
 * Writes `created` and `version` to `$GITHUB_OUTPUT` for `promote-prod`, or
 * exits 1 with an `::error::` and writes nothing.
 *
 * An absent key is not a `false`. The gate this replaces read a missing
 * `release_created` as "no release", so a third rename of release-please's
 * outputs would have skipped the prod publish with every job green: a tag and
 * a changelog with no image, the #172 shape by another route.
 *
 * It keys on `releases_created` because that is the one key release-please
 * emits on every push. The per-release keys (`release_created`, `version`, in
 * simple mode, or `.--release_created`, `.--version` keyed by package path in
 * manifest mode) exist only when a release was cut, so their absence on an
 * ordinary push is normal and cannot be read as a rename. Once
 * `releases_created` says `true`, they are required.
 */

import { appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const fail = (message) => ({ ok: false, message });
const first = (outputs, keys) => keys.map((k) => outputs[k]).find((v) => v !== undefined && v !== '');

export function decide(raw) {
  let outputs = raw;
  if (typeof raw === 'string') {
    try {
      outputs = JSON.parse(raw);
    } catch {
      return fail('release-please outputs are not JSON, so the gate cannot tell whether a release was cut.');
    }
  }
  if (outputs === null || typeof outputs !== 'object') return fail('release-please outputs are not an object.');

  const releases = outputs.releases_created;
  if (releases === 'false') return { ok: true, created: 'false', version: '' };
  if (releases !== 'true') {
    return fail(
      `release-please did not emit "releases_created" (found ${JSON.stringify(releases)}), so the gate cannot tell whether a release was cut. Its outputs were renamed or the step failed.`,
    );
  }

  const created = first(outputs, ['release_created', '.--release_created']);
  if (created !== 'true') {
    return fail(
      `"releases_created" is true but neither "release_created" nor ".--release_created" is "true" (found ${JSON.stringify(created)}): a release was cut that the gate cannot attribute to this package.`,
    );
  }
  const version = first(outputs, ['version', '.--version']);
  if (!version) {
    return fail('A release was cut but neither "version" nor ".--version" is set, so there is no tag to promote.');
  }
  return { ok: true, created: 'true', version };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = process.env.GITHUB_OUTPUT
    ? decide(process.env.OUTPUTS ?? '')
    : fail('GITHUB_OUTPUT is not set, so the gate has nowhere to write its decision.');
  if (!result.ok) {
    console.error(`::error::${result.message}`);
    process.exit(1);
  }
  appendFileSync(process.env.GITHUB_OUTPUT, `created=${result.created}\nversion=${result.version}\n`);
}
