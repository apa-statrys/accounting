/**
 * Shared formatters. NB: `money` and `formatMoney` intentionally produce DIFFERENT output —
 * money("USD 6,450.00", thousands separators) vs formatMoney("USD 6450.00", no separators).
 * Don't merge them. Never a "$" glyph — always the currency code (DES decision: ambiguous across
 * currencies), e.g. "USD 30.00", "HKD 30.00", "EUR 30.00".
 */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const money = (n: number, currency: string = "USD") =>
  `${currency} ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

/** Format money as "CODE amount.00" — no separators. */
export function formatMoney(amount: number, currency: string): string {
  return `${currency} ${amount.toFixed(2)}`;
}

/** FileItemBase's `size` label — "1.2 MB", or "3 pages · 1.2 MB" for a multi-page scan
 *  (DES multi-page camera capture — all pages are one document, one file size). */
export function fileSizeLabel(file: { size: number; pages?: number }): string {
  const mb = `${(file.size / 1024 / 1024).toFixed(1)} MB`;
  return file.pages && file.pages > 1 ? `${file.pages} pages · ${mb}` : mb;
}
