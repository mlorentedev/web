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

/** Sections rebuilt so far. PR5 adds automations. */
const REBUILT = ['services', 'infra', 'topology', 'flows'];

/** The two that embed a generated diagram, and the IR each comes from. */
const DIAGRAMS = ['topology', 'flows'];

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

  /**
   * Access is asserted **per service**, keyed by slug, not as a tally.
   *
   * Counting `data-access` values and comparing the totals to the manifest was
   * the first version, and it cannot see the failure that matters: swap the
   * boundary of two services and the totals are unchanged. On a section whose
   * entire purpose is to say who can reach what, a test that passes while the
   * page names the wrong service public is worse than no test. Raised in review
   * on this PR, and correct.
   */
  test(`[${locale}] every service states its own access boundary, not a matching total`, () => {
    const body = labSection(html, 'services');
    assert.ok(body, 'no services section');

    const rows = [...body.matchAll(/<[^>]*\bdata-service-slug="([^"]*)"[^>]*>/g)].map((m) => ({
      slug: m[1],
      access: [...m[0].matchAll(/\bdata-access="([^"]*)"/g)].map((a) => a[1]),
    }));

    assert.deepEqual(
      rows.map((r) => r.slug).sort(),
      platform.services.map((s) => s.slug).sort(),
      'the rows on the page are not one-to-one with the manifest, by slug',
    );

    const wrong = rows
      .map(({ slug, access }) => {
        const service = platform.services.find((s) => s.slug === slug);
        const expected = service.isPublic ? 'public' : 'mesh';
        if (access.length !== 1) return `${slug}: ${access.length} data-access attributes, expected exactly 1`;
        if (access[0] !== expected) return `${slug}: says "${access[0]}", manifest says "${expected}"`;
        return null;
      })
      .filter(Boolean);

    assert.deepEqual(wrong, [], 'a service names an access boundary its manifest entry does not support');
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

  // ------------------------------------------------------------- diagrams

  test(`[${locale}] each diagram section embeds its generated SVG inline`, () => {
    for (const name of DIAGRAMS) {
      const body = labSection(html, name);
      assert.ok(body, `no <section data-lab-section="${name}">`);

      const svgs = [...body.matchAll(/<svg\b/g)];
      assert.equal(
        svgs.length,
        1,
        `${name}: expected exactly 1 inline <svg>, found ${svgs.length}`,
      );

      // Inline, not <img>. PR0 chose it and #244 is the reason: the text in an
      // external .svg is invisible to search and to a reader who cannot see it.
      assert.ok(
        !/<img\b[^>]*\.svg/.test(body),
        `${name}: the diagram is referenced as an <img>, not embedded`,
      );
    }
  });

  test(`[${locale}] the embedded SVG is the committed one, byte for byte`, () => {
    // The build verifies the IR against the SVG's `ir-sha256` stamp. This
    // verifies the third link in that chain — that the page ships what the
    // pipeline produced, rather than a copy that drifted.
    for (const name of DIAGRAMS) {
      const committed = readFileSync(join(siteRoot, `src/diagrams/generated/${name}.svg`), 'utf8').trim();
      const body = labSection(html, name);
      // The stamp is an HTML comment appended by `diagrams.mjs generate`, and
      // it reaches the page because nothing strips comments today. If that ever
      // changes this fails loudly, which is the point — a provenance marker
      // nobody notices disappearing is not one.
      const stamp = committed.match(/<!--\s*ir-sha256:\s*([0-9a-f]{64})\s*-->/);

      assert.ok(stamp, `${name}.svg carries no ir-sha256 stamp`);
      assert.ok(
        body.includes(stamp[1]),
        `${name}: the page's SVG does not carry the committed stamp ${stamp[1].slice(0, 12)}…`,
      );
    }
  });

  test(`[${locale}] every diagram has an accessible name and real text`, () => {
    // #244: an <img> with no alt announced a generated filename. An inline SVG
    // has the same failure mode unless it is given a name, and the whole point
    // of leaving mermaid was that the labels arrive as <text> a reader can
    // reach.
    for (const name of DIAGRAMS) {
      const body = labSection(html, name);
      const svg = body.match(/<svg\b[^>]*>/);
      assert.ok(svg, `${name}: no <svg>`);

      const named = /\brole="img"/.test(svg[0]) && /\baria-label="[^"]+"/.test(svg[0]);
      const titled = /<title\b[^>]*>[^<]+<\/title>/.test(body);
      assert.ok(
        named || titled,
        `${name}: the SVG has neither role="img" + aria-label nor a <title> — a screen reader announces nothing`,
      );

      const texts = [...body.matchAll(/<text\b/g)];
      assert.ok(texts.length >= 8, `${name}: only ${texts.length} <text> elements, expected at least 8`);
    }
  });

  test(`[${locale}] each diagram carries its caption and legend, in this locale`, () => {
    // Risk §1: one IR serves both locales, so the identifiers stay inside the
    // SVG and every sentence lives outside it. If the prose were missing, the
    // diagram would be the only thing saying anything — in English, on both.
    for (const name of DIAGRAMS) {
      const body = labSection(html, name);
      const text = decodeEntities(body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' '));

      assert.ok(
        /<figcaption\b/.test(body),
        `${name}: the diagram has no <figcaption>`,
      );
      // Long enough to be a sentence rather than a label, and not the English
      // copy sitting on the Spanish page — that is what the twin test in
      // lab-data covers key by key; this checks it actually reached the page.
      const prose = text.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]/g, ' ').trim();
      assert.ok(
        prose.split(/\s+/).length >= 30,
        `${name}: less than 30 words of prose around the diagram — the caption or legend did not render`,
      );
    }
  });

  test(`[${locale}] a diagram scrolls inside its own figure, and only there`, () => {
    // PR0 measured that at 320 px the diagram cannot be scaled and stay legible
    // (7 px text projects to 2.55 px against archify's 6 px floor), so it keeps
    // a 754 px floor and scrolls inside its <figure>. The page never does —
    // that is the AC2 claim, and lab-containment.mjs checks it in a browser.
    // This checks the markup that makes it possible.
    for (const name of DIAGRAMS) {
      const body = labSection(html, name);
      const figure = body.match(/<figure\b[^>]*>/);
      assert.ok(figure, `${name}: the diagram is not wrapped in a <figure>`);

      const scroller = body.match(/<div\b[^>]*\boverflow-x-auto\b[^>]*>/);
      assert.ok(
        scroller,
        `${name}: nothing in the section can scroll horizontally — at 320 px the diagram would either overflow the page or be illegible`,
      );
    }
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

      // A `<script>` is not the only way JavaScript reaches the page. A
      // `client:*` directive makes Astro wrap the component in `<astro-island>`
      // and load its runtime from outside the section, which the check above
      // would not see. Nothing in the Lab path uses one today; this is the
      // guard against the day someone reaches for `client:visible`.
      assert.deepEqual(
        [...body.matchAll(/<astro-island\b/g)].map(() => '<astro-island>'),
        [],
        `${name}: a hydrated Astro island in a section the spec requires to be static`,
      );
    }
  });

  test(`[${locale}] status is rendered as words this locale uses`, () => {
    // `k3s`, `ARM64` and `docker` stay identical on both locales because they
    // are names. `healthy` and `standby` are English adjectives, and rendering
    // the enum straight from the data left the Spanish page saying `standby`.
    // Raised in review on this PR.
    if (locale !== 'es') return;

    const body = REBUILT.map((n) => labSection(html, n) || '').join(' ');
    const text = decodeEntities(body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' '));

    const rawEnums = [
      ...new Set([
        ...platform.nodes.map((n) => n.status),
        ...platform.services.map((s) => s.status),
      ]),
    ];
    const untranslated = rawEnums.filter((value) => new RegExp(`\\b${value}\\b`).test(text));

    assert.deepEqual(
      untranslated,
      [],
      'raw English status values rendered as visible text on the Spanish page',
    );
  });
}
