import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { parse, parseISO, format, addDays } from "date-fns";
import { ArrowUpDown, ChevronDown, Search, X } from "lucide-react";
import { PageAppHeader } from "../../components/PageAppHeader";
import { FilterIcon } from "../../components/FilterIcon";
import { BottomSheet } from "../../components/BottomSheet";
import { ButtonDock } from "../../components/ButtonDock";
import { Keyboard } from "../../components/Keyboard";
import { Calendar } from "../../components/Calendar";
import { PageHeader } from "../../ui/PageHeader";
import { HorizontalTabs } from "../../ui/HorizontalTabs";
import { InvoiceRow } from "../../ui/InvoiceRow";
import { Tile } from "../../ui/Tile";
import { Avatar } from "../../ui/Avatar";
import { Checkbox } from "../../ui/Checkbox";
import { TextField } from "../../ui/TextField";
import { Badge, type BadgeColor } from "../../ui/Badge";
import { CreditNoteDetailPage } from "./CreditNoteDetailPage";
import { LockedPeriodDialog } from "../locked-period/LockedPeriodDialog";
import { CreditNoteForm } from "../credit-note-form/CreditNoteForm";
import { Toast } from "../../components/Toast";
import type { CreditNotePayload, DraftLine } from "../../types";
import { CREDIT_NOTES } from "../../data/creditNotes";
import { RECEIVING_ACCOUNTS } from "../../data/receivingAccounts";
import { matchesIssueRange } from "../sales-invoice-list/filters";
import type { CNStatus, CreditNote, NewFlag } from "../../types";

import { money } from "../../lib/format";
import { FONT, PAGE_PUSH_TRANSITION, avatarTint, initials } from "../../lib/theme";
import { pinNew } from "../../lib/pinNew";

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
// (Draft/Cancelled neutral, Applied success, Awaiting refund warning, Refunded info).
const STATUS_BADGE: Record<CNStatus, BadgeColor> = {
  Draft: "neutral",
  Applied: "success",
  "Awaiting refund": "warning",
  Refunded: "info",
  Cancelled: "neutral",
};

type StatusMatch = "all" | CNStatus;
const FILTERS: { label: string; match: StatusMatch }[] = [
  { label: "All", match: "all" },
  { label: "Draft", match: "Draft" },
  { label: "Applied", match: "Applied" },
  { label: "Awaiting refund", match: "Awaiting refund" },
  { label: "Refunded", match: "Refunded" },
  { label: "Cancelled", match: "Cancelled" },
];

type SortKey = "newest" | "oldest" | "amount-desc" | "amount-asc";
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Credit Issue Date: Newest" },
  { key: "oldest", label: "Credit Issue Date: Oldest" },
  { key: "amount-desc", label: "Amount: High to Low" },
  { key: "amount-asc", label: "Amount: Low to High" },
];

/** Split a "Label: Value" sort option into its two parts — used everywhere a sort label renders
 *  so the label always reads regular weight and the value medium (list header button AND the
 *  Sort by sheet's Tile rows). Same convention as Sales Invoice List. */
function splitSortLabel(label: string): [string, string] {
  return label.includes(": ") ? (label.split(/: (.+)/) as [string, string]) : [label, ""];
}

/** "Label: Value" as a fragment with the value in medium weight — for Tile's `title` slot. */
function sortLabelTitle(label: string): React.ReactNode {
  const [lbl, val] = splitSortLabel(label);
  if (!val) return lbl;
  return (
    <>
      {lbl}: <span className="body-sm-medium">{val}</span>
    </>
  );
}

/** Horizontal scroller of picked customers — avatar + name stacked, with a remove "x" badge
 *  overlaid on the avatar's corner. Same as Sales Invoice List's SelectedCustomers: shown above
 *  the customer list (Filters step) or below the search field (search step) so a selection stays
 *  visible/removable without scrolling the list. */
