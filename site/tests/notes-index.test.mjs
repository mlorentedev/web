/**
 * The notes index says what it is on screen (#585).
 *
 * Its H1 was screen-reader only, so a sighted visitor saw a small uppercase
 * "What I think" and a list, and nothing naming the page. The H1 is now
 * visible with the one-line description under it, and each note title is the
 * next heading level down, so the outline has no skipped level.
 *
 *   npm run build && npm test
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const distDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');

const pages = {
  en: { file: 'notes/index.html', title: 'Notes' },
  es: { file: 'es/notes/index.html', title: 'Notas' },
};

for (const [lang, { file, title }] of Object.entries(pages)) {
  const html = readFileSync(join(distDir, file), 'utf8');
  const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));

  test(`${lang}: the notes index has one visible H1 naming the page`, () => {
    const h1s = [...main.matchAll(/<h1([^>]*)>([\s\S]*?)<\/h1>/g)];
    assert.equal(h1s.length, 1, `dist/${file} has ${h1s.length} H1s`);
    const [, attrs, text] = h1s[0];
    assert.doesNotMatch(attrs, /sr-only/, `dist/${file}: the H1 is hidden from sighted visitors`);
    assert.equal(text.trim(), title);
  });

  test(`${lang}: the headings of the notes index skip no level`, () => {
    const levels = [...main.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
    for (let i = 1; i < levels.length; i++) {
      assert.ok(levels[i] <= levels[i - 1] + 1, `dist/${file}: an h${levels[i]} follows an h${levels[i - 1]}`);
    }
  });
}
