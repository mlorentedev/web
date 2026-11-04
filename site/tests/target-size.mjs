/**
 * Tap targets meet WCAG 2.5.8 (target size, AA), and the ones that sit in a
 * row meet it on their own box (WEB-132).
 *
 *   npm run build && node tests/target-size.mjs
 *
 * 2.5.8 passes a target that is 24 × 24 CSS px, or a smaller one when a 24 px
 * circle centred on it touches no other target and no other small target's
 * circle. Links inside a sentence are exempt. Every target on every page is
 * held to that.
 *
 * The nav links (13 × 20), the language switch (15 × 16) and the tag chips
 * (20 px tall) passed only on the spacing rule, so one added element would
 * have failed them. Those are marked (`[data-header-links] a`,
 * `[data-tag-chip]`) and held to 24 px on their own box, with no spacing
 * exception.
 *
 * A target counts as inline when it is `display: inline` and its block holds
 * text of its own beside the link.
 *
 * Every built page, at 320 and 1440, in the Chromium `test:browser` installs.
 */
import { readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

import { labBaseUrl } from './lib/serve.mjs';

const MIN = 24;
const WIDTHS = [320, 1440];
const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const pagesIn = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return pagesIn(path);
    return entry.name.endsWith('.html') ? [`/${relative(DIST, path).replace(/index\.html$/, '')}`] : [];
  });
const PATHS = pagesIn(DIST).sort();

/** Runs in the page: each target that fails 2.5.8, and each marked target under `min` on its own box. */
function undersized(min) {
  const TARGETS = 'a[href], button, summary, input:not([type=hidden]), select, textarea, [role=button], [tabindex]:not([tabindex="-1"])';
  const OWN_SIZE = '[data-header-links] a, [data-tag-chip]';
  const BLOCK = /^(block|flex|grid|list-item|table-cell|flow-root)$/;
  const blockOf = (node) => {
    for (let el = node.parentElement; el; el = el.parentElement) {
      if (BLOCK.test(getComputedStyle(el).display)) return el;
    }
    return document.body;
  };
  const inlineInText = (el) => {
    if (getComputedStyle(el).display !== 'inline') return false;
    return (blockOf(el).textContent ?? '').trim().length > (el.textContent ?? '').trim().length;
  };
  const label = (el) => {
    const name = el.getAttribute('aria-label') || el.textContent?.trim().replace(/\s+/g, ' ') || el.getAttribute('href') || '';
    const where = el.closest('header, nav, footer, main, aside')?.tagName.toLowerCase() ?? 'body';
    return `${where} <${el.tagName.toLowerCase()}> "${name.slice(0, 40)}"`;
  };
  const targets = [...document.querySelectorAll(TARGETS)]
    .filter((el) => {
      const style = getComputedStyle(el);
      if (style.visibility === 'hidden' || style.display === 'none' || el.closest('.sr-only')) return false;
      const { width, height } = el.getBoundingClientRect();
      return width > 0 && height > 0; // the skip link is 0 × 0 until focused
    })
    .filter((el) => !inlineInText(el))
    .map((el) => {
      const r = el.getBoundingClientRect();
      return { el, r, cx: r.left + r.width / 2, cy: r.top + r.height / 2, small: r.width < min || r.height < min };
    });
  // A target's circle reaches a box when the box's nearest point is within the radius.
  const reaches = (a, r) => Math.hypot(Math.max(r.left - a.cx, 0, a.cx - r.right), Math.max(r.top - a.cy, 0, a.cy - r.bottom)) < min / 2;
  const found = [];
  for (const a of targets) {
    if (!a.small) continue;
    const size = `${Math.round(a.r.width)}×${Math.round(a.r.height)}`;
    if (a.el.matches(OWN_SIZE)) {
      found.push(`${label(a.el)} ${size}, must be ${min}×${min} on its own box`);
      continue;
    }
    // A focusable scroll region around the link is not a neighbour: it holds
    // the link, so its box always contains the circle.
    const crowd = targets.find((b) => b !== a && !b.el.contains(a.el) && !a.el.contains(b.el) && (reaches(a, b.r) || (b.small && Math.hypot(a.cx - b.cx, a.cy - b.cy) < min)));
    if (crowd) found.push(`${label(a.el)} ${size}, its ${min} px circle reaches ${label(crowd.el)}`);
  }
  return found;
}

const { url, server } = await labBaseUrl();
const browser = await chromium.launch();
let failures = 0;
let targets = 0;
try {
  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    for (const path of PATHS) {
      await page.goto(new URL(path, url).href, { waitUntil: 'load' });
      targets += await page.evaluate(() => document.querySelectorAll('a[href], button, summary').length);
      const small = await page.evaluate(undersized, MIN);
      if (small.length === 0) continue;
      failures += small.length;
      console.log(`✗ ${path} @${width}\n    ${[...new Set(small)].join('\n    ')}`);
    }
    await page.close();
  }
} finally {
  await browser.close();
  server?.close();
}

if (failures > 0) {
  console.error(`\n${failures} tap targets fail 2.5.8, or are marked and below ${MIN}×${MIN} px on their own box.`);
  process.exit(1);
}
console.log(`target size: ${targets} targets on ${PATHS.length} pages at ${WIDTHS.join(' and ')}, 2.5.8 met, and the nav and tag chips at ${MIN}×${MIN} px on their own box.`);