function SelectedCustomers({ clients, onRemove }: { clients: string[]; onRemove: (c: string) => void }) {
  if (clients.length === 0) return null;
  return (
    <div className="flex gap-4 overflow-x-auto -mx-6 px-6 pt-2 pb-1 thin-scrollbar">
      {clients.map((c) => (
        <div key={c} className="flex flex-col items-center gap-1 shrink-0 w-16">
          <div className="relative">
            <Avatar size="lg" initials={initials(c)} color={avatarTint(c)} />
            <button
              type="button"
              aria-label={`Remove ${c}`}
              onClick={() => onRemove(c)}
              className="absolute -top-1 -right-1 flex items-center justify-center size-4 rounded-full bg-[var(--text-primary)] ring-2 ring-white"
            >
              <X size={10} strokeWidth={2.5} color="var(--text-on-color)" />
            </button>
          </div>
          <span className="w-full text-center text-[11px] leading-tight truncate" style={FONT}>{c}</span>
        </div>
      ))}
    </div>
  );
}

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
  /** Locked-period demo (DES-751): a Draft CN detail whose "Edit" opens a locked-period dialog
   *  (the note is dated in a closed accounting period) instead of the edit form. */
  lockedPeriod?: boolean;
  /** Freshly created/saved credit note (dev-flow only — this list has no real backing array to
   *  append into today, so this mirrors the Sales Invoice List's ephemeral `recent` pattern). */
  recentCn?: { no: string; customer: string; amount: number; status: CNStatus; date: string } | null;
  /** The app-wide "just created" flag (see lib/pinNew.ts) — pins the matching row to the top
   *  regardless of sort/filter and shows its "New" badge for 5s. */
  newFlag?: NewFlag;
}

/**
 * Credit Notes List (DES-818) — the central register, a separate view from the Sales Invoice List but
 * sharing its layout: status chips (with counts), Sort/Filters row, and the same dashed card rows.
 * Statuses are Draft / Applied / Cancelled. Tap a row → the shared CreditNoteDetailPage, wired with the
 * same per-status actions as the invoice-detail flow (Draft: Edit/Delete · Applied: Send/Cancel · Cancelled: Preview).
 */
