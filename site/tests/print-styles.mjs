/**
 * A note prints as the note, legible on paper (WEB-133 AC1).
 *
 *   npm run build && node tests/print-styles.mjs
 *
 * Notes are the pages people print or save to PDF. Without a print stylesheet
 * the paper copy carries the sticky header, the footer, the prev/next nav and
 * the closing call to action, and the code blocks lose their meaning: browsers
 * do not print backgrounds by default, so the dark theme's light text lands on
 * white paper at under 1.3:1.
 *
 * Each page in PAGES is loaded with print media emulated, and four things are
 * read from what the browser computes:
 * - the site chrome (skip link, header, footer, note nav, closing aside) is not
 *   rendered, and the note's own title is;
 * - every code token is at least 4.5:1 against white, the paper colour;
 * - no code block is wider than its box: paper cannot scroll, so a long line
 *   wraps instead of being cut off at the margin;
 * - a link to another site prints its address after the text, because paper
 *   cannot be clicked. A link inside the site does not: a bare `/notes/x/`
 *   path is no use on paper, and the site's notes carry their titles.
 */
import { chromium } from 'playwright';

import { labBaseUrl } from './lib/serve.mjs';

// Code in yaml, bash and plain text; the IDP note links to other notes.
const PAGES = ['/notes/bootstrapping-k3s-ansible/', '/notes/debugging-dns-systematic/', '/notes/building-a-homelab-idp/'];
const CHROME = {
  'skip link': 'body > a[href="#main-content"]',
  'site header': 'body > header',
  'site footer': 'body > footer',
  'note nav': 'main > nav',
  'closing aside': '[aria-labelledby="note-closing-heading"]',
};
const MIN_CONTRAST = 4.5;

/** Runs in the page: what the print layout renders, read from computed styles. */
function printed({ chrome, minContrast }) {
  const shown = (el) => el.checkVisibility({ visibilityProperty: true });
  // Any CSS colour to sRGB, through a canvas: computed colours can be oklch().
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  const rgb = (colour) => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = colour;
    ctx.fillRect(0, 0, 1, 1);
    return [...ctx.getImageData(0, 0, 1, 1).data.slice(0, 3)];
  };
  const luminance = (c) =>
    c.map((v) => v / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
  const contrast = (colour) => 1.05 / (luminance(rgb(colour)) + 0.05);

  const problems = [];
  for (const [name, selector] of Object.entries(chrome)) {
    const el = document.querySelector(selector);
    if (!el) problems.push(`${name} (${selector}) is not on the page: the check would pass on nothing`);
    else if (shown(el)) problems.push(`${name} prints`);
  }
  const title = document.querySelector('article h1');
  if (!title || !shown(title)) problems.push('the note title does not print');

  const blocks = [...document.querySelectorAll('pre.astro-code')];
  if (blocks.length === 0 && location.pathname !== '/notes/building-a-homelab-idp/') problems.push('no code block on the page');
  for (const [i, pre] of blocks.entries()) {
    if (pre.scrollWidth > pre.clientWidth + 1) problems.push(`code block ${i + 1} is ${pre.scrollWidth}px wide in a ${pre.clientWidth}px box`);
    const faint = new Set();
    const walker = document.createTreeWalker(pre, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.textContent.trim()) continue;
      const colour = getComputedStyle(node.parentElement).color;
      if (contrast(colour) < minContrast) faint.add(`${colour} (${contrast(colour).toFixed(2)}:1)`);
    }
    if (faint.size) problems.push(`code block ${i + 1} prints tokens under ${minContrast}:1 on white: ${[...faint].join(', ')}`);
  }

  // The notes link out rarely, so a link is added to the prose for the check.
  const prose = document.querySelector('article .prose');
  const outside = Object.assign(document.createElement('a'), { href: 'https://example.com/doc', textContent: 'a doc' });
  const inside = Object.assign(document.createElement('a'), { href: '/notes/', textContent: 'the notes' });
  prose.append(outside, inside);
  const after = (a) => getComputedStyle(a, '::after').content;
  if (!after(outside).includes('https://example.com/doc')) problems.push(`a link to another site prints no address (::after is ${after(outside)})`);
  if (after(inside).includes('/notes/')) problems.push('a link inside the site prints its bare path');
  outside.remove();
  inside.remove();
  return problems;
}

const { url: BASE, server } = await labBaseUrl();
const browser = await chromium.launch();
let failures = 0;
try {
  for (const path of PAGES) {
    const page = await browser.newPage({ viewport: { width: 800, height: 1100 } });
    const response = await page.goto(`${BASE}${path}`, { waitUntil: 'load' });
    if (!response?.ok()) {
      console.error(`✗ ${path}: HTTP ${response?.status()}`);
      failures++;
    } else {
      await page.emulateMedia({ media: 'print' });
      const problems = await page.evaluate(printed, { chrome: CHROME, minContrast: MIN_CONTRAST });
      for (const problem of problems) console.error(`✗ ${path}: ${problem}`);
      failures += problems.length;
      if (problems.length === 0) console.log(`  ${path} prints the note alone, its code legible and unclipped`);
    }
    await page.close();
  }
} finally {
  await browser.close();
  server?.close();
}

if (failures > 0) {
  console.error(`\n${failures} print problems`);
  process.exit(1);
}
console.log(`print styles: ${PAGES.length} notes print without chrome, with code at ${MIN_CONTRAST}:1 or more on white`);
