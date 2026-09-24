#!/usr/bin/env node
/**
 * Put the tree an image serves where the suite reads `dist/` (#376).
 *
 *   node scripts/served-tree.mjs <image>@sha256:<digest> [dest]   # dest defaults to dist
 *
 * ## Why the suite needs the image's tree and not a build of its own
 *
 * `test.yml` builds `dist/` on the runner, and the Dockerfile builds it again
 * inside the image. Same commit, same lockfile, two builds: a pass on the first
 * says nothing certain about the bytes of the second, and the second is what
 * staging and prod serve. This script copies the served root out of the image
 * so the unchanged suites (they find `dist/` by path) run against those bytes.
 *
 * ## What it refuses
 *
 * - A reference that is not pinned by digest. A tag can be moved between the
 *   test and the promotion; a digest cannot.
 * - An image whose platforms serve different trees. A multi-platform image is
 *   one digest over one manifest per platform, and the cluster may schedule
 *   the pod on either. Testing one platform's tree says nothing about another
 *   that differs, so every platform is extracted and they must be identical —
 *   on sha-641b26a they were not: 36 of 116 files differed between amd64 and
 *   arm64 (#378's random diagram ids, built once per platform).
 *
 * The served root is read from `nginx.conf`, the file that decides it, rather
 * than written here a second time.
 *
 * Exit status: 0 extracted, 1 the image failed a check, 2 usage.
 */

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(here, '..');

/** The web root `nginx.conf` serves. */
export const servedRoot = (conf) => {
  const m = conf.match(/^\s*root\s+(\S+);/m);
  if (!m) throw new Error('nginx.conf declares no `root`');
  return m[1];
};

/** Only `<name>@sha256:<64 hex>`: a tag may point elsewhere by the time the image ships. */
export const isPinned = (ref) => /^[^@\s]+@sha256:[0-9a-f]{64}$/.test(ref);

/**
 * The runnable platforms of an image, as `{ platform: 'os/arch[/variant]',
 * digest }`. Each is addressed by its own manifest digest, not by the index's
 * plus `--platform`: the classic Docker image store keys a pull by the digest
 * it was asked for, so pulling a second platform under the index digest fails
 * with "cannot overwrite digest". An index also lists attestation manifests,
 * which declare `unknown/unknown` and carry no filesystem. A single-platform
 * manifest has no list at all: [] means "the reference is the only platform".
 */
export const platformsOf = (manifest) =>
  (manifest.manifests ?? [])
    .filter((m) => m.platform && m.platform.os !== 'unknown')
    .map(({ platform: p, digest }) => ({
      platform: [p.os, p.architecture, p.variant].filter(Boolean).join('/'),
      digest,
    }));

/** Every file under `dir` as relative path -> sha256 of its content, sorted by path. */
export const hashTree = (dir) => {
  const files = readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => join(e.parentPath, e.name));
  return new Map(
    files
      .map((f) => [relative(dir, f), createHash('sha256').update(readFileSync(f)).digest('hex')])
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
  );
};

/** One hash for a whole tree, printed so two runs can be compared by eye. */
export const treeDigest = (tree) => {
  const h = createHash('sha256');
  for (const [path, sum] of tree) h.update(`${sum}  ${path}\n`);
  return h.digest('hex');
};

/** Paths present in only one tree, or present in both with different content. */
export const treeDiff = (a, b) => {
  const paths = new Set([...a.keys(), ...b.keys()]);
  return [...paths].filter((p) => a.get(p) !== b.get(p)).sort();
};

const docker = (...args) =>
  execFileSync('docker', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim();

/** Copy `root` out of `ref` without ever starting the container. */
const extract = (ref, root, dest) => {
  const id = docker('create', ref);
  try {
    docker('cp', `${id}:${root}`, dest);
  } finally {
    docker('rm', '-f', id);
  }
};

const main = ([ref, destArg = 'dist']) => {
  if (!ref || !isPinned(ref)) {
    console.error('usage: served-tree.mjs <image>@sha256:<digest> [dest]');
    return 2;
  }
  const root = servedRoot(readFileSync(join(siteRoot, 'nginx.conf'), 'utf8'));
  const platforms = platformsOf(JSON.parse(docker('buildx', 'imagetools', 'inspect', '--raw', ref)));
  const dest = resolve(destArg);
  // Beside the destination, so the final move is a rename on one filesystem.
  const work = mkdtempSync(join(dirname(dest), '.served-tree-'));
  try {
    const name = ref.slice(0, ref.indexOf('@'));
    const targets = platforms.length ? platforms : [{ platform: 'default', digest: ref.slice(name.length + 1) }];
    const trees = targets.map(({ platform, digest }) => {
      const out = join(work, platform.replaceAll('/', '_'));
      extract(`${name}@${digest}`, root, out);
      const tree = hashTree(out);
      console.log(`${platform} (${digest}): ${tree.size} files, tree sha256 ${treeDigest(tree)}`);
      return { platform, out, tree };
    });

    const [first, ...rest] = trees;
    let diverged = false;
    for (const other of rest) {
      const diff = treeDiff(first.tree, other.tree);
      if (!diff.length) continue;
      diverged = true;
      console.error(`${other.platform} serves ${diff.length} file(s) that differ from ${first.platform}:`);
      for (const p of diff.slice(0, 20)) console.error(`  ${p}`);
      if (diff.length > 20) console.error(`  … and ${diff.length - 20} more`);
    }
    if (diverged) {
      console.error('One digest must serve one tree: testing a platform tests nothing about another that differs.');
      return 1;
    }

    rmSync(dest, { recursive: true, force: true });
    renameSync(first.out, dest);
    console.log(`Tested tree: ${ref} (${trees.length} platform(s)) -> ${relative(process.cwd(), dest) || '.'}`);
    return 0;
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
