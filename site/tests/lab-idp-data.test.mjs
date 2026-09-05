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

test('link safety: no public url references private mesh domains or local schemes', () => {
  for (const cat of catalog.categories) {
    for (const item of cat.items) {
      if (item.url) {
        assert.ok(!item.url.startsWith('obsidian://'), `item ${item.id} leaked obsidian:// scheme`);
        assert.ok(
          !item.url.includes('.staging.kubelab.live'),
          `item ${item.id} leaked internal staging mesh domain`
        );
        assert.ok(
          !item.url.includes('100.64.'),
          `item ${item.id} leaked internal CGNAT address`
        );
        assert.ok(
          !item.url.includes('172.16.'),
          `item ${item.id} leaked internal LAN address`
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
