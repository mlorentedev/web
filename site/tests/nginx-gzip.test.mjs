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

test('every built text file has a .gz sibling that decompresses to it', async () => {
  const { compressible } = await import('../scripts/precompress.mjs');
  assert.ok(existsSync(DIST), 'no dist/: run the build first');
  const targets = compressible(DIST);
  assert.ok(targets.some((f) => f.endsWith('index.html')), 'no HTML found to check');
  const wrong = targets.filter((f) => !existsSync(`${f}.gz`) || !gunzipSync(readFileSync(`${f}.gz`)).equals(readFileSync(f)));
  assert.deepEqual(wrong, [], 'missing or stale .gz: run `npm run build`, which precompresses after astro');
});
