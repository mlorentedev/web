/**
 * Each note links to the notes written alongside it (WEB-129 AC1, AC4).
 *
 * - A note's `related` frontmatter lists other notes by id, hand-curated, and
 *   the page renders them at its foot, in that order, as links to their pages.
 * - An id that does not resolve to a published note in the same locale fails
 *   the build: a typo, a draft or a note dated after the build would otherwise
 *   ship as a dead link.
 *
 *   npm run build && npm test
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { MAX_RELATED, resolveRelated } from '../src/lib/note-related.mjs';

const SITE = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(SITE, 'dist');
const NOTES = join(SITE, 'src/content/notes');

const note = (id, related = []) => ({ id, data: { title: `Title of ${id}`, related } });
const published = [note('a', ['b', 'c']), note('b'), note('c')];

test('related ids resolve to the notes they name, in the order given', () => {
  assert.deepEqual(resolveRelated(note('a', ['c', 'b']), published), [
    { id: 'c', title: 'Title of c' },
    { id: 'b', title: 'Title of b' },
  ]);
  assert.deepEqual(resolveRelated(note('b'), published), []);
});

test('an id that is not a published note fails, naming the note and the id', () => {
  assert.throws(() => resolveRelated(note('a', ['b', 'missing']), published), /"a".*"missing"/);
});

test('a note cannot relate to itself, or list a note twice', () => {
  assert.throws(() => resolveRelated(note('a', ['a']), published), /itself/);
  assert.throws(() => resolveRelated(note('a', ['b', 'b']), published), /twice/);
});

test(`a note lists at most ${MAX_RELATED} related notes`, () => {
  const many = ['b', 'c', 'd', 'e'].slice(0, MAX_RELATED + 1);
  const all = [...published, note('d'), note('e')];
  assert.throws(() => resolveRelated(note('a', many), all), /at most/);
});

const frontmatterRelated = (src) => {
  const block = src.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  const line = block.match(/^related:\s*\[(.*)\]\s*$/m)?.[1];
  return line === undefined ? [] : [...line.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
};

test('every published note page renders its related notes, in order, as links that exist', { skip: !existsSync(DIST) }, () => {
  let withRelated = 0;
  for (const file of readdirSync(NOTES)) {
    const id = file.replace(/\.mdx?$/, '');
    const page = join(DIST, 'notes', id, 'index.html');
    if (!existsSync(page)) continue; // a draft, or a note dated after the build
    const html = readFileSync(page, 'utf8');
    const expected = frontmatterRelated(readFileSync(join(NOTES, file), 'utf8'));
    const block = html.match(/<nav[^>]*data-note-related[^>]*>([\s\S]*?)<\/nav>/)?.[1];
    if (expected.length === 0) {
      assert.equal(block, undefined, `${id} lists no related notes but renders the block`);
      continue;
    }
    withRelated++;
    assert.ok(block, `${id} lists related notes and renders none`);
    const hrefs = [...block.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(hrefs, expected.map((r) => `/notes/${r}/`), `${id} renders its related notes out of order or incomplete`);
    for (const href of hrefs) assert.ok(existsSync(join(DIST, href, 'index.html')), `${id} links to ${href}, which was not built`);
  }
  assert.ok(withRelated > 0, 'no note lists a related note: the check is looking at nothing');
});
