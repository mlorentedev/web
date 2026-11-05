/**
 * No page's HTML grows past a byte budget (WEB-180).
 *
 * The site ships no client script, so a page's HTML is its whole weight before
 * fonts and images. Measured on master at `9035aaf`, the heaviest page is
 * `/es/lab/`: 114,287 bytes, 19,689 gzipped. Two-fifths of it is inline SVG,
 * nearly all of it the two archify diagrams (21 KB and 25 KB). The 14 service
 * icons are all distinct, so referencing them as `<symbol>`s would save 387
 * bytes, and the audit's "repeated icons" did not hold.
 *
 * Two ceilings per page, about 20% above the heaviest page, because each
 * misses what the other catches. Gzip is the wire cost, but repeated copies
 * of one SVG compress to almost nothing, so the raw size bounds them. Raw
 * size alone would let an inlined base64 image through, and that does not
 * compress.
 *
 *   npm run build && npm test
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const RAW_BUDGET = 140_000;
const GZIP_BUDGET = 24_000;

const pages = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return pages(path);
    return entry.name.endsWith('.html') ? [path] : [];
  });

test('every page stays within the raw and the gzipped HTML budget', () => {
  const files = pages(DIST);
  assert.ok(files.length > 0, 'no pages in dist: run the build first');
  const over = files.flatMap((file) => {
    const bytes = readFileSync(file);
    const gzip = gzipSync(bytes).length;
    const page = `/${relative(DIST, file)}`;
    return [
      ...(bytes.length > RAW_BUDGET ? [`${page}: ${bytes.length} bytes, budget ${RAW_BUDGET}`] : []),
      ...(gzip > GZIP_BUDGET ? [`${page}: ${gzip} bytes gzipped, budget ${GZIP_BUDGET}`] : []),
    ];
  });
  assert.deepEqual(over, [], 'a page outgrew its budget: find what grew before you raise it');
});
