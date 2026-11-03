/**
 * The career loop under the hero (ADR-060) may not invent a step.
 *
 * Each station's year is the start of a role in `data/experience.ts`, the
 * stations run in time order, and the last one is the ongoing role, which is
 * the one the loop marks as today. The built home draws it as inline SVG, with
 * no script, and lists the stations for screen readers.
 *
 *   npm run build && npm test
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const siteRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(siteRoot, path), 'utf8');

const starts = (source) => [...source.matchAll(/\bstart:\s*'(\d{4})'/g)].map((m) => m[1]);
const loopStarts = starts(read('src/data/loop.ts'));
const experience = read('src/data/experience.ts');
const roleStarts = starts(experience);
const ongoing = experience.match(/start:\s*'(\d{4})',\s*end:\s*null/)?.[1];

test('every station of the loop is the start of a role, in time order', () => {
  assert.equal(loopStarts.length, 5, 'HomeLoop is laid out for five stations');
  const unsourced = loopStarts.filter((y) => !roleStarts.includes(y));
  assert.deepEqual(unsourced, [], `stations with no role starting that year: ${unsourced.join(', ')}`);
  assert.deepEqual([...loopStarts].sort(), loopStarts, 'the stations are out of order');
});

test('the last station is the ongoing role', () => {
  assert.ok(ongoing, 'experience.ts has no ongoing role (end: null)');
  assert.equal(loopStarts.at(-1), ongoing);
});

for (const built of ['index.html', 'es/index.html']) {
  test(`dist/${built} draws the loop as inline SVG, with no script, and lists its stations`, () => {
    const file = join(siteRoot, 'dist', built);
    assert.ok(existsSync(file), `dist/${built} must exist — run the build first`);
    const block = readFileSync(file, 'utf8').match(/<section[^>]*data-home-block="loop"[\s\S]*?<\/section>/)?.[0] ?? '';
    assert.ok(block, `dist/${built} has no loop block`);
    assert.equal((block.match(/<svg\b/g) ?? []).length, 2, 'expected a wide and a tall drawing');
    assert.doesNotMatch(block, /<script\b/, 'the loop ships a script');
    const items = [...block.matchAll(/<li>(\d{4}):/g)].map((m) => m[1]);
    assert.deepEqual(items, loopStarts, 'the screen-reader list does not match data/loop.ts');
  });
}
