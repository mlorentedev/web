/**
 * One Hive figure on the whole site. Its range is the benchmarks guide's,
 * 46–95%, published in the `/ai` proof with the method behind it
 * (`data/proofs.ts`). The older "67–82%" may not reappear on any page: /lab
 * dropped it (`tests/lab-figures.test.mjs`) and the Hive card on /projects
 * once kept it, so the site held two numbers for one claim.
 *
 * Every built page is checked, in both locales.
 *
 *   npm run build && npm test
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const siteRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(siteRoot, 'dist');
test('no built page states the retired Hive figure', () => {
  assert.ok(existsSync(join(distDir, 'projects/index.html')), 'dist/projects/index.html must exist — run the build first');
  const pages = readdirSync(distDir, { recursive: true }).filter((f) => f.endsWith('.html'));
  const stating = pages.filter((f) => /67\s?[–-]\s?82/.test(readFileSync(join(distDir, f), 'utf8')));
  assert.deepEqual(stating, [], `pages stating the retired Hive figure: ${stating.join(', ')}`);
});
