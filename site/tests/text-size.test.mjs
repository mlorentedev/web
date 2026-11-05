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
 * - no 12 px text block holds a sentence, read as twelve words or more. A
 *   block is a `<p>`, `<li>`, `<figcaption>`, `<dd>` or `<td>`, sized by the
 *   same rule (WEB-184: the diagram captions were sentences at 12 px in a
 *   `<figcaption>`, which a `<p>`-only check never read). A footer is
 *   metadata (provenance, licence), so its blocks are left out;
 * - the number of 12 px paragraphs (`<p>` only) does not grow past BASELINE.
 *   It is a ceiling, so a new caption needs the number raised in the same
 *   change.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
// 146 paragraphs with text-xs on their own, and the 4 IDP provenance footers that inherit it.
// Each new page adds one: the footer's copyright line (the last was /es/projects).
const BASELINE = 150;
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

const BLOCKS = new Set(['p', 'li', 'figcaption', 'dd', 'td']);

/**
 * Every text block (BLOCKS) that renders at 12 px in one page: its own size
 * class, or else the nearest ancestor's, since `font-size` inherits. Its text
 * is only what renders at 12 px: a `<p class="text-sm">` inside a `text-xs`
 * cell keeps its own size, so its words are not the cell's. Blocks nest (a
 * `<p>` in an `<li>`), so each open one collects on its own.
 */
function smallIn(html) {
  const found = [];
  const stack = [];
  const open = [];
  let last = 0;
  const source = html.replace(/<(script|style)\b[\s\S]*?<\/\1>/g, '');
  for (const { 0: tag, 1: slash, 2: name, 3: attrs, index } of source.matchAll(/<(\/?)([a-zA-Z][\w-]*)\b([^>]*)>/g)) {
    if (stack.findLast((entry) => entry.size)?.size === 'xs') {
      for (const block of open) block.text += ` ${source.slice(last, index)}`;
    }
    last = index + tag.length;
    const el = name.toLowerCase();
    if (slash) {
      const block = open.findLastIndex((entry) => entry.el === el);
      if (block >= 0) found.push(...open.splice(block, 1).map(({ el: name, text, inFooter }) => ({ el: name, text, inFooter })));
      const at = stack.findLastIndex((entry) => entry.el === el);
      if (at >= 0) stack.length = at;
      continue;
    }
    if (VOID.has(el) || tag.endsWith('/>')) continue;
    const size = sizeOf(/\bclass="([^"]*)"/.exec(attrs)?.[1] ?? '');
    stack.push({ el, size });
    if (BLOCKS.has(el) && stack.findLast((entry) => entry.size)?.size === 'xs') {
      open.push({ el, text: '', inFooter: stack.some((entry) => entry.el === 'footer') });
    }
  }
  return found;
}

/** Every text block in dist that renders at 12 px, with its page, element and text. */
function smallBlocks() {
  return pages(DIST).flatMap((file) =>
    smallIn(readFileSync(file, 'utf8')).map(({ el, text, inFooter }) => ({
      page: `/${relative(DIST, file)}`,
      el,
      inFooter,
      text: text.replace(/&[#\w]+;/g, ' ').replace(/\s+/g, ' ').trim(),
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

test('a text block takes its size from the nearest element that sets one, and counts only its 12 px text', () => {
  const texts = (html) => smallIn(html).map(({ el, text }) => `${el}:${text.trim()}`);
  assert.deepEqual(texts('<figure><figcaption class="text-xs">cap</figcaption></figure>'), ['figcaption:cap']);
  assert.deepEqual(texts('<ul class="text-xs"><li>one</li><li class="text-sm">two</li></ul>'), ['li:one']);
  assert.deepEqual(texts('<dl class="text-xs"><dt>term</dt><dd>def</dd></dl><table><tr><td class="text-xs">cell</td></tr></table>'), ['dd:def', 'td:cell']);
  assert.deepEqual(texts('<ul class="text-xs"><li><p>inner</p></li></ul>'), ['p:inner', 'li:inner']);
  assert.deepEqual(texts('<td class="text-xs"><p class="text-sm">a sentence</p><span>Go</span></td>'), ['td:Go']);
  assert.deepEqual(texts('<td class="text-xs"><p>inherited</p></td>'), ['p:inherited', 'td:inherited']);
  assert.deepEqual(texts('<div class="text-xs"><p class="text-sm">own size wins</p></div>'), []);
  assert.deepEqual(texts('<div class="text-sm"><p class="text-xs">own</p></div><p>none</p>'), ['p:own']);
  assert.deepEqual(texts('<div class="text-xs"><img src="a"><br></div><p>after the div closes</p>'), []);
});

test('no sentence is set at 12 px', () => {
  const sentences = smallBlocks().filter(({ text, inFooter }) => !inFooter && words(text) >= SENTENCE_WORDS);
  assert.deepEqual(
    sentences.map(({ page, el, text }) => `${page} <${el}>: ${text.slice(0, 80)}`),
    [],
    'descriptive copy is `text-sm` or larger; `text-xs` is for metadata',
  );
});

test('12 px paragraphs do not grow past the baseline', () => {
  const count = smallBlocks().filter(({ el }) => el === 'p').length;
  assert.ok(count <= BASELINE, `${count} paragraphs at text-xs, baseline ${BASELINE}: is the new one metadata?`);
});
