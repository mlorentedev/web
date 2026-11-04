/**
 * Sentences are not set at 12 px; `text-xs` is for metadata (WEB-132).
 *
 * `text-xs` suits a date, a tag, a caption or a provenance line. It was also on
 * descriptive paragraphs, the lead of each IDP catalogue section among them,
 * which render at 12 px on a phone. A `<p>` counts as 12 px on a phone when it
 * carries `text-xs`, whatever it becomes at `sm:` and up.
 *
 *   npm run build && npm test
 *
 * Two checks over `dist/`:
 * - no 12 px paragraph holds a sentence, read as twelve words or more;
 * - the number of 12 px paragraphs does not grow past BASELINE. It is a
 *   ceiling, so a new caption needs the number raised in the same change.
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const BASELINE = 145;
const SENTENCE_WORDS = 12;

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
      .filter(([, classes]) => classes.split(/\s+/).includes('text-xs'))
      .map(([, , html]) => ({
        page: `/${relative(DIST, file)}`,
        text: html.replace(/<[^>]+>/g, ' ').replace(/&[#\w]+;/g, ' ').replace(/\s+/g, ' ').trim(),
      })),
  );
}

const words = (text) => text.match(/\p{L}{2,}/gu)?.length ?? 0;

test('no sentence is set at 12 px on a phone', { skip: !existsSync(DIST) }, () => {
  const sentences = smallParagraphs().filter(({ text }) => words(text) >= SENTENCE_WORDS);
  assert.deepEqual(
    sentences.map(({ page, text }) => `${page}: ${text.slice(0, 80)}`),
    [],
    'descriptive copy is `text-sm` or larger; `text-xs` is for metadata',
  );
});

test('12 px paragraphs do not grow past the baseline', { skip: !existsSync(DIST) }, () => {
  const count = smallParagraphs().length;
  assert.ok(count <= BASELINE, `${count} paragraphs at text-xs, baseline ${BASELINE}: is the new one metadata?`);
});
