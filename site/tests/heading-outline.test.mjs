/**
 * Every built page has one `h1`, it is the first heading, and no level is
 * skipped (#116).
 *
 * axe passes these pages on purpose: `page-has-heading-one` and `heading-order`
 * are best-practice rules it does not run by default, so nothing else asserts
 * the outline. `<svg>` contents are stripped first: a generated diagram's
 * `<title>` is not a page heading.
 *
 * Reads the built site: `npm run build && npm test`.
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, '..', 'dist');

function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(path);
    return entry.name.endsWith('.html') ? [path] : [];
  });
}

/** The heading levels of a page, in document order. */
export function headingLevels(html) {
  const withoutSvg = html.replace(/<svg[\s\S]*?<\/svg>/g, '');
  return [...withoutSvg.matchAll(/<h([1-6])[\s>]/g)].map((match) => Number(match[1]));
}

/** What is wrong with a heading sequence, or an empty list. */
export function outlineProblems(levels) {
  const problems = [];
  const h1s = levels.filter((level) => level === 1).length;
  if (h1s !== 1) problems.push(`${h1s} h1 elements`);
  if (levels.length > 0 && levels[0] !== 1) problems.push(`first heading is h${levels[0]}`);
  levels.forEach((level, i) => {
    if (i > 0 && level > levels[i - 1] + 1) problems.push(`skips h${levels[i - 1]} -> h${level}`);
  });
  return problems;
}

test('outlineProblems names each class of broken outline', () => {
  assert.deepEqual(outlineProblems([1, 2, 3, 2]), []);
  assert.deepEqual(outlineProblems([2, 3]), ['0 h1 elements', 'first heading is h2']);
  assert.deepEqual(outlineProblems([2, 1, 2]), ['first heading is h2']);
  assert.deepEqual(outlineProblems([1, 3]), ['skips h1 -> h3']);
});

test('headingLevels ignores headings inside a diagram', () => {
  assert.deepEqual(headingLevels('<h1>A</h1><svg><h3>x</h3></svg><h2 class="c">B</h2><header>'), [1, 2]);
});

test('every built page has one h1, first, and skips no level', () => {
  assert.ok(existsSync(dist), 'dist not found — run `npm run build` first');
  const broken = htmlFiles(dist)
    .map((file) => ({ file: relative(dist, file), problems: outlineProblems(headingLevels(readFileSync(file, 'utf8'))) }))
    .filter(({ problems }) => problems.length > 0)
    .map(({ file, problems }) => `${file}: ${problems.join('; ')}`);
  assert.deepEqual(broken, []);
});
