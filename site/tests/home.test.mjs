/**
 * The home as a cover letter (WEB-140).
 *
 * `/` and `/es/` were full copies of each other (#142), so every section added
 * to one had to be added to the other by hand. Both now render one `HomePage`
 * with their `lang`, the way `/contact/` renders `ContactPage`: a page file that
 * grows anything besides that one element has started to drift again.
 *
 * The built pages are checked for exactly one `<h1>`: the blocks this spec
 * moves onto the home (the contact markdown opens with an H1) must not add one.
 * Each count is preceded by a guard that the page rendered (lesson-019).
 */

import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(here, '..');
const distDir = join(siteRoot, 'dist');

const homes = [
  { lang: 'en', page: 'src/pages/index.astro', importPath: '../components/HomePage.astro', built: 'index.html' },
  { lang: 'es', page: 'src/pages/es/index.astro', importPath: '../../components/HomePage.astro', built: 'es/index.html' },
];

const squash = (source) => source.replace(/\s+/g, ' ').trim();

function dist(page) {
  const file = join(distDir, page);
  assert.ok(existsSync(file), `dist/${page} must exist — run the build first`);
  return readFileSync(file, 'utf8');
}

for (const { lang, page, importPath, built } of homes) {
  test(`${page} is a stub that renders HomePage in '${lang}'`, () => {
    const stub = `--- import HomePage from '${importPath}'; --- <HomePage lang="${lang}" />`;
    assert.equal(
      squash(readFileSync(join(siteRoot, page), 'utf8')),
      stub,
      `${page} must hold only the HomePage import and <HomePage lang="${lang}" />; sections belong in components/HomePage.astro`,
    );
  });

  test(`the built ${lang} home has exactly one <h1>`, () => {
    const html = dist(built);
    assert.match(html, /id="main-content"/, `dist/${built} rendered no <main>`);
    const h1s = html.match(/<h1[\s>]/g) ?? [];
    assert.equal(h1s.length, 1, `dist/${built} has ${h1s.length} <h1> elements`);
  });
}
