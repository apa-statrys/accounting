export interface ServiceLine {
  id: string;
  name: string;
  description?: string;
  /** Item-level currency (may differ from the invoice currency). */
  currency: string;
  unit: string;
  quantity: number;
  unitPrice: number;
}

/** Demo FX rates expressed as USD per 1 unit of the currency. */
const RATES: Record<string, number> = { USD: 1, SGD: 0.74, HKD: 0.128 };

/** Convert an amount from one currency to another using the demo rates. */
export function convert(amount: number, from: string, to: string): number {
  return amount * ((RATES[from] ?? 1) / (RATES[to] ?? 1));
}

/** Format money: USD uses "$", others prefix the code (e.g. "HKD30.00"). */
export function formatMoney(amount: number, currency: string): string {
  const n = amount.toFixed(2);
  return currency === "USD" ? `$${n}` : `${currency}${n}`;
}
