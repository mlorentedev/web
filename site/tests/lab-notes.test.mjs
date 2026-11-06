/**
 * Each Lab section links to the notes behind it (#592).
 *
 * The map is `src/data/lab-notes.ts`. Notes are English only, so the Spanish
 * page links the English notes and marks each title `lang="en"`.
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

for (const [page, prefix, english] of [['lab', '/notes/', false], ['es/lab', '/notes/', true]]) {
  test(`/${page}/ lists each section's notes, in the map's order`, () => {
    const file = join(site, 'dist', page, 'index.html');
    assert.ok(existsSync(file), 'run the build first');
    const html = readFileSync(file, 'utf8');
    for (const [n, ids] of Object.entries(map)) {
      const block = html.match(new RegExp(`data-lab-notes="${n}"[\\s\\S]*?</p>`))?.[0] ?? '';
      const links = [...block.matchAll(/<a\b([^>]*)>/g)].map(([, attrs]) => attrs);
      assert.deepEqual(links.map((a) => a.match(/href="([^"]+)"/)?.[1]), ids.map((id) => `${prefix}${id}/`), `section ${n}`);
      if (english) for (const a of links) assert.match(a, /lang="en"/, `section ${n}: an English title on the Spanish page`);
    }
  });
}
