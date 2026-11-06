#!/usr/bin/env node
/**
 * Write a `.gz` next to every text file in `dist/` that nginx would compress (#615).
 *
 *   node scripts/precompress.mjs [dir]   # dir defaults to dist; runs as `postbuild`
 *
 * With `gzip on` alone, nginx deflated the same static HTML on every request.
 * Measured in staging on 2026-11-06, `/` cost 8x the CPU with
 * `Accept-Encoding: gzip`, and the pod's 500m limit held it to 331 req/s with
 * 73% timeouts where identity served 795. `gzip_static on` in `nginx.conf`
 * sends these files instead, so a request costs a file read.
 *
 * Level 9: the cost is paid once at build. Node's gzip writes no name and a zero
 * mtime, so the same input gives the same bytes on every build and platform,
 * which `served-tree.mjs` requires of the image (#376).
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { constants, gzipSync } from 'node:zlib';

/** The extensions of what `gzip_types` covers (and HTML, which nginx always compresses). */
export const TEXT = /\.(html|css|js|mjs|json|xml|svg|txt)$/;
/** `gzip_min_length` in `nginx.conf`: below it, nginx compresses nothing either. */
export const MIN_BYTES = 1024;

/** Every file under `dir`, recursively. */
export const files = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });

/** The files under `dir` that should carry a `.gz` sibling. */
export const compressible = (dir) => files(dir).filter((f) => TEXT.test(f) && statSync(f).size >= MIN_BYTES);

/** Writes each sibling and returns how many it wrote. */
export function precompress(dir) {
  const targets = compressible(dir);
  for (const file of targets) {
    writeFileSync(`${file}.gz`, gzipSync(readFileSync(file), { level: constants.Z_BEST_COMPRESSION }));
  }
  return targets.length;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = process.argv[2] ?? 'dist';
  console.log(`precompress: ${precompress(dir)} files in ${dir}`);
}
