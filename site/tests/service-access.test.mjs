/**
 * The Lab's access table is committed, measured and complete (WEB-141 AC2, #292).
 *
 * `src/data/service-access.json` says, for every service in `platform.json`, who
 * can reach it: `public`, `authelia` (a redirect to the Authelia portal),
 * `app-login` (the service asks for its own credentials) or `mesh` (no public
 * DNS). This file checks the table offline; `access.live.mjs` (`npm run
 * test:access`, weekly in CI) checks it against the live hosts.
 *
 * ADR-056 §3: only a service that resolves in public DNS ships a `url`, so a
 * `mesh` row has none and every other row has one.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { ACCESS, classify, isInternalAddress } from './lib/access.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const data = (file) => JSON.parse(readFileSync(join(here, '..', 'src/data', file), 'utf8'));
const table = data('service-access.json');
const platform = data('platform.json');

test('the access table has exactly one row per platform service', () => {
  assert.deepEqual(
    table.services.map((row) => row.slug).sort(),
    platform.services.map((service) => service.slug).sort(),
  );
});

test('the access table says when and how it was measured', () => {
  assert.match(table.measured, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(table.method?.trim(), 'no method');
});

test('every row has a known access, and a URL exactly when it is not mesh', () => {
  for (const row of table.services) {
    assert.ok(ACCESS.includes(row.access), `${row.slug}: unknown access "${row.access}"`);
    if (row.access === 'mesh') assert.equal(row.url, undefined, `${row.slug}: a mesh service ships no URL (ADR-056 §3)`);
    else assert.match(row.url ?? '', /^https:\/\//, `${row.slug}: a reachable service needs an https URL`);
  }
});

test('an app-login row names the probe that proves the service asks for credentials', () => {
  for (const row of table.services.filter((r) => r.access === 'app-login')) {
    assert.match(row.probe?.path ?? '', /^\//, `${row.slug}: no probe path`);
    assert.ok(Number.isInteger(row.probe?.status), `${row.slug}: no probe status`);
  }
});

test('platform.json no longer carries its own access claim', () => {
  for (const service of platform.services) {
    assert.equal(service.isPublic, undefined, `${service.slug}: isPublic is the table's job now`);
    assert.equal(service.url, undefined, `${service.slug}: the URL lives in the access table`);
  }
});

// ------------------------------------------------------------- the classifier

const PUBLIC = ['162.55.57.175'];

test('isInternalAddress: CGNAT and private ranges are internal, a public address is not', () => {
  for (const address of ['100.64.0.11', '100.127.255.1', '10.0.0.1', '192.168.1.1', '172.16.0.1', '127.0.0.1']) {
    assert.ok(isInternalAddress(address), address);
  }
  for (const address of ['162.55.57.175', '100.63.0.1', '100.128.0.1', '172.32.0.1', '172.67.175.250']) {
    assert.ok(!isInternalAddress(address), address);
  }
});

test('classify: the responses recorded on 2026-09-26', () => {
  const cases = [
    ['grafana: 302 to the portal', { addresses: PUBLIC, root: { status: 302, location: 'https://auth.kubelab.live/?rd=x' } }, undefined, 'authelia'],
    ['argocd: 200 page, API 401', { addresses: PUBLIC, root: { status: 200 }, probeStatus: 401 }, 401, 'app-login'],
    ['gitea: explore redirects to its own login', { addresses: PUBLIC, root: { status: 200 }, probeStatus: 303 }, 303, 'app-login'],
    ['status: redirect to its own dashboard', { addresses: PUBLIC, root: { status: 302, location: 'https://status.kubelab.live/dashboard' } }, undefined, 'public'],
    ['pollex: GitHub Pages 200', { addresses: ['185.199.108.153'], root: { status: 200 } }, undefined, 'public'],
    ['loki: no public A record', { addresses: [] }, undefined, 'mesh'],
    ['pihole: a CGNAT address in public DNS', { addresses: ['100.64.0.11'], root: { status: 403 } }, undefined, 'mesh'],
    ['argocd with the gate gone: probe answers 200', { addresses: PUBLIC, root: { status: 200 }, probeStatus: 200 }, 401, 'public'],
    ['a public host that errors', { addresses: PUBLIC, root: { status: 502 } }, undefined, 'unreachable'],
  ];
  for (const [name, seen, expectedProbe, expected] of cases) {
    assert.equal(classify(seen, expectedProbe), expected, name);
  }
});
