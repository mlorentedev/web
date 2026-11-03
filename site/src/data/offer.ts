import type { Lang } from '../i18n/ui';

/**
 * How the work starts (#499). The one price is stated here once and rendered by
 * `components/Offer.astro` in both locales, so a change is one edit and the two
 * languages cannot quote different numbers. The contact markdown carries no
 * figures of its own; a test holds it to that.
 *
 * The price is in USD in both locales. The payment link goes out by mail, after
 * a yes, so the page has no direct pay button.
 */
export const offer = {
  session: {
    minutes: 60,
    usd: 300,
  },
} as const;

/** One step of the process, flattened to a language. */
export interface OfferStep {
  title: string;
  body: string;
}

const usd = (amount: number) => `$${amount.toLocaleString('en-US')}`;

export function offerSteps(lang: Lang): OfferStep[] {
  const { session } = offer;
  if (lang === 'es') {
    return [
      {
        title: 'Me escribes',
        body: 'Tres líneas: qué necesitas, qué hay ya en marcha y para cuándo.',
      },
      {
        title: 'Te digo si puedo ayudarte',
        body: 'Te respondo por correo. Si no soy la persona adecuada, te lo digo y ahí queda.',
      },
      {
        title: `Sesión de ${session.minutes} minutos · ${usd(session.usd)}`,
        body: 'Si puedo ayudarte, te envío el enlace de pago. Una hora como máximo por cada parte, y te llevas por escrito qué hacer primero. Si no crees que valió lo que pagaste, te lo devuelvo.',
      },
    ];
  }
  return [
    {
      title: 'You write to me',
      body: 'Three lines: what you need, what’s already running, and when you need it.',
    },
    {
      title: 'I tell you whether I can help',
      body: 'I reply by email. If I’m not the right person, I say so and that’s that.',
    },
    {
      title: `${session.minutes}-minute session · ${usd(session.usd)}`,
      body: 'If I can help, I send you the payment link. One hour at most on each side, and you leave with a written list of what to do first. If you don’t think it was worth it, I refund you.',
    },
  ];
}
