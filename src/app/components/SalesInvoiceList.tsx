import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { FilePlus, FileText } from "lucide-react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ImportExportIcon from "@mui/icons-material/ImportExport";
import TuneIcon from "@mui/icons-material/Tune";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CheckIcon from "@mui/icons-material/Check";
import SearchIcon from "@mui/icons-material/Search";
import StatusBar from "./StatusBar";
import { SheetHeader, HeaderIconButton } from "./SheetHeader";
import { SendSuccessToast } from "./SendSuccessToast";
import { CreateInvoiceSheet } from "./CreateInvoiceSheet";
import { BottomSheet } from "./BottomSheet";
import { ButtonDock } from "./ButtonDock";
import { Search } from "./Search";
import { CreditNoteDetailPage } from "./CreditNoteDetailPage";
import { CREDIT_NOTES, type CreditNote } from "./creditNotesData";
import { CUSTOMERS } from "./CreateSalesInvoice";

const FONT = { fontFamily: "GT Walsheim LC, sans-serif" } as const;

export type Status = "Awaiting" | "Draft" | "PartiallyPaid" | "Paid" | "Cancelled";

type SortKey = "newest" | "oldest" | "amount-desc" | "amount-asc" | "due-asc" | "due-desc";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Issue Date: Newest" },
  { key: "oldest", label: "Issue Date: Oldest" },
  { key: "due-asc", label: "Due Date: Earliest" },
  { key: "due-desc", label: "Due Date: Oldest" },
  { key: "amount-desc", label: "Amount: High to Low" },
  { key: "amount-asc", label: "Amount: Low to High" },
];

/** Default sort per status chip: unpaid → soonest due (chase payment); others → newest issued. */
function defaultSortFor(match: "all" | Status | "Overdue"): SortKey {
  return match === "Awaiting" || match === "Overdue" ? "due-asc" : "newest";
}

/**
 * Which sort options apply per chip (IA "Sales Invoices List Sort By, Filter"):
 * - Draft → Issue Date only (no due date / no amount)
 * - Paid / Cancelled → Issue Date + Amount (no due date)
 * - All / Awaiting / Overdue → all six
 */
