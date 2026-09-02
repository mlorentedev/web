import labAiData from './lab-ai.json';

/**
 * The Lab's AI & Automations content (WEB-080, AC4).
 *
 * Migrated from kubelab's homepage template
 * `infra/k8s/base/services/homepage-templates/services.yaml.j2`, pinned at the
 * commit named in `source` and held as `tests/fixtures/services.yaml.j2` so the
 * migration stays auditable against something that cannot drift.
 */
export interface LabAiEntry {
  slug: string;
  name: string;
  description: string;
  descriptionEs: string;
  /**
   * The link exactly as the source template has it, with
   * `{{ global.base_domain }}` resolved. Kept even when nothing is rendered
   * from it: it is what makes the migration checkable line by line.
   */
  sourceHref: string;
  /**
   * Who can reach the thing behind `sourceHref`, measured rather than assumed.
   *
   * `mesh` — served from the platform's own hosts and gated by Authelia, or
   * (Argo CD) answering nothing from a public path.
   * `private` — a private GitHub repository: a 404 for every visitor.
   * `public` — followed successfully from outside the tailnet.
   *
   * The template feeds a homepage that lives behind the mesh, where every one
   * of these links is correct. This page is public, where six are not.
   */
  access: 'public' | 'mesh' | 'private';
  /**
   * Rendered only for `public` entries — the same boundary `platform.ts` draws
   * for services. A link a reader cannot follow is worse than no link.
   */
  url?: string;
  /** Required whenever `url` departs from `sourceHref`, so the edit is never silent. */
  urlNote?: string;
}

export interface LabAiGroup {
  id: string;
  name: string;
  nameEs: string;
  entries: LabAiEntry[];
}

export interface LabAiManifest {
  source: {
    repo: string;
    path: string;
    commit: string;
    baseDomain: string;
  };
  groups: LabAiGroup[];
}

export const labAi = labAiData as LabAiManifest;
