/**
 * Shared formatters. NB: `money` and `formatMoney` intentionally produce DIFFERENT output —
 * money("$6,450.00", thousands separators, always "$") vs formatMoney("$6450.00" / "HKD30.00",
 * no separators, currency-prefixed). Don't merge them.
 */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

/** Format money: USD uses "$", others prefix the code (e.g. "HKD30.00"). */
export function formatMoney(amount: number, currency: string): string {
  const n = amount.toFixed(2);
  return currency === "USD" ? `$${n}` : `${currency}${n}`;
}
