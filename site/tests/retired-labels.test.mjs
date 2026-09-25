/**
 * One label (WEB-137, AC1).
 *
 * The site used to introduce Manu with five different labels. The package keeps
 * one, "Engineer from Silicon to Cloud" on the home eyebrow; other pages carry a
 * section name, never a label of their own. This fails if a retired label comes
 * back anywhere in the source, the way `idp.eyebrow` outlived its last consumer.
 */

import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const srcDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

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
