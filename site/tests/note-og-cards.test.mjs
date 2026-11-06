/**
 * Every note previews as itself when shared (WEB-176).
 *
 * Each published note's `og:image`, `twitter:image` and `BlogPosting.image` are
 * one URL, its own card: a 1200×630 PNG that is not the generic site card. Every
 * non-draft note in source, future-dated ones included, has a card rendered from
 * its current title, date and tags; a stale or missing one is named, with the
 * command that regenerates it.
 *
 *   npm run build && npm test
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { assetsDigest, cardHash, cardInputs, cardPath, HEIGHT, WIDTH } from '../src/lib/og-cards.mjs';

const SITE = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(SITE, 'dist');
const NOTES = join(SITE, 'src/content/notes');
const CARDS = join(SITE, 'src/assets/og');
const ORIGIN = 'https://mlorente.dev';
const REGENERATE = 'run `npm run og:cards` and commit src/assets/og/';

/** Width and height from a PNG's IHDR chunk, or null when the bytes are not a PNG. */
function pngSize(bytes) {
  if (bytes.length < 24 || bytes.toString('latin1', 1, 4) !== 'PNG' || bytes.toString('latin1', 12, 16) !== 'IHDR') return null;
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

const meta = (html, attr, name) => html.match(new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`))?.[1];
const blogPosting = (html) =>
  [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .flatMap(([, json]) => JSON.parse(json)['@graph'] ?? [])
    .find((node) => node['@type'] === 'BlogPosting');

/** Every built note page: `[route, id, html]`. */
function notePages() {
  return ['notes', 'es/notes'].flatMap((dir) => {
    const root = join(DIST, dir);
    if (!existsSync(root)) return [];
    return readdirSync(root, { withFileTypes: true })
      .filter((e) => e.isDirectory() && existsSync(join(root, e.name, 'index.html')))
      .map((e) => [`/${dir}/${e.name}/`, e.name, readFileSync(join(root, e.name, 'index.html'), 'utf8')]);
  });
}

test('the card inputs are read from the frontmatter, and a draft has none', () => {
  const note = (fm) => `---\n${fm}\n---\n\nbody`;
  assert.deepEqual(cardInputs('x', note('title: "Why I\'m here"\npubDate: 2026-09-04\ntags: ["dns", "k3s"]\nlang: en\ndraft: false')), {
    id: 'x',
    lang: 'en',
    title: "Why I'm here",
    date: '2026-09-04',
    tags: ['dns', 'k3s'],
  });
  assert.equal(cardInputs('x', note('title: "a"\npubDate: 2026-09-04\ndraft: true')), null);
  assert.equal(cardInputs('x', note('title: "a"\npubDate: 2026-09-04')).lang, 'en');
  assert.throws(() => cardInputs('x', note("title: \"a\"\npubDate: 2026-09-04\ntags: ['dns']")), /double-quoted/);
  assert.throws(() => cardInputs('x', note('pubDate: 2026-09-04')), /no title/);
  const inputs = cardInputs('x', note('title: "a"\npubDate: 2026-09-04'));
  assert.notEqual(cardHash(inputs, 'a'), cardHash({ ...inputs, title: 'b' }, 'a'), 'a new title makes the card stale');
  assert.notEqual(cardHash(inputs, 'a'), cardHash(inputs, 'b'), 'a new logo or font makes the card stale');
  const files = { 'public/fonts/Roboto-Bold.woff2': 'new' };
  assert.notEqual(assetsDigest((p) => files[p] ?? 'x'), assetsDigest(() => 'x'), 'every inlined asset is in the digest');
});

test('every note in source has a card rendered from its current title, date and tags', () => {
  const manifest = existsSync(join(CARDS, 'manifest.json')) ? JSON.parse(readFileSync(join(CARDS, 'manifest.json'), 'utf8')) : {};
  const notes = readdirSync(NOTES).filter((f) => /\.mdx?$/.test(f));
  assert.ok(notes.length > 0, 'no notes in source');
  const assets = assetsDigest((path) => readFileSync(join(SITE, path)));
  const problems = notes.flatMap((file) => {
    const id = file.replace(/\.mdx?$/, '');
    const inputs = cardInputs(id, readFileSync(join(NOTES, file), 'utf8'));
    if (!inputs) return [];
    if (!existsSync(join(CARDS, `${id}.png`))) return [`${id}: no card`];
    if (manifest[id]?.hash !== cardHash(inputs, assets)) return [`${id}: its card is stale`];
    return [];
  });
  assert.deepEqual(problems, [], REGENERATE);
});

test('each published note shares its own card, under one URL in og:image, twitter:image and its BlogPosting', () => {
  const pages = notePages();
  assert.ok(pages.length > 0, 'no note pages in dist: run the build first');
  const generic = readFileSync(join(SITE, 'public/images/og-image.png'));
  for (const [route, id, html] of pages) {
    const url = `${ORIGIN}${cardPath(id)}`;
    assert.equal(meta(html, 'property', 'og:image'), url, `${route}: og:image`);
    assert.equal(meta(html, 'name', 'twitter:image'), url, `${route}: twitter:image`);
    assert.equal(blogPosting(html)?.image, url, `${route}: BlogPosting.image`);
    const file = join(DIST, cardPath(id));
    assert.ok(existsSync(file), `${route}: ${cardPath(id)} was not built`);
    const bytes = readFileSync(file);
    assert.deepEqual(pngSize(bytes), { width: WIDTH, height: HEIGHT }, `${route}: the card is not a ${WIDTH}×${HEIGHT} PNG`);
    assert.ok(!bytes.equals(generic), `${route}: ships the generic card; ${REGENERATE}`);
  }
});

test('the card says what the page says: its title is the note headline', () => {
  const manifest = JSON.parse(readFileSync(join(CARDS, 'manifest.json'), 'utf8'));
  for (const [route, id, html] of notePages()) {
    assert.equal(manifest[id]?.title, blogPosting(html)?.headline, `${route}: the card's title`);
  }
});

test('only published notes have a card in dist', () => {
  const built = existsSync(join(DIST, 'og/notes')) ? readdirSync(join(DIST, 'og/notes')).sort() : [];
  assert.deepEqual(built, notePages().map(([, id]) => `${id}.png`).sort());
});
