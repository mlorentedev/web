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
 * viewport (cut by any ancestor that clips, so an `sr-only` label paints nothing)
 * is read for its computed family and weight, and the weight is
 * matched to the `@font-face` that serves it, the way the browser picks it
 * (CSS Fonts 4 §5.2). A system family (`font-mono`) has no file and is not
 * counted. The faces painted there are printed, then two checks over the
 * whole sample:
 * - every preloaded face is painted above the fold on at least one page;
 * - every face a first screen paints is preloaded on that screen, so a preload
 *   scoped by `media` to other widths does not count for it;
 * - no font preload carries `media` at all. A sample of widths cannot see the
 *   ones between them, so a preload scoped to 640 and up would pass at 320 and
 *   1440 and miss the note that paints Bold at 639 (lesson 074).
 *
 * The first check is over the sample, not per width, on purpose. Bold is painted
 * above the fold at 640 and up (the nav row's current link), and at 639 too on
 * the note, where a `<strong>` reflows into the first screen. Which faces a
 * first screen paints follows the content as well as the breakpoint, so a
 * preload scoped by `media` to one width would be wrong for the next note.
 */
import { chromium } from 'playwright';

import { labBaseUrl } from './lib/serve.mjs';

// The Spanish pages share the layout, not the copy, so a line that wraps
// differently can paint another weight on the first screen. No note is in Spanish yet.
const PAGES = ['/', '/lab/', '/ai/', '/notes/building-a-homelab-idp/', '/es/', '/es/lab/', '/es/ai/'];
const WIDTHS = [320, 640, 1440];
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
    // A relative `url()` resolves against its stylesheet, not the page.
    const base = sheet.href ?? location.href;
    // A cross-origin sheet hides its rules. Skipping it would read its faces as
    // having no file, and pass them, so the run stops and names the sheet.
    let rules;
    try {
      rules = sheet.cssRules;
    } catch {
      throw new Error(`cannot read the @font-face rules of ${sheet.href}: a cross-origin stylesheet`);
    }
    for (const rule of fontFaces(rules)) {
      // Only upright faces: `pick` reads those, and an italic face of the same weight is another file.
      if ((rule.style.getPropertyValue('font-style') || 'normal') !== 'normal') continue;
      const src = /url\(["']?([^"')]+)/.exec(rule.style.getPropertyValue('src'))?.[1];
      // A `local()`-only face has no file to preload.
      if (!src) continue;
      const family = rule.style.getPropertyValue('font-family').replace(/["']/g, '').trim();
      const key = `${family}|${weightOf(rule.style.getPropertyValue('font-weight') || 'normal')}`;
      const file = new URL(src, base).pathname;
      // Two files for one face (a unicode-range split) would need the glyphs read to tell apart.
      if (files.has(key) && files.get(key) !== file) throw new Error(`${key} is served by ${files.get(key)} and ${file}: this check cannot tell which a glyph uses`);
      files.set(key, file);
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
  // The part of a text box the reader can see: cut by the viewport and by every
  // ancestor that clips. An `sr-only` label keeps a 1×1 box and a collapsed
  // `max-height: 0` panel keeps its layout position; neither paints a glyph.
  const shown = (rect, el) => {
    let { left, top, right, bottom } = rect;
    [left, top, right, bottom] = [Math.max(left, 0), Math.max(top, 0), Math.min(right, innerWidth), Math.min(bottom, innerHeight)];
    for (let a = el; a && a !== document.documentElement; a = a.parentElement) {
      const s = getComputedStyle(a);
      if (s.overflowX === 'visible' && s.overflowY === 'visible' && s.clipPath === 'none' && s.clip === 'auto') continue;
      const box = a.getBoundingClientRect();
      [left, top, right, bottom] = [Math.max(left, box.left), Math.max(top, box.top), Math.min(right, box.right), Math.min(bottom, box.bottom)];
    }
    return { width: right - left, height: bottom - top };
  };
  const painted = new Set();
  const unloaded = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const el = node.parentElement;
    if (!node.textContent.trim() || !el?.checkVisibility({ visibilityProperty: true, opacityProperty: true, contentVisibilityAuto: true })) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    const onScreen = [...range.getClientRects()].map((r) => shown(r, el)).some((r) => r.width > 1 && r.height > 1);
    if (!onScreen) continue;
    const style = getComputedStyle(el);
    const family = style.fontFamily.split(',')[0].replace(/["']/g, '').trim();
    const face = pick(family, Number(style.fontWeight));
    if (!face) continue; // a system family: no file to preload
    const file = files.get(`${face.family}|${face.weight}`);
    // A face the page paints with and never loaded is drawn in a fallback:
    // the check would count a file the visitor does not get.
    if (face.status !== 'loaded') unloaded.add(`${file ?? `${face.family} ${face.weight}`} (${face.status})`);
    if (!file) continue; // a `local()`-only face: no file to preload
    painted.add(file);
  }
  // A preload with a `media` the viewport does not match is never fetched.
  // An empty `media` scopes nothing: the same reading as the scope check below.
  // A font preload without `crossorigin` is fetched in another mode than the
  // font itself, so the browser discards it: it preloads nothing.
  const preloaded = [...document.querySelectorAll('link[rel="preload"][as="font"]')]
    .filter((l) => l.crossOrigin !== null)
    .filter((l) => !l.media.trim() || matchMedia(l.media).matches)
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
        // Any `media` but an empty one, `all` included: a preload is for every screen or it is wrong.
        const scoped = await page.evaluate(() =>
          [...document.querySelectorAll('link[rel="preload"][as="font"]')].filter((l) => l.media.trim()).map((l) => `${l.href} (${l.media})`),
        );
        for (const link of scoped) {
          console.error(`✗ ${path} @ ${width}px preloads ${name(link)}: a font preload is never scoped by media`);
          failures++;
        }
        // Failed on the link itself: the painted-face check sees only a face in use,
        // and a discarded preload of an unused face would pass it.
        const noCors = await page.evaluate(() =>
          [...document.querySelectorAll('link[rel="preload"][as="font"]')].filter((l) => l.crossOrigin === null).map((l) => l.href),
        );
        for (const link of noCors) {
          console.error(`✗ ${path} @ ${width}px preloads ${name(link)} without crossorigin: the browser discards it`);
          failures++;
        }
        for (const face of unloaded) {
          console.error(`✗ ${path} @ ${width}px paints with ${name(face)}, which did not load`);
          failures++;
        }
        painted.forEach((f) => used.add(f));
        preloaded.forEach((f) => preloads.add(f));
        // Painted means preloaded on this screen: a `media` preload another width
        // matches does not reach this one.
        for (const file of painted.filter((f) => !preloaded.includes(f))) {
          console.error(`✗ ${path} @ ${width}px paints ${name(file)}, and does not preload it`);
          failures++;
        }
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
if (used.size === 0) {
  console.error('✗ no first screen painted a declared face: the measurement read nothing');
  failures++;
}

if (failures > 0) {
  console.error(`\n${failures} font preload mismatches`);
  process.exit(1);
}
console.log(`font preloads: ${[...preloads].map(name).sort().join(', ')} are the faces ${PAGES.length} pages paint above the fold at ${WIDTHS.join(' and ')} px`);
