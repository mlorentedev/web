/**
 * The bio above the Timeline (WEB-137).
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
  test(`[${lang}] the home page renders the bio inside the Timeline section`, () => {
    const file = join(distDir, page);
    assert.ok(existsSync(file), `dist/${page} must exist — run the build first`);
    const html = readFileSync(file, 'utf8');
    const section = html.match(/<section[^>]*data-experience[\s\S]*?<\/section>/)?.[0] ?? '';
    assert.match(section, /data-bio/, `dist/${page}: the Timeline section has no bio`);
    assert.match(section, /Teledyne e2v/, `dist/${page}: the bio rendered empty`);
  });
}
