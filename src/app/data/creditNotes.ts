import type { CreditNote } from "../types";

/**
 * Demo register of all credit notes (newest first) — shared by the Credit Notes List (DES-818) and the
 * invoice-list CN badge (AC4), so the badge resolves to the SAME credit note by number. Numbers line up
 * with the invoice demo data (INV-…008→CN-…001, 009→002, 010→003, 011→004).
 *
 * Statuses follow DES-818's model: Draft (not yet confirmed) / Applied (created against the invoice) /
 * Awaiting refund (refund CN raised on a paid invoice, waiting for the accountant to pay it out) /
 * Cancelled (voided). The richer refund lifecycle (Pending Refund / Refunded, plus the "Awaiting refund
 * by accountant" wording) is tracked on the invoice-detail side (DES-720/721).
 */
export const CREDIT_NOTES: CreditNote[] = [
  // Refund credit notes (raised on Paid invoices). CN-…007 is still Awaiting refund (accountant hasn't
  // paid out yet); CN-…006's payout was approved so it reads Refunded (its invoice INV-…013 also reads
  // Refunded); CN-…004 is a paid partial that reads as Applied in the register.
  { no: "CN-2026-000007", customer: "Solstice Media", email: "ap@solsticemedia.com", invoiceNo: "INV-2026-000015", original: 6450, invoiceTotal: 6450, applied: 6450, kind: "refund", status: "Awaiting refund", date: "22 Jun 2026", reason: "Return", lines: [{ name: "Brand identity design", qty: 1, unitPrice: 4650, amount: 4650 }, { name: "Landing page build", qty: 1, unitPrice: 1800, amount: 1800 }], sent: false },
  { no: "CN-2026-000006", customer: "Meridian Design", email: "billing@meridian.design", invoiceNo: "INV-2026-000013", original: 3200, invoiceTotal: 3200, applied: 3200, kind: "refund", status: "Refunded", date: "24 Jun 2026", reason: "Return", lines: [{ name: "Website redesign", qty: 1, unitPrice: 3200, amount: 3200 }], sent: false },
  { no: "CN-2026-000004", customer: "Cobalt Systems", email: "billing@cobaltsystems.com", invoiceNo: "INV-2026-000011", original: 1200, invoiceTotal: 6450, applied: 1200, kind: "refund", status: "Applied", date: "26 Jun 2026", reason: "Pricing error", lines: [{ name: "Consulting hours", qty: 16, unitPrice: 75, amount: 1200 }], sent: false },
  // A Draft credit note — saved from the form but not yet confirmed (shows Edit / Delete actions).
  { no: "CN-2026-000005", customer: "Saffron Kitchen", email: "hello@saffronkitchen.com", invoiceNo: "INV-2026-000012", original: 800, invoiceTotal: 3000, applied: 0, kind: "cancellation", status: "Draft", date: "28 Jun 2026", reason: "Goodwill", lines: [{ name: "Menu photography", qty: 1, unitPrice: 800, amount: 800 }], sent: false },
  // Applied cancellation credit notes — confirmed and offset against the invoice. CN-…003 is a value
  // reduction (no clean qty × price) so it renders as "Price adjustment".
  { no: "CN-2026-000003", customer: "Harbor & Co.", email: "ap@harbor.co", invoiceNo: "INV-2026-000010", original: 2000, invoiceTotal: 6450, applied: 2000, kind: "cancellation", status: "Applied", date: "15 Jun 2026", reason: "Pricing error", lines: [{ name: "Retainer overcharge", amount: 2000 }], sent: true },
  { no: "CN-2026-000002", customer: "Vela Robotics", email: "finance@vela.io", invoiceNo: "INV-2026-000009", original: 1280, invoiceTotal: 1280, applied: 1280, kind: "cancellation", status: "Applied", date: "22 Jun 2026", reason: "Return", lines: [{ name: "Prototype build", qty: 1, unitPrice: 1280, amount: 1280 }], sent: false },
  { no: "CN-2026-000001", customer: "Bright Harbor Co.", email: "billing@brightharbor.com", invoiceNo: "INV-2026-000008", original: 500, invoiceTotal: 500, applied: 500, kind: "cancellation", status: "Applied", date: "8 Jun 2026", reason: "Return", lines: [{ name: "Logo revision", qty: 1, unitPrice: 500, amount: 500 }], sent: true },
  // Cancelled record — voided, kept for history (Download PDF only). Value reduction → "Price adjustment".
  { no: "CN-2026-000009", customer: "Pinecrest Interiors", email: "studio@pinecrest.design", invoiceNo: "INV-2026-000016", original: 900, invoiceTotal: 4200, applied: 0, kind: "cancellation", status: "Cancelled", date: "26 Jun 2026", reason: "Pricing error", lines: [{ name: "Design revision credit", amount: 900 }], sent: false },
];
