/**
 * The home's skills, by layer (#499): terms to scan, then the work that proves them.
 *
 * Every layer links where it can be checked. The words are Manu's to change;
 * these tests hold the shape: the same layers in both locales, one link per
 * layer, links that land somewhere a visitor can open, and no copy the brand
 * package bans.
 *
 *   npm run build && npm test
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { banned } from './lib/banned.mjs';
import { figures, sourcedFigures } from './lib/figures.mjs';

const siteRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(siteRoot, 'dist');
const sourced = sourcedFigures(siteRoot);

const homes = [
  { lang: 'en', built: 'index.html', prefix: '' },
  { lang: 'es', built: 'es/index.html', prefix: '/es' },
];

/** Platform, reliability, AI, cloud and systems design, hardware (#499). */
const ITEMS = 5;

/**
 * Where a proof may live: a public repository of Manu's, or a package index.
 * A link elsewhere is not wrong by itself, but it is a new kind of proof and
 * should be added here on purpose.
 */
const publicOwners = [
  /^https:\/\/github\.com\/mlorentedev\/(kubelab|pollex|hive|pdf-modifier|dotfiles|ts-bridge|vicon-fpga-face-detection|emva1288-sensor-characterization)(\/|$)/,
  /^https:\/\/github\.com\/zuidui\/[\w.-]+\/?$/,
  /^https:\/\/pypi\.org\/project\/[\w.-]+\/?$/,
];

/** Private repositories: a visitor who follows the proof gets a 404. */
const privateRepos = /github\.com\/mlorentedev\/(knowledge|resume|imagesensortool)\b/;

/** Names that carry digits but state no figure. */
const notFigures = new Set(['1288']);

function built(page) {
  const file = join(distDir, page);
  assert.ok(existsSync(file), `dist/${page} must exist — run the build first`);
  return readFileSync(file, 'utf8');
}

function block(html) {
  return html.match(/<section[^>]*data-home-block="skills"[\s\S]*?<\/section>/)?.[0] ?? '';
}

function items(html) {
  return [...block(html).matchAll(/<div[^>]*data-skill[^>]*>([\s\S]*?)<\/div>/g)].map((m) => m[1]);
}

