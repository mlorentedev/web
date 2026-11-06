/**
 * Every call-to-action button is `Button.astro` (WEB-133 AC2).
 *
 * The primary CTA had four hand-typed treatments: ink with two paddings, cyan on
 * the 404 page, and accent on the dark lab panel. Nothing distinguished them by
 * meaning, so they read as different design systems. `Button.astro` now holds the
 * treatments, one per background: `primary` on light, `on-dark` and
 * `on-dark-secondary` on the dark panel, in a single size.
 *
 * A button is recognised by its fill: a link or button carrying one of the
 * filled CTA backgrounds together with horizontal padding. Chips and badges
 * (`bg-panel-900 font-mono`, tag chips) use other fills and are not CTAs.
 *
 *   npm test
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

// `.astro` and the MDX and Markdown content, which can carry raw anchors.
const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
// A fill, bare or behind a breakpoint (`md:`): a CTA from some width up is still a CTA.
// State prefixes (`hover:`, `focus:`) are not fills: a chip that turns accent on hover is no button.
const BREAKPOINT = '(?:(?:sm|md|lg|xl|2xl):)?';
// The fills are read from Button.astro, every `bg-*` its variants paint at rest
// or on hover, so a new variant widens the guard with it. `cyan-700` is the
// retired 404 treatment, kept so it cannot come back by hand.
const BUTTON = readFileSync(join(SRC, 'components/Button.astro'), 'utf8');
const FILL_TOKENS = [...new Set([...BUTTON.matchAll(/(?<![\w-])(?:[a-z]+:)?bg-([a-z]+-\d+(?:\/\d+)?)/g)].map(([, token]) => token)), 'cyan-700'];
const FILLS = new RegExp(`(?<![\\w:-])${BREAKPOINT}bg-(${FILL_TOKENS.map((t) => t.replace('/', '\\/')).join('|')})(?:\\/\\d+)?(?![\\w/-])`);

const files = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return files(path);
    return /\.(astro|mdx?)$/.test(entry.name) ? [path] : [];
  });

// Opening tags and their `class` values are read by a scanner, not a regex: an
// attribute can hold `{…}` nested to any depth, with quotes inside, and a tag the
// pattern could not match would be a CTA nobody checked.

/** From `source[i]`, a quote or a `{`, the index just past the value it opens. */
function valueEnd(source, i) {
  const open = source[i];
  if (open !== '{') {
    const close = source.indexOf(open, i + 1);
    return close < 0 ? source.length : close + 1;
  }
  let depth = 0;
  for (let j = i; j < source.length; j++) {
    const c = source[j];
    if (c === '"' || c === "'" || c === '`') j = valueEnd(source, j) - 1;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return j + 1;
  }
  return source.length;
}

