/**
 * The on-demand marks render, though no row of the access table is on demand
 * today (WEB-206).
 *
 * Gitea was the one on-demand row until it became mesh-only, so the built
 * `/lab` page no longer draws the "On demand" pill nor the `asleep` check, and
 * no test that reads `dist/` can see them. They stay for the next machine that
 * is powered on only when needed (ADR-028). This file renders the two cells
 * with Astro's container API and a row forced on demand, so that code path is
 * still exercised.
 *
 * `AccessBadge.astro` and `CheckStatus.astro` are the cells `LabServices.astro`
 * draws for every row; `lab-access-status-rows.test.mjs` checks them on the
 * built page.
 */
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { getViteConfig } from 'astro/config';
import { experimental_AstroContainer } from 'astro/container';
import { createServer } from 'vite';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let vite;
let container;

before(async () => {
  const config = await getViteConfig({ root, logLevel: 'silent', server: { middlewareMode: true }, appType: 'custom' })({
    command: 'serve',
    mode: 'test',
  });
  vite = await createServer(config);
  container = await experimental_AstroContainer.create();
});

after(() => vite?.close());

const render = async (file, props) =>
  container.renderToString((await vite.ssrLoadModule(`/src/components/${file}`)).default, { props });

test('an on-demand row draws the access and the on-demand pill with its hint', async () => {
  const html = await render('AccessBadge.astro', { access: 'app-login', label: 'Own login', onDemand: true });
  assert.match(html, /\sdata-access-badge\b[^>]*>Own login</);
  assert.match(html, /<span\b[^>]*\sdata-on-demand\b[^>]*\stitle="Its machine is switched on only when needed\.[^"]*"[^>]*>On demand<\/span>/);
});

test('a row that is not on demand draws no pill', async () => {
  const html = await render('AccessBadge.astro', { access: 'public', label: 'Public' });
  assert.match(html, /\sdata-access-badge\b/);
  assert.doesNotMatch(html, /data-on-demand/);
});

test('an asleep check draws the neutral dot and its word, dated', async () => {
  const html = await render('CheckStatus.astro', { check: 'asleep', checked: '2026-11-14' });
  assert.match(html, /\sdata-check="asleep"/);
  assert.match(html, /\sdata-checked="2026-11-14"/);
  assert.match(html, /bg-ink-300/, 'asleep is not a fault, so it takes ink, not a status family');
  assert.match(html, />asleep<\/span>$/);
});
