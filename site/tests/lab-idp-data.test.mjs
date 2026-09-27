/**
 * Data contract and provenance verification tests for KubeLab IDP catalog.
 *
 * Asserts that `idp-catalog.json` is faithful to the pinned `bookmarks.yaml` fixture,
 * preserves bilingual parity (EN/ES), and rigorously respects the public link boundary
 * (ADR-056 §3: internal mesh endpoints, auth walls, and local OS protocols are never
 * published as clickable public URLs).
 */

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(here, '..');

const fixturePath = join(here, 'fixtures/bookmarks.yaml');
const fixtureContent = readFileSync(fixturePath, 'utf8');
const catalog = JSON.parse(readFileSync(join(siteRoot, 'src/data/idp-catalog.json'), 'utf8'));
const idpCatalogTs = readFileSync(join(siteRoot, 'src/data/idp-catalog.ts'), 'utf8');
const accessTable = JSON.parse(readFileSync(join(siteRoot, 'src/data/service-access.json'), 'utf8'));
const items = catalog.categories.flatMap((cat) => cat.items);

/** The Services table's words for each measured access (#292): a platform card reuses them. */
const MEASURED_LABEL = {
  en: { public: 'Public', authelia: 'Behind Authelia', 'app-login': 'Own login', mesh: 'Mesh only' },
  es: { public: 'Público', authelia: 'Tras Authelia', 'app-login': 'Login propio', mesh: 'Solo malla' },
};

/** A kubelab.live host, or kubelab.live as the thing a scanner is asked about. */
function targetsKubelab(url) {
  const { hostname, search } = new URL(url);
  return /(^|\.)kubelab\.live$/.test(hostname) || /(^|[=.])kubelab\.live(\b|$)/.test(decodeURIComponent(search));
}

test('the fixture sha256 matches the manifest provenance declaration', () => {
  const hash = createHash('sha256').update(fixtureContent).digest('hex');
  assert.equal(
    hash,
    catalog.source.fixtureSha256,
    'fixture sha256 must match the sha recorded in idp-catalog.json'
  );
});

test('every category has a non-empty list of items', () => {
  assert.ok(catalog.categories.length >= 4, 'at least 4 core platform categories');
  for (const cat of catalog.categories) {
    assert.ok(cat.items.length > 0, `category ${cat.id} has items`);
  }
});

test('bilingual parity: every visible field carries both English and Spanish twins', () => {
  for (const cat of catalog.categories) {
    assert.ok(cat.name?.trim(), `category ${cat.id} missing name`);
    assert.ok(cat.nameEs?.trim(), `category ${cat.id} missing nameEs`);
    assert.ok(cat.description?.trim(), `category ${cat.id} missing description`);
    assert.ok(cat.descriptionEs?.trim(), `category ${cat.id} missing descriptionEs`);

    for (const item of cat.items) {
      assert.ok(item.name?.trim(), `item ${item.id} missing name`);
      assert.ok(item.description?.trim(), `item ${item.id} missing description`);
      assert.ok(item.descriptionEs?.trim(), `item ${item.id} missing descriptionEs`);
      assert.ok(item.icon?.trim(), `item ${item.id} missing icon`);
    }
  }
});

test('every item is either a brand or has a Spanish title, never both', () => {
  // `name` is pinned to the source, so the Spanish page needs `nameEs` for a title
  // that describes; `brand` marks the names that stay the same in every locale
  // (rendered with translate="no"). Neither would let English through unmarked.
  for (const cat of catalog.categories) {
    for (const item of cat.items) {
      const hasEs = Boolean(item.nameEs?.trim());
      assert.ok(hasEs !== (item.brand === true), `item ${item.id}: needs exactly one of \`nameEs\` or \`brand: true\``);
      if (hasEs) assert.notEqual(item.nameEs, item.name, `item ${item.id}'s \`nameEs\` is the English name`);
    }
  }
});

