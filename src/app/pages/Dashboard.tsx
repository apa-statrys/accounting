import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, ChevronRight, Plus, Settings } from "lucide-react";
import { ATTENTION_TASKS } from "../data/attentionTasks";
import { HERO_SCENARIOS } from "../data/heroScenarios";
import { NeedAttentionStack } from "../components/NeedAttentionStack";
import { StatusBar } from "../components/StatusBar";
import { Button } from "../ui/Button";
import { CreateInvoiceSheet } from "../components/CreateInvoiceSheet";
import { FAB } from "../ui/FAB";
import { OutstandingCard } from "../ui/OutstandingCard";
import { PageHeader } from "../ui/PageHeader";
import { InvoiceRow } from "../ui/InvoiceRow";

import { FONT, INK } from "../lib/theme";
import { SHOW_CREDIT_NOTES } from "../lib/flags";

/** Peer-benchmark note in the hero's Collected box (hidden at 0% collected, per Figma). */
const PEER_NOTE = "You’re ahead of 71% of similar businesses this month";

interface DashboardProps {
  tab?: "dashboard" | "invoices" | "search";
  onOpenDashboard?: () => void;
  onOpenInvoices?: () => void;
  onOpenSearch?: () => void;
  /** Back out of the Sales Invoices section (to the Accounting hub). */
  onBack?: () => void;
  /** Open the Accounting Hub menu (top-left grid icon). */
  onMenu?: () => void;
  /** Open invoice settings (gear icon beside notifications). */
  onSettings?: () => void;
  /** Open the dedicated "Need attention" screen (NEED ATTENTION → View All). */
  onOpenNeedAttention?: () => void;
  /** Open an invoice's detail page (from a recent-invoice row). */
  onOpenInvoice?: (inv: { number: string; client: string; status: "Awaiting" | "Paid"; origin: "created" | "uploaded" }) => void;
  /** Build a new invoice manually. */
  onCreate?: () => void;
  /** Upload a file to extract an invoice. */
  onUpload?: () => void;
  /** Start a recurring invoice series (DES-782). */
  onRecurring?: () => void;
  /** Open the list filtered to paid invoices (Collected hero stat). */
  onOpenPaid?: () => void;
  /** Open the list filtered to outstanding/awaiting invoices (Outstanding hero stat). */
  onOpenOutstanding?: () => void;
  /** Which hero demo state to render (dev — driven by QuickNav). */
  scenario?: number;
}

/** Uppercase section header with an optional count badge + view-all affordance
    (hidden when no handler) — DS square sm Button with a chevron icon. */
function SectionHead({ title, badge, onViewAll }: { title: string; badge?: number; onViewAll?: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <p className="text-[14px] font-medium leading-[1.3]" style={{ ...FONT, color: INK }}>{title}</p>
        {badge !== undefined && (
          <span
            className="flex items-center justify-center h-[18px] px-2 rounded-[4px] text-[14px] font-medium leading-none text-white"
            style={{ ...FONT, background: "#ff4a15" }}
          >
            {badge}
          </span>
        )}
      </div>
      {onViewAll && (
        <Button hierarchy="tertiary" square size="sm" icon={<ChevronRight size={16} />} aria-label={`View all ${title.toLowerCase()}`} onClick={onViewAll} />
      )}
    </div>
  );
}