/** Every `<a>`, `<button>` and `<Button>` opening tag: its name and its attribute text. */
function openingTags(source) {
  const tags = [];
  for (const m of source.matchAll(/<(a|button|Button)\b/g)) {
    let j = m.index + m[0].length;
    while (j < source.length && source[j] !== '>') j = /["'{]/.test(source[j]) ? valueEnd(source, j) : j + 1;
    tags.push([m[1], source.slice(m.index + m[0].length, j)]);
  }
  return tags;
}

/** `class="…"`, `class='…'`, and the expression in `class={…}` or `class:list={…}`, joined. */
function classesOf(attrs) {
  return [...attrs.matchAll(/\bclass(?::list)?\s*=\s*(?=["'{])/g)]
    .map((m) => {
      const start = m.index + m[0].length;
      return attrs.slice(start + 1, valueEnd(attrs, start) - 1);
    })
    .map((value) => value.replace(/\s+/g, ' ').trim())
    .join(' ');
}

// What `Button`'s `class` must not carry: its colour and size are the variant's.
// Bare (`rounded`, `border`, `shadow`) or with a value, after any variant prefix (`md:`, `2xl:`, `hover:`).
// `text-` is colour or size, except the alignment and wrapping utilities, which are the caller's layout.
const TEXT_LAYOUT = '(?:left|center|right|justify|start|end|balance|pretty|wrap|nowrap|ellipsis|clip)(?![\\w-])';
const LOOK = new RegExp(`(?<![\\w-])(?:[a-z0-9]+:)*(?:text-(?!${TEXT_LAYOUT})|(?:bg|leading|h|min-h|max-h|px|py|pt|pb|pl|pr|ps|pe|p)-|(?:border|shadow|rounded)(?![\\w]))`);
// Horizontal padding, from any utility that sets it.
const PAD_X = new RegExp(`(?<![\\w:-])${BREAKPOINT}(?:p|px|pl|pr|ps|pe)-`);
// Markdown code is a quoted example, not markup: fences at any indentation (in a
// list or a blockquote too), and inline code spans on one line: a stray backtick
// must not hide the lines after it. A span across lines stays, and fails closed.
const withoutFences = (source) =>
  source.replace(/^([ \t>]*)(```|~~~)[^\n]*\n[\s\S]*?^[ \t>]*\2[^\n]*$/gm, '').replace(/(`+)[^`\n][^\n]*?\1/g, '');

/** The tags in `source` that style a CTA by hand, or restyle `Button` from outside. */
function handRolled(source) {
  return openingTags(source).flatMap(([tag, attrs]) => {
    const classes = classesOf(attrs);
    if (tag === 'Button') return LOOK.test(classes) ? [`<Button class="${classes}">`] : [];
    return FILLS.test(classes) && PAD_X.test(classes) ? [classes] : [];
  });
}

test('the detector finds a hand-styled CTA and passes chips and hover-only fills', () => {
  assert.equal(handRolled('<a href="/" class="px-4 py-2 bg-ink-900 text-white">x</a>').length, 1);
  assert.equal(handRolled('<a\n  href="/"\n  class="inline-block px-6 py-3 bg-cyan-700 hover:bg-cyan-800"\n>x</a>').length, 1);
  assert.equal(handRolled('<button class="px-4 bg-accent-700">x</button>').length, 1);
  assert.equal(handRolled('<a class="px-2 text-xs rounded bg-ink-100 hover:bg-accent-700">tag</a>').length, 0);
  assert.equal(handRolled('<a class="text-xs font-mono px-3 bg-panel-900 text-white">chip</a>').length, 0);
  assert.equal(handRolled('<a class="sr-only focus:bg-accent-700 focus:px-4">skip</a>').length, 0);
});

test('the detector reads past a > in a value, reads class:list, and checks what a caller passes to Button', () => {
  assert.equal(handRolled('<a aria-label="Go > home" class="px-4 bg-ink-900">x</a>').length, 1);
  assert.equal(handRolled("<a class:list={['px-4', cond && 'bg-ink-900']}>x</a>").length, 1);
  assert.equal(handRolled('<Button href="/" class="bg-cyan-700">x</Button>').length, 1);
  assert.equal(handRolled('<Button href="/" class="md:px-6">x</Button>').length, 1);
  assert.equal(handRolled('<Button href="/" class="w-fit shrink-0">x</Button>').length, 0);
  assert.equal(handRolled('<a class = "px-4 bg-ink-900">x</a>').length, 1);
  assert.equal(handRolled('<a class="p-4 bg-ink-900">x</a>').length, 1);
  assert.equal(handRolled('<Button href="/" class="rounded">x</Button>').length, 1);
  assert.equal(handRolled('<Button href="/" class="2xl:px-6">x</Button>').length, 1);
  assert.equal(handRolled('<Button href="/" class="w-full md:w-auto self-start">x</Button>').length, 0);
  assert.equal(handRolled('<Button href="/" class="text-balance md:text-center">x</Button>').length, 0);
  assert.equal(handRolled('<Button href="/" class="text-sm">x</Button>').length, 1);
  assert.equal(handRolled('<Button href="/" class="hover:text-white">x</Button>').length, 1);
  assert.equal(handRolled('<Button href="/" class="pt-4">x</Button>').length, 1);
  assert.equal(handRolled('<Button href="/" class="leading-6">x</Button>').length, 1);
  assert.equal(handRolled('<Button href="/" class="min-h-12">x</Button>').length, 1);
  assert.equal(handRolled('<Button href="/" class="h-14">x</Button>').length, 1);
  assert.equal(handRolled('<a href="/x" class="md:px-6 md:bg-ink-900">x</a>').length, 1);
  assert.equal(handRolled(withoutFences('Example:\n\n```html\n<a href="/" class="px-6 py-3 bg-cyan-700">x</a>\n```\n')).length, 0);
  assert.equal(handRolled(withoutFences('```html\nquoted\n```\n<a class="px-4 bg-ink-900">x</a>\n')).length, 1);
  assert.equal(handRolled(withoutFences('Run `npm test.\n\n<a class="px-4 bg-ink-900">x</a>\n\nThen `done`.\n')).length, 1);
  assert.equal(handRolled(withoutFences('- step\n\n    ```html\n    <a class="px-4 bg-ink-900">x</a>\n    ```\n')).length, 0);
  assert.equal(handRolled(withoutFences('> ```html\n> <a class="px-4 bg-ink-900">x</a>\n> ```\n')).length, 0);
  assert.equal(handRolled(withoutFences('Use `<a class="px-4 bg-ink-900">` no more.')).length, 0);
  assert.equal(handRolled('<a class="px-4 py-2 bg-panel-800 text-white">x</a>').length, 1);
  assert.equal(handRolled('<a class="px-4 py-2 bg-accent-600 text-white">x</a>').length, 1);
  assert.equal(handRolled('<a class="px-6 py-3 bg-ink-900/90 text-white">x</a>').length, 1);
  assert.equal(handRolled('<a class="px-6 bg-ink-9000">x</a>').length, 0);
  assert.equal(handRolled('<a data-x={() => { if (ok) { go(); } }} class="bg-ink-900 px-4">x</a>').length, 1);
  assert.equal(handRolled('<a class={cond ? { a: "bg-ink-900 px-4" }.a : ""}>x</a>').length, 1);
  assert.equal(handRolled('<a title="a > b" data-s=\'{\' class="bg-ink-900 px-4">x</a>').length, 1);
});

test('every CTA button on the site is Button.astro', () => {
  const found = files(SRC)
    .filter((file) => relative(SRC, file).split(sep).join('/') !== 'components/Button.astro')
    .flatMap((file) => handRolled(/\.mdx?$/.test(file) ? withoutFences(readFileSync(file, 'utf8')) : readFileSync(file, 'utf8')).map((classes) => `${relative(SRC, file)}: ${classes}`));
  assert.deepEqual(found, [], 'use <Button variant=…> instead of styling a CTA by hand');
});
