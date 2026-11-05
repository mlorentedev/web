/**
 * Tag pages carry a name, a title and a description of their own, and a thin
 * one stays out of the index (WEB-052).
 *
 * Tag pages were most of the indexable surface and close to contentless:
 * titles like `dns` and `AI`, one templated description for every tag, the
 * casing of whichever card or note was found first, and a page listing a single
 * note submitted as if it were a topic.
 *
 * - every tag a project or a note carries has a display name in
 *   `src/data/tag-names.mjs`;
 * - across the built tag pages, no two share a title or a description, and each
 *   title holds its tag's display name;
 * - a tag page listing fewer than MIN_ITEMS notes and projects is `noindex`;
 * - no `noindex` page anywhere is in the sitemap, and every indexable one is.
 *
 *   npm run build && npm test
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const SITE = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(SITE, 'dist');
const MIN_ITEMS = 2;

const files = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const head = (html, re) => decode(re.exec(html)?.[1] ?? '');

/** The tags in the sources, lower-cased: the slugs the build makes pages for. */
function sourceTags() {
  const portfolio = readFileSync(join(SITE, 'src/data/portfolio.ts'), 'utf8');
  const fromProjects = [...portfolio.matchAll(/^\s*tags:\s*\[([^\]]*)\]/gm)].flatMap(([, list]) => [...list.matchAll(/'([^']+)'/g)].map(([, t]) => t));
  const notesDir = join(SITE, 'src/content/notes');
  const fromNotes = readdirSync(notesDir).flatMap((f) => {
    const list = /^tags:\s*\[([^\]]*)\]/m.exec(readFileSync(join(notesDir, f), 'utf8'))?.[1] ?? '';
    return [...list.matchAll(/"([^"]+)"|'([^']+)'/g)].map(([, a, b]) => a ?? b);
  });
  return new Set([...fromProjects, ...fromNotes].map((t) => t.toLowerCase()));
}

test('every tag a project or a note carries has a display name', async () => {
  const { tagNames } = await import(join(SITE, 'src/data/tag-names.mjs'));
  const tags = sourceTags();
  assert.ok(tags.size > 0, 'no tags read from the sources: the reader is broken');
  assert.deepEqual([...tags].filter((t) => !(t in tagNames)), [], 'add these to src/data/tag-names.mjs');
  assert.deepEqual(Object.keys(tagNames).filter((t) => !tags.has(t)), [], 'no source carries these: remove them');
});

const tagPages = () =>
  existsSync(DIST)
    ? files(DIST).filter((f) => /\/tags\/[^/]+\/index\.html$/.test(f)).map((file) => {
        const html = readFileSync(file, 'utf8');
        const main = /<main[\s\S]*?<\/main>/.exec(html)?.[0] ?? '';
        return {
          get items() {
            return this.projects + this.notes;
          },
          path: `/${relative(DIST, file)}`,
          title: head(html, /<title>([^<]*)<\/title>/),
          description: head(html, /<meta name="description" content="([^"]*)"/),
          noindex: /<meta name="robots" content="noindex/.test(html),
          projects: (main.match(/data-project-title/g) ?? []).length,
          notes: (main.match(/href="(?:\/es)?\/notes\/[^"/]+\/"/g) ?? []).length,
        };
      })
    : [];

test('no two tag pages share a title or a description', () => {
  const pages = tagPages();
  assert.ok(pages.length > 0, 'no tag pages in dist: run the build first');
  for (const field of ['title', 'description']) {
    const seen = new Map();
    for (const page of pages) seen.set(page[field], [...(seen.get(page[field]) ?? []), page.path]);
    assert.deepEqual([...seen].filter(([, paths]) => paths.length > 1), [], `duplicate ${field}s`);
  }
});

test('a tag page names only what it lists', () => {
  const pages = tagPages();
  assert.ok(pages.length > 0, 'no tag pages in dist: run the build first');
  const wrong = pages.flatMap((p) => [
    ...(p.notes === 0 && /\b(notes|notas)\b/i.test(`${p.title} ${p.description}`) ? [`${p.path} names notes and lists none`] : []),
    ...(p.projects === 0 && /\b(projects|proyectos)\b/i.test(`${p.title} ${p.description}`) ? [`${p.path} names projects and lists none`] : []),
  ]);
  assert.deepEqual(wrong, []);
});

test('a tag page with fewer than MIN_ITEMS items is noindex, and only that one', () => {
  const pages = tagPages();
  assert.ok(pages.length > 0, 'no tag pages in dist: run the build first');
  assert.ok(pages.every((p) => p.items > 0), 'a tag page lists nothing: the item count is broken');
  const wrong = pages.filter((p) => p.noindex !== p.items < MIN_ITEMS).map((p) => `${p.path} (${p.items} items, noindex=${p.noindex})`);
  assert.deepEqual(wrong, []);
});

test('no page names a noindex page as its alternate', () => {
  assert.ok(existsSync(DIST), 'no dist/: run the build first');
  const html = new Map(files(DIST).filter((f) => f.endsWith('/index.html')).map((f) => [`/${relative(DIST, f)}`.replace(/index\.html$/, ''), readFileSync(f, 'utf8')]));
  const noindex = (path) => /<meta name="robots" content="noindex/.test(html.get(path) ?? '');
  const wrong = [...html].flatMap(([path, page]) =>
    [...page.matchAll(/<link rel="alternate" hreflang="[^"]+" href="https:\/\/mlorente\.dev([^"]*)"/g)]
      .map(([, target]) => target)
      .filter((target) => target !== path && noindex(target))
      .map((target) => `${path} -> ${target}`),
  );
  assert.ok([...html.values()].some((page) => /hreflang=/.test(page)), 'no page declares an alternate: the reader is broken');
  assert.deepEqual(wrong, []);
});

test('the sitemap lists every indexable page and no noindex one', () => {
  assert.ok(existsSync(join(DIST, 'sitemap-0.xml')), 'no sitemap: run the build first');
  const listed = new Set([...readFileSync(join(DIST, 'sitemap-0.xml'), 'utf8').matchAll(/<loc>https:\/\/mlorente\.dev([^<]*)<\/loc>/g)].map(([, p]) => p));
  const pages = files(DIST)
    .filter((f) => f.endsWith('/index.html'))
    .map((f) => ({ path: `/${relative(DIST, f)}`.replace(/index\.html$/, ''), noindex: /<meta name="robots" content="noindex/.test(readFileSync(f, 'utf8')) }));
  assert.deepEqual(pages.filter((p) => p.noindex && listed.has(p.path)).map((p) => p.path), [], 'noindex pages in the sitemap');
  assert.deepEqual(pages.filter((p) => !p.noindex && !listed.has(p.path)).map((p) => p.path), [], 'indexable pages missing from the sitemap');
});
