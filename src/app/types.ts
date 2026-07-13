/**
 * All shared types live here — one file, no exceptions.
 * Demo seed data lives in `src/app/data/`; pure helpers in `src/app/lib/`.
 * Types used by only ONE component stay private inside that component's file.
 */

/** Every screen the App.tsx router can show. */
export type Screen =
  | "dashboard"
  | "list"
  | "customer"
  | "details"
  | "upload"
  | "extracting"
  | "send"
  | "invoiceDetail"
  | "needAttention"
  | "duplicateCheck"
  | "settings"
  | "creditNote"
  | "refundCreditNote"
  | "hub"
  | "creditNotes"
  | "customers"
  | "customerDetail"
  | "addCustomer"
  | "editCustomer"
  | "recurringSeries";

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

export interface Customer {
  id: string;
  name: string;
  email: string;
  // DES-713 full Client Field Spec (optional — only name/email are captured in the quick invoice-flow add).
  firstName?: string;
  lastName?: string;
  regNo?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  currency?: string;
}

/** Demo Statrys payment contact (DES-713 AC2 — "prefill from a payment contact").
 *  Fields map 1:1 onto the Add Client form so selecting one auto-fills every matching field. */
export interface PaymentContact {
  id: string;
  name: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  regNo?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  currency?: string;
}

// ---------------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------------

/** Invoice status as stored on a list row (Overdue is DERIVED: Awaiting + past due). */
export type Status = "Awaiting" | "Draft" | "PartiallyPaid" | "Paid" | "Cancelled";

/** A row in the Sales Invoice List. */
export interface Invoice {
  id: string;
  client: string;
  meta: string;
  amount: string;
  status: Status;
  /** Issue/created date (ISO) — backs the date-range filter and date sorts. */
  date: string;
  /** Due date (ISO), when the invoice has one — backs the due-date sorts. */
  due?: string;
  /** Drafts only: where it came from (sets the detail page's default emphasis). */
  origin?: "created" | "uploaded";
  /** Generated from a recurring series (DES-782) — shows a "Recurring" badge on the list card. */
  recurring?: boolean;
  /** A linked credit note (Cancelled = full; Awaiting = partial via cnAmount) + sent state. */
  cnNo?: string;
  cnAmount?: number;
  cnSent?: boolean;
}

/** The full invoice lifecycle on the DETAIL page (DES-715 / DES-716 status matrix). The internal key
 *  stays "Cancelled" (a fully credited invoice ends here), but the DISPLAYED label is "Void" per the
 *  DES-715 status matrix — see lib/status.ts. (DES-719 briefly used "Cancelled" wording; reverted
 *  to "Void" 2026-07-03 to match DES-715. Do NOT confuse with the credit-note "Cancelled" status.) */
export type DetailStatus = "Draft" | "Awaiting" | "Overdue" | "PartiallyPaid" | "Paid" | "Cancelled" | "PendingRefund" | "Refunded";

/** What Edit carries up so the form opens prefilled with this invoice. */
export interface InvoiceEditSeed {
  customer: Customer;
  invoiceNo: string;
  currency: string;
  services: ServiceLine[];
  /** Issued invoice = limited edit (lock customer / dates / currency on the form). */
  limited?: boolean;
}

/** A rendered line on the invoice/credit-note PDF preview. */
export interface InvoiceLine {
  name: string;
  description?: string;
  qty: number;
  unit: string;
  unitPrice: number;
  amount: number;
}

/** An editable line item on the create/edit invoice form. */
export interface ServiceLine {
  id: string;
  name: string;
  description?: string;
  /** Item-level currency (may differ from the invoice currency). */
  currency: string;
  unit: string;
  quantity: number;
  unitPrice: number;
}

// ---------------------------------------------------------------------------
// Credit notes
// ---------------------------------------------------------------------------

/** Credit-note statuses:
 *  • Cancellation credit note (DES-719, single-invoice) — Draft → Applied → Cancelled (applied on
 *    create; no separate apply step). Legacy Open / Partially Applied / Fully Applied are retained for
 *    the register/list data until that's migrated.
 *  • Refund credit note (DES-720) — money lifecycle: Pending Refund → Refunded. */
// Credit Notes List register statuses (DES-818, aligned with DES-719): a credit note is a Draft until
// confirmed, Applied once created against its invoice, or Cancelled if voided. (Refund lifecycle states
// live on the invoice-detail side per DES-720/721, not in this list.)
export type CNStatus = "Draft" | "Applied" | "Cancelled";

