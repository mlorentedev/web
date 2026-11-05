/**
 * Two lesson PRs that are each green merge into a green master (WEB-185).
 *
 * On 2026-11-04 two PRs each added one lesson and each moved the index's hand-kept
 * "N lessons" line from 69 to 70. Both sides made the same edit to that line, so
 * git merged it without a conflict; the rows conflicted and were resolved by hand,
 * keeping both. Master ended with 71 lessons under "70 lessons" and `hygiene` went
 * red on a merge nobody could have seen fail.
 *
 * This replays that in a scratch repository: the real `docs/lessons/` and the real
 * `scripts/check-lessons.sh`, two branches off one base, each adding a lesson and
 * its row the way `_format.md` asks, then both merged, with any conflict resolved
 * the way a person does it (keep both rows, newest first). The check must pass on
 * the result, and on each branch alone.
 */
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ROW = /^\| *(\d+) *\|/;

const git = (cwd, ...args) =>
  execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', ...args], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
const check = (cwd) => spawnSync('bash', ['scripts/check-lessons.sh'], { cwd, encoding: 'utf8' });

/** What a lesson PR does: one file, one row on top, and whatever else `_format.md` asks of the index. */
function addLesson(cwd, number) {
  const dir = join(cwd, 'docs/lessons');
  const name = `lesson-${number}-replayed.md`;
  writeFileSync(join(dir, name), `---\nid: lesson-${number}\n---\n\n# Replayed ${number}\n`);
  const index = readFileSync(join(dir, '_index.md'), 'utf8').split('\n');
  const first = index.findIndex((line) => ROW.test(line));
  index.splice(first, 0, `| ${number} | [Replayed ${number}](${name}) | 2026-11-04 | \`#testing\` |`);
  const files = readdirSync(dir).filter((f) => /^lesson-\d+.*\.md$/.test(f)).length;
  const text = index.join('\n').replace(/^\d+ lessons,/m, `${files} lessons,`);
  writeFileSync(join(dir, '_index.md'), text);
}

/** How the conflict was resolved by hand: both sides' rows, newest first, nothing else changed. */
function resolveIndex(cwd) {
  const path = join(cwd, 'docs/lessons/_index.md');
  const lines = readFileSync(path, 'utf8').split('\n');
  const out = [];
  let hunk = null;
  for (const line of lines) {
    if (line.startsWith('<<<<<<<')) hunk = [];
    else if (hunk && (line.startsWith('=======') || line.startsWith('|||||||'))) continue;
    else if (hunk && line.startsWith('>>>>>>>')) {
      const rows = [...new Set(hunk)].sort((a, b) => Number(ROW.exec(b)?.[1] ?? 0) - Number(ROW.exec(a)?.[1] ?? 0));
      out.push(...rows);
      hunk = null;
    } else (hunk ?? out).push(line);
  }
  writeFileSync(path, out.join('\n'));
  git(cwd, 'add', 'docs/lessons/_index.md');
  git(cwd, 'commit', '-q', '--no-edit');
}

test('two lesson PRs, each green, merge into a master the lesson check passes', () => {
  const root = mkdtempSync(join(tmpdir(), 'check-lessons-'));
  try {
    mkdirSync(join(root, 'scripts'));
    cpSync(join(repo, 'docs/lessons'), join(root, 'docs/lessons'), { recursive: true });
    cpSync(join(repo, 'scripts/check-lessons.sh'), join(root, 'scripts/check-lessons.sh'));
    git(root, 'init', '-q', '-b', 'master');
    git(root, 'add', '.');
    git(root, 'commit', '-q', '-m', 'base');
    assert.equal(check(root).status, 0, 'the base passes');

    for (const [branch, number] of [['a', '900'], ['b', '901']]) {
      git(root, 'switch', '-q', '-c', branch, 'master');
      addLesson(root, number);
      git(root, 'add', '.');
      git(root, 'commit', '-q', '-m', number);
      assert.equal(check(root).status, 0, `branch ${branch} passes on its own: ${check(root).stdout}`);
    }

    git(root, 'switch', '-q', 'master');
    git(root, 'merge', '-q', '--no-edit', 'a');
    const merged = spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', 'merge', '-q', '--no-edit', 'b'], { cwd: root });
    if (merged.status !== 0) resolveIndex(root);

    const result = check(root);
    assert.equal(result.status, 0, `master after both merges: ${result.stdout}`);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('the root index carries no hand-kept lesson count', () => {
  const index = readFileSync(join(repo, 'docs/lessons/_index.md'), 'utf8');
  assert.doesNotMatch(index, /^\d+ lessons,/m, 'a count the files already give is a line two PRs both edit');
});
