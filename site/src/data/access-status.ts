import statusData from './access-status.json';

/**
 * What the weekly access check saw for each row of `service-access.json`
 * (WEB-173). Written by `npm run access:report`, never by hand: `state` is what
 * `classify()` observed and `ok` is whether the row still holds (`matches()`),
 * both in `tests/lib/access.mjs`.
 */
export interface AccessCheck {
  state: string;
  ok: boolean;
}

export interface AccessStatus {
  /** ISO date of the last check. */
  checked: string;
  rows: Record<string, AccessCheck>;
}

/**
 * The three things a row's check can say. `asleep` is an on-demand host that
 * gave no response, which its row allows: not a fault.
 */
export type CheckOutcome = 'verified' | 'asleep' | 'failing';

export const accessStatus = statusData as AccessStatus;

export function checkFor(slug: string): CheckOutcome {
  const record = accessStatus.rows[slug];
  if (!record) throw new Error(`access-status.json has no record for "${slug}"`);
  if (!record.ok) return 'failing';
  return record.state === 'silent' ? 'asleep' : 'verified';
}
