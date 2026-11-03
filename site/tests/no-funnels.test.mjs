/**
 * The site sells a hiring profile, not a course (#342).
 *
 * Three Spanish pages sold a five-day email course and a weekly newsletter the
 * site did not send, and search indexed them next to an SRE profile. They are
 * removed, and their old URLs redirect to the Spanish home in nginx.
 *
 *   npm run build && npm test
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const siteRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(siteRoot, 'dist');
const gone = ['nodo', 'rompe', 'newsletter'];

test('no funnel page is built, and no built page links to one or carries a signup form', () => {
  assert.ok(existsSync(join(distDir, 'es/index.html')), 'dist/es/index.html must exist — run the build first');
  for (const slug of gone) assert.ok(!existsSync(join(distDir, 'es', slug)), `dist/es/${slug}/ is still built`);
  const pages = readdirSync(distDir, { recursive: true }).filter((f) => f.endsWith('.html') || f.endsWith('.xml'));
  const linking = pages.filter((f) => /\/es\/(?:nodo|rompe|newsletter)\b|data-api-url|\/api\/subscribe/.test(readFileSync(join(distDir, f), 'utf8')));
  assert.deepEqual(linking, [], `built files still pointing at a funnel: ${linking.join(', ')}`);
});

test('nginx redirects every old funnel URL to the Spanish home', () => {
  const conf = readFileSync(join(siteRoot, 'nginx.conf'), 'utf8');
  for (const slug of gone) {
    for (const path of [`/es/${slug}`, `/es/${slug}/`]) {
      assert.match(conf, new RegExp(`location = ${path.replace(/\//g, '\\/')} \\{ return 301 \\/es\\/; \\}`), `${path} has no redirect`);
    }
  }
});
