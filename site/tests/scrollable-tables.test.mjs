/**
 * Every table in a built note is a keyboard stop, because the prose styles let
 * it scroll sideways (#517). `lab-axe.mjs` measures the scroll at 320px; this
 * holds the markup for every note, wide or not.
 *
 *   npm run build && npm test
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import rehypeScrollableTables from '../plugins/scrollable-tables.mjs';

const notes = fileURLToPath(new URL('../dist/notes/', import.meta.url));

test('the plugin makes a table focusable and leaves other elements alone', () => {
  const table = { type: 'element', tagName: 'table', properties: { className: ['x'] }, children: [] };
  const pre = { type: 'element', tagName: 'pre', properties: {}, children: [] };
  rehypeScrollableTables()({ type: 'root', children: [table, pre] });
  assert.deepEqual(table.properties, { className: ['x'], tabIndex: 0 });
  assert.deepEqual(pre.properties, {});
});

test('every table in a built note carries tabindex="0"', () => {
  assert.ok(existsSync(notes), 'dist/notes must exist — run the build first');
  const tables = readdirSync(notes, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => readFileSync(join(notes, entry.name, 'index.html'), 'utf8').match(/<table[^>]*>/g) ?? []);
  assert.ok(tables.length > 0, 'no note has a table, so this test checks nothing');
  assert.deepEqual(
    tables.filter((tag) => !/tabindex="0"/.test(tag)),
    [],
  );
});
