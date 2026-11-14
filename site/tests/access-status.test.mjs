/**
 * The weekly access check records what it saw (WEB-173, #535 option A).
 *
 * `access.live.mjs` says pass or fail. A status row on `/lab` needs the
 * observation itself, with its date: what each host answered on the day of the
 * last check. `npm run access:report` writes that to
 * `src/data/access-status.json`, and this file checks the record offline:
 *
 * - `buildReport` turns observations into the record with the same rules the
 *   live check asserts (`classify`, `matches`), so the two cannot disagree;
 * - the committed record covers exactly the rows of the access table, and each
 *   `ok` is what `matches` says of its `state`.
 *
 * A red check is still recorded, with `ok: false`. The record is the
 * observation; the red step in the workflow is the alarm.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { STATES, buildReport, matches } from './lib/access.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const data = (file) => JSON.parse(readFileSync(join(here, '..', 'src/data', file), 'utf8'));
const table = data('service-access.json');

const rows = [
  { slug: 'pollex', access: 'public', url: 'https://pollex.example/' },
  { slug: 'gitea', access: 'app-login', url: 'https://gitea.example/', probe: { path: '/x', status: 303 }, onDemand: true },
  { slug: 'traefik', access: 'authelia', url: 'https://traefik.example/' },
  { slug: 'loki', access: 'mesh' },
];
const PUBLIC_IP = ['203.0.113.7'];

test('buildReport records each row as classify sees it, and whether the row still holds', () => {
  const report = buildReport({ services: rows }, {
    pollex: { addresses: PUBLIC_IP, root: { status: 200, url: 'https://pollex.example/' } },
    gitea: { addresses: PUBLIC_IP },
    traefik: { addresses: PUBLIC_IP, root: { status: 200, url: 'https://traefik.example/' } },
    loki: { addresses: [] },
  }, new Date('2026-11-16T06:17:00Z'));

  assert.equal(report.checked, '2026-11-16');
  assert.deepEqual(report.rows, {
    pollex: { state: 'public', ok: true },
    gitea: { state: 'silent', ok: true },
    traefik: { state: 'public', ok: false },
    loki: { state: 'mesh', ok: true },
  });
});

test('buildReport refuses a row with no observation rather than recording a guess', () => {
  assert.throws(() => buildReport({ services: rows }, {}, new Date()), /pollex/);
});

test('the committed record covers the access table, and every ok follows from its state', () => {
  const status = data('access-status.json');
  assert.match(status.checked, /^\d{4}-\d{2}-\d{2}$/);
  assert.deepEqual(Object.keys(status.rows).sort(), table.services.map((r) => r.slug).sort());
  for (const row of table.services) {
    const { state, ok } = status.rows[row.slug];
    assert.ok(STATES.includes(state), `${row.slug}: unknown state "${state}"`);
    assert.equal(ok, matches(state, row), `${row.slug}: ok must be what matches() says of "${state}"`);
  }
});
