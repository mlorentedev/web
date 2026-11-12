/**
 * The gateway-path diagram cannot drift from the access table (WEB-147).
 *
 * `/lab` states a measured access for each service in `service-access.json`:
 * public, behind Authelia's forward-auth, its own login, or mesh-only. The
 * gateway-path diagram draws the path behind those badges, and each service
 * node carries its access as its `tag`. This test holds the two together:
 * every service the cluster serves has exactly one node, that node's tag is
 * the access its row states, and the node sits in that class's boundary. A
 * re-measurement that moves a service from one class to another fails here
 * until the diagram moves it too.
 *
 * Services hosted off the cluster (GitHub Pages) never cross the gateway, so
 * they are not drawn.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const read = (p) => JSON.parse(readFileSync(join(here, '..', p), 'utf8'));

const access = read('src/data/service-access.json').services;
const ir = read('src/diagrams/gateway-path.architecture.json');

const offCluster = (row) => row.url !== undefined && !new URL(row.url).hostname.endsWith('.kubelab.live');
const drawn = access.filter((row) => !offCluster(row));
const nodes = new Map(ir.components.map((c) => [c.id, c]));

test('every service the cluster serves has a node in the gateway-path diagram', () => {
  const missing = drawn.filter((row) => !nodes.has(row.slug)).map((row) => row.slug);
  assert.deepEqual(missing, [], 'services with no node');
});

test("each service node's tag is the access its row in service-access.json states", () => {
  for (const row of drawn) {
    assert.equal(nodes.get(row.slug)?.tag, row.access, `${row.slug}: diagram and access table disagree`);
  }
});

// Each access class is drawn as one boundary; a service sits in the boundary
// of its class, so a tag change that leaves the node in the wrong group fails.
const groupOf = { public: 'Public', authelia: 'Behind forward-auth', 'app-login': 'Their own login', mesh: 'Mesh only' };

test('each service node sits in the boundary of its access class', () => {
  for (const row of drawn) {
    const groups = ir.boundaries.filter((b) => b.wraps.includes(row.slug)).map((b) => b.label);
    assert.deepEqual(groups, [groupOf[row.access]], `${row.slug}: drawn in the wrong group`);
  }
});

test('the diagram draws no service the access table does not list', () => {
  const known = new Set(drawn.map((row) => row.slug));
  const accessTags = new Set(['public', 'authelia', 'app-login', 'mesh']);
  const stray = ir.components.filter((c) => accessTags.has(c.tag) && !known.has(c.id)).map((c) => c.id);
  assert.deepEqual(stray, [], 'nodes tagged with an access class but absent from the table');
});
