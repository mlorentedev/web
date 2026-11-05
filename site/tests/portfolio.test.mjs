/**
 * /projects shows five projects, few and good (#587).
 *
 * Decided 2026-11-04: Hive first, then KubeLab, the dotf harness, ts-bridge and
 * pdf-modifier. Pollex, yt-metrics-cli, kasa-provisioner and garsync stay on
 * GitHub and off the site. Each project carries the year of its first commit,
 * and only what installs carries an install line.
 *
 * Reads the built site and `src/data/portfolio.ts`: `npm run build && npm test`.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const siteRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(join(siteRoot, 'src/data/portfolio.ts'), 'utf8');
const list = source.slice(source.indexOf('export const projects'));

const expected = ['Hive', 'KubeLab', 'dotf', 'ts-bridge', 'pdf-modifier'];
const installs = ['Hive', 'pdf-modifier'];

/** Each project entry in the array, split on the `en:` that opens it. */
const entries = list.split(/\n  \{\n    en: \{/).slice(1).map((entry) => ({
  title: entry.match(/title: '([^']+)'/)?.[1],
  since: Number(entry.match(/\bsince: (\d{4})/)?.[1]),
  install: entry.match(/\binstall: '([^']+)'/)?.[1],
  featured: /\bfeatured: true/.test(entry),
}));

test('the data lists exactly the five projects, in order', () => {
  assert.deepEqual(entries.map((e) => e.title), expected);
});

test('Hive is the only featured project', () => {
  assert.deepEqual(entries.filter((e) => e.featured).map((e) => e.title), ['Hive']);
});

test('every project starts in a year that has happened', () => {
  for (const { title, since } of entries) {
    assert.ok(since >= 2015 && since <= new Date().getFullYear(), `${title}: since=${since}`);
  }
});

test('only the projects that install carry an install line', () => {
  assert.deepEqual(entries.filter((e) => e.install).map((e) => e.title), installs);
});

for (const page of ['projects', 'es/projects']) {
  test(`/${page}/ renders the five cards in order`, () => {
    const file = join(siteRoot, 'dist', page, 'index.html');
    assert.ok(existsSync(file), `${file} not found — run \`npm run build\` first`);
    const html = readFileSync(file, 'utf8');
    const titles = [...html.matchAll(/data-project-title[^>]*>([\s\S]*?)<\/h[23]>/g)].map(([, inner]) =>
      inner.replace(/<[^>]*>/g, '').trim(),
    );
    assert.deepEqual(titles, expected);
  });
}
