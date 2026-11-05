/**
 * The contact door (WEB-137, #499).
 *
 * The words on the page are Manu's to change, so these tests do not pin copy.
 * They pin what copy edits must not break:
 *
 *   - **The busy line is asymmetric.** It shows only while `site.nextStart` is
 *     a future date, and never otherwise.
 *   - **There is one door.** The hero's primary button leads to it, and the
 *     retired positioning (§7 of the brand package) stays gone.
 *
 * Each absence check is preceded by a guard that the page rendered something
 * (lesson-019): an empty page passes every "does not contain".
 */

import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { busyMonth } from '../src/data/availability.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(here, '..');
const distDir = join(siteRoot, 'dist');
const siteSrc = readFileSync(join(siteRoot, 'src/data/site.ts'), 'utf8');

const pages = [
  { lang: 'en', contact: 'contact/index.html', home: 'index.html', href: '/contact/' },
  { lang: 'es', contact: 'es/contact/index.html', home: 'es/index.html', href: '/es/contact/' },
];

function dist(page) {
  const file = join(distDir, page);
  assert.ok(existsSync(file), `dist/${page} must exist — run the build first`);
  return readFileSync(file, 'utf8');
}

const text = (html) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

/** The inner HTML of the first element carrying `attr`, up to the page's `</main>`. */
function block(html, attr) {
  const start = html.search(new RegExp(`<[a-z]+[^>]*\\b${attr}\\b`));
  return start < 0 ? '' : html.slice(start, html.indexOf('</main>', start));
}

/** Exactly the `<div>` carrying `attr`, nested divs included, and nothing after it. */
function element(html, attr) {
  const start = html.search(new RegExp(`<div[^>]*\\b${attr}\\b`));
  if (start < 0) return '';
  const tags = /<\/?div\b[^>]*>/g;
  tags.lastIndex = start;
  let depth = 0;
  for (let m; (m = tags.exec(html)); ) {
    depth += m[0][1] === '/' ? -1 : 1;
    if (depth === 0) return html.slice(start, tags.lastIndex);
  }
  return '';
}

for (const { lang, contact } of pages) {
  test(`[${lang}] the contact page offers one way in and quotes no price`, () => {
    const body = readFileSync(join(siteRoot, `src/content/pages/${lang}-contact.mdx`), 'utf8');
    assert.ok(body.includes('<Door />'), `${lang}-contact.mdx must place <Door />`);
    assert.doesNotMatch(text(dist(contact).match(/<main[\s\S]*<\/main>/)?.[0] ?? ''), /[$€]\s?\d/, `dist/${contact} quotes a price`);
  });
}

test('each locale renders its own door', () => {
  const [en, es] = pages.map(({ contact }) => text(element(dist(contact), 'data-door')));
  assert.ok(en.length > 0 && es.length > 0, 'a door rendered empty');
  assert.notEqual(es, en, 'the Spanish and English doors are identical: the locale did not reach the component');
});

// ── The busy line is asymmetric ────────────────────────────────────────────

test('busyMonth says nothing without a date, on it, or after it', () => {
  const now = new Date('2026-10-15T12:00:00Z');
  assert.equal(busyMonth(null, now, 'en-US'), null);
  assert.equal(busyMonth('2026-10-01', now, 'en-US'), null);
  assert.equal(busyMonth('2026-10-15', new Date('2026-10-15T00:00:00Z'), 'en-US'), null);
});

test('busyMonth names the month, in the locale, while the date is ahead', () => {
  const now = new Date('2026-10-15T12:00:00Z');
  // The 1st at UTC midnight: a zone-less format would roll it back to October.
  assert.equal(busyMonth('2026-11-01', now, 'en-US'), 'November');
  assert.equal(busyMonth('2026-11-01', now, 'es-ES'), 'noviembre');
});

test('busyMonth rejects a date it cannot read', () => {
  assert.throws(() => busyMonth('November', new Date(), 'en-US'), /YYYY-MM-DD/);
});

const nextStart = siteSrc.match(/\bnextStart:\s*(null|'(\d{4}-\d{2}-\d{2})')/);
for (const { lang, contact } of pages) {
  test(`[${lang}] the busy line renders exactly when site.nextStart is ahead of the build`, () => {
    assert.ok(nextStart, 'site.ts must declare nextStart as null or a quoted YYYY-MM-DD');
    const html = dist(contact);
    assert.ok(text(element(html, 'data-door')).length > 0, `dist/${contact}: the door did not render`);
    const busy = busyMonth(nextStart[2] ?? null, new Date(), 'en-US') !== null;
    assert.equal(/\bdata-busy\b/.test(html), busy, `dist/${contact}: busy line ${busy ? 'missing' : 'shown with no future date'}`);
  });
}

// ── One door ───────────────────────────────────────────────────────────────

for (const { lang, contact, home, href } of pages) {
  test(`[${lang}] the door is a plain mailto with nothing prefilled`, () => {
    const door = element(dist(contact), 'data-door');
    const mailto = door.match(/href="(mailto:[^"]+)"/)?.[1] ?? '';
    // Manu, #586: "que no salga nada escrito, es un simple email".
    assert.equal(mailto, 'mailto:manu@mlorente.dev', `dist/${contact}: the door mail carries a subject or body`);
  });

  test(`[${lang}] the door offers LinkedIn as the second way in`, () => {
    const door = element(dist(contact), 'data-door');
    assert.match(door, /<a\b[^>]*data-linkedin[^>]*href="https:\/\/www\.linkedin\.com\/in\/manloralm\/"/, `dist/${contact}: no LinkedIn link in the door`);
  });

  test(`[${lang}] the home opens on a button to the contact page`, () => {
    const html = dist(home);
    const hero = html.match(/<h1[\s\S]*?(?=<section)/)?.[0] ?? '';
    assert.match(hero, /data-home-door/, `dist/${home}: the contact button is not in the hero`);
    const button = html.match(/<a\b[^>]*data-home-door[^>]*>/)?.[0] ?? '';
    assert.match(button, new RegExp(`href="${href}"`), `dist/${home}: the home's button does not open ${href}`);
  });

  test(`[${lang}] the contact page carries none of the retired positioning`, () => {
    const page = text(block(dist(contact), 'data-contact'));
    assert.ok(page.length > 100, `dist/${contact}: the contact page rendered empty`);
    const retired = [/Service-as-a-Software/i, /sovereign|soberan/i, /100\s?%/, /technical debt|deuda técnica/i, /deterministic|determinist/i];
    const found = retired.filter((re) => re.test(page)).map(String);
    assert.deepEqual(found, [], `dist/${contact} still says: ${found.join(', ')}`);
  });
}
