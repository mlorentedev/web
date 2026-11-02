/**
 * CI runs the newest Node 22 (#507).
 *
 * `.nvmrc` is a bare major, and without `check-latest` setup-node accepts any
 * 22.x cached on the runner. One stale runner then fails Astro's engine check on
 * a pull request that has nothing to do with Node.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const workflows = join(dirname(fileURLToPath(import.meta.url)), '../../.github/workflows');

const steps = readdirSync(workflows)
  .filter((file) => file.endsWith('.yml'))
  .flatMap((file) =>
    [...readFileSync(join(workflows, file), 'utf8').matchAll(/uses: actions\/setup-node@.*\n\s+with:\n((?:\s+[\w-]+:.*\n)+)/g)].map(
      (match) => ({ file, inputs: match[1] }),
    ),
  );

test('every setup-node step that reads .nvmrc asks for the latest release', () => {
  const reading = steps.filter(({ inputs }) => inputs.includes('node-version-file: .nvmrc'));
  assert.ok(reading.length >= 3, `found only ${reading.length} steps`);
  const missing = reading.filter(({ inputs }) => !/check-latest: true/.test(inputs)).map(({ file }) => file);
  assert.deepEqual(missing, []);
});
