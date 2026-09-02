/**
 * Nothing on the Lab scrolls sideways (WEB-080, AC2).
 *
 *   npm run build && npm run test:browser
 *
 * ## It serves `dist/` itself
 *
 * It used to require a server already listening on :4321 and reported eight
 * connection refusals as eight containment failures — the same red whatever the
 * page looked like. It now starts a static server over `dist/` and stops it at
 * the end, so the only thing that can fail is the thing being measured.
 * `LAB_BASE_URL` still overrides, for pointing it at staging.
 *
 * Green as of PR4, which put the diagrams on the page, and wired into CI with
 * it. Before that a pass would have meant the test was looking at nothing,
 * which is why it was kept out.
 *
 * ## What it actually checks, and why that is the right check
 *
 * The diagram cannot be scaled to a 320 px viewport: its viewBox is 880 wide and
 * its smallest authored text is 7 px, which projects to 2.55 px — well under
 * archify's own 6 px readability floor. Scaling to fit is what #245 did for the
 * mermaid diagrams, and that commit says plainly it does not make a wide diagram
 * readable, which is why #244 stays open.
 *
 * So the diagram keeps a legible minimum width (754 px = 880 × 6/7, the width at
 * which the smallest text reaches the floor) and scrolls inside its own figure.
 * The assertion is therefore about the *document*: `scrollWidth <= innerWidth`
 * on the page, while the figure is allowed — expected — to scroll internally.
 * A page that never scrolls sideways and a diagram nobody can read are different
 * failures; this catches the first and PR4's screenshots answer the second.
 */

import { chromium } from 'playwright';

// The server moved to `lib/serve.mjs` in PR7, when `lab-axe.mjs` became the
// second browser check needing exactly this one. `LAB_BASE_URL` still overrides.
import { labBaseUrl } from './lib/serve.mjs';

const { url: BASE, server: served } = await labBaseUrl();
const PATHS = ['/lab', '/es/lab'];
const WIDTHS = [320, 768, 1440, 2048];
const MIN_DIAGRAM_WIDTH = 754;

const browser = await chromium.launch();
let failures = 0;

for (const path of PATHS) {
  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    let result;
    try {
      const response = await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
      if (!response?.ok()) throw new Error(`HTTP ${response?.status()}`);
      result = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        svgCount: document.querySelectorAll('svg[role="img"]').length,
        // A container that scrolls internally is the intended shape, not a
        // defect. Counted on the scroller itself — this looked at `figure`
        // first and reported "0 scrolling internally" at 320px, which cannot
        // be true of a 754px diagram in a 320px viewport. The number was
        // decoration, so it was never questioned; now it is checked below.
        scrollingContainers: [...document.querySelectorAll('.lab-diagram')].filter(
          (el) => el.scrollWidth > el.clientWidth,
        ).length,
        narrowestSvg: Math.min(
          ...[...document.querySelectorAll('svg[role="img"]')].map((s) =>
            Math.round(s.getBoundingClientRect().width),
          ),
          Infinity,
        ),
      }));
    } catch (error) {
      console.error(`✗ ${path} @ ${width}px — ${error.message}`);
      failures++;
      await page.close();
      continue;
    }

    const overflows = result.scrollWidth > result.innerWidth;
    const noDiagram = result.svgCount === 0;
    const tooNarrow = result.narrowestSvg !== Infinity && result.narrowestSvg < MIN_DIAGRAM_WIDTH;
    // Below the floor the diagram cannot fit, so the container must absorb it.
    // If nothing scrolls there, either the page is overflowing (caught above)
    // or the diagram was squashed by something this check cannot see.
    const mustScroll = width < MIN_DIAGRAM_WIDTH;
    const notScrolling = mustScroll && result.scrollingContainers < result.svgCount;

    if (overflows || noDiagram || tooNarrow || notScrolling) {
      failures++;
      const why = [
        overflows && `page scrolls sideways (${result.scrollWidth} > ${result.innerWidth})`,
        noDiagram && 'no svg[role="img"] on the page',
        tooNarrow && `diagram scaled to ${result.narrowestSvg}px, below the ${MIN_DIAGRAM_WIDTH}px legibility floor`,
        notScrolling && `only ${result.scrollingContainers} of ${result.svgCount} diagrams scroll internally at ${width}px, where none can fit`,
      ].filter(Boolean);
      console.error(`✗ ${path} @ ${width}px — ${why.join('; ')}`);
    } else {
      console.log(
        `✓ ${path} @ ${width}px — document contained, ${result.svgCount} diagram(s), ` +
          `${result.scrollingContainers} scrolling internally`,
      );
    }
    await page.close();
  }
}

await browser.close();
served?.close();

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log('\nAll widths contained.');
