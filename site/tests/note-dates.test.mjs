/**
 * A note ships on its date, and can say when it was written (WEB-138).
 *
 * Every consumer filtered notes on `draft` only, so a note merged ahead of its
 * `pubDate` shipped on the next build, with a future date printed on it. Now:
 * - a note whose `pubDate` is after the build clock is in no file of the build,
 *   and is in them once the clock passes it, with no other change;
 * - a note with a `writtenDate` before its `pubDate` shows both dates, and RSS
 *   orders it by `pubDate`;
 * - /es/notes/ stays noindex and out of the sitemap until a Spanish note is
 *   published, by the same rule;
 * - only `src/lib/locale-pages.ts` reads a collection other than `pages`, so
 *   no consumer can skip the filter.
 *
 * The build test runs `astro build` twice over `tests/fixtures/notes/`, with
 * the clock set before and after the future note's date, into scratch dirs.
 *
 *   npm test
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { buildClock, buildNow, isPublished, publishedIn, shownWrittenDate, writtenDateValid } from '../src/lib/note-dates.mjs';

const SITE = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(SITE, 'src');

const files = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });

test('a note is published from its pubDate on, and never while a draft', () => {
  const note = { pubDate: new Date('2030-06-01'), draft: false };
  assert.equal(isPublished(note, new Date('2030-05-31T23:59:59Z')), false);
  assert.equal(isPublished(note, new Date('2030-06-01T00:00:00Z')), true);
  assert.equal(isPublished(note, new Date('2031-01-01')), true);
  assert.equal(isPublished({ ...note, draft: true }, new Date('2031-01-01')), false);
});

test('the build clock is now, unless NOTES_NOW sets it, and a bad NOTES_NOW fails', () => {
  const before = Date.now();
  const now = buildClock({}).valueOf();
  assert.ok(now >= before && now <= Date.now());
  assert.equal(buildClock({ NOTES_NOW: '2030-06-01' }).toISOString(), '2030-06-01T00:00:00.000Z');
  assert.throws(() => buildClock({ NOTES_NOW: 'tomorrow' }), /NOTES_NOW/);
});

test('the build reads its clock once: every caller gets the same instant', async () => {
  const env = {};
  const first = buildNow(env);
  assert.equal(env.NOTES_NOW, first.toISOString(), 'the instant is handed on through NOTES_NOW');
  await new Promise((r) => setTimeout(r, 5));
  assert.equal(buildNow(env).toISOString(), first.toISOString(), 'a second reading would let two parts of one build disagree');
  assert.equal(buildNow({ NOTES_NOW: '2030-06-01' }).toISOString(), '2030-06-01T00:00:00.000Z', 'a set NOTES_NOW still wins');
});

test('writtenDate is shown only before pubDate, and refused after it', () => {
  const pubDate = new Date('2021-01-01');
  assert.equal(shownWrittenDate({ pubDate }), undefined);
  assert.equal(shownWrittenDate({ pubDate, writtenDate: new Date('2021-01-01') }), undefined);
  assert.equal(shownWrittenDate({ pubDate, writtenDate: new Date('2019-03-01') })?.toISOString(), '2019-03-01T00:00:00.000Z');
  assert.equal(writtenDateValid({ pubDate }), true);
  assert.equal(writtenDateValid({ pubDate, writtenDate: pubDate }), true);
  assert.equal(writtenDateValid({ pubDate, writtenDate: new Date('2021-01-02') }), false);
});

test('a raw note file is read by the same rule: language, draft and date', () => {
  const note = (fm) => `---\ntitle: "x"\n${fm}\n---\n\nbody`;
  const now = new Date('2030-06-01');
  assert.equal(publishedIn(note('pubDate: 2030-06-01\nlang: es'), 'es', now), true);
  assert.equal(publishedIn(note("pubDate: '2030-06-02'\nlang: \"es\""), 'es', now), false);
  assert.equal(publishedIn(note('pubDate: 2020-01-01\nlang: es\ndraft: true'), 'es', now), false);
  assert.equal(publishedIn(note('pubDate: 2020-01-01'), 'es', now), false);
  assert.equal(publishedIn(note('pubDate: 2020-01-01'), 'en', now), true);
  assert.equal(publishedIn(note('lang: es'), 'es', now), false);
  // A trailing comment is YAML, not part of the value.
  assert.equal(publishedIn(note('pubDate: 2020-01-01 # first\nlang: es # Spanish'), 'es', now), true);
  assert.equal(publishedIn(note('pubDate: 2020-01-01\nlang: es\ndraft: true # not yet'), 'es', now), false);
  assert.equal(publishedIn(note('pubDate: "2020-01-01" # quoted\nlang: \'es\''), 'es', now), true);
});

// Any content-layer read: the notes are only ever read through notesIn().
const CONTENT_READ = /\b(?:getCollection|getEntry|getEntries|getLiveCollection|getLiveEntry)\(\s*([^,)\s]*)/g;

test('only src/lib/locale-pages.ts reads a collection other than pages', () => {
  const readers = files(SRC)
    .filter((file) => /\.(astro|ts|mjs|js)$/.test(file) && !file.endsWith('/lib/locale-pages.ts'))
    .flatMap((file) => {
      const text = readFileSync(file, 'utf8');
      const reads = [...text.matchAll(CONTENT_READ)].filter(([, first]) => !/^['"`]pages['"`]$/.test(first));
      const paths = !file.endsWith('/content.config.ts') && /content\/notes/.test(text) ? ['content/notes'] : [];
      return [...reads.map(([call]) => call), ...paths].map((what) => `${relative(SRC, file)}: ${what}`);
    });
  assert.deepEqual(readers, [], 'read notes through notesIn() so the date filter applies');
});

test('the content-read scan sees every call shape', () => {
  const found = (src) => [...src.matchAll(CONTENT_READ)].filter(([, first]) => !/^['"`]pages['"`]$/.test(first)).length;
  assert.equal(found("getCollection('notes')"), 1);
  assert.equal(found("getCollection(\n  'pages',\n  ({ id }) => id)"), 0);
  assert.equal(found("getEntry('notes', 'x')"), 1);
  assert.equal(found('getCollection(name)'), 1);
  assert.equal(found("getEntries([{ collection: 'notes', id: 'x' }])"), 1);
});

/** Builds the site over the fixture notes as of `now`; returns each file's text, by path. */
function buildAsOf(now) {
  const scratch = mkdtempSync(join(tmpdir(), 'web-note-dates-'));
  const out = join(scratch, 'dist');
  try {
    execFileSync('npx', ['astro', 'build', '--outDir', out], {
      cwd: SITE,
      // Its own content store: the shared one would keep the fixtures for the next real build.
      env: { ...process.env, NOTES_DIR: 'tests/fixtures/notes', NOTES_NOW: now, ASTRO_CACHE_DIR: join(scratch, 'cache') },
      stdio: 'pipe',
    });
    return new Map(files(out).filter((f) => /\.(html|xml|json|txt)$/.test(f)).map((f) => [`/${relative(out, f)}`, readFileSync(f, 'utf8')]));
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

const mentions = (site, slug) => [...site].filter(([, text]) => text.includes(slug)).map(([path]) => path);

test('a note dated after the build is in no file, and ships once the clock passes its date', { timeout: 180_000 }, async (t) => {
  const before = buildAsOf('2030-05-31T23:59:59Z');
  const after = buildAsOf('2030-06-01T00:00:00Z');

  await t.test('the build read the fixtures, not the site notes', () => {
    assert.ok(before.has('/notes/fixture-past-note/index.html'), 'the fixture notes were not built: NOTES_DIR is not read');
    assert.deepEqual(mentions(before, 'bootstrapping-k3s-ansible'), [], 'the site notes were built too');
  });

  await t.test('before its date: no page, listing, tag page, feed entry or sitemap url', () => {
    assert.deepEqual(mentions(before, 'fixture-future-note'), []);
    assert.deepEqual(mentions(before, 'a note dated 2030-06-01'), []);
    // A tag only the future note carries names no slug: look for its URL instead.
    assert.equal(before.has('/tags/kustomize/index.html'), false, 'a tag page for a note not yet published');
    assert.deepEqual(mentions(before, '/tags/kustomize/'), []);
  });

  await t.test('on its date: its page, the index, its tag page, the feed and the sitemap', () => {
    const where = mentions(after, 'fixture-future-note');
    for (const path of ['/notes/fixture-future-note/index.html', '/notes/index.html', '/tags/homelab/index.html', '/rss.xml', '/sitemap-0.xml', '/index.html']) {
      assert.ok(where.includes(path), `${path} does not list the note`);
    }
    assert.ok(after.has('/tags/kustomize/index.html'), 'its own tag page');
  });

  await t.test('a backdated note shows when it was written, says when it was published, and RSS orders it by pubDate', () => {
    const page = after.get('/notes/fixture-backdated-note/index.html');
    assert.match(page, /<time datetime="2019-03-01">/);
    assert.match(page, /<span data-note-published> · published <time datetime="2021-01-01">January 1, 2021<\/time><\/span>/);
    assert.match(page, /"dateCreated":"2019-03-01"/);
    assert.match(page, /"datePublished":"2021-01-01"/);
    assert.doesNotMatch(after.get('/notes/fixture-past-note/index.html'), /data-note-published/, 'a note with one date shows one');
    const feed = after.get('/rss.xml');
    const order = ['fixture-future-note', 'fixture-backdated-note', 'fixture-past-note'].map((slug) => feed.indexOf(slug));
    assert.ok(order.every((i, n) => i > -1 && (n === 0 || i > order[n - 1])), `feed order by pubDate: ${order}`);
  });

  const indexed = (site, path) => !/<meta name="robots" content="noindex/.test(site.get(`${path}index.html`) ?? '');
  const listed = (site, path) => site.get('/sitemap-0.xml').includes(`<loc>https://mlorente.dev${path}</loc>`);

  await t.test('/es/notes/ is noindex and out of the sitemap until a Spanish note is published', () => {
    assert.deepEqual(mentions(before, 'fixture-es-future-note'), []);
    assert.equal(indexed(before, '/es/notes/'), false);
    assert.equal(listed(before, '/es/notes/'), false);
    assert.ok(mentions(after, 'fixture-es-future-note').includes('/es/notes/index.html'));
    assert.equal(indexed(after, '/es/notes/'), true);
    assert.equal(listed(after, '/es/notes/'), true);
  });
});
