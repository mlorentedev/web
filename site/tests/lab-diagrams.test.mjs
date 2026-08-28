/**
 * The diagram pipeline's contract (WEB-080, AC2).
 *
 * The Lab's diagrams are committed twice: once as a typed archify IR, which is
 * the source a human edits, and once as the SVG rendered from it, which is what
 * the page inlines. Rendering needs archify, and archify is not in this
 * repository — #242 installed it as an authoring-time agent skill and
 * deliberately kept its 6.7 MB payload out of git. So CI cannot re-render to
 * check the two agree.
 *
 * What CI can do is refuse a diagram that is malformed or stale, and that is
 * what these tests assert:
 *
 *   - every IR validates against archify's own schema (vendored as data in
 *     `vendor/archify-schemas/`, 12 KB of JSON, not the renderer);
 *   - every IR has a generated SVG, and that SVG carries the accessibility
 *     payload the whole toolchain was chosen for;
 *   - the SVG's `ir-sha256` stamp matches the IR it was rendered from, so
 *     editing the source without re-running `npm run diagrams` fails the build
 *     rather than shipping a page that disagrees with its own source.
 *
 * The stamp is what closes the gap left by not rendering in CI. It is not
 * tamper-proof — someone can edit both — but it makes drift impossible by
 * accident, which is the failure mode that actually happens.
 */

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

// archify's schemas declare draft 2020-12, which ajv's default export rejects.
import Ajv from 'ajv/dist/2020.js';

const here = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(here, '..');
const diagramsDir = join(siteRoot, 'src/diagrams');
const generatedDir = join(diagramsDir, 'generated');
const schemasDir = join(siteRoot, 'vendor/archify-schemas');

const irFiles = existsSync(diagramsDir)
  ? readdirSync(diagramsDir).filter((f) => f.endsWith('.architecture.json'))
  : [];

/** archify's schemas `$ref` each other by bare filename, so both are registered. */
function architectureValidator() {
  const ajv = new Ajv({ allErrors: true, strict: false });
  const common = JSON.parse(readFileSync(join(schemasDir, 'common.schema.json'), 'utf8'));
  const architecture = JSON.parse(readFileSync(join(schemasDir, 'architecture.schema.json'), 'utf8'));
  ajv.addSchema(common, 'common.schema.json');
  return ajv.compile(architecture);
}

test('there is at least one diagram to check', () => {
  assert.ok(irFiles.length > 0, `no *.architecture.json found in ${diagramsDir}`);
});

test('every IR validates against the archify architecture schema', () => {
  const validate = architectureValidator();
  for (const file of irFiles) {
    const ir = JSON.parse(readFileSync(join(diagramsDir, file), 'utf8'));
    const ok = validate(ir);
    assert.ok(ok, `${file} does not validate:\n${JSON.stringify(validate.errors, null, 2)}`);
  }
});

test('every IR has a generated SVG carrying its accessibility payload', () => {
  for (const file of irFiles) {
    const svgPath = join(generatedDir, `${file.replace('.architecture.json', '')}.svg`);
    assert.ok(existsSync(svgPath), `${svgPath} is missing — run \`npm run diagrams\``);
    const svg = readFileSync(svgPath, 'utf8');

    const count = (re) => (svg.match(re) || []).length;
    // The floors are deliberately below what the first diagram measured (15
    // role, 25 aria, 36 text) so a smaller diagram is allowed, but a diagram
    // that lost its semantics — the defect #244 found in the mermaid output —
    // is not.
    assert.ok(count(/\brole="/g) >= 1, `${file}: no role= in the SVG`);
    assert.ok(count(/\baria-[a-z]+="/g) >= 10, `${file}: fewer than 10 aria-* in the SVG`);
    assert.ok(count(/<text\b/g) >= 8, `${file}: fewer than 8 <text> — is the text real?`);

    // Absent from what archify extracts; harmless inline, fatal standalone.
    assert.match(svg, /xmlns="http:\/\/www\.w3\.org\/2000\/svg"/, `${file}: SVG has no xmlns`);
    // The extracted SVG carries no styles of its own; without the injected
    // stylesheet it renders colourless.
    assert.match(svg, /<style>/, `${file}: SVG has no inlined stylesheet`);
  }
});

test('every generated SVG is stamped with the sha256 of the IR it came from', () => {
  for (const file of irFiles) {
    const irBytes = readFileSync(join(diagramsDir, file));
    const svgPath = join(generatedDir, `${file.replace('.architecture.json', '')}.svg`);
    const svg = readFileSync(svgPath, 'utf8');

    const stamp = svg.match(/<!-- ir-sha256: ([0-9a-f]{64}) -->/);
    assert.ok(stamp, `${svgPath} carries no ir-sha256 stamp`);
    assert.equal(
      stamp[1],
      createHash('sha256').update(irBytes).digest('hex'),
      `${file} changed since its SVG was generated — run \`npm run diagrams\``,
    );
  }
});

test('a malformed IR fails the pipeline', () => {
  const fixture = join(here, 'fixtures/malformed.architecture.json');
  assert.ok(existsSync(fixture), `${fixture} is missing`);
  assert.throws(
    () => execFileSync(process.execPath, [join(siteRoot, 'scripts/diagrams.mjs'), 'verify', fixture], {
      stdio: 'pipe',
    }),
    'a malformed IR was accepted — the build guarantee is not real',
  );
});
