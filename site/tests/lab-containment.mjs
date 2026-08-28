/**
 * Nothing on the Lab scrolls sideways (WEB-080, AC2).
 *
 *   npm run build && npm run preview &   # or any server for dist/
 *   npm run test:browser
 *
 * ## Expected to fail until PR4
 *
 * This asserts against `/lab` and `/es/lab` as they will exist once the diagram
 * sections are built. Today's page has no generated SVG on it, so a pass here
 * would mean the test is not looking at anything. It is deliberately NOT wired
 * into `npm test` or CI until PR4 puts the diagrams on the page.
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

const BASE = process.env.LAB_BASE_URL ?? 'http://localhost:4321';
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
        // A figure that scrolls internally is the intended shape, not a defect.
        scrollingFigures: [...document.querySelectorAll('figure')].filter(
          (f) => f.scrollWidth > f.clientWidth,
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

    if (overflows || noDiagram || tooNarrow) {
      failures++;
      const why = [
        overflows && `page scrolls sideways (${result.scrollWidth} > ${result.innerWidth})`,
        noDiagram && 'no svg[role="img"] on the page',
        tooNarrow && `diagram scaled to ${result.narrowestSvg}px, below the ${MIN_DIAGRAM_WIDTH}px legibility floor`,
      ].filter(Boolean);
      console.error(`✗ ${path} @ ${width}px — ${why.join('; ')}`);
    } else {
      console.log(
        `✓ ${path} @ ${width}px — document contained, ${result.svgCount} diagram(s), ` +
          `${result.scrollingFigures} scrolling internally`,
      );
    }
    await page.close();
  }
}

await browser.close();
if (failures > 0) {
  console.error(`\n${failures} check(s) failed. Expected until PR4 puts the diagrams on the page.`);
  process.exit(1);
}
console.log('\nAll widths contained.');
