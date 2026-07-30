/** Demo FX rates expressed as USD per 1 unit of the currency. Must cover every currency a client/contact
 *  can hold — otherwise convert() silently falls back to 1:1 and totals are wrong. The 11 supported
 *  currencies (decided 2026-07-28, don't add more without asking): EUR, HKD, USD, CNH, JPY, GBP, SGD,
 *  CHF, AUD, CAD, NZD — see components/CurrencySheet's CURRENCIES for the picker list. */
const RATES: Record<string, number> = {
  EUR: 1.08,
  HKD: 0.128,
  USD: 1,
  CNH: 0.14,
  JPY: 0.0064,
  GBP: 1.27,
  SGD: 0.74,
  CHF: 1.13,
  AUD: 0.66,
  CAD: 0.73,
  NZD: 0.61,
};

/** Currencies supported end-to-end (have a rate + appear in the picker). */
export const SUPPORTED_CURRENCIES = Object.keys(RATES);

/** Convert an amount from one currency to another using the demo rates. */
export function convert(amount: number, from: string, to: string): number {
  return amount * ((RATES[from] ?? 1) / (RATES[to] ?? 1));
}
