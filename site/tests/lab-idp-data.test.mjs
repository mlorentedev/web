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

      if (item.spendBadge) {
        assert.ok(item.spendBadge.en?.trim(), `item ${item.id} spendBadge missing en`);
        assert.ok(item.spendBadge.es?.trim(), `item ${item.id} spendBadge missing es`);
      }
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
        const itemName = item.name.replace(/&/g, '&amp;');
        assert.ok(html.includes(itemName), `item name "${itemName}" missing on ${locale} IDP catalog page`);
      }
    }
  });

  test(`[${locale}] IDP catalog page respects link safety and security headers`, () => {
    const html = readFileSync(pagePath, 'utf8');

    // No private schemes or staging domains in the entire HTML
    assert.ok(!html.includes('obsidian://'), `obsidian:// leaked into ${locale} IDP page`);
    assert.ok(!html.includes('.staging.kubelab.live'), `staging mesh domain leaked into ${locale} IDP page`);

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
