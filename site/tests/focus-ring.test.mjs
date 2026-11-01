/**
 * One focus indicator, owned by one rule (#114).
 *
 * `:focus-visible` in `tailwind.css` draws it. A `focus:` utility on an element
 * sits in a later cascade layer than that rule, so one stray
 * `focus:outline-hidden` erases it for that element, and `focus:outline-none`
 * was renamed to that by the Tailwind 4 upgrade: searching for the old name
 * finds nothing while the bug is still there.
 *
 * The rendered result is measured in `focus-ring.mjs`; this holds the source.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { backdrop, contrast, gradientStops, indicatorProblems, parseColour } from './lib/focus.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '..', 'src');

const INDICATOR_UTILITY = /\bfocus(?:-visible)?:(?:outline|ring|text|underline)[\w/-]*/g;

/** The skip link is `sr-only` until focused: it reveals itself on `focus:`. */
const SKIP_LINK = 'focus:not-sr-only';

function sources(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sources(path);
    return /\.(astro|mdx|ts|mjs|css)$/.test(entry.name) ? [path] : [];
  });
}

test('no element overrides the shared focus indicator', () => {
  const found = sources(src).flatMap((file) =>
    readFileSync(file, 'utf8')
      .split('\n')
      .filter((line) => !line.includes(SKIP_LINK))
      .flatMap((line) => line.match(INDICATOR_UTILITY) ?? [])
      .map((utility) => `${relative(src, file)}: ${utility}`),
  );
  assert.deepEqual(found, []);
});

test('the skip link still reveals itself on focus', () => {
  assert.match(readFileSync(join(src, 'layouts', 'BaseLayout.astro'), 'utf8'), /sr-only focus:not-sr-only/);
});

test('parseColour reads the forms Chromium computes, and refuses the rest', () => {
  assert.deepEqual(parseColour('rgb(14, 116, 144)'), { r: 14, g: 116, b: 144, a: 1 });
  assert.deepEqual(parseColour('rgba(0, 0, 0, 0)'), { r: 0, g: 0, b: 0, a: 0 });
  assert.equal(parseColour('color(srgb 1 1 1 / 0.8)').a, 0.8);
  assert.throws(() => parseColour('oklab(0.5 0 0)'), /cannot read colour/);
});

test('contrast matches the known extremes and the WCAG pair', () => {
  const white = parseColour('rgb(255, 255, 255)');
  assert.equal(contrast(white, parseColour('rgb(0, 0, 0)')), 21);
  assert.equal(contrast(white, white), 1);
  assert.equal(contrast(white, parseColour('rgb(118, 118, 118)')).toFixed(2), '4.54');
});

test('backdrop composites a translucent layer and keeps every gradient stop', () => {
  const clear = { backgroundColor: 'rgba(0, 0, 0, 0)', backgroundImage: 'none' };
  const half = { backgroundColor: 'rgba(0, 0, 0, 0.5)', backgroundImage: 'none' };
  assert.deepEqual(backdrop([half, clear]), [{ r: 127.5, g: 127.5, b: 127.5, a: 1 }]);

  const image = 'linear-gradient(to right in oklab, rgb(15, 23, 42) 0%, rgb(255, 255, 255) 100%)';
  assert.equal(gradientStops(image).length, 2);
  assert.equal(backdrop([{ ...clear, backgroundImage: image }]).length, 2);
});

test('backdrop paints a layer gradient over its own fill, as CSS does', () => {
  const image = 'linear-gradient(rgb(0, 0, 0), rgb(0, 0, 0))';
  assert.deepEqual(backdrop([{ backgroundColor: 'rgb(255, 255, 255)', backgroundImage: image }]), [
    { r: 0, g: 0, b: 0, a: 1 },
  ]);
});

test('a gradient stop in an unread colour space fails instead of vanishing', () => {
  assert.throws(() => gradientStops('linear-gradient(oklch(0.5 0.1 200), rgb(0, 0, 0))'), /cannot read colour/);
});

test('indicatorProblems names each way an indicator fails', () => {
  const on = (backgroundColor) => [{ backgroundColor, backgroundImage: 'none' }];
  const ring = { outlineStyle: 'solid', outlineWidth: '2px', outlineColor: 'rgb(14, 116, 144)' };

  assert.deepEqual(indicatorProblems({ ...ring, layers: on('rgb(255, 255, 255)') }), []);
  assert.deepEqual(indicatorProblems({ ...ring, outlineStyle: 'none', layers: on('rgb(255, 255, 255)') }), [
    'no outline',
  ]);
  assert.deepEqual(indicatorProblems({ ...ring, outlineWidth: '1px', layers: on('rgb(255, 255, 255)') }), [
    'outline is 1px',
  ]);
  assert.deepEqual(indicatorProblems({ ...ring, layers: on('rgb(14, 116, 144)') }), ['outline contrast 1.00:1']);
});
