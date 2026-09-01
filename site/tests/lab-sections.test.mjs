/**
 * What the rebuilt Lab sections must be true of (WEB-080, AC1 + AC3), asserted
 * against `dist/` on **both** locales.
 *
 *   npm run build && npm test
 *
 * ## Why this is in the glob when `lab-audit.mjs` is not
 *
 * `lab-audit.mjs` judges the whole page and stays red until PR6 deletes
 * `IdpPage.astro`, so it is kept out of CI to avoid teaching everyone to ignore
 * a red build (lesson-019). This file judges only the sections that have
 * actually been rebuilt, section by section, so it goes green the moment its
 * PR lands and every later PR inherits it as a guard. Same criteria, applied at
 * the moment they can honestly be met.
 *
 * Sections opt in by carrying `data-lab-section="<name>"`. `REBUILT` below is
 * the list; PR4 adds `topology` and `flows`, PR5 adds `automations`.
 *
 * ## What was already true before PR3, and is a guard rather than a driver
 *
 * `tasks.md` budgeted "the built page lists exactly `services.length` service
 * rows and `nodes.length` node rows" as PR3's failing test. Measured on
 * 2026-09-01, the old page **already emitted 14 `data-service-row` and 9
 * `data-node-row`** — the counts were green before a line was written. The same
 * mistake the spec made about section count in PR1, and handled the same way:
 * kept, because it must not regress in the rebuild, but recorded as a guard so
 * nobody reads a passing count as evidence PR3 did something.
 *
 * The assertions that were genuinely red on the old page are the provenance
 * (nothing printed `generated_at` or `source_commit` anywhere), the
 * machine-readable access boundary, the token-layer audit, and zero JS.
 *
 * Everything expected is derived from `platform.json`, never restated here: a
 * test carrying its own copy of the data is two sources that agree until they
 * do not.
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { HUED_FAMILIES } from '../src/theme/tokens.mjs';

import {
  arbitraryTypeSizes,
  classNames,
  colourEscapes,
  labSection,
  offTokenFamilies,
} from './lib/audit.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(here, '..');
const require = createRequire(import.meta.url);
const platform = require('../src/data/platform.json');

/** Sections rebuilt so far. PR4 adds topology and flows; PR5 automations. */
const REBUILT = ['services', 'infra'];

const pages = [
  { locale: 'en', path: join(siteRoot, 'dist/lab/index.html') },
  { locale: 'es', path: join(siteRoot, 'dist/es/lab/index.html') },
];

/**
 * Astro escapes text into the markup, so a description containing `&` or `'`
 * is not findable as written. Only the entities Astro actually emits.
 */
