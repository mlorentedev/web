/**
 * Computed-style diff between two builds (WEB-022, AC6).
 *
 *   node tests/visual-diff.mjs capture <out.json>   # over the current dist/
 *   node tests/visual-diff.mjs compare <a.json> <b.json>
 *
 * Tailwind 4 must not change how the site looks, and the palette decision for
 * this migration (pin the v3 hex values) sets that budget at zero. Screenshots
 * would say *that* a page changed; this says *which element and which property*,
 * which is what the next edit needs. For every element of every built page, at
 * 320 and 1440 px, it records what the browser actually applied (colours,
 * borders, type, box model), then compares two captures property by property.
 *
 * The baseline is not committed: it is reproducible from any commit by building
 * it and running `capture`, and a multi-megabyte fixture would be a diff nobody
 * reviews. `specs/WEB-022/verification.md` records the commits compared and the
 * result.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

import { distDir, labBaseUrl } from './lib/serve.mjs';

const WIDTHS = [320, 1440];

// What a Tailwind upgrade can move. Colours first: those are what the palette
// decision promises. The box model catches renamed or rescaled utilities
// (`shadow-sm`, `rounded`, `ring`), and size catches everything they push.
const PROPERTIES = [
  'color', 'background-color', 'background-image',
  'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
  'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
  'border-top-style', 'border-top-left-radius', 'border-bottom-right-radius',
  'outline-color', 'box-shadow', 'text-decoration-line', 'text-decoration-color',
  'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing',
  'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'display', 'gap', 'opacity', 'width', 'height',
];

/** Every built page's URL path, from the files in `dist/`. */
async function pagePaths() {
  const { readdirSync } = await import('node:fs');
  const { join, relative } = await import('node:path');
  const walk = (dir) =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith('.html') ? [join(dir, e.name)] : [],
    );
  return walk(distDir)
    .map((file) => '/' + relative(distDir, file).replace(/index\.html$/, '').replace(/\\/g, '/'))
    .sort();
}

async function capture(out) {
  const { url: base, server } = await labBaseUrl();
  const browser = await chromium.launch();
  const result = {};
  try {
    const paths = await pagePaths();
    for (const width of WIDTHS) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      for (const path of paths) {
        await page.goto(base + path, { waitUntil: 'load' });
        await page.evaluate(() => document.fonts.ready);
        result[`${width} ${path}`] = await page.evaluate((props) => {
          // Identity is the element's position in the tree, which is stable
          // across two builds of the same content.
          const id = (el) => {
            const parts = [];
            for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
              const i = e.parentElement ? [...e.parentElement.children].indexOf(e) : 0;
              parts.unshift(`${e.tagName.toLowerCase()}:${i}`);
            }
            return parts.join('>');
          };
          const styles = {};
          for (const el of document.body.querySelectorAll('*')) {
            const cs = getComputedStyle(el);
            styles[id(el)] = props.map((p) => cs.getPropertyValue(p)).join('|');
          }
          return styles;
        }, PROPERTIES);
      }
      await page.close();
    }
  } finally {
    await browser.close();
    server?.close();
  }
  writeFileSync(out, JSON.stringify({ properties: PROPERTIES, pages: result }));
  const elements = Object.values(result).reduce((n, s) => n + Object.keys(s).length, 0);
  console.log(`captured ${Object.keys(result).length} page×width views, ${elements} elements → ${out}`);
}

function compare(aFile, bFile) {
  const a = JSON.parse(readFileSync(aFile, 'utf8'));
  const b = JSON.parse(readFileSync(bFile, 'utf8'));
  const props = a.properties;
  const byProperty = new Map();
  const examples = [];
  let differing = 0;

  const views = new Set([...Object.keys(a.pages), ...Object.keys(b.pages)]);
  for (const view of views) {
    const pa = a.pages[view];
    const pb = b.pages[view];
    if (!pa || !pb) {
      differing++;
      examples.push(`${view}: only in ${pa ? aFile : bFile}`);
      continue;
    }
    for (const el of new Set([...Object.keys(pa), ...Object.keys(pb)])) {
      if (pa[el] === pb[el]) continue;
      differing++;
      if (!pa[el] || !pb[el]) {
        byProperty.set('(element added or removed)', (byProperty.get('(element added or removed)') ?? 0) + 1);
        if (examples.length < 20) examples.push(`${view} ${el}: ${pa[el] ? 'removed' : 'added'}`);
        continue;
      }
      const va = pa[el].split('|');
      const vb = pb[el].split('|');
      props.forEach((p, i) => {
        if (va[i] === vb[i]) return;
        byProperty.set(p, (byProperty.get(p) ?? 0) + 1);
        if (examples.length < 20) examples.push(`${view} ${el}: ${p} ${va[i]} → ${vb[i]}`);
      });
    }
  }

  console.log(`${views.size} views compared; ${differing} element(s) differ`);
  for (const [p, n] of [...byProperty].sort((x, y) => y[1] - x[1])) console.log(`  ${p}: ${n}`);
  for (const line of examples) console.log(`  e.g. ${line}`);
  process.exitCode = differing === 0 ? 0 : 1;
}

const [mode, ...args] = process.argv.slice(2);
if (mode === 'capture' && args.length === 1) await capture(args[0]);
else if (mode === 'compare' && args.length === 2) compare(args[0], args[1]);
else {
  console.error('usage: visual-diff.mjs capture <out.json> | compare <a.json> <b.json>');
  process.exitCode = 2;
}
