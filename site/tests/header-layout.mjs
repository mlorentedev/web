/**
 * The header lays out its avatar instead of floating it over the nav (#118).
 *
 *   npm run build && node tests/header-layout.mjs
 *
 * Measured in a real browser, because only layout knows when two boxes touch:
 * the labels differ per locale, and a page without a translation drops the
 * language link, so one width on one page proves nothing about the rest.
 *
 * The header follows the wide column (`max-w-6xl`), so its brand link starts on
 * the same axis as the h1 of the pages set in that column. The narrow reading
 * pages centre a 768px column inside it, and a header that changed width
 * between pages would jump on every navigation.
 */
import { chromium } from 'playwright';

import { labBaseUrl } from './lib/serve.mjs';

const WIDTHS = [320, 375, 390, 454, 768, 1440];
const WIDE_COLUMN = ['/', '/es/', '/lab/', '/es/lab/', '/ai/', '/es/ai/'];
const OTHERS = ['/notes/', '/es/notes/', '/contact/', '/es/contact/', '/projects/', '/notes/building-a-homelab-idp/'];

function measure() {
  const box = (element) => {
    const { left, right, top, bottom } = element.getBoundingClientRect();
    return { left, right, top, bottom };
  };
  const header = document.querySelector('header');
  const brand = header.querySelector('[data-header-brand]');
  const links = header.querySelector('[data-header-links]');
  const avatar = brand.querySelector('img');
  const positioned = [];
  for (let node = avatar; node !== header; node = node.parentElement) {
    positioned.push(getComputedStyle(node).position);
  }
  return {
    header: box(header),
    brand: brand && box(brand),
    links: links && box(links),
    avatar: box(avatar),
    positioned,
    h1: box(document.querySelector('main h1')),
    overflow: document.documentElement.scrollWidth - innerWidth,
  };
}

function problems(m, { alignsWithH1 }) {
  if (!m.brand || !m.links) return ['header has no brand or links group'];
  const found = [];
  if (m.positioned.some((position) => position === 'fixed' || position === 'absolute')) {
    found.push('avatar is out of the flow');
  }
  if (m.brand.right > m.links.left) found.push(`brand ends at ${m.brand.right}, links start at ${m.links.left}`);
  if (m.avatar.right > m.links.left) found.push(`avatar ends at ${m.avatar.right}, links start at ${m.links.left}`);
  if (m.avatar.bottom > m.header.bottom) found.push(`avatar hangs ${m.avatar.bottom - m.header.bottom}px below the header`);
  if (m.overflow > 0) found.push(`page overflows by ${m.overflow}px`);
  if (alignsWithH1 && Math.abs(m.brand.left - m.h1.left) > 0.5) {
    found.push(`brand starts at ${m.brand.left}, h1 at ${m.h1.left}`);
  }
  return found;
}

const { url: BASE, server } = await labBaseUrl();
const browser = await chromium.launch();
let failures = 0;
let checks = 0;

for (const path of [...WIDE_COLUMN, ...OTHERS]) {
  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 800 } });
    const where = `${path} @ ${width}px`;
    const response = await page.goto(`${BASE}${path}`, { waitUntil: 'load' });
    if (!response?.ok()) {
      console.error(`✗ ${where}: HTTP ${response?.status()}`);
      failures++;
    } else {
      await page.evaluate(() => document.fonts.ready);
      checks++;
      const found = problems(await page.evaluate(measure), { alignsWithH1: WIDE_COLUMN.includes(path) });
      if (found.length > 0) {
        console.error(`✗ ${where}: ${found.join('; ')}`);
        failures++;
      }
    }
    await page.close();
  }
}

await browser.close();
server?.close();

if (failures > 0) {
  console.error(`\n${failures} of ${checks} header layouts failed`);
  process.exit(1);
}
console.log(`header layout: ${checks} page and width pairs`);
