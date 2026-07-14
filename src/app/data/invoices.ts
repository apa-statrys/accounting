import type { Invoice } from "../types";
import { CUSTOMERS } from "./customers";

export const INVOICES: Invoice[] = [
  { id: "INV-2026-000004", client: "Marlow & Finch Studio", meta: "INV-2026-000004 · Due 25 Jun 2026", amount: "$6,430.05", status: "Awaiting", date: "2026-06-11", due: "2026-06-25", recurring: true },
  { id: "INV-2026-000007", client: "Northwind Traders", meta: "INV-2026-000007 · Due 05 Jun 2026", amount: "$2,150.00", status: "Awaiting", date: "2026-05-20", due: "2026-06-05" },
  // Linked to credit notes in the register so their "Related Invoice" opens a real invoice:
  // INV-…012 has a Draft CN (CN-…005), INV-…016 had a Cancelled CN (CN-…009, effects reversed → still Awaiting).
  { id: "INV-2026-000012", client: "Saffron Kitchen", meta: "INV-2026-000012 · Due 12 Jul 2026", amount: "$3,000.00", status: "Awaiting", date: "2026-06-28", due: "2026-07-12" },
  { id: "INV-2026-000016", client: "Pinecrest Interiors", meta: "INV-2026-000016 · Due 10 Jul 2026", amount: "$4,200.00", status: "Awaiting", date: "2026-06-26", due: "2026-07-10" },
  // Partially Paid demo (#3 / list tab) — $4,000 of $6,450 received, $2,450 still due.
  { id: "INV-2026-000014", client: "Verde Coffee Roasters", meta: "INV-2026-000014 · $2,450.00 due", amount: "$6,450.00", status: "PartiallyPaid", date: "2026-06-20", due: "2026-07-05" },
  { id: "INV-2026-000010", client: "Harbor & Co.", meta: "INV-2026-000010 · Due 30 Jun 2026", amount: "$6,450.00", status: "Awaiting", date: "2026-06-15", due: "2026-06-30", cnNo: "CN-2026-000003", cnAmount: 2000, cnSent: true },
  // DES-720/763 demo: a PAID invoice with a refund credit note already created. The invoice stays Paid
  // (the refund lifecycle lives on the credit note, CN-2026-000004 = Pending Refund); CN badge + "Refund
  // pending" meta give visibility, but it's not a separate invoice status.
  { id: "INV-2026-000011", client: "Cobalt Systems", meta: "INV-2026-000011 · Paid 26 Jun 2026", amount: "$6,450.00", status: "Paid", date: "2026-06-26", cnNo: "CN-2026-000004", cnAmount: 1200, cnSent: false },
  // Full-refund demo: the pending-refund CN equals the invoice total, so the card reads "Full refund".
  { id: "INV-2026-000013", client: "Meridian Design", meta: "INV-2026-000013 · Paid 24 Jun 2026", amount: "$3,200.00", status: "Paid", date: "2026-06-24", cnNo: "CN-2026-000006", cnAmount: 3200, cnSent: false },
  // Full-refund DETAIL demo: CN amount = the detail page's $6,450 total, so confirming the refund flips
  // the invoice to Refunded (status path Paid → Refunded).
  { id: "INV-2026-000015", client: "Solstice Media", meta: "INV-2026-000015 · Paid 22 Jun 2026", amount: "$6,450.00", status: "Paid", date: "2026-06-22", cnNo: "CN-2026-000007", cnAmount: 6450, cnSent: false },
  { id: "INV-2026-000003", client: "Bright Harbor Co.", meta: "INV-2026-000003 · Created 20 Jun 2026", amount: "$283.23", status: "Draft", date: "2026-06-20" },
  { id: "INV-2026-000006", client: "Lumen Creative", meta: "INV-2026-000006 · Scheduled on 20 Jul 2026", amount: "$980.50", status: "Draft", date: "2026-06-12", recurring: true },
  // A recurring invoice whose series has finished (end condition reached) — opening its series shows Completed.
  { id: "INV-2026-000023", client: "Lumen Creative", meta: "INV-2026-000023 · Paid 01 May 2026", amount: "$980.50", status: "Paid", date: "2026-05-01", recurring: true },
  { id: "INV-2026-000002", client: "Otto Reyes", meta: "INV-2026-000002 · Uploaded 18 Jun 2026", amount: "$100,034.00", status: "Draft", origin: "uploaded", date: "2026-06-18" },
  { id: "INV-2026-000005", client: "Atlas Logistics", meta: "INV-2026-000005 · Paid 12 Jun 2026", amount: "$4,725.00", status: "Paid", date: "2026-05-28", due: "2026-06-10" },
  { id: "INV-2026-000001b", client: "Bright Harbor Co.", meta: "INV-2026-000001 · Created 10 May 2026", amount: "$342.27", status: "Draft", date: "2026-05-10" },
  { id: "INV-2026-000001a", client: "Marlow & Finch Studio", meta: "INV-2026-000001 · Paid 28 Apr 2026", amount: "$123.87", status: "Paid", date: "2026-04-15", due: "2026-04-30" },
  { id: "INV-2026-000008", client: "Bright Harbor Co.", meta: "INV-2026-000008 · Void 8 Jun 2026", amount: "$500.00", status: "Cancelled", date: "2026-06-08", cnNo: "CN-2026-000001", cnSent: true },
  { id: "INV-2026-000009", client: "Vela Robotics", meta: "INV-2026-000009 · Void 22 Jun 2026", amount: "$1,280.00", status: "Cancelled", date: "2026-06-22", cnNo: "CN-2026-000002", cnSent: false },
];

// Map an invoice to a STABLE customer id (via the client register's ORIGINAL names). Used to link a
// customer to their invoices by id, so renaming a client (DES-714) doesn't orphan them. Invoices whose
// client isn't in the register (demo names like "Harbor & Co.") return undefined and match no customer.
const NAME_TO_ID = new Map(CUSTOMERS.map((c) => [c.name, c.id]));
export const customerIdForInvoice = (inv: Invoice): string | undefined => NAME_TO_ID.get(inv.client);
