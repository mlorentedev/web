/**
 * Each preloaded font face is one the first screen paints (WEB-181).
 *
 *   npm run build && node tests/font-preloads.mjs
 *
 * A preload is fetched at the highest priority, ahead of the CSS that would
 * ask for the face. One for a face the first screen does not paint competes
 * with the faces it does paint, and a face the first screen paints without a
 * preload waits for the stylesheet before it is requested.
 *
 * On each page in PAGES at each width, every visible text box inside the first
 * viewport is read for its computed family and weight, and the weight is
 * matched to the `@font-face` that serves it, the way the browser picks it
 * (CSS Fonts 4 §5.2). A system family (`font-mono`) has no file and is not
 * counted. The faces painted there are printed, then two checks over the
 * whole sample:
 * - every preloaded face is painted above the fold on at least one page;
 * - every face painted above the fold on any page is preloaded.
 *
 * The check is over the sample, not per width, on purpose. Bold is painted
 * above the fold at 640 and up (the nav row's current link), and at 639 too on
 * the note, where a `<strong>` reflows into the first screen. Which faces a
 * first screen paints follows the content as well as the breakpoint, so a
 * preload scoped by `media` to one width would be wrong for the next note.
 */
import { chromium } from 'playwright';

import { labBaseUrl } from './lib/serve.mjs';

const PAGES = ['/', '/lab/', '/ai/', '/notes/building-a-homelab-idp/'];
const WIDTHS = [320, 1440];
const HEIGHT = 800;

/** Runs in the page: the font files the first viewport paints with, and the ones the head preloads. */
function firstScreen() {
  // `normal` and `bold` are 400 and 700; a range keeps both ends. The face and
  // its rule are matched on this, so a rule that writes `bold` still matches.
  const weightOf = (value) =>
    value.trim().split(/\s+/).map((w) => ({ normal: '400', bold: '700' })[w] ?? w).join(' ');
  const faces = [...document.fonts].map((face) => {
    const weight = weightOf(face.weight);
    const [min, max = min] = weight.split(' ').map(Number);
    return { family: face.family.replace(/["']/g, ''), style: face.style, weight, min, max, status: face.status };
  });
  // Every @font-face, wherever it sits: Tailwind can nest them in @layer,
  // and a @media or @supports block nests them too.
  const fontFaces = (rules) =>
    [...rules].flatMap((rule) => (rule instanceof CSSFontFaceRule ? [rule] : rule.cssRules ? fontFaces(rule.cssRules) : []));
  const files = new Map();
  for (const sheet of document.styleSheets) {
    for (const rule of fontFaces(sheet.cssRules)) {
      const src = /url\(["']?([^"')]+)/.exec(rule.style.getPropertyValue('src'))?.[1];
      const family = rule.style.getPropertyValue('font-family').replace(/["']/g, '').trim();
      files.set(`${family}|${weightOf(rule.style.getPropertyValue('font-weight') || 'normal')}`, new URL(src, location.href).pathname);
    }
  }
  // CSS Fonts 4 §5.2: a face whose range holds the weight wins; otherwise
  // below 400 look lighter then heavier, above 500 heavier then lighter.
  const pick = (family, weight) => {
    const candidates = faces.filter((f) => f.family === family && f.style === 'normal');
    const hit = candidates.find((f) => weight >= f.min && weight <= f.max);
    if (hit) return hit;
    const lighter = candidates.filter((f) => f.max < weight).sort((a, b) => b.max - a.max);
    const heavier = candidates.filter((f) => f.min > weight).sort((a, b) => a.min - b.min);
    return (weight <= 500 ? [...lighter, ...heavier] : [...heavier, ...lighter])[0];
  };
  const painted = new Set();
  const unloaded = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const el = node.parentElement;
    if (!node.textContent.trim() || !el?.checkVisibility({ visibilityProperty: true, opacityProperty: true })) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    const onScreen = [...range.getClientRects()].some((r) => r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth);
    if (!onScreen) continue;
    const style = getComputedStyle(el);
    const family = style.fontFamily.split(',')[0].replace(/["']/g, '').trim();
    const face = pick(family, Number(style.fontWeight));
    if (!face) continue; // a system family: no file to preload
    const file = files.get(`${face.family}|${face.weight}`) ?? `${face.family} ${face.weight} (no src)`;
    painted.add(file);
    // A face the page paints with and never loaded is drawn in a fallback:
    // the check would count a file the visitor does not get.
    if (face.status !== 'loaded') unloaded.add(`${file} (${face.status})`);
  }
  // A preload with a `media` the viewport does not match is never fetched.
  const preloaded = [...document.querySelectorAll('link[rel="preload"][as="font"]')]
    .filter((l) => !l.media || matchMedia(l.media).matches)
    .map((l) => new URL(l.href).pathname);
  return { painted: [...painted].sort(), preloaded: preloaded.sort(), unloaded: [...unloaded].sort() };
}

const { url: BASE, server } = await labBaseUrl();
const browser = await chromium.launch();
const name = (file) => file.split('/').pop();
const used = new Set();
const preloads = new Set();
let failures = 0;
try {
  for (const path of PAGES) {
    for (const width of WIDTHS) {
      const page = await browser.newPage({ viewport: { width, height: HEIGHT } });
      const response = await page.goto(`${BASE}${path}`, { waitUntil: 'load' });
      if (!response?.ok()) {
        console.error(`✗ ${path} @ ${width}px: HTTP ${response?.status()}`);
        failures++;
      } else {
        await page.evaluate(() => document.fonts.ready);
        const { painted, preloaded, unloaded } = await page.evaluate(firstScreen);
        for (const face of unloaded) {
          console.error(`✗ ${path} @ ${width}px paints with ${name(face)}, which did not load`);
          failures++;
        }
        painted.forEach((f) => used.add(f));
        preloaded.forEach((f) => preloads.add(f));
        console.log(`  ${path} @ ${width}px paints ${painted.map(name).join(', ')}`);
      }
      await page.close();
    }
  }
} finally {
  await browser.close();
  server?.close();
}

for (const file of preloads) {
  if (!used.has(file)) {
    console.error(`✗ ${name(file)} is preloaded, and no first screen in the sample paints it`);
    failures++;
  }
}
for (const file of used) {
  if (!preloads.has(file)) {
    console.error(`✗ ${name(file)} is painted above the fold, and not preloaded`);
    failures++;
  }
}
if (used.size === 0) {
  console.error('✗ no first screen painted a declared face: the measurement read nothing');
  failures++;
}

if (failures > 0) {
  console.error(`\n${failures} font preload mismatches`);
  process.exit(1);
}
console.log(`font preloads: ${[...preloads].map(name).sort().join(', ')} are the faces ${PAGES.length} pages paint above the fold at ${WIDTHS.join(' and ')} px`);
