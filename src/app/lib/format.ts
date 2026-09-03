/**
 * Shared formatters. NB: `money` and `formatMoney` intentionally produce DIFFERENT output —
 * money("USD 6,450.00", thousands separators) vs formatMoney("USD 6450.00", no separators).
 * Don't merge them. Never a "$" glyph — always the currency code (DES decision: ambiguous across
 * currencies), e.g. "USD 30.00", "HKD 30.00", "EUR 30.00".
 */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Truncates a long email for a chip/pill: the domain is usually short and is what identifies
 *  the recipient at a glance, so the local part (before "@") is what gets the ellipsis, not a
 *  plain end-of-string cut that would hide the domain entirely (e.g. Send Invoice's Add
 *  Recipients chips). Falls back to a plain end cut only if the domain alone doesn't leave room. */
export function truncateEmailChip(email: string, maxLength: number = 24): string {
  if (email.length <= maxLength) return email;
  const at = email.lastIndexOf("@");
  if (at === -1) return `${email.slice(0, maxLength - 1)}…`;
  const domain = email.slice(at);
  const local = email.slice(0, at);
  const availableForLocal = maxLength - domain.length - 1;
  if (availableForLocal <= 0) return `${email.slice(0, maxLength - 1)}…`;
  return `${local.slice(0, availableForLocal)}…${domain}`;
}

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