function decodeEntities(html) {
  return html
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

const built = pages.map((p) => ({
  ...p,
  html: existsSync(p.path) ? readFileSync(p.path, 'utf8') : null,
}));

test('both Lab pages are built', () => {
  const missing = built.filter((p) => p.html === null).map((p) => p.path);
  assert.deepEqual(
    missing,
    [],
    `not found — this suite reads the built site, so run \`npm run build\` first:\n  ${missing.join('\n  ')}`,
  );
});

for (const { locale, html } of built) {
  if (html === null) continue;

  // ---------------------------------------------------------------- provenance

  test(`[${locale}] the page prints where the figures came from`, () => {
    const marker = html.match(/<[^>]*\bdata-lab-provenance\b[^>]*>/);
    assert.ok(
      marker,
      "no element carries `data-lab-provenance` — the Lab's claim is 'measured, not typed', " +
        'and the honest version of that claim says how old the measurement is',
    );

    const attr = (name) => (marker[0].match(new RegExp(`\\b${name}="([^"]*)"`)) || [])[1];

    assert.equal(attr('data-generated-at'), platform.generated_at, 'data-generated-at disagrees with the manifest');
    assert.equal(attr('data-source-commit'), platform.source_commit, 'data-source-commit disagrees with the manifest');
  });

  test(`[${locale}] the provenance is visible to a reader, not only to a machine`, () => {
    // An attribute nobody renders is metadata, not a disclosure. The short SHA
    // and the date must appear as text.
    const text = decodeEntities(html.replace(/<[^>]*>/g, ' '));
    const shortSha = platform.source_commit.slice(0, 7);
    const date = platform.generated_at.slice(0, 10);

    assert.ok(text.includes(shortSha), `the source commit (${shortSha}) is not rendered as text`);
    assert.ok(text.includes(date), `the generation date (${date}) is not rendered as text`);
  });

  // ------------------------------------------------------------------ presence

  test(`[${locale}] every rebuilt section is on the page, with its eyebrow`, () => {
    for (const name of REBUILT) {
      const body = labSection(html, name);
      assert.ok(body, `no <section data-lab-section="${name}"> on the built page`);
      assert.match(
        body,
        /\[\s*\d{2}\s*\/[^\]]*\]/,
        `the ${name} section has no SectionHeading eyebrow — it is not built on the shared component`,
      );
    }
  });

  // ---------------------------------------------------------------- data rows

  test(`[${locale}] Services lists exactly the manifest's services`, () => {
    const body = labSection(html, 'services');
    assert.ok(body, 'no services section to count rows in');

    const rows = [...body.matchAll(/\bdata-service-row\b/g)];
    assert.equal(
      rows.length,
      platform.services.length,
      `${rows.length} service rows against ${platform.services.length} in platform.json — ` +
        'the section is hand-written somewhere it should be rendering from data',
    );
  });

  test(`[${locale}] Infra lists exactly the manifest's nodes`, () => {
    const body = labSection(html, 'infra');
    assert.ok(body, 'no infra section to count rows in');

    const rows = [...body.matchAll(/\bdata-node-row\b/g)];
    // Nine, not `cluster.activeNodes`. That field is 8 because one node is on
    // standby, and a page that renders `activeNodes` rows silently hides it.
    assert.equal(
      rows.length,
      platform.nodes.length,
      `${rows.length} node rows against ${platform.nodes.length} in platform.json ` +
        `(cluster.activeNodes is ${platform.cluster.activeNodes} and counts something else — healthy nodes)`,
    );
  });

  // --------------------------------------------------------- access boundaries

  test(`[${locale}] every service states its access boundary`, () => {
    const body = labSection(html, 'services');
    assert.ok(body, 'no services section');

    const declared = [...body.matchAll(/\bdata-access="([^"]*)"/g)].map((m) => m[1]);
    assert.equal(
      declared.length,
      platform.services.length,
      'a service row with no `data-access` — What §2 requires the boundary explicit per service',
    );

    const counts = declared.reduce((acc, v) => acc.set(v, (acc.get(v) || 0) + 1), new Map());
    const expectedPublic = platform.services.filter((s) => s.isPublic).length;

    assert.deepEqual(
      [...counts.keys()].sort(),
      ['mesh', 'public'],
      'access is a closed vocabulary: `public` (reachable from the internet) or `mesh` (behind the VPN)',
    );
    assert.equal(counts.get('public'), expectedPublic, 'the public count disagrees with `isPublic` in the manifest');
    assert.equal(counts.get('mesh'), platform.services.length - expectedPublic);
  });

  test(`[${locale}] a service is marked public exactly when it has a URL to reach`, () => {
    // These two agree in the manifest today (3 and 3, the same three). Asserting
    // it here means a service that gains `isPublic` without an address — or an
    // address without the flag — fails on the page rather than shipping a
    // boundary claim nobody can act on.
    const mismatched = platform.services
      .filter((s) => Boolean(s.isPublic) !== Boolean(s.url))
      .map((s) => s.slug);

    assert.deepEqual(mismatched, [], 'services whose `isPublic` and `url` disagree');
  });

  // ----------------------------------------------------------------- bilingual

  test(`[${locale}] the rebuilt sections render this locale's copy of the data`, () => {
    const body = REBUILT.map((n) => labSection(html, n) || '').join(' ');
    const text = decodeEntities(body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' '));

    const field = locale === 'es' ? 'descriptionEs' : 'description';
    const missing = platform.services
      .filter((s) => !text.includes(decodeEntities(s[field])))
      .map((s) => `${s.slug}.${field}`);

    assert.deepEqual(missing, [], `service copy missing from the ${locale} page`);

    const roleField = locale === 'es' ? 'roleEs' : 'role';
    const missingNodes = platform.nodes
      .filter((n) => !text.includes(decodeEntities(n[roleField])))
      .map((n) => `${n.id}.${roleField}`);

    assert.deepEqual(missingNodes, [], `node copy missing from the ${locale} page`);
  });

  // --------------------------------------------------------- the token layer

  test(`[${locale}] the rebuilt sections stay inside the token layer`, () => {
    for (const name of REBUILT) {
      const body = labSection(html, name);
      assert.ok(body, `no ${name} section to audit`);

      const classes = classNames(body);
      assert.ok(classes.size > 0, `the ${name} section has no class attributes — nothing is being checked`);

      const offenders = offTokenFamilies(classes);
      const report = [...offenders.entries()]
        .sort()
        .map(([family, used]) => `    ${family}: ${[...used].sort().join(', ')}`)
        .join('\n');

      assert.deepEqual(
        [...offenders.keys()].sort(),
        [],
        `${name}: hued utilities outside the token families (${HUED_FAMILIES.join(', ')}):\n${report}`,
      );

      assert.deepEqual(
        colourEscapes(classes),
        [],
        `${name}: colours written past the token layer as raw values`,
      );

      assert.deepEqual(
        arbitraryTypeSizes(classes),
        [],
        `${name}: type set in arbitrary pixels instead of from the scale`,
      );
    }
  });

  // ------------------------------------------------------------------ zero JS

  test(`[${locale}] the rebuilt sections ship no client JavaScript`, () => {
    // proposal.md, Out of scope: "This spec delivers layer 0: static at build,
    // zero JS." The old section had four filter tabs over 14 rows, one of which
    // (Staging) matched nothing at all — `env` only ever holds `common` or
    // `prod`. Interactivity that filters a table this size is the marketing
    // register the spec strips, and it is also a hard requirement, not taste.
    for (const name of REBUILT) {
      const body = labSection(html, name);
      assert.ok(body, `no ${name} section`);

      assert.deepEqual(
        [...body.matchAll(/<script\b/g)].map(() => '<script>'),
        [],
        `${name}: a <script> inside a section the spec requires to be static`,
      );

      const hooks = [...body.matchAll(/\bdata-(?:[a-z-]*-)?(?:filter|tabs?)\b/g)].map((m) => m[0]);
      assert.deepEqual(hooks, [], `${name}: client-side filter or tab hooks left in a static section`);
    }
  });
}
