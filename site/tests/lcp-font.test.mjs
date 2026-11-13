/**
 * The headline's face is declared and preloaded (#139).
 *
 * `font-extrabold` asks for 800 and `font-semibold` for 600. No Roboto file holds
 * those weights: Black and Bold serve them, and a range in `@font-face` says so
 * instead of leaving it to font matching. Headings are set in Archivo, one
 * variable file whose range covers every heading weight. It renders the home's
 * `h1`, the LCP element, so it cannot wait for the stylesheet to be parsed.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const css = read('src/styles/global.css');

const declared = (file) =>
  css.match(new RegExp(`${file}\\.woff2[\\s\\S]*?font-weight: ([^;]+);`))[1];

test('@font-face declares every weight the markup uses', () => {
  assert.equal(declared('Roboto-Bold'), '600 700');
  assert.equal(declared('Roboto-Black'), '800 900');
  assert.equal(declared('Archivo'), '500 800');
  assert.equal(declared('JetBrainsMono'), '400 600');
});

test('headings are set in the display family', () => {
  const theme = read('src/styles/tailwind.css');
  assert.match(theme, /--font-display: Archivo,/);
  assert.match(theme, /h4 \{\s*font-family: var\(--font-display\);/);
});

test('the layout preloads the face the h1 renders in', () => {
  assert.match(read('src/layouts/BaseLayout.astro'), /rel="preload" href="\/fonts\/Archivo\.woff2"/);
});
