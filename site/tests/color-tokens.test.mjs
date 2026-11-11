/**
 * Call sites name the palette's roles, never the Tailwind ramp behind them
 * (WEB-100, WEB-076).
 *
 * `src/theme/tokens.mjs` maps each role (`accent`, `ink`, `panel`, `ok`,
 * `warn`, `danger`, `observe`) to the ramp it aliases, and
 * `src/styles/tailwind.css` declares both names with the same hex. So
 * `text-cyan-700` and `text-accent-700` render identically, and only a check
 * stops the raw name from creeping back: a call site that names `cyan` picks a
 * shade by hand, and a palette change then misses it.
 *
 * Two checks. The source scan names the file and line to fix. The audit of
 * every built page, through the same helpers `lab-audit.test.mjs` runs on /lab,
 * also catches a class that reaches the HTML another way (a data file, a
 * plugin). `src/styles/` and `src/theme/` are where the ramps are defined, and
 * are the only places allowed to name them. `src/content/` is prose: a note may
 * quote `text-gray-700` in a code sample, and a class it does render is caught
 * by the built-page audit below.
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { COLOR_FAMILIES, HUED_FAMILIES } from '../src/theme/tokens.mjs';
import { classNames, colourEscapes, offTokenFamilies } from './lib/audit.mjs';

const siteRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(siteRoot, 'src');
const SKIPPED = ['styles', 'theme', 'content'].map((d) => join(srcDir, d));
const SOURCE = /\.(astro|ts|tsx|mjs|js)$/;

const RAMPS = Object.values(COLOR_FAMILIES);
// A utility naming a raw ramp shade: `text-cyan-700`, `hover:bg-gray-100`,
// `prose-a:text-cyan-700`, `ring-emerald-200/50`.
const RAW = new RegExp(`(?<![\\w-])[a-z]+(?:-[a-z]+)*-(${RAMPS.join('|')})-\\d{2,3}\\b`, 'g');

function sources(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return SKIPPED.includes(path) ? [] : sources(path);
    return SOURCE.test(entry.name) ? [path] : [];
  });
}

function rawUtilities(text) {
  return [...text.matchAll(RAW)].map((m) => m[0]);
}

test('the pattern catches the forms a call site writes', () => {
  assert.deepEqual(
    rawUtilities('class="text-cyan-700 hover:bg-gray-100 prose-a:text-cyan-800 ring-emerald-200/50"'),
    ['text-cyan-700', 'bg-gray-100', 'text-cyan-800', 'ring-emerald-200'],
  );
  assert.deepEqual(rawUtilities('class="text-accent-700 bg-ink-100 text-white"'), []);
});

test('no call site under src/ names a raw ramp instead of its role', () => {
  const found = sources(srcDir).flatMap((file) =>
    readFileSync(file, 'utf8')
      .split('\n')
      .flatMap((line, i) => rawUtilities(line).map((u) => `${relative(siteRoot, file)}:${i + 1} ${u}`)),
  );
  const roles = Object.entries(COLOR_FAMILIES).map(([role, ramp]) => `${ramp} → ${role}`).join(', ');
  assert.deepEqual(found, [], `use the role names (${roles}):\n${found.join('\n')}`);
});

const distDir = join(siteRoot, 'dist');
const builtPages = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return builtPages(path);
    return entry.name.endsWith('.html') ? [path] : [];
  });

test('every built page uses only the token families for colour', { skip: !existsSync(distDir) }, () => {
  const pages = builtPages(distDir);
  assert.ok(pages.length > 0, 'dist/ holds no pages, so nothing is being checked');
  const report = pages.flatMap((page) => {
    const classes = classNames(readFileSync(page, 'utf8'));
    const off = [...offTokenFamilies(classes).entries()].map(([family, used]) => `${family}: ${[...used].sort().join(', ')}`);
    const escapes = colourEscapes(classes);
    return [...off, ...escapes].map((finding) => `${relative(distDir, page)} ${finding}`);
  });
  assert.deepEqual(report, [], `colour outside the token families (${HUED_FAMILIES.join(', ')}):\n${report.join('\n')}`);
});
