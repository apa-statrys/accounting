// Pure filter/sort logic for the Sales Invoice List — no React, no state.
import { format } from "date-fns";
import { CREDIT_NOTES } from "../../data/creditNotes";
import { INVOICES } from "../../data/invoices";
import type { Invoice, Status } from "../../types";

export type SortKey = "newest" | "oldest" | "amount-desc" | "amount-asc" | "due-asc" | "due-desc";

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Issue Date: Newest" },
  { key: "oldest", label: "Issue Date: Oldest" },
  { key: "due-asc", label: "Due Date: Earliest" },
  { key: "due-desc", label: "Due Date: Oldest" },
  { key: "amount-desc", label: "Amount: High to Low" },
  { key: "amount-asc", label: "Amount: Low to High" },
];

/** Default sort per status chip: unpaid → soonest due (chase payment); others → newest issued. */
export function defaultSortFor(match: "all" | Status | "Overdue"): SortKey {
  return match === "Awaiting" || match === "Overdue" ? "due-asc" : "newest";
}

/**
 * Which sort options apply per chip (IA "Sales Invoices List Sort By, Filter"):
 * - Draft → Issue Date only (no due date / no amount)
 * - Paid / Cancelled → Issue Date + Amount (no due date)
 * - All / Awaiting / Overdue → all six
 */
export function sortKeysFor(match: "all" | Status | "Overdue"): SortKey[] {
  if (match === "Draft") return ["newest", "oldest"];
  if (match === "Paid" || match === "Cancelled") return ["newest", "oldest", "amount-desc", "amount-asc"];
  return ["newest", "oldest", "due-asc", "due-desc", "amount-desc", "amount-asc"];
}

/** Parse an ISO date (YYYY-MM-DD) at local midnight — avoids UTC timezone drift. */
function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** "Today" for the demo, so the date presets resolve deterministically. */
export const TODAY_ISO = "2026-06-22";
export const TODAY = parseISO(TODAY_ISO);

/** Monday-based start of the week containing `d`, at local midnight. */
function startOfWeek(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (x.getDay() + 6) % 7; // 0 = Monday
  x.setDate(x.getDate() - dow);
  return x;
}
/** Sunday end of the current week. */
const endOfWeek = (d: Date) => {
  const s = startOfWeek(d);
  return new Date(s.getFullYear(), s.getMonth(), s.getDate() + 6);
};
/** Last calendar day of `d`'s month. */
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

// Due-date quick filters — upcoming windows. (Overdue is a top status chip, not here.)
export type DueFilter = "all" | "week" | "month";

// "all" is the unfiltered default — represented by no chip selected, not its own chip.
export const DUE_FILTERS: { key: Exclude<DueFilter, "all">; label: string }[] = [
  { key: "week", label: "Due This Week" },
  { key: "month", label: "Due This Month" },
];

/** Whether an invoice matches the selected due-date quick filter (unpaid invoices only). */
export function matchesDue(inv: Invoice, filter: DueFilter): boolean {
  if (filter === "all") return true;
  if (inv.status !== "Awaiting" || !inv.due) return false;
  const due = parseISO(inv.due);
  if (filter === "week") return due >= TODAY && due <= endOfWeek(TODAY);
  return due >= TODAY && due <= endOfMonth(TODAY); // month
}

/** Whether an invoice's issue date falls within the custom from/to range (either bound optional). */
export function matchesIssueRange(iso: string, from: string, to: string): boolean {
  if (!from && !to) return true;
  const d = parseISO(iso);
  if (from && d < parseISO(from)) return false;
  if (to && d > parseISO(to)) return false;
  return true;
}

/**
 * Chips and the status they filter by. "Awaiting" = all unpaid (on-time + overdue);
 * "Overdue" is the past-due subset (derived via effectiveStatus, not a stored status).
 */
export type StatusMatch = "all" | Status | "Overdue";

// No standalone Overdue / Partially Paid tabs — they fold into a related tab (see matchStatus):
// Overdue rows show under Awaiting (an overdue invoice is Awaiting past its due date), and
// Partially Paid rows show under Paid (any payment received). Each card still shows its own chip.
export const FILTERS: { label: string; match: StatusMatch }[] = [
  { label: "All", match: "all" },
  { label: "Draft", match: "Draft" },
  { label: "Awaiting", match: "Awaiting" },
  { label: "Paid", match: "Paid" },
  { label: "Void", match: "Cancelled" },
];

/** Displayed status — Overdue is derived (Awaiting + past due), Qonto-style. */
export type EffectiveStatus = Status | "Overdue";

/** The status to show/filter by: an Awaiting invoice past its due date reads as Overdue. */
export function effectiveStatus(inv: Invoice): EffectiveStatus {
  if (inv.status === "Awaiting" && inv.due && parseISO(inv.due) < TODAY) return "Overdue";
  return inv.status;
}

/**
 * Whether an invoice matches a status chip:
 * - "Awaiting" = all outstanding (on-time + overdue) — no separate Overdue tab.
 * - "Paid" = fully paid + partially paid — no separate Partially Paid tab.
 */
