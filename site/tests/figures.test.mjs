/**
 * The figure guard behind the bio and the skills list compares whole tokens
 * (`lib/figures.mjs`). These hold that: a digit run inside a longer number is
 * not a source for a figure.
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { figures, sourcedFigures, statedFigures } from './lib/figures.mjs';

test('figures are whole tokens, and a range is one figure', () => {
  assert.deepEqual(figures('from 120 days to 20–30 in 2019, a bill cut by −80%'), ['120', '20–30', '2019', '80']);
});

test('digits inside a name are not a figure', () => {
  assert.deepEqual(figures('K3s, S3 and EC2 cost 80%'), ['80']);
});

test('a letter after a figure does not hide it', () => {
  assert.deepEqual(figures('cut by 80K in the 1990s'), ['80', '1990']);
});

test('a figure that only occurs inside a longer number is not sourced by it', () => {
  const sourced = new Set(figures('2014–2019, onboarding 120 days, −80%'));
  assert.ok(sourced.has('80') && sourced.has('120'));
  for (const fake of ['4', '1', '20', '201', '8']) {
    assert.ok(!sourced.has(fake), `"${fake}" counted as sourced because it is part of a longer figure`);
  }
});

test('only the strings of the source state a figure, not its comments', () => {
  const source = "/** Held to by bio.test.mjs (WEB-140). */\nconst roles = [{ start: '2019', headline: 'bill cut by −80%' }];";
  assert.deepEqual([...statedFigures(source)].sort(), ['2019', '80']);
});

test('experience.ts sources the figures the copy quotes, and nothing from its comments', () => {
  const sourced = sourcedFigures(join(dirname(fileURLToPath(import.meta.url)), '..'));
  for (const figure of ['80', '120', '20–30', '2019']) assert.ok(sourced.has(figure), `experience.ts no longer states ${figure}`);
  assert.ok(!sourced.has('140'), '"140" is sourced, but it only occurs in a ticket name in a comment');
});
