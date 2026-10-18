/**
 * The proof that opens `/lab` and `/ai` (WEB-141 AC1, AC9).
 *
 * Each proof answers four questions: whose problem it was, what constrained it,
 * the measured result, and where a reader can verify it. The words are Manu's;
 * a figure only enters `result`, and only with the method that produced it and
 * the date it was measured, so an old proof reads as old.
 *
 * `teledyne` is not here: the home tells it in prose (WEB-140, amended
 * 2026-09-25), and the home does not read this file.
 *
 * `tests/proofs.test.mjs` holds every entry to the format and resolves every
 * `href` in both locales against the built site.
 *
 * The KubeLab result is the measured access table (#292): its method and date
 * are read from `service-access.json`, never copied, so the proof ages with the
 * measurement. The JSON import carries its attribute and the `Lang` import is
 * type-only, so Node loads this file in a test without a build.
 */
import type { Lang } from '../i18n/ui';
import access from './service-access.json' with { type: 'json' };

export type Localized = Record<Lang, string>;

export interface ProofResult {
  text: Localized;
  /** How the result was obtained, for the `data-method` attribute. */
  method: string;
  /** ISO date (`YYYY-MM` or `YYYY-MM-DD`) of the measurement. */
  measured: string;
}

export interface Proof {
  /** Whose problem it was. */
  problem: Localized;
  /** What constrained the solution. */
  constraint: Localized;
  /**
   * The measured result. Only `agents` may leave it empty, and only while the
   * Hive figure waits for its method (#238, WEB-093): the page then shows the
   * claim with no figure, and `pending` says so.
   */
  result: ProofResult | null;
  /** Why there is no result yet. Required exactly when `result` is null. */
  pending?: Localized;
  /** Where to verify it: a site path, optionally with an anchor, localized when rendered. */
  verify: { label: Localized; href: string };
}

export type ProofId = 'kubelab' | 'agents';

export const proofs: Record<ProofId, Proof> = {
  kubelab: {
    problem: {
      en: 'Mine. It is the stack under all my work: my own products, client work in staging, and the blueprint a client can replicate.',
      es: 'El mío. Es la base de todo mi trabajo: mis propios productos, el trabajo de clientes en staging y el modelo que un cliente puede replicar.',
    },
    constraint: {
      en: 'One operator. Every change to a cluster is a pull request, and production is promoted only after I merge it.',
      es: 'Un solo operador. Cada cambio en un clúster es una pull request, y a producción solo se promueve después de que yo la fusione.',
    },
    result: {
      text: {
        en: 'Each service says who can reach it, measured from outside the mesh and checked again every week.',
        es: 'Cada servicio dice quién puede llegar a él, medido desde fuera de la malla y comprobado de nuevo cada semana.',
      },
      method: access.method,
      measured: access.measured,
    },
    verify: {
      label: { en: 'Services, and who can reach them', es: 'Servicios, y quién puede llegar a ellos' },
      href: '/lab#services',
    },
  },
  agents: {
    problem: {
      en: 'Mine. My AI coding agents forget everything between sessions, and they make mistakes nobody can predict.',
      es: 'El mío. Mis agentes de IA olvidan todo entre una sesión y la siguiente, y se equivocan de formas que nadie puede prever.',
    },
    constraint: {
      en: 'A rule with no mechanical guard gets broken, so each rule is a lock, a filter, a limit or a review, never a prompt.',
      es: 'Una regla sin un mecanismo que la haga cumplir acaba rota, así que cada regla es un bloqueo, un filtro, un límite o una revisión, nunca un prompt.',
    },
    result: null,
    pending: {
      en: 'The Hive figure is published only with the method behind it, and that write-up is not out yet.',
      es: 'La cifra de Hive solo se publica junto al método que la respalda, y ese texto aún no ha salido.',
    },
    verify: {
      label: { en: 'The rules, quoted from their files', es: 'Las reglas, citadas de sus ficheros' },
      href: '/ai#artifacts',
    },
  },
};
