/**
 * The Lab's dated changelog (#592): the newest merged kubelab pull requests
 * that add something, one row each, newest first. Generated, not curated:
 * `scripts/fetch-lab-changelog.sh` keeps merged `feat(<scope>):` PRs outside
 * the spec, docs and staging scopes and pins them in `lab-changelog.json`, so
 * the build never calls GitHub and one commit renders one page.
 *
 * A row is the PR title verbatim, shown like a git log in both locales: the
 * owner's choice (2026-11-12) over a hand-written summary per row.
 * `tests/lab-changelog.test.mjs` checks every row against the filter.
 */
import pinned from './lab-changelog.json';

export interface LabChange {
  /** The day the PR merged, `YYYY-MM-DD` (UTC). */
  date: string;
  /** The kubelab pull request. */
  pr: number;
  /** Its title, verbatim. */
  title: string;
}

export const labChangelog: LabChange[] = pinned.rows;

/** When the rows were fetched, `YYYY-MM-DD`. */
export const labChangelogFetched: string = pinned.fetchedAt.slice(0, 10);
