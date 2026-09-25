/**
 * One label (WEB-137, AC1), and no banned register on the proof pages (WEB-141, AC4).
 *
 * The site used to introduce Manu with five different labels. The package keeps
 * one, "Engineer from Silicon to Cloud" on the home eyebrow; other pages carry a
 * section name, never a label of their own. The first test fails if a retired
 * label comes back anywhere in the source, the way `idp.eyebrow` outlived its
 * last consumer.
 *
 * The second reads the built `/lab`, `/ai` and `/lab/idp` pages in both locales.
 * They are the proof the home points at, and a reader who follows that link and
 * meets "deterministic execution harnesses for stochastic AI models" has been
 * sold to rather than shown something. It reads `dist/`, not `ui.ts`, because
 * half of that copy lives in catalog, diagram and artifact data.
 *
 *   npm run build && npm test
 */

import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { readableText } from './lib/audit.mjs';

const siteRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(siteRoot, 'src');

const retired = [
  'Systems & Platform Engineer · Sovereign AI Infrastructure',
  'Autonomous Systems Architecture',
  'Infrastructure & AI agent platform',
  'Infraestructura y plataforma de agentes de IA',
  'Ingeniería de sistemas, implantación de plataformas',
];

function* files(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* files(path);
    else if (/\.(astro|[cm]?[jt]sx?|mdx?|json)$/.test(entry.name)) yield path;
  }
}

test('no retired label is left anywhere under src/', () => {
  const sources = [...files(srcDir)];
  assert.ok(sources.length > 50, `expected the site's sources under ${srcDir}, found ${sources.length} files`);
  const hits = [];
  for (const path of sources) {
    const text = readFileSync(path, 'utf8');
    for (const label of retired) if (text.includes(label)) hits.push(`${path.slice(srcDir.length + 1)}: "${label}"`);
  }
  assert.deepEqual(hits, [], `retired labels still in the source:\n${hits.join('\n')}`);
});

/**
 * The brand package's banned register (vault `brand-package.md` §7), as patterns
 * in both languages. §7 names phrases; the pages carried their relatives
 * ("Zero-Debt Doctrine", "100% IaC", "deterministic containment"), so each entry
 * bans the word family, and the true technical uses were reworded rather than
 * excused.
 *
 * Certifications match the singular adjective only: "certificados TLS" is a TLS
 * certificate, not a credential Manu holds. §7 items a pattern cannot judge stay
 * out: France (only wrong when customer-facing), the em-dash as a tic (the page
 * title uses one as a separator), and node or service counts, which WEB-141
 * checks against `platform.json` instead.
 */
const banned = [
  /\bdeterminist\w*/i,
  /\bstochastic\b|\bestoc[aá]stic[oa]s?\b/i,
  /\bswarms?\b|\benjambres?\b/i,
  /\bsovereign\w*|\bsoberan[oíia]\w*/i,
  /\bzero\W{0,3}(technical\s+)?debt\b|\bcero\s+deuda\b|\bdeuda\s+t[eé]cnica\s+cero\b/i,
  /\b100\s?%\s*(IaC|automat\w*)/i,
  /\bcertified\b|\bcertificad[oa]\b|\bCKAD?\b|Terraform Associate|Solutions Architect/i,
  /service-as-a-software/i,
  /weekly readers|lectores semanales/i,
  /legacy C\+\+/i,
];

const proofPages = ['lab', 'ai', 'lab/idp', 'lab/idp/architecture'].flatMap((route) => [
  `${route}/index.html`,
  `es/${route}/index.html`,
]);

test('no banned term on the proof pages, in either locale', () => {
  const hits = [];
  for (const page of proofPages) {
    const file = join(siteRoot, 'dist', page);
    assert.ok(existsSync(file), `dist/${page} must exist — run the build first`);
    const text = readableText(readFileSync(file, 'utf8'));
    for (const pattern of banned) {
      for (const match of text.matchAll(new RegExp(pattern.source, 'gi'))) {
        const around = text.slice(Math.max(0, match.index - 40), match.index + match[0].length + 40);
        hits.push(`${page}: "${match[0]}" in "…${around}…"`);
      }
    }
  }
  assert.deepEqual(hits, [], `banned terms on the proof pages:\n${hits.join('\n')}`);
});
