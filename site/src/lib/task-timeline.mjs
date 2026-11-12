/**
 * The phases of one real task (#593), from timestamped GitHub events pinned in
 * `data/task-timeline.json`. Each phase runs between two events, so every
 * duration can be checked against the links it is drawn from.
 *
 *   work    the plan stated on the issue → the pull request opened
 *   review  the pull request opened → the first PR-Agent review
 *   fix     that review → the last commit or triage after it
 *   land    that → the merge
 */

/** @typedef {{ kind: string, at: string, url: string }} TaskEvent */

/** @param {TaskEvent[]} events @param {string} kind */
const first = (events, kind) => {
  const found = events.find((e) => e.kind === kind);
  if (!found) throw new Error(`task timeline: no "${kind}" event`);
  return found;
};

/**
 * @param {TaskEvent[]} events - sorted by time
 * @returns {{ phase: 'work' | 'review' | 'fix' | 'land', from: TaskEvent, to: TaskEvent, minutes: number }[]}
 */
export function phases(events) {
  const plan = first(events, 'plan');
  const opened = first(events, 'opened');
  const review = first(events, 'review');
  const merged = first(events, 'merged');
  const after = events.filter((e) => (e.kind === 'commit' || e.kind === 'triage') && e.at > review.at && e.at < merged.at);
  const fixed = after.at(-1) ?? review;
  const span = (phase, from, to) => ({ phase, from, to, minutes: Math.round((Date.parse(to.at) - Date.parse(from.at)) / 60000) });
  return [span('work', plan, opened), span('review', opened, review), span('fix', review, fixed), span('land', fixed, merged)];
}

/** Minutes as "1 h 41 min" or "22 min": units are the same word in both locales. */
export function duration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h} h ${m} min` : `${m} min`;
}
