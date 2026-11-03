/**
 * `capture` reads a page that has stopped moving (#412).
 *
 *   npm run build && node tests/visual-diff-motion.mjs
 *
 * `getComputedStyle()` reports an animated property at whichever frame it runs,
 * so an animation running during `capture` reads as a style change between two
 * captures of one build. The Lab is the page that has animations: if it ever
 * loses them, the first assertion says this check no longer proves anything.
 */
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

import { freezeMotion } from './lib/motion.mjs';
import { labBaseUrl } from './lib/serve.mjs';

const running = () => document.getAnimations().length;

const { url: base, server } = await labBaseUrl();
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${base}/lab/`, { waitUntil: 'networkidle' });
  assert.ok((await page.evaluate(running)) > 0, 'the Lab has no animation left to freeze');
  await freezeMotion(page);
  assert.equal(await page.evaluate(running), 0);
  console.log('visual-diff-motion: no animation runs after freezeMotion');
} finally {
  await browser.close();
  server?.close();
}
