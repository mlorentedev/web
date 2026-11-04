/**
 * Sentences are not set at 12 px; `text-xs` is for metadata (WEB-132).
 *
 * `text-xs` suits a date, a tag, a caption or a provenance line. It was also on
 * descriptive paragraphs, the lead of each IDP catalogue section among them,
 * which render at 12 px on a phone. A `<p>` counts as 12 px when it carries
 * `text-xs` at any breakpoint: `text-xs sm:text-sm` is 12 px on a phone, and
 * `text-sm sm:text-xs` is 12 px on a desktop.
 *
 *   npm run build && npm test
 *
 * Two checks over `dist/`, which fail rather than skip when there is no build:
 * - no 12 px paragraph holds a sentence, read as twelve words or more;
 * - the number of 12 px paragraphs does not grow past BASELINE. It is a
 *   ceiling, so a new caption needs the number raised in the same change.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const BASELINE = 145;
const SENTENCE_WORDS = 12;

/** True when the class list sets 12 px at some breakpoint, with or without a `/<line-height>`. */
const isSmall = (classes) => classes.split(/\s+/).some((c) => /(^|:)text-xs(\/\S+)?$/.test(c));

const pages = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return pages(path);
    return entry.name.endsWith('.html') ? [path] : [];
  });

/** Every `<p class="… text-xs …">` in dist, with its page and its text. */
function smallParagraphs() {
  return pages(DIST).flatMap((file) =>
    [...readFileSync(file, 'utf8').matchAll(/<p\b[^>]*\bclass="([^"]*)"[^>]*>([\s\S]*?)<\/p>/g)]
      .filter(([, classes]) => isSmall(classes))
      .map(([, , html]) => ({
        page: `/${relative(DIST, file)}`,
        text: html.replace(/<[^>]+>/g, ' ').replace(/&[#\w]+;/g, ' ').replace(/\s+/g, ' ').trim(),
      })),
  );
}

const words = (text) => text.match(/\p{L}{2,}/gu)?.length ?? 0;

test('a breakpoint variant of text-xs counts as 12 px', () => {
  assert.deepEqual(
    ['text-xs', 'text-sm sm:text-xs', 'max-sm:text-xs leading-5', 'text-xs/5', 'text-sm', 'text-xsm'].map(isSmall),
    [true, true, true, true, false, false],
  );
});

test('no sentence is set at 12 px', () => {
  const sentences = smallParagraphs().filter(({ text }) => words(text) >= SENTENCE_WORDS);
  assert.deepEqual(
    sentences.map(({ page, text }) => `${page}: ${text.slice(0, 80)}`),
    [],
    'descriptive copy is `text-sm` or larger; `text-xs` is for metadata',
  );
});

test('12 px paragraphs do not grow past the baseline', () => {
  const count = smallParagraphs().length;
  assert.ok(count <= BASELINE, `${count} paragraphs at text-xs, baseline ${BASELINE}: is the new one metadata?`);
});
