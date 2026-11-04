/**
 * Sentences are not set at 12 px; `text-xs` is for metadata (WEB-132).
 *
 * `text-xs` suits a date, a tag, a caption or a provenance line. It was also on
 * descriptive paragraphs, the lead of each IDP catalogue section among them,
 * which render at 12 px on a phone. A `<p>` counts as 12 px when it, or else
 * its nearest ancestor that sets a size, carries `text-xs` at any breakpoint:
 * `text-xs sm:text-sm` is 12 px on a phone, `text-sm sm:text-xs` is 12 px on a
 * desktop, and a `<p>` in a `text-xs` table cell is 12 px too.
 *
 *   npm run build && npm test
 *
 * Two checks over `dist/`, which fail rather than skip when there is no build:
 * - no 12 px paragraph holds a sentence, read as twelve words or more. A
 *   footer is metadata (provenance, licence), so its paragraphs are left out;
 * - the number of 12 px paragraphs does not grow past BASELINE. It is a
 *   ceiling, so a new caption needs the number raised in the same change.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
// 145 paragraphs with text-xs on their own, and the 4 IDP provenance footers that inherit it.
const BASELINE = 149;
const SENTENCE_WORDS = 12;

/** True when the class list sets 12 px at some breakpoint, with or without a `/<line-height>`. */
const isSmall = (classes) => classes.split(/\s+/).some((c) => /(^|:)text-xs(\/\S+)?$/.test(c));

const pages = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return pages(path);
    return entry.name.endsWith('.html') ? [path] : [];
  });

/** 'xs' when the classes set 12 px, 'other' when they set another size, null when they set none. */
const sizeOf = (classes) => {
  if (isSmall(classes)) return 'xs';
  return classes.split(/\s+/).some((c) => /(^|:)text-(sm|base|lg|\d?xl)(\/\S+)?$/.test(c)) ? 'other' : null;
};
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);

/**
 * Every `<p>` that renders at 12 px in one page: its own size class, or else the
 * nearest ancestor's, since `font-size` inherits.
 */
function smallIn(html) {
  const found = [];
  const stack = [];
  let open = null;
  const source = html.replace(/<(script|style)\b[\s\S]*?<\/\1>/g, '');
  for (const { 0: tag, 1: slash, 2: name, 3: attrs, index } of source.matchAll(/<(\/?)([a-zA-Z][\w-]*)\b([^>]*)>/g)) {
    const el = name.toLowerCase();
    if (slash) {
      if (el === 'p' && open) {
        found.push({ html: source.slice(open.start, index), inFooter: open.inFooter });
        open = null;
      }
      const at = stack.findLastIndex((entry) => entry.el === el);
      if (at >= 0) stack.length = at;
      continue;
    }
    if (VOID.has(el) || tag.endsWith('/>')) continue;
    const size = sizeOf(/\bclass="([^"]*)"/.exec(attrs)?.[1] ?? '');
    stack.push({ el, size });
    if (el === 'p' && stack.findLast((entry) => entry.size)?.size === 'xs') {
      open = { start: index + tag.length, inFooter: stack.some((entry) => entry.el === 'footer') };
    }
  }
  return found;
}

/** Every `<p>` in dist that renders at 12 px, with its page and its text. */
function smallParagraphs() {
  return pages(DIST).flatMap((file) =>
    smallIn(readFileSync(file, 'utf8')).map(({ html, inFooter }) => ({
      page: `/${relative(DIST, file)}`,
      inFooter,
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

test('a paragraph takes its size from the nearest element that sets one', () => {
  const texts = (html) => smallIn(html).map(({ html: inner }) => inner.replace(/<[^>]+>/g, ''));
  assert.deepEqual(texts('<td class="text-xs"><p>inherited</p></td>'), ['inherited']);
  assert.deepEqual(texts('<div class="text-xs"><p class="text-sm">own size wins</p></div>'), []);
  assert.deepEqual(texts('<div class="text-sm"><p class="text-xs">own</p></div><p>none</p>'), ['own']);
  assert.deepEqual(texts('<div class="text-xs"><img src="a"><br></div><p>after the div closes</p>'), []);
});

test('no sentence is set at 12 px', () => {
  const sentences = smallParagraphs().filter(({ text, inFooter }) => !inFooter && words(text) >= SENTENCE_WORDS);
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
