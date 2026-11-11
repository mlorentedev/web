/**
 * The dotfiles harness as it is in the repository (#593). `harness-tree.txt` is
 * `git ls-tree -r <commit> harness` in mlorentedev/dotfiles, byte for byte; `tree`
 * is the id git gives `<commit>:harness`. Change the three together.
 */
import listing from './harness-tree.txt?raw';
import { drawTree, parseListing } from '../lib/harness-tree.mjs';

export const harnessTree = {
  repo: 'mlorentedev/dotfiles',
  commit: 'c3ff137e84a5d5f2b79b5eb83362a85d7419af41',
  tree: '588f23db73209a79cdf81d4fcf204001cb999a30',
  root: 'harness',
  depth: 2,
};

export const harnessEntries = parseListing(listing);
export const harnessDrawing = drawTree(harnessEntries, harnessTree.root, harnessTree.depth);