function sortKeysFor(match: "all" | Status | "Overdue"): SortKey[] {
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
const TODAY_ISO = "2026-06-22";
const TODAY = parseISO(TODAY_ISO);

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
type DueFilter = "all" | "week" | "month";

// "all" is the unfiltered default — represented by no chip selected, not its own chip.
const DUE_FILTERS: { key: Exclude<DueFilter, "all">; label: string }[] = [
  { key: "week", label: "Due This Week" },
  { key: "month", label: "Due This Month" },
];

/** Whether an invoice matches the selected due-date quick filter (unpaid invoices only). */
function matchesDue(inv: Invoice, filter: DueFilter): boolean {
  if (filter === "all") return true;
  if (inv.status !== "Awaiting" || !inv.due) return false;
  const due = parseISO(inv.due);
  if (filter === "week") return due >= TODAY && due <= endOfWeek(TODAY);
  return due >= TODAY && due <= endOfMonth(TODAY); // month
}

/** Whether an invoice's issue date falls within the custom from/to range (either bound optional). */
function matchesIssueRange(iso: string, from: string, to: string): boolean {
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
type StatusMatch = "all" | Status | "Overdue";

const FILTERS: { label: string; match: StatusMatch }[] = [
  { label: "All Invoices", match: "all" },
  { label: "Draft", match: "Draft" },
  { label: "Awaiting", match: "Awaiting" },
  { label: "Overdue", match: "Overdue" },
  { label: "Partially Paid", match: "PartiallyPaid" },
  { label: "Paid", match: "Paid" },
  { label: "Cancelled", match: "Cancelled" },
];

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
  /** A linked credit note (Cancelled = full; Awaiting = partial via cnAmount) + sent state. */
  cnNo?: string;
  cnAmount?: number;
  cnSent?: boolean;
}

export const INVOICES: Invoice[] = [
  { id: "INV-2026-000004", client: "Marlow & Finch Studio", meta: "INV-2026-000004 · Due 25 Jun 2026", amount: "$6,430.05", status: "Awaiting", date: "2026-06-11", due: "2026-06-25" },
  { id: "INV-2026-000007", client: "Northwind Traders", meta: "INV-2026-000007 · Due 05 Jun 2026", amount: "$2,150.00", status: "Awaiting", date: "2026-05-20", due: "2026-06-05" },
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
  { id: "INV-2026-000006", client: "Lumen Creative", meta: "INV-2026-000006 · Created 12 Jun 2026", amount: "$980.50", status: "Draft", date: "2026-06-12" },
  { id: "INV-2026-000002", client: "Otto Reyes", meta: "INV-2026-000002 · Uploaded 18 Jun 2026", amount: "$100,034.00", status: "Draft", origin: "uploaded", date: "2026-06-18" },
  { id: "INV-2026-000005", client: "Atlas Logistics", meta: "INV-2026-000005 · Paid 12 Jun 2026", amount: "$4,725.00", status: "Paid", date: "2026-05-28", due: "2026-06-10" },
  { id: "INV-2026-000001b", client: "Bright Harbor Co.", meta: "INV-2026-000001 · Created 10 May 2026", amount: "$342.27", status: "Draft", date: "2026-05-10" },
  { id: "INV-2026-000001a", client: "Marlow & Finch Studio", meta: "INV-2026-000001 · Paid 28 Apr 2026", amount: "$123.87", status: "Paid", date: "2026-04-15", due: "2026-04-30" },
  { id: "INV-2026-000008", client: "Bright Harbor Co.", meta: "INV-2026-000008 · Cancelled 8 Jun 2026", amount: "$500.00", status: "Cancelled", date: "2026-06-08", cnNo: "CN-2026-000001", cnSent: true },
  { id: "INV-2026-000009", client: "Vela Robotics", meta: "INV-2026-000009 · Cancelled 22 Jun 2026", amount: "$1,280.00", status: "Cancelled", date: "2026-06-22", cnNo: "CN-2026-000002", cnSent: false },
];

// Map an invoice to a STABLE customer id (via the client register's ORIGINAL names). Used to link a
// customer to their invoices by id, so renaming a client (DES-714) doesn't orphan them. Invoices whose
// client isn't in the register (demo names like "Harbor & Co.") return undefined and match no customer.
const NAME_TO_ID = new Map(CUSTOMERS.map((c) => [c.name, c.id]));
export const customerIdForInvoice = (inv: Invoice): string | undefined => NAME_TO_ID.get(inv.client);

/** Displayed status — Overdue is derived (Awaiting + past due), Qonto-style. */
type EffectiveStatus = Status | "Overdue";

/** The status to show/filter by: an Awaiting invoice past its due date reads as Overdue. */
function effectiveStatus(inv: Invoice): EffectiveStatus {
  if (inv.status === "Awaiting" && inv.due && parseISO(inv.due) < TODAY) return "Overdue";
  return inv.status;
}

/** Whether an invoice matches a status chip. "Awaiting" = all unpaid (on-time + overdue). */
function matchStatus(inv: Invoice, match: StatusMatch): boolean {
  if (match === "all") return true;
  const eff = effectiveStatus(inv);
  if (match === "Awaiting") return eff === "Awaiting" || eff === "Overdue"; // Outstanding = unpaid
  return eff === match;
}

/** Per-status pill styling (Figma 426:14555). */
const STATUS_PILL: Record<EffectiveStatus, { label: string; bg: string; border: string; text: string }> = {
  Awaiting: { label: "Awaiting Payment", bg: "#f9f5ea", border: "#ff4a15", text: "#ff4a15" },
  Overdue: { label: "Overdue", bg: "#fdecea", border: "#f5c6c0", text: "#d92d20" },
  Draft: { label: "Draft", bg: "#faf9f4", border: "rgba(160,160,160,0.2)", text: "#808080" },
  PartiallyPaid: { label: "Partially Paid", bg: "#fff7e6", border: "#fde68a", text: "#b45309" },
  Paid: { label: "Paid", bg: "#ebfcef", border: "#a3e9b6", text: "#006a1d" },
  Cancelled: { label: "Cancelled", bg: "#f3f3f3", border: "rgba(160,160,160,0.35)", text: "#9a9a9a" },
};

/** Unique clients for the Filters sheet. */
const CLIENTS = Array.from(new Set(INVOICES.map((inv) => inv.client)));

const amountValue = (a: string) => Number(a.replace(/[^0-9.]/g, "")) || 0;

/** Due-date in ms, or null when the invoice has no due date. */
const dueValue = (inv: Invoice) => (inv.due ? new Date(inv.due).getTime() : null);

function sortInvoices(rows: Invoice[], key: SortKey): Invoice[] {
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

const REVEAL = 88;
const DAY_MS = 86400000;

/**
 * Status-aware secondary line (competitor-aligned): relative "Due in N days" for Awaiting,
 * red "Overdue by N days" for overdue; other statuses keep their authored meta suffix.
 */
function metaLine(inv: Invoice, eff: EffectiveStatus): { number: string; rest: string; danger: boolean } {
  const number = inv.meta.split(" · ")[0];
  const rest = inv.meta.slice(number.length + 3); // text after " · "
  if (inv.due && (eff === "Overdue" || eff === "Awaiting")) {
    const diff = Math.round((parseISO(inv.due).getTime() - TODAY.getTime()) / DAY_MS);
    if (eff === "Overdue") {
      const n = Math.max(1, -diff);
      return { number, rest: `Overdue by ${n} ${n === 1 ? "day" : "days"}`, danger: true };
    }
    return { number, rest: diff <= 0 ? "Due today" : diff === 1 ? "Due tomorrow" : `Due in ${diff} days`, danger: false };
  }
  // Terminal statuses keep the authored absolute date, normalised to read "<verb> on <date>".
  return { number, rest: rest.replace(/^(Paid|Created|Uploaded|Cancelled) (?=\d)/, "$1 on "), danger: false };
}

/** Refund-status filter — lives in the Filters sheet, not a top chip (a refund is still a Paid invoice). */
type RefundFilter = "all" | "awaiting" | "partial" | "full";
const REFUND_FILTERS: { key: Exclude<RefundFilter, "all">; label: string }[] = [
  { key: "awaiting", label: "Refund Pending" },
  { key: "partial", label: "Partially refunded" },
  { key: "full", label: "Refunded" },
];
/** An invoice's refund state: in-session refunds (refundState) win, else derived from the linked CN. */
function refundStateOf(inv: Invoice, refundState?: Record<string, "partial" | "full">): Exclude<RefundFilter, "all"> | undefined {
  const ov = refundState?.[inv.id.replace(/[a-z]$/, "")];
  if (ov === "full") return "full";
  if (ov === "partial") return "partial";
  const cn = inv.cnNo ? CREDIT_NOTES.find((c) => c.no === inv.cnNo) : undefined;
  if (cn?.status === "Pending Refund") return "awaiting";
  if (cn?.status === "Refunded") return "full";
  return undefined;
}
/** Multi-select: an empty selection = no refund filter; otherwise the invoice must match ANY selected state. */
function matchesRefund(inv: Invoice, filters: Array<Exclude<RefundFilter, "all">>, refundState?: Record<string, "partial" | "full">): boolean {
  if (filters.length === 0) return true;
  const st = refundStateOf(inv, refundState);
  return st !== undefined && filters.includes(st);
}

function InvoiceCard({ inv, highlighted, onClick, onDelete, onOpenCN, refundOverride }: { inv: Invoice; highlighted?: boolean; onClick?: () => void; onDelete?: () => void; onOpenCN?: (inv: Invoice) => void; refundOverride?: "partial" | "full" }) {
  const eff = effectiveStatus(inv);
  const s = STATUS_PILL[eff];
  const meta = metaLine(inv, eff);
  const isDraft = inv.status === "Draft";
  // Linked credit note (DES-763): refund-type CNs surface a derived refund state. A refund completed
  // in-session (refundOverride) wins → "Partially Refunded" / "Refunded".
  const linkedCn = inv.cnNo ? CREDIT_NOTES.find((c) => c.no === inv.cnNo) : undefined;
  const refundChip = refundOverride === "full" ? "Refunded"
    : refundOverride === "partial" ? "Partially Refunded"
    : linkedCn?.status === "Pending Refund" ? "Refund pending"
    : linkedCn?.status === "Refunded" ? "Refunded"
    : undefined;
  // A refunded/pending invoice stays "Paid", but the right-side pill shows the refund state as the
  // primary status (mirrors the detail page) — the paid date moves into the meta line, so no duplication.
  const pill =
    refundChip === "Refunded" ? { label: "Refunded", bg: "#eef2ff", border: "#c7d2fe", text: "#4338ca" }
    : refundChip === "Partially Refunded" ? { label: "Partially Refunded", bg: "#fff7e6", border: "#fde68a", text: "#b45309" }
    : refundChip === "Refund pending" ? { label: "Refund Pending", bg: "#fff7e6", border: "#fde68a", text: "#c2410c" }
    : s;
  // Any invoice with a linked credit note shows a credit-note summary row beneath (DES-763 AC6): count +
  // amount + "View". The top amount stays the invoice total, consistent with every other card. The amount
  // label reads "Refund amount" for refund credit notes, "Credited amount" for cancellation/partial credits.
  const hasCn = Boolean(inv.cnNo);
  const cnAmountStr = linkedCn
    ? `$${linkedCn.original.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : inv.amount;
  const cnAmountLabel = refundChip ? "Refund amount" : "Credited amount";
  const cnCount = inv.cnNo ? 1 : 0; // demo: one credit note per invoice
  // Manual swipe-to-delete (pointer events + CSS transform — no framer drag, which renders blank
  // inside an overflow-hidden wrapper). `tx` is the committed/live offset; press tracks the gesture.
  const [tx, setTx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const press = useRef<{ x: number; base: number } | null>(null);
  const movedRef = useRef(false);

  // Shared left block (client + meta) and the status pill — reused by both layouts.
  const nameMeta = (
    <div className="flex-1 min-w-0">
      <p className="text-[16px] font-medium leading-[1.2] tracking-[-0.3px] truncate text-[#101828]" style={FONT}>
        {inv.client}
      </p>
      {/* Invoice number on its own line; the date phrase ("Due in N days" / "Overdue by N days" /
          "Paid on …") sits beneath it. */}
      <div className="flex flex-col gap-0.5 mt-1">
        <p className="text-[12px] font-medium leading-[1.2] text-[#808080] truncate" style={FONT}>{meta.number}</p>
        <p className="text-[12px] leading-[1.2]" style={{ ...FONT, color: meta.danger ? "#d92d20" : "#a0a0a0", fontWeight: meta.danger ? 600 : 400 }}>{meta.rest}</p>
      </div>
    </div>
  );
  const pillEl = (
    <span
      className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-bold leading-[15px] whitespace-nowrap"
      style={{ ...FONT, background: pill.bg, borderColor: pill.border, color: pill.text }}
    >
      {pill.label}
    </span>
  );

  // Credit-note summary row (icon + count + amount + View) — shown on every invoice with a credit note.
  const cnSummary = (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onOpenCN?.(inv); }}
      className="group/cn w-full flex items-center justify-between gap-3 pt-3 mt-0.5 border-t border-[rgba(160,160,160,0.18)] text-left"
    >
      <span className="flex items-start gap-2 min-w-0">
        <FileText size={18} className="mt-0.5 shrink-0" style={{ color: "#1b1b1b" }} />
        <span className="flex flex-col min-w-0">
          <span className="text-[13px] font-bold leading-[1.2]" style={{ ...FONT, color: "#1b1b1b" }}>{cnCount} Credit Note{cnCount > 1 ? "s" : ""}</span>
          <span className="text-[12px] leading-[1.3] mt-0.5 truncate" style={{ ...FONT, color: "#808080" }}>{cnAmountLabel}: {cnAmountStr}</span>
        </span>
      </span>
      <span className="shrink-0 inline-flex items-center gap-0.5">
        <span className="text-[13px] font-medium" style={{ ...FONT, color: "#1b1b1b" }}>View</span>
        <ChevronRightIcon className="transition-transform group-hover/cn:translate-x-0.5" style={{ fontSize: 16, color: "#808080" }} />
      </span>
    </button>
  );

  const content = (
    <>
      {/* Top row: client + meta on the left, invoice total over the status pill on the right. */}
      <div className="flex items-start justify-between gap-2.5">
        {nameMeta}
        <div className="shrink-0 flex flex-col items-end gap-1.5">
          <p className="text-[16px] font-bold leading-[1.2] text-[#101828] whitespace-nowrap" style={FONT}>{inv.amount}</p>
          {pillEl}
        </div>
      </div>
      {/* Any invoice with a credit note → the credit-note summary row. */}
      {hasCn && cnSummary}
    </>
  );

  // Non-drafts: plain tappable card (with the recent-card highlight animation).
  if (!isDraft) {
    return (
      <motion.button
        onClick={onClick}
        initial={false}
        animate={
          highlighted
            ? { backgroundColor: "#fffaf3", borderColor: "#ff4a15", boxShadow: "0 0 0 3px rgba(255,74,21,0.12)" }
            : { backgroundColor: "#faf9f4", borderColor: "rgba(160,160,160,0.2)", boxShadow: "0 0 0 0px rgba(255,74,21,0)" }
        }
        transition={{ duration: 0.5 }}
        className="shrink-0 w-full flex flex-col gap-2 border border-dashed rounded-2xl p-4 text-left"
      >
        {content}
      </motion.button>
    );
  }

  // Drafts: swipe left to reveal a delete action; tap to open.
  return (
    <div className="shrink-0 relative rounded-2xl overflow-hidden">
      <div className="absolute right-0 top-0 bottom-0 flex items-center justify-end py-1 pr-0.5">
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete draft"
          className="h-full w-[80px] rounded-2xl bg-[#fb4d4d] flex flex-col items-center justify-center gap-0.5 text-white active:bg-[#e23d3d]"
        >
          <DeleteOutlineIcon style={{ fontSize: 22, color: "#fff" }} />
          <span className="text-[12px] font-medium" style={FONT}>Delete</span>
        </button>
      </div>

      <div
        onPointerDown={(e) => {
          (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
          press.current = { x: e.clientX, base: tx };
          movedRef.current = false;
          setDragging(true);
        }}
        onPointerMove={(e) => {
          if (!press.current) return;
          const dx = e.clientX - press.current.x;
          if (Math.abs(dx) > 4) movedRef.current = true;
          setTx(Math.max(-REVEAL, Math.min(0, press.current.base + dx)));
        }}
        onPointerUp={() => {
          if (!press.current) return;
          press.current = null;
          setDragging(false);
          setTx((cur) => (cur < -REVEAL / 2 ? -REVEAL : 0));
        }}
        onPointerCancel={() => {
          press.current = null;
          setDragging(false);
          setTx((cur) => (cur < -REVEAL / 2 ? -REVEAL : 0));
        }}
        onClick={() => {
          if (movedRef.current) { movedRef.current = false; return; }
          if (tx !== 0) { setTx(0); return; }
          onClick?.();
        }}
        className="relative w-full flex flex-col gap-2 border border-dashed rounded-2xl p-4 text-left"
        style={{
          background: highlighted ? "#fffaf3" : "#faf9f4",
          borderColor: highlighted ? "#ff4a15" : "rgba(160,160,160,0.2)",
          boxShadow: highlighted ? "0 0 0 3px rgba(255,74,21,0.12)" : undefined,
          transform: `translateX(${tx}px)`,
          transition: dragging ? "none" : "transform 0.25s ease",
          touchAction: "pan-y",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        {content}
      </div>
    </div>
  );
}

interface SalesInvoiceListProps {
  showSuccess?: boolean;
  /** Toast title — short, varies by action. */
  successMessage?: string;
  /** Toast muted subline (e.g. "Marked as sent"). */
  successSubtext?: string;
  onSuccessDone?: () => void;
  /** A just-created/saved invoice to surface + temporarily highlight at the top of the list. */
  recent?: { client: string; amount: string; status: Status; meta: string } | null;
  onBack?: () => void;
  /** Open an invoice's detail page. */
  onOpenInvoice?: (inv: { number: string; client: string; status: Status; origin: "created" | "uploaded"; cnNo?: string; cnAmount?: number; cnSent?: boolean }) => void;
  onManual?: () => void;
  onUpload?: () => void;
  /** Preset the status chip when opened from a dashboard tile (e.g. "Paid"). */
  initialStatus?: StatusMatch;
  /** Preset the due-date quick filter when opened from elsewhere (e.g. "week"). */
  initialDue?: DueFilter;
  /** Refunds completed in-session (DES-720), keyed by invoice number → "partial" | "full". */
  refundState?: Record<string, "partial" | "full">;
}

export function SalesInvoiceList({ showSuccess, successMessage, successSubtext, onSuccessDone, recent, onBack, onOpenInvoice, onManual, onUpload, initialStatus, initialDue, refundState }: SalesInvoiceListProps) {
  const initialActive = initialStatus ? Math.max(0, FILTERS.findIndex((f) => f.match === initialStatus)) : 0;
  const [active, setActive] = useState(initialActive);
  // Keep the selected status chip scrolled into view (e.g. when opened pre-filtered from the hero).
  const activeChipRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    activeChipRef.current?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [active]);
  const [sortKey, setSortKey] = useState<SortKey>(defaultSortFor(FILTERS[initialActive].match));

  // Switching status chips resets the sort to that chip's natural default:
  // unpaid (Awaiting/Overdue) → chase by due date; everything else → newest issued.
  const selectChip = (i: number) => {
    const m = FILTERS[i].match;
    setActive(i);
    setSortKey(defaultSortFor(m));
    // Due-date filtering only applies to the unpaid views (All / Awaiting).
    if (m !== "all" && m !== "Awaiting") setDueFilter("all");
    // Refunds only apply to Paid invoices, so the refund filter resets off other chips.
    if (m !== "all" && m !== "Paid") setRefundFilters([]);
  };
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [dueFilter, setDueFilter] = useState<DueFilter>(initialDue ?? "all");
  const [refundFilters, setRefundFilters] = useState<Array<Exclude<RefundFilter, "all">>>([]);
  const [issueFrom, setIssueFrom] = useState("");
  const [issueTo, setIssueTo] = useState("");
  const [clientQuery, setClientQuery] = useState("");
  // Customer search is revealed inline by tapping the search icon; the header stays sticky while the
  // list scrolls. Tap the icon again to hide + clear. Clearing text uses the ✕ inside the field.
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const issueActive = Boolean(issueFrom || issueTo);
  // Due-date filter is only meaningful on the unpaid views (All / Awaiting).
  const activeMatch = FILTERS[active].match;
  const showDueFilter = activeMatch === "all" || activeMatch === "Awaiting";
  // Refund filter only makes sense where Paid invoices appear (All / Paid).
  const showRefundFilter = activeMatch === "all" || activeMatch === "Paid";
  // Sort options available on the current chip (per the IA).
  const allowedSorts = new Set(sortKeysFor(activeMatch));
  const visibleSortOptions = SORT_OPTIONS.filter((o) => allowedSorts.has(o.key));

  // Qonto-style: only surface a search once the client list is long enough to need it.
  const visibleClients = CLIENTS.filter((c) => c.toLowerCase().includes(clientQuery.toLowerCase()));

  const sortLabel = SORT_OPTIONS.find((o) => o.key === sortKey)!.label;
  // Number of active filters (date range + each picked client) — shown on the Filters button.
  const filterCount = selectedClients.length + (dueFilter === "all" ? 0 : 1) + (issueActive ? 1 : 0) + refundFilters.length;

  // The freshly created/saved invoice (if any), prepended as a real card.
  const recentRow: Invoice | null = recent
    ? { id: "recent-new", client: recent.client, meta: recent.meta, amount: recent.amount, status: recent.status, date: TODAY_ISO }
    : null;
  const allRows = useMemo(() => (recentRow ? [recentRow, ...INVOICES] : INVOICES), [recentRow?.client, recentRow?.amount, recentRow?.status]);
  // Drafts removed via swipe-to-delete are hidden locally; deletion goes through a confirm sheet.
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  // CN badge → the linked credit note's detail (DES-763 AC6), resolved by CN number from the shared register.
  const [cnPreview, setCnPreview] = useState<CreditNote | null>(null);
  // The invoice's send state + total for the opened CN (the register doesn't carry them; the invoice does).
  const [cnPreviewSent, setCnPreviewSent] = useState(false);
  const [cnPreviewInvoiceTotal, setCnPreviewInvoiceTotal] = useState(0);
  const openCnForInvoice = (inv: Invoice) => {
    if (!inv.cnNo) return;
    const found = CREDIT_NOTES.find((c) => c.no === inv.cnNo);
    const amt = inv.cnAmount ?? amountValue(inv.amount);
    setCnPreviewSent(!!inv.cnSent);
    setCnPreviewInvoiceTotal(amountValue(inv.amount));
    setCnPreview(found ?? { no: inv.cnNo, customer: inv.client, email: "", invoiceNo: inv.id.replace(/[a-z]$/, ""), original: amt, invoiceTotal: amountValue(inv.amount), applied: 0, kind: "cancellation", status: "Open", date: "", reason: "" });
  };
  const allInvoices = useMemo(() => allRows.filter((inv) => !deletedIds.includes(inv.id)), [allRows, deletedIds]);

  // Highlight the recent card on arrival, then let it settle after a moment.
  const [highlightRecent, setHighlightRecent] = useState(false);
  useEffect(() => {
    if (!recent) return;
    setHighlightRecent(true);
    const t = setTimeout(() => setHighlightRecent(false), 2600);
    return () => clearTimeout(t);
  }, [recent?.client, recent?.amount, recent?.status]);

  // Live count per chip, derived from the data.
  const counts = useMemo(
    () => FILTERS.map((f) => allInvoices.filter((inv) => matchStatus(inv, f.match)).length),
    [allInvoices]
  );

  // Filter by chip + client filters, then sort the flat list.
  const list = useMemo(() => {
    const { match } = FILTERS[active];
    const visible = allInvoices.filter((inv) => {
      const matchesChip = matchStatus(inv, match);
      const matchesClient = selectedClients.length === 0 || selectedClients.includes(inv.client);
      const matchesDate = matchesDue(inv, dueFilter);
      const matchesIssue = matchesIssueRange(inv.date, issueFrom, issueTo);
      const matchesRef = matchesRefund(inv, refundFilters, refundState);
      return matchesChip && matchesClient && matchesDate && matchesIssue && matchesRef;
    });
    return sortInvoices(visible, sortKey);
  }, [active, selectedClients, dueFilter, refundFilters, issueFrom, issueTo, sortKey, allInvoices, refundState]);

  const resultCount = list.length;

  const toggleClient = (c: string) =>
    setSelectedClients((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  return (
    <div
      className="relative bg-[#f9f5ea] rounded-[48px] overflow-hidden shadow-2xl flex flex-col"
      style={{ width: 375, height: 812 }}
    >
      {/* Thin horizontal scrollbar for the status chip row */}
      <style>{`
        .chip-scroll{scrollbar-width:thin;scrollbar-color:rgba(160,160,160,0.45) transparent;}
        .chip-scroll::-webkit-scrollbar{height:2px;}
        .chip-scroll::-webkit-scrollbar-track{background:transparent;margin:0 16px;}
        .chip-scroll::-webkit-scrollbar-thumb{background:rgba(160,160,160,0.45);border-radius:9999px;}
      `}</style>

      <StatusBar />

      <SheetHeader
        title="Sales Invoices"
        type="inside-page"
        state="fixed"
        className="bg-[#f9f5ea]"
        leading={
          <HeaderIconButton aria-label="Back" onClick={onBack}>
            <ChevronLeftIcon />
          </HeaderIconButton>
        }
        trailing={<span className="w-[30px] h-[30px] block" aria-hidden />}
      />

      {/* Status filter chips — horizontally scrollable */}
      <div className="shrink-0 flex gap-2 overflow-x-auto chip-scroll bg-[#f9f5ea] px-4 pt-4 pb-3 rounded-b-lg shadow-[0_4px_14px_rgba(226,220,203,0.3)] relative z-10">
        {FILTERS.map((f, i) => {
          const isActive = i === active;
          return (
            <button
              key={f.label}
              ref={isActive ? activeChipRef : undefined}
              onClick={() => selectChip(i)}
              className={`shrink-0 h-[30px] px-3 rounded-full whitespace-nowrap link-upper-sm ${
                isActive ? "bg-[#ff4a15] text-white" : "bg-white text-[#1b1b1b]"
              }`}
            >
              {f.label} ( {counts[i]} )
            </button>
          );
        })}
      </div>

      {/* Sort / Filter row (Variation A) */}
      <div className="shrink-0 flex items-center justify-between bg-white px-4 py-2.5 border-b border-[#f1f1f1]">
        <button onClick={() => setSortOpen(true)} className="flex items-center gap-1" style={FONT}>
          <ImportExportIcon style={{ fontSize: 18, color: "#1b1b1b" }} />
          <span className="text-[13px] text-[#1b1b1b]">
            Sort: <span className="font-medium">{sortLabel}</span>
          </span>
          <KeyboardArrowDownIcon style={{ fontSize: 16, color: "#808080" }} />
        </button>
        <button onClick={() => setFilterOpen(true)} className="flex items-center gap-1.5" style={FONT}>
          <TuneIcon style={{ fontSize: 18, color: "#1b1b1b" }} />
          <span className="text-[13px] font-medium text-[#1b1b1b]">Filters</span>
          {filterCount > 0 && (
            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#ff4a15] text-white text-[11px] font-bold flex items-center justify-center">
              {filterCount}
            </span>
          )}
        </button>
      </div>

      {/* Invoice list */}
      <div className="flex-1 overflow-y-auto thin-scrollbar bg-white px-4 pt-4 pb-28 flex flex-col gap-2.5">
        {list.length === 0 ? (
          <p className="text-center text-[13px] text-[#a0a0a0] pt-16" style={FONT}>No invoices found</p>
        ) : (
          list.map((inv) => (
            <InvoiceCard
              key={inv.id}
              inv={inv}
              highlighted={highlightRecent && inv.id === "recent-new"}
              onClick={() => onOpenInvoice?.({ number: inv.id.replace(/[a-z]$/, ""), client: inv.client, status: inv.status, origin: inv.origin ?? "created", cnNo: inv.cnNo, cnAmount: inv.cnAmount, cnSent: inv.cnSent })}
              onDelete={() => setConfirmDeleteId(inv.id)}
              onOpenCN={openCnForInvoice}
              refundOverride={refundState?.[inv.id.replace(/[a-z]$/, "")]}
            />
          ))
        )}
      </div>

      {/* Create invoice FAB */}
      <button
        onClick={() => setSheetOpen(true)}
        aria-label="Create invoice"
        className="absolute z-20 bottom-8 right-8 w-14 h-14 rounded-full bg-[#1b1b1b] flex items-center justify-center"
        style={{ boxShadow: "0 20px 12.5px rgba(0,0,0,0.1), 0 8px 5px rgba(0,0,0,0.1)" }}
      >
        <FilePlus size={24} className="text-white" />
      </button>

      {/* Create bottom sheet */}
      <CreateInvoiceSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onManual={() => {
          setSheetOpen(false);
          onManual?.();
        }}
        onUpload={() => {
          setSheetOpen(false);
          onUpload?.();
        }}
      />

      {/* CN badge → the linked credit note's detail (DES-763 AC6), with its real data. */}
      {cnPreview && (() => {
        const done = refundState?.[cnPreview.invoiceNo];
        const eff = done === "full" ? "Refunded" : done === "partial" ? "Partially Refunded" : cnPreview.status;
        const kind = cnPreview.kind;
        return (
          <div className="absolute inset-0 z-50">
            <CreditNoteDetailPage
              creditNoteNo={cnPreview.no}
              invoiceNo={cnPreview.invoiceNo}
              customerName={cnPreview.customer}
              customerEmail={cnPreview.email}
              issueDateLabel={cnPreview.date}
              currency="USD"
              total={cnPreview.original}
              invoiceTotal={cnPreviewInvoiceTotal}
              lines={[{ name: kind === "refund" ? "Refund amount" : "Credited amount", amount: cnPreview.original, original: cnPreviewInvoiceTotal }]}
              reason={cnPreview.reason}
              kind={kind}
              status={eff}
              sent={cnPreviewSent}
              onBack={() => setCnPreview(null)}
              onViewInvoice={() => {
                const inv = allInvoices.find((x) => x.id.replace(/[a-z]$/, "") === cnPreview.invoiceNo);
                if (inv) onOpenInvoice?.({ number: cnPreview.invoiceNo, client: inv.client, status: inv.status, origin: inv.origin ?? "created", cnNo: inv.cnNo, cnAmount: inv.cnAmount, cnSent: inv.cnSent });
                setCnPreview(null);
              }}
            />
          </div>
        );
      })()}

      {/* Sort bottom sheet */}
      <BottomSheet open={sortOpen} title="Sort by" onClose={() => setSortOpen(false)}>
        <div className="flex flex-col">
          {visibleSortOptions.map((o, i) => {
            const isActive = o.key === sortKey;
            return (
              <button
                key={o.key}
                onClick={() => {
                  setSortKey(o.key);
                  setSortOpen(false);
                }}
                className={`w-full flex items-center justify-between py-3.5 text-left ${
                  i === visibleSortOptions.length - 1 ? "" : "border-b border-[#f1f1f1]"
                }`}
              >
                <span className={`text-[15px] ${isActive ? "font-bold text-[#1b1b1b]" : "text-[#1b1b1b]"}`} style={FONT}>
                  {o.label}
                </span>
                {isActive && <CheckIcon style={{ fontSize: 20, color: "#ff4a15" }} />}
              </button>
            );
          })}
        </div>
      </BottomSheet>

      {/* Filters bottom sheet */}
      <BottomSheet
        open={filterOpen}
        title="Filters"
        onClose={() => setFilterOpen(false)}
        footer={
          filterCount === 0 ? undefined : (
            <ButtonDock
              type="double"
              secondaryLabel="Reset"
              primaryLabel={`Show ${resultCount} ${resultCount === 1 ? "invoice" : "invoices"}`}
              onSecondary={() => {
                setSelectedClients([]);
                setDueFilter("all");
                setRefundFilters([]);
                setIssueFrom("");
                setIssueTo("");
                setClientQuery("");
              }}
              onPrimary={() => setFilterOpen(false)}
              homeIndicator
            />
          )
        }
      >
        {showDueFilter && (
          <>
            <p className="text-[12px] font-bold uppercase tracking-wide text-[#a0a0a0] mb-2" style={FONT}>Due date</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {DUE_FILTERS.map((r) => {
                const isOn = dueFilter === r.key;
                return (
                  <button
                    key={r.key}
                    onClick={() => setDueFilter((prev) => (prev === r.key ? "all" : r.key))}
                    className="h-9 px-3.5 rounded-full border text-[13px] font-medium transition-colors"
                    style={{
                      ...FONT,
                      borderColor: isOn ? "#ff4a15" : "rgba(160,160,160,0.4)",
                      background: isOn ? "#fff4f0" : "transparent",
                      color: isOn ? "#ff4a15" : "#1b1b1b",
                    }}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          </>
        )}

        <p className="text-[12px] font-bold uppercase tracking-wide text-[#a0a0a0] mb-2" style={FONT}>Issue date</p>
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            {!issueFrom && (
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-[#a0a0a0]" style={FONT}>Start date</span>
            )}
            <input
              type="date"
              value={issueFrom}
              max={issueTo || undefined}
              onChange={(e) => setIssueFrom(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-[rgba(160,160,160,0.4)] text-[14px] bg-white"
              style={{ ...FONT, color: issueFrom ? "#1b1b1b" : "transparent" }}
            />
          </div>
          <div className="relative flex-1">
            {!issueTo && (
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-[#a0a0a0]" style={FONT}>End date</span>
            )}
            <input
              type="date"
              value={issueTo}
              min={issueFrom || undefined}
              onChange={(e) => setIssueTo(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-[rgba(160,160,160,0.4)] text-[14px] bg-white"
              style={{ ...FONT, color: issueTo ? "#1b1b1b" : "transparent" }}
            />
          </div>
        </div>

        {/* Refund status — a refunded invoice is still Paid, so it's a filter here (only on All / Paid). */}
        {showRefundFilter && (
          <>
            <p className="text-[12px] font-bold uppercase tracking-wide text-[#a0a0a0] mb-2" style={FONT}>Refund Status</p>
            <div className="flex flex-col mb-6">
              {REFUND_FILTERS.map((r, i) => {
                const isOn = refundFilters.includes(r.key);
                return (
                  <button
                    key={r.key}
                    onClick={() => setRefundFilters((prev) => (prev.includes(r.key) ? prev.filter((k) => k !== r.key) : [...prev, r.key]))}
                    className={`w-full flex items-center justify-between py-3.5 text-left ${i === REFUND_FILTERS.length - 1 ? "" : "border-b border-[#f1f1f1]"}`}
                  >
                    <span className="text-[15px] text-[#1b1b1b]" style={FONT}>{r.label}</span>
                    <span
                      className="size-6 rounded-md border flex items-center justify-center"
                      style={{ borderColor: isOn ? "#ff4a15" : "rgba(160,160,160,0.5)", background: isOn ? "#ff4a15" : "transparent" }}
                    >
                      {isOn && <CheckIcon style={{ fontSize: 16, color: "white" }} />}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Customer — title + count + search toggle stay sticky while the list scrolls beneath. */}
        <div className="sticky top-0 z-10 bg-white -mx-6 px-6 pb-2 border-b border-[#f1f1f1]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[12px] font-bold uppercase tracking-wide text-[#a0a0a0]" style={FONT}>Customer ({CLIENTS.length})</p>
            {CLIENTS.length >= 5 && (
              <button
                type="button"
                aria-label={customerSearchOpen ? "Hide customer search" : "Search customers"}
                onClick={() => { if (customerSearchOpen) setClientQuery(""); setCustomerSearchOpen((v) => !v); }}
                className="p-1 -m-1"
              >
                <SearchIcon style={{ fontSize: 18, color: customerSearchOpen ? "#ff4a15" : "#1b1b1b" }} />
              </button>
            )}
          </div>
          {customerSearchOpen && CLIENTS.length >= 5 && (
            <Search
              size="sm"
              autoFocus
              placeholder="Search by Customer name"
              value={clientQuery}
              onChange={(e) => setClientQuery(e.target.value)}
            />
          )}
        </div>
        <div className="flex flex-col">
          {visibleClients.length === 0 && (
            <p className="text-[13px] text-[#a0a0a0] py-3.5" style={FONT}>No customers found</p>
          )}
          {visibleClients.map((c, i) => {
            const checked = selectedClients.includes(c);
            return (
              <button
                key={c}
                onClick={() => toggleClient(c)}
                className={`w-full flex items-center justify-between py-3.5 text-left ${
                  i === visibleClients.length - 1 ? "" : "border-b border-[#f1f1f1]"
                }`}
              >
                <span className="text-[15px] text-[#1b1b1b]" style={FONT}>{c}</span>
                <span
                  className="size-6 rounded-md border flex items-center justify-center"
                  style={{ borderColor: checked ? "#ff4a15" : "rgba(160,160,160,0.5)", background: checked ? "#ff4a15" : "transparent" }}
                >
                  {checked && <CheckIcon style={{ fontSize: 16, color: "white" }} />}
                </span>
              </button>
            );
          })}
        </div>
      </BottomSheet>

      {/* Delete-draft confirmation (no ✕ — dismissed via the buttons/scrim) */}
      <BottomSheet
        open={!!confirmDeleteId}
        title="Delete Draft Invoice?"
        hideClose
        onClose={() => setConfirmDeleteId(null)}
        footer={
          <ButtonDock
            type="double"
            secondaryLabel="Cancel"
            primaryLabel="Delete"
            onSecondary={() => setConfirmDeleteId(null)}
            onPrimary={() => {
              if (confirmDeleteId) setDeletedIds((prev) => [...prev, confirmDeleteId]);
              setConfirmDeleteId(null);
            }}
            homeIndicator
          />
        }
      >
        <p className="text-[14px] leading-[1.45] text-[#808080]" style={FONT}>
          This draft invoice will be permanently deleted and cannot be recovered.
        </p>
      </BottomSheet>

      {/* Success toast on top */}
      <SendSuccessToast open={!!showSuccess} message={successMessage} subtext={successSubtext} onDone={onSuccessDone} />
    </div>
  );
}

export default SalesInvoiceList;
