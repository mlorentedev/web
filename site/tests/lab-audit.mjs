/**
 * The Lab's design-system contract (WEB-080, AC1), asserted against `dist/`.
 *
 *   npm run build && npm run test:audit
 *
 * ## Expected to fail until PR6
 *
 * Like `lab-containment.mjs`, this is written now and wired into CI later. It
 * is deliberately **not** named `*.test.mjs`, so `npm test` — and the `test`
 * job in `pr-validation.yml` — does not pick it up while the old page is still
 * on the site. Five pull requests of red CI would teach everyone to ignore the
 * signal, which is the failure lesson-019 is about. It joins the glob in PR6,
 * when `lab.astro` stops composing `IdpPage.astro`.
 *
 * Measured on today's page (2026-08-31), which is what it has to be red
 * against: **10 hued families** outside the token layer (amber, blue, cyan,
 * emerald, gray, purple, rose, slate, teal, yellow), **3 arbitrary type sizes**
 * in 154 places (`text-[10px]`, `text-[11px]`, `text-[12px]`). The section
 * check already passes — 7 sections, each with its eyebrow — so the spec's
 * "1 section" was stale; see `tasks.md`.
 *
 * The spec's complaint about the page is not that it is ugly, it is that it is
 * *unlike the rest of the site*: it reaches past the token layer into
 * Tailwind's raw palette and sets type in arbitrary pixel values instead of the
 * scale. Those are measurable, so this file measures them.
 *
 * Read against `dist/`, not the source, for the reason #244 exists: what the
 * page *is* is what the browser receives. A component can look disciplined and
 * still emit `text-red-500` through a prop.
 *
 * The allowlist is imported, never restated — see `src/theme/tokens.mjs`.
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import tailwindColors from 'tailwindcss/colors.js';

import { HUED_FAMILIES, HUELESS_NEUTRALS } from '../src/theme/tokens.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(here, '..');
const page = join(siteRoot, 'dist/lab/index.html');

/**
 * Tailwind's own palette names — the vocabulary a colour utility can name
 * *instead of* one of our families. Taken from the package rather than typed
 * out, so a Tailwind upgrade that adds a ramp does not quietly create a hole.
 *
 * The renamed ramps are skipped by name and never read: they are deprecation
 * getters that print a warning on access, and five warnings on every run train
 * a reader to ignore the output the tests are trying to give them.
 */
const deprecatedAliases = new Set(['lightBlue', 'warmGray', 'trueGray', 'coolGray', 'blueGray']);
const paletteNames = new Set(
  Object.keys(tailwindColors)
    .filter((name) => !deprecatedAliases.has(name))
    .filter((name) => tailwindColors[name] && typeof tailwindColors[name] === 'object'),
);

const allowed = new Set([...HUED_FAMILIES, ...HUELESS_NEUTRALS]);

/** Every `class` attribute value in the document, variants and all. */
function classNames(html) {
  const names = new Set();
  for (const match of html.matchAll(/\bclass="([^"]*)"/g)) {
    for (const raw of match[1].split(/\s+/)) {
      if (raw) names.add(raw);
    }
  }
  return names;
}

/** `dark:hover:text-red-500` → `text-red-500`. Variants do not change the hue. */
function withoutVariants(className) {
  const parts = className.split(':');
  return parts[parts.length - 1].replace(/^!/, '');
}

test('the built Lab page exists', () => {
  assert.ok(
    existsSync(page),
    `${page} not found — this suite reads the built site, so run \`npm run build\` first`,
  );
});

const html = existsSync(page) ? readFileSync(page, 'utf8') : '';
const classes = classNames(html);

test('the page has classes to audit', () => {
  assert.ok(classes.size > 0, 'no class attributes found in the built page — nothing is being checked');
});

test('every hued colour utility names a token family', () => {
  const offenders = new Map();

  for (const className of classes) {
    const utility = withoutVariants(className);
    // `<prefix>-<colour>` or `<prefix>-<colour>-<shade>`; the colour is the
    // last segment that is not a shade.
    const match = utility.match(/^-?[a-z]+(?:-[a-z]+)*?-([a-z]+)(?:-\d{1,3})?(?:\/\d{1,3})?$/);
    if (!match) continue;

    const family = match[1];
    if (!paletteNames.has(family) || allowed.has(family)) continue;

    if (!offenders.has(family)) offenders.set(family, new Set());
    offenders.get(family).add(className);
  }

  const report = [...offenders.entries()]
    .sort()
    .map(([family, used]) => `  ${family}: ${[...used].sort().join(', ')}`)
    .join('\n');

  assert.deepEqual(
    [...offenders.keys()].sort(),
    [],
    `hued utilities outside the token families (${HUED_FAMILIES.join(', ')}):\n${report}`,
  );
});

test('type is set from the scale, never in arbitrary pixels', () => {
  const arbitrary = [...classes].filter((c) => /^-?text-\[\d+(\.\d+)?px\]$/.test(withoutVariants(c))).sort();

  assert.deepEqual(
    arbitrary,
    [],
    `arbitrary type sizes — use the scale:\n  ${arbitrary.join('\n  ')}`,
  );
});

test('the page is a numbered sequence of sections, each with its eyebrow', () => {
  const sections = [...html.matchAll(/<section\b[^>]*>([\s\S]*?)<\/section>/g)].map((m) => m[1]);

  assert.ok(
    sections.length >= 5,
    `expected at least 5 <section> elements, found ${sections.length}`,
  );

  // `SectionHeading` renders its eyebrow as `[ NN / LABEL ]`. Matching the
  // rendered shape rather than a class name keeps the test honest if the
  // component is restyled, and catches a section that opted out of it.
  const eyebrow = /\[\s*\d{2}\s*\/[^\]]*\]/;
  const without = sections
    .map((body, i) => (eyebrow.test(body) ? null : i + 1))
    .filter((i) => i !== null);

  assert.deepEqual(without, [], `sections with no SectionHeading eyebrow: ${without.join(', ')}`);
});
