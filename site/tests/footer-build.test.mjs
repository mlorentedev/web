/**
 * The footer's build chip (ADR-060) states the release `version.txt` holds and
 * the commit `/version.json` serves, on every page, and never claims a sync it
 * cannot show.
 *
 * A build with no `SITE_COMMIT` (local, PR validation) says `local` and links
 * `/version.json`; a tagged build says `synced` and links its commit. The test
 * reads whichever this build is from `dist/version.json`, so it holds for both.
 *
 *   npm run build && npm test
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const siteRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(siteRoot, 'dist');

function dist(page) {
  const file = join(distDir, page);
  assert.ok(existsSync(file), `dist/${page} must exist — run the build first`);
  return readFileSync(file, 'utf8');
}

for (const page of ['index.html', 'es/index.html', 'lab/index.html', 'es/contact/index.html']) {
  test(`dist/${page}: the build chip matches /version.json`, () => {
    const { version, commit } = JSON.parse(dist('version.json'));
    const chip = dist(page).match(/<a[^>]*data-build[\s\S]*?<\/a>/)?.[0] ?? '';
    assert.ok(chip, `dist/${page} has no build chip`);
    const words = chip.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (commit === 'local') {
      assert.equal(words, `local · v${version}`);
      assert.match(chip, /href="\/version\.json"/);
    } else {
      assert.equal(words, `synced · v${version} · sha-${commit}`);
      assert.match(chip, new RegExp(`href="https://github\\.com/mlorentedev/web/commit/${commit}"`));
    }
  });
}
