#!/usr/bin/env node
/**
 * Refuse to run the test suite on a Node older than `engines.node` (WEB-152).
 *
 *   node scripts/check-node.mjs        # runs as `pretest`
 *
 * `.nvmrc` pins only the major so CI and the Docker build resolve the latest
 * 22.x. An older 22 already on a laptop satisfies `nvm use`, and npm only warns
 * about `engines` without `engine-strict`. Below 22.18 `node --test` does not
 * strip TypeScript types, so one test fails with `ERR_UNKNOWN_FILE_EXTENSION`,
 * which says nothing about the version. This says it, and exits 1.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import semver from 'semver';

export function check(version, range) {
  if (semver.satisfies(version, range)) return { ok: true };
  return {
    ok: false,
    message: `Node ${range} is required to run the tests (found ${version}). Run \`nvm install\` from the repo root to get the latest 22.x.`,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const pkg = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../package.json'), 'utf8'));
  const result = check(process.versions.node, pkg.engines.node);
  if (!result.ok) {
    console.error(result.message);
    process.exit(1);
  }
}
