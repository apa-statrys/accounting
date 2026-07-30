import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { parse, parseISO, format, addDays } from "date-fns";
import { ArrowUpDown, ChevronDown, FilePlus, Search, X } from "lucide-react";
import { FAB } from "../../ui/FAB";
import { PageAppHeader } from "../../components/PageAppHeader";
import { PageHeader } from "../../ui/PageHeader";
import { HorizontalTabs } from "../../ui/HorizontalTabs";
import { Tile } from "../../ui/Tile";
import { Avatar } from "../../ui/Avatar";
import { Chips } from "../../ui/Chips";
import { Checkbox } from "../../ui/Checkbox";
import { Toast } from "../../components/Toast";
import type { ToastVariant } from "../../ui/ToastMessage";
import { CreateInvoiceSheet } from "../../components/CreateInvoiceSheet";
import { BottomSheet } from "../../components/BottomSheet";
import { ButtonDock } from "../../components/ButtonDock";
import { Keyboard } from "../../components/Keyboard";
import { FilterIcon } from "../../components/FilterIcon";
import { TextField } from "../../ui/TextField";
import { Calendar } from "../../components/Calendar";
import { CreditNoteDetailPage } from "../credit-note-list/CreditNoteDetailPage";
import { CREDIT_NOTES } from "../../data/creditNotes";
import { INVOICES } from "../../data/invoices";
import { SHOW_RECURRING } from "../../lib/flags";
import { FONT, avatarTint } from "../../lib/theme";
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

/** Two-letter initials from a customer name (skips symbols like "&"), for the Customer search's Avatar. */
function initials(name: string): string {
  const words = name.split(/\s+/).filter((w) => /[a-z0-9]/i.test(w[0] ?? ""));
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase();
}

/** Split a "Label: Value" sort option into its two parts — used everywhere a sort label renders
 *  so the label always reads regular weight and the value medium (list header button AND the
 *  Sort by sheet's Tile rows). */
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
 *  overlaid on the avatar's corner. Shown above the customer list (Filters step) or below the
 *  search field (search step) so a selection stays visible/removable without scrolling the list. */
