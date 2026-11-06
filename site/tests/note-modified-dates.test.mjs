/**
 * A note says when it was last changed, in one value everywhere (WEB-050).
 *
 * Each built note declares `article:published_time` and `article:modified_time`,
 * its `BlogPosting` declares `dateModified`, and the sitemap's `<lastmod>` for it
 * is the same date: the note's `updatedDate`, or its `pubDate` when it has none.
 * No other page gets a `<lastmod>`: the sitemap reads it from the page, and a
 * page that declares no modified time has none to give. Nothing is taken from
 * file system or git metadata.
 *
 *   npm run build && npm test
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const SITE = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(SITE, 'dist');
const NOTES = join(SITE, 'src/content/notes');
const ORIGIN = 'https://mlorente.dev';

const meta = (html, name) => html.match(new RegExp(`<meta property="${name}" content="([^"]*)"`))?.[1];
const blogPosting = (html) =>
  [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .flatMap(([, json]) => JSON.parse(json)['@graph'] ?? [])
    .find((node) => node['@type'] === 'BlogPosting');
const field = (text, name) => text.match(new RegExp(`^${name}:[ \\t]*["']?([0-9-]+)`, 'm'))?.[1];

/** `<loc>` → `<lastmod>` for every URL in the sitemap that has one. */
function lastmods() {
  const file = join(DIST, 'sitemap-0.xml');
  assert.ok(existsSync(file), 'no dist/sitemap-0.xml: run the build first');
  return new Map(
    [...readFileSync(file, 'utf8').matchAll(/<url>([\s\S]*?)<\/url>/g)]
      .map(([, block]) => [block.match(/<loc>([^<]*)<\/loc>/)?.[1], block.match(/<lastmod>([^<]*)<\/lastmod>/)?.[1]])
      .filter(([, lastmod]) => lastmod),
  );
}

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

const source = (id) => {
  const file = readdirSync(NOTES).find((f) => f.replace(/\.mdx?$/, '') === id);
  assert.ok(file, `${id}: no source note`);
  return readFileSync(join(NOTES, file), 'utf8');
};

test('each note declares when it was published and last modified, in its meta, its BlogPosting and the sitemap', () => {
  const pages = notePages();
  assert.ok(pages.length > 0, 'no note pages in dist: run the build first');
  const sitemap = lastmods();
  for (const [route, id, html] of pages) {
    const text = source(id);
    const expected = field(text, 'updatedDate') ?? field(text, 'pubDate');
    const post = blogPosting(html);
    assert.equal(meta(html, 'article:published_time'), post?.datePublished, `${route}: article:published_time`);
    assert.equal(post?.dateModified, expected, `${route}: dateModified is not its updatedDate or pubDate`);
    assert.equal(meta(html, 'article:modified_time'), expected, `${route}: article:modified_time`);
    assert.ok(sitemap.get(`${ORIGIN}${route}`)?.startsWith(expected), `${route}: sitemap lastmod ${sitemap.get(`${ORIGIN}${route}`)}, not ${expected}`);
  }
});

test('every lastmod in the sitemap is the modified time its page declares', () => {
  const sitemap = lastmods();
  assert.ok(sitemap.size > 0, 'the sitemap has no lastmod at all');
  for (const [loc, lastmod] of sitemap) {
    const file = join(DIST, new URL(loc).pathname, 'index.html');
    const declared = existsSync(file) ? meta(readFileSync(file, 'utf8'), 'article:modified_time') : undefined;
    assert.ok(declared && lastmod.startsWith(declared), `${loc}: lastmod ${lastmod}, but the page declares ${declared ?? 'none'}`);
  }
});
