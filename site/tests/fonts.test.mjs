/**
 * The faces stay subset, and still cover what the site shows (#138, WEB-197).
 *
 * Fonts were 97% of the critical path. A subset only pays if a new character
 * does not silently fall back to another family, so the built pages are read
 * for every character outside the ranges. Box drawing is in the mono face only,
 * so it may appear only in code; the cross mark is in no face here and has
 * always come from the next family in the stack.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { MONO_RANGES, RANGES } from '../scripts/subset-fonts.mjs';

const site = fileURLToPath(new URL('..', import.meta.url));
const FALLBACK = new Set([...'❌']);
// The full faces are 66 KB (Roboto, one weight), 187 KB (JetBrains Mono) and
// 659 KB (Archivo); a file under this cap is a subset. The largest, JetBrains
// Mono over three weights with box drawing, is 34 KB.
const MAX_BYTES = 36_000;

const pages = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return pages(path);
    return entry.name.endsWith('.html') ? [path] : [];
  });

const visibleText = (html) =>
  html
    .replace(/<(script|style|svg)\b[\s\S]*?<\/\1>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x([\da-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number(decimal)));

test('every committed face is a subset', () => {
  for (const face of readdirSync(join(site, 'public/fonts'))) {
    assert.ok(statSync(join(site, 'public/fonts', face)).size < MAX_BYTES, face);
  }
});

test('the built pages need no character outside the subset', () => {
  const covered = (char) => {
    const code = char.codePointAt(0);
    return code < 0x20 || MONO_RANGES.some(([from, to]) => code >= from && code <= to);
  };
  const missing = new Set();
  for (const page of pages(join(site, 'dist'))) {
    for (const char of visibleText(readFileSync(page, 'utf8'))) {
      if (!covered(char) && !FALLBACK.has(char)) missing.add(char);
    }
  }
  assert.deepEqual([...missing], []);
});

test('box drawing appears only in code, the one place set in the face that has it', () => {
  const box = /[\u2500-\u257f]/;
  const stray = new Set();
  for (const page of pages(join(site, 'dist'))) {
    const outsideCode = readFileSync(page, 'utf8').replace(/<(pre|code)\b[\s\S]*?<\/\1>/g, '');
    for (const char of visibleText(outsideCode)) if (box.test(char)) stray.add(char);
  }
  assert.deepEqual([...stray], []);
  assert.ok(!RANGES.some(([from]) => from >= 0x2500 && from <= 0x257f), 'box drawing belongs to the mono subset only');
});
