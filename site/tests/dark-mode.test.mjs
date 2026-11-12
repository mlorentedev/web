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

/**
 * The dark palette block in the built CSS: the `prefers-color-scheme: dark`
 * media block that redefines `--color-ink-50`, with whether it sits inside an
 * `@layer` (it must not: an unlayered rule is what beats `@layer theme`).
 */
function shippedDarkBlock() {
  const astro = join(distDir, '_astro');
  const css = readdirSync(astro)
    .filter((f) => f.endsWith('.css'))
    .map((f) => readFileSync(join(astro, f), 'utf8'))
    .join('\n');
  for (const m of css.matchAll(/@media[^{]*prefers-color-scheme\s*:\s*dark[^{]*\{/g)) {
    const open = m.index + m[0].length - 1;
    let depth = 0;
    for (let i = open; i < css.length; i++) {
      if (css[i] === '{') depth++;
      if (css[i] === '}' && --depth === 0) {
        const body = css.slice(open + 1, i);
        if (!body.includes('--color-ink-50')) break;
        return { query: m[0], body, layered: insideLayer(css, m.index) };
      }
    }
  }
  return null;
}

/** Whether position `at` in `css` is inside an open `@layer … { }` block. */
function insideLayer(css, at) {
  const stack = [];
  for (let i = 0; i < at; i++) {
    if (css[i] === '{') {
      const head = css.slice(Math.max(0, css.lastIndexOf('}', i - 1) + 1, css.lastIndexOf(';', i - 1) + 1), i);
      stack.push(/@layer\b/.test(head));
    } else if (css[i] === '}') stack.pop();
  }
  return stack.includes(true);
}

/** The declarations of the first rule whose selector is exactly `selector`. */
function ruleBody(css, selector) {
  const at = css.indexOf(`${selector}{`) !== -1 ? css.indexOf(`${selector}{`) : css.indexOf(`${selector} {`);
  assert.notEqual(at, -1, `no ${selector} rule in the dark block`);
  const open = css.indexOf('{', at);
  return css.slice(open + 1, css.indexOf('}', open));
}

test('the mapping mirrors each ramp and moves 500 to 400', () => {
  assert.deepEqual(
    STEPS.map(darkStep),
    [950, 900, 800, 700, 600, 400, 400, 300, 200, 100, 50],
  );
});

test('the shipped dark block redefines every palette name, and only those', () => {
  const shipped = shippedDarkBlock();
  assert.ok(shipped, 'no prefers-color-scheme: dark palette block in the built CSS: run the build first');
  assert.equal(shipped.layered, false, 'the dark block sits inside an @layer, where @layer theme can beat it');
  assert.match(shipped.query, /screen/, 'the dark block is not screen-only, so a print from a dark OS would use it');
  // The palette proper is the `:root` rule; `.keep-dark` hands its subtree the
  // light palette back and is checked on its own below.
  const block = ruleBody(shipped.body, ':root');

  const declared = Object.fromEntries(
    [...block.matchAll(/--color-([a-z]+(?:-\d+)?):\s*(#[0-9a-fA-F]{3,8})/g)].map((m) => [m[1], m[2]]),
  );

  const expected = { white: PALETTE.slate[950], black: '#fff' };
  for (const [family, ramp] of Object.entries(RAMPS)) {
    for (const step of STEPS) expected[`${family}-${step}`] = PALETTE[ramp][darkStep(step)];
  }

  assert.deepEqual(Object.keys(declared).sort(), Object.keys(expected).sort());
  for (const [name, hex] of Object.entries(expected)) {
    assert.ok(sameHex(declared[name], hex), `--color-${name} is ${declared[name]} in dark, expected ${hex}`);
  }
  assert.match(block, /color-scheme:\s*dark/, 'the dark block does not set color-scheme: dark');
});

test('a keep-dark surface gets the light palette back, every name at its light hex', () => {
  const block = ruleBody(shippedDarkBlock().body, '.keep-dark');
  const declared = Object.fromEntries(
    [...block.matchAll(/--color-([a-z]+(?:-\d+)?):\s*(#[0-9a-fA-F]{3,8})/g)].map((m) => [m[1], m[2]]),
  );
  const expected = { white: '#fff', black: '#000' };
  for (const [family, ramp] of Object.entries(RAMPS)) {
    for (const step of STEPS) expected[`${family}-${step}`] = PALETTE[ramp][step];
  }
  assert.deepEqual(Object.keys(declared).sort(), Object.keys(expected).sort());
  for (const [name, hex] of Object.entries(expected)) {
    assert.ok(sameHex(declared[name], hex), `--color-${name} is ${declared[name]} on keep-dark, expected ${hex}`);
  }
});

test('dark mode keeps the drawn artwork and the brand marks on a light ground, and the prose by role', () => {
  const { body } = shippedDarkBlock();
  for (const selector of ['.lab-diagram', '[data-service-icon]', '.prose a:not([class]):hover']) {
    assert.ok(body.includes(selector), `the dark block lost its ${selector} rule`);
  }
});

test('the source declares both schemes, so the UA paints its controls to match', () => {
  const global = readFileSync(join(siteRoot, 'src', 'styles', 'global.css'), 'utf8');
  assert.match(global, /color-scheme:\s*light dark;/);
});
