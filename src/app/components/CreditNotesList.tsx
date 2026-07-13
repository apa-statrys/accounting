import { useMemo, useState } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ImportExportIcon from "@mui/icons-material/ImportExport";
import TuneIcon from "@mui/icons-material/Tune";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CheckIcon from "@mui/icons-material/Check";
import StatusBar from "./StatusBar";
import { SheetHeader, HeaderIconButton } from "./SheetHeader";
import { BottomSheet } from "./BottomSheet";
import { CreditNoteDetailPage } from "./CreditNoteDetailPage";
import { CreditNoteForm } from "./credit-note-form/CreditNoteForm";
import type { CreditNotePayload, DraftLine } from "../types";
import { CREDIT_NOTES } from "../data/creditNotes";
import { RECEIVING_ACCOUNTS } from "../data/receivingAccounts";
import type { CNStatus, CreditNote } from "../types";

import { FONT } from "../lib/theme";

// DES-818 status palette — Draft (grey) / Applied (green) / Cancelled (muted grey). Matches the chip
// palette on CreditNoteDetailPage so the list and detail read the same.
const STATUS_PILL: Record<CNStatus, { bg: string; border: string; text: string }> = {
  Draft: { bg: "#f2f4f7", border: "#e4e7ec", text: "#475467" },
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

type SortKey = "newest" | "oldest" | "number" | "amount-desc" | "amount-asc";
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Issue Date: Newest" },
  { key: "oldest", label: "Issue Date: Oldest" },
  { key: "number", label: "CN Number" },
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
    const sorted = [...rows];
    switch (sortKey) {
      case "oldest": return sorted.reverse();
      case "number": return sorted.sort((a, b) => b.no.localeCompare(a.no)); // CN number descending (DES-818)
      case "amount-desc": return sorted.sort((a, b) => b.original - a.original);
      case "amount-asc": return sorted.sort((a, b) => a.original - b.original);
      default: return sorted; // newest = authored order
    }
  }, [active, sortKey, selectedCustomers, notes]);

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
          {selectedCustomers.length > 0 && (
            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#ff4a15] text-white text-[11px] font-bold flex items-center justify-center">{selectedCustomers.length}</span>
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
                className="shrink-0 w-full flex items-center gap-2.5 border border-dashed rounded-xl p-[17px] text-left bg-[#faf9f4]"
                style={{ borderColor: "rgba(160,160,160,0.2)" }}
              >
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <p className="text-[16px] font-medium leading-[0.9] tracking-[-0.8px] truncate text-[#101828]" style={FONT}>{cn.customer}</p>
                  {/* CN number · related invoice · issue date (DES-818 columns) */}
                  <p className="text-[12px] font-normal leading-[1.3] whitespace-nowrap truncate text-[#808080]" style={FONT}>
                    <span style={{ fontWeight: 500 }}>{cn.no}</span> · {cn.invoiceNo} · {cn.date}
                  </p>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <p className="text-[16px] font-bold leading-[1.3] text-[#101828]" style={FONT}>{money(cn.original)}</p>
                  <span className="px-2 py-0.5 rounded-full border text-[10px] font-bold leading-[15px] whitespace-nowrap" style={{ ...FONT, background: s.bg, borderColor: s.border, color: s.text }}>{cn.status}</span>
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
          <p className="text-[12px] font-bold uppercase tracking-wide text-[#a0a0a0]" style={FONT}>Customer</p>
          {CUSTOMERS.map((c) => {
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
