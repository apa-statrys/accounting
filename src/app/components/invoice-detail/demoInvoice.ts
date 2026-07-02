import type { InvoiceLine } from "../../types";

/** Demo line items — shared across every status preview. */
export const ITEMS: InvoiceLine[] = [
  { name: "Brand identity design", qty: 1, unit: "service", unitPrice: 4200, amount: 4200 },
  { name: "Landing page build", qty: 1, unit: "service", unitPrice: 1800, amount: 1800 },
  { name: "Consulting", qty: 6, unit: "hours", unitPrice: 75, amount: 450 },
];
export const SUBTOTAL = 6450;
export const DISCOUNT = 0;
export const TOTAL = SUBTOTAL - DISCOUNT;
export const PAID_PARTIAL = 4000;

// Demo "today" stamped on a credit note when it's sent from the app.
export const SENT_TODAY = "29 Jun 2026";
// Demo date stamped on a BA-transfer refund record (the BA flow has no date input, unlike the manual path).
export const REFUND_DATE_ISO = "2026-06-29";
// Demo "today" stamped as the credit note's Updated date when it's edited.
export const EDITED_TODAY = "1 Jul 2026";
