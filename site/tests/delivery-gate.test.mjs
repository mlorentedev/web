/**
 * The suite gates the image production ships (#343).
 *
 * Until #343 the tests ran on pull requests only. With `strict: false` a PR may
 * merge against a stale base, so the merge commit — the one `release.yml`
 * builds into `sha-<short>`, dispatches to staging and later re-tags for prod
 * by digest (ADR-055) — had never had a test run against it. Every job was
 * green because none that could be red was asked.
 *
 * The fix is structural, so this file asserts the structure: which jobs call
 * the suite, and which jobs cannot start until it passes. It was verified once
 * by mutation (a deliberately failing test on a dispatched run, `build`
 * skipped, no image published); this is what keeps that true after the next
 * edit to a workflow, which the one-off run cannot do.
 *
 * The workflows are read as text. No YAML parser is a direct dependency of
 * `site/`, and importing a transitive one would make this guard's green depend
 * on a lockfile it does not own. The helpers below understand exactly the
 * shapes these files use, and the first test fails if that stops being true.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const workflow = (name) => readFileSync(join(root, '.github/workflows', name), 'utf8');

const SUITE = './.github/workflows/test.yml';

/** The body of top-level job `name`: every line up to the next job or EOF. */
const job = (text, name) => {
  const lines = text.split('\n');
  const start = lines.indexOf(`  ${name}:`);
  if (start === -1) return undefined;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => /^ {2}[A-Za-z0-9_-]+:\s*$/.test(l) || /^\S/.test(l));
  return (end === -1 ? rest : rest.slice(0, end)).join('\n');
};

/** `needs: x` or `needs: [x, y]`, as a list. Empty when the job has none. */
const needsOf = (body) => {
  const m = body.match(/^ {4}needs:\s*(.+)$/m);
  if (!m) return [];
  return m[1]
    .replace(/[[\]]/g, '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

const usesOf = (body) => body.match(/^ {4}uses:\s*(\S+)\s*$/m)?.[1];

/** Every job transitively required before `name` may start. */
const upstream = (text, name, seen = new Set()) => {
  for (const dep of needsOf(job(text, name) ?? '')) {
    if (!seen.has(dep)) {
      seen.add(dep);
      upstream(text, dep, seen);
    }
  }
  return seen;
};

const release = workflow('release.yml');
const validation = workflow('pr-validation.yml');
const suite = workflow('test.yml');
const imageBuild = workflow('build-image.yml');

/** The step whose `- name:` is `name`, up to the next step or the end of the job. */
const step = (text, name) => {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => l.trim() === `- name: ${name}`);
  if (start === -1) return undefined;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => /^ {6}- /.test(l) || /^ {0,4}\S/.test(l));
  return [lines[start], ...(end === -1 ? rest : rest.slice(0, end))].join('\n');
};

test('the helpers read these workflows the way the assertions assume', () => {
  // If a job moved or the `needs` syntax changed shape, every assertion below
  // could pass against an empty string. Pin what they read first.
  for (const [file, text, jobs] of [
    ['release.yml', release, ['release-please', 'meta', 'test', 'build', 'test-image', 'dispatch-staging', 'promote-prod']],
    ['pr-validation.yml', validation, ['test', 'validate', 'closing-refs', 'gate']],
  ]) {
    for (const name of jobs) {
      assert.ok(job(text, name), `${file} has no job \`${name}\` — the helpers are reading the wrong shape`);
    }
  }
  assert.deepEqual(needsOf(job(release, 'promote-prod')), ['release-please', 'meta', 'build', 'test-image']);
  assert.ok(!job(release, 'test').includes('build:'), 'a job body must stop at the next job');
  for (const name of ['Build', 'Extract the tree the image serves']) {
    assert.ok(step(suite, name), `test.yml has no step \`${name}\` — the helpers are reading the wrong shape`);
  }
  assert.ok(
    !step(suite, 'Build').split('\n').slice(1).some((l) => l.includes('- name:')),
    'a step body must stop at the next step',
  );
});

test('the suite is defined once, and both the PR and the master push call it', () => {
  assert.match(suite, /^ {2}workflow_call:\s*$/m, 'test.yml must be callable');
  assert.equal(usesOf(job(release, 'test')), SUITE, 'release.yml must run the shared suite');
  assert.equal(usesOf(job(validation, 'test')), SUITE, 'pr-validation.yml must run the shared suite');
});

test('nothing that ships can start before the suite passes', () => {
  // `build` is the direct edge. The other two are asserted transitively,
  // because what matters is that no path to staging or prod skips the suite,
  // not which job happens to carry the edge.
  for (const shipper of ['build', 'dispatch-staging', 'promote-prod']) {
    assert.ok(
      upstream(release, shipper).has('test'),
      `\`${shipper}\` can run without \`test\` having passed — a red suite would still ship (#343)`,
    );
  }
});

