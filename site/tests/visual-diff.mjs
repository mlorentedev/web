/**
 * Computed-style diff between two builds (WEB-022, AC6).
 *
 *   node tests/visual-diff.mjs capture <out.json>   # computed styles, every page
 *   node tests/visual-diff.mjs compare <a.json> <b.json>
 *   node tests/visual-diff.mjs shots <dir>           # full-page PNGs, SHOT_PATHS
 *   node tests/visual-diff.mjs pixels <dirA> <dirB>
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

// AC6's pages, both locales, plus the two `divide-y` lists: the one place where
// Tailwind 4 moves a border into a different box, so the style diff reports a
// 1px box shift that only pixels can confirm is invisible.
const SHOT_PATHS = [
  '/', '/es/', '/lab/', '/es/lab/', '/contact/', '/es/contact/',
  '/notes/network-topology-hybrid/', '/notes/', '/tags/homelab/', '/legal/privacy/',
];

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

/**
 * Pin everything a page fetches at runtime, so two captures of one build agree.
 *
 * The Lab's reachability console calls `api.kubelab.live/health` on load and the
 * landing asks the GitHub API for repository counts. Left live, both paint
 * whatever the network answered at that moment: an adversarial review of WEB-022
 * caught two captures of the *same* build differing on `/lab` at 320 px. The
 * console gets the healthy fixture `lab-axe.mjs` uses; every other request that
 * leaves the local server is aborted, which the pages answer with their
 * committed fallbacks.
 */
async function pinNetwork(page, base) {
  const healthy = {
    status: 'healthy',
    timestamp: '2026-09-01T12:00:00.000Z',
    checks: [
      { component: 'database', status: 'healthy' },
      { component: 'cache', status: 'healthy' },
      { component: 'beehiiv', status: 'healthy' },
      { component: 'runtime', status: 'healthy' },
    ],
  };
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (url.startsWith(base)) return route.continue();
    if (/\/health(\?|$)/.test(url)) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(healthy) });
    }
    return route.abort();
  });
}

/**
 * Load a page and let it settle: fonts in, runtime requests answered, and the
 * Lab console's two live readings, the visitor's clock and the round-trip
 * time, replaced with fixed text. Those change on every load by design, and
 * with the network pinned they were the last thing making two captures of one
 * build differ (137 to 1,016 px on the Lab pages, measured).
 */