test('link boundary: url is present if and only if access is public', () => {
  for (const cat of catalog.categories) {
    for (const item of cat.items) {
      if (item.access === 'public') {
        assert.ok(item.url, `item ${item.id} marked public must provide a url`);
        assert.ok(item.url.startsWith('https://'), `item ${item.id} url must be an https link`);
      } else {
        assert.equal(
          item.url,
          undefined,
          `item ${item.id} with access '${item.access}' must NOT publish a public url`
        );
      }
    }
  }
});

test('link safety: no public url references private mesh domains, local schemes, or raw IP addresses', () => {
  for (const cat of catalog.categories) {
    for (const item of cat.items) {
      if (item.url) {
        assert.ok(!item.url.startsWith('obsidian://'), `item ${item.id} leaked obsidian:// scheme`);
        assert.ok(
          !item.url.includes('.staging.kubelab.live'),
          `item ${item.id} leaked internal staging mesh domain`
        );
        assert.ok(
          !/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/.test(item.url),
          `item ${item.id} leaked raw IP address in public url: ${item.url}`
        );
      }
    }
  }
});

/**
 * WEB-141 AC3: no card targets `kubelab.live`, which ADR-059 keeps platform
 * internal. Measured 2026-09-27: SSL Labs, securityheaders and Shodan were all
 * pointed at it, so the catalog's perimeter scans audited a domain the site does
 * not serve. They scan `mlorente.dev` now. Redirects are checked live, weekly
 * (`catalog.live.mjs`), because only a request can see them.
 */
test('AC3: no card url targets kubelab.live, as its host or as the thing it asks about', () => {
  const offenders = items.filter((item) => item.url && targetsKubelab(item.url)).map((i) => `${i.id}: ${i.url}`);
  assert.deepEqual(offenders, []);
});

test('targetsKubelab: hosts and scanner queries count, a lookalike does not', () => {
  assert.ok(targetsKubelab('https://grafana.kubelab.live/explore'));
  assert.ok(targetsKubelab('https://www.ssllabs.com/ssltest/analyze.html?d=kubelab.live'));
  assert.ok(targetsKubelab('https://securityheaders.com/?q=kubelab.live&followRedirects=on'));
  assert.ok(!targetsKubelab('https://www.ssllabs.com/ssltest/analyze.html?d=mlorente.dev'));
  assert.ok(!targetsKubelab('https://notkubelab.live.example.com/'));
});

/**
 * A card for a platform service takes its access from the measured table, not
 * from its own field: the triage cards said "Tailscale Mesh" for Grafana (behind
 * Authelia), Argo CD (its own login) and Status (public), measured 2026-09-26.
 */
test('AC2: a platform card names a measured service, and no card claims mesh on its own', () => {
  for (const item of items) {
    assert.notEqual(item.access, 'mesh', `${item.id}: "mesh" is the access table's to say`);
    if (item.access === 'platform') {
      assert.ok(
        accessTable.services.some((row) => row.slug === item.service),
        `${item.id}: service "${item.service}" has no row in service-access.json`,
      );
    } else {
      assert.equal(item.service, undefined, `${item.id}: only a platform card names a service`);
    }
  }
});

test('source fidelity: every item sourceHref is present in the source fixture', () => {
  for (const cat of catalog.categories) {
    for (const item of cat.items) {
      assert.ok(
        fixtureContent.includes(item.sourceHref),
        `item ${item.id} sourceHref '${item.sourceHref}' must exist in bookmarks.yaml fixture`
      );
    }
  }
});

test('idp-catalog.ts types the data rather than leaving it untyped', () => {
  assert.ok(idpCatalogTs.includes('export interface IdpItem'));
  assert.ok(idpCatalogTs.includes('export interface IdpCategory'));
  assert.ok(idpCatalogTs.includes('export interface IdpManifest'));
  assert.ok(idpCatalogTs.includes('export const idpCatalog'));
});

const IDP_HTML_PAGES = [
  ['en', join(siteRoot, 'dist/lab/idp/index.html'), '/lab'],
  ['es', join(siteRoot, 'dist/es/lab/idp/index.html'), '/es/lab'],
];

