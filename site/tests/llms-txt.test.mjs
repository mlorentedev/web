/**
 * `llms.txt` is what an AI assistant reads when someone asks it about Manu.
 *
 * It drifted once already: after the paid session left /contact (#518), the
 * file still offered "a paid session and a fixed-length sprint", and it listed
 * pages and a Spanish localization that did not exist. These tests hold the two
 * claims a reader can check: every path it lists is a built page, and it names
 * no price.
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
const llms = readFileSync(join(siteRoot, 'public/llms.txt'), 'utf8');

test('every path llms.txt lists is a built page', () => {
  const paths = [...llms.matchAll(/^- (\/[^\s]*) —/gm)].map((m) => m[1]);
  assert.ok(paths.length >= 5, `llms.txt lists only ${paths.length} paths`);
  const missing = paths.filter((p) => !existsSync(join(distDir, p, 'index.html')));
  assert.deepEqual(missing, [], `llms.txt lists pages that were not built: ${missing.join(', ')}`);
});

test('llms.txt names no price and no paid offer', () => {
  const hits = llms.match(/[$€]\s?\d|\b\d+\s?(?:USD|EUR)\b|\bpaid\b|\bfee\b|\bpricing\b/gi) ?? [];
  assert.deepEqual(hits, [], `llms.txt offers: ${hits.join(', ')}`);
});
