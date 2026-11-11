/**
 * The Lab's dated changelog (#592): what changed on the platform, one row per
 * kubelab pull request, newest first. Curated, not generated: which changes
 * deserve a row is an editorial choice, and a build that fetched them from
 * GitHub would render different pages from the same commit.
 *
 * Empty until the owner writes the rows; the section renders only when there is
 * one. `tests/lab-changelog.test.mjs` checks every row.
 */
export interface LabChange {
  /** The day the change merged, `YYYY-MM-DD`. */
  date: string;
  /** The kubelab pull request that made it. */
  pr: number;
  summary: string;
  summaryEs: string;
}

export const labChangelog: LabChange[] = [];
