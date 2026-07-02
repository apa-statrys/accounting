import type { AttentionTask } from "../types";

/**
 * All pending actions requiring review — the single source of truth shared with the
 * dashboard (count + the Need Attention stack preview).
 */
export const ATTENTION_TASKS: AttentionTask[] = [
  {
    id: "match-1",
    type: "payment-match",
    title: "Payment match found",
    sub: "HKD 2,800 from Globe Enterprises matches this invoice",
    action: "Confirm",
    invoice: { number: "INV-2026-000004", client: "Marlow & Finch Studio", status: "Awaiting", origin: "created" },
  },
  {
    id: "extract-1",
    type: "extracted",
    title: "Invoice extracted",
    sub: "Uploaded PDF from Otto Reyes — review before recording",
    action: "Review",
    invoice: { number: "INV-2026-000002", client: "Otto Reyes", status: "Draft", origin: "uploaded" },
  },
  {
    id: "overdue-1",
    type: "overdue",
    title: "Invoice overdue",
    sub: "INV-2026-000007 · Northwind Traders · 18 days overdue",
    action: "Remind",
    invoice: { number: "INV-2026-000007", client: "Northwind Traders", status: "Overdue", origin: "created" },
  },
  {
    id: "dup-1",
    type: "duplicate",
    title: "Duplicate detected",
    sub: "INV-2026-000003 may duplicate INV-2026-000118",
    action: "Review",
    invoice: { number: "INV-2026-000003", client: "Bright Harbor Co.", status: "Draft", origin: "created" },
  },
  {
    id: "over-1",
    type: "overpayment",
    title: "Overpayment to review",
    sub: "INV-2026-000005 · paid $250.00 over the invoice total",
    action: "Review",
    invoice: { number: "INV-2026-000005", client: "Atlas Logistics", status: "Paid", origin: "created" },
  },
];
