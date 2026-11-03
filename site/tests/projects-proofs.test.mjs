/**
 * The project cards may not publish a figure the rest of the site withholds.
 *
 * /ai says the Hive figure is published only with the method behind it, and
 * that write-up is not out (`data/proofs.ts`). /lab dropped "67–82%" for the
 * same reason (`tests/lab-figures.test.mjs`). The Hive card on /projects kept
 * it, so the site held two opposite policies on one number.
 *
 * Every built page is checked, in both locales. When the write-up lands and the
 * sentence in `proofs.ts` goes, the test reports itself skipped, not passed.
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
const pending = /The Hive figure is published only with the method behind it/.test(
  readFileSync(join(siteRoot, 'src/data/proofs.ts'), 'utf8'),
);

test(
  'no built page states the Hive token figure while its method is unpublished',
  { skip: !pending && 'proofs.ts no longer withholds the Hive figure' },
  () => {
    assert.ok(existsSync(join(distDir, 'projects/index.html')), 'dist/projects/index.html must exist — run the build first');
    const pages = readdirSync(distDir, { recursive: true }).filter((f) => f.endsWith('.html'));
    const stating = pages.filter((f) => /67\s?[–-]\s?82/.test(readFileSync(join(distDir, f), 'utf8')));
    assert.deepEqual(stating, [], `pages stating the Hive figure: ${stating.join(', ')}`);
  },
);
