// Page-local credit-note model for the invoice detail — richer than the register row in
// src/app/data/creditNotes.ts (which stays untouched; this one carries edit/send/refund state).
import type { DraftLine } from "../../types";

/** DES-720: evidence captured when a refund is "marked as already refunded" (done outside Statrys). */
/** DES-720 refund evidence. `method` holds the bank account used (Statrys or external). At least one of
 *  `proofFile` / `referenceNo` is captured. `awaiting` = external refund submitted, pending accountant
 *  confirmation (invoice stays Pending Refund) vs a settled/reconciled refund. */
export type RefundProof = { date: string; method: string; amount: number; proofFile?: string; referenceNo?: string; awaiting?: boolean };

/** A credit note raised against THIS invoice (DES-719/720/763).
 *  DES-763: a cancellation credit note is created **Open** (applied = 0) and only reduces the invoice once
 *  explicitly APPLIED. `applied` tracks how much of the CN has been offset against the invoice. */
export type CreditNote = {
  no: string;
  amount: number;
  applied?: number;
  cancelled?: boolean;
  /** DES-719: a saved-but-not-yet-created credit note (form was backed out of). Not applied; shows a
   *  "Draft" chip in the Credits section, reserves no credit, and reopens the form to resume. */
  draft?: boolean;
  name: string;
  email: string;
  lines: { name: string; amount: number; qty?: number; unitPrice?: number }[];
  date: string;
  /** Resolved due date label ("26 Jul 2026") — shown on the CN detail. */
  dueDateLabel?: string;
  updatedDate?: string;
  reason?: string;
  reasonNote?: string;
  draftLines?: DraftLine[];
  issueDate?: Date;
  /** DES-719 — the receiving account / payment method chosen on the form (id into RECEIVING_ACCOUNTS). */
  accountId?: string;
  sent: boolean;
  sentDate?: string;
  refundProof?: RefundProof;
};