const hrefs = (item) => [...item.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
/** A layer without its `built/` line: the story and its one link. */
const story = (item) => item.replace(/<p[^>]*data-built[\s\S]*?<\/p>/g, '');
const builtLines = (item) => [...item.matchAll(/<p[^>]*data-built[^>]*>([\s\S]*?)<\/p>/g)].map((m) => m[1]);
const text = (html) => html.replace(/<[^>]*>|&#?\w+;/g, ' ').replace(/\s+/g, ' ').trim();

for (const { lang, built: page, prefix } of homes) {
  test(`[${lang}] the skills block lists ${ITEMS} items, each with exactly one link`, () => {
    const list = items(built(page));
    assert.equal(list.length, ITEMS, `dist/${page}: expected ${ITEMS} skills, found ${list.length}`);
    const wrong = list.filter((item) => hrefs(story(item)).length !== 1).map(text);
    assert.deepEqual(wrong, [], `items without exactly one link: ${wrong.join(' | ')}`);
  });

  test(`[${lang}] every site link in the skills block lands on a built page or an anchor on the home`, () => {
    const html = built(page);
    const broken = items(html)
      .flatMap(hrefs)
      .filter((href) => !href.startsWith('http'))
      .filter((href) => {
        if (href.startsWith('#')) return !html.includes(`id="${href.slice(1)}"`);
        const path = href.split('#')[0];
        return !existsSync(join(distDir, path.endsWith('/') ? `${path}index.html` : path));
      });
    assert.deepEqual(broken, [], `links with nowhere to land: ${broken.join(', ')}`);
  });

  test(`[${lang}] site links in the skills block stay in their own locale`, () => {
    const internal = items(built(page)).flatMap(hrefs).filter((href) => href.startsWith('/'));
    assert.ok(internal.length > 0, `the ${lang} skills block links nothing on the site`);
    const foreign = internal.filter((href) => (prefix ? !href.startsWith(`${prefix}/`) : href.startsWith('/es/')));
    assert.deepEqual(foreign, [], `links to the other locale: ${foreign.join(', ')}`);
  });

  test(`[${lang}] every external proof is public: an allowed owner, never a private repository`, () => {
    const external = items(built(page)).flatMap(hrefs).filter((href) => href.startsWith('http'));
    assert.ok(external.length > 0, `the ${lang} skills block links no external proof`);
    const closed = external.filter((href) => privateRepos.test(href));
    assert.deepEqual(closed, [], `proofs in private repositories: ${closed.join(', ')}`);
    const unknown = external.filter((href) => !publicOwners.some((owner) => owner.test(href)));
    assert.deepEqual(unknown, [], `proofs outside the allowed public owners: ${unknown.join(', ')}`);
  });

  test(`[${lang}] the skills block carries no banned term and no unsourced figure`, () => {
    const words = text(block(built(page)));
    assert.ok(words.length > 200, `dist/${page}: the skills block rendered almost nothing`);
    const hits = banned.flatMap((pattern) => words.match(new RegExp(pattern.source, 'gi')) ?? []);
    assert.deepEqual(hits, [], `banned terms in the skills block: ${hits.join(', ')}`);
    const unsourced = figures(words).filter((f) => !notFigures.has(f) && !sourced.has(f));
    assert.deepEqual(unsourced, [], `figures with no source in experience.ts: ${unsourced.join(', ')}`);
  });
}

test('both locales list the same proofs, in the same order', () => {
  const targets = ({ built: page, prefix }) =>
    items(built(page))
      .map(story)
      .flatMap(hrefs)
      .map((href) => (prefix && href.startsWith(`${prefix}/`) ? href.slice(prefix.length) : href));
  const [en, es] = homes.map(targets);
  assert.ok(en.length === ITEMS, `the en list has ${en.length} links`);
  assert.deepEqual(es, en);
});

// ------------------------------------------------------------------ built/ lines (#589)

const { layers } = await import('../src/data/skills.ts');
const { projects } = await import('../src/data/portfolio.ts');

/** The projects the home shows, by layer, as the owner chose them (2026-11-11). */
const BUILT = { 'ai/agents': 'Hive', 'cloud/systems': 'ts-bridge' };

test('the built/ lines are exactly the chosen projects, each one in the portfolio', () => {
  const chosen = Object.fromEntries(layers.filter((l) => l.built).map((l) => [l.key, l.built]));
  assert.deepEqual(chosen, BUILT);
  for (const title of Object.values(BUILT)) {
    assert.ok(projects.some((p) => p.en.title === title && p.github), `${title} is not a portfolio project with a repository`);
  }
});

test('no story names the project its built/ line shows, so nothing is said twice', () => {
  const twice = layers
    .filter((l) => l.built)
    .flatMap((l) => ['en', 'es'].filter((lang) => l[lang].story.join('').includes(l.built)).map((lang) => `${l.key} (${lang})`));
  assert.deepEqual(twice, []);
});

for (const { lang, built: page } of homes) {
  test(`[${lang}] each built/ project appears once in the skills block, linked to its repository`, () => {
    const list = items(built(page));
    for (const [key, title] of Object.entries(BUILT)) {
      const item = list.find((i) => i.includes(`>${key}<`));
      assert.ok(item, `no ${key} layer`);
      const [line] = builtLines(item);
      assert.ok(line, `${key} has no built/ line`);
      const repo = projects.find((p) => p.en.title === title).github;
      assert.deepEqual(hrefs(line), [repo]);
    }
    const words = text(block(built(page)));
    for (const title of Object.values(BUILT)) {
      assert.equal(words.split(title).length - 1, 1, `${title} is named more than once in the skills block`);
    }
  });
}