export function CreditNotesList({ onBack, onOpenInvoice, initialPreviewNo, companyEmail, lockedPeriod = false, recentCn, newFlag }: CreditNotesListProps) {
  const [active, setActive] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  // Customer search within the Filters sheet (DES-818 — "search by customer name") — pushes the
  // next level of this SAME sheet, same as Sales Invoice List's Filters→Customer search step.
  const [customerQuery, setCustomerQuery] = useState("");
  const [filterStep, setFilterStep] = useState<"search" | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const visibleCustomers = CUSTOMERS.filter((c) => c.toLowerCase().includes(customerQuery.toLowerCase()));
  // Issue-date range filter (DES-818) — reuses the invoice list's matchesIssueRange helper. The
  // calendar drops open inline right below the fields, same as Sales Invoice List's Issue Date.
  const [issueFrom, setIssueFrom] = useState("");
  const [issueTo, setIssueTo] = useState("");
  const [openCalendar, setOpenCalendar] = useState<"start" | "end" | null>(null);
  const [calendarSettled, setCalendarSettled] = useState(false);
  useEffect(() => {
    setCalendarSettled(false);
  }, [openCalendar]);
  const issueDateRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!openCalendar) return;
    const onPointerDown = (e: PointerEvent) => {
      if (issueDateRef.current && !issueDateRef.current.contains(e.target as Node)) {
        setOpenCalendar(null);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [openCalendar]);
  const activeFilterCount = selectedCustomers.length + (issueFrom || issueTo ? 1 : 0);

  // Filters is a full pushed page now, not a bottom sheet — same measured-footer-height trick
  // BottomSheet uses internally (see Sales Invoice List's own copy of this), since the footer's
  // content varies by step/selection and the scroll area needs to reserve exactly that much
  // bottom padding to clear the fixed-position footer.
  const [filterScrolled, setFilterScrolled] = useState(false);
  const filterScrollRef = useRef<HTMLDivElement>(null);
  const filterFooterRef = useRef<HTMLDivElement>(null);
  const [filterFooterHeight, setFilterFooterHeight] = useState(0);
  useLayoutEffect(() => {
    if (!filterOpen) return;
    setFilterFooterHeight(filterFooterRef.current?.offsetHeight ?? 0);
  }, [filterOpen, filterStep, selectedCustomers.length, activeFilterCount]);
  useEffect(() => {
    if (filterOpen) filterScrollRef.current?.scrollTo({ top: 0 });
  }, [filterOpen, filterStep]);
  // Local register state so Edit / Cancel / Delete / Send mutate in-session.
  const [notes, setNotes] = useState<CreditNote[]>(CREDIT_NOTES);
  const [previewNo, setPreviewNo] = useState<string | null>(initialPreviewNo ?? null);
  const [editingNo, setEditingNo] = useState<string | null>(null);
  // Set when Edit was triggered by the CN detail's empty "Reason" row — the form should open
  // straight into the reason picker instead of landing on a blank form.
  const [editingAutoOpenReason, setEditingAutoOpenReason] = useState(false);
  // Locked-period demo: which blocked action was tapped on a Draft CN (Edit or Apply) — drives the
  // blocking dialog's copy. null = closed.
  const [lockedNotice, setLockedNotice] = useState<null | "edit" | "apply">(null);
  // Success toast after applying a Draft to its invoice (mirrors InvoiceDetailPage's applyDraft).
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const preview = notes.find((n) => n.no === previewNo) ?? null;
  const setPreview = (cn: CreditNote | null) => setPreviewNo(cn?.no ?? null);

  // Save edits to a Draft register CN (DES-719 AC4 — only Drafts are editable). Updates the amount/reason;
  // the note stays a Draft (confirming/applying happens in the invoice-detail flow, not the list).
  const saveFromList = (no: string, p: CreditNotePayload) =>
    setNotes((prev) => prev.map((c) => (c.no === no ? { ...c, original: p.amount, reason: p.reason, applied: 0 } : c)));

  // DES-818 actions: delete a Draft (row removed, number retired) · cancel an Applied note (full reversal → Cancelled).
  const deleteFromList = (no: string) => { setNotes((prev) => prev.filter((c) => c.no !== no)); setPreview(null); };
  const cancelFromList = (no: string) => setNotes((prev) => prev.map((c) => (c.no === no ? { ...c, status: "Cancelled", applied: 0 } : c)));
  // Apply a complete Draft to its invoice (Draft → Applied) — mirrors the invoice-detail applyDraft:
  // close back to the list (so the updated "Applied" status is visible in the row) and fire the same
  // success toast as that flow, instead of leaving the user on the preview with no confirmation.
  const applyFromList = (no: string) => {
    setNotes((prev) => prev.map((c) => (c.no === no ? { ...c, status: "Applied", applied: c.original } : c)));
    setPreview(null);
    setToastMessage("Credit note applied");
  };

  // The freshly created/saved credit note (if any), prepended as a real row — same ephemeral-slot
  // pattern as Sales Invoice List's recentRow. Only affects counts/the rendered list, never the
  // real `notes` state or its mutation helpers above.
  const recentCnRow: CreditNote | null = recentCn
    ? { no: recentCn.no, customer: recentCn.customer, email: "", invoiceNo: "", original: recentCn.amount, invoiceTotal: recentCn.amount, applied: 0, kind: "cancellation", status: recentCn.status, date: recentCn.date, reason: "" }
    : null;
  const allNotes = useMemo(
    () => (recentCnRow ? [recentCnRow, ...notes] : notes),
    [recentCnRow?.customer, recentCnRow?.status, recentCnRow?.date, recentCnRow?.original, notes]
  );

  const counts = useMemo(
    () => FILTERS.map((f) => (f.match === "all" ? allNotes.length : allNotes.filter((c) => c.status === f.match).length)),
    [allNotes]
  );

  const list = useMemo(() => {
    const match = FILTERS[active].match;
    let rows = allNotes.filter((c) => (match === "all" ? true : c.status === match));
    if (selectedCustomers.length) rows = rows.filter((c) => selectedCustomers.includes(c.customer));
    if (issueFrom || issueTo) rows = rows.filter((c) => matchesIssueRange(toISO(c.date), issueFrom, issueTo));
    const sorted = [...rows];
    let ordered: CreditNote[];
    switch (sortKey) {
      case "oldest": ordered = sorted.reverse(); break;
      case "amount-desc": ordered = sorted.sort((a, b) => b.original - a.original); break;
      case "amount-asc": ordered = sorted.sort((a, b) => a.original - b.original); break;
      default: ordered = sorted; // newest = authored order
    }
    // Pin runs strictly AFTER sort, same reasoning as the invoice list's fix (lib/pinNew.ts).
    return pinNew(ordered, newFlag, "creditNote", (c) => c.no);
  }, [active, sortKey, selectedCustomers, issueFrom, issueTo, allNotes, newFlag]);

  const toggleCustomer = (c: string) => setSelectedCustomers((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));

  // Split the "Label: Value" sort text so the label reads regular weight and the value medium
  // (e.g. "Credit Issue Date: " regular, "Newest" medium) — same as Sales Invoice List.
  const currentSortLabel = SORT_OPTIONS.find((o) => o.key === sortKey)?.label ?? "Sort by";
  const [sortLabelText, sortValueText] = splitSortLabel(currentSortLabel);

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
          {/* Figma (node 1332-18605) stacks PageHeader/Tabs/Sort with NO gap between them — all the
              spacing comes from each row's own padding. PageAppHeader's root flex-col has a 12px gap
              for the StatusBar→content case, so this trio is wrapped in one gap-less block: the 12px
              only fires once (StatusBar→block), not again between each row inside it. */}
          <div className="flex flex-col">
            {/* DS PageHeader (center) — same style as the Sales Invoice List. */}
            <PageHeader type="center" title="Credit Notes" onBack={onBack} showSearch={false} />

            {/* Status filter tabs — DS HorizontalTabs (button style), horizontally scrollable. Sits
                directly in the header's beige→white gradient panel, no separate box/shadow. Right
                padding is intentionally omitted (Figma node 1332-18605): the row bleeds to the frame's
                edge so an overflowing tab clips flush against it, signalling more content to scroll to.
                Figma (node 4240-5598, re-synced 2026-07-28) specs pl-16px / py-16px — symmetric
                top/bottom, matching the Sales Invoice List. */}
            <div className="tabs-wrap shrink-0 pl-4 py-4 relative z-10">
              <HorizontalTabs
                variant="button"
                tabs={FILTERS.map((f, i) => `${f.label} (${counts[i]})`)}
                activeIndex={active}
                onChange={setActive}
              />
            </div>

            {/* Sort / Filter row — same style as the Sales Invoice List. The Sort button always shows
                the effective sort label (e.g. "Credit Issue Date: Newest") — a sort is always applied
                (default "newest"), so a generic "Sort by" placeholder would be misleading. The Sort
                sheet below shows the same effective sortKey as selected/checked, for the same reason. */}
            {/* No bg-white here (matches Sales Invoice List) — this row sits inside the
                transparent-at-rest PageAppHeader, so a solid fill would show as a hard white
                rectangle cutting into the page's beige→white gradient instead of blending. */}
            <div className="shrink-0 flex items-center justify-between pt-1 pb-2 px-4 border-b border-[var(--border-neutral-primary)]">
              <button onClick={() => setSortOpen(true)} className="flex items-center gap-1" style={FONT}>
                <ArrowUpDown size={16} strokeWidth={1.67} color="var(--text-primary)" />
                <span className="body-sm text-[var(--text-primary)]">
                  {sortValueText ? `${sortLabelText}: ` : sortLabelText}
                </span>
                {sortValueText && <span className="body-sm-medium text-[var(--text-primary)]">{sortValueText}</span>}
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
              title={cn.customer}
              titleBadge={newFlag?.kind === "creditNote" && newFlag.id === cn.no ? <Badge label="New" color="custom" variant="bold" size="sm" /> : undefined}
              // Drafts have no CN number yet (assigned on issue) — hide it until then.
              invoiceNo={cn.status === "Draft" ? undefined : cn.no}
              status={cn.status}
              statusColor={STATUS_BADGE[cn.status]}
              // Just the date — the status badge alongside already names the state, so a leading
              // "Created"/"Applied" word would repeat it (matches the CN detail hero's own row).
              statusCaption={cn.date}
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
              size="sm"
              title={sortLabelTitle(o.label)}
              selected={o.key === sortKey}
              trailing={o.key === sortKey ? "check" : "none"}
              onClick={() => { setSortKey(o.key); setSortOpen(false); }}
            />
          ))}
        </div>
      </BottomSheet>

      {/* Filters — a full pushed page (decided 2026-08-11: was a fullPage bottom sheet), same
          architecture as the Sales Invoice List's own: Customer search swaps content within this
          SAME page (title morphs into a frosted search pill), and a Reset/Apply dock appears once
          a filter is active. */}
      <AnimatePresence>
      {filterOpen && (
        <motion.div
          key="filters-page"
          className="absolute inset-0 z-50 bg-white rounded-[48px] overflow-hidden flex flex-col"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={PAGE_PUSH_TRANSITION}
        >
          <div
            ref={filterScrollRef}
            className="flex-1 overflow-y-auto thin-scrollbar"
            style={{ paddingBottom: filterFooterHeight }}
            onScroll={(e) => setFilterScrolled(e.currentTarget.scrollTop > 4)}
          >
            <PageAppHeader scrolled={filterScrolled}>
              {filterStep === "search" ? (
                <>
                  <PageHeader
                    type="search"
                    onBack={() => { setCustomerQuery(""); setFilterStep(null); }}
                    searchValue={customerQuery}
                    onSearchChange={setCustomerQuery}
                    searchPlaceholder="Search by Customer name"
                    autoFocusSearch
                    showAction={false}
                  />
                  <SelectedCustomers clients={selectedCustomers} onRemove={toggleCustomer} />
                </>
              ) : (
                <PageHeader
                  type="center"
                  title="Filter Credit Notes"
                  onBack={() => {
                    setFilterOpen(false);
                    setFilterStep(null);
                    setCustomerQuery("");
                    setOpenCalendar(null);
                  }}
                  showSearch={false}
                />
              )}
            </PageAppHeader>

            <div className="px-4 pt-4">
              <AnimatePresence mode="wait" initial={false}>
                {filterStep === "search" ? (
                  <motion.div
                    key="search"
                    initial={{ x: 24, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 24, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                  >
                    <div className="flex flex-col">
                      {customerQuery && (
                        visibleCustomers.length === 0 ? (
                          <p className="text-center text-[13px] text-[var(--text-placeholder)] py-3.5" style={FONT}>No customers found</p>
                        ) : (
                          <p className="body-sm text-[var(--text-secondary)] pt-3.5 pb-2">
                            {visibleCustomers.length === 1 ? "Result 1" : `Results ${visibleCustomers.length}`}
                          </p>
                        )
                      )}
                      {visibleCustomers.map((c) => (
                        <div key={c} className="py-4 flex items-center gap-3">
                          <Avatar size="sm" initials={initials(c)} color={avatarTint(c)} />
                          <div className="flex-1">
                            <Checkbox reverse label={c} checked={selectedCustomers.includes(c)} onChange={() => toggleCustomer(c)} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="filters"
                    initial={{ x: -24, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -24, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                  >
                    <div ref={issueDateRef} className="flex flex-col">
                      <p className="body-sm text-[var(--text-secondary)] pb-4">Credit Issue Date</p>
                      <div className="flex items-start gap-3">
                        <TextField
                          type="date-picker"
                          placeholder="Start date"
                          value={issueFrom ? format(parseISO(issueFrom), "d MMM yyyy") : ""}
                          onClick={() => setOpenCalendar((prev) => (prev === "start" ? null : "start"))}
                        />
                        <TextField
                          type="date-picker"
                          placeholder="End date"
                          value={issueTo ? format(parseISO(issueTo), "d MMM yyyy") : ""}
                          onClick={() => setOpenCalendar((prev) => (prev === "end" ? null : "end"))}
                        />
                      </div>
                      <AnimatePresence initial={false} mode="wait">
                        {openCalendar && (
                          <motion.div
                            key={openCalendar}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            onAnimationComplete={() => {
                              if (openCalendar) setCalendarSettled(true);
                            }}
                            style={{ overflow: calendarSettled ? "visible" : "hidden" }}
                          >
                            <div className="pt-3">
                              <Calendar
                                value={
                                  openCalendar === "start"
                                    ? issueFrom ? parseISO(issueFrom) : undefined
                                    : issueTo ? parseISO(issueTo) : undefined
                                }
                                maxDate={openCalendar === "start" && issueTo ? parseISO(issueTo) : undefined}
                                onChange={(d) => {
                                  if (openCalendar === "start") setIssueFrom(format(d, "yyyy-MM-dd"));
                                  else setIssueTo(format(d, "yyyy-MM-dd"));
                                  setOpenCalendar(null);
                                }}
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Customer — title + search toggle. Tapping search pushes the "search" step
                        (this SAME page's header swaps to a search pill) instead of revealing a
                        field inline. Selected picks surface as a removable chip row right below
                        the title. */}
                    <div className="pb-2">
                      <div className="flex items-center justify-between pt-6">
                        <p className="body-sm text-[var(--text-secondary)]">Customer</p>
                        {CUSTOMERS.length >= 5 && (
                          <button
                            type="button"
                            aria-label="Search customers"
                            onClick={() => setFilterStep("search")}
                            className="p-1 -m-1"
                          >
                            <Search size={20} strokeWidth={1} color="var(--text-primary)" />
                          </button>
                        )}
                      </div>
                    </div>
                    <SelectedCustomers clients={selectedCustomers} onRemove={toggleCustomer} />
                    <div className="flex flex-col">
                      {visibleCustomers.length === 0 && (
                        <p className="text-center text-[13px] text-[var(--text-placeholder)] py-3.5" style={FONT}>No customers found</p>
                      )}
                      {visibleCustomers.map((c) => (
                        <div key={c} className="py-4 flex items-center gap-3">
                          <Avatar size="sm" initials={initials(c)} color={avatarTint(c)} />
                          <div className="flex-1">
                            <Checkbox reverse label={c} checked={selectedCustomers.includes(c)} onChange={() => toggleCustomer(c)} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {(filterStep === "search" || activeFilterCount > 0) && (
            <div ref={filterFooterRef} className="absolute inset-x-0 bottom-0 z-20">
              {filterStep === "search" ? (
                selectedCustomers.length > 0 ? (
                  <ButtonDock
                    type="single"
                    keyboard
                    primaryLabel={`Select ${selectedCustomers.length}`}
                    onPrimary={() => { setFilterStep(null); setCustomerQuery(""); }}
                  />
                ) : (
                  <Keyboard />
                )
              ) : (
                <ButtonDock
                  type="ghost"
                  stack="horizontal"
                  secondaryLabel="Reset"
                  primaryLabel="Apply"
                  onSecondary={() => { setSelectedCustomers([]); setIssueFrom(""); setIssueTo(""); setCustomerQuery(""); setOpenCalendar(null); }}
                  onPrimary={() => setFilterOpen(false)}
                />
              )}
            </div>
          )}
        </motion.div>
      )}
      </AnimatePresence>

      {/* Shared CN detail (same component + behaviour as the invoice-detail flow). Wired per DES-818
          status: Draft → Edit (resume the form) + Delete (⋯) · Applied → Send + Cancel (⋯) · Cancelled →
          Preview only. Sending persists to the register. */}
      <AnimatePresence>
      {preview && (() => {
        const isDraft = preview.status === "Draft";
        const isApplied = preview.status === "Applied";
        return (
          <motion.div
            key="cn-preview"
            className="absolute inset-0 z-50"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={PAGE_PUSH_TRANSITION}
          >
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
              // Real credited line items from the register; fall back to a single synthesized line.
              lines={preview.lines ?? [{ name: "Credited amount", amount: preview.original }]}
              reason={preview.reason}
              // The note's real kind from the register (2026-08-05): a refund note reads
              // Refund to / Refund items / Payment Account here exactly as it does when opened from
              // its invoice, so one note never renders two different ways depending on the route.
              kind={preview.kind}
              status={preview.status}
              sent={preview.sent}
              receivingAccount={(() => { const a = RECEIVING_ACCOUNTS.find((x) => x.primary) ?? RECEIVING_ACCOUNTS[0]; return { name: a.name, number: a.number, primary: !!a.primary, country: a.country }; })()}
              // Locked-period demo: the Back arrow is inert (the CN is in a closed period — no exit).
              onBack={lockedPeriod ? () => {} : () => setPreview(null)}
              // Related Invoice row → open that invoice's detail (shows the chevron arrow).
              onViewInvoice={onOpenInvoice ? () => onOpenInvoice(preview.invoiceNo) : undefined}
              // Draft → Apply to invoice (Draft → Applied), same as the invoice-detail flow. Apply
              // is always the primary CTA now (form-cta-validation) — a failed tap on an incomplete
              // draft surfaces an error toast instead of swapping to Edit. In the locked-period demo,
              // Apply surfaces the closed-period dialog instead of applying.
              onApply={isDraft ? () => (lockedPeriod ? setLockedNotice("apply") : applyFromList(preview.no)) : undefined}
              // Draft → Edit reopens the form (optionally straight into the reason picker, from the
              // detail's empty "Reason" row). Applied/Cancelled are locked (no edit). In the
              // locked-period demo, Edit surfaces the closed-period dialog instead of the form.
              onEdit={isDraft ? (autoOpenReason) => { if (lockedPeriod) { setLockedNotice("edit"); return; } setEditingAutoOpenReason(!!autoOpenReason); setEditingNo(preview.no); } : undefined}
              // Draft → Delete (row removed); Applied → Cancel (full reversal → Cancelled). Cancelled → none.
              onCancel={isDraft ? () => deleteFromList(preview.no) : isApplied ? () => cancelFromList(preview.no) : undefined}
              onSent={() => setNotes((prev) => prev.map((c) => (c.no === preview.no ? { ...c, sent: true } : c)))}
              lockedPeriod={lockedPeriod}
            />
            {/* Locked-period demo (DES-751): the Draft "Edit"/"Apply" blocking dialog, rendered inside the
                preview overlay (its own stacking context) so it layers above the CN detail. The Applied
                "Cancel credit note" dialog lives inside CreditNoteDetailPage itself. */}
            <LockedPeriodDialog
              open={lockedNotice !== null}
              title={lockedNotice === "apply" ? "Credit note can’t be applied" : "Editing isn’t available"}
              body={
                lockedNotice === "apply"
                  ? "This credit note can’t be applied because its date (31 Dec 2026) falls in a closed accounting period. Contact your accountant for assistance."
                  : "This credit note can’t be edited because its date (31 Dec 2026) falls in a closed accounting period. Contact your accountant for assistance."
              }
              onClose={() => setLockedNotice(null)}
            />
          </motion.div>
        );
      })()}
      </AnimatePresence>

      {/* Edit a register credit note (DES-719 AC4) — the register carries no line items, so the form opens
          with a single synthesized "Credited amount" line seeded from the note's current amount. */}
      <AnimatePresence>
      {editingNo && (() => {
        const cn = notes.find((n) => n.no === editingNo);
        if (!cn) return null;
        // The form derives credit = original − corrected, so the seed must carry the FULL invoice
        // line as origAmount and the REMAINING (post-credit) amount as unitPrice — origAmount and
        // unitPrice both being cn.original (the already-credited amount) always derived a credit of
        // exactly 0, which made Save fail with "the credit can't be zero" no matter what was typed.
        const seedLine: DraftLine = { id: "cn-0", name: "Credited amount", unit: "service", qty: 1, unitPrice: String(cn.invoiceTotal - cn.original), maxQty: 1, origAmount: cn.invoiceTotal };
        return (
          <motion.div
            key="cn-edit"
            className="absolute inset-0 z-50"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={PAGE_PUSH_TRANSITION}
          >
            <CreditNoteForm
              mode="edit"
              creditNoteNo={cn.no}
              invoiceNo={cn.invoiceNo}
              customerName={cn.customer}
              customerEmail={cn.email}
              currency="USD"
              items={[{ name: "Credited amount", qty: 1, unit: "service", unitPrice: cn.invoiceTotal, amount: cn.invoiceTotal }]}
              invoiceTotal={cn.invoiceTotal}
              alreadyCredited={0}
              outstanding={cn.invoiceTotal}
              initial={{ name: cn.customer, email: cn.email, reason: cn.reason, reasonNote: "", issueDate: new Date(2026, 5, 26), lines: [seedLine] }}
              autoOpenReason={editingAutoOpenReason}
              onBack={() => { setEditingNo(null); setEditingAutoOpenReason(false); }}
              onCreate={(p) => { saveFromList(cn.no, p); setEditingNo(null); setEditingAutoOpenReason(false); }}
            />
          </motion.div>
        );
      })()}
      </AnimatePresence>

      <Toast open={!!toastMessage} message={toastMessage ?? ""} bottomOffset={16} onDone={() => setToastMessage(null)} />
    </div>
  );
}

export default CreditNotesList;
