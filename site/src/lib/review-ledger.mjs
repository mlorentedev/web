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

/**
 * The cells of one table row. A `|` inside inline code or escaped as `\|` is
 * text, not a column break, so a cell quoting `a | b` keeps the columns aligned.
 *
 * @param {string} line
 */
export function cells(line) {
  const out = [''];
  let code = false;
  const text = line.trim().replace(/^\|/, '');
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '\\' && text[i + 1] === '|') {
      out[out.length - 1] += '|';
      i += 1;
    } else if (ch === '`') {
      code = !code;
      out[out.length - 1] += ch;
    } else if (ch === '|' && !code) {
      out.push('');
    } else {
      out[out.length - 1] += ch;
    }
  }
  if (out.at(-1).trim() === '') out.pop();
  return out.map((c) => c.trim());
}

const SEPARATOR = /^\|?(\s*:?-+:?\s*\|)+\s*(:?-+:?\s*)?$/;

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
  if (!SEPARATOR.test(lines[1]?.trim() ?? '')) {
    throw new Error(`a triage table's second line is not its separator: ${lines[1]}`);
  }
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
