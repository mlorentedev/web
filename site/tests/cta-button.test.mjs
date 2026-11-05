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
import { dirname, join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const FILLS = /(?<![\w:-])bg-(ink-900|accent-700|cyan-700|panel-800\/80)(?![\w-])/;

const files = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return files(path);
    return entry.name.endsWith('.astro') ? [path] : [];
  });

// One opening tag, quote- and brace-aware, so a `>` inside a value does not end it.
const TAG = /<(a|button|Button)\b((?:[^>"'{]|"[^"]*"|'[^']*'|\{(?:[^{}]|\{[^{}]*\})*\})*)>/g;
// `class="…"`, `class='…'`, and the expression in `class={…}` or `class:list={…}`.
const CLASS = /\bclass(?::list)?\s*=\s*(?:"([^"]*)"|'([^']*)'|\{((?:[^{}]|\{[^{}]*\})*)\})/g;
// What `Button`'s `class` must not carry: its colour and size are the variant's.
// Bare (`rounded`, `border`, `shadow`) or with a value, after any variant prefix (`md:`, `2xl:`, `hover:`).
const LOOK = /(?<![\w-])(?:[a-z0-9]+:)*(?:(?:bg|text|px|py|pl|pr|ps|pe|p)-|(?:border|shadow|rounded)(?![\w]))/;
// Horizontal padding, from any utility that sets it.
const PAD_X = /(?<![\w:-])(?:p|px|pl|pr|ps|pe)-/;

/** The tags in `source` that style a CTA by hand, or restyle `Button` from outside. */
function handRolled(source) {
  return [...source.matchAll(TAG)].flatMap(([, tag, attrs]) => {
    const classes = [...attrs.matchAll(CLASS)].map((m) => (m[1] ?? m[2] ?? m[3]).replace(/\s+/g, ' ').trim()).join(' ');
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
});

test('every CTA button on the site is Button.astro', () => {
  const found = files(SRC)
    .filter((file) => !file.endsWith('/components/Button.astro'))
    .flatMap((file) => handRolled(readFileSync(file, 'utf8')).map((classes) => `${relative(SRC, file)}: ${classes}`));
  assert.deepEqual(found, [], 'use <Button variant=…> instead of styling a CTA by hand');
});
