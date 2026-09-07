/**
 * SEO Canonical & Hreflang Integrity Tests.
 *
 * Verifies:
 * - 404 page emits <meta name="robots" content="noindex, nofollow"> and no canonical or alternate hreflang.
 * - Unilingual pages (notes, projects, es/nodo, es/rompe, unilingual tags) emit self-canonical and no broken alternate hreflangs.
 * - Bilingual pages (/lab, /es/lab) emit symmetric hreflang links and agree on x-default pointing to default locale.
 * - Navigation links carry trailing slashes to avoid internal redirect hops.
 */

import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(here, '..');
const distDir = join(siteRoot, 'dist');

test('404.html carries noindex and suppresses canonical and hreflangs', () => {
  const file = join(distDir, '404.html');
  assert.ok(existsSync(file), 'dist/404.html must exist');
  const html = readFileSync(file, 'utf8');

  assert.ok(
    html.includes('<meta name="robots" content="noindex, nofollow">'),
    '404.html must carry noindex, nofollow robots meta tag'
  );
  assert.ok(
    !html.includes('<link rel="canonical"'),
    '404.html must not declare a canonical link'
  );
  assert.ok(
    !html.includes('hreflang='),
    '404.html must not declare alternate hreflang links'
  );
});

test('Unilingual pages emit canonical but omit missing alternate hreflangs', () => {
  const unilingualPages = [
    { path: 'notes/why-build-homelab/index.html', canonical: 'https://mlorente.dev/notes/why-build-homelab/' },
    { path: 'projects/index.html', canonical: 'https://mlorente.dev/projects/' },
    { path: 'es/nodo/index.html', canonical: 'https://mlorente.dev/es/nodo/' },
    { path: 'es/rompe/index.html', canonical: 'https://mlorente.dev/es/rompe/' },
    { path: 'es/newsletter/index.html', canonical: 'https://mlorente.dev/es/newsletter/' },
    { path: 'tags/dns/index.html', canonical: 'https://mlorente.dev/tags/dns/' },
  ];

  for (const { path, canonical } of unilingualPages) {
    const file = join(distDir, path);
    assert.ok(existsSync(file), `${path} must exist`);
    const html = readFileSync(file, 'utf8');

    assert.ok(
      html.includes(`<link rel="canonical" href="${canonical}">`),
      `${path} must declare self-canonical ${canonical}`
    );
    assert.ok(
      !html.includes('hreflang="es"'),
      `${path} must not declare broken hreflang="es"`
    );
    assert.ok(
      !html.includes('hreflang="x-default"'),
      `${path} must not declare hreflang="x-default"`
    );
  }
});

test('Bilingual pages have symmetric hreflangs and agree on x-default', () => {
  const enFile = join(distDir, 'lab/index.html');
  const esFile = join(distDir, 'es/lab/index.html');

  assert.ok(existsSync(enFile), 'dist/lab/index.html must exist');
  assert.ok(existsSync(esFile), 'dist/es/lab/index.html must exist');

  const enHtml = readFileSync(enFile, 'utf8');
  const esHtml = readFileSync(esFile, 'utf8');

  // Both have correct self-canonical
  assert.ok(enHtml.includes('<link rel="canonical" href="https://mlorente.dev/lab/">'));
  assert.ok(esHtml.includes('<link rel="canonical" href="https://mlorente.dev/es/lab/">'));

  // Both have identical hreflang pairs
  for (const html of [enHtml, esHtml]) {
    assert.ok(html.includes('<link rel="alternate" hreflang="en" href="https://mlorente.dev/lab/">'));
    assert.ok(html.includes('<link rel="alternate" hreflang="es" href="https://mlorente.dev/es/lab/">'));
    assert.ok(html.includes('<link rel="alternate" hreflang="x-default" href="https://mlorente.dev/lab/">'));
  }
});

test('Main navigation links in header carry trailing slashes', () => {
  const enIndex = readFileSync(join(distDir, 'index.html'), 'utf8');
  const esIndex = readFileSync(join(distDir, 'es/index.html'), 'utf8');

  for (const section of ['lab', 'ai', 'notes', 'contact']) {
    assert.ok(
      enIndex.includes(`href="/${section}/"`),
      `English header must link to /${section}/ with trailing slash`
    );
    assert.ok(
      esIndex.includes(`href="/es/${section}/"`),
      `Spanish header must link to /es/${section}/ with trailing slash`
    );
  }
});

test('HTML head alternates and sitemap alternates agree across all URLs (WEB-034 / #109)', () => {
  const sitemapFile = join(distDir, 'sitemap-0.xml');
  assert.ok(existsSync(sitemapFile), 'dist/sitemap-0.xml must exist');

  const sitemap = readFileSync(sitemapFile, 'utf8');
  const urlBlocks = [...sitemap.matchAll(/<url>(.*?)<\/url>/gs)].map((m) => m[1]);
  assert.ok(urlBlocks.length > 0, 'sitemap must have url entries');

  for (const block of urlBlocks) {
    const locMatch = block.match(/<loc>(https:\/\/mlorente\.dev(.*?)?)<\/loc>/);
    if (!locMatch) continue;
    const urlPath = locMatch[2] || '/';

    // Sitemap alternates (language alternates only)
    const sitemapLangs = [...block.matchAll(/<xhtml:link rel="alternate" hreflang="([^"]+)" href="([^"]+)"\/>/g)]
      .map((m) => m[1])
      .sort();

    // Find corresponding HTML file in dist
    let htmlPath = join(distDir, urlPath, 'index.html');
    if (urlPath === '/' || urlPath === '') {
      htmlPath = join(distDir, 'index.html');
    } else if (!existsSync(htmlPath) && urlPath.endsWith('.html')) {
      htmlPath = join(distDir, urlPath);
    }

    assert.ok(existsSync(htmlPath), `HTML file for sitemap url must exist: ${urlPath}`);

    const html = readFileSync(htmlPath, 'utf8');
    const headMatch = html.match(/<head>(.*?)<\/head>/s);
    const head = headMatch ? headMatch[1] : '';

    // HTML alternates (languages only, ignore x-default and rss)
    const htmlLangs = [...head.matchAll(/<link rel="alternate" hreflang="([a-zA-Z-]+)" href="([^"]+)"/g)]
      .filter((m) => m[1] !== 'x-default')
      .map((m) => m[1])
      .sort();

    assert.deepEqual(
      htmlLangs,
      sitemapLangs,
      `Alternate hreflang disagreement on ${urlPath}: HTML has [${htmlLangs}] but sitemap has [${sitemapLangs}]`
    );
  }
});
