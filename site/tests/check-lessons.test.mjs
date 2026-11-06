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
      const alone = check(root);
      assert.equal(alone.status, 0, `branch ${branch} passes on its own: ${alone.stdout}${alone.stderr}`);
    }

    git(root, 'switch', '-q', 'master');
    git(root, 'merge', '-q', '--no-edit', 'a');
    const merged = spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', 'merge', '-q', '--no-edit', 'b'], {
      cwd: root,
      encoding: 'utf8',
    });
    if (merged.status !== 0) {
      // Only the row conflict is resolved by hand; any other failure is the replay breaking.
      assert.equal(git(root, 'diff', '--name-only', '--diff-filter=U').trim(), 'docs/lessons/_index.md', merged.stderr);
      resolveIndex(root);
    }
    const lessons = readdirSync(join(root, 'docs/lessons'));
    assert.ok(['900', '901'].every((n) => lessons.includes(`lesson-${n}-replayed.md`)), 'both lessons reached master');

    const result = check(root);
    assert.equal(result.status, 0, `master after both merges: ${result.stdout}${result.stderr}`);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// The check piped the index's link targets into `grep -q` under
// pipefail. grep exits on its first match; once the targets outgrow one pipe write
// (4 KiB; the real index passed that at 77 lessons), printf can still be writing,
// dies of SIGPIPE, and the pipeline fails: a listed lesson reported as missing, on
// some runs only. With the targets past the 64 KiB pipe buffer, it fails every run.
test('an index too large for one pipe write still finds every listed lesson', () => {
  const root = mkdtempSync(join(tmpdir(), 'check-lessons-'));
  try {
    mkdirSync(join(root, 'scripts'));
    mkdirSync(join(root, 'docs/lessons'), { recursive: true });
    cpSync(join(repo, 'scripts/check-lessons.sh'), join(root, 'scripts/check-lessons.sh'));
    const rows = [];
    for (let n = 700; n >= 1; n -= 1) {
      const name = `lesson-${String(n).padStart(4, '0')}-a-long-name-so-the-link-targets-of-the-index-outgrow-the-sixty-four-kib-pipe-buffer.md`;
      writeFileSync(join(root, 'docs/lessons', name), '# x\n');
      rows.push(`| ${n} | [x](${name}) | 2026-11-05 | \`#t\` |`);
    }
    writeFileSync(join(root, 'docs/lessons/_index.md'), `# Lessons\n\n| # | Lesson | Date | Tags |\n|---|---|---|---|\n${rows.join('\n')}\n`);
    const result = check(root);
    assert.equal(result.status, 0, `${result.stdout}${result.stderr}`.split('\n').slice(0, 3).join('\n'));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('the check rejects a lesson count however it is worded, and not a row that mentions one', () => {
  const root = mkdtempSync(join(tmpdir(), 'check-lessons-'));
  try {
    mkdirSync(join(root, 'scripts'));
    cpSync(join(repo, 'docs/lessons'), join(root, 'docs/lessons'), { recursive: true });
    cpSync(join(repo, 'scripts/check-lessons.sh'), join(root, 'scripts/check-lessons.sh'));
    const path = join(root, 'docs/lessons/_index.md');
    const original = readFileSync(path, 'utf8');
    const opening = 'One file per lesson, newest first.';
    assert.ok(original.includes(opening), 'the index opens the way this test edits it');
    for (const line of ['73 lessons, one file each, newest first.', 'There are 73 lessons here, newest first.', 'Lesson count: 73 lessons.']) {
      writeFileSync(path, original.replace(opening, line));
      assert.equal(check(root).status, 1, `accepted: "${line}"`);
    }
    const first = original.split('\n').find((l) => ROW.test(l));
    writeFileSync(path, original.replace(first, first.replace('](', ' across 3 lessons](')));
    assert.equal(check(root).status, 0, `a row title that mentions lessons is not a count: ${check(root).stdout}`);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('the root index carries no hand-kept lesson count', () => {
  const index = readFileSync(join(repo, 'docs/lessons/_index.md'), 'utf8');
  assert.doesNotMatch(index, /^\d+ lessons,/m, 'a count the files already give is a line two PRs both edit');
});
