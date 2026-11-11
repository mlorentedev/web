/**
 * The harness tree on /ai is the repository's (#593).
 *
 * `src/data/harness-tree.txt` is `git ls-tree -r <commit> harness` from
 * mlorentedev/dotfiles. The first test rebuilds the id git gives that tree from
 * the listing alone, modes, names and blob ids, and compares it with the id
 * pinned in `harness-tree.ts`; anyone can confirm that id upstream with
 * `git rev-parse <commit>:harness`. A listing edited by hand goes red.
 *
 *   npm run build && npm test
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { drawTree, parseListing } from '../src/lib/harness-tree.mjs';

const site = join(dirname(fileURLToPath(import.meta.url)), '..');
const data = readFileSync(join(site, 'src/data/harness-tree.ts'), 'utf8');
const pinned = (key) => data.match(new RegExp(`${key}: '([^']+)'`))[1];
const entries = parseListing(readFileSync(join(site, 'src/data/harness-tree.txt'), 'utf8'));
const root = pinned('root');

/** git's object id for a tree, built bottom-up from `ls-tree -r` lines. */
function treeId(items, prefix) {
  const children = new Map();
  for (const item of items) {
    const [head, ...rest] = item.path.slice(prefix.length + 1).split('/');
    if (!children.has(head)) children.set(head, []);
    children.get(head).push(rest.length ? item : { ...item, leaf: true });
  }
  const rows = [...children].map(([name, group]) =>
    group[0].leaf
      ? { name, key: name, mode: group[0].mode, sha: group[0].sha }
      : { name, key: `${name}/`, mode: '40000', sha: treeId(group, `${prefix}/${name}`) },
  );
  rows.sort((a, b) => Buffer.compare(Buffer.from(a.key), Buffer.from(b.key)));
  const body = Buffer.concat(rows.map((r) => Buffer.concat([Buffer.from(`${r.mode} ${r.name}\0`), Buffer.from(r.sha, 'hex')])));
  return createHash('sha1').update(`tree ${body.length}\0`).update(body).digest('hex');
}

test('the committed listing is the pinned tree, byte for byte', () => {
  assert.ok(entries.length > 0, 'empty listing');
  assert.equal(treeId(entries, root), pinned('tree'));
});

const decode = (html) => html.replace(/&(amp|lt|gt|quot|#39);/g, (_, e) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" })[e]);

for (const page of ['ai', 'es/ai']) {
  test(`/${page}/ draws that listing and links the tree at its commit`, () => {
    const file = join(site, 'dist', page, 'index.html');
    assert.ok(existsSync(file), 'run the build first');
    const html = readFileSync(file, 'utf8');
    const pre = html.match(/<pre[^>]*data-harness-tree[^>]*>([\s\S]*?)<\/pre>/)?.[1];
    assert.ok(pre, 'no harness tree on the page');
    assert.equal(decode(pre), drawTree(entries, root, Number(data.match(/depth: (\d+)/)[1])));
    assert.ok(html.includes(`https://github.com/${pinned('repo')}/tree/${pinned('commit')}/${root}`), 'no link to the pinned tree');
  });
}
