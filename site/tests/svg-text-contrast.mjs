/**
 * Text drawn inside an SVG meets WCAG 1.4.3 contrast against what it is painted on (#555).
 *
 *   npm run build && npm run test:a11y
 *
 * axe skips content hidden from assistive technology, and every diagram on the
 * site is `aria-hidden="true"`: the loop on `/` labelled its lobes at 2.54:1 and
 * the audit of every page still passed. The label is painted all the same, and a
 * sighted reader still has to read it.
 *
 * So this reads what the browser computes for each visible `<text>`: its fill,
 * the opacity it inherits, and its rendered size. What it sits on is the last
 * filled shape before it in the same SVG whose fill contains the text's centre
 * (paint order is document order), over the page backgrounds behind the SVG.
 * Geometry rather than `elementsFromPoint`, which skips `pointer-events: none`
 * and anything outside the viewport.
 *
 * A colour it cannot read (a gradient fill, an image background) fails the run:
 * guessing white would turn a dark panel into a pass. Every built page, at both
 * widths, because the loop draws a different SVG at each.
 */
import { readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

import { backdrop, composite, contrast, parseColour } from './lib/focus.mjs';
import { labBaseUrl } from './lib/serve.mjs';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const pagesIn = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return pagesIn(path);
    return entry.name.endsWith('.html') ? [`/${relative(DIST, path).replace(/index\.html$/, '')}`] : [];
  });
const PATHS = pagesIn(DIST).sort();
if (!PATHS.includes('/')) throw new Error('/ is not in dist/: run the build first');

const WIDTHS = [320, 1440];

/**
 * Fills known to fail inside the generated archify diagrams (`svg[data-preset]`),
 * and only there: edge and node labels take the family's stroke shade, tuned for
 * lines rather than text. Fixing them means re-running the diagram generator
 * (WEB-182, #559). Any other failing fill, in a diagram or out, counts, and a
 * fill listed here that no longer fails anywhere fails the run, so the list can
 * only shrink.
 */
const KNOWN_DIAGRAM_FILLS = new Set(['rgb(5, 150, 105)', 'rgb(6, 182, 212)', 'rgb(100, 116, 139)']);
const stillFailing = new Set();
let known = 0;

/** Every visible SVG `<text>` on the page, with what it is painted on. */
function readTexts() {
  const opacity = (node) => {
    let product = 1;
    for (let n = node; n instanceof Element; n = n.parentElement) product *= Number(getComputedStyle(n).opacity);
    return product;
  };
  const shapes = 'rect, circle, ellipse, polygon, path';
  // Shapes in these are painted elsewhere or not at all, never where they stand.
  const offstage = 'defs, pattern, marker, mask, clipPath, symbol';
  // A pattern of strokes only (the diagrams' background grid) is a texture over
  // transparency: it puts no colour behind a label. Any other paint server stays
  // in, and `parseColour` refuses it.
  const transparentTexture = (shape) => {
    const id = getComputedStyle(shape).fill.match(/^url\("?#([^")]+)"?\)/)?.[1];
    const pattern = id && shape.ownerSVGElement.querySelector(`pattern[id="${id}"]`);
    return Boolean(pattern) && [...pattern.querySelectorAll(shapes)].every((s) => getComputedStyle(s).fill === 'none');
  };
  return [...document.querySelectorAll('svg text')]
    .filter((text) => text.getClientRects().length > 0 && getComputedStyle(text).visibility === 'visible')
    .map((text) => {
      const style = getComputedStyle(text);
      const svg = text.ownerSVGElement;
      const box = text.getBoundingClientRect();
      const centre = new DOMPoint(box.x + box.width / 2, box.y + box.height / 2);
      const under = [...svg.querySelectorAll(shapes)]
        .filter((shape) => shape.compareDocumentPosition(text) & Node.DOCUMENT_POSITION_FOLLOWING)
        .filter((shape) => !shape.closest(offstage) && shape.getClientRects().length > 0)
        .filter((shape) => getComputedStyle(shape).fill !== 'none' && !transparentTexture(shape))
        .filter((shape) => shape.isPointInFill(centre.matrixTransform(shape.getScreenCTM().inverse())))
        .map((shape) => ({
          fill: getComputedStyle(shape).fill,
          alpha: Number(getComputedStyle(shape).fillOpacity) * opacity(shape),
        }))
        .at(-1);
      const layers = [];
      for (let node = svg; node; node = node.parentElement) {
        const { backgroundColor, backgroundImage } = getComputedStyle(node);
        layers.push({ backgroundColor, backgroundImage });
      }
      return {
        name: `"${text.textContent.trim().slice(0, 40)}"`,
        fill: style.fill,
        alpha: Number(style.fillOpacity) * opacity(text),
        px: Number.parseFloat(style.fontSize) * Math.abs(text.getScreenCTM().a),
        weight: Number(style.fontWeight),
        under,
        layers,
        diagram: svg.hasAttribute('data-preset'),
      };
    });
}

