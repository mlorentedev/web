/**
 * The bio: the home's story block (WEB-137; the Timeline it sat above is gone, WEB-140).
 *
 * The bio is hand-edited markdown, so the one thing a test can hold it to is the
 * facts: every figure it states must already be stated in `data/experience.ts`,
 * the site's source for career numbers. A new figure goes there first, where it
 * sits next to the role it belongs to — then the bio may quote it.
 */

import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { figures, sourcedFigures } from './lib/figures.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(here, '..');
const distDir = join(siteRoot, 'dist');
const sourced = sourcedFigures(siteRoot);

/** The markdown body of a bio, without its frontmatter. */
function bioBody(lang) {
  const raw = readFileSync(join(siteRoot, `src/content/pages/${lang}-bio.mdx`), 'utf8');
  return raw.replace(/^---[\s\S]*?---/, '');
}

for (const lang of ['en', 'es']) {
  test(`[${lang}] every figure in the bio is already in experience.ts`, () => {
    const unsourced = figures(bioBody(lang)).filter((f) => !sourced.has(f));
    assert.deepEqual(unsourced, [], `figures with no source in experience.ts: ${unsourced.join(', ')}`);
  });
}

for (const [lang, page] of [['en', 'index.html'], ['es', 'es/index.html']]) {
  test(`[${lang}] the home page renders the bio as its story block`, () => {
    const file = join(distDir, page);
    assert.ok(existsSync(file), `dist/${page} must exist — run the build first`);
    const html = readFileSync(file, 'utf8');
    const section = html.match(/<section[^>]*data-home-block="story"[\s\S]*?<\/section>/)?.[0] ?? '';
    assert.match(section, /\bid="story"/, `dist/${page}: the story block has no #story anchor for the hero to link`);
    const bio = section.match(/<div[^>]*data-bio[^>]*>([\s\S]*?)<\/div>/)?.[1] ?? '';
    // Any wording passes; an empty block does not. The words are Manu's to change.
    const text = bio.replace(/<[^>]*>/g, '').trim();
    assert.ok(text.length > 100, `dist/${page}: the story block has no bio, or it rendered empty`);
  });
}

// ── The story carries the proofs (WEB-140, AC4) ────────────────────────────
//
// The home is prose, so each proof is a sentence with a link to where it can be
// checked. The words stay Manu's; these tests hold the links, the length and
// the one figure that is not settled yet (#238).

const homes = [
  { lang: 'en', page: 'index.html', prefix: '' },
  { lang: 'es', page: 'es/index.html', prefix: '/es' },
];

/** The rendered story block of a built home. */
function story(page) {
  const file = join(distDir, page);
  assert.ok(existsSync(file), `dist/${page} must exist — run the build first`);
  const html = readFileSync(file, 'utf8');
  return html.match(/<section[^>]*data-home-block="story"[\s\S]*?<\/section>/)?.[0] ?? '';
}

/** Where a site-relative href lands in `dist/`. */
function builtRoute(href) {
  const path = href.split('#')[0];
  return join(distDir, path.endsWith('/') ? `${path}index.html` : path);
}

for (const { lang, page, prefix } of homes) {
  test(`[${lang}] the story links the Lab and the AI page in its own locale`, () => {
    const hrefs = [...story(page).matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    assert.ok(hrefs.includes(`${prefix}/lab/`), `the ${lang} story does not link ${prefix}/lab/`);
    assert.ok(hrefs.includes(`${prefix}/ai/`), `the ${lang} story does not link ${prefix}/ai/`);
  });

  test(`[${lang}] every site link in the story resolves to a built page`, () => {
    const internal = [...story(page).matchAll(/href="(\/[^"]*)"/g)].map((m) => m[1]);
    assert.ok(internal.length > 0, `the ${lang} story links nothing on the site`);
    const broken = internal.filter((href) => !existsSync(builtRoute(href)));
    assert.deepEqual(broken, [], `links with no built page: ${broken.join(', ')}`);
  });

  test(`[${lang}] the sentence that links the agents states no figure (#238)`, () => {
    const paragraph = story(page).match(/<p>(?:(?!<\/p>)[\s\S])*?href="[^"]*\/ai\/"[\s\S]*?<\/p>/)?.[0] ?? '';
    assert.ok(paragraph, `the ${lang} story has no paragraph linking /ai/`);
    const linkText = paragraph.match(/href="[^"]*\/ai\/"[^>]*>([^<]+)</)?.[1] ?? '';
    // An empty link text would match the paragraph's first sentence and check the wrong one.
    assert.ok(linkText, `the ${lang} /ai/ link has no plain text to find its sentence by`);
    const sentence = paragraph.replace(/<[^>]*>/g, '').split(/(?<=[.!?])\s+/).find((s) => s.includes(linkText)) ?? '';
    assert.ok(sentence, `no sentence around the /ai/ link "${linkText}"`);
    assert.doesNotMatch(sentence, /\d/, `the agents sentence states a figure: "${sentence}"`);
  });

  test(`[${lang}] the story is 300 to 450 words`, () => {
    const words = bioBody(lang)
      .replace(/\]\([^)]*\)/g, ']')
      .replace(/[[\]*_#>]/g, ' ')
      .split(/\s+/)
      .filter(Boolean).length;
    assert.ok(words >= 300 && words <= 450, `the ${lang} story is ${words} words`);
  });
}

// ── The one cross-locale link (WEB-162) ────────────────────────────────────
//
// `/projects` was never localized, so the Spanish story links the English page.
// That is accepted (WEB-140), and this pins the acceptance. Two checks, and the
// second does not read the allow-list, so emptying the list cannot switch it off:
//
//   - every site link in the Spanish story outside `/es/` is in `crossLocale`,
//     and every entry there is still linked, so the list cannot go stale;
//   - no link leaves `/es/` for a page that has a Spanish twin. The day
//     `/es/projects/` is built, this fails until the story links it.

const crossLocale = ['/projects/'];

/** Site links in the Spanish story that leave `/es/`, without repeats. */
function linksOutsideEs() {
  const internal = [...story('es/index.html').matchAll(/href="(\/[^"]*)"/g)].map((m) => m[1]);
  assert.ok(internal.length > 0, 'the es story links nothing on the site');
  return [...new Set(internal.filter((href) => !href.startsWith('/es/')))];
}

test('[es] the story leaves /es/ only for /projects/, which has no Spanish page yet', () => {
  const outside = linksOutsideEs();
  const unlisted = outside.filter((href) => !crossLocale.includes(href));
  assert.deepEqual(unlisted, [], `es story links outside /es/ that are not accepted: ${unlisted.join(', ')}`);
  const stale = crossLocale.filter((href) => !outside.includes(href));
  assert.deepEqual(stale, [], `crossLocale lists links the es story no longer has: ${stale.join(', ')}`);
});

test('[es] the story never links an English page that has a Spanish twin', () => {
  const twinned = linksOutsideEs().filter((href) => existsSync(builtRoute(`/es${href}`)));
  assert.deepEqual(
    twinned,
    [],
    `Spanish pages now exist for ${twinned.join(', ')}: link them from the Spanish story, drop them from crossLocale, and cover each pair in the SEO alternates test`,
  );
});
