/**
 * The contact door and the offer ladder (WEB-137, AC4).
 *
 * The words on the page are Manu's to change, so these tests do not pin copy.
 * They pin the three things copy edits must not break:
 *
 *   - **Figures have one source.** Every price and duration is in
 *     `data/offer.ts`; the markdown states none, and both locales render the
 *     same ones. Two languages quoting two prices is the failure this prevents.
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
const offerSrc = readFileSync(join(siteRoot, 'src/data/offer.ts'), 'utf8');
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

/** The figure a field of `offer.ts` holds, e.g. `fromUsd: 300` → `300`. */
function offerField(name) {
  const value = offerSrc.match(new RegExp(`\\b${name}:\\s*(\\d+)`))?.[1];
  assert.ok(value, `offer.ts has no numeric \`${name}\``);
  return value;
}

// ── Figures have one source ────────────────────────────────────────────────

const expected = [
  `$${offerField('fromUsd')}`,
  offerField('minutes'),
  offerField('creditDays'),
  `${offerField('minWeeks')}–${offerField('maxWeeks')}`,
];

for (const { lang, contact } of pages) {
  test(`[${lang}] the offer block quotes every figure in offer.ts`, () => {
    const offer = text(element(dist(contact), 'data-offer'));
    assert.ok(offer.length > 100, `dist/${contact}: the offer block is missing or empty`);
    const missing = expected.filter((f) => !offer.includes(f));
    assert.deepEqual(missing, [], `dist/${contact}: offer block lacks ${missing.join(', ')}`);
  });

  test(`[${lang}] the contact markdown states no figure of its own`, () => {
    const raw = readFileSync(join(siteRoot, `src/content/pages/${lang}-contact.mdx`), 'utf8');
    const body = raw.replace(/^---[\s\S]*?---/, '');
    assert.ok(body.includes('<Offer />') && body.includes('<Door />'), `${lang}-contact.mdx must place <Door /> and <Offer />`);
    assert.deepEqual(body.match(/\d+/g) ?? [], [], `${lang}-contact.mdx: figures belong in src/data/offer.ts`);
  });
}

test('both locales quote the same figures', () => {
  const [en, es] = pages.map(({ contact }) => text(element(dist(contact), 'data-offer')).match(/\$?\d+(?:–\d+)?/g) ?? []);
  assert.ok(en.length >= expected.length, 'the English offer block quotes no figures');
  assert.deepEqual([...es].sort(), [...en].sort());
});

test('each locale renders its own words around those figures', () => {
  // The offer and the door are placed from the markdown with no `lang` prop; they
  // read the page's locale (lesson 056). If that broke, both pages would render the
  // same language, and the figure checks above would still pass.
  // `element`, not `block`: the markdown after the offer is already Spanish on the
  // Spanish page, so a slice running on to </main> would differ even with an
  // all-English offer.
  const [en, es] = pages.map(({ contact }) => text(element(dist(contact), 'data-offer')));
  assert.ok(en.length > 100 && es.length > 100, 'an offer block rendered empty');
  assert.notEqual(es, en, 'the Spanish and English offer blocks are identical: the locale did not reach the component');
  const [enDoor, esDoor] = pages.map(({ contact }) => text(element(dist(contact), 'data-door')));
  assert.notEqual(esDoor, enDoor, 'the Spanish and English doors are identical: the locale did not reach the component');
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
  test(`[${lang}] the door is a mailto carrying the three-line filter`, () => {
    const door = element(dist(contact), 'data-door');
    const mailto = door.match(/href="(mailto:[^"]+)"/)?.[1] ?? '';
    assert.match(mailto, /[?&]subject=[^&]+/, 'the door mail has no subject');
    const body = decodeURIComponent(mailto.match(/[?&](?:amp;)?body=([^&"]+)/)?.[1] ?? '');
    assert.equal(body.split('\r\n').filter((l) => l.trim()).length, 3, 'the mail body should be the three filter lines');
  });

  test(`[${lang}] the hero's first button after the title is the door`, () => {
    const html = dist(home);
    const afterTitle = html.slice(html.indexOf('</h1>'));
    assert.ok(afterTitle.length > 0, `dist/${home} has no hero title`);
    assert.equal(afterTitle.match(/<a\s[^>]*href="([^"]+)"/)?.[1], href);
  });

  test(`[${lang}] the contact page carries none of the retired positioning`, () => {
    const page = text(block(dist(contact), 'data-contact'));
    assert.ok(page.length > 300, `dist/${contact}: the contact page rendered empty`);
    const retired = [/Service-as-a-Software/i, /sovereign|soberan/i, /100\s?%/, /technical debt|deuda técnica/i, /deterministic|determinist/i];
    const found = retired.filter((re) => re.test(page)).map(String);
    assert.deepEqual(found, [], `dist/${contact} still says: ${found.join(', ')}`);
  });
}
