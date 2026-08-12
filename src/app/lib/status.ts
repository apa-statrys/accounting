import type { Status, DetailStatus } from "../types";
import type { BadgeColor } from "../ui/Badge";

/** Status pills on LIST cards (SalesInvoiceList — "Overdue" is derived: Awaiting + past due).
 *  Dashboard's RECENT_PILL and CustomerDetailPage's STATUS_PILL are separate, intentionally
 *  different palettes and stay local to those files.
 *
 *  Every bg/border/text below is a design token (styles/theme.css), not a raw hex value — same
 *  bg/border/text/subtle/bold status-token triad DETAIL_STATUS_META uses, so the two stay in the
 *  same family per status. */
export const STATUS_PILL: Record<Status | "Overdue", { label: string; bg: string; border: string; text: string }> = {
  Awaiting: { label: "Awaiting Payment", bg: "var(--bg-beige-primary)", border: "var(--border-warning-bold)", text: "var(--text-warning-primary)" },
  Overdue: { label: "Overdue", bg: "var(--bg-error-subtle)", border: "var(--border-error-subtle)", text: "var(--text-error-primary)" },
  Draft: { label: "Draft", bg: "var(--bg-neutral-secondary)", border: "var(--border-neutral-primary)", text: "var(--text-secondary)" },
  PartiallyPaid: { label: "Partially Paid", bg: "var(--bg-warning-subtle)", border: "var(--border-warning-subtle)", text: "var(--text-warning-primary)" },
  Paid: { label: "Paid", bg: "var(--bg-success-subtle)", border: "var(--border-success-subtle)", text: "var(--text-success-primary)" },
  Cancelled: { label: "Void", bg: "var(--bg-neutral-tertiary)", border: "var(--border-neutral-primary)", text: "var(--text-secondary)" },
};

/** Status chips on the invoice DETAIL page (richer lifecycle incl. refund states). Same token
 *  triad as STATUS_PILL above — every status routes through its bg/border/text-{status}
 *  tokens (styles/theme.css), never a raw hex value. */
export const DETAIL_STATUS_META: Record<DetailStatus, { label: string; bg: string; border: string; text: string; color: BadgeColor }> = {
  Draft: { label: "Draft", bg: "var(--bg-neutral-secondary)", border: "var(--border-neutral-primary)", text: "var(--text-secondary)", color: "neutral" },
  Awaiting: { label: "Awaiting Payment", bg: "var(--bg-beige-primary)", border: "var(--border-warning-bold)", text: "var(--text-warning-primary)", color: "warning" },
  Overdue: { label: "Overdue", bg: "var(--bg-error-subtle)", border: "var(--border-error-subtle)", text: "var(--text-error-primary)", color: "error" },
  PartiallyPaid: { label: "Partially Paid", bg: "var(--bg-warning-subtle)", border: "var(--border-warning-subtle)", text: "var(--text-warning-primary)", color: "warning" },
  Paid: { label: "Paid", bg: "var(--bg-success-subtle)", border: "var(--border-success-subtle)", text: "var(--text-success-primary)", color: "success" },
  Cancelled: { label: "Void", bg: "var(--bg-neutral-tertiary)", border: "var(--border-neutral-primary)", text: "var(--text-secondary)", color: "neutral" },
  // DES-720 refund lifecycle: Paid → Pending Refund (on refund CN created) → Refunded (full refund).
  PendingRefund: { label: "Pending Refund", bg: "var(--bg-warning-subtle)", border: "var(--border-warning-subtle)", text: "var(--text-warning-primary)", color: "warning" },
  Refunded: { label: "Refunded", bg: "var(--bg-info-subtle)", border: "var(--border-info-subtle)", text: "var(--text-info-primary)", color: "info" },
};

/** Status chips on the CREDIT NOTE detail/preview pages (DES-719/720/721) — cancellation lifecycle
 *  (Draft/Open/Partially Applied/Fully Applied/Applied/Cancelled) plus refund lifecycle (Pending
 *  Refund/Awaiting refund/Partially Refunded/Refunded). Same token triad as STATUS_PILL/
 *  DETAIL_STATUS_META above, kept in the same family per status (e.g. Refunded shares the invoice
 *  side's info tokens) — never a raw hex value. */
export const CREDIT_NOTE_STATUS_META: Record<string, { label: string; bg: string; border: string; text: string }> = {
  Draft: { label: "Draft", bg: "var(--bg-neutral-secondary)", border: "var(--border-neutral-primary)", text: "var(--text-secondary)" },
  Open: { label: "Open", bg: "var(--bg-info-subtle)", border: "var(--border-info-subtle)", text: "var(--text-info-primary)" },
  Applied: { label: "Applied", bg: "var(--bg-success-subtle)", border: "var(--border-success-subtle)", text: "var(--text-success-primary)" },
  "Partially Applied": { label: "Partially Applied", bg: "var(--bg-warning-subtle)", border: "var(--border-warning-subtle)", text: "var(--text-warning-primary)" },
  "Fully Applied": { label: "Fully Applied", bg: "var(--bg-success-subtle)", border: "var(--border-success-subtle)", text: "var(--text-success-primary)" },
  "Pending Refund": { label: "Pending Refund", bg: "var(--bg-warning-subtle)", border: "var(--border-warning-subtle)", text: "var(--text-warning-primary)" },
  "Awaiting refund": { label: "Awaiting refund", bg: "var(--bg-warning-subtle)", border: "var(--border-warning-subtle)", text: "var(--text-warning-primary)" },
  "Partially Refunded": { label: "Partially Refunded", bg: "var(--bg-info-subtle)", border: "var(--border-info-subtle)", text: "var(--text-info-primary)" },
  Refunded: { label: "Refunded", bg: "var(--bg-info-subtle)", border: "var(--border-info-subtle)", text: "var(--text-info-primary)" },
  Cancelled: { label: "Cancelled", bg: "var(--bg-neutral-tertiary)", border: "var(--border-neutral-primary)", text: "var(--text-secondary)" },
};
