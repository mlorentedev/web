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
import { readFileSync } from 'node:fs';
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
