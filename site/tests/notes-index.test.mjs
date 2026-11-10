/**
 * The notes index says what it is on screen (#585).
 *
 * Its H1 was screen-reader only, so a sighted visitor saw a small uppercase
 * "What I think" and a list, and nothing naming the page. The H1 is now
 * visible with the one-line description under it, and each note title is the
 * next heading level down, so the outline has no skipped level.
 *
 *   npm run build && npm test
 */

import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const distDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');

const pages = {
  en: { file: 'notes/index.html', title: 'Notes' },
  es: { file: 'es/notes/index.html', title: 'Notas' },
};

for (const [lang, { file, title }] of Object.entries(pages)) {
  const html = readFileSync(join(distDir, file), 'utf8');
  const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));

  test(`${lang}: the notes index has one visible H1 naming the page`, () => {
    const h1s = [...main.matchAll(/<h1([^>]*)>([\s\S]*?)<\/h1>/g)];
    assert.equal(h1s.length, 1, `dist/${file} has ${h1s.length} H1s`);
    const [, attrs, text] = h1s[0];
    assert.doesNotMatch(attrs, /sr-only/, `dist/${file}: the H1 is hidden from sighted visitors`);
    assert.equal(text.trim(), title);
  });

  test(`${lang}: the tab title names the page the H1 names`, () => {
    const tab = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
    assert.ok(tab.startsWith(`${title} — `), `dist/${file}: <title> is "${tab}", the H1 is "${title}"`);
  });

  test(`${lang}: the headings of the notes index skip no level`, () => {
    const levels = [...main.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
    for (let i = 1; i < levels.length; i++) {
      assert.ok(levels[i] <= levels[i - 1] + 1, `dist/${file}: an h${levels[i]} follows an h${levels[i - 1]}`);
    }
  });
}

// Series, "Start here" and the archive by year (#590).
const seriesSource = readFileSync(join(distDir, '..', 'src/data/series.ts'), 'utf8');
const noteFiles = readdirSync(join(distDir, '..', 'src/content/notes')).map((f) => f.replace(/\.mdx?$/, ''));
const idsIn = (block) => [...block.matchAll(/'([a-z0-9-]+)'/g)].map(([, id]) => id);

test('every note a series or "Start here" names exists', () => {
  const lists = [...seriesSource.matchAll(/notes: \[([\s\S]*?)\]/g), ...seriesSource.matchAll(/startHere: string\[\] = \[([\s\S]*?)\]/g)];
  assert.ok(lists.length >= 2, 'no series lists found in src/data/series.ts');
  const missing = lists.flatMap(([, block]) => idsIn(block)).filter((id) => !noteFiles.includes(id));
  assert.deepEqual(missing, [], 'a series names a note that does not exist');
});

test('en: each series lists its notes, in order, linking to them', () => {
  const html = readFileSync(join(distDir, 'notes/index.html'), 'utf8');
  for (const [, id, block] of seriesSource.matchAll(/id: '([^']+)',[\s\S]*?notes: \[([\s\S]*?)\]/g)) {
    const shelf = html.match(new RegExp(`data-series-id="${id}"[\\s\\S]*?</ol>`))?.[0] ?? '';
    const linked = [...shelf.matchAll(/href="\/notes\/([^/"]+)\/?"/g)].map(([, slug]) => slug);
    assert.deepEqual(linked, idsIn(block), `series ${id}`);
  }
});

test('en: the archive groups every published note under its year, newest year first', () => {
  const html = readFileSync(join(distDir, 'notes/index.html'), 'utf8');
  const archive = html.slice(html.indexOf('data-archive'));
  const years = [...archive.matchAll(/data-year="(\d{4})"/g)].map(([, y]) => Number(y));
  assert.ok(years.length > 1, 'expected notes from more than one year');
  assert.deepEqual(years, [...years].sort((a, b) => b - a));
  for (const [i, year] of years.entries()) {
    const from = archive.indexOf(`data-year="${year}"`);
    const to = i + 1 < years.length ? archive.indexOf(`data-year="${years[i + 1]}"`) : archive.length;
    for (const [, iso] of archive.slice(from, to).matchAll(/datetime="(\d{4})-/g)) assert.equal(Number(iso), year);
  }
});
