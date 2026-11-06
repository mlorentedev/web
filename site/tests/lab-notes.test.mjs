/**
 * Each Lab section links to the notes behind it (#592).
 *
 * The map is `src/data/lab-notes.ts`. Notes are English only, so the Spanish
 * page shows one link to the English notes under each mapped section.
 *
 *   npm run build && npm test
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const site = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(join(site, 'src/data/lab-notes.ts'), 'utf8');
const notes = readdirSync(join(site, 'src/content/notes')).map((f) => f.replace(/\.mdx?$/, ''));

/** Section number → note ids, read from the data file. */
const map = Object.fromEntries(
  [...source.matchAll(/'(\d{2})': \[([\s\S]*?)\]/g)].map(([, n, block]) => [n, [...block.matchAll(/'([a-z0-9-]+)'/g)].map(([, id]) => id)]),
);

test('the map names real notes, under sections the page has', () => {
  assert.ok(Object.keys(map).length >= 6, 'no sections read from lab-notes.ts');
  assert.deepEqual(Object.values(map).flat().filter((id) => !notes.includes(id)), []);
  for (const n of Object.keys(map)) assert.match(n, /^0[1-7]$/);
});

test('/lab/ lists the notes of each section, in the order of the map', () => {
  const file = join(site, 'dist', 'lab', 'index.html');
  assert.ok(existsSync(file), 'run the build first');
  const html = readFileSync(file, 'utf8');
  for (const [n, ids] of Object.entries(map)) {
    const block = html.match(new RegExp(`data-lab-notes="${n}"[\\s\\S]*?</p>`))?.[0] ?? '';
    const hrefs = [...block.matchAll(/href="([^"]+)"/g)].map(([, h]) => h);
    assert.deepEqual(hrefs, ids.map((id) => `/notes/${id}/`), `section ${n}`);
  }
});

test('/es/lab/ points each mapped section at the English notes, with no English title', () => {
  const html = readFileSync(join(site, 'dist', 'es', 'lab', 'index.html'), 'utf8');
  for (const n of Object.keys(map)) {
    const block = html.match(new RegExp(`data-lab-notes="${n}"[\\s\\S]*?</p>`))?.[0] ?? '';
    assert.deepEqual([...block.matchAll(/href="([^"]+)"/g)].map(([, h]) => h), ['/notes/'], `section ${n}`);
    assert.match(block, /Notas \(en inglés\)/);
  }
});
