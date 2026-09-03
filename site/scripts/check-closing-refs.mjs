#!/usr/bin/env node
/**
 * Refuse a release PR that would close an issue nobody meant to close (WEB-103).
 *
 *   gh api graphql -f query='…' | node scripts/check-closing-refs.mjs
 *   node scripts/check-closing-refs.mjs --file payload.json
 *   node scripts/check-closing-refs.mjs --advisory   # report, do not block
 *
 * ## What it is defending against
 *
 * release-please builds the release PR body from the changelog, and the
 * changelog reproduces each commit subject *including its closing keywords*.
 * A commit that said `closes #N` therefore re-arms that keyword on the release
 * PR — even when `#N` was reopened afterwards, and even when the fix it claimed
 * to make was only interim.
 *
 * Measured on `#184`: it carried `closes [#244](…)` from `9f29f1c`, and `#244`
 * is open on purpose. Merging it unedited would have closed a ticket with work
 * outstanding. The manual defence — edit the line to `refs` immediately before
 * merging — was applied and then *lost 37 minutes later*, because merging an
 * unrelated docs PR regenerated the body. Any push to `master` re-arms it, not
 * only a releasable one. A manual step that must be repeated after every merge
 * is not a defence; this is.
 *
 * ## Why it does not read the body
 *
 * The obvious check is a grep, and the obvious grep is wrong. release-please
 * emits the markdown-link form:
 *
 *     closes [#244](https://github.com/mlorentedev/web/issues/244)
 *
 * so `grep -iE '(closes|fixes)[[:space:]]*#'` returns nothing over a body that
 * plainly contains one. GitHub parses that form; the grep does not. Rather than
 * re-implement GitHub's parser, this asks GitHub what it parsed —
 * `closingIssuesReferences` is the list it will act on at merge — and reads the
 * `state` of each node.
 *
 * ## Three outcomes, not two
 *
 * A guard that cannot tell "nothing to report" from "could not tell" reports a
 * clear queue when it has failed. So an absent or non-array `nodes` exits 2 as
 * unanswerable rather than passing: a query that broke, a token without
 * `issues: read`, a renamed field. Only a payload that was genuinely read and
 * genuinely contained no open node exits 0.
 *
 * ## Why there is an advisory mode
 *
 * Only a release PR must avoid closing an open issue; on an ordinary PR that is
 * the entire point of the reference. But if the query only ever ran on release
 * PRs, a wrong token scope or a renamed field would surface for the first time
 * on the one PR whose whole job is to ship — the worst possible moment.
 *
 * So the workflow runs the query on every PR and passes `--advisory` off the
 * release branch: an open reference is reported as a notice and does not block,
 * while an *unreadable* answer still exits 2. The check that the plumbing works
 * runs continuously; the rule it enforces does not.
 */

import { readFileSync } from 'node:fs';

/** Exit codes, named so the tests and the workflow agree on their meaning. */
export const OK = 0;
export const BLOCKED = 1;
export const UNANSWERABLE = 2;

/**
 * Decide on one GraphQL response.
 *
 * Accepts the full `gh api graphql` envelope (`data.repository.pullRequest…`)
 * and tolerates any extra fields selected alongside, so the workflow's query can
 * grow without touching this.
 *
 * @param {unknown} payload parsed JSON
 * @returns {{code: number, open: Array<{number: number, state: string, title?: string}>, total: number, reason: string}}
 */
export function decide(payload) {
  const unanswerable = (reason) => ({ code: UNANSWERABLE, open: [], total: 0, reason });

  if (payload === null || typeof payload !== 'object') {
    return unanswerable('the payload is not a JSON object');
  }

  // `gh api graphql` reports query-level failures in `errors` while still
  // emitting a 200 and a `data` key, so a payload can be well-formed and
  // meaningless at the same time. Checked before `data` is trusted.
  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    const first = payload.errors[0]?.message ?? 'unspecified';
    return unanswerable(`the GraphQL response carried errors: ${first}`);
  }

  const pr = payload.data?.repository?.pullRequest;
  if (pr === null || typeof pr !== 'object') {
    return unanswerable('data.repository.pullRequest is missing');
  }

  const nodes = pr.closingIssuesReferences?.nodes;
  if (!Array.isArray(nodes)) {
    return unanswerable('closingIssuesReferences.nodes is missing or not an array');
  }

  // A node without a readable `state` is not a pass — it is the same failure as
  // a missing field, one element down.
  const unreadable = nodes.filter((n) => typeof n?.state !== 'string');
  if (unreadable.length > 0) {
    return unanswerable(`${unreadable.length} of ${nodes.length} linked issue(s) have no readable state`);
  }

  const open = nodes.filter((n) => n.state.toUpperCase() === 'OPEN');
  if (open.length > 0) {
    return { code: BLOCKED, open, total: nodes.length, reason: 'a linked closing reference is still open' };
  }

  return { code: OK, open: [], total: nodes.length, reason: 'every linked closing reference is already closed' };
}

/**
 * Human-readable lines for a verdict.
 *
 * `advisory` only changes how an open reference is *presented* — never whether
 * an unreadable payload is an error, because that half is what the advisory run
 * exists to check.
 */
export function report(verdict, { advisory = false } = {}) {
  if (verdict.code === OK) {
    return [`Checked ${verdict.total} linked closing reference(s); none is open.`];
  }

  if (verdict.code === UNANSWERABLE) {
    return [
      `::error::cannot tell what this PR would close — ${verdict.reason}`,
      'Treated as a failure on purpose: an unanswerable check must not read as a clean one.',
    ];
  }

  const listed = verdict.open.map((n) => `  #${n.number} — ${n.title ?? '(no title)'}`);

  if (advisory) {
    return [
      `::notice::this PR would close ${verdict.open.length} issue(s) that are still open`,
      ...listed,
      '',
      'Not a release branch, so this is the intended case and nothing is blocked.',
      'Reported so the query itself is exercised on every PR rather than first',
      'on a release — see WEB-103.',
    ];
  }

  return [
    `::error::this PR would close ${verdict.open.length} issue(s) that are still open`,
    ...listed,
    '',
    'release-please copied a `closes #N` from a commit subject into the changelog it',
    'puts in this PR body. Edit that line from `closes` to `refs` and re-run this check.',
    'The edit is undone by the next push to master, so it belongs immediately before',
    'the merge — see WEB-103.',
  ];
}

function readInput(argv) {
  const i = argv.indexOf('--file');
  if (i !== -1) {
    const path = argv[i + 1];
    if (!path) throw new Error('--file needs a path');
    return readFileSync(path, 'utf8');
  }
  return readFileSync(0, 'utf8');
}

function main(argv) {
  const advisory = argv.includes('--advisory');

  let payload;
  try {
    payload = JSON.parse(readInput(argv));
  } catch (err) {
    // Unparseable input is unanswerable, not clean — same reasoning as above,
    // and advisory mode does not soften it.
    for (const line of report({ code: UNANSWERABLE, open: [], total: 0, reason: err.message })) {
      console.error(line);
    }
    return UNANSWERABLE;
  }

  const verdict = decide(payload);
  const blocking = verdict.code === BLOCKED && advisory ? OK : verdict.code;
  for (const line of report(verdict, { advisory })) {
    (blocking === OK ? console.log : console.error)(line);
  }
  return blocking;
}

// Only when run directly, so the test can import `decide` without exiting.
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  process.exit(main(process.argv.slice(2)));
}
