import { useState } from "react";
import { ArrowUpRight, ChevronRight, Plus, Settings } from "lucide-react";
import { ATTENTION_TASKS } from "../data/attentionTasks";
import { HERO_SCENARIOS } from "../data/heroScenarios";
import { NeedAttentionStack } from "../components/NeedAttentionStack";
import { PageAppHeader } from "../components/PageAppHeader";
import { Button } from "../ui/Button";
import { CreateInvoiceSheet } from "../components/CreateInvoiceSheet";
import { FAB } from "../ui/FAB";
import { OutstandingCard } from "../ui/OutstandingCard";
import { PageHeader } from "../ui/PageHeader";
import { InvoiceRow } from "../ui/InvoiceRow";

import { INK, MUTED } from "../lib/theme";
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

/** Section header — Figma "Sales Invoice - Client" SectionTitle (node 1323-15902/15910):
    a `card-title-md` (18px mobile) title with EITHER an inline count badge (Action Required)
    OR a stacked body-sm subtitle (Recent Invoices "last 5 invoices"), plus a 30px chevron
    button. The flat-brand count badge isn't a ui/Badge variant (that one's a gradient), so
    it stays local. */
function SectionHead({ title, subtitle, badge, onViewAll }: { title: string; subtitle?: string; badge?: number; onViewAll?: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 min-w-0">
        {subtitle ? (
          <div className="flex flex-col gap-0.5">
            <p className="card-title-md" style={{ color: INK }}>{title}</p>
            <p className="body-sm" style={{ color: MUTED }}>{subtitle}</p>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <p className="card-title-md" style={{ color: INK }}>{title}</p>
            {badge !== undefined && (
              <span
                className="body-sm-medium flex items-center justify-center h-[18px] px-2 rounded-[4px] text-white"
                style={{ background: "var(--bg-brand-primary)" }}
              >
                {badge}
              </span>
            )}
          </div>
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
    <div className="relative rounded-[48px] overflow-hidden shadow-2xl" style={{ width: 375, height: 812, background: "var(--bg-beige-secondary)" }}>
      {/* Hide the scrollbar but keep scrolling */}
      <style>{`.dash-scroll{-ms-overflow-style:none;scrollbar-width:none;}.dash-scroll::-webkit-scrollbar{display:none;}`}</style>

      {/* Scrollable content — stays in place; the open sheet dims it with its own scrim
          (no page recede/scale — see CLAUDE.md "Sheet motion"). Page background is
          Bg/Beige/secondary (#f3ecda) per Figma "Sales Invoice — Client" Main frame
          (node 1323-15895); white cards sit on top of it. */}
      <div
        className="dash-scroll h-full overflow-y-auto"
        style={{ background: "var(--bg-beige-secondary)" }}
        onScroll={(e) => {
          // Hysteresis: collapse past 120px, expand back under 80px — no
          // flickering while hovering around a single threshold.
          const top = e.currentTarget.scrollTop;
          setScrolled((prev) => (prev ? top > 80 : top > 120));
        }}
      >
      {/* Sticky frosted app header (components/PageAppHeader) — pinned for the
          whole page, transparent at rest, frosted glass on scroll. `collapsed`
          (same pattern as FAB) morphs the SAME PageHeader in place — title
          slides up next to the back button — kept in sync with the header's
          frosted state via the shared `scrolled` flag. */}
      <PageAppHeader scrolled={scrolled}>
        {/* Sheet header — DS PageHeader "Left align" (frosted buttons + 32px title).
            Back returns to the Accounting Hub menu; the right slot carries the
            settings gear instead of the DS default search icon. */}
        <PageHeader
          type="left"
          collapsed={scrolled}
          title="Sales Invoices"
          showBack={Boolean(onMenu || onBack)}
          onBack={onMenu ?? onBack}
          rightIcon={<Settings size={20} />}
          rightLabel="Invoice settings"
          onRightClick={onSettings}
        />
      </PageAppHeader>

      {/* Hero section wash — Figma "Sales Invoice — Client" hero Section
          (node 1323-15897): a vertical Bg/Beige/secondary (#f3ecda) → white
          gradient. Beige at the top matches the frame behind the header;
          white at the bottom blends into the white body sections below. */}
      <div
        className="flex flex-col items-center gap-3 pb-6"
        style={{ background: "linear-gradient(180deg, var(--bg-beige-secondary) 0%, #FFFFFF 100%)" }}
      >
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

      {/* Action Required — count badge + "View All" (dedicated list only when there are more than 2 items).
          White section (Figma Bg/Neutral/primary) — the beige frame only shows at the top behind
          the header; the body below the hero is white, cards separated by shadow. */}
      <div className="px-4 pt-5 flex flex-col gap-4 bg-white">
        <SectionHead
          title="Action Required"
          badge={ATTENTION_TASKS.length}
          onViewAll={ATTENTION_TASKS.length > 2 ? onOpenNeedAttention : undefined}
        />
        <NeedAttentionStack />
      </div>

      {/* Recent Invoices — white elevated card of exactly 5 DS InvoiceRows with a
          "View All ↗" link in the card footer (Figma "Sales Invoice - Client"
          RecentInvoicesCard, node 1332-17797). Drafts show no invoice number. */}
      <div className="px-4 pt-6 pb-20 flex flex-col gap-4 bg-white">
        <SectionHead title="Recent Invoices" subtitle="last 5 invoices" onViewAll={onOpenInvoices} />
        <div className="w-full bg-white rounded-[12px] px-4 pb-4 flex flex-col items-center gap-2" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="w-full flex flex-col">
            <InvoiceRow
              title="Marlow & Finch Studio" invoiceNo="INV-2026-000006" amount="USD 6,345.00"
              status={SHOW_CREDIT_NOTES ? "Refund Pending" : "Paid"}
              statusColor={SHOW_CREDIT_NOTES ? "warning" : "success"}
              statusCaption={SHOW_CREDIT_NOTES ? "Paid on 20 Jun 2026" : "on 20 Jun 2026"}
              creditedAmount={SHOW_CREDIT_NOTES ? "USD 2,450.00" : undefined}
              onClick={() => onOpenInvoice?.({ number: "INV-2026-000006", client: "Marlow & Finch Studio", status: "Paid", origin: "created" })}
              onCreditedClick={() => onOpenInvoice?.({ number: "INV-2026-000006", client: "Marlow & Finch Studio", status: "Paid", origin: "created" })}
            />
            <InvoiceRow
              title="Marlow & Finch Studio" invoiceNo="INV-2026-000005" amount="USD 6,430.05"
              status="Awaiting Payment" statusColor="warning" statusCaption="Due in 3 days"
              onClick={() => onOpenInvoice?.({ number: "INV-2026-000005", client: "Marlow & Finch Studio", status: "Awaiting", origin: "created" })}
            />
            <InvoiceRow
              title="Bright Harbor Co." amount="USD 283.23"
              status="Draft" statusColor="neutral" statusCaption="Created on 20 Jun 2026"
              onClick={() => onOpenInvoice?.({ number: "INV-2026-000003", client: "Bright Harbor Co.", status: "Awaiting", origin: "created" })}
            />
            <InvoiceRow
              title="Otto Reyes" amount="USD 100,034.00"
              status="Draft" statusColor="neutral" statusCaption="Created on 18 Jun 2026"
              onClick={() => onOpenInvoice?.({ number: "INV-2026-000002", client: "Otto Reyes", status: "Awaiting", origin: "created" })}
            />
            <InvoiceRow
              title="Northwind Traders" invoiceNo="INV-2026-000001" amount="USD 980.50"
              status="Paid" statusColor="success" statusCaption="on 12 Jun 2026" lastItem
              onClick={() => onOpenInvoice?.({ number: "INV-2026-000001", client: "Northwind Traders", status: "Paid", origin: "created" })}
            />
          </div>
          {/* Card-footer View All link (Figma Link/SentenceCase/md + arrow-up-right) */}
          <button onClick={onOpenInvoices} className="flex items-center justify-center gap-1">
            <span className="link-sentence-md" style={{ color: INK }}>View All</span>
            <ArrowUpRight size={16} style={{ color: INK }} />
          </button>
        </div>
      </div>
      </div>

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
