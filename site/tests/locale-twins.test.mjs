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

const pairs = files(ES)
  .map((es) => ({ es, en: join(PAGES, relative(ES, es)) }))
  .filter(({ en }) => existsSync(en));

// A shell imports its page component, calls a path helper at most, and renders
// the component. The longest today is 8 lines; a copied body is dozens.
const SHELL_LINES = 12;

test('the Spanish and English files of every page built in both locales differ only in the locale', () => {
  assert.ok(pairs.length > 0, 'no page is built in both locales: the walk found nothing');
  const drifted = pairs
    .filter(({ es, en }) => normalise(readFileSync(es, 'utf8'), 'es') !== normalise(readFileSync(en, 'utf8'), 'en'))
    .map(({ en }) => relative(PAGES, en));
  assert.deepEqual(drifted, [], 'these locale pairs carry their own markup: move the body into one component that takes `lang`');
});

// Two identical copies of one body pass the check above: it catches drift, not
// duplication. This one holds each file of a pair to a shell that renders a
// shared component.
test('each file of a locale pair is a shell that renders one shared page component', () => {
  const bodies = pairs.flatMap(({ es, en }) => [es, en]).flatMap((file) => {
    const source = readFileSync(file, 'utf8');
    const component = /import (\w+) from '(?:\.\.\/)+components\/\1\.astro'/.exec(source)?.[1];
    const lines = source.trimEnd().split('\n').length;
    const ok = component && lines <= SHELL_LINES && new RegExp(`<${component}\\b`).test(source);
    return ok ? [] : [`${relative(PAGES, file)} (${lines} lines${component ? '' : ', no component import'})`];
  });
  assert.deepEqual(bodies, [], `these locale files are not shells: keep the body in the component, the shell under ${SHELL_LINES} lines`);
});
