/**
 * Each locale has its own 404, complete without JavaScript (#112).
 *
 * The page used to ship English and swap three strings in the browser, so a
 * Spanish 404 declared `lang="en"` and read English with scripts off. nginx
 * picks the page by path, so the routing is held here too: a built Spanish page
 * nothing serves would pass every check on the file itself.
 *
 * Reads the built site: `npm run build && npm test`.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const site = join(dirname(fileURLToPath(import.meta.url)), '..');
const built = (path) => readFileSync(join(site, 'dist', path), 'utf8');

const PAGES = [
  { file: '404.html', lang: 'en', title: 'Not Found', text: "This page doesn't exist.", cta: 'Go home', home: '/' },
  { file: 'es/404/index.html', lang: 'es', title: 'No encontrado', text: 'Esta página no existe.', cta: 'Ir al inicio', home: '/es/' },
];

for (const { file, lang, title, text, cta, home } of PAGES) {
  test(`${file} is ${lang} in its markup`, () => {
    const html = built(file);
    assert.match(html, new RegExp(`<html lang="${lang}"`));
    assert.ok(html.includes(text), 'the message is in the markup');
    assert.match(html, new RegExp(`<title>${title}</title>`));
    const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1];
    assert.equal(description?.replaceAll('&#39;', "'"), text);
    assert.match(html, new RegExp(`href="${home}"[^>]*>\\s*${cta}\\s*<`));
  });

  test(`${file} does not rewrite itself in the browser`, () => {
    assert.ok(!built(file).includes('not-found-text'));
  });

  test(`${file} stays out of the index and has no language switcher`, () => {
    const html = built(file);
    assert.match(html, /<meta name="robots" content="noindex, nofollow"/);
    assert.ok(!/hreflang=/.test(html));
    assert.doesNotMatch(html, /<a [^>]*href="[^"]*404/, 'no link to a 404 route');
  });
}

test('the sitemap lists neither 404 page', () => {
  assert.doesNotMatch(built('sitemap-0.xml'), /\/404/);
});

test('nginx answers a missing /es/ path with the Spanish page', () => {
  const conf = readFileSync(join(site, 'nginx.conf'), 'utf8');
  const es = conf.match(/location \^~ \/es\/ \{[^}]*\}/)?.[0] ?? '';
  assert.match(es, /try_files \$uri \$uri\/index\.html =404;/);
  assert.match(es, /error_page 404 \/es\/404\/index\.html;/);
  assert.match(conf, /location = \/es\/404\/index\.html \{\s*internal;\s*\}/);
});
