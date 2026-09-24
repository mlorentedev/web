/**
 * The served tree the release suite tests is the tree prod serves (#376).
 *
 * `scripts/served-tree.mjs` copies the web root out of the image by digest and
 * refuses an image whose platforms serve different trees. Its docker half runs
 * in CI against a real image; what is checked here is everything that decides
 * whether that run means anything:
 *
 * - the pure parts (digest pinning, platform listing, tree comparison);
 * - that the root it extracts is the root nginx serves and the Dockerfile
 *   fills, read from each file rather than assumed;
 * - the two Dockerfile properties the extraction depends on. Without them the
 *   first real run fails, and the reason is in a comment nobody reads there.
 */

import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { hashTree, isPinned, platformsOf, servedRoot, treeDiff, treeDigest } from '../scripts/served-tree.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(here, '..');
const dockerfile = readFileSync(join(siteRoot, '../Dockerfile'), 'utf8');
const root = servedRoot(readFileSync(join(siteRoot, 'nginx.conf'), 'utf8'));

/** The Dockerfile stage that starts with `FROM … AS name`, or the one starting `FROM image`. */
const stage = (match) => {
  const parts = dockerfile.split(/^(?=FROM )/m);
  return parts.find((p) => match.test(p.split('\n')[0]));
};

const digest = (c) => `sha256:${c.repeat(64)}`;

test('only a reference pinned by digest is accepted', () => {
  assert.ok(isPinned(`docker.io/mlorentedev/kubelab-web@${digest('a')}`));
  assert.ok(!isPinned('docker.io/mlorentedev/kubelab-web:sha-bae67d6'), 'a tag can move after the test');
  assert.ok(!isPinned('docker.io/mlorentedev/kubelab-web:sha-bae67d6@sha256:abc'), 'a truncated digest');
  assert.ok(!isPinned(`kubelab-web@${digest('A')}`), 'digests are lower-case hex');
  assert.ok(!isPinned(''));
});

test('every runnable platform is listed by its own digest; attestations are not', () => {
  // The shape `docker buildx imagetools inspect --raw` returns for this image:
  // two platforms and, with provenance on, one attestation manifest each.
  const index = {
    mediaType: 'application/vnd.oci.image.index.v1+json',
    manifests: [
      { digest: digest('1'), platform: { os: 'linux', architecture: 'amd64' } },
      { digest: digest('2'), platform: { os: 'linux', architecture: 'arm64' } },
      { digest: digest('3'), platform: { os: 'unknown', architecture: 'unknown' } },
      { digest: digest('4'), platform: { os: 'unknown', architecture: 'unknown' } },
      { digest: digest('5'), platform: { os: 'linux', architecture: 'arm', variant: 'v7' } },
    ],
  };
  assert.deepEqual(platformsOf(index), [
    { platform: 'linux/amd64', digest: digest('1') },
    { platform: 'linux/arm64', digest: digest('2') },
    { platform: 'linux/arm/v7', digest: digest('5') },
  ]);
  assert.deepEqual(platformsOf({ mediaType: 'application/vnd.oci.image.manifest.v1+json', layers: [] }), []);
});

test('trees are compared by content, and every kind of difference is named', () => {
  const work = mkdtempSync(join(tmpdir(), 'served-tree-test-'));
  const tree = (name, files) => {
    for (const [path, body] of Object.entries(files)) {
      mkdirSync(dirname(join(work, name, path)), { recursive: true });
      writeFileSync(join(work, name, path), body);
    }
    return hashTree(join(work, name));
  };
  try {
    const base = { 'index.html': 'home', 'notes/a/index.html': 'a', 'beoe/x.svg': '<svg/>' };
    const a = tree('a', base);
    const same = tree('same', base);
    assert.deepEqual(treeDiff(a, same), []);
    assert.equal(treeDigest(a), treeDigest(same));
    assert.deepEqual([...a.keys()], ['beoe/x.svg', 'index.html', 'notes/a/index.html'], 'paths are sorted');

    // What #378 did to one digest: same page count, other diagram names.
    const { 'beoe/x.svg': _, ...withoutX } = base;
    const renamed = tree('renamed', { ...withoutX, 'beoe/y.svg': '<svg/>' });
    const changed = tree('changed', { ...base, 'notes/a/index.html': 'a, rebuilt' });
    const extra = tree('extra', { ...base, '50x.html': 'nginx' });
    assert.deepEqual(treeDiff(a, changed), ['notes/a/index.html']);
    assert.deepEqual(treeDiff(a, extra), ['50x.html']);
    assert.deepEqual(treeDiff(extra, a), ['50x.html'], 'a file missing on either side');
    assert.deepEqual(treeDiff(a, renamed), ['beoe/x.svg', 'beoe/y.svg']);
    assert.notEqual(treeDigest(a), treeDigest(changed));
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});

test('the extracted root is the one nginx serves and the Dockerfile fills', () => {
  assert.equal(root, '/usr/share/nginx/html');
  const runtime = stage(/^FROM nginx:/);
  assert.ok(runtime, 'no nginx runtime stage in the Dockerfile');
  assert.match(runtime, new RegExp(`^COPY --from=build /app/dist ${root}\\s*$`, 'm'));
});

test('the runtime stage empties the web root before copying dist/ into it', () => {
  // nginx's image ships index.html and 50x.html there, and COPY merges. Prod
  // served the stock 50x.html at 200 until this; the suite caught it the first
  // time it read the image's tree.
  const runtime = stage(/^FROM nginx:/);
  const wipe = runtime.search(new RegExp(`rm -rf ${root}/\\*`));
  assert.ok(wipe !== -1, `the runtime stage must empty ${root} before the COPY`);
  assert.ok(wipe < runtime.indexOf('COPY --from=build'), 'the wipe must come before the COPY');
});

test('the build stage runs once for every platform', () => {
  // An ARG in scope is part of every RUN's cache key. Declaring TARGET* in a
  // stage pinned to BUILDPLATFORM made BuildKit build dist/ once per target,
  // and the halves of one digest differed. The build stage must not ask.
  const build = stage(/ AS build\s*$/);
  assert.ok(build, 'no `AS build` stage in the Dockerfile');
  assert.match(build.split('\n')[0], /^FROM --platform=\$BUILDPLATFORM /);
  const asked = build.match(/^ARG\s+TARGET\w*/gm) ?? [];
  assert.deepEqual(asked, [], 'the build stage declares a TARGET* ARG, so it runs once per platform');
});
