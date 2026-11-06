#!/usr/bin/env node
/**
 * Renders each note's social card (WEB-176).
 *
 *   npm run og:cards          # render every card whose inputs changed
 *   npm run og:cards -- --all # render every card
 *
 * One 1200×630 PNG per non-draft note, future-dated ones included, into
 * `src/assets/og/<id>.png`, with `manifest.json` recording what each was drawn
 * from (`src/lib/og-cards.mjs`). The PNGs are committed: rendering needs a
 * browser, and the build and CI only serve and check them.
 *
 * The card is the site card (`public/images/og-image.png`) with the note in
 * place of the site's name: its logo, cropped from that image rather than
 * redrawn, the same bars, Roboto from `public/fonts/`, and the site's accent.
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

import { cardHash, cardInputs, HEIGHT, WIDTH } from '../src/lib/og-cards.mjs';
import { ACCENT, PROSE_HEADING } from '../src/theme/tokens.mjs';

const SITE = join(dirname(fileURLToPath(import.meta.url)), '..');
const NOTES = join(SITE, 'src/content/notes');
const CARDS = join(SITE, 'src/assets/og');
const MANIFEST = join(CARDS, 'manifest.json');

// Chromium renders from about:blank, which cannot read local files: everything is inlined.
const dataUrl = (path, type) => `data:${type};base64,${readFileSync(join(SITE, path)).toString('base64')}`;
const FONTS = [400, 500, 700]
  .map((weight) => {
    const name = { 400: 'Regular', 500: 'Medium', 700: 'Bold' }[weight];
    return `@font-face { font-family: Roboto; font-weight: ${weight}; src: url(${dataUrl(`public/fonts/Roboto-${name}.woff2`, 'font/woff2')}) format('woff2'); }`;
  })
  .join('\n');
const SITE_CARD = dataUrl('public/images/og-image.png', 'image/png');

const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const longDate = (iso, lang) =>
  new Date(iso).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

/** The card for one note, as a page Chromium renders at 1200×630. */
function cardHtml({ id, lang, title, date, tags }) {
  const route = `mlorente.dev${lang === 'es' ? '/es' : ''}/notes/${id}/`;
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><style>
${FONTS}
* { margin: 0; box-sizing: border-box; }
body { width: ${WIDTH}px; height: ${HEIGHT}px; background: #fff; font-family: Roboto, sans-serif; position: relative; overflow: hidden; }
.bar { position: absolute; left: 0; right: 0; height: 6px; background: ${ACCENT}; }
.logo { position: absolute; left: 96px; top: 50%; width: 88px; height: 88px; margin-top: -44px;
  background: url(${SITE_CARD}) -96px -214px no-repeat; }
.text { position: absolute; left: 230px; right: 96px; top: 50%; transform: translateY(-50%); }
h1 { font-weight: 700; font-size: 54px; line-height: 1.15; color: ${PROSE_HEADING};
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.by { margin-top: 22px; font-size: 28px; color: ${ACCENT}; }
.tags { margin-top: 14px; font-size: 22px; color: #6b7280; }
.url { margin-top: 30px; font-size: 22px; color: #6b7280; }
</style></head><body>
<div class="bar" style="top:0"></div>
<div class="logo"></div>
<div class="text">
  <h1>${escape(title)}</h1>
  <p class="by">Manu Lorente · ${escape(longDate(date, lang))}</p>
  ${tags.length ? `<p class="tags">${tags.map((t) => `#${escape(t)}`).join('&ensp;')}</p>` : ''}
  <p class="url">${escape(route)}</p>
</div>
<div class="bar" style="bottom:0"></div>
</body></html>`;
}

const all = process.argv.includes('--all');
const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
const notes = readdirSync(NOTES)
  .filter((f) => /\.mdx?$/.test(f))
  .map((f) => cardInputs(f.replace(/\.mdx?$/, ''), readFileSync(join(NOTES, f), 'utf8')))
  .filter(Boolean);

const next = Object.fromEntries(notes.map((inputs) => [inputs.id, { hash: cardHash(inputs), title: inputs.title }]));
const todo = notes.filter((n) => all || manifest[n.id]?.hash !== next[n.id].hash || !existsSync(join(CARDS, `${n.id}.png`)));

if (todo.length) {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
    for (const inputs of todo) {
      await page.setContent(cardHtml(inputs));
      await page.evaluate(() => document.fonts.ready);
      writeFileSync(join(CARDS, `${inputs.id}.png`), await page.screenshot({ type: 'png' }));
      console.log(`og-cards: ${inputs.id}`);
    }
  } finally {
    await browser.close();
  }
}

// Sorted, so a regenerated manifest diffs only where a card changed.
writeFileSync(MANIFEST, `${JSON.stringify(Object.fromEntries(Object.entries(next).sort()), null, 2)}\n`);
const orphans = readdirSync(CARDS).filter((f) => f.endsWith('.png') && !next[f.replace(/\.png$/, '')]);
if (orphans.length) console.warn(`og-cards: no note for ${orphans.join(', ')}; delete them`);
console.log(`og-cards: ${todo.length} rendered, ${notes.length - todo.length} unchanged`);
