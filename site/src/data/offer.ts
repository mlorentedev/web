import type { Lang } from '../i18n/ui';

/**
 * The offer ladder behind the contact door (WEB-137). Every figure on the offer
 * is stated here once and rendered by `components/Offer.astro` in both locales,
 * so a price change is one edit and the two languages cannot quote different
 * numbers. The contact markdown carries no figures of its own; a test holds it
 * to that.
 *
 * Prices are in USD in both locales. The step before these two, the written
 * filter, is free and is the door itself (`components/Door.astro`).
 */
export const offer = {
  session: {
    minutes: 60,
    fromUsd: 300,
    /** A sprint started within this many days gets the session credited in full, once. */
    creditDays: 30,
  },
  sprint: {
    minWeeks: 2,
    maxWeeks: 4,
  },
} as const;

/** One rung of the ladder, flattened to a language. */
export interface OfferStep {
  /** The rung and its terms, e.g. "60-minute session · from $300". */
  title: string;
  body: string;
}

const usd = (amount: number) => `$${amount.toLocaleString('en-US')}`;

export function offerSteps(lang: Lang): OfferStep[] {
  const { session, sprint } = offer;
  const weeks = `${sprint.minWeeks}–${sprint.maxWeeks}`;
  if (lang === 'es') {
    return [
      {
        title: `Sesión de ${session.minutes} minutos · desde ${usd(session.fromUsd)}`,
        body: `Revisamos tu sistema juntos y te llevas por escrito qué arreglar primero. Si no crees que valió lo que pagaste, te lo devuelvo. Si en ${session.creditDays} días empezamos un sprint, se descuenta entero.`,
      },
      {
        title: `Sprint · ${weeks} semanas, precio según la sesión`,
        body: 'Un sistema, sobre una base que ya existe. “Terminado” es en producción y monitorizado, y sigo hasta cumplir el resultado acordado.',
      },
    ];
  }
  return [
    {
      title: `${session.minutes}-minute session · from ${usd(session.fromUsd)}`,
      body: `We look at your system together and you leave with a written list of what to fix first. If you don’t think it was worth it, I refund you. If we start a sprint within ${session.creditDays} days, it’s credited in full.`,
    },
    {
      title: `Sprint · ${weeks} weeks, priced after the session`,
      body: 'One system, on a foundation that already exists. “Done” means in production and monitored, and I keep working until the agreed result is met.',
    },
  ];
}