export function matchStatus(inv: Invoice, match: StatusMatch): boolean {
  if (match === "all") return true;
  const eff = effectiveStatus(inv);
  if (match === "Awaiting") return eff === "Awaiting" || eff === "Overdue"; // Outstanding = unpaid
  if (match === "Paid") return eff === "Paid" || eff === "PartiallyPaid"; // any payment received
  return eff === match;
}

/** Unique clients for the Filters sheet. */
export const CLIENTS = Array.from(new Set(INVOICES.map((inv) => inv.client)));

export const amountValue = (a: string) => Number(a.replace(/[^0-9.]/g, "")) || 0;

/** Due-date in ms, or null when the invoice has no due date. */
const dueValue = (inv: Invoice) => (inv.due ? new Date(inv.due).getTime() : null);

export function sortInvoices(rows: Invoice[], key: SortKey): Invoice[] {
  const sorted = [...rows];
  switch (key) {
    case "oldest":
      return sorted.reverse(); // INVOICES is authored newest-first
    case "amount-desc":
      return sorted.sort((a, b) => amountValue(b.amount) - amountValue(a.amount));
    case "amount-asc":
      return sorted.sort((a, b) => amountValue(a.amount) - amountValue(b.amount));
    // Invoices without a due date always sort last in both directions.
    case "due-asc":
      return sorted.sort((a, b) => (dueValue(a) ?? Infinity) - (dueValue(b) ?? Infinity));
    case "due-desc":
      return sorted.sort((a, b) => (dueValue(b) ?? -Infinity) - (dueValue(a) ?? -Infinity));
    case "newest":
    default:
      return sorted;
  }
}

const DAY_MS = 86400000;

/**
 * Status-aware secondary line (competitor-aligned): relative "Due in N days" for Awaiting,
 * red "Overdue by N days" for overdue; other statuses keep their authored meta suffix.
 */
export function metaLine(inv: Invoice, eff: EffectiveStatus): { number: string; rest: string; danger: boolean } {
  const number = inv.meta.split(" · ")[0];
  const rest = inv.meta.slice(number.length + 3); // text after " · "
  // Draft display by entry point: MANUAL drafts have no number yet (assigned on issue, DES-715);
  // RECURRING drafts have no number and read "Scheduled on <date>" (no invoice until it's sent);
  // UPLOAD drafts keep the number the user entered, shown with a UL- prefix (DES-716/817).
  if (eff === "Draft") {
    const norm = rest.replace(/^(Created|Uploaded|Scheduled) (?=\d)/, "$1 on ");
    return { number: inv.origin === "uploaded" ? number.replace(/^INV/, "UL") : "", rest: norm, danger: false };
  }
  if (inv.due && (eff === "Overdue" || eff === "Awaiting")) {
    const diff = Math.round((parseISO(inv.due).getTime() - TODAY.getTime()) / DAY_MS);
    if (eff === "Overdue") {
      // Caption reads "since <due date>" (the DS InvoiceRow overdue format from the Showcase) —
      // the "Overdue" Badge already carries the status word, so the caption just dates it.
      return { number, rest: `since ${format(parseISO(inv.due), "d MMM yyyy")}`, danger: true };
    }
    return { number, rest: diff <= 0 ? "Due today" : diff === 1 ? "Due tomorrow" : `Due in ${diff} days`, danger: false };
  }
  // Terminal statuses keep the authored absolute date, normalised to read "<verb> on <date>".
  return { number, rest: rest.replace(/^(Paid|Created|Uploaded|Void) (?=\d)/, "$1 on "), danger: false };
}

/** Refund-status filter — lives in the Filters sheet, not a top chip (a refund is still a Paid invoice). */
export type RefundFilter = "all" | "awaiting" | "partial" | "full";
// "partial" stays a valid RefundFilter/refundState value (used by refundStateOf + detail
// rendering), but it is no longer offered as a Filters-sheet chip (user, 15/Jul).
export const REFUND_FILTERS: { key: Exclude<RefundFilter, "all">; label: string }[] = [
  { key: "awaiting", label: "Pending Refund" },
  { key: "full", label: "Refunded" },
];
/** An invoice's refund state: in-session refunds (refundState) win, else derived from the linked CN. */
export function refundStateOf(inv: Invoice, refundState?: Record<string, "partial" | "full">): Exclude<RefundFilter, "all"> | undefined {
  const ov = refundState?.[inv.id.replace(/[a-z]$/, "")];
  if (ov === "full") return "full";
  if (ov === "partial") return "partial";
  const cn = inv.cnNo ? CREDIT_NOTES.find((c) => c.no === inv.cnNo) : undefined;
  if (cn?.kind === "refund") return "awaiting";
  return undefined;
}
/** Multi-select: an empty selection = no refund filter; otherwise the invoice must match ANY selected state. */
export function matchesRefund(inv: Invoice, filters: Array<Exclude<RefundFilter, "all">>, refundState?: Record<string, "partial" | "full">): boolean {
  if (filters.length === 0) return true;
  const st = refundStateOf(inv, refundState);
  return st !== undefined && filters.includes(st);
}