for (const [locale, pagePath, expectedBackPath] of IDP_HTML_PAGES) {
  test(`[${locale}] IDP catalog page exists and has zero client JS`, () => {
    const html = readFileSync(pagePath, 'utf8');

    // No executable scripts
    const executableScripts = [...html.matchAll(/<script\b([^>]*)>/g)]
      .filter((m) => !m[1].includes('application/ld+json'));
    assert.equal(executableScripts.length, 0, `found executable scripts on ${locale} IDP catalog page`);

    // No Astro client islands
    assert.ok(!html.includes('<astro-island'), `found astro-island on ${locale} IDP catalog page`);
  });

  test(`[${locale}] IDP catalog page renders all categories and back breadcrumb`, () => {
    const html = readFileSync(pagePath, 'utf8');

    // Breadcrumb back link
    assert.ok(
      html.includes(`href="${expectedBackPath}"`),
      `breadcrumb link to ${expectedBackPath} missing on ${locale} IDP catalog page`
    );

    // All categories rendered
    for (const cat of catalog.categories) {
      const rawName = locale === 'es' ? cat.nameEs : cat.name;
      const name = rawName.replace(/&/g, '&amp;');
      assert.ok(html.includes(name), `category name "${name}" missing on ${locale} IDP catalog page`);

      for (const item of cat.items) {
        const shown = locale === 'es' && item.nameEs ? item.nameEs : item.name;
        const itemName = shown.replace(/&/g, '&amp;');
        assert.ok(html.includes(itemName), `item name "${itemName}" missing on ${locale} IDP catalog page`);
      }
    }
  });

  test(`[${locale}] a platform card's badge is the measured access, in the Services table's words`, () => {
    const html = readFileSync(pagePath, 'utf8');
    const wrong = items
      .filter((item) => item.access === 'platform')
      .map((item) => {
        const card = html.match(new RegExp(`<article[^>]*data-idp-item="${item.id}"[^>]*>([\\s\\S]*?)</article>`))?.[1];
        if (!card) return `${item.id}: no card`;
        const badge = card.match(/<span[^>]*data-idp-access[^>]*>([^<]*)</)?.[1]?.trim();
        const measured = accessTable.services.find((row) => row.slug === item.service).access;
        const expected = MEASURED_LABEL[locale][measured];
        return badge === expected ? null : `${item.id}: badge "${badge}", measured "${expected}"`;
      })
      .filter(Boolean);
    assert.ok(items.some((item) => item.access === 'platform'), 'no platform card: the check would pass vacuously');
    assert.deepEqual(wrong, []);
  });

  test(`[${locale}] every card that does not open says why`, () => {
    const html = readFileSync(pagePath, 'utf8');
    const cards = [...html.matchAll(/<article[^>]*data-idp-item="([^"]+)"[^>]*>([\s\S]*?)<\/article>/g)];
    assert.equal(cards.length, items.length, 'one card per catalog item');
    const silent = cards
      .filter(([, , body]) => !/<a\b[^>]*href="https:/.test(body))
      .filter(([, , body]) => !(body.match(/data-idp-why[^>]*>([\s\S]*?)<\/(?:span|a)>/)?.[1] ?? '').replace(/<[^>]+>/g, '').trim())
      .map(([, id]) => id);
    assert.deepEqual(silent, [], 'cards with no link and no reason');
  });

  test(`[${locale}] IDP catalog page respects link safety and security headers`, () => {
    const html = readFileSync(pagePath, 'utf8');

    // No private schemes or staging domains in the entire HTML
    assert.ok(!html.includes('obsidian://'), `obsidian:// leaked into ${locale} IDP page`);
    assert.ok(!html.includes('.staging.kubelab.live'), `staging mesh domain leaked into ${locale} IDP page`);
    const kubelabHrefs = [...html.matchAll(/href="(https?:[^"]*)"/g)].map((m) => m[1].replace(/&amp;/g, '&')).filter(targetsKubelab);
    assert.deepEqual(kubelabHrefs, [], `links targeting kubelab.live on ${locale} IDP page`);

    // All external links have rel="noopener noreferrer"
    const externalLinks = [...html.matchAll(/<a\b[^>]*href="https?:\/\/[^"]*"[^>]*>/g)];
    assert.ok(externalLinks.length > 0, `expected public external links on ${locale} IDP page`);
    for (const [linkTag] of externalLinks) {
      assert.ok(
        linkTag.includes('rel="noopener noreferrer"'),
        `external link missing rel="noopener noreferrer": ${linkTag}`
      );
      assert.ok(
        linkTag.includes('target="_blank"'),
        `external link missing target="_blank": ${linkTag}`
      );
    }
  });
}

const IDP_ARCH_PAGES = [
  ['en', join(siteRoot, 'dist/lab/idp/architecture/index.html'), '/lab/idp'],
  ['es', join(siteRoot, 'dist/es/lab/idp/architecture/index.html'), '/es/lab/idp'],
];

for (const [locale, pagePath, expectedBackPath] of IDP_ARCH_PAGES) {
  test(`[${locale}] IDP architecture page exists and has zero client JS`, () => {
    const html = readFileSync(pagePath, 'utf8');

    const executableScripts = [...html.matchAll(/<script\b([^>]*)>/g)]
      .filter((m) => !m[1].includes('application/ld+json'));
    assert.equal(executableScripts.length, 0, `found executable scripts on ${locale} IDP architecture page`);
    assert.ok(!html.includes('<astro-island'), `found astro-island on ${locale} IDP architecture page`);
  });

  test(`[${locale}] IDP architecture page renders request-path diagram and back breadcrumb`, () => {
    const html = readFileSync(pagePath, 'utf8');

    assert.ok(
      html.includes(`href="${expectedBackPath}"`),
      `breadcrumb link to ${expectedBackPath} missing on ${locale} IDP architecture page`
    );

    // Request path diagram embedded
    assert.ok(html.includes('data-lab-section="request-path"'), `request-path section missing on ${locale} IDP architecture page`);
    assert.ok(html.includes('Cloudflare Edge'), `Cloudflare node missing on ${locale} IDP architecture page`);
    assert.ok(html.includes('Authelia IAM'), `Authelia node missing on ${locale} IDP architecture page`);
    assert.ok(html.includes('Vector DaemonSet'), `Vector node missing on ${locale} IDP architecture page`);

    // GitOps continuous delivery diagram embedded
    assert.ok(html.includes('data-lab-section="gitops"'), `gitops section missing on ${locale} IDP architecture page`);
    assert.ok(html.includes('Argo CD Hub'), `Argo CD Hub missing on ${locale} IDP architecture page`);
    assert.ok(html.includes('Tailscale Mesh'), `Tailscale Mesh missing on ${locale} IDP architecture page`);
    assert.ok(html.includes('K3s Cloud Prod'), `K3s Cloud Prod missing on ${locale} IDP architecture page`);

    // Secret flow diagram embedded
    assert.ok(html.includes('data-lab-section="secret-flow"'), `secret-flow section missing on ${locale} IDP architecture page`);
    assert.ok(html.includes('Age Identity Key'), `Age Identity Key node missing on ${locale} IDP architecture page`);
    assert.ok(html.includes('Mozilla SOPS'), `Mozilla SOPS node missing on ${locale} IDP architecture page`);
    assert.ok(html.includes('Toolkit Secrets'), `Toolkit Secrets node missing on ${locale} IDP architecture page`);

    // Zero addressing: no IP addresses leaked
    assert.ok(!/\b162\.55\.57\.175\b/.test(html), `Hetzner IP leaked on ${locale} IDP architecture page`);
    assert.ok(!/\b100\.64\.\d{1,3}\.\d{1,3}\b/.test(html), `Tailscale IP leaked on ${locale} IDP architecture page`);
    assert.ok(!/\b172\.16\.\d{1,3}\.\d{1,3}\b/.test(html), `LAN IP leaked on ${locale} IDP architecture page`);

    // No duplicate IDs across inlined diagrams or markup
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
    const seen = new Map();
    for (const id of ids) seen.set(id, (seen.get(id) || 0) + 1);
    const duplicates = [...seen.entries()].filter(([, n]) => n > 1).map(([id, n]) => `${id} ×${n}`);
    assert.deepEqual(duplicates, [], `duplicate ids on ${locale} IDP architecture page:\n  ${duplicates.join('\n  ')}`);
  });
}