function SelectedCustomers({ clients, onRemove }: { clients: string[]; onRemove: (c: string) => void }) {
  if (clients.length === 0) return null;
  return (
    // pt-2 (the "x" badge pokes ~6px above the avatar via -top-1 + its ring-2) — without it,
    // overflow-x:auto forces overflow-y:auto too (per spec, since it can't stay "visible"
    // alongside a non-visible x-axis), clipping the badge's top edge off entirely.
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

interface SalesInvoiceListProps {
  showSuccess?: boolean;
  successVariant?: ToastVariant;
  /** Toast title — short, varies by action. */
  successMessage?: string;
  /** Toast muted subline (e.g. "Marked as sent"). */
  successSubtext?: string;
  onSuccessDone?: () => void;
  /** A just-created/saved invoice to surface + temporarily highlight at the top of the list. */
  recent?: { client: string; amount: string; status: Status; meta: string; recurring?: boolean } | null;
  /** Whether `recent`'s arrival highlight has already played once — `recent` itself stays set (the
   *  card keeps showing) well past that, so without this the highlight replays on every later
   *  remount of this list (e.g. open the invoice, then Back). */
  recentHighlighted?: boolean;
  /** Fires once the highlight has run its course — the caller should flip `recentHighlighted` to
   *  true (never clear `recent`; the card is meant to keep showing). */
  onRecentShown?: () => void;
  onBack?: () => void;
  /** Open an invoice's detail page. */
  onOpenInvoice?: (inv: { number: string; client: string; status: DetailStatus; origin: "created" | "uploaded"; cnNo?: string; cnAmount?: number; cnSent?: boolean; recurring?: boolean }) => void;
  onManual?: () => void;
  onUpload?: () => void;
  /** Start a recurring invoice series (DES-782). */
  onRecurring?: () => void;
  /** Preset the status chip when opened from a dashboard tile (e.g. "Paid"). */
  initialStatus?: StatusMatch;
  /** Report the active status tab up so the parent can restore it on return (e.g. back from detail). */
  onActiveStatusChange?: (status: StatusMatch) => void;
  /** Preset the due-date quick filter when opened from elsewhere (e.g. "week"). */
  initialDue?: DueFilter;
  /** Refunds completed in-session (DES-720), keyed by invoice number → "partial" | "full". */
  refundState?: Record<string, "partial" | "full">;
}

export function SalesInvoiceList({ showSuccess, successVariant, successMessage, successSubtext, onSuccessDone, recent, recentHighlighted, onRecentShown, onBack, onOpenInvoice, onManual, onUpload, onRecurring, initialStatus, onActiveStatusChange, initialDue, refundState }: SalesInvoiceListProps) {
  const initialActive = initialStatus ? Math.max(0, FILTERS.findIndex((f) => f.match === initialStatus)) : 0;
  const [active, setActive] = useState(initialActive);
  // Keep the selected status tab scrolled into view (e.g. when opened pre-filtered from the hero).
  const tabsWrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    tabsWrapRef.current
      ?.querySelector('[role="tab"][aria-selected="true"]')
      ?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [active]);
  const [sortKey, setSortKey] = useState<SortKey>(defaultSortFor(FILTERS[initialActive].match));

  // Switching status chips resets the sort to that chip's natural default: unpaid
  // (Awaiting/Overdue) → chase by due date; everything else → newest issued.
  const selectChip = (i: number) => {
    const m = FILTERS[i].match;
    setActive(i);
    onActiveStatusChange?.(m);
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
  // Which "level" of the Filters sheet is showing — null = the filters form itself; "search"
  // pushes the Customer search (Figma "Sales Invoice — Client", node 1333-38370 for the search
  // header/back-button pattern — its "tile card" results aren't used, just the header + next-level
  // behavior). One BottomSheet, one scrim, content pushes/pops in place — never a second sheet
  // stacked on top. The date pickers, unlike search, don't push a level — they drop open inline
  // right below the Start/End date fields instead (see `openCalendar`).
  const [filterStep, setFilterStep] = useState<"search" | null>(null);
  // Which inline date-picker (if any) is expanded below the Issue Date row.
  const [openCalendar, setOpenCalendar] = useState<"start" | "end" | null>(null);
  // The height-animation wrapper needs overflow:hidden while actually transitioning (so a
  // still-growing/shrinking box doesn't let content spill out unclipped) but that same
  // overflow:hidden clips Calendar's own box-shadow once fully open — no amount of padding fully
  // fixes that without visually insetting the calendar from the fields above it. So: hidden only
  // until the enter animation completes, then switched to visible for the settled state.
  const [calendarSettled, setCalendarSettled] = useState(false);
  useEffect(() => {
    setCalendarSettled(false);
  }, [openCalendar]);
  // Tapping outside the Issue Date fields/calendar closes it, same as any other inline dropdown.
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
  const [clientQuery, setClientQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const issueActive = Boolean(issueFrom || issueTo);
  // Due-date filter is only meaningful on the unpaid views (All / Awaiting).
  const activeMatch = FILTERS[active].match;
  const showDueFilter = activeMatch === "all" || activeMatch === "Awaiting";
  // Refund filter only makes sense where Paid invoices appear (All / Paid).
  const showRefundFilter = activeMatch === "all" || activeMatch === "Paid";
  // Sort options available on the current chip (per the IA).
  const allowedSorts = new Set(sortKeysFor(activeMatch));
  const visibleSortOptions = SORT_OPTIONS.filter((o) => allowedSorts.has(o.key));
  // Split the "Label: Value" sort text so the label reads regular weight and the value medium
  // (e.g. "Issue Date: " regular, "Newest" medium) — Figma spec for the list header's sort button.
  const currentSortLabel = SORT_OPTIONS.find((o) => o.key === sortKey)?.label ?? "Sort by";
  const [sortLabelText, sortValueText] = splitSortLabel(currentSortLabel);

  // Qonto-style: only surface a search once the client list is long enough to need it.
  const visibleClients = CLIENTS.filter((c) => c.toLowerCase().includes(clientQuery.toLowerCase()));

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
    if (!recent || recentHighlighted) return;
    setHighlightRecent(true);
    const t = setTimeout(() => {
      setHighlightRecent(false);
      onRecentShown?.();
    }, 2600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recent?.client, recent?.amount, recent?.status, recentHighlighted]);

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

  const toggleClient = (c: string) =>
    setSelectedClients((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

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
            {/* DS PageHeader (center) — back chevron only, title optically centered by the spacer. */}
            <PageHeader type="center" title="All Invoices" onBack={onBack} showSearch={false} />

            {/* Status filter tabs — DS HorizontalTabs (button style), horizontally scrollable. Sits
                directly in the header's beige→white gradient panel, no separate box/shadow. Right
                padding is intentionally omitted (Figma node 1332-18605): the row bleeds to the frame's
                edge so an overflowing tab clips flush against it, signalling more content to scroll to.
                Figma (node 4240-5598, re-synced 2026-07-28) specs pl-16px / py-16px — symmetric
                top/bottom, not the pt-4px/pb-8px an earlier sync had recorded. */}
            <div ref={tabsWrapRef} className="tabs-wrap shrink-0 pl-4 py-4 relative z-10">
              <HorizontalTabs
                variant="button"
                tabs={FILTERS.map((f, i) => `${f.label} (${counts[i]})`)}
                activeIndex={active}
                onChange={selectChip}
              />
            </div>

            {/* Sort / Filter row — Figma "Sales Invoice · List" (node 4469-466): pt-1/pb-2/px-4
                (4/8/16px). The Sort button always shows the effective sort label (e.g. "Issue
                Date: Newest") — a sort is always applied (see defaultSortFor), so a generic
                "Sort by" placeholder would be misleading. The Sort sheet below shows the same
                effective sortKey as selected/checked, for the same reason. */}
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
                {filterCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-1 rounded-full bg-[var(--bg-brand-primary)] text-white text-[10px] font-bold flex items-center justify-center">
                    {filterCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </PageAppHeader>

        {/* Invoice list — DS InvoiceRows as a flat list on the white page (divider between rows). */}
        <div className="bg-white px-4 pb-4 flex flex-col">
        {list.length === 0 ? (
          <p className="text-center text-[13px] text-[var(--text-placeholder)] pt-16" style={FONT}>No invoices found</p>
        ) : (
          list.map((inv, i) => (
            <InvoiceCard
              key={inv.id}
              inv={inv}
              highlighted={highlightRecent && inv.id === "recent-new"}
              lastItem={i === list.length - 1}
              onClick={() => onOpenInvoice?.({ number: inv.id.replace(/[a-z]$/, ""), client: inv.client, status: effectiveStatus(inv), origin: inv.origin ?? "created", cnNo: inv.cnNo, cnAmount: inv.cnAmount, cnSent: inv.cnSent, recurring: inv.recurring })}
              onDelete={() => setConfirmDeleteId(inv.id)}
              onOpenCN={openCnForInvoice}
              refundOverride={refundState?.[inv.id.replace(/[a-z]$/, "")]}
            />
          ))
        )}
        </div>
      </div>

      {/* Create invoice FAB */}
      <FAB circle icon={<FilePlus size={20} />} aria-label="Create invoice" className="absolute z-20 bottom-4 right-4" onClick={() => setSheetOpen(true)} />

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

      {/* Sort bottom sheet — Figma "Sales Invoice · List" Sort by (node 1345-40965): DS Tile rows,
          selected = brand border + check. */}
      <BottomSheet open={sortOpen} title="Sort by" onClose={() => setSortOpen(false)}>
        <div className="flex flex-col gap-2">
          {visibleSortOptions.map((o) => (
            <Tile
              key={o.key}
              size="sm"
              title={sortLabelTitle(o.label)}
              selected={o.key === sortKey}
              trailing={o.key === sortKey ? "check" : "none"}
              onClick={() => {
                setSortKey(o.key);
                setSortOpen(false);
              }}
            />
          ))}
        </div>
      </BottomSheet>

      {/* Filters bottom sheet — Customer search pushes the next level of this SAME sheet (Figma
          "Sales Invoice — Client", node 1333-38370 for the search header/back-button behavior —
          its "tile card" results aren't used, just that header/behavior). The Issue Date fields
          don't push a level; their calendar drops open inline right below them instead (simpler
          than a sub-page for a single field). One BottomSheet instance, title/back/searchValue/
          footer swap with `filterStep`, content slides in/out instead of stacking a second
          sheet+scrim on top of this one. */}
      <BottomSheet
        open={filterOpen}
        title="Filter Invoices"
        // Almost-full-page drawer (below the phone frame's status bar, not overlapping it) — fixed,
        // not hugging content, so a short result list doesn't shrink the sheet.
        fullPage
        onBack={
          filterStep === "search"
            ? () => {
                // Leaving the search step drops its query — otherwise the base Filters step's own
                // customer list (which reuses the same `visibleClients`) would stay filtered too.
                setClientQuery("");
                setFilterStep(null);
              }
            : undefined
        }
        onClose={() => {
          setFilterOpen(false);
          setFilterStep(null);
          setClientQuery("");
          setOpenCalendar(null);
        }}
        searchValue={filterStep === "search" ? clientQuery : undefined}
        onSearchChange={filterStep === "search" ? setClientQuery : undefined}
        searchPlaceholder="Search by Customer name"
        autoFocusSearch
        // Lives inside the SAME sticky/frosted header as the search pill (not a second
        // independent sticky sibling below it) — see BottomSheet's headerExtra doc comment.
        headerExtra={filterStep === "search" ? <SelectedCustomers clients={selectedClients} onRemove={toggleClient} /> : undefined}
        footer={
          // Search step (Figma "Sales Invoice — Client", node 1333-38370): a decorative on-screen
          // keyboard fills the space below the focused search field — same stand-in as elsewhere,
          // components/Keyboard, since a desktop web view never shows the real OS keyboard. Once
          // something's picked, the same ButtonDock "keyboard" variant CreditNotesList already
          // uses adds a confirm button above the keyboard instead of a bare one.
          filterStep === "search" ? (
            selectedClients.length > 0 ? (
              <ButtonDock
                type="single"
                keyboard
                primaryLabel={`Select ${selectedClients.length}`}
                onPrimary={() => {
                  setFilterStep(null);
                  setClientQuery("");
                }}
              />
            ) : (
              <Keyboard />
            )
          ) :
          filterCount === 0 ? undefined : (
            <ButtonDock
              type="ghost"
              stack="horizontal"
              secondaryLabel="Reset"
              primaryLabel="Apply"
              onSecondary={() => {
                setSelectedClients([]);
                setDueFilter("all");
                setRefundFilters([]);
                setIssueFrom("");
                setIssueTo("");
                setClientQuery("");
                setOpenCalendar(null);
              }}
              onPrimary={() => setFilterOpen(false)}
            />
          )
        }
      >
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
                {/* Selection itself now renders in the sheet's own sticky header (via
                    headerExtra) — a back-tap here doesn't undo it either; it just returns to the
                    base Filters step with it intact. */}
                {/* Before a query: the same default suggestion list as the base Filters step, with
                    no label of its own — same rationale as the base step's Customer list (the
                    search field above already frames what it is). Once typing, this becomes a
                    result count (Figma "Sales Invoice — Client", node 1333-38370: "Result 1"). */}
                {clientQuery && (
                  visibleClients.length === 0 ? (
                    <p className="text-center text-[13px] text-[var(--text-placeholder)] py-3.5" style={FONT}>No customers found</p>
                  ) : (
                    <p className="body-sm text-[var(--text-secondary)] pt-3.5 pb-2">
                      {visibleClients.length === 1 ? "Result 1" : `Results ${visibleClients.length}`}
                    </p>
                  )
                )}
                {visibleClients.map((c) => (
                  <div key={c} className="py-4 flex items-center gap-3">
                    <Avatar size="sm" initials={initials(c)} color={avatarTint(c)} />
                    <div className="flex-1">
                      <Checkbox reverse label={c} checked={selectedClients.includes(c)} onChange={() => toggleClient(c)} />
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
              {showDueFilter && (
                <div className="flex flex-col">
                  <p className="body-sm text-[var(--text-secondary)] pb-4">Due Date</p>
                  <div className="flex flex-wrap gap-2">
                    {DUE_FILTERS.map((r) => (
                      <Chips
                        key={r.key}
                        label={r.label}
                        active={dueFilter === r.key}
                        onClick={() => setDueFilter((prev) => (prev === r.key ? "all" : r.key))}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div ref={issueDateRef} className="flex flex-col">
                <p className="body-sm text-[var(--text-secondary)] pt-6 pb-4">Issue Date</p>
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
                {/* Drops open inline right below the fields — not a sub-page push (that's overkill
                    for a single field), unlike the Customer search step above. Animated open/close
                    (height+opacity) instead of an instant show/hide, and closes on an outside tap
                    (see the pointerdown listener on issueDateRef above). Overflow stays hidden only
                    while actually transitioning (so a still-growing/shrinking box doesn't let
                    content spill out unclipped) — Calendar's own box-shadow needs far more bleed
                    room (10px y-offset + 30px blur, on every side) than padding could reserve
                    without visibly insetting it from the fields above, so once settled/fully open
                    it switches to visible instead (see `calendarSettled`). */}
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

              {/* Refund status — a refunded invoice is still Paid, so it's a filter here (only on All / Paid). */}
              {showRefundFilter && (
                <div className="flex flex-col">
                  <p className="body-sm text-[var(--text-secondary)] pt-6">Refund Status</p>
                  {REFUND_FILTERS.map((r) => (
                    <div key={r.key} className="py-4">
                      <Checkbox
                        reverse
                        label={r.label}
                        checked={refundFilters.includes(r.key)}
                        onChange={() => setRefundFilters((prev) => (prev.includes(r.key) ? prev.filter((k) => k !== r.key) : [...prev, r.key]))}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Customer — title + search toggle. Not sticky: it's a sibling of this SAME sheet's
                  own sticky header, and two top:0 stickies in one scroll container fight over the
                  same position once both are stuck (see BottomSheet's headerExtra doc comment).
                  Tapping search pushes the "search" step (this SAME sheet's header swaps to a
                  search pill) instead of revealing a field inline. Selected picks surface as a
                  removable chip row right below the title; the list itself (all/"suggested"
                  customers) needs no further label — the title + chips above it already frame
                  what it is. */}
              <div className="pb-2">
                <div className="flex items-center justify-between pt-2">
                  <p className="body-sm text-[var(--text-secondary)]">Customer</p>
                  {CLIENTS.length >= 5 && (
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
              <SelectedCustomers clients={selectedClients} onRemove={toggleClient} />
              <div className="flex flex-col">
                {visibleClients.length === 0 && (
                  <p className="text-center text-[13px] text-[var(--text-placeholder)] py-3.5" style={FONT}>No customers found</p>
                )}
                {visibleClients.map((c) => (
                  <div key={c} className="py-4 flex items-center gap-3">
                    <Avatar size="sm" initials={initials(c)} color={avatarTint(c)} />
                    <div className="flex-1">
                      <Checkbox reverse label={c} checked={selectedClients.includes(c)} onChange={() => toggleClient(c)} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </BottomSheet>

      {/* Delete-draft confirmation. Delete Draft leads as the filled primary, in red — it's
          irreversible, not just the recommended choice; Keep Draft is the plain outline secondary
          (see memory: destructive-color-by-reversibility). */}
      <BottomSheet
        open={!!confirmDeleteId}
        title="Delete Draft Invoice?"
        onClose={() => setConfirmDeleteId(null)}
        compact
        footer={
          <ButtonDock
            type="double"
            primaryLabel="Delete Draft"
            primaryDestructive
            secondaryLabel="Keep Draft"
            onPrimary={() => {
              if (confirmDeleteId) setDeletedIds((prev) => [...prev, confirmDeleteId]);
              setConfirmDeleteId(null);
            }}
            onSecondary={() => setConfirmDeleteId(null)}
          />
        }
      >
        <p className="body-sm text-[var(--text-secondary)]" style={FONT}>
          Are you sure you want to delete this draft invoice? This action cannot be undone.
        </p>
      </BottomSheet>

      {/* Success toast on top */}
      <Toast open={!!showSuccess} message={successMessage} subtext={successSubtext} variant={successVariant} onDone={onSuccessDone} />
    </div>
  );
}

export default SalesInvoiceList;
