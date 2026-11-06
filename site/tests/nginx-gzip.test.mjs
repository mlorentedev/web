/**
 * `site/nginx.conf` compresses what it serves.
 *
 * Measured 2026-11-02: prod and staging answered /lab/ with 111 KB of HTML and
 * no Content-Encoding to a client that accepts gzip and br. Nothing between the
 * browser and this server compresses, so the origin has to. Verified end to end
 * with `docker run nginx:1.27-alpine` on the built site (see the PR).
 *
 *   npm test
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const conf = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'nginx.conf'), 'utf8');
const directive = (name) => conf.match(new RegExp(`^\\s*${name}\\s+([^;]+);`, 'm'))?.[1].trim();

test('nginx compresses responses, through the proxy, and says so to caches', () => {
  assert.equal(directive('gzip'), 'on');
  assert.equal(directive('gzip_vary'), 'on');
  assert.equal(directive('gzip_proxied'), 'any');
});

test('nginx compresses the text types the site serves besides HTML', () => {
  const types = (directive('gzip_types') ?? '').split(/\s+/);
  for (const type of ['text/css', 'application/javascript', 'application/json', 'image/svg+xml', 'application/xml']) {
    assert.ok(types.includes(type), `gzip_types lacks ${type}`);
  }
});

// Precompressed at build, served as files (#615): per-request gzip cost `/` 8x
// the CPU and capped the pod at its 500m limit in staging.
const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');

test('nginx serves the precompressed files the build writes', () => {
  assert.equal(directive('gzip_static'), 'on');
});

test('precompress covers the same floor nginx compresses above', async () => {
  const { MIN_BYTES } = await import('../scripts/precompress.mjs');
  assert.equal(Number(directive('gzip_min_length')), MIN_BYTES);
});

// The type nginx's `mime.types` gives each extension the build writes. An
// extension missing here fails the next test, so a new kind of file is
// classified before it ships, and the script's filter is checked against
// `gzip_types` rather than trusted to choose what gets checked.
const MIME = {
  html: 'text/html', css: 'text/css', js: 'application/javascript', json: 'application/json',
  xml: 'text/xml', svg: 'image/svg+xml', txt: 'text/plain',
  png: 'image/png', webp: 'image/webp', ico: 'image/x-icon', woff2: 'font/woff2', gz: 'application/gzip',
};

test('the script precompresses every built extension nginx would compress, and no other', async () => {
  const { TEXT, files } = await import('../scripts/precompress.mjs');
  assert.ok(existsSync(DIST), 'no dist/: run the build first');
  const gzipped = new Set(['text/html', ...(directive('gzip_types') ?? '').split(/\s+/)]);
  const exts = [...new Set(files(DIST).map((f) => f.split('.').pop()))];
  assert.deepEqual(exts.filter((e) => !MIME[e]), [], 'classify the new extension in MIME above');
  for (const ext of exts) {
    assert.equal(TEXT.test(`x.${ext}`), gzipped.has(MIME[ext]), `.${ext} (${MIME[ext]})`);
  }
});

test('every built text file has a .gz sibling that decompresses to it', async () => {
  const { compressible } = await import('../scripts/precompress.mjs');
  assert.ok(existsSync(DIST), 'no dist/: run the build first');
  const targets = compressible(DIST);
  assert.ok(targets.some((f) => f.endsWith('index.html')), 'no HTML found to check');
  const wrong = targets.filter((f) => !existsSync(`${f}.gz`) || !gunzipSync(readFileSync(`${f}.gz`)).equals(readFileSync(f)));
  assert.deepEqual(wrong, [], 'missing or stale .gz: run `npm run build`, which precompresses after astro');
});
