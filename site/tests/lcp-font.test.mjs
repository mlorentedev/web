/**
 * The headline's face is declared and preloaded (#139).
 *
 * `font-extrabold` asks for 800 and `font-semibold` for 600. No file holds those
 * weights: Black and Bold serve them, and a range in `@font-face` says so instead
 * of leaving it to font matching. Black renders the home's `h1`, the LCP element,
 * so it cannot wait for the stylesheet to be parsed.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const css = read('src/styles/global.css');

const declared = (file) =>
  css.match(new RegExp(`Roboto-${file}\\.woff2[\\s\\S]*?font-weight: ([^;]+);`))[1];

test('@font-face declares every weight the markup uses', () => {
  assert.equal(declared('Bold'), '600 700');
  assert.equal(declared('Black'), '800 900');
});

test('the layout preloads the face the h1 renders in', () => {
  assert.match(read('src/layouts/BaseLayout.astro'), /rel="preload" href="\/fonts\/Roboto-Black\.woff2"/);
});
