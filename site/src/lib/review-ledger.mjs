/**
 * Reads "## Review triage" comments into one ledger row per pull request:
 * who reviewed it, and how many findings the author applied or declined.
 *
 * A triage comment is a markdown table. The first cell names the source
 * ("PR-Agent", "CodeRabbit", "CI", …) and a column headed "Disposition"
 * holds the decision. Only these dispositions count as a finding:
 *
 *   applied   apply, applied
 *   declined  skip, declined, no change needed
 *
 * Everything else ("none needed", "noted", "resolved", "not reviewed") is
 * not a new decision about a finding, so it is not counted; "resolved"
 * repeats a finding an earlier triage already applied.
 */

export const REVIEWERS = ['PR-Agent', 'CodeRabbit'];

const NOT_REVIEWED = /not reviewed|no review ran|no review posted|still processing/i;

/** @param {string} line */
const cells = (line) =>
  line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((c) => c.trim());

/**
 * @param {string} cell - a Disposition cell
 * @returns {'applied' | 'declined' | null}
 */
export function classify(cell) {
  const text = cell.replace(/\*/g, '').trim().toLowerCase();
  if (/^(apply|applied)\b/.test(text)) return 'applied';
  if (/^(skip|declined|no change needed)\b/.test(text)) return 'declined';
  return null;
}

/**
 * @param {string} body - one triage comment
 * @returns {{ reviewer: string, disposition: string }[]} rows from a reviewer
 */
export function reviewerRows(body) {
  const lines = body.split('\n').filter((l) => l.trim().startsWith('|'));
  const header = lines.length ? cells(lines[0]) : [];
  const col = header.findIndex((h) => h.toLowerCase() === 'disposition');
  if (col === -1) return [];
  return lines.slice(2).flatMap((line) => {
    const row = cells(line);
    const reviewer = REVIEWERS.find((r) => row[0].startsWith(r));
    return reviewer ? [{ reviewer, disposition: row[col] ?? '' }] : [];
  });
}

/**
 * @param {{ number: number, comments: { url: string, body: string }[] }} pull
 */
export function ledgerRow(pull) {
  const rows = pull.comments.flatMap((c) => reviewerRows(c.body));
  const count = (kind) => rows.filter((r) => classify(r.disposition) === kind).length;
  return {
    number: pull.number,
    reviewedBy: REVIEWERS.filter((r) =>
      rows.some((row) => row.reviewer === r && !NOT_REVIEWED.test(row.disposition)),
    ),
    applied: count('applied'),
    declined: count('declined'),
    triageUrl: pull.comments[pull.comments.length - 1].url,
  };
}