async function settle(page, url) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (const el of document.querySelectorAll('[data-probe-clock], [data-probe-latency]')) {
      el.textContent = '(live value)';
    }
  });
}

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
      await pinNetwork(page, base);
      for (const path of paths) {
        await settle(page, base + path);
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
          // Tailwind 4 serialises the same colour differently (`oklab(…)` for
          // an opacity modifier, where 3 gave `rgba(…)`), writes `rounded-full`
          // as an infinite radius, and pads shadows with transparent layers.
          // None of that is visible, so it is normalised away here: a canvas
          // re-serialises any CSS colour as sRGB hex or rgba, which is what the
          // screen shows.
          // Paint the colour into one pixel and read it back: the screen's own
          // answer, whatever notation produced it. (A canvas's `fillStyle`
          // getter keeps `oklab(…)` as written, so it cannot be the normaliser.)
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = 1;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          const pixel = (c) => {
            ctx.clearRect(0, 0, 1, 1);
            ctx.fillStyle = c;
            ctx.fillRect(0, 0, 1, 1);
            const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
            return `rgba(${r},${g},${b},${a})`;
          };
          const colour = (v) => v.replace(/(?:rgba?|oklab|oklch|lab|lch|color)\([^()]*\)/g, pixel);
          const normalise = (p, v, cs) => {
            let out = colour(v);
            if (p === 'box-shadow') {
              out = out.split(/,(?![^()]*\))/).map((l) => l.trim())
                .filter((l) => !/^rgba\(0,0,0,0\) 0px 0px 0px 0px$/.test(l)).join(', ') || 'none';
            }
            if (p.endsWith('radius') && parseFloat(out) >= 9999) out = 'full';
            // Tailwind 4 writes the even stop positions (`0%`, `50%`, `100%`)
            // that Tailwind 3 left implicit. Same gradient.
            if (p === 'background-image' && /gradient\(/.test(out)) {
              out = out.replace(/ (?:0|50|100)%(?=[,)])/g, '');
            }
            // A border side with no width shows no colour.
            const side = p.match(/^border-(top|right|bottom|left)-color$/);
            if (side && cs.getPropertyValue(`border-${side[1]}-width`) === '0px') out = '-';
            return out;
          };
          const styles = {};
          for (const el of document.body.querySelectorAll('*')) {
            const cs = getComputedStyle(el);
            // Where the element actually is. Margins that move from one side
            // to the other (Tailwind 4's `space-*` and `divide-*`) are only a
            // visible change if they move something, and this is what says so.
            const r = el.getBoundingClientRect();
            const box = [r.left, r.top + window.scrollY].map((n) => n.toFixed(2)).join(',');
            styles[id(el)] = [...props.map((p) => normalise(p, cs.getPropertyValue(p), cs)), box].join('|');
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
  writeFileSync(out, JSON.stringify({ properties: [...PROPERTIES, 'position'], pages: result }));
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

async function shots(dir) {
  const { mkdirSync } = await import('node:fs');
  mkdirSync(dir, { recursive: true });
  const { url: base, server } = await labBaseUrl();
  const browser = await chromium.launch();
  try {
    for (const width of WIDTHS) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await pinNetwork(page, base);
      for (const path of SHOT_PATHS) {
        await settle(page, base + path);
        const name = `${width}${path.replace(/\//g, '_')}.png`;
        await page.screenshot({ path: `${dir}/${name}`, fullPage: true, animations: 'disabled', caret: 'hide' });
      }
      await page.close();
    }
  } finally {
    await browser.close();
    server?.close();
  }
  console.log(`${WIDTHS.length * SHOT_PATHS.length} screenshots → ${dir}`);
}

/** Pixel-by-pixel, in the browser's own decoder: no image library needed. */
async function pixels(dirA, dirB) {
  const { readdirSync } = await import('node:fs');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  let failed = 0;
  try {
    for (const name of readdirSync(dirA).filter((f) => f.endsWith('.png')).sort()) {
      const [a, b] = [dirA, dirB].map((d) => `data:image/png;base64,${readFileSync(`${d}/${name}`).toString('base64')}`);
      const r = await page.evaluate(async ([srcA, srcB]) => {
        const load = (src) => new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = src; });
        const [ia, ib] = await Promise.all([load(srcA), load(srcB)]);
        if (ia.width !== ib.width || ia.height !== ib.height) {
          return { size: `${ia.width}x${ia.height} vs ${ib.width}x${ib.height}`, diff: -1 };
        }
        const data = (img) => {
          const c = new OffscreenCanvas(img.width, img.height);
          const x = c.getContext('2d');
          x.drawImage(img, 0, 0);
          return x.getImageData(0, 0, img.width, img.height).data;
        };
        const [da, db] = [data(ia), data(ib)];
        let diff = 0;
        for (let i = 0; i < da.length; i += 4) {
          if (da[i] !== db[i] || da[i + 1] !== db[i + 1] || da[i + 2] !== db[i + 2]) diff++;
        }
        return { size: `${ia.width}x${ia.height}`, diff };
      }, [a, b]);
      if (r.diff !== 0) failed++;
      console.log(`${r.diff === 0 ? 'same' : 'DIFF'}  ${name}  ${r.size}  ${r.diff < 0 ? 'size differs' : `${r.diff} px differ`}`);
    }
  } finally {
    await browser.close();
  }
  process.exitCode = failed === 0 ? 0 : 1;
}

const [mode, ...args] = process.argv.slice(2);
if (mode === 'capture' && args.length === 1) await capture(args[0]);
else if (mode === 'compare' && args.length === 2) compare(args[0], args[1]);
else if (mode === 'shots' && args.length === 1) await shots(args[0]);
else if (mode === 'pixels' && args.length === 2) await pixels(args[0], args[1]);
else {
  console.error('usage: visual-diff.mjs capture <out.json> | compare <a.json> <b.json> | shots <dir> | pixels <a> <b>');
  process.exitCode = 2;
}
