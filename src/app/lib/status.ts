import type { Status, DetailStatus } from "../types";

/** Status pills on LIST cards (SalesInvoiceList — "Overdue" is derived: Awaiting + past due).
 *  Dashboard's RECENT_PILL and CustomerDetailPage's STATUS_PILL are separate, intentionally
 *  different palettes and stay local to those files. */
export const STATUS_PILL: Record<Status | "Overdue", { label: string; bg: string; border: string; text: string }> = {
  Awaiting: { label: "Awaiting Payment", bg: "#f9f5ea", border: "#ff4a15", text: "#ff4a15" },
  Overdue: { label: "Overdue", bg: "#fdecea", border: "#f5c6c0", text: "#d92d20" },
  Draft: { label: "Draft", bg: "#faf9f4", border: "rgba(160,160,160,0.2)", text: "#808080" },
  PartiallyPaid: { label: "Partially Paid", bg: "#fff7e6", border: "#fde68a", text: "#b45309" },
  Paid: { label: "Paid", bg: "#ebfcef", border: "#a3e9b6", text: "#006a1d" },
  Cancelled: { label: "Void", bg: "#f3f3f3", border: "rgba(160,160,160,0.35)", text: "#9a9a9a" },
};

/** Status chips on the invoice DETAIL page (richer lifecycle incl. refund states). */
export const DETAIL_STATUS_META: Record<DetailStatus, { label: string; bg: string; border: string; text: string }> = {
  Draft: { label: "Draft", bg: "#faf9f4", border: "rgba(160,160,160,0.35)", text: "#808080" },
  Awaiting: { label: "Awaiting Payment", bg: "#f9f5ea", border: "#ff4a15", text: "#ff4a15" },
  Overdue: { label: "Overdue", bg: "#fef2f2", border: "#f5c6c0", text: "#b42318" },
  PartiallyPaid: { label: "Partially Paid", bg: "#fff7e6", border: "#fde68a", text: "#b45309" },
  Paid: { label: "Paid", bg: "#ebfcef", border: "#a3e9b6", text: "#006a1d" },
  Cancelled: { label: "Void", bg: "#f3f3f3", border: "rgba(160,160,160,0.35)", text: "#808080" },
  // DES-720 refund lifecycle: Paid → Pending Refund (on refund CN created) → Refunded (full refund).
  PendingRefund: { label: "Pending Refund", bg: "#fff7e6", border: "#fde68a", text: "#b45309" },
  Refunded: { label: "Refunded", bg: "#eef2ff", border: "#c7d2fe", text: "#4338ca" },
};
