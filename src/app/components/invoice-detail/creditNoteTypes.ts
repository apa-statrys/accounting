// Page-local credit-note model for the invoice detail — richer than the register row in
// src/app/data/creditNotes.ts (which stays untouched; this one carries edit/send/refund state).
import type { DraftLine } from "../../types";

/** DES-720: evidence captured when a refund is "marked as already refunded" (done outside Statrys). */
export type RefundProof = { date: string; method: string; amount: number; proofFile?: string };

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
  lines: { name: string; amount: number }[];
  date: string;
  updatedDate?: string;
  reason?: string;
  reasonNote?: string;
  draftLines?: DraftLine[];
  issueDate?: Date;
  sent: boolean;
  sentDate?: string;
  refundProof?: RefundProof;
};
