/**
 * The GitHub contribution chart is served from this site (#549): the build
 * fetches it once, and no built page points a visitor at the third party.
 *
 * Offline, the build serves an empty chart of the same size rather than fail
 * (`pages/github-activity.svg.ts`), so locally the file is checked only for
 * being an SVG. CI has the network, so there an empty chart fails: an upstream
 * that changed or went away is seen on a PR, not by a visitor.
 *
 *   npm run build && npm test
 */

import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const distDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');

const pages = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return pages(path);
    return entry.name.endsWith('.html') ? [path] : [];
  });

test('dist/github-activity.svg is an SVG', () => {
  const file = join(distDir, 'github-activity.svg');
  assert.ok(existsSync(file), 'dist/github-activity.svg must exist — run the build first');
  const svg = readFileSync(file, 'utf8');
  assert.match(svg, /^\s*(<\?xml[^>]*>\s*)?(<!DOCTYPE[^>]*>\s*)?<svg[\s>]/);
  if (process.env.CI) assert.doesNotMatch(svg, /data-fallback/, 'the build served the empty chart: the upstream fetch failed (see the build log)');
});

test('the home and /projects/ embed the chart from this site', () => {
  for (const page of ['index.html', 'es/index.html', 'projects/index.html']) {
    const html = readFileSync(join(distDir, page), 'utf8');
    assert.match(html, /<img[^>]*src="\/github-activity\.svg"/, `dist/${page} does not embed the chart from this site`);
  }
});

test('no built page points at ghchart.rshah.org', () => {
  const all = pages(distDir);
  assert.ok(all.length > 20, `dist/ holds only ${all.length} pages`);
  const leaking = all.filter((file) => readFileSync(file, 'utf8').includes('ghchart.rshah.org'));
  assert.deepEqual(leaking, [], `pages still reference the third party: ${leaking.join(', ')}`);
});
