/**
 * The home's timeline table (#499): two dated lists laid out side by side.
 *
 *   npm test
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { spanRows } from '../src/data/timeline.mjs';

const item = (title, start, end) => ({ title, start, end });

test('an item spans every row it covers, and later rows render no cell', () => {
  const rows = spanRows([item('work', '2019', '2024')], [item('study', '2021', '2023')]);
  assert.equal(rows.length, 3);
  assert.equal(rows[0].left.span, 3);
  assert.deepEqual([rows[1].left, rows[2].left], [null, null]);
  assert.equal(rows[1].right.item.title, 'study');
  assert.deepEqual([rows[0].right, rows[2].right], [{ item: null }, { item: null }]);
});

test('an ongoing item is refused rather than dropped', () => {
  assert.throws(() => spanRows([item('now', '2024', '')], []), /needs a start and an end year/);
});

test('overlapping items in one list are refused rather than dropped', () => {
  const nested = [item('long', '2015', '2020'), item('short', '2016', '2018')];
  assert.throws(() => spanRows(nested, []), /overlaps/);
});
