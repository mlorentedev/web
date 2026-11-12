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
  // `lab-audit.test.mjs`, which `npm test`'s glob already runs. `test:access`
  // runs in its own workflow instead: it measures the live hosts (#292), so on
  // a pull request it would fail on the cluster's state rather than the change.
  // `test:all` is the local shorthand for the three scripts CI runs step by step,
  // so it is held to exactly those three.
  const { scripts } = JSON.parse(readFileSync(join(here, '../package.json'), 'utf8'));
  const elsewhere = { 'test:access': 'access-check.yml', 'test:links': 'access-check.yml' };
  const excluded = new Set(['test:audit', 'test:all', ...Object.keys(elsewhere)]);
  assert.equal(scripts['test:all'], 'npm test && npm run test:browser && npm run test:a11y');
  assert.match(scripts['test:audit'], /tests\/lab-audit\.test\.mjs$/, 'test:audit is excluded only while npm test covers it');
  for (const [script, file] of Object.entries(elsewhere)) {
    assert.match(workflow(file), new RegExp(`^ +run: npm run ${script}\\s*$`, 'm'), `${file} never runs \`npm run ${script}\``);
  }

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

test('Chromium and its system packages come from caches keyed on the Playwright version, and each install step fails on its own budget (WEB-201)', () => {
  // An uncached download once took 7 of the job's 10 minutes, and the gate said only "test (cancelled)".
  const installs = suite
    .split('\n')
    .filter((l) => l.trim().startsWith('- name: '))
    .map((l) => step(suite, l.trim().slice('- name: '.length)))
    .filter((body) => /npx playwright install/.test(body));
  assert.ok(installs.length > 0, 'test.yml installs no browser: the build renders diagrams with one');
  for (const body of installs) {
    assert.match(body, /^ {8}timeout-minutes:\s*\d+\s*$/m, `this step has no budget of its own:\n${body}`);
  }
  // A step budget names the stalled step only if it fires first: every install at its limit,
  // plus the measured 3 minutes of build and tests and a margin, must fit in the job's budget.
  const jobBudget = Number(job(suite, 'test')?.match(/^ {4}timeout-minutes:\s*(\d+)/m)?.[1]);
  const stepBudgets = installs.reduce((sum, body) => sum + Number(body.match(/timeout-minutes:\s*(\d+)/)[1]), 0);
  const REST_OF_THE_JOB = 3 + 3;
  assert.ok(
    stepBudgets + REST_OF_THE_JOB <= jobBudget,
    `install budgets ${stepBudgets} min + ${REST_OF_THE_JOB} min of work exceed the job's ${jobBudget}: the job would time out first`,
  );
  const resolve = step(suite, 'Resolve the Playwright version');
  assert.match(resolve, /\$\{version:\?/, 'an unresolved Playwright version is written as an empty key part');
  const cache = step(suite, 'Restore Chromium from the cache');
  assert.ok(cache, 'test.yml has no Chromium cache step');
  assert.match(cache, /uses:\s*actions\/cache\/restore@[0-9a-f]{40}\b/, 'the restore action is pinned by sha');
  assert.match(cache, /path:\s*~\/\.cache\/ms-playwright/);
  assert.match(cache, /key:.*steps\.playwright\.outputs\.version/, 'a key without the version restores a Chromium the new Playwright does not use');
  const download = installs.find((body) => /run:\s*npx playwright install chromium\s*$/m.test(body));
  assert.ok(download, 'no step downloads the browser on a cache miss');
  assert.match(download, /if:\s*steps\.chromium-cache\.outputs\.cache-hit != 'true'/, 'the download runs even on a cache hit');
  // Saved by its own step, right after the download: a post-step save is skipped when a later step fails.
  for (const [name, id] of [['Save Chromium to the cache', 'chromium-cache'], ["Save Chromium's system packages to the cache", 'apt-cache']]) {
    const save = step(suite, name);
    assert.ok(save, `test.yml has no "${name}" step`);
    assert.match(save, /uses:\s*actions\/cache\/save@[0-9a-f]{40}\b/, `${name}: not the pinned save action`);
    assert.match(save, new RegExp(`if:\\s*steps\\.${id}\\.outputs\\.cache-hit != 'true'`), `${name}: saves even on an exact hit`);
    assert.match(save, new RegExp(`key:\\s*\\$\\{\\{ steps\\.${id}\\.outputs\\.cache-primary-key \\}\\}`), `${name}: saves under another key than it restores`);
  }
  // apt was the slow half: its .deb files are kept in the directory the second cache saves.
  const aptCache = step(suite, "Restore Chromium's system packages from the cache");
  assert.ok(aptCache, 'test.yml has no cache for the system packages');
  const aptDir = aptCache.match(/path:\s*(\S+)/)?.[1];
  const deps = installs.find((body) => /npx playwright install-deps chromium/.test(body));
  assert.ok(deps, 'no step installs the system libraries');
  assert.ok(aptDir && deps.includes(`Dir::Cache::Archives "%s"`) && deps.includes(aptDir.replace('~', '$HOME')), `apt does not keep its downloads in ${aptDir}`);
  assert.match(deps, /Keep-Downloaded-Packages "true"/, 'apt deletes what it downloaded, so the cache saves nothing');
  // The `env` context holds only what the workflow sets, never the runner's own variables:
  // `env.ImageVersion` was empty, and the key was saved ending in a bare `-`.
  assert.doesNotMatch(suite, /\$\{\{\s*env\.ImageVersion\s*\}\}/, 'env.ImageVersion is always empty in an expression');
  assert.match(aptCache, /key:.*steps\.playwright\.outputs\.image/, 'the apt key does not name the runner image');
});

test('the repo hygiene checks run inside the PR gate, once per pull request (WEB-124)', () => {
  // A job in another workflow is outside what `gate` can observe: a red lessons index sat
  // beside a green gate and blocked nothing. Called from here, it is in `needs` like `test`.
  const hygiene = workflow('repo-hygiene.yml');
  const caller = job(validation, 'hygiene');
  assert.ok(caller, 'pr-validation.yml has no hygiene job');
  assert.equal(usesOf(caller), './.github/workflows/repo-hygiene.yml', 'the hygiene job does not call repo-hygiene.yml');
  assert.ok(needsOf(job(validation, 'gate')).includes('hygiene'), 'the gate does not need the hygiene job');
  assert.match(hygiene, /^ {2}workflow_call:/m, 'repo-hygiene.yml cannot be called');
  // Its own `pull_request` trigger would run every check twice per PR, under two names.
  assert.doesNotMatch(hygiene, /^ {2}pull_request:/m, 'repo-hygiene.yml still runs on pull_request by itself');
  assert.match(hygiene, /^ {2}push:\s*\n {4}branches: \[master\]/m, 'repo-hygiene.yml no longer checks master after a merge');
  // The lessons check is dotf's, run through the fleet's hygiene composite pinned by SHA (CI-005).
  assert.match(hygiene, /uses: mlorentedev\/ci-workflows\/\.github\/actions\/hygiene@[0-9a-f]{40}\b/, 'repo-hygiene.yml no longer runs the hygiene composite');
  // Its `lessons` input defaults to true; set false, the composite skips the lessons check.
  assert.doesNotMatch(hygiene, /^\s*lessons:\s*['"]?false\b/m, 'repo-hygiene.yml turns off the composite lessons check');
  for (const script of ['check-actions-pinned.sh', 'check-doc-refs.sh', 'check-agents-stack.sh']) {
    assert.match(hygiene, new RegExp(`run: bash scripts/${script.replace('.', '\\.')}`), `repo-hygiene.yml no longer runs ${script}`);
  }
});

test('every image build is scanned, pull requests included, and a CRITICAL finding blocks it (WEB-119)', () => {
  // `if: inputs.push` scanned only images already published: never the one a PR could still stop.
  const build = step(imageBuild, 'Build and push');
  const scan = step(imageBuild, 'Trivy image scan');
  const upload = step(imageBuild, 'Upload Trivy SARIF');
  assert.ok(build && scan && upload, 'build-image.yml lost its build, scan or SARIF step');
  assert.doesNotMatch(scan, /^ {8}if:/m, 'the scan is conditional again: PR builds go unscanned');
  // A build that is not pushed must be loaded into the runner's docker, or there is nothing to scan.
  assert.match(build, /^ {10}load: \$\{\{ !inputs\.push \}\}$/m, 'an unpushed build is not loaded, so the scan finds no image');
  assert.match(upload, /^ {8}if: \$\{\{ hashFiles\('trivy-results\.sarif'\) != '' \}\}$/m, 'the SARIF upload is gated on more than the report existing, so PR builds can be dropped');
  // The upload sends any file by that name, so one committed in the checkout must be gone before the scan.
  const discard = imageBuild.indexOf('rm -f trivy-results.sarif');
  assert.ok(discard !== -1 && discard < imageBuild.indexOf('- name: Trivy image scan'), 'a SARIF committed in the checkout could be uploaded as the scan');
  assert.match(upload, /continue-on-error: true/, 'a SARIF endpoint hiccup fails the build');
  // `load` cannot take more than one platform, so every caller that does not push builds one.
  for (const caller of [validation, release]) {
    for (const [, body] of caller.matchAll(/uses: \.\/\.github\/workflows\/build-image\.yml\n([\s\S]*?)(?=\n {2}[A-Za-z0-9_-]+:\s*\n|$)/g)) {
      if (!/push: false/.test(body)) continue;
      const platforms = body.match(/platforms:\s*(\S+)/)?.[1] ?? '';
      assert.ok(platforms && !platforms.includes(','), `an unpushed build asks for platforms "${platforms}", which load cannot take`);
    }
  }
  // The SARIF scan reports CRITICAL and HIGH and never fails the job; a second step blocks on CRITICAL alone.
  assert.doesNotMatch(scan, /exit-code: ['"]?1/, 'the report scan blocks, so a HIGH fails the build');
  const gate = step(imageBuild, 'Trivy gate on CRITICAL');
  assert.ok(gate, 'no step blocks the build on a CRITICAL finding (WEB-119 AC3)');
  assert.doesNotMatch(gate, /^ {8}if:/m, 'the gate is conditional: some builds go unblocked');
  assert.match(gate, /exit-code: ['"]?1['"]?$/m, 'the gate does not fail the job on a finding');
  assert.match(gate, /severity: ['"]?CRITICAL['"]?$/m, 'the gate blocks on more than CRITICAL; HIGH is advisory');
  assert.match(gate, /ignore-unfixed: true/, 'the gate blocks on findings no base image can fix yet');
  // `exit-code: 1` under `continue-on-error: true` never fails the job.
  assert.doesNotMatch(gate, /continue-on-error/, 'the gate cannot fail the job');
  // After the upload, so a blocked build still shows what blocked it in the Security tab.
  const [gateAt, uploadAt] = ['Trivy gate on CRITICAL', 'Upload Trivy SARIF'].map((n) => imageBuild.indexOf(`- name: ${n}`));
  assert.ok(uploadAt !== -1 && gateAt > uploadAt, 'a blocked build uploads no SARIF');
});

test('the image build cache lives in the registry, and only a pushed build writes it (WEB-202)', () => {
  // `type=gha,mode=max` kept the Actions cache at its 10 GB ceiling, so GitHub
  // evicted the npm and Playwright caches between runs. The buildkit layers now
  // sit on a `buildcache` tag that registry-hygiene never prunes (it touches
  // only `sha-*`). A PR build reads that tag anonymously and writes nothing.
  const build = step(imageBuild, 'Build and push');
  assert.ok(build, 'build-image.yml has no "Build and push" step');
  const code = build.split('\n').filter((l) => !/^\s*#/.test(l)).join('\n');
  assert.doesNotMatch(code, /type=gha/, 'the image build still reads or writes the Actions cache');
  const from = build.match(/^\s*cache-from:\s*(.+)$/m)?.[1] ?? '';
  const to = build.match(/^\s*cache-to:\s*(.+)$/m)?.[1] ?? '';
  assert.match(from, /type=registry,ref=\$\{\{ env\.IMAGE \}\}:buildcache\b/, 'cache-from does not read the buildcache tag');
  assert.match(to, /^\$\{\{ inputs\.push && /, 'cache-to is not limited to pushed builds');
  assert.match(to, /type=registry,ref=\{0\}:buildcache,mode=max/, 'cache-to does not write every stage to the buildcache tag');

  // `mode=max` publishes every intermediate layer on a public tag, so nothing
  // secret may reach the build: no secret inputs on the step, and no build
  // argument beyond the commit sha, which is public anyway.
  assert.doesNotMatch(code, /^\s*(secrets|secret-files|secret-envs):/m, 'the image build receives a secret');
  const dockerfile = readFileSync(join(root, 'Dockerfile'), 'utf8');
  const args = [...dockerfile.matchAll(/^ARG\s+(\w+)/gm)].map((m) => m[1]);
  assert.deepEqual(args, ['SITE_COMMIT'], 'a new build argument would be published in the cache layers');
});
