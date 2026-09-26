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

const here = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(here, '..');
const distDir = join(siteRoot, 'dist');
const experienceSrc = readFileSync(join(siteRoot, 'src/data/experience.ts'), 'utf8');

/** The markdown body of a bio, without its frontmatter. */
function bioBody(lang) {
  const raw = readFileSync(join(siteRoot, `src/content/pages/${lang}-bio.mdx`), 'utf8');
  return raw.replace(/^---[\s\S]*?---/, '');
}

/** Figures as written: `2015`, `120`, `20–30`. A range counts as one figure. */
function figures(text) {
  return text.match(/\d+(?:[–-]\d+)?/g) ?? [];
}

for (const lang of ['en', 'es']) {
  test(`[${lang}] every figure in the bio is already in experience.ts`, () => {
    const unsourced = figures(bioBody(lang)).filter((f) => !experienceSrc.includes(f));
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
