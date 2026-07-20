import { useMemo, useState } from "react";
import { parse, format, addDays } from "date-fns";
import { ArrowUpDown, Check, ChevronDown, Search } from "lucide-react";
import { PageAppHeader } from "../../components/PageAppHeader";
import { SearchField } from "../../components/SearchField";
import { FilterIcon } from "../../components/FilterIcon";
import { BottomSheet } from "../../components/BottomSheet";
import { ButtonDock } from "../../components/ButtonDock";
import { PageHeader } from "../../ui/PageHeader";
import { HorizontalTabs } from "../../ui/HorizontalTabs";
import { InvoiceRow } from "../../ui/InvoiceRow";
import { Tile } from "../../ui/Tile";
import type { BadgeColor } from "../../ui/Badge";
import { CreditNoteDetailPage } from "./CreditNoteDetailPage";
import { CreditNoteForm } from "../credit-note-form/CreditNoteForm";
import type { CreditNotePayload, DraftLine } from "../../types";
import { CREDIT_NOTES } from "../../data/creditNotes";
import { RECEIVING_ACCOUNTS } from "../../data/receivingAccounts";
import { matchesIssueRange } from "../sales-invoice-list/filters";
import type { CNStatus, CreditNote } from "../../types";

import { FONT } from "../../lib/theme";

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

// DES-818 status → DS Badge color, matching the InvoiceRow palette used on the Sales Invoice List
// (Draft/Cancelled neutral, Applied success, Awaiting refund warning).
const STATUS_BADGE: Record<CNStatus, BadgeColor> = {
  Draft: "neutral",
  Applied: "success",
  "Awaiting refund": "warning",
  Cancelled: "neutral",
};

