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

// ── The home is prose (amended 2026-09-25) ─────────────────────────────────
//
// The visual sections live on the pages the story links to. Each one is named
// by the marker it rendered, so a section that comes back under any heading is
// still caught. Counts of nodes or services and a hand-written uptime are
// banned copy (brand-package §7, #133/#355).

const retired = [
  { name: 'IdpStrip', marker: /\bdata-idp-strip\b/ },
  { name: 'ProjectsSection', marker: /\bid="projects"/ },
  { name: 'ProofSurface', marker: /\bdata-proof\b/ },
  { name: 'Timeline', marker: /\bdata-experience\b|\bdata-role\b/ },
];

const homePageSrc = readFileSync(join(siteRoot, 'src/components/HomePage.astro'), 'utf8');

test('HomePage imports none of the five retired sections', () => {
  const imported = ['IdpStrip', 'ProjectsSection', 'ProofSurface', 'CommunitySection', 'Timeline']
    .filter((name) => new RegExp(`import ${name}\\b`).test(homePageSrc));
  assert.deepEqual(imported, [], `HomePage still imports: ${imported.join(', ')}`);
});

for (const { lang, built } of homes) {
  test(`[${lang}] the built home renders none of the retired sections`, () => {
    const html = dist(built);
    assert.match(html, /data-home-block="story"/, `dist/${built} has no story block to stand in for them`);
    const found = retired.filter(({ marker }) => marker.test(html)).map(({ name }) => name);
    assert.deepEqual(found, [], `dist/${built} still renders: ${found.join(', ')}`);
  });

  test(`[${lang}] the built home states no node or service count and no uptime`, () => {
    const main = dist(built).match(/<main[\s\S]*<\/main>/)?.[0] ?? '';
    const text = main.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
    assert.ok(text.length > 500, `dist/${built}: <main> rendered almost nothing`);
    const counts = text.match(/\b\d+\s+(?:active\s+|activos?\s+)?(?:nodes?|services?|nodos?|servicios?)\b|99[.,]9\s*%/gi) ?? [];
    assert.deepEqual(counts, [], `dist/${built} states: ${counts.join(', ')}`);
  });
}
