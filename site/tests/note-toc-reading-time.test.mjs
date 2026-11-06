/**
 * A long note says how long it is and what it covers before the reader commits (WEB-129).
 *
 * - Every note shows a reading time next to its date, computed from the words
 *   of its source at a fixed rate: no estimate is typed by hand.
 * - A note with 6 or more section headings (h2 and h3) opens with a table of
 *   contents built from the headings the page renders: one link per heading,
 *   in order, each to an id the page carries. A shorter note has none.
 *
 *   npm run build && npm test
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { readingMinutes, TOC_MIN_HEADINGS, tocEntries, WORDS_PER_MINUTE } from '../src/lib/note-reading.mjs';

const SITE = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(SITE, 'dist');
const NOTES = join(SITE, 'src/content/notes');

const words = (n) => Array.from({ length: n }, (_, i) => `w${i}`).join(' ');

test('reading time is the word count over a fixed rate, never under a minute', () => {
  assert.equal(readingMinutes(''), 1);
  assert.equal(readingMinutes(words(WORDS_PER_MINUTE)), 1);
  assert.equal(readingMinutes(words(WORDS_PER_MINUTE * 10)), 10);
  assert.equal(readingMinutes(words(Math.round(WORDS_PER_MINUTE * 2.6))), 3);
});

test('reading time does not count MDX imports, JSX tags or markup', () => {
  const prose = words(WORDS_PER_MINUTE * 2);
  const mdx = `import Diagram from '../../components/Diagram.astro';\nexport const x = 1;\n\n<Diagram id="a" caption="b c d e f g" />\n\n${prose}\n\n<div class="x y z">\n</div>`;
  assert.equal(readingMinutes(mdx), readingMinutes(prose));
});

test('reading time counts prose only: fenced code is left out, and a bare < in prose is not a tag', () => {
  const prose = words(WORDS_PER_MINUTE * 2);
  const code = '```js\nimport x from "y";\n' + words(WORDS_PER_MINUTE * 3) + '\n```';
  assert.equal(readingMinutes(`${prose}\n\n${code}\n`), readingMinutes(prose), 'a code block counted as prose');
  const comparison = `while i < n ${words(WORDS_PER_MINUTE * 2)} and n > 0`;
  assert.equal(readingMinutes(comparison), 2, 'the text between a bare < and a later > was dropped');
});

test('a table of contents lists h2 and h3 only, and only from the stated threshold', () => {
  const h = (depth, i) => ({ depth, slug: `s${i}`, text: `S ${i}` });
  const few = [h(2, 1), h(3, 2), h(2, 3), h(4, 4), h(2, 5), h(2, 6), h(1, 7)];
  assert.deepEqual(tocEntries(few), [], 'h1 and h4 are not sections; five sections are under the threshold');
  const enough = Array.from({ length: TOC_MIN_HEADINGS }, (_, i) => h(i % 2 ? 3 : 2, i));
  assert.deepEqual(tocEntries(enough), enough);
});

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

const sourceBody = (id) => {
  const file = readdirSync(NOTES).find((f) => f.replace(/\.mdx?$/, '') === id);
  assert.ok(file, `${id}: no source note`);
  return readFileSync(join(NOTES, file), 'utf8').replace(/^---\n[\s\S]*?\n---\n/, '');
};

const between = (html, start, end) => {
  const i = html.indexOf(start);
  return i < 0 ? '' : html.slice(i, html.indexOf(end, i));
};

test('each note shows its reading time in its byline, and a table of contents when it is long', () => {
  const pages = notePages();
  assert.ok(pages.length > 0, 'no note pages in dist: run the build first');
  let withToc = 0;
  for (const [route, id, html] of pages) {
    // The note's own header, inside the article: the first <header> is the site's.
    const byline = between(between(html, '<article', '</article>'), '<header', '</header>');
    const shown = byline.match(/data-reading-time[^>]*>[^<\d]*(\d+) /)?.[1];
    assert.equal(Number(shown), readingMinutes(sourceBody(id)), `${route}: reading time`);

    const prose = between(html, 'data-note-body', '</article>');
    const sections = [...prose.matchAll(/<h([23])[^>]*\bid="([^"]+)"/g)].map(([, , slug]) => slug);
    const toc = between(html, '<nav data-note-toc', '</nav>');
    const links = [...toc.matchAll(/href="#([^"]+)"/g)].map(([, slug]) => slug);
    if (sections.length >= TOC_MIN_HEADINGS) {
      withToc += 1;
      assert.deepEqual(links, sections, `${route}: the table of contents is not the page's h2 and h3, in order`);
      assert.match(toc, /aria-labelledby="note-toc-label"/, `${route}: the table of contents has no name`);
    } else {
      assert.equal(toc, '', `${route}: ${sections.length} sections, under ${TOC_MIN_HEADINGS}, and a table of contents`);
    }
  }
  assert.ok(withToc > 0, 'no built note reaches the threshold: the table of contents is never exercised');
});
