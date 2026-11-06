/**
 * The GitHub contribution chart is served from this site (#549): the build
 * fetches it once, and no built page points a visitor at the third party.
 *
 * When the fetch fails, the build serves an empty chart of the same size
 * (`lib/empty-chart.mjs`) that says why. That chart is the site's own output,
 * recognised by its exact shape; anything else must pass the upstream allowlist.
 * In CI an empty chart fails only when upstream sent a body the allowlist
 * refused: a chart that changed shape is seen on a PR, not by a visitor. A
 * failed fetch (an outage) is reported as a skip naming the cause, since no PR
 * caused it (WEB-199).
 *
 *   npm run build && npm test
 */

import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { emptyChart, fallbackReason, isRefusal } from '../src/lib/empty-chart.mjs';
import { unsafeSvg } from '../src/lib/safe-svg.mjs';

const distDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');

const pages = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return pages(path);
    return entry.name.endsWith('.html') ? [path] : [];
  });

/** What the built chart means for a run: null when it passes, else why it does not. */
function verdict(svg, ci) {
  const reason = fallbackReason(svg);
  if (reason === null) return unsafeSvg(svg) && { fail: `the chart is not rectangles and text: ${unsafeSvg(svg)}` };
  if (!ci) return null;
  if (isRefusal(reason)) return { fail: `the build served the empty chart because upstream sent a body it ${reason}` };
  return { skip: `the build served the empty chart: the upstream fetch failed (${reason})` };
}

test('the empty chart is told apart from upstream, and only a refusal fails CI', () => {
  const chart = '<svg width="663" height="104" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="11" height="11"/></svg>';
  assert.equal(verdict(chart, true), null);
  assert.equal(verdict(emptyChart('HTTP 500'), false), null, 'offline, the empty chart passes');
  assert.deepEqual(verdict(emptyChart('HTTP 500'), true), { skip: 'the build served the empty chart: the upstream fetch failed (HTTP 500)' });
  assert.deepEqual(verdict(emptyChart('refused: element <script>'), true), {
    fail: 'the build served the empty chart because upstream sent a body it refused: element <script>',
  });
  assert.equal(fallbackReason(emptyChart('refused: attribute "x" on <svg> & more')), 'refused: attribute "x" on <svg> & more');
  assert.doesNotMatch(emptyChart('refused: element <script>'), /<script/, 'the reason is escaped in the attribute');
  assert.equal(fallbackReason(emptyChart(String(undefined))), 'undefined', 'a reason that is not a message still builds the chart');
  // Only the exact empty chart skips the allowlist: the attribute alone does not.
  const smuggled = emptyChart('HTTP 500').replace('></svg>', '><script>x()</script></svg>');
  assert.equal(fallbackReason(smuggled), null);
  assert.ok(verdict(smuggled, false)?.fail, 'a body with more than the empty chart goes through the allowlist');
});

test('dist/github-activity.svg is the chart, or the empty chart for a reason', (t) => {
  const file = join(distDir, 'github-activity.svg');
  assert.ok(existsSync(file), 'dist/github-activity.svg must exist — run the build first');
  const result = verdict(readFileSync(file, 'utf8'), Boolean(process.env.CI));
  if (result?.skip) return t.skip(result.skip);
  assert.equal(result?.fail ?? null, null);
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
