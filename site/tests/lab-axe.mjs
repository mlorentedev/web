/**
 * No built page has an accessibility violation (WEB-080 AC5, widened by #517).
 *
 *   npm run build && npm run test:a11y
 *
 * The name is from when it covered only the Lab; it now audits every page in
 * `dist/`. Playwright + axe-core over each at 320 and 1440, like
 * `lab-containment.mjs` and for the same reason: what the page *is* is what a
 * browser computes from it. A static grep cannot see that a colour fails
 * contrast once it has been composited, or that an element is in the tab order.
 *
 * ## It was red, and the four findings were real
 *
 * Measured 2026-09-01 against the PR6 page: **3 violations / 8 nodes at 1440,
 * plus a fourth that only exists at 320**, identical on both locales. None of
 * them were cosmetic.
 *
 *   1. `nested-interactive` (2) — archify emits every component `<g>` as
 *      `tabindex="0" role="button" aria-pressed="false"`, a real control in
 *      archify's own viewer, which ships the script that drives it. This page
 *      shipped none of archify's script, so the built page
 *      carried **17 buttons that press nothing** — and because they sit inside
 *      `role="img"`, which marks its subtree presentational, their labels were
 *      never announced while `tabindex` kept every one in the tab order.
 *      Stripped at build in `LabDiagram.astro`.
 *   2. `color-contrast` (5) — `opacity-60` on the standby infra row composited
 *      `ink-500` to 2.32:1 and `ink-600` to 2.87:1, and the diagram source line
 *      used `ink-400` at 12px (2.53:1). See `LabInfra.astro` and
 *      `LabDiagram.astro`: both fixed by changing the mechanism, not the
 *      decision.
 *   3. `link-in-text-block` (1) — the provenance commit hash was distinguished
 *      from its surrounding prose by colour alone, at 1.1:1.
 *   4. `scrollable-region-focusable` (2), **at 320 only** — and it is the other
 *      half of (1). Below the 754 px legibility floor the diagram scrolls
 *      inside its container, and once the phantom buttons were gone no keyboard
 *      could reach that container: the right-hand half of both diagrams existed
 *      only for a mouse. Note that the rule *passed before the strip, by
 *      accident* — the 17 fake buttons counted as "focusable content". One real
 *      stop, named and grouped, replaces all seventeen: 37 focus stops → 22.
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
 * **It proves the page asks nothing of the network.** Until #280 the page
 * carried a reachability console that fetched `api.kubelab.live/health` on
 * load, so this check stubbed that route and audited every page twice, healthy
 * and degraded. The console is gone and the page ships no script. Any request
 * to another origin now fails the run: a verdict that depends on whether
 * Manu's VPS is up is not a verdict CI should give, and a request nobody
 * expected is the first sign a script has come back.
 *
 * That promise is the Lab's and the AI page's (`SCRIPTLESS`): there, any
 * request to another origin fails. Other pages embed one third-party image on
 * purpose, the GitHub activity chart on `/` and `/projects/` (`EMBEDDED`). It
 * is still blocked, so the verdict never waits on the network, and listed, but
 * it does not fail the run. Any other origin fails on every page.
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
import { readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

import { labBaseUrl } from './lib/serve.mjs';

// Resolved from this file, not from the working directory. `serve.mjs` finds
// `dist/` through `import.meta.url` for exactly this reason, and a check that
// only works when invoked from `site/` is a check that will one day be invoked
// from somewhere else and report a clean page it never audited.
const AXE_BUNDLE = createRequire(import.meta.url).resolve('axe-core/axe.min.js');

/**
 * Every page the build wrote, not a list (#517).
 *
 * The list this replaced named the eight Lab and AI pages, so the notes never
 * reached axe: all sixteen carried two unnamed `<nav>` landmarks
 * (`landmark-unique`), eleven had code comments at 3.04:1, and the 404 heading
 * sat at 1.47:1. A page added later is audited the day it is built. Measured
 * 2026-11-03: 85 pages, about 13 s per width.
 */
const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const pagesIn = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return pagesIn(path);
    return entry.name.endsWith('.html') ? [`/${relative(DIST, path).replace(/index\.html$/, '')}`] : [];
  });
const PATHS = pagesIn(DIST).sort();

/** Pages that must make no request to another origin. */
const SCRIPTLESS = /^\/(es\/)?(lab|ai)\//;

