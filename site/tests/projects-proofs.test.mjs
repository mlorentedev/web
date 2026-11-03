/**
 * The project cards may not publish a figure the rest of the site withholds.
 *
 * /ai says the Hive figure is published only with the method behind it, and
 * that write-up is not out (`data/proofs.ts`). /lab dropped "67–82%" for the
 * same reason (`tests/lab-figures.test.mjs`). The Hive card on /projects kept
 * it, so the site held two opposite policies on one number.
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

test('no built page states the Hive token figure while its method is unpublished', () => {
  const proofs = readFileSync(join(siteRoot, 'src/data/proofs.ts'), 'utf8');
  if (!/The Hive figure is published only with the method behind it/.test(proofs)) return;
  const pages = ['index.html', 'es/index.html', 'projects/index.html', 'ai/index.html', 'es/ai/index.html'];
  for (const page of pages) {
    const file = join(distDir, page);
    assert.ok(existsSync(file), `dist/${page} must exist — run the build first`);
    assert.doesNotMatch(readFileSync(file, 'utf8'), /67\s?[–-]\s?82/, `dist/${page} states the Hive figure`);
  }
});
