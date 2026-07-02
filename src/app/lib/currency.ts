/** Demo FX rates expressed as USD per 1 unit of the currency. Must cover every currency a client/contact
 *  can hold — otherwise convert() silently falls back to 1:1 and totals are wrong. */
const RATES: Record<string, number> = { USD: 1, SGD: 0.74, HKD: 0.128, EUR: 1.08, GBP: 1.27, AUD: 0.66, JPY: 0.0064 };

/** Currencies supported end-to-end (have a rate + appear in the picker). */
export const SUPPORTED_CURRENCIES = Object.keys(RATES);

/** Convert an amount from one currency to another using the demo rates. */
export function convert(amount: number, from: string, to: string): number {
  return amount * ((RATES[from] ?? 1) / (RATES[to] ?? 1));
}
