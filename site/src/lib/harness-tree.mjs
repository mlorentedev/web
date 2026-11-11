/**
 * The harness tree on /ai (#593): `git ls-tree -r` of dotfiles' `harness/` at a
 * pinned commit, drawn two levels deep. The listing is committed as it is in
 * `data/harness-tree.txt`; `tests/ai-harness-tree.test.mjs` rebuilds git's tree
 * id from it, so the drawing is checkable against the public repository.
 */

/** One `mode type sha\tpath` line per blob. */
export function parseListing(listing) {
  return listing
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [meta, path] = line.split('\t');
      const [mode, type, sha] = meta.split(' ');
      return { mode, type, sha, path };
    });
}

/**
 * The tree under `root`, `depth` levels deep, as `tree(1)` draws it. A
 * directory cut at the limit says how many files it holds.
 */
export function drawTree(entries, root, depth) {
  const node = () => ({ dirs: new Map(), files: [], count: 0 });
  const top = node();
  for (const { path } of entries) {
    const parts = path.slice(root.length + 1).split('/');
    let at = top;
    for (const dir of parts.slice(0, -1)) {
      at.count++;
      if (!at.dirs.has(dir)) at.dirs.set(dir, node());
      at = at.dirs.get(dir);
    }
    at.count++;
    at.files.push(parts.at(-1));
  }
  const lines = [`${root}/`];
  const walk = (at, prefix, level) => {
    const items = [
      ...[...at.dirs].map(([name, child]) => ({ name, child })),
      ...at.files.map((name) => ({ name })),
    ].sort((a, b) => a.name.localeCompare(b.name, 'en'));
    items.forEach(({ name, child }, i) => {
      const last = i === items.length - 1;
      const cut = child && level === depth;
      const label = child ? `${name}/${cut ? ` (${child.count} ${child.count === 1 ? 'file' : 'files'})` : ''}` : name;
      lines.push(`${prefix}${last ? '└── ' : '├── '}${label}`);
      if (child && !cut) walk(child, `${prefix}${last ? '    ' : '│   '}`, level + 1);
    });
  };
  walk(top, '', 1);
  return lines.join('\n');
}
