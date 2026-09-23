/**
 * Tailwind is wired by the site, not by `@astrojs/tailwind` (WEB-022, #7).
 *
 * The integration is deprecated and its peer range stops at astro 5, so it is
 * what kept the site off Astro 7. Tailwind 4 now runs as a Vite plugin
 * (`astro.config.mjs`), configured in `src/styles/tailwind.css`, which
 * `BaseLayout.astro` imports first. Dropping the import still builds — it just
 * ships pages with no preflight and no utilities — so the build going green is
 * not the check. These tests read what shipped, and hold the pinned v3 palette
 * in the CSS to the one definition in `src/theme/palette.mjs`.
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { PALETTE } from '../src/theme/palette.mjs';
import { COLOR_FAMILIES } from '../src/theme/tokens.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(here, '..');
const distDir = join(siteRoot, 'dist');

/** Every built HTML page, as a path relative to `dist/`. */
function pages(dir = distDir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return pages(path);
    return entry.name.endsWith('.html') ? [relative(distDir, path)] : [];
  });
}

/** The CSS a page ships: its linked `/_astro/*.css` files, in document order. */
function shippedCss(html) {
  const hrefs = [...html.matchAll(/<link rel="stylesheet" href="(\/_astro\/[^"]+\.css)"/g)].map((m) => m[1]);
  return hrefs.map((href) => readFileSync(join(distDir, href), 'utf8')).join('\n');
}

// The head of preflight's first rule: `*,:before,:after{box-sizing:border-box;`
// in Tailwind 3, `*,:after,:before,::backdrop{…` in 4. Its presence means
// Tailwind's base layer reached the page; nothing else in the site writes it.
// Only the head: the rest of the rule is minifier- and version-shaped.
const PREFLIGHT = /\*,[^{]*:before[^{]*\{box-sizing:border-box;/;
// `global.css` opens with the Roboto faces. It must come after preflight, where
// it sat when it was an inline <style> following the stylesheet link.
const GLOBAL_CSS = '@font-face{font-family:Roboto';

test('the deprecated integration is gone from the manifest, the lockfile and the config', () => {
  const pkg = JSON.parse(readFileSync(join(siteRoot, 'package.json'), 'utf8'));
  const lock = JSON.parse(readFileSync(join(siteRoot, 'package-lock.json'), 'utf8'));
  const config = readFileSync(join(siteRoot, 'astro.config.mjs'), 'utf8');

  assert.equal(pkg.dependencies?.['@astrojs/tailwind'], undefined, 'package.json still depends on @astrojs/tailwind');
  assert.equal(pkg.devDependencies?.['@astrojs/tailwind'], undefined, 'package.json still depends on @astrojs/tailwind');
  assert.equal(lock.packages['node_modules/@astrojs/tailwind'], undefined, 'the lockfile still resolves @astrojs/tailwind');
  assert.doesNotMatch(config, /from '@astrojs\/tailwind'/, 'astro.config.mjs still imports the integration');
});

test('Tailwind 4 runs as the Vite plugin, with no PostCSS config left behind', () => {
  const config = readFileSync(join(siteRoot, 'astro.config.mjs'), 'utf8');
  assert.match(config, /import tailwindcss from '@tailwindcss\/vite';/, 'astro.config.mjs does not import @tailwindcss/vite');
  assert.match(config, /vite:\s*\{\s*plugins:\s*\[tailwindcss\(\)\]/, 'the Vite plugin is not registered');
  assert.ok(!existsSync(join(siteRoot, 'postcss.config.mjs')), 'postcss.config.mjs is back: Tailwind would run twice');
});

test('the CSS declares exactly the pinned v3 palette, and nothing of Tailwind 4\'s', () => {
  const css = readFileSync(join(siteRoot, 'src', 'styles', 'tailwind.css'), 'utf8');
  const theme = css.slice(css.indexOf('@theme {'), css.indexOf('}', css.indexOf('@theme {')));
  // Without this line Tailwind 4's OKLCH palette is still there under every
  // name not declared below, and a class naming one draws a colour nobody chose.
  assert.match(theme, /--color-\*: initial;/, 'Tailwind 4\'s default palette is not cleared');

  const declared = Object.fromEntries(
    [...theme.matchAll(/--color-([a-z]+-\d+):\s*(#[0-9a-f]{3,8});/g)].map((m) => [m[1], m[2]]),
  );
  const expected = {};
  for (const [ramp, shades] of Object.entries(PALETTE)) {
    for (const [shade, hex] of Object.entries(shades)) expected[`${ramp}-${shade}`] = hex;
  }
  for (const [family, ramp] of Object.entries(COLOR_FAMILIES)) {
    for (const [shade, hex] of Object.entries(PALETTE[ramp])) expected[`${family}-${shade}`] = hex;
  }
  assert.deepEqual(declared, expected, 'tailwind.css @theme and src/theme/palette.mjs disagree');
});

test('every built page ships preflight and utilities, with global.css after them', () => {
  assert.ok(existsSync(distDir), 'run `npm run build` first — this test reads dist/');
  const all = pages();
  assert.ok(all.length > 0, 'dist/ holds no HTML pages');

  for (const page of all) {
    const html = readFileSync(join(distDir, page), 'utf8');
    const css = shippedCss(html) + html; // global.css may still be inlined
    const preflight = css.search(PREFLIGHT);
    assert.ok(preflight !== -1, `${page}: no Tailwind preflight in the CSS it ships`);
    // `min-h-screen` is on <body> in BaseLayout, so every page uses it.
    assert.match(css, /\.min-h-screen\{min-height:100vh\}/, `${page}: no Tailwind utilities in the CSS it ships`);
    const global = css.indexOf(GLOBAL_CSS);
    assert.ok(global > preflight, `${page}: global.css must come after Tailwind's preflight`);
  }
});