const money = (n: number) => `USD ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type StatusMatch = "all" | CNStatus;
const FILTERS: { label: string; match: StatusMatch }[] = [
  { label: "All", match: "all" },
  { label: "Draft", match: "Draft" },
  { label: "Applied", match: "Applied" },
  { label: "Awaiting refund", match: "Awaiting refund" },
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
  /** Dev QuickNav deep link: open this CN's detail page on mount (seed only — remount to change). */
  initialPreviewNo?: string | null;
  /** Sender company email (from Invoice Settings) — forwarded to the CN detail's send preview. */
  companyEmail?: string;
}

/**
 * Credit Notes List (DES-818) — the central register, a separate view from the Sales Invoice List but
 * sharing its layout: status chips (with counts), Sort/Filters row, and the same dashed card rows.
 * Statuses are Draft / Applied / Cancelled. Tap a row → the shared CreditNoteDetailPage, wired with the
 * same per-status actions as the invoice-detail flow (Draft: Edit/Delete · Applied: Send/Cancel · Cancelled: Preview).
 */
export function CreditNotesList({ onBack, onOpenInvoice, initialPreviewNo, companyEmail }: CreditNotesListProps) {
  const [active, setActive] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  // Customer search within the Filters sheet (DES-818 — "search by customer name").
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const visibleCustomers = CUSTOMERS.filter((c) => c.toLowerCase().includes(customerQuery.toLowerCase()));
  // Issue-date range filter (DES-818) — reuses the invoice list's matchesIssueRange helper.
  const [issueFrom, setIssueFrom] = useState("");
  const [issueTo, setIssueTo] = useState("");
  const activeFilterCount = selectedCustomers.length + (issueFrom || issueTo ? 1 : 0);
  // Local register state so Edit / Cancel / Delete / Send mutate in-session.
  const [notes, setNotes] = useState<CreditNote[]>(CREDIT_NOTES);
  const [previewNo, setPreviewNo] = useState<string | null>(initialPreviewNo ?? null);
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

  const toggleCustomer = (c: string) => setSelectedCustomers((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));

  return (
    <div
      className="relative rounded-[48px] overflow-hidden shadow-2xl flex flex-col"
      style={{ width: 375, height: 812, background: "linear-gradient(180deg, var(--bg-beige-primary) 0%, var(--bg-beige-primary) 100px, #ffffff 150px)" }}
    >
      {/* Thin horizontal scrollbar for the status tab row (the DS scroller is the wrapper's child) */}
      <style>{`
        .tabs-wrap > div{scrollbar-width:thin;scrollbar-color:rgba(160,160,160,0.45) transparent;}
        .tabs-wrap > div::-webkit-scrollbar{height:2px;}
        .tabs-wrap > div::-webkit-scrollbar-track{background:transparent;margin:0 0 0 16px;}
        .tabs-wrap > div::-webkit-scrollbar-thumb{background:rgba(160,160,160,0.45);border-radius:9999px;}
      `}</style>

      <div
        className="flex-1 overflow-y-auto thin-scrollbar"
        onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
      >
        <PageAppHeader scrolled={scrolled}>
          {/* DS PageHeader (center) — same style as the Sales Invoice List. */}
          <PageHeader type="center" title="Credit Notes" onBack={onBack} showSearch={false} />

          {/* Status filter tabs — DS HorizontalTabs (button style), horizontally scrollable. Sits
              directly in the header's beige→white gradient panel, no separate box/shadow. Right
              padding is intentionally omitted (Figma node 1332-18605): the row bleeds to the frame's
              edge so an overflowing tab clips flush against it, signalling more content to scroll to. */}
          <div className="tabs-wrap shrink-0 pl-4 pt-4 pb-3 relative z-10">
            <HorizontalTabs
              variant="button"
              tabs={FILTERS.map((f, i) => `${f.label} (${counts[i]})`)}
              activeIndex={active}
              onChange={setActive}
            />
          </div>

          {/* Sort / Filter row — same style as the Sales Invoice List. The Sort button label
              reflects the active sort (e.g. "Credit Issue Date: Newest") once one is applied. */}
          <div className="shrink-0 flex items-center justify-between bg-white pb-2 px-4 border-b border-[var(--border-neutral-primary)]">
            <button onClick={() => setSortOpen(true)} className="flex items-center gap-1" style={FONT}>
              <ArrowUpDown size={16} strokeWidth={1.67} color="var(--text-primary)" />
              <span className="body-sm-medium text-[var(--text-primary)]">{SORT_OPTIONS.find((o) => o.key === sortKey)?.label ?? "Sort by"}</span>
              <ChevronDown size={16} strokeWidth={1.67} color="var(--text-primary)" />
            </button>
            <button onClick={() => setFilterOpen(true)} className="relative flex items-center justify-center p-1 -m-1" aria-label="Filters">
              <FilterIcon size={20} color="var(--text-primary)" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-1 rounded-full bg-[var(--bg-brand-primary)] text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </PageAppHeader>

        {/* Credit notes list — same DS InvoiceRow used by the Sales Invoice List: a flat list on the
            white page with a divider between rows (no per-row card/pill). */}
        <div className="bg-white px-4 pb-28 flex flex-col">
        {list.length === 0 ? (
          <p className="text-center text-[13px] text-[var(--text-placeholder)] pt-16" style={FONT}>No credit notes found</p>
        ) : (
          list.map((cn, i) => (
            <InvoiceRow
              key={cn.no}
              size="md"
              title={cn.customer}
              invoiceNo={cn.no}
              status={cn.status}
              statusColor={STATUS_BADGE[cn.status]}
              statusCaption={`Created on ${cn.date}`}
              amount={money(cn.original)}
              lastItem={i === list.length - 1}
              onClick={() => setPreview(cn)}
            />
          ))
        )}
        </div>
      </div>

      {/* Sort sheet — Figma "Sales Invoice · List" Sort by (node 1345-40965): DS Tile rows,
          selected = brand border + check. */}
      <BottomSheet open={sortOpen} title="Sort by" onClose={() => setSortOpen(false)}>
        <div className="flex flex-col gap-2">
          {SORT_OPTIONS.map((o) => (
            <Tile
              key={o.key}
              title={o.label}
              selected={o.key === sortKey}
              trailing={o.key === sortKey ? "check" : "none"}
              onClick={() => { setSortKey(o.key); setSortOpen(false); }}
            />
          ))}
        </div>
      </BottomSheet>

      {/* Filters sheet — same interaction as the Sales Invoice List: a Reset + "Show N credit notes"
          dock appears once any filter is active. */}
      <BottomSheet
        open={filterOpen}
        title="Filters"
        onClose={() => setFilterOpen(false)}
        footer={
          activeFilterCount === 0 ? undefined : (
            <ButtonDock
              type="double"
              secondaryLabel="Reset"
              primaryLabel={`Show ${list.length} ${list.length === 1 ? "credit note" : "credit notes"}`}
              onSecondary={() => { setSelectedCustomers([]); setIssueFrom(""); setIssueTo(""); setCustomerQuery(""); }}
              onPrimary={() => setFilterOpen(false)}
              homeIndicator
            />
          )
        }
      >
        <div className="flex flex-col gap-2">
          {/* CN issue date range (DES-818) — same native date inputs as the Sales Invoice List filter. */}
          <p className="text-[12px] font-bold uppercase tracking-wide text-[var(--text-placeholder)]" style={FONT}>Credit Issue Date</p>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              {!issueFrom && (
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-[var(--text-placeholder)]" style={FONT}>Start date</span>
              )}
              <input
                type="date"
                value={issueFrom}
                max={issueTo || undefined}
                onChange={(e) => setIssueFrom(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-[rgba(160,160,160,0.4)] text-[14px] bg-white"
                style={{ ...FONT, color: issueFrom ? "var(--text-primary)" : "transparent" }}
              />
            </div>
            <div className="relative flex-1">
              {!issueTo && (
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-[var(--text-placeholder)]" style={FONT}>End date</span>
              )}
              <input
                type="date"
                value={issueTo}
                min={issueFrom || undefined}
                onChange={(e) => setIssueTo(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-[rgba(160,160,160,0.4)] text-[14px] bg-white"
                style={{ ...FONT, color: issueTo ? "var(--text-primary)" : "transparent" }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-[12px] font-bold uppercase tracking-wide text-[var(--text-placeholder)]" style={FONT}>Customer</p>
            {CUSTOMERS.length >= 5 && (
              <button
                type="button"
                aria-label={customerSearchOpen ? "Hide customer search" : "Search customers"}
                onClick={() => { if (customerSearchOpen) setCustomerQuery(""); setCustomerSearchOpen((v) => !v); }}
                className="p-1 -m-1"
              >
                <Search size={18} strokeWidth={1.67} color={customerSearchOpen ? "var(--text-brand)" : "var(--text-primary)"} />
              </button>
            )}
          </div>
          {customerSearchOpen && (
            <SearchField
              size="sm"
              autoFocus
              placeholder="Search by Customer name"
              value={customerQuery}
              onChange={(e) => setCustomerQuery(e.target.value)}
            />
          )}
          {visibleCustomers.length === 0 && (
            <p className="text-[13px] text-[var(--text-placeholder)] py-3" style={FONT}>No customers found</p>
          )}
          {visibleCustomers.map((c) => {
            const on = selectedCustomers.includes(c);
            return (
              <button
                key={c}
                onClick={() => toggleCustomer(c)}
                className="w-full flex items-center justify-between py-3 text-left border-b border-[#f1f1f1]"
              >
                <span className="text-[15px]" style={{ ...FONT, color: "var(--text-primary)" }}>{c}</span>
                <span className="size-6 rounded-md border flex items-center justify-center" style={{ borderColor: on ? "var(--text-brand)" : "rgba(160,160,160,0.5)", background: on ? "var(--bg-brand-primary)" : "transparent" }}>
                  {on && <Check size={16} strokeWidth={1.67} color="white" />}
                </span>
              </button>
            );
          })}
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
              companyEmail={companyEmail}
              issueDateLabel={preview.date}
              dueDateLabel={dueLabelFor(preview.date)}
              currency="USD"
              total={preview.original}
              invoiceTotal={preview.invoiceTotal}
              receivingAccount={(() => { const a = RECEIVING_ACCOUNTS.find((x) => x.primary) ?? RECEIVING_ACCOUNTS[0]; return { name: a.name, number: a.number, primary: !!a.primary }; })()}
              // Real credited line items from the register; fall back to a single synthesized line.
              lines={preview.lines ?? [{ name: "Credited amount", amount: preview.original }]}
              reason={preview.reason}
              // The Credit Notes List always shows the normal credit-note detail (Credit to / Credited items).
              // Refund-specific framing belongs to the invoice-detail flow (DES-720/721), not here.
              kind="cancellation"
              // List register uses the short "Awaiting refund" pill; the CN detail spells it out
              // ("Awaiting refund by accountant") to match the invoice-detail flow.
              status={preview.status === "Awaiting refund" ? "Awaiting refund by accountant" : preview.status}
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
