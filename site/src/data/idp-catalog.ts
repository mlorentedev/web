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
  /** The source's name, pinned to `bookmarks.yaml`; the page shows `shownItemName`. */
  name: string;
  /** The Spanish title, for a name that describes rather than names. */
  nameEs?: string;
  /** The name is a product's or a repository's, the same in every locale. */
  brand?: true;
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

/** The title a card shows in `lang`: a brand keeps its name, anything else is translated. */
export function shownItemName(item: IdpItem, lang: 'en' | 'es'): string {
  return lang === 'es' && item.nameEs ? item.nameEs : item.name;
}
