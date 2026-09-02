/**
 * The Lab has no accessibility violations (WEB-080, AC5).
 *
 *   npm run build && npm run test:a11y
 *
 * Playwright + axe-core over the built `/lab` and `/es/lab`, like
 * `lab-containment.mjs` and for the same reason: what the page *is* is what a
 * browser computes from it. A static grep cannot see that a colour fails
 * contrast once it has been composited, or that an element is in the tab order.
 *
 * ## It was red, and the three findings were real
 *
 * Measured 2026-09-01 against the PR6 page: **3 violations, 8 nodes, identical
 * on both locales**. None of them were cosmetic.
 *
 *   1. `nested-interactive` (2) — archify emits every component `<g>` as
 *      `tabindex="0" role="button" aria-pressed="false"`, a real control in
 *      archify's own viewer, which ships the script that drives it. This page
 *      ships exactly one script and it is the console, so the built page
 *      carried **17 buttons that press nothing** — and because they sit inside
 *      `role="img"`, which marks its subtree presentational, their labels were
 *      never announced while `tabindex` kept every one in the tab order.
 *      Stripped at build in `LabDiagram.astro`; 37 tab stops → 20.
 *   2. `color-contrast` (5) — `opacity-60` on the standby infra row composited
 *      `ink-500` to 2.32:1 and `ink-600` to 2.87:1, and the diagram source line
 *      used `ink-400` at 12px (2.53:1). See `LabInfra.astro` and
 *      `LabDiagram.astro`: both fixed by changing the mechanism, not the
 *      decision.
 *   3. `link-in-text-block` (1) — the provenance commit hash was distinguished
 *      from its surrounding prose by colour alone, at 1.1:1.
 *
 * ## Two things this check does so that a pass means something
 *
 * Both are the failure mode this spec has already hit twice: a command exits 0
 * having measured the wrong thing (`verification.md`, PR6 § screenshots).
 *
 * **It proves the run happened.** A 404, or an axe bundle that never injected,
 * both yield `violations: []` — indistinguishable from a clean page. So the
 * HTTP status is checked, and `passes` must be non-empty: a page axe never
 * looked at cannot have passed 40 rules.
 *
 * **It pins the console's response.** The reachability console fetches
 * `api.kubelab.live/health` on load and paints `ok-400` rows on success,
 * `warn-400` on failure — different colours, so a contrast verdict computed
 * against the live API would depend on whether Manu's VPS is up, and CI has no
 * business asking. The route is fulfilled from a fixture and the page is
 * audited **twice, once healthy and once degraded**, so both colour paths are
 * covered and neither depends on the network.
 *
 * ## The one `incomplete` is honest and is not suppressed
 *
 * axe reports 79 `color-contrast` results as *incomplete* on this page: they
 * are the `<text>` nodes inside the diagrams, where the background is SVG
 * geometry rather than a CSS colour and axe cannot compute a ratio. That is a
 * limitation of automated checking, not a pass and not a failure. It is printed
 * on every run rather than filtered out, because a check that hides what it
 * could not decide is making a claim it did not earn. The diagram palette is
 * covered instead by the token audit (AC1) and by PR4's rendered screenshots.
 */
import { chromium } from 'playwright';

import { labBaseUrl } from './lib/serve.mjs';

const PATHS = ['/lab', '/es/lab'];

/**
 * The two states the console can paint, fulfilled locally.
 *
 * `component` values are the API's real ones; the point of the fixture is
 * determinism, not fiction. `degraded` flips one check so the `warn-400` branch
 * is audited too — the branch a live-API run would only reach on a bad day.
 */
const HEALTH = {
  healthy: {
    status: 'healthy',
    timestamp: '2026-09-01T12:00:00.000Z',
    checks: [
      { component: 'database', status: 'healthy' },
      { component: 'cache', status: 'healthy' },
      { component: 'beehiiv', status: 'healthy' },
      { component: 'runtime', status: 'healthy' },
    ],
  },
  degraded: {
    status: 'degraded',
    timestamp: '2026-09-01T12:00:00.000Z',
    checks: [
      { component: 'database', status: 'down' },
      { component: 'cache', status: 'healthy' },
      { component: 'beehiiv', status: 'healthy' },
      { component: 'runtime', status: 'healthy' },
    ],
  },
};

const { url: BASE, server } = await labBaseUrl();
const browser = await chromium.launch();
let failures = 0;

for (const path of PATHS) {
  for (const [state, body] of Object.entries(HEALTH)) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.route('**/health', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) }),
    );

    let results;
    try {
      const response = await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
      if (!response?.ok()) throw new Error(`HTTP ${response?.status()}`);

      await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
      results = await page.evaluate(async () => await window.axe.run(document));
    } catch (error) {
      console.error(`✗ ${path} [${state}] — ${error.message}`);
      failures++;
      await page.close();
      continue;
    }

    // A page that never loaded and a bundle that never injected both report
    // zero violations. `passes` is what tells the two apart from a clean page.
    if (results.passes.length === 0) {
      console.error(
        `✗ ${path} [${state}] — axe reported 0 passes as well as 0 violations, ` +
          `which means it did not audit anything. Treating this as a failure.`,
      );
      failures++;
      await page.close();
      continue;
    }

    if (results.violations.length > 0) {
      failures++;
      console.error(`✗ ${path} [${state}] — ${results.violations.length} violation(s):`);
      for (const v of results.violations) {
        console.error(`    ${v.impact?.toUpperCase()} ${v.id}: ${v.help} (${v.nodes.length} node(s))`);
        for (const node of v.nodes.slice(0, 3)) {
          console.error(`      ${node.target.join(' ')}`);
          console.error(`      ${(node.failureSummary ?? '').split('\n').join(' | ')}`);
        }
        console.error(`      → ${v.helpUrl}`);
      }
    } else {
      console.log(
        `✓ ${path} [${state}] — 0 violations, ${results.passes.length} rules passed, ` +
          `${results.incomplete.reduce((n, r) => n + r.nodes.length, 0)} result(s) axe could not decide`,
      );
    }
    await page.close();
  }
}

await browser.close();
server?.close();

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log('\n0 axe violations on both locales, in both console states.');
