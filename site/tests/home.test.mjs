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
// The visual sections live on the pages the story links to; the GitHub chart is
// the one picture the home keeps (#499). Each one is named
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

// ── The offer lives on /contact (#499) ─────────────────────────────────────
//
// The home ends on one button to /contact and states no offer, so the two pages
// cannot say different things.

const contacts = { en: 'contact/index.html', es: 'es/contact/index.html' };

const text = (html) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

for (const { lang, built } of homes) {
  test(`[${lang}] the home states no offer and renders no door of its own`, () => {
    const html = dist(built);
    assert.doesNotMatch(html, /\bdata-offer\b|\bdata-door\b/, `dist/${built} repeats the contact page's offer`);
  });
}

// ── Structure (WEB-140, AC2) ───────────────────────────────────────────────

for (const { lang, built } of homes) {
  test(`[${lang}] the home's blocks come in order after the hero: loop, bio, story, skills, activity, notes`, () => {
    const html = dist(built);
    const afterTitle = html.slice(html.indexOf('</h1>'));
    const blocks = [...afterTitle.matchAll(/data-home-block="([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(blocks, ['loop', 'bio', 'story', 'skills', 'activity', 'notes']);
  });

  test(`[${lang}] the story, the skills and the notes are text: no image, svg or card`, () => {
    const html = dist(built);
    for (const name of ['story', 'skills', 'notes']) {
      const section = html.match(new RegExp(`<section[^>]*data-home-block="${name}"[\\s\\S]*?</section>`))?.[0] ?? '';
      assert.ok(section, `dist/${built} has no ${name} block`);
      assert.doesNotMatch(section, /<img\b|<svg\b|<picture\b|data-card\b|\bcard\b/, `dist/${built}: the ${name} block is not plain text`);
    }
  });
}

// ── Honesty (WEB-140, AC5) ─────────────────────────────────────────────────
//
// Availability is said once, by the busy line (`site.nextStart`), and only while
// a project is running. Nothing else on the home or the contact page claims it.

for (const { lang, built } of homes) {
  for (const page of [built, contacts[lang]]) {
    test(`[${lang}] honesty: ${page} claims no availability but the busy line`, () => {
      const main = dist(page).match(/<main[\s\S]*<\/main>/)?.[0] ?? '';
      const withoutBusy = main.replace(/<p[^>]*data-busy[\s\S]*?<\/p>/g, '');
      const words = text(withoutBusy);
      assert.ok(words.length > 100, `dist/${page}: <main> rendered almost nothing`);
      const claims = words.match(/open to (?:work|opportunities)|available (?:now|for hire|immediately)|currently available|accepting (?:new )?(?:clients|projects)|disponible|disponibilidad|abierto a (?:nuevas )?(?:oportunidades|proyectos)|aceptando (?:nuevos )?(?:clientes|proyectos)/gi) ?? [];
      assert.deepEqual(claims, [], `dist/${page} says: ${claims.join(', ')}`);
    });
  }
}

// The hero carries one way in since #499 (2026-11-03): the button to /contact,
// so nobody scrolls to find it. Anything else in it is a second call to action.
for (const { lang, built } of homes) {
  test(`[${lang}] the hero is a title, a subtitle and one button to the contact page`, () => {
    const hero = dist(built).match(/<main[\s\S]*?<h1[\s\S]*?(?=<section)/)?.[0] ?? '';
    assert.ok(hero, `dist/${built}: no hero before the first section`);
    assert.match(hero, /data-hero-subtitle/, `dist/${built}: the hero has no subtitle`);
    const links = hero.slice(hero.indexOf('<h1')).match(/<a\s[^>]*>/g) ?? [];
    assert.equal(links.length, 1, `dist/${built}: the hero carries ${links.length} links, expected the contact button alone`);
    assert.match(links[0], /data-home-door/, `dist/${built}: the hero's link is not the contact button`);
    assert.doesNotMatch(hero, /<button\b/, `dist/${built}: the hero carries a button element`);
  });
}

// ── The timeline names the employer, and the current role has no end (#499) ──

const present = { en: 'present', es: 'actualidad' };

for (const { lang, built } of homes) {
  test(`[${lang}] the timeline names each employer and leaves the current role open`, () => {
    const html = dist(built);
    for (const marker of ['data-timeline']) {
      const block = html.match(new RegExp(`<ol[^>]*${marker}[\\s\\S]*?</ol>`))?.[0] ?? '';
      assert.ok(block, `dist/${built}: no ${marker}`);
      assert.match(block, /Teledyne Technologies/, `dist/${built} ${marker}: no current employer`);
      assert.match(block, /\be2v\b/, `dist/${built} ${marker}: no employer before 2019`);
      assert.match(block, new RegExp(`2024–${present[lang]}`), `dist/${built} ${marker}: the current role is not open`);
      const future = (block.match(/\b20\d\d\b/g) ?? []).filter((y) => Number(y) > new Date().getFullYear());
      assert.deepEqual(future, [], `dist/${built} ${marker}: years in the future`);
    }
  });
}

test('the structured data names the current employer and the hero title', () => {
  const ld = dist('index.html').match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] ?? '';
  const person = JSON.parse(ld)['@graph'].find((n) => n['@type'] === 'Person');
  assert.equal(person.jobTitle, 'SRE & AI Platform Engineer');
  assert.equal(person.worksFor?.name, 'Teledyne Technologies');
});

for (const { lang, built } of homes) {
  test(`[${lang}] the timeline is one line, newest first, with every role and every study`, () => {
    const block = dist(built).match(/<ol[^>]*data-timeline[\s\S]*?<\/ol>/)?.[0] ?? '';
    const items = [...block.matchAll(/<li[^>]*data-timeline-item[^>]*data-kind="(work|study)"[\s\S]*?<\/li>/g)];
    const kinds = items.map((m) => m[1]);
    assert.equal(kinds.filter((k) => k === 'work').length, 5, `dist/${built}: expected 5 roles`);
    assert.equal(kinds.filter((k) => k === 'study').length, 3, `dist/${built}: expected 3 studies`);
    const starts = items.map((m) => Number(m[0].match(/(\d{4})–/)?.[1]));
    assert.deepEqual(starts, [...starts].sort((a, b) => b - a), `dist/${built}: entries are not newest first`);
    assert.doesNotMatch(dist(built), /<table[^>]*data-timeline/, `dist/${built} still renders the timeline table`);
  });

  test(`[${lang}] HEAD marks the ongoing role, and only it`, () => {
    const block = dist(built).match(/<ol[^>]*data-timeline[\s\S]*?<\/ol>/)?.[0] ?? '';
    const items = [...block.matchAll(/<li[^>]*data-timeline-item[\s\S]*?<\/li>/g)].map((m) => m[0]);
    const marked = items.filter((item) => /\bdata-head\b/.test(item));
    assert.equal(marked.length, 1, `dist/${built}: expected one HEAD, found ${marked.length}`);
    const current = items.filter((item) => /<li[^>]*\bdata-current\b/.test(item));
    assert.equal(current.length, 1, `dist/${built}: expected one ongoing role, found ${current.length}`);
    assert.equal(marked[0], current[0], `dist/${built}: HEAD is not on the ongoing role`);
    assert.match(marked[0], /class="sr-only"/, `dist/${built}: HEAD has no screen-reader equivalent`);
  });
}
