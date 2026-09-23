/**
 * Tailwind is wired by the site, not by `@astrojs/tailwind` (WEB-022, #7).
 *
 * The integration is deprecated and its peer range stops at astro 5, so it is
 * what kept the site off Astro 7. It did two things, and the site now does both
 * itself: `postcss.config.mjs` registers `tailwindcss` and `autoprefixer`, and
 * `BaseLayout.astro` imports the three `@tailwind` directives. Dropping either
 * half still builds — it just ships a page with no preflight or no utilities —
 * so the build going green is not the check. These tests read what shipped.
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

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

// Preflight's first rule, as Tailwind 3 emits it minified. Its presence means
// `@tailwind base` reached the page; nothing else in the site writes it.
const PREFLIGHT = '*,:before,:after{box-sizing:border-box;border-width:0;border-style:solid';
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
  assert.doesNotMatch(config, /@astrojs\/tailwind/, 'astro.config.mjs still imports the integration');
});

test('postcss.config.mjs registers tailwindcss, then autoprefixer', async () => {
  const file = join(siteRoot, 'postcss.config.mjs');
  assert.ok(existsSync(file), 'site/postcss.config.mjs must exist');
  const { default: config } = await import(file);
  const names = config.plugins.map((plugin) => plugin.postcssPlugin);
  // Order matters: autoprefixer has to see the CSS Tailwind generated.
  assert.deepEqual(names, ['tailwindcss', 'autoprefixer']);
});

test('every built page ships preflight and utilities, with global.css after them', () => {
  assert.ok(existsSync(distDir), 'run `npm run build` first — this test reads dist/');
  const all = pages();
  assert.ok(all.length > 0, 'dist/ holds no HTML pages');

  for (const page of all) {
    const html = readFileSync(join(distDir, page), 'utf8');
    const css = shippedCss(html) + html; // global.css may still be inlined
    const preflight = css.indexOf(PREFLIGHT);
    assert.ok(preflight !== -1, `${page}: no Tailwind preflight in the CSS it ships`);
    // `min-h-screen` is on <body> in BaseLayout, so every page uses it.
    assert.match(css, /\.min-h-screen\{min-height:100vh\}/, `${page}: no Tailwind utilities in the CSS it ships`);
    const global = css.indexOf(GLOBAL_CSS);
    assert.ok(global > preflight, `${page}: global.css must come after Tailwind's preflight`);
  }
});