export function Dashboard({ tab = "dashboard", onOpenInvoices, onBack, onMenu, onSettings, onOpenNeedAttention, onOpenInvoice, onCreate, onUpload, onRecurring, onOpenPaid, onOpenOutstanding, scenario = 0 }: DashboardProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  // Scroll interactions: past the big header, the PageHeader collapses to its
  // "left-on-scroll" state (pinned bar) and the pill FAB shrinks to a circle;
  // scrolling back up restores both.
  const [scrolled, setScrolled] = useState(false);
  const hero = HERO_SCENARIOS[scenario] ?? HERO_SCENARIOS[0];
  // Nothing left to chase — green bar, no outstanding side.
  const fullyCollected = hero.outstandingCount === 0;
  // Nothing collected yet — drop the zero collected column, show only outstanding (left-aligned).
  const nothingCollected = hero.collectedCount === 0;

  return (
    <div className="relative bg-white rounded-[48px] overflow-hidden shadow-2xl" style={{ width: 375, height: 812 }}>
      {/* Hide the scrollbar but keep scrolling */}
      <style>{`.dash-scroll{-ms-overflow-style:none;scrollbar-width:none;}.dash-scroll::-webkit-scrollbar{display:none;}`}</style>

      {/* Scrollable content — recedes into a layer behind the sheet (book-page stack) */}
      <motion.div
        className="dash-scroll h-full overflow-y-auto bg-white"
        style={{ transformOrigin: "50% 0%" }}
        onScroll={(e) => {
          // Hysteresis: collapse past 120px, expand back under 80px — no
          // flickering while hovering around a single threshold.
          const top = e.currentTarget.scrollTop;
          setScrolled((prev) => (prev ? top > 80 : top > 120));
        }}
        animate={{
          scale: sheetOpen ? 0.92 : 1,
          y: sheetOpen ? 10 : 0,
          borderRadius: sheetOpen ? 28 : 48,
        }}
        transition={
          sheetOpen
            ? { type: "spring", stiffness: 340, damping: 34 }
            : { type: "tween", duration: 0.4, ease: [0.4, 0, 0.6, 1] }
        }
      >
      {/* Warm header wash */}
      <div
        className="flex flex-col items-center gap-3 pb-6 rounded-b-2xl"
        style={{ background: "linear-gradient(to left, rgba(246,246,246,0.8), rgba(255,243,208,0.8))" }}
      >
        {/* Status bar */}
        <div className="relative flex items-center justify-between w-full px-8 py-4">
          <span className="text-[17px] font-semibold tracking-tight" style={{ color: INK }}>9:41</span>
          <div className="absolute left-1/2 -translate-x-1/2 top-3 w-28 h-7 bg-black rounded-full" />
          <div className="flex items-center gap-1.5">
            <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
              <rect x="0" y="4" width="3" height="8" rx="0.5" fill={INK} />
              <rect x="4.5" y="2.5" width="3" height="9.5" rx="0.5" fill={INK} />
              <rect x="9" y="0.5" width="3" height="11.5" rx="0.5" fill={INK} />
              <rect x="13.5" y="0" width="3" height="12" rx="0.5" fill={INK} fillOpacity="0.3" />
            </svg>
            <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
              <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke={INK} strokeOpacity="0.35" />
              <rect x="2" y="2" width="18" height="8" rx="2" fill={INK} />
              <path d="M23 4V8C23.8 7.6 24.5 6.9 24.5 6C24.5 5.1 23.8 4.4 23 4Z" fill={INK} fillOpacity="0.4" />
            </svg>
          </div>
        </div>

        {/* Sheet header — DS PageHeader "Left align" (frosted buttons + 32px title).
            Back returns to the Accounting Hub menu; the right slot carries the
            settings gear instead of the DS default search icon. */}
        <PageHeader
          type="left"
          title="Sales Invoices"
          showBack={Boolean(onMenu || onBack)}
          onBack={onMenu ?? onBack}
          rightIcon={<Settings size={20} />}
          rightLabel="Invoice settings"
          onRightClick={onSettings}
        />

        {/* Dark hero card — DS ui/OutstandingCard (Figma node 4141-8627). */}
        <div className="w-full px-4">
          <OutstandingCard
            expected={hero.expected}
            collected={hero.collected}
            outstanding={hero.outstanding}
            percent={hero.pct}
            encouragement={hero.pct > 0 ? PEER_NOTE : undefined}
            outstandingSuffix={nothingCollected ? "to collect" : undefined}
            linkLabel={
              fullyCollected
                ? undefined
                : hero.overdue === 0
                  ? `${hero.outstandingCount} ${hero.outstandingCount === 1 ? "invoice" : "invoices"}`
                  : hero.overdue === hero.outstandingCount
                    ? `${hero.overdue} overdue`
                    : `${hero.overdue} overdue out of ${hero.outstandingCount} invoices`
            }
            onLinkClick={onOpenOutstanding}
            onCollectedClick={onOpenPaid}
          />
        </div>
      </div>

      {/* Action Required — count badge + "View All" (dedicated list only when there are more than 2 items). */}
      <div className="px-4 pt-5 flex flex-col gap-4">
        <SectionHead
          title="ACTION REQUIRED"
          badge={ATTENTION_TASKS.length}
          onViewAll={ATTENTION_TASKS.length > 2 ? onOpenNeedAttention : undefined}
        />
        <NeedAttentionStack />
      </div>

      {/* Recent Invoices — white elevated card of exactly 5 DS InvoiceRows with a
          "View All ↗" link in the card footer (Figma "Sales Invoice - Client"
          RecentInvoicesCard, node 1332-17797). Drafts show no invoice number. */}
      <div className="px-4 pt-6 pb-28 flex flex-col gap-4">
        <SectionHead title="RECENT INVOICES" onViewAll={onOpenInvoices} />
        <div className="w-full bg-white rounded-[12px] px-4 pb-4 flex flex-col items-center gap-2" style={{ boxShadow: "var(--ds-shadow-card)" }}>
          <div className="w-full flex flex-col">
            <InvoiceRow
              title="Marlow & Finch Studio" invoiceNo="INV-2026-000006" amount="$6,345.00"
              status={SHOW_CREDIT_NOTES ? "Refund Pending" : "Paid"}
              statusColor={SHOW_CREDIT_NOTES ? "warning" : "success"}
              statusCaption={SHOW_CREDIT_NOTES ? "Paid on 20 Jun 2026" : "on 20 Jun 2026"}
              creditedAmount={SHOW_CREDIT_NOTES ? "$2,450.00" : undefined}
              onClick={() => onOpenInvoice?.({ number: "INV-2026-000006", client: "Marlow & Finch Studio", status: "Paid", origin: "created" })}
              onCreditedClick={() => onOpenInvoice?.({ number: "INV-2026-000006", client: "Marlow & Finch Studio", status: "Paid", origin: "created" })}
            />
            <InvoiceRow
              title="Marlow & Finch Studio" invoiceNo="INV-2026-000005" amount="$6,430.05"
              status="Awaiting Payment" statusColor="warning" statusCaption="Due in 3 days"
              onClick={() => onOpenInvoice?.({ number: "INV-2026-000005", client: "Marlow & Finch Studio", status: "Awaiting", origin: "created" })}
            />
            <InvoiceRow
              title="Bright Harbor Co." amount="$283.23"
              status="Draft" statusColor="neutral" statusCaption="Created on 20 Jun 2026"
              onClick={() => onOpenInvoice?.({ number: "INV-2026-000003", client: "Bright Harbor Co.", status: "Awaiting", origin: "created" })}
            />
            <InvoiceRow
              title="Otto Reyes" amount="$100,034.00"
              status="Draft" statusColor="neutral" statusCaption="Created on 18 Jun 2026"
              onClick={() => onOpenInvoice?.({ number: "INV-2026-000002", client: "Otto Reyes", status: "Awaiting", origin: "created" })}
            />
            <InvoiceRow
              title="Northwind Traders" invoiceNo="INV-2026-000001" amount="$980.50"
              status="Paid" statusColor="success" statusCaption="on 12 Jun 2026" lastItem
              onClick={() => onOpenInvoice?.({ number: "INV-2026-000001", client: "Northwind Traders", status: "Paid", origin: "created" })}
            />
          </div>
          {/* Card-footer View All link (Figma Link/SentenceCase/md + arrow-up-right) */}
          <button onClick={onOpenInvoices} className="flex items-center justify-center gap-1">
            <span className="text-[16px] font-medium leading-none capitalize" style={{ ...FONT, color: INK }}>View All</span>
            <ArrowUpRight size={16} style={{ color: INK }} />
          </button>
        </div>
      </div>
      </motion.div>

      {/* Collapsed header — DS PageHeader "left-on-scroll", pinned over the page
          once the big header scrolls away; frosted warm wash so content reads
          through underneath. Hidden while the create sheet is open (page recedes). */}
      <AnimatePresence>
        {scrolled && !sheetOpen && (
          <motion.div
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ type: "tween", duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="absolute top-0 inset-x-0 z-30"
            style={{
              background: "linear-gradient(to left, rgba(246,246,246,0.85), rgba(255,243,208,0.85))",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          >
            <StatusBar />
            <PageHeader
              type="left-on-scroll"
              title="Sales Invoices"
              showBack={Boolean(onMenu || onBack)}
              onBack={onMenu ?? onBack}
              rightIcon={<Settings size={20} />}
              rightLabel="Invoice settings"
              onRightClick={onSettings}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create invoice FAB — pill with a leading + at rest; on scroll the
          `collapsed` prop morphs the SAME element into the 46px circle (label
          folds away, padding tightens), anchored to the right edge. */}
      <FAB
        collapsed={scrolled}
        iconLeft={<Plus size={20} />}
        label="Create Invoice"
        aria-label="Create invoice"
        className="absolute z-20 bottom-8 right-8"
        onClick={() => setSheetOpen(true)}
      />

      {/* Create bottom sheet */}
      <CreateInvoiceSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onManual={() => {
          setSheetOpen(false);
          onCreate?.();
        }}
        onUpload={() => {
          setSheetOpen(false);
          onUpload?.();
        }}
      />
    </div>
  );
}

export default Dashboard;
