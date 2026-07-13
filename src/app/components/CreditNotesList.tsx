import { useMemo, useState } from "react";
import { parse, format, addDays } from "date-fns";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ImportExportIcon from "@mui/icons-material/ImportExport";
import TuneIcon from "@mui/icons-material/Tune";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CheckIcon from "@mui/icons-material/Check";
import SearchIcon from "@mui/icons-material/Search";
import StatusBar from "./StatusBar";
import { Search } from "./Search";
import { SheetHeader, HeaderIconButton } from "./SheetHeader";
import { BottomSheet } from "./BottomSheet";
import { CreditNoteDetailPage } from "./CreditNoteDetailPage";
import { CreditNoteForm } from "./credit-note-form/CreditNoteForm";
import type { CreditNotePayload, DraftLine } from "../types";
import { CREDIT_NOTES } from "../data/creditNotes";
import { RECEIVING_ACCOUNTS } from "../data/receivingAccounts";
import { matchesIssueRange } from "./sales-invoice-list/filters";
import type { CNStatus, CreditNote } from "../types";

import { FONT } from "../lib/theme";

// The register stores display dates ("22 Jun 2026"); convert to ISO so the shared invoice-list
// date-range filter (matchesIssueRange, which expects YYYY-MM-DD) can be reused as-is.
const toISO = (d: string): string => {
  if (!d) return "";
  const parsed = parse(d, "d MMM yyyy", new Date(2026, 0, 1));
  return isNaN(parsed.getTime()) ? "" : format(parsed, "yyyy-MM-dd");
};

// The register carries only the issue date; approximate the CN due date (issue + 30 days) for the detail.
const dueLabelFor = (d: string): string | undefined => {
  if (!d) return undefined;
  const parsed = parse(d, "d MMM yyyy", new Date(2026, 0, 1));
  return isNaN(parsed.getTime()) ? undefined : format(addDays(parsed, 30), "d MMM yyyy");
};

// DES-818 status palette — Draft (grey) / Applied (green) / Cancelled (muted grey). Matches the chip
// palette on CreditNoteDetailPage so the list and detail read the same.
const STATUS_PILL: Record<CNStatus, { bg: string; border: string; text: string }> = {
  // Draft = the neutral beige pill from Figma (node 1312-7899).
  Draft: { bg: "#faf9f4", border: "rgba(160,160,160,0.2)", text: "#808080" },
  Applied: { bg: "#ecfdf3", border: "#abefc6", text: "#067647" },
  Cancelled: { bg: "#f3f3f3", border: "rgba(160,160,160,0.35)", text: "#9a9a9a" },
};

