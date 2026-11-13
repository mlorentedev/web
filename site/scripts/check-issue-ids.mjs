#!/usr/bin/env node
/**
 * Say so when an issue takes an identifier another issue already has (WEB-110).
 *
 *   gh api --paginate repos/OWNER/REPO/issues?state=all | jq -s add \
 *     | node scripts/check-issue-ids.mjs --issue N
 *
 * An issue title starts with its identifier (`WEB-078: …`), and that
 * identifier is what commits, PRs, lessons and the vault cite. The next number
 * is chosen by reading the list and taking the next free one, so two sessions
 * filing at once can both take it: WEB-078, WEB-079 and WEB-084 each named two
 * issues before they were renumbered. Filing happens outside this repository,
 * so nothing here can refuse the issue. What this can do is check it the moment
 * it is opened or retitled, and say so on the issue, while the clash is one
 * issue old and nothing cites it yet.
 *
 * A closed issue still counts: a citation does not say whether its issue was
 * open. A pull request does not: the REST listing returns PRs as issues, and a
 * PR titled after the issue it closes is not a second claim on the identifier.
 *
 * Exit codes: 0 no clash, 1 clash, 2 the listing could not be read. The third
 * is not a pass, so a broken token or query does not read as a clean check.
 */

import { readFileSync } from 'node:fs';

export const OK = 0;
export const CLASH = 1;
export const UNANSWERABLE = 2;

/**
 * The identifier a title starts with, or null. The letter of a lettered child
 * (`WEB-001e`) is part of it: those are separate issues by design.
 *
 * @param {string} title
 * @returns {string | null}
 */
export function idOf(title) {
  return /^([A-Z][A-Z0-9]*-\d+[a-z]?)\b/.exec(title ?? '')?.[1] ?? null;
}

/**
 * Decide on one issue against the whole listing.
 *
 * @param {unknown} listing the REST issues listing, every page flattened into one array
 * @param {number} number the issue the event was about
 * @returns {{code: number, id: string | null, others: Array<{number: number, title: string, state: string}>, reason: string}}
 */
export function decide(listing, number) {
  const unanswerable = (reason) => ({ code: UNANSWERABLE, id: null, others: [], reason });

  if (!Array.isArray(listing)) return unanswerable('the listing is not an array');
  if (listing.some((i) => typeof i?.number !== 'number' || typeof i?.title !== 'string')) {
    return unanswerable('an entry has no number or title; pages must be flattened into one array');
  }

  const issues = listing.filter((i) => !i.pull_request);
  const self = issues.find((i) => i.number === number);
  if (!self) return unanswerable(`issue #${number} is not in the listing`);

  const id = idOf(self.title);
  if (id === null) return { code: OK, id, others: [], reason: 'the title carries no identifier' };

  const others = issues.filter((i) => i.number !== number && idOf(i.title) === id);
  if (others.length > 0) return { code: CLASH, id, others, reason: `${id} already names another issue` };
  return { code: OK, id, others, reason: `${id} names no other issue` };
}

/** The lines to print, which the workflow also posts on the issue. */
export function report(verdict) {
  if (verdict.code === UNANSWERABLE) return [`::error::cannot check the identifier: ${verdict.reason}`];
  if (verdict.code === OK) return [verdict.reason];
  return [
    `${verdict.id} already names ${verdict.others.length === 1 ? 'another issue' : 'other issues'}:`,
    ...verdict.others.map((i) => `- #${i.number} (${i.state}): ${i.title}`),
    '',
    'A citation of this identifier no longer says which issue it means.',
    'Retitle this issue with the next free number, which a fresh scan of the issue list gives.',
  ];
}

function main(argv) {
  const i = argv.indexOf('--issue');
  const number = Number(argv[i + 1]);
  if (i === -1 || !Number.isInteger(number)) {
    console.log('::error::usage: check-issue-ids.mjs --issue N < listing.json');
    return UNANSWERABLE;
  }
  let listing;
  try {
    listing = JSON.parse(readFileSync(0, 'utf8'));
  } catch (e) {
    console.log(`::error::cannot check the identifier: the listing is not JSON (${e.message})`);
    return UNANSWERABLE;
  }
  const verdict = decide(listing, number);
  for (const line of report(verdict)) console.log(line);
  return verdict.code;
}

if (import.meta.url === `file://${process.argv[1]}`) process.exitCode = main(process.argv.slice(2));
