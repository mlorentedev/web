/**
 * The first screen of the home (WEB-140, AC1).
 *
 *   npm run build && node tests/home-first-screen.mjs
 *
 * Whoever lands on the home and reads nothing else must still see who this is
 * and how to hire him: the label, the H1 and the door, without scrolling, on a
 * laptop and on a phone, in both locales. Measured in a real browser because
 * only layout knows where the fold falls: a longer subtitle or a bigger H1
 * pushes the door down without changing a byte of the markup around it.
 *
 * The viewports are the small end of each class: a 1280 × 720 laptop, and a
 * 400 × 740 phone (a 390–412 px wide phone minus its browser chrome).
 */

import { chromium } from 'playwright';

import { labBaseUrl } from './lib/serve.mjs';

const { url: BASE, server: served } = await labBaseUrl();
const PATHS = ['/', '/es/'];
const VIEWPORTS = [
  { width: 1280, height: 720 },
  { width: 400, height: 740 },
];

// The door is the hero's first link after the H1 (contact.test pins its href).
const TARGETS = {
  label: '[data-hero-label]',
  h1: 'main h1',
  door: '[data-hero-door]',
};

const browser = await chromium.launch();
let failures = 0;

for (const path of PATHS) {
  for (const viewport of VIEWPORTS) {
    const page = await browser.newPage({ viewport });
    const where = `${path} @ ${viewport.width}×${viewport.height}`;
    try {
      const response = await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
      if (!response?.ok()) throw new Error(`HTTP ${response?.status()}`);
      const below = [];
      for (const [name, selector] of Object.entries(TARGETS)) {
        const box = await page.locator(selector).first().boundingBox({ timeout: 2000 }).catch(() => null);
        if (!box) below.push(`${name} not found (${selector})`);
        else if (box.y + box.height > viewport.height) below.push(`${name} ends at ${Math.round(box.y + box.height)}px`);
      }
      if (below.length > 0) {
        failures++;
        console.error(`✗ ${where} — below the fold: ${below.join('; ')}`);
      } else {
        console.log(`✓ ${where} — label, H1 and door on the first screen`);
      }
    } catch (error) {
      failures++;
      console.error(`✗ ${where} — ${error.message}`);
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
console.log('\nThe first screen holds the label, the H1 and the door.');