const money = (n: number) => `USD ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type StatusMatch = "all" | CNStatus;
const FILTERS: { label: string; match: StatusMatch }[] = [
  { label: "All", match: "all" },
  { label: "Draft", match: "Draft" },
  { label: "Applied", match: "Applied" },
  { label: "Cancelled", match: "Cancelled" },
];

type SortKey = "newest" | "oldest" | "amount-desc" | "amount-asc";
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Credit Issue Date: Newest" },
  { key: "oldest", label: "Credit Issue Date: Oldest" },
  { key: "amount-desc", label: "Amount: High to Low" },
  { key: "amount-asc", label: "Amount: Low to High" },
];

const CUSTOMERS = Array.from(new Set(CREDIT_NOTES.map((c) => c.customer)));

interface CreditNotesListProps {
  onBack?: () => void;
  /** DES-818 AC1 — open the CN's related invoice (renders the arrow on the detail's Related Invoice row). */
  onOpenInvoice?: (invoiceNo: string) => void;
  /** Accepted for call-site compatibility; the list no longer surfaces refund lifecycle states (DES-818
   *  is Draft/Applied/Cancelled only — refund tracking lives on the invoice-detail side, DES-720/721). */
  refundState?: Record<string, "partial" | "full">;
}

/**
 * Credit Notes List (DES-818) — the central register, a separate view from the Sales Invoice List but
 * sharing its layout: status chips (with counts), Sort/Filters row, and the same dashed card rows.
 * Statuses are Draft / Applied / Cancelled. Tap a row → the shared CreditNoteDetailPage, wired with the
 * same per-status actions as the invoice-detail flow (Draft: Edit/Delete · Applied: Send/Cancel · Cancelled: Preview).
 */
export function CreditNotesList({ onBack, onOpenInvoice }: CreditNotesListProps) {
  const [active, setActive] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  // Customer search within the Filters sheet (DES-818 — "search by customer name").
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const visibleCustomers = CUSTOMERS.filter((c) => c.toLowerCase().includes(customerQuery.toLowerCase()));
  // Issue-date range filter (DES-818) — reuses the invoice list's matchesIssueRange helper.
  const [issueFrom, setIssueFrom] = useState("");
  const [issueTo, setIssueTo] = useState("");
  const activeFilterCount = selectedCustomers.length + (issueFrom || issueTo ? 1 : 0);
  // Local register state so Edit / Cancel / Delete / Send mutate in-session.
  const [notes, setNotes] = useState<CreditNote[]>(CREDIT_NOTES);
  const [previewNo, setPreviewNo] = useState<string | null>(null);
  const [editingNo, setEditingNo] = useState<string | null>(null);
  const preview = notes.find((n) => n.no === previewNo) ?? null;
  const setPreview = (cn: CreditNote | null) => setPreviewNo(cn?.no ?? null);

  // Save edits to a Draft register CN (DES-719 AC4 — only Drafts are editable). Updates the amount/reason;
  // the note stays a Draft (confirming/applying happens in the invoice-detail flow, not the list).
  const saveFromList = (no: string, p: CreditNotePayload) =>
    setNotes((prev) => prev.map((c) => (c.no === no ? { ...c, original: p.amount, reason: p.reason, applied: 0 } : c)));

  // DES-818 actions: delete a Draft (row removed, number retired) · cancel an Applied note (full reversal → Cancelled).
  const deleteFromList = (no: string) => { setNotes((prev) => prev.filter((c) => c.no !== no)); setPreview(null); };
  const cancelFromList = (no: string) => setNotes((prev) => prev.map((c) => (c.no === no ? { ...c, status: "Cancelled", applied: 0 } : c)));

  const counts = useMemo(
    () => FILTERS.map((f) => (f.match === "all" ? notes.length : notes.filter((c) => c.status === f.match).length)),
    [notes]
  );

  const list = useMemo(() => {
    const match = FILTERS[active].match;
    let rows = notes.filter((c) => (match === "all" ? true : c.status === match));
    if (selectedCustomers.length) rows = rows.filter((c) => selectedCustomers.includes(c.customer));
    if (issueFrom || issueTo) rows = rows.filter((c) => matchesIssueRange(toISO(c.date), issueFrom, issueTo));
    const sorted = [...rows];
    switch (sortKey) {
      case "oldest": return sorted.reverse();
      case "amount-desc": return sorted.sort((a, b) => b.original - a.original);
      case "amount-asc": return sorted.sort((a, b) => a.original - b.original);
      default: return sorted; // newest = authored order
    }
  }, [active, sortKey, selectedCustomers, issueFrom, issueTo, notes]);

  const sortLabel = SORT_OPTIONS.find((s) => s.key === sortKey)?.label ?? "";
  const toggleCustomer = (c: string) => setSelectedCustomers((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));

  return (
    <div className="relative bg-[#f9f5ea] rounded-[48px] overflow-hidden shadow-2xl flex flex-col" style={{ width: 375, height: 812 }}>
      <style>{`
        .chip-scroll{scrollbar-width:thin;scrollbar-color:rgba(160,160,160,0.45) transparent;}
        .chip-scroll::-webkit-scrollbar{height:2px;}
        .chip-scroll::-webkit-scrollbar-track{background:transparent;margin:0 16px;}
        .chip-scroll::-webkit-scrollbar-thumb{background:rgba(160,160,160,0.45);border-radius:9999px;}
      `}</style>

      <StatusBar />

      <SheetHeader
        title="Credit Notes"
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
              onClick={() => setActive(i)}
              className={`shrink-0 h-[30px] px-3 rounded-full whitespace-nowrap link-upper-sm ${isActive ? "bg-[#ff4a15] text-white" : "bg-white text-[#1b1b1b]"}`}
            >
              {f.label} ( {counts[i]} )
            </button>
          );
        })}
      </div>

      {/* Sort / Filter row */}
      <div className="shrink-0 flex items-center justify-between bg-white px-4 py-2.5 border-b border-[#f1f1f1]">
        <button onClick={() => setSortOpen(true)} className="flex items-center gap-1" style={FONT}>
          <ImportExportIcon style={{ fontSize: 18, color: "#1b1b1b" }} />
          <span className="text-[13px] text-[#1b1b1b]">Sort: <span className="font-medium">{sortLabel}</span></span>
          <KeyboardArrowDownIcon style={{ fontSize: 16, color: "#808080" }} />
        </button>
        <button onClick={() => setFilterOpen(true)} className="flex items-center gap-1.5" style={FONT}>
          <TuneIcon style={{ fontSize: 18, color: "#1b1b1b" }} />
          <span className="text-[13px] font-medium text-[#1b1b1b]">Filters</span>
          {activeFilterCount > 0 && (
            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#ff4a15] text-white text-[11px] font-bold flex items-center justify-center">{activeFilterCount}</span>
          )}
        </button>
      </div>

      {/* Credit notes list */}
      <div className="flex-1 overflow-y-auto thin-scrollbar bg-white px-4 pt-4 pb-28 flex flex-col gap-2">
        {list.length === 0 ? (
          <p className="text-center text-[13px] text-[#a0a0a0] pt-16" style={FONT}>No credit notes found</p>
        ) : (
          list.map((cn) => {
            const s = STATUS_PILL[cn.status];
            return (
              <button
                key={cn.no}
                onClick={() => setPreview(cn)}
                className="shrink-0 w-full flex flex-col gap-2 border border-dashed rounded-2xl p-4 text-left bg-white transition-shadow hover:shadow-[0_4px_12px_rgba(16,24,40,0.08)]"
                style={{ borderColor: "rgba(160,160,160,0.2)" }}
              >
                {/* Card layout per Figma 1312-7899 — customer + CN number + "Created on <date>" on the left,
                    amount over the status pill on the right. Only the status pill differs by status. */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-medium leading-[1.2] tracking-[-0.3px] truncate text-[#101828]" style={FONT}>{cn.customer}</p>
                    <div className="flex flex-col gap-0.5 mt-1">
                      <p className="text-[12px] font-medium leading-[1.2] truncate" style={{ ...FONT, color: "#1b1b1b" }}>{cn.no}</p>
                      <p className="text-[12px] leading-[1.2] truncate" style={{ ...FONT, color: "#808080" }}>Created on {cn.date}</p>
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    <p className="text-[16px] font-bold leading-[1.2] text-[#101828] whitespace-nowrap" style={FONT}>{money(cn.original)}</p>
                    <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-bold leading-[15px] whitespace-nowrap" style={{ ...FONT, background: s.bg, borderColor: s.border, color: s.text }}>{cn.status}</span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Sort sheet */}
      <BottomSheet open={sortOpen} title="Sort by" onClose={() => setSortOpen(false)}>
        <div className="flex flex-col">
          {SORT_OPTIONS.map((o) => (
            <button
              key={o.key}
              onClick={() => { setSortKey(o.key); setSortOpen(false); }}
              className="w-full flex items-center justify-between py-3.5 text-left border-b border-[#f1f1f1]"
            >
              <span className="text-[15px]" style={{ ...FONT, color: "#1b1b1b" }}>{o.label}</span>
              {sortKey === o.key && <CheckIcon style={{ fontSize: 20, color: "#ff4a15" }} />}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Filters sheet — by customer */}
      <BottomSheet open={filterOpen} title="Filters" onClose={() => setFilterOpen(false)}>
        <div className="flex flex-col gap-2">
          {/* CN issue date range (DES-818) — same native date inputs as the Sales Invoice List filter. */}
          <p className="text-[12px] font-bold uppercase tracking-wide text-[#a0a0a0]" style={FONT}>Credit Issue Date</p>
          <div className="flex items-center gap-3">
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
          {(issueFrom || issueTo) && (
            <button onClick={() => { setIssueFrom(""); setIssueTo(""); }} className="self-start text-[13px] font-medium text-[#ff4a15] pt-1" style={FONT}>Clear dates</button>
          )}

          <div className="flex items-center justify-between mt-4">
            <p className="text-[12px] font-bold uppercase tracking-wide text-[#a0a0a0]" style={FONT}>Customer</p>
            {CUSTOMERS.length >= 5 && (
              <button
                type="button"
                aria-label={customerSearchOpen ? "Hide customer search" : "Search customers"}
                onClick={() => { if (customerSearchOpen) setCustomerQuery(""); setCustomerSearchOpen((v) => !v); }}
                className="p-1 -m-1"
              >
                <SearchIcon style={{ fontSize: 18, color: customerSearchOpen ? "#ff4a15" : "#1b1b1b" }} />
              </button>
            )}
          </div>
          {customerSearchOpen && (
            <Search
              size="sm"
              autoFocus
              placeholder="Search by Customer name"
              value={customerQuery}
              onChange={(e) => setCustomerQuery(e.target.value)}
            />
          )}
          {visibleCustomers.length === 0 && (
            <p className="text-[13px] text-[#a0a0a0] py-3" style={FONT}>No customers found</p>
          )}
          {visibleCustomers.map((c) => {
            const on = selectedCustomers.includes(c);
            return (
              <button
                key={c}
                onClick={() => toggleCustomer(c)}
                className="w-full flex items-center justify-between py-3 text-left border-b border-[#f1f1f1]"
              >
                <span className="text-[15px]" style={{ ...FONT, color: "#1b1b1b" }}>{c}</span>
                <span className="size-5 rounded-md border flex items-center justify-center" style={{ background: on ? "#ff4a15" : "#fff", borderColor: on ? "#ff4a15" : "rgba(160,160,160,0.5)" }}>
                  {on && <CheckIcon style={{ fontSize: 15, color: "#fff" }} />}
                </span>
              </button>
            );
          })}
          {selectedCustomers.length > 0 && (
            <button onClick={() => setSelectedCustomers([])} className="self-start text-[13px] font-medium text-[#ff4a15] pt-1" style={FONT}>Clear customers</button>
          )}
        </div>
      </BottomSheet>

      {/* Shared CN detail (same component + behaviour as the invoice-detail flow). Wired per DES-818
          status: Draft → Edit (resume the form) + Delete (⋯) · Applied → Send + Cancel (⋯) · Cancelled →
          Preview only. Sending persists to the register. */}
      {preview && (() => {
        const isDraft = preview.status === "Draft";
        const isApplied = preview.status === "Applied";
        return (
          <div className="absolute inset-0 z-50">
            <CreditNoteDetailPage
              creditNoteNo={preview.no}
              invoiceNo={preview.invoiceNo}
              customerName={preview.customer}
              customerEmail={preview.email}
              issueDateLabel={preview.date}
              dueDateLabel={dueLabelFor(preview.date)}
              currency="USD"
              total={preview.original}
              invoiceTotal={preview.invoiceTotal}
              receivingAccount={(() => { const a = RECEIVING_ACCOUNTS.find((x) => x.primary) ?? RECEIVING_ACCOUNTS[0]; return { name: a.name, number: a.number, primary: !!a.primary }; })()}
              // Register carries no line items — synthesize one so the Credited items card shows here too.
              lines={[{ name: "Credited amount", amount: preview.original, original: preview.invoiceTotal }]}
              reason={preview.reason}
              // The Credit Notes List always shows the normal credit-note detail (Credit to / Credited items).
              // Refund-specific framing belongs to the invoice-detail flow (DES-720/721), not here.
              kind="cancellation"
              status={preview.status}
              sent={preview.sent}
              onBack={() => setPreview(null)}
              // Related Invoice row → open that invoice's detail (shows the chevron arrow).
              onViewInvoice={onOpenInvoice ? () => onOpenInvoice(preview.invoiceNo) : undefined}
              // Draft → Edit reopens the form. Applied/Cancelled are locked (no edit).
              onEdit={isDraft ? () => setEditingNo(preview.no) : undefined}
              // Draft → Delete (row removed); Applied → Cancel (full reversal → Cancelled). Cancelled → none.
              onCancel={isDraft ? () => deleteFromList(preview.no) : isApplied ? () => cancelFromList(preview.no) : undefined}
              onSent={() => setNotes((prev) => prev.map((c) => (c.no === preview.no ? { ...c, sent: true } : c)))}
            />
          </div>
        );
      })()}

      {/* Edit a register credit note (DES-719 AC4) — the register carries no line items, so the form opens
          with a single synthesized "Credited amount" line seeded from the note's current amount. */}
      {editingNo && (() => {
        const cn = notes.find((n) => n.no === editingNo);
        if (!cn) return null;
        const seedLine: DraftLine = { id: "cn-0", name: "Credited amount", unit: "service", qty: 1, unitPrice: String(cn.original), maxQty: 1, origAmount: cn.original };
        return (
          <CreditNoteForm
            mode="edit"
            creditNoteNo={cn.no}
            invoiceNo={cn.invoiceNo}
            customerName={cn.customer}
            customerEmail={cn.email}
            currency="USD"
            items={[{ name: "Credited amount", qty: 1, unit: "service", unitPrice: cn.original, amount: cn.original }]}
            invoiceTotal={cn.invoiceTotal}
            alreadyCredited={0}
            outstanding={cn.invoiceTotal}
            initial={{ name: cn.customer, email: cn.email, reason: cn.reason, reasonNote: "", issueDate: new Date(2026, 5, 26), lines: [seedLine] }}
            onBack={() => setEditingNo(null)}
            onCreate={(p) => { saveFromList(cn.no, p); setEditingNo(null); }}
          />
        );
      })()}
    </div>
  );
}

export default CreditNotesList;
