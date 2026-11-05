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
 *
 * Below sm (640px) the nav items sit behind a `<details>` menu (WEB-042), and
 * from sm up in a row: exactly one of the two is displayed at every width. At
 * 320px the menu is driven by keyboard alone: Tab reaches the toggle, Enter
 * opens it, the next Tab lands on a menu link at least 44px tall, and Enter on
 * the toggle closes it again.
 */
import { chromium } from 'playwright';

import { labBaseUrl } from './lib/serve.mjs';

const WIDTHS = [320, 375, 390, 454, 639, 640, 768, 1440];
const SM = 640;
const WIDE_COLUMN = ['/', '/es/', '/lab/', '/es/lab/', '/ai/', '/es/ai/'];
const OTHERS = ['/notes/', '/es/notes/', '/contact/', '/es/contact/', '/projects/', '/es/projects/', '/notes/building-a-homelab-idp/'];

function measure() {
  const box = (element) => {
    const { left, right, top, bottom } = element.getBoundingClientRect();
    return { left, right, top, bottom };
  };
  const header = document.querySelector('header');
  const brand = header.querySelector('[data-header-brand]');
  const row = header.querySelector('[data-header-links]');
  const toggle = header.querySelector('[data-header-menu] > summary');
  const shown = (element) => element && element.getBoundingClientRect().width > 0;
  const links = shown(row) ? row : toggle;
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
    rowShown: shown(row),
    toggleShown: shown(toggle),
    h1: box(document.querySelector('main h1')),
    overflow: document.documentElement.scrollWidth - innerWidth,
  };
}

function problems(m, { alignsWithH1, width }) {
  if (!m.brand || !m.links) return ['header has no brand or links group'];
  const found = [];
  if (m.rowShown === m.toggleShown) found.push(`row shown: ${m.rowShown}, menu toggle shown: ${m.toggleShown}; exactly one should be`);
  if (width < SM && m.rowShown) found.push(`the row is shown below ${SM}px, where the menu belongs`);
  if (width >= SM && m.toggleShown) found.push(`the menu toggle is shown at ${SM}px and up, where the row belongs`);
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
      const found = problems(await page.evaluate(measure), { alignsWithH1: WIDE_COLUMN.includes(path), width });
      if (found.length > 0) {
        console.error(`✗ ${where}: ${found.join('; ')}`);
        failures++;
      }
    }
    await page.close();
  }
}

/** The menu at 320px, by keyboard alone: what each step leaves focused and open. */
async function keyboardPass(path) {
  const page = await browser.newPage({ viewport: { width: 320, height: 800 } });
  await page.goto(`${BASE}${path}`, { waitUntil: 'load' });
  const state = () =>
    page.evaluate(() => {
      const menu = document.querySelector('[data-header-menu]');
      const active = document.activeElement;
      return {
        open: menu.open,
        onToggle: active === menu.querySelector('summary'),
        inMenu: menu.contains(active) && active.tagName === 'A',
        height: active.getBoundingClientRect().height,
      };
    });
  const found = [];
  let step;
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
    step = await state();
    if (step.onToggle) break;
  }
  if (!step.onToggle) {
    // Enter on whatever has focus instead would follow a link.
    await page.close();
    return ['Tab never reached the menu toggle'];
  }
  await page.keyboard.press('Enter');
  if (!(await state()).open) found.push('Enter on the toggle did not open the menu');
  await page.keyboard.press('Tab');
  step = await state();
  if (!step.inMenu) found.push('the Tab after opening did not land on a menu link');
  else if (step.height < 44) found.push(`a menu link is ${step.height}px tall, under 44px`);
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Enter');
  if ((await state()).open) found.push('Enter on the toggle did not close the menu');
  await page.close();
  return found;
}

for (const path of ['/', '/es/']) {
  checks++;
  const found = await keyboardPass(path);
  if (found.length > 0) {
    console.error(`✗ ${path} menu by keyboard at 320px: ${found.join('; ')}`);
    failures++;
  }
}

/**
 * The open menu on a short screen: the header is sticky, so the page scrolling
 * does not bring the panel's last row into view. Every menu link must be
 * reachable on screen, by scrolling the panel itself if it has to.
 */
async function shortScreen(path, viewport) {
  const page = await browser.newPage({ viewport });
  await page.goto(`${BASE}${path}`, { waitUntil: 'load' });
  await page.click('[data-header-menu] > summary');
  const off = [];
  for (const link of await page.locator('[data-header-menu] a').all()) {
    await link.focus();
    const box = await link.evaluate((el) => {
      const { top, bottom } = el.getBoundingClientRect();
      return { top, bottom, text: el.textContent.trim() };
    });
    if (box.top < 0 || box.bottom > viewport.height) off.push(`"${box.text}" spans ${Math.round(box.top)}–${Math.round(box.bottom)}px`);
  }
  await page.close();
  return off;
}

for (const viewport of [{ width: 568, height: 320 }, { width: 320, height: 480 }]) {
  for (const path of ['/', '/es/']) {
    checks++;
    const off = await shortScreen(path, viewport);
    if (off.length > 0) {
      console.error(`✗ ${path} open menu at ${viewport.width}×${viewport.height}: off screen when focused: ${off.join('; ')}`);
      failures++;
    }
  }
}

await browser.close();
server?.close();

if (failures > 0) {
  console.error(`\n${failures} of ${checks} header layouts failed`);
  process.exit(1);
}
console.log(`header layout: ${checks} checks, one nav control shown at each width, the menu works by keyboard`);
