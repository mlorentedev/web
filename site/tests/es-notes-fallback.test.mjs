/**
 * Spanish visitors never land on an empty notes band (#499).
 *
 * Every note is written in English today. The Spanish home used to show
 * "Últimas notas · Próximamente.", and /es/notes/ was an indexable page saying
 * the same. While no note is in Spanish, the home lists the English notes,
 * marked as English, and /es/notes/ points to them and stays out of search.
 *
 *   npm run build && npm test
 */

import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const siteRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(siteRoot, 'dist');
const notesDir = join(siteRoot, 'src/content/notes');
const frontMatter = (text) => text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
// A Spanish note counts once it is published: drafts are not built, as in the collection filters.
const isSpanishPublished = (fm) => /^lang:\s*['"]?es\b/m.test(fm) && !/^draft:\s*true\b/m.test(fm);
const spanish = readdirSync(notesDir).some((f) => isSpanishPublished(frontMatter(readFileSync(join(notesDir, f), 'utf8'))));

function dist(page) {
  const file = join(distDir, page);
  assert.ok(existsSync(file), `dist/${page} must exist — run the build first`);
  return readFileSync(file, 'utf8');
}

test('the Spanish home lists notes, never an empty band', () => {
  const block = dist('es/index.html').match(/<section[^>]*data-home-block="notes"[\s\S]*?<\/section>/)?.[0] ?? '';
  assert.ok(block, 'es/index.html has no notes block');
  assert.doesNotMatch(block, /Próximamente/, 'the Spanish home shows an empty notes band');
  const notes = [...block.matchAll(/href="(\/(?:es\/)?notes\/[^"]+\/)"/g)].map((m) => m[1]);
  assert.ok(notes.length > 0, 'the Spanish home links no note');
  if (!spanish) {
    assert.match(block, /data-notes-in-english/, 'English notes on the Spanish home are not marked as English');
    assert.match(block, /lang="en"/, 'English note titles on the Spanish home carry no lang="en"');
  }
});

test('/es/notes/ stays out of search while no note is in Spanish', { skip: spanish }, () => {
  const html = dist('es/notes/index.html');
  assert.match(html, /<meta name="robots" content="noindex/, '/es/notes/ is indexable');
  assert.match(html, /href="\/notes\/"/, '/es/notes/ does not point to the English notes');
  const sitemap = readdirSync(distDir).filter((f) => /^sitemap-\d+\.xml$/.test(f)).map((f) => dist(f)).join('');
  assert.ok(sitemap.includes('<loc>'), 'no sitemap was built');
  assert.doesNotMatch(sitemap, /<loc>https:\/\/mlorente\.dev\/es\/notes\/<\/loc>/, '/es/notes/ is in the sitemap');
});
