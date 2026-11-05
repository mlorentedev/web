/**
 * A page built in both locales has one body, in a shared component (WEB-067).
 *
 * The English and Spanish route files of the notes index, a note and a tag page
 * were full copies, and they drifted: the note date was `gray-400` (below AA) in
 * one locale and `gray-500` in the other. Each locale route is now a shell that
 * hands its locale to one component. This holds every pair to that: once the
 * locale code and the import depth are normalised, the two files are the same
 * text, so a difference can only live in the component, where both locales get it.
 *
 *   npm test
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const PAGES = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'pages');
const ES = join(PAGES, 'es');

const files = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return files(path);
    return entry.name.endsWith('.astro') ? [path] : [];
  });

/** The route file with its locale and its depth taken out. */
const normalise = (source, lang) =>
  source
    .replace(/(\.\.\/)+/g, '../')
    .replace(new RegExp(`(["'])${lang}\\1`, 'g'), '$1LANG$1');

test('the Spanish and English files of every page built in both locales differ only in the locale', () => {
  const pairs = files(ES)
    .map((es) => ({ es, en: join(PAGES, relative(ES, es)) }))
    .filter(({ en }) => existsSync(en));
  assert.ok(pairs.length > 0, 'no page is built in both locales: the walk found nothing');
  const drifted = pairs
    .filter(({ es, en }) => normalise(readFileSync(es, 'utf8'), 'es') !== normalise(readFileSync(en, 'utf8'), 'en'))
    .map(({ en }) => relative(PAGES, en));
  assert.deepEqual(drifted, [], 'these locale pairs carry their own markup: move the body into one component that takes `lang`');
});
