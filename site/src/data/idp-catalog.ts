import idpCatalogData from './idp-catalog.json';

/**
 * The Lab's Internal Developer Platform (IDP) Catalog data contract.
 *
 * Migrated from kubelab's gethomepage bookmarks configuration
 * `infra/k8s/base/services/homepage-config/bookmarks.yaml`, pinned at commit
 * `3f85fe5ae6f09404727c930da7017a671c95074c` and preserved as
 * `tests/fixtures/bookmarks.yaml` for offline CI verification.
 */
export type IdpAccess = 'public' | 'mesh' | 'auth' | 'local';

export interface IdpSpendBadge {
  en: string;
  es: string;
}

export interface IdpItem {
  id: string;
  name: string;
  /**
   * Pinned source link from `bookmarks.yaml`. Preserved verbatim for provenance
   * audits, even when no clickable link is rendered publicly.
   */
  sourceHref: string;
  /**
   * Rendered URL — ONLY populated if `access === 'public'`. Never ships internal
   * mesh addresses (`*.kubelab.live`), OS protocol schemes (`obsidian://`), or
   * private repositories that produce 404s for public readers.
   */
  url?: string;
  urlNote?: string;
  icon: string;
  description: string;
  descriptionEs: string;
  access: IdpAccess;
  spendBadge?: IdpSpendBadge;
}

export interface IdpCategory {
  id: string;
  name: string;
  nameEs: string;
  description: string;
  descriptionEs: string;
  items: IdpItem[];
}

export interface IdpManifest {
  source: {
    repo: string;
    path: string;
    commit: string;
    fixtureSha256: string;
  };
  categories: IdpCategory[];
}

export const idpCatalog = idpCatalogData as IdpManifest;
