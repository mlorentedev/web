/**
 * Every keyboard stop shows an indicator a keyboard user can see (#114).
 *
 *   npm run build && npm run test:a11y
 *
 * axe has no focus-indicator rule, so its pass says nothing here. This presses
 * Tab through the built pages and reads what the browser computes on each stop:
 * an outline at least 2px wide and at least 3:1 against what lies behind the
 * element (WCAG 2.4.7, 1.4.11). Then it clicks a link and requires no outline,
 * because `:focus-visible` is what keeps the ring away from mouse users.
 *
 * A computed outline can still paint nothing: the avatar link read `2px solid`
 * and showed no ring. So each stop is also screenshotted with and without focus,
 * and the two must differ.
 *
 * Transitions and smooth scrolling are off: a reading taken mid-fade measures a
 * colour nobody ends up seeing, and a clip taken mid-scroll misses the element.
 *
 * A run that reaches no stops fails: a page that never loaded has no bad ones.
 */
import { chromium } from 'playwright';

import { indicatorProblems } from './lib/focus.mjs';
import { labBaseUrl } from './lib/serve.mjs';

const PATHS = [
  '/',
  '/es',
  '/notes',
  '/es/notes',
  '/lab',
  '/es/lab',
  '/lab/idp',
  '/lab/idp/architecture',
  '/ai',
  '/es/ai',
  '/projects',
  '/es/projects',
  '/contact',
  '/notes/building-a-homelab-idp',
  '/404.html',
];

const MAX_STOPS = 300;

/** The active element's name and computed indicator, or null once focus left the page. */
function readStop() {
  const element = document.activeElement;
  if (!element || element === document.body) return null;
  const style = getComputedStyle(element);
  const layers = [];
  for (let node = element.parentElement; node; node = node.parentElement) {
    const { backgroundColor, backgroundImage } = getComputedStyle(node);
    layers.push({ backgroundColor, backgroundImage });
  }
  return {
    name: `${element.tagName.toLowerCase()} "${(element.textContent ?? '').trim().slice(0, 40)}"`,
    outlineStyle: style.outlineStyle,
    outlineWidth: style.outlineWidth,
    outlineColor: style.outlineColor,
    layers,
  };
}

/** Whether focusing the active element changes a pixel around it. */
async function paintsIndicator(page) {
  const clip = await page.evaluate(() => {
    const { x, y, right, bottom } = document.activeElement.getBoundingClientRect();
    const [left, top] = [Math.max(0, x - 6), Math.max(0, y - 6)];
    const width = Math.min(innerWidth, right + 6) - left;
    const height = Math.min(innerHeight, bottom + 6) - top;
    return { x: left, y: top, width, height };
  });
  if (clip.width <= 0 || clip.height <= 0) return false;
  const focused = await page.screenshot({ clip });
  await page.evaluate(() => {
    window.__stop = document.activeElement;
    window.__stop.blur();
  });
  const blurred = await page.screenshot({ clip });
  await page.evaluate(() => window.__stop.focus());
  return !focused.equals(blurred);
}

const { url: BASE, server } = await labBaseUrl();
const browser = await chromium.launch();
let failures = 0;
let stops = 0;

for (const path of PATHS) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const response = await page.goto(`${BASE}${path}`, { waitUntil: 'load' });
  if (!response?.ok()) {
    console.error(`✗ ${path} — HTTP ${response?.status()}`);
    failures++;
    await page.close();
    continue;
  }
  await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; scroll-behavior: auto !important; }' });

  let onPage = 0;
  const bad = [];
  for (let i = 0; i < MAX_STOPS; i++) {
    await page.keyboard.press('Tab');
    const stop = await page.evaluate(readStop);
    if (!stop) break;
    onPage++;
    let problems;
    try {
      problems = indicatorProblems(stop);
    } catch (error) {
      problems = [error.message];
    }
    if (!(await paintsIndicator(page))) problems.push('focus paints nothing');
    if (problems.length > 0) bad.push(`${stop.name}: ${problems.join('; ')}`);
  }
  stops += onPage;

  await page.mouse.move(0, 0);
  await page.evaluate(() => document.activeElement?.blur());
  const link = page.locator('header a').first();
  await page.evaluate(() => {
    document.querySelector('header a').addEventListener('click', (event) => event.preventDefault());
  });
  await link.click();
  const clicked = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
  if (clicked !== 'none') bad.push(`clicked header link shows outline-style ${clicked}`);

  if (onPage === 0) bad.push('no focus stops reached');
  if (bad.length > 0) {
    failures++;
    console.error(`✗ ${path} — ${bad.length} problem(s):\n    ${bad.join('\n    ')}`);
  } else {
    console.log(`✓ ${path} — ${onPage} stops`);
  }
  await page.close();
}

await browser.close();
server?.close();

if (stops === 0) {
  console.error('✗ no focus stops reached on any page');
  failures++;
}
if (failures > 0) {
  console.error(`\n${failures} page(s) failed the focus indicator check`);
  process.exit(1);
}
console.log(`\nfocus indicator: ${stops} stops across ${PATHS.length} pages`);