/** The one third-party origin other pages embed on purpose: `ghchartSrc` in `src/data/site.ts`. */
const EMBEDDED = new Set(['https://ghchart.rshah.org']);

/**
 * The six AA rules axe 4.14 ships disabled, turned on by name. Measured
 * 2026-11-03 with all 15 disabled rules on, across every page at both widths:
 * only `color-contrast-enhanced` (AAA, 7:1) fails, and AA is this site's bar.
 * AAA and experimental rules stay off: their verdicts are not a conformance
 * claim and may change between axe releases. Named, not discovered, so an axe
 * upgrade cannot switch a new rule on unseen; a name axe no longer knows
 * fails the run instead of being skipped.
 */
const ENABLED = ['aria-roledescription', 'audio-caption', 'duplicate-id', 'duplicate-id-active', 'landmark-complementary-is-top-level', 'target-size'];

// A build that wrote nothing, or wrote somewhere else, would audit no page and
// pass. The pages this check began with must still be among the ones it found.
for (const page of ['/lab/', '/es/lab/', '/ai/', '/es/ai/', '/notes/', '/']) {
  if (!PATHS.includes(page)) throw new Error(`${page} is not in dist/: run the build first`);
}

/**
 * Both ends of the range `lab-containment.mjs` covers.
 *
 * Not symmetry for its own sake: WCAG's contrast threshold drops from 4.5:1 to
 * 3:1 for large text (≥ 18pt, or ≥ 14pt bold), and this page sets type
 * responsively — `text-2xl sm:text-4xl` is large text at 1440 and can be normal
 * text at 320. A colour that passes wide can therefore fail narrow with no
 * branch in the source to notice, which is the same shape as the containment
 * failures PR4 found only by measuring at four widths.
 */
const WIDTHS = [320, 1440];

const { url: BASE, server } = await labBaseUrl();
const browser = await chromium.launch();
let failures = 0;

for (const path of PATHS) {
  for (const width of WIDTHS) {
    const label = `${path} @ ${width}px`;
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const elsewhere = [];
    await page.route('**', (route) => {
      const url = route.request().url();
      // Origins, not a string prefix: `startsWith` lets `:43210` through for a
      // base on `:4321`, and `lab.example.other.invalid` for `lab.example`.
      if (url.startsWith('data:') || new URL(url).origin === new URL(BASE).origin) return route.continue();
      elsewhere.push(url);
      return route.abort();
    });

    let results;
    try {
      const response = await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
      if (!response?.ok()) throw new Error(`HTTP ${response?.status()}`);

      await page.addScriptTag({ path: AXE_BUNDLE });
      results = await page.evaluate(async (enabled) => {
        const known = new Set(window.axe.getRules().map((rule) => rule.ruleId));
        const unknown = enabled.filter((id) => !known.has(id));
        if (unknown.length > 0) throw new Error(`axe no longer has the rules ${unknown.join(', ')}`);
        return await window.axe.run(document, {
          rules: Object.fromEntries(enabled.map((id) => [id, { enabled: true }])),
        });
      }, ENABLED);
    } catch (error) {
      console.error(`✗ ${label} — ${error.message}`);
      failures++;
      await page.close();
      continue;
    }

    const expected = (url) => !SCRIPTLESS.test(path) && EMBEDDED.has(new URL(url).origin);
    const unexpected = elsewhere.filter((url) => !expected(url));
    if (elsewhere.length > unexpected.length) {
      console.log(`  ${label} — blocked, not counted: ${elsewhere.filter(expected).join(', ')}`);
    }
    if (unexpected.length > 0) {
      console.error(`✗ ${label} — requests to another origin:\n    ${unexpected.join('\n    ')}`);
      failures++;
    }

    // A page that never loaded and a bundle that never injected both report
    // zero violations. `passes` is what tells the two apart from a clean page.
    if (results.passes.length === 0) {
      console.error(
        `✗ ${label} — axe reported 0 passes as well as 0 violations, ` +
          `which means it did not audit anything. Treating this as a failure.`,
      );
      failures++;
      await page.close();
      continue;
    }

    if (results.violations.length > 0) {
      failures++;
      console.error(`✗ ${label} — ${results.violations.length} violation(s):`);
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
        `✓ ${label} — 0 violations, ${results.passes.length} rules passed, ` +
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
console.log(
  `\n0 axe violations on ${PATHS.length} pages at 320 and 1440, ` +
    'and no request to another origin beyond the GitHub chart, none at all from the Lab or AI pages.',
);
