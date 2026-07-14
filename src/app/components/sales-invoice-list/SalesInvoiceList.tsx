import { useEffect, useMemo, useRef, useState } from "react";
import { parse, format, addDays } from "date-fns";
import { FilePlus } from "lucide-react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ImportExportIcon from "@mui/icons-material/ImportExport";
import TuneIcon from "@mui/icons-material/Tune";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CheckIcon from "@mui/icons-material/Check";
import SearchIcon from "@mui/icons-material/Search";
import StatusBar from "../StatusBar";
import { SheetHeader, HeaderIconButton } from "../SheetHeader";
import { SendSuccessToast } from "../SendSuccessToast";
import { CreateInvoiceSheet } from "../CreateInvoiceSheet";
import { BottomSheet } from "../BottomSheet";
import { ButtonDock } from "../ButtonDock";
import { Search } from "../Search";
import { CreditNoteDetailPage } from "../CreditNoteDetailPage";
import { CREDIT_NOTES } from "../../data/creditNotes";
import { INVOICES } from "../../data/invoices";
import { SHOW_RECURRING } from "../../lib/flags";
import { FONT } from "../../lib/theme";
import type { CreditNote, DetailStatus, Invoice, Status } from "../../types";
import { InvoiceCard } from "./InvoiceCard";
import {
  CLIENTS,
  DUE_FILTERS,
  FILTERS,
  REFUND_FILTERS,
  SORT_OPTIONS,
  TODAY_ISO,
  amountValue,
  defaultSortFor,
  effectiveStatus,
  matchStatus,
  matchesDue,
  matchesIssueRange,
  matchesRefund,
  sortInvoices,
  sortKeysFor,
  type DueFilter,
  type RefundFilter,
  type SortKey,
  type StatusMatch,
} from "./filters";

interface SalesInvoiceListProps {
  showSuccess?: boolean;
  /** Toast title — short, varies by action. */
  successMessage?: string;
  /** Toast muted subline (e.g. "Marked as sent"). */
  successSubtext?: string;
  onSuccessDone?: () => void;
  /** A just-created/saved invoice to surface + temporarily highlight at the top of the list. */
  recent?: { client: string; amount: string; status: Status; meta: string; recurring?: boolean } | null;
  onBack?: () => void;
  /** Open an invoice's detail page. */
  onOpenInvoice?: (inv: { number: string; client: string; status: DetailStatus; origin: "created" | "uploaded"; cnNo?: string; cnAmount?: number; cnSent?: boolean; recurring?: boolean }) => void;
  onManual?: () => void;
  onUpload?: () => void;
  /** Start a recurring invoice series (DES-782). */
  onRecurring?: () => void;
  /** Preset the status chip when opened from a dashboard tile (e.g. "Paid"). */
  initialStatus?: StatusMatch;
  /** Preset the due-date quick filter when opened from elsewhere (e.g. "week"). */
  initialDue?: DueFilter;
  /** Refunds completed in-session (DES-720), keyed by invoice number → "partial" | "full". */
  refundState?: Record<string, "partial" | "full">;
}

export function SalesInvoiceList({ showSuccess, successMessage, successSubtext, onSuccessDone, recent, onBack, onOpenInvoice, onManual, onUpload, onRecurring, initialStatus, initialDue, refundState }: SalesInvoiceListProps) {
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
    ? { id: "recent-new", client: recent.client, meta: recent.meta, amount: recent.amount, status: recent.status, date: TODAY_ISO, recurring: recent.recurring }
    : null;
  // Recurring invoices (DES-782) are gated off for prod — drop them from the list when hidden.
  const baseInvoices = useMemo(() => (SHOW_RECURRING ? INVOICES : INVOICES.filter((i) => !i.recurring)), []);
  const allRows = useMemo(() => (recentRow ? [recentRow, ...baseInvoices] : baseInvoices), [recentRow?.client, recentRow?.amount, recentRow?.status, recentRow?.recurring, baseInvoices]);
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
    setCnPreview(found ?? { no: inv.cnNo, customer: inv.client, email: "", invoiceNo: inv.id.replace(/[a-z]$/, ""), original: amt, invoiceTotal: amountValue(inv.amount), applied: amt, kind: "cancellation", status: "Applied", date: "", reason: "" });
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
              onClick={() => onOpenInvoice?.({ number: inv.id.replace(/[a-z]$/, ""), client: inv.client, status: effectiveStatus(inv), origin: inv.origin ?? "created", cnNo: inv.cnNo, cnAmount: inv.cnAmount, cnSent: inv.cnSent, recurring: inv.recurring })}
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

      {/* CN badge → the linked credit note's detail (DES-818 AC4). Always the normal credit-note detail
          (Credit to / Credited items), consistent with the Credit Notes List — refund-specific framing
          lives in the invoice-detail flow (DES-720/721), reachable via Related Invoice. */}
      {cnPreview && (() => {
        return (
          <div className="absolute inset-0 z-50">
            <CreditNoteDetailPage
              creditNoteNo={cnPreview.no}
              invoiceNo={cnPreview.invoiceNo}
              customerName={cnPreview.customer}
              customerEmail={cnPreview.email}
              issueDateLabel={cnPreview.date}
              dueDateLabel={(() => {
                // Register has only the issue date — approximate the due date (issue + 30 days).
                if (!cnPreview.date) return undefined;
                const p = parse(cnPreview.date, "d MMM yyyy", new Date(2026, 0, 1));
                return isNaN(p.getTime()) ? undefined : format(addDays(p, 30), "d MMM yyyy");
              })()}
              currency="USD"
              total={cnPreview.original}
              invoiceTotal={cnPreviewInvoiceTotal}
              lines={cnPreview.lines ?? [{ name: "Credited amount", amount: cnPreview.original }]}
              reason={cnPreview.reason}
              kind="cancellation"
              status={cnPreview.status}
              sent={cnPreviewSent}
              onBack={() => setCnPreview(null)}
              onViewInvoice={() => {
                const inv = allInvoices.find((x) => x.id.replace(/[a-z]$/, "") === cnPreview.invoiceNo);
                if (inv) onOpenInvoice?.({ number: cnPreview.invoiceNo, client: inv.client, status: effectiveStatus(inv), origin: inv.origin ?? "created", cnNo: inv.cnNo, cnAmount: inv.cnAmount, cnSent: inv.cnSent });
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
