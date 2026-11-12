/**
 * The dark palette is the light one read backwards, by role name.
 *
 * The site follows the visitor's system setting (no toggle), and every colour
 * is a role alias, so dark mode is one `@media (prefers-color-scheme: dark)`
 * block in `src/styles/tailwind.css` that redefines the names `@theme`
 * declares. These tests hold that block to its rule, read from the CSS that
 * shipped rather than the source, because the minifier is what the browser
 * sees.
 */

import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { PALETTE } from '../src/theme/palette.mjs';
import { COLOR_FAMILIES } from '../src/theme/tokens.mjs';

const siteRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(siteRoot, 'dist');

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const RAMPS = { red: 'red', ...COLOR_FAMILIES };

/** The step whose light hex a dark step takes: the mirror, except 500 → 400. */
function darkStep(step) {
  return step === 500 ? 400 : 1000 - step;
}

/** The hex a minifier may write for one: lower case, `#aabbcc` as `#abc`. */
function sameHex(a, b) {
  const long = (h) => {
    const x = h.toLowerCase().replace('#', '');
    return x.length === 3 ? [...x].map((c) => c + c).join('') : x;
  };
  return long(a) === long(b);
}

/** The body of the first dark media block in the built CSS, or null. */
function shippedDarkBlock() {
  const astro = join(distDir, '_astro');
  const css = readdirSync(astro)
    .filter((f) => f.endsWith('.css'))
    .map((f) => readFileSync(join(astro, f), 'utf8'))
    .join('\n');
  const start = css.search(/@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)/);
  if (start === -1) return null;
  // Balanced braces from the media query's own opening brace.
  const open = css.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++;
    if (css[i] === '}' && --depth === 0) return css.slice(open + 1, i);
  }
  return null;
}

test('the mapping mirrors each ramp and moves 500 to 400', () => {
  assert.deepEqual(
    STEPS.map(darkStep),
    [950, 900, 800, 700, 600, 400, 400, 300, 200, 100, 50],
  );
});

test('the shipped dark block redefines every palette name, and only those', () => {
  const block = shippedDarkBlock();
  assert.ok(block, 'no prefers-color-scheme: dark block in the built CSS: run the build first');

  const declared = Object.fromEntries(
    [...block.matchAll(/--color-([a-z]+(?:-\d+)?):\s*(#[0-9a-fA-F]{3,8})/g)].map((m) => [m[1], m[2]]),
  );

  const expected = { white: '#000', black: '#fff' };
  for (const [family, ramp] of Object.entries(RAMPS)) {
    for (const step of STEPS) expected[`${family}-${step}`] = PALETTE[ramp][darkStep(step)];
  }

  assert.deepEqual(Object.keys(declared).sort(), Object.keys(expected).sort());
  for (const [name, hex] of Object.entries(expected)) {
    assert.ok(sameHex(declared[name], hex), `--color-${name} is ${declared[name]} in dark, expected ${hex}`);
  }
  assert.match(block, /color-scheme:\s*dark/, 'the dark block does not set color-scheme: dark');
});

test('the page declares both schemes, so the UA paints its controls to match', () => {
  const global = readFileSync(join(siteRoot, 'src', 'styles', 'global.css'), 'utf8');
  assert.match(global, /color-scheme:\s*light dark;/);
});
