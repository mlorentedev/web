/**
 * What goes into the image build is what the build uses (#350).
 *
 * The build context is the repository root. Its `.dockerignore` listed bare
 * `node_modules`, which matches only the root, so `site/node_modules` (445 MB)
 * and `site/dist` were sent on every build and `COPY site/ ./` laid the local
 * tree over the one `npm ci` had just installed. The file is now an allowlist:
 * everything is excluded, then the paths the Dockerfile copies are let back in.
 *
 * Fifteen `ARG`s were declared for a values pipeline that no longer exists;
 * nothing passed them and nothing read them. An `ARG` now has to be passed by
 * the workflow that builds the image.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const dockerfile = read('Dockerfile');
const ignore = read('.dockerignore')
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'));

test('.dockerignore excludes everything, then lets back in only site/ and version.txt', () => {
  assert.equal(ignore[0], '*', 'the allowlist must start by excluding everything');
  assert.deepEqual(
    ignore.filter((line) => line.startsWith('!')),
    ['!site/', '!version.txt'],
  );
});

test('local build output and secrets under site/ stay out of the context', () => {
  for (const path of ['site/node_modules', 'site/dist', 'site/.astro', 'site/public/beoe', 'site/.env*']) {
    assert.ok(ignore.includes(path), `${path} is not excluded`);
  }
});

test('every path the Dockerfile copies from the context is let back in', () => {
  const sources = [...dockerfile.matchAll(/^COPY\s+(?!--from)(?:--\S+\s+)*(.+)\s+\S+$/gm)].flatMap((m) => m[1].split(/\s+/));
  assert.ok(sources.length > 0, 'no COPY from the context found');
  for (const source of sources) {
    assert.ok(source === 'version.txt' || source.startsWith('site/'), `${source} is excluded by .dockerignore`);
  }
});

test('every ARG is one the image workflow passes, or one BuildKit sets', () => {
  const passed = [...read('.github/workflows/build-image.yml').matchAll(/^\s+([A-Z_]+)=\$\{\{/gm)].map((m) => m[1]);
  const declared = [...dockerfile.matchAll(/^ARG\s+([A-Z_]+)/gm)].map((m) => m[1]);
  assert.deepEqual(declared.filter((name) => !passed.includes(name) && name !== 'BUILDPLATFORM'), []);
});

test('base images are pinned by digest', () => {
  const bases = [...dockerfile.matchAll(/^FROM\s+(?:--platform=\S+\s+)?(\S+)/gm)].map((m) => m[1]);
  assert.ok(bases.length >= 2);
  assert.deepEqual(bases.filter((image) => !/@sha256:[0-9a-f]{64}$/.test(image)), []);
});