/** The problem with one text, or null. WCAG large text: 24px, or 18.66px bold. */
function problem({ name, fill, alpha, px, weight, under, layers }) {
  const withAlpha = (paint, a) => ({ ...parseColour(paint), a: parseColour(paint).a * a });
  // One candidate per gradient stop behind the SVG; the text must pass on each.
  const ratio = Math.min(
    ...backdrop(layers).map((page) => {
      const behind = under ? composite(withAlpha(under.fill, under.alpha), page) : page;
      return contrast(composite(withAlpha(fill, alpha), behind), behind);
    }),
  );
  // NaN compares false with everything, so an unread colour would pass silently.
  if (!Number.isFinite(ratio)) throw new Error(`contrast is not a number (fill ${fill})`);
  const needed = px >= 24 || (px >= 18.66 && weight >= 700) ? 3 : 4.5;
  return ratio < needed ? `${name} at ${px.toFixed(1)}px is ${ratio.toFixed(2)}:1, needs ${needed}:1 (fill ${fill})` : null;
}

const { url: BASE, server } = await labBaseUrl();
const browser = await chromium.launch();
let failures = 0;
let checked = 0;

for (const path of PATHS) {
  for (const width of WIDTHS) {
    const label = `${path} @ ${width}px`;
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const response = await page.goto(`${BASE}${path}`, { waitUntil: 'load' });
    if (!response?.ok()) {
      console.error(`✗ ${label} — HTTP ${response?.status()}`);
      failures++;
      await page.close();
      continue;
    }
    const texts = await page.evaluate(readTexts);
    checked += texts.length;
    const bad = texts.flatMap((text) => {
      let found;
      try {
        found = problem(text);
      } catch (error) {
        return `${text.name}: ${error.message}`;
      }
      if (found && text.diagram && KNOWN_DIAGRAM_FILLS.has(text.fill)) {
        stillFailing.add(text.fill);
        known++;
        return [];
      }
      return found ?? [];
    });
    if (bad.length > 0) {
      failures++;
      console.error(`✗ ${label} — ${bad.length} below contrast:\n    ${[...new Set(bad)].join('\n    ')}`);
    }
    await page.close();
  }
}

await browser.close();
server?.close();

// A selector that matched nothing would pass every page.
if (checked === 0) {
  console.error('✗ no SVG text found on any page: the check read nothing');
  process.exit(1);
}
const fixed = [...KNOWN_DIAGRAM_FILLS].filter((fill) => !stillFailing.has(fill));
if (fixed.length > 0) {
  console.error(`✗ no diagram label fails with ${fixed.join(', ')} any more: remove it from KNOWN_DIAGRAM_FILLS`);
  failures++;
}
if (failures > 0) process.exit(1);
console.log(
  `svg text contrast: ${checked} texts on ${PATHS.length} pages at 320 and 1440 at AA, ` +
    `except ${known} diagram label readings known to fail (WEB-182, #559).`,
);
