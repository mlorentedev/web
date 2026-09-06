/**
 * What the AI Harness page must be true of (WEB-091), asserted against
 * `dist/` on both locales.
 *
 *   npm run build && npm test
 *
 * ## Sections and numbering
 *
 *   01 / Autonomous Agent Execution Plane (harness diagram)
 *   02 / The Four Pillars of Deterministic Containment (pillars)
 *   03 / Autonomous Fleet & Automations (automations, migrated from lab-ai.json)
 *   04 / Executable Artifacts & Operating Contracts (artifacts)
 *
 * The page ships ZERO client JavaScript (unlike /lab, which carries the probe console).
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
  offTokenFamilies,
} from './lib/audit.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(here, '..');
const require = createRequire(import.meta.url);
const labAi = require('../src/data/lab-ai.json');

const aiEntries = labAi.groups.flatMap((g) => g.entries);

const SECTIONS = ['pillars', 'automations', 'artifacts'];

const pages = [
  { locale: 'en', path: join(siteRoot, 'dist/ai/index.html') },
  { locale: 'es', path: join(siteRoot, 'dist/es/ai/index.html') },
];

function decodeEntities(html) {
  return html
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

function aiSection(html, name) {
  const open = new RegExp(`<section\\b[^>]*\\bdata-ai-section="${name}"[^>]*>`);
  const start = html.search(open);
  if (start === -1) return null;

  const bodyStart = start + html.slice(start).match(open)[0].length;
  let depth = 1;
  let i = bodyStart;

  while (depth > 0 && i < html.length) {
    const nextOpen = html.indexOf('<section', i);
    const nextClose = html.indexOf('</section>', i);
    if (nextClose === -1) return null;

    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1;
      i = nextOpen + '<section'.length;
    } else {
      depth -= 1;
      if (depth === 0) return html.slice(bodyStart, nextClose);
      i = nextClose + '</section>'.length;
    }
  }

  return null;
}

const built = pages.map((p) => ({
  ...p,
  html: existsSync(p.path) ? readFileSync(p.path, 'utf8') : null,
}));

test('both AI pages are built', () => {
  const missing = built.filter((p) => p.html === null).map((p) => p.path);
  assert.deepEqual(
    missing,
    [],
    `not found — this suite reads the built site, so run \`npm run build\` first:\n  ${missing.join('\n  ')}`,
  );
});

for (const { locale, html } of built) {
  if (html === null) continue;

  // ------------------------------------------------------------------ presence

  test(`[${locale}] every AI section is on the page, with its eyebrow`, () => {
    // 01 is the harness diagram
    const harnessDiagram = html.match(/<section\b[^>]*\bdata-lab-section="harness"[^>]*>/);
    assert.ok(harnessDiagram, 'no harness diagram section on AI page');

    for (const name of SECTIONS) {
      const body = aiSection(html, name);
      assert.ok(body, `no <section data-ai-section="${name}"> on the built AI page`);
      assert.match(
        body,
        /\[\s*\d{2}\s*\/[^\]]*\]/,
        `the ${name} section has no SectionHeading eyebrow — it is not built on the shared component`,
      );
    }
  });

  // -------------------------------------------------------- AI & Automations

  test(`[${locale}] AI & Automations lists exactly the migrated entries`, () => {
    const body = aiSection(html, 'automations');
    assert.ok(body, 'no automations section to count rows in');

    const rows = [...body.matchAll(/\bdata-automation-slug="([^"]*)"/g)].map((m) => m[1]);
    assert.deepEqual(
      rows.sort(),
      aiEntries.map((e) => e.slug).sort(),
      `${rows.length} automation rows against ${aiEntries.length} in lab-ai.json — ` +
        'the section is hand-written somewhere it should be rendering from data',
    );
  });

  test(`[${locale}] every automation states its own access boundary`, () => {
    const body = aiSection(html, 'automations');
    assert.ok(body, 'no automations section');

    const wrong = [...body.matchAll(/<[^>]*\bdata-automation-slug="([^"]*)"[^>]*>/g)]
      .map((m) => {
        const slug = m[1];
        const access = [...m[0].matchAll(/\bdata-access="([^"]*)"/g)].map((a) => a[1]);
        const entry = aiEntries.find((e) => e.slug === slug);
        if (access.length !== 1) return `${slug}: ${access.length} data-access attributes, expected exactly 1`;
        if (access[0] !== entry.access) return `${slug}: says "${access[0]}", the data says "${entry.access}"`;
        return null;
      })
      .filter(Boolean);

    assert.deepEqual(wrong, [], 'an automation names an access boundary its data does not support');
  });

  test(`[${locale}] no automation ships a link a reader cannot follow`, () => {
    const body = aiSection(html, 'automations');
    assert.ok(body, 'no automations section');

    const hrefs = [...body.matchAll(/<a\b[^>]*\bhref="([^"]*)"/g)].map((m) => decodeEntities(m[1]));
    const shippable = new Set(aiEntries.filter((e) => e.access === 'public').map((e) => e.url));

    const leaked = hrefs.filter((h) => !shippable.has(h));
    assert.deepEqual(
      leaked,
      [],
      'the section links somewhere no public reader can reach — mesh and private ' +
        'endpoints are not shipped to the client (see `platform.ts`)',
    );

    assert.ok(
      !hrefs.some((h) => h.includes('adr-038-sops-age-encryption-for-secrets')),
      'the section still links the renamed ADR path, which 404s',
    );
  });

  test(`[${locale}] the AI page renders this locale's copy of automations`, () => {
    const body = aiSection(html, 'automations');
    assert.ok(body, 'no automations section');
    const text = decodeEntities(body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' '));
    const field = locale === 'es' ? 'descriptionEs' : 'description';

    const missingAi = aiEntries
      .filter((e) => !text.includes(decodeEntities(e[field])))
      .map((e) => `${e.slug}.${field}`);

    assert.deepEqual(missingAi, [], `automation copy missing from the ${locale} page`);
  });

  // ----------------------------------------------------------------- hygiene

  test(`[${locale}] the AI page ships no client JavaScript`, () => {
    const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
      .map((m) => m[0])
      .filter((s) => !s.includes('type="application/ld+json"'));

    assert.deepEqual(
      scripts,
      [],
      `the AI page ships ${scripts.length} client <script> tag(s) — the page must be static`,
    );
  });

  test(`[${locale}] the AI page has no duplicate ids`, () => {
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
    const seen = new Map();
    for (const id of ids) seen.set(id, (seen.get(id) || 0) + 1);
    const dupes = [...seen.entries()].filter(([, n]) => n > 1).map(([id, n]) => `${id} (×${n})`);
    assert.deepEqual(dupes, [], `the AI page contains duplicate ids: ${dupes.join(', ')}`);
  });

  test(`[${locale}] the AI page sections stay inside the token layer`, () => {
    const names = classNames(html);
    const offenders = offTokenFamilies(names, HUED_FAMILIES);
    const rawEscapes = colourEscapes(names);
    const pixelSizes = arbitraryTypeSizes(names);

    assert.deepEqual(
      { offToken: [...offenders.keys()].sort(), rawEscapes, pixelSizes },
      { offToken: [], rawEscapes: [], pixelSizes: [] },
      'the AI page contains off-token utility classes or colour/size escapes',
    );
  });
}