export interface CreditNote {
  no: string;
  customer: string;
  email: string;
  invoiceNo: string;
  original: number;
  /** The linked invoice's total — for the detail Summary (Invoice Total / Remaining Balance). */
  invoiceTotal: number;
  /** Amount offset against invoices to date (DES-763). Remaining = original − applied. */
  applied: number;
  /** cancellation = on an unpaid invoice (DES-719); refund = on a paid invoice (DES-720). */
  kind: "cancellation" | "refund";
  status: CNStatus;
  date: string;
  reason: string;
  /** Whether the credit note has been sent to the customer (secondary indicator + Send/Resend). */
  sent?: boolean;
}

/** An editable line on the credit-note form (DES-719). */
export interface DraftLine {
  id: string;
  name: string;
  unit: string;
  /** Editable quantity / unit price for a partial credit; line total = qty × unit price. */
  qty: number;
  unitPrice: string;
  /** Original invoiced quantity — the stepper can't credit more than this. */
  maxQty: number;
  /** Original invoiced line amount — shown as a "of $X invoiced" reference (the line value = the CREDIT). */
  origAmount?: number;
}

/** Everything captured on create/save — the parent stores `draftLines` + `issueDate` so the
 *  credit note can be reopened and edited later (DES-719 AC4). */
export interface CreditNotePayload {
  amount: number;
  name: string;
  email: string;
  lines: { name: string; amount: number }[];
  issueDateLabel: string;
  issueDate: Date;
  reason: string;
  reasonNote: string;
  draftLines: DraftLine[];
  /** Chosen receiving account id (DES-719 — payment method, editable before Create). */
  accountId: string;
}

/** Seed for editing an existing credit note (AC4) — restores the prior state exactly. */
export interface CreditNoteEditSeed {
  name: string;
  email: string;
  reason: string;
  reasonNote: string;
  issueDate: Date;
  lines: DraftLine[];
  /** Restores the chosen receiving account when a draft/note is reopened. */
  accountId?: string;
}

// ---------------------------------------------------------------------------
// Upload / OCR extraction (DES-716)
// ---------------------------------------------------------------------------

/** Result of "reading" an uploaded invoice file. Fields the system couldn't read are flagged. */
export interface ExtractedInvoice {
  /** Invoice number read off the document — user-entered/editable, not system-generated (DES-716). */
  invoiceNumber: string;
  customerName: string;
  /** Empty when the system couldn't find it — pair with the matching `*NotFound` flag. */
  customerEmail: string;
  /** True when the email couldn't be read off the file and needs manual input. */
  emailNotFound?: boolean;
  currency: string;
  issueDate: Date;
  dueDate: string;
  services: ServiceLine[];
}

/** A summary of an invoice already in the system (duplicate-number warning). */
export interface ExistingInvoice {
  number: string;
  customer: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  amount: string;
  status: string;
}

// ---------------------------------------------------------------------------
// Accounts & settings
// ---------------------------------------------------------------------------

export interface ReceivingAccount {
  id: string;
  name: string;
  number: string;
  flag: string;
  primary?: boolean;
  /** Account holder (the sender's business). */
  holder: string;
  bankName: string;
  swift: string;
  /** Account currency. */
  currency: string;
}

/** Account-level invoice settings (DES-764) — set once, auto-applied to every new invoice. */
export interface CompanySettings {
  currency: string;
  companyName: string;
  registrationNumber: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  logo: { name: string; size: number } | null;
  /** Default receiving account (id from RECEIVING_ACCOUNTS) customers pay into — seeds new invoices. */
  paymentMethod: string;
  /** Account-level default for the per-invoice automated-chaser toggle. */
  chaserEnabled: boolean;
  /** Chosen timing for each reminder (parallel to REMINDER_DEFS); REMINDER_OFF = that reminder disabled. */
  reminders: string[];
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export type TaskType = "payment-match" | "extracted" | "overdue" | "duplicate" | "overpayment";

/** A "Needs Attention" card (dashboard stack + the dedicated screen). */
export interface AttentionTask {
  id: string;
  type: TaskType;
  title: string;
  sub: string;
  /** CTA label — the confirm/review action for this task. */
  action: string;
  /** The invoice this task is about — tapping the card or CTA opens its detail page. */
  invoice: { number: string; client: string; status: DetailStatus; origin: "created" | "uploaded" };
}

/** Hero-card demo state (dev switcher). Collected + Outstanding = Expected; pct = collected/expected. */
export interface HeroScenario {
  label: string;
  expected: string;
  pct: number;
  collected: string;
  collectedCount: number;
  outstanding: string;
  outstandingCount: number;
  /** Overdue invoices within the outstanding count. */
  overdue: number;
}
