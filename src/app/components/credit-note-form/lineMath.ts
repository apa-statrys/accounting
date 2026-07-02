// Small pure helpers for the credit-note form. The two-model credit/refund math
// (lineOriginal / lineCredit) lives in CreditNoteForm.tsx — it depends on the `refund` prop.
import type { DraftLine } from "../../types";

export const formatDMY = (d: Date) =>
  `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

/** Line credit total = quantity × unit price. */
export const lineAmount = (l: DraftLine) => l.qty * (Number(l.unitPrice) || 0);

/** Format an amount with thousands separators + 2 decimals, e.g. 4200 → "4,200.00". */
export const fmtAmount = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
