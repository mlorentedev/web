import spendData from './cloud-spend.json';

/**
 * The Lab's monthly cloud spend, one entry per provider (#417).
 *
 * Every amount is in the one `currency`, so the total is a sum and never a
 * conversion. `basis` says whether an amount is a provider's list price for
 * what runs, or what the provider billed; `measured` is when it was read.
 * `tests/lab-figures.test.mjs` recomputes the total from the JSON and checks
 * the pages render that figure.
 */
export type SpendBasis = 'list-price' | 'billed';

export interface ProviderSpend {
  /** The `idp-catalog.json` item this amount belongs to. */
  id: string;
  provider: string;
  resource: string;
  amount: number;
  basis: SpendBasis;
  method: string;
  /** ISO date the amount was read. */
  measured: string;
}

export interface CloudSpend {
  currency: string;
  /** ISO month the amounts belong to. */
  month: string;
  providers: ProviderSpend[];
}

export const cloudSpend = spendData as CloudSpend;

/** Summed in cents, so 15.59 + 9.51 is 25.10 and not 25.099999999999998. */
export const totalSpend =
  cloudSpend.providers.reduce((sum, provider) => sum + Math.round(provider.amount * 100), 0) / 100;

/** How the total was obtained, for a `data-method` attribute. */
export const totalMethod = `Sum of ${cloudSpend.providers.map((p) => `${p.provider} (${p.basis})`).join(' + ')}`;

export function spendFor(id: string): ProviderSpend | undefined {
  return cloudSpend.providers.find((provider) => provider.id === id);
}

export function formatSpend(amount: number, lang: string): string {
  return new Intl.NumberFormat(lang, { style: 'currency', currency: cloudSpend.currency }).format(amount);
}

export function formatSpendMonth(lang: string): string {
  const [year, month] = cloudSpend.month.split('-').map(Number);
  return new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, month - 1, 1)),
  );
}
