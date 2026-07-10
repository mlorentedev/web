// Build-time GitHub telemetry for the WEB-019 proof surface (PS2).
//
// Fetched once at build (in the ProofSurface component frontmatter) and baked into
// static HTML — no client JS, no token, just the public REST API. Any failure returns
// FALLBACK so a flaky/rate-limited GitHub can never break `astro build`. Live
// client-side refresh (localStorage cache + TTL) is increment 2; the contribution
// heatmap is increment 3.

const GH_USER = 'mlorentedev';
const GH_API = 'https://api.github.com';

export interface GithubMetrics {
  /** Count of the user's non-fork public repos (authored work, not forks). */
  publicRepos: number;
  /** Sum of stargazers across those repos. */
  totalStars: number;
  /** Most-used primary languages, most-first. */
  topLanguages: string[];
  /** Stargazers on the flagship repo (Hive). */
  hiveStars: number;
}

// Honest last-known-good snapshot (2026-07-10, from the live API), rendered only when
// the build-time fetch fails. Each successful build overwrites these with live values,
// so the fallback is a floor, not the norm.
const FALLBACK: GithubMetrics = {
  publicRepos: 21,
  totalStars: 14,
  topLanguages: ['Python', 'Go', 'MDX', 'JavaScript'],
  hiveStars: 8,
};

interface GithubRepo {
  name: string;
  stargazers_count: number;
  language: string | null;
  fork: boolean;
}

/**
 * Aggregate the top primary languages across the user's repos, most-used first.
 *
 * By-count: GitHub gives each repo one primary `language`; we tally repos per language.
 * One API call (the /repos list we already have). A byte-weighted variant would call
 * GET /repos/{repo}/languages per repo — more accurate but N extra calls that burn the
 * 60 req/hr unauthenticated budget, so by-count is the deliberate MVP choice.
 */
export function deriveTopLanguages(repos: GithubRepo[], limit = 4): string[] {
  const counts = new Map<string, number>();
  for (const repo of repos) {
    if (!repo.language) continue;
    counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([language]) => language);
}

export async function fetchGithubMetrics(): Promise<GithubMetrics> {
  try {
    const res = await fetch(`${GH_API}/users/${GH_USER}/repos?per_page=100&sort=updated`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) return FALLBACK;

    const repos = ((await res.json()) as GithubRepo[]).filter((repo) => !repo.fork);
    if (repos.length === 0) return FALLBACK;

    const hive = repos.find((repo) => repo.name.toLowerCase() === 'hive');
    return {
      publicRepos: repos.length,
      totalStars: repos.reduce((sum, repo) => sum + repo.stargazers_count, 0),
      topLanguages: deriveTopLanguages(repos),
      hiveStars: hive?.stargazers_count ?? FALLBACK.hiveStars,
    };
  } catch {
    return FALLBACK;
  }
}