test('the image that ships is the one the suite tested (#376)', () => {
  // `test` checks a runner build of the commit; the image carries a second
  // build of it. `test-image` runs the same suite on the tree the image
  // serves, addressed by the digest `build` pushed, and both shippers wait for
  // it. `promote-prod` does not go through `dispatch-staging`, so each is
  // asserted on its own.
  const shipped = job(release, 'test-image');
  assert.equal(usesOf(shipped), SUITE, '`test-image` must run the shared suite, not a copy of it');
  assert.match(
    shipped,
    /^ {6}image: \S+@\$\{\{ needs\.build\.outputs\.digest \}\}\s*$/m,
    '`test-image` must address the image by the digest `build` pushed, never by a tag',
  );
  assert.ok(needsOf(shipped).includes('build'), '`test-image` must need `build` to have a digest to test');
  for (const shipper of ['dispatch-staging', 'promote-prod']) {
    assert.ok(
      upstream(release, shipper).has('test-image'),
      `\`${shipper}\` can run before the shipped image was tested`,
    );
  }

  // The digest has to exist to be passed on.
  assert.match(imageBuild, /^ {6}digest:\s*$[\s\S]*?value: \$\{\{ jobs\.build\.outputs\.digest \}\}/m);
  assert.match(imageBuild, /^ {6}digest: \$\{\{ steps\.build\.outputs\.digest \}\}\s*$/m);
  assert.match(step(imageBuild, 'Build and push'), /^ {8}id: build\s*$/m);

  // In the suite, an image replaces the build instead of running beside it:
  // with both, the tests would read whichever wrote `dist/` last.
  assert.match(step(suite, 'Build'), /^ {8}if: inputs\.image == ''\s*$/m);
  const extract = step(suite, 'Extract the tree the image serves');
  assert.match(extract, /^ {8}if: inputs\.image != ''\s*$/m);
  assert.match(extract, /^ {8}run: node scripts\/served-tree\.mjs "\$IMAGE" dist\s*$/m);

  // The pull needs a login, and the login leaves a push-capable token on disk.
  // It must be gone before the suite runs dependency code, whether or not the
  // extraction succeeded.
  const logout = step(suite, 'Logout from Docker Hub');
  assert.ok(logout, 'test.yml must log out of Docker Hub after the extraction');
  assert.match(logout, /^ {8}if: always\(\) && inputs\.image != ''\s*$/m);
  assert.match(logout, /^ {8}run: docker logout docker\.io\s*$/m);
  const at = (name) => suite.indexOf(`- name: ${name}\n`);
  assert.ok(
    at('Extract the tree the image serves') < at('Logout from Docker Hub') && at('Logout from Docker Hub') < at('Test'),
    'the logout must come after the extraction and before the suite',
  );

  // What leaves for staging and prod is that same digest.
  const guard = step(release, 'Require the tag to name the tested digest');
  assert.ok(guard, '`dispatch-staging` must check the tag still names the tested digest');
  assert.match(guard, /TESTED: \$\{\{ needs\.build\.outputs\.digest \}\}/);
  assert.ok(
    job(release, 'dispatch-staging').indexOf('Require the tag to name the tested digest') <
      job(release, 'dispatch-staging').indexOf('Fire repository_dispatch to kubelab'),
    'the tag must be checked before the dispatch, not after',
  );
  const retag = step(release, 'Re-tag the validated digest as the semver release');
  assert.match(retag, /DIGEST: \$\{\{ needs\.build\.outputs\.digest \}\}/);
  assert.match(retag, /"\$\{IMAGE\}@\$\{DIGEST\}"\s*$/m, 'prod must be re-tagged from the tested digest, not from the sha tag');
});

test('the PR gate still requires the suite', () => {
  assert.ok(needsOf(job(validation, 'gate')).includes('test'), '`PR gate` must list `test` in `needs`');
});

test('every test script in package.json runs in the shared suite', () => {
  // #343 AC4. `npm test` alone does not run the browser or a11y suites, so a
  // script added to package.json and not to test.yml would pass locally, pass
  // CI, and check nothing. `test:audit` is the one deliberate exclusion: it is
  // `lab-audit.test.mjs`, which `npm test`'s glob already runs.
  const { scripts } = JSON.parse(readFileSync(join(here, '../package.json'), 'utf8'));
  const excluded = new Set(['test:audit']);
  assert.match(scripts['test:audit'], /tests\/lab-audit\.test\.mjs$/, 'test:audit is excluded only while npm test covers it');

  const expected = Object.keys(scripts).filter((s) => /^test(:|$)/.test(s) && !excluded.has(s));
  assert.ok(expected.length >= 3, 'expected at least test, test:browser and test:a11y');
  for (const script of expected) {
    const run = script === 'test' ? 'npm test' : `npm run ${script}`;
    assert.match(
      suite,
      new RegExp(`^ +run: ${run.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'm'),
      `test.yml never runs \`${run}\``,
    );
  }
});
