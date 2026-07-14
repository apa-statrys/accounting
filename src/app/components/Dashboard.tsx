import { useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, FilePlus, FileText, Rocket, Settings } from "lucide-react";
import { ATTENTION_TASKS } from "../data/attentionTasks";
import { HERO_SCENARIOS } from "../data/heroScenarios";
import { NeedAttentionStack } from "./NeedAttentionStack";
import { CreateInvoiceSheet } from "./CreateInvoiceSheet";
import { Button } from "./Buttons";

import { FONT, INK } from "../lib/theme";
import { SHOW_CREDIT_NOTES } from "../lib/flags";
const GREEN = "#006a1d";

/** Peer-benchmark note shown under the hero card in every scenario. */
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

/** Uppercase section header with an optional count badge + "View All" affordance (hidden when no handler). */
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
        <button onClick={onViewAll} className="flex items-center gap-1 h-[30px]">
          <span className="text-[14px] font-medium uppercase leading-none" style={{ ...FONT, color: INK }}>View All</span>
          <ChevronRight size={16} style={{ color: INK }} />
        </button>
      )}
    </div>
  );
}

/** Recent-invoice status pill styling (Figma 757:10561 recent list). */
const RECENT_PILL: Record<string, { bg: string; border: string; text: string }> = {
  "Refund Pending": { bg: "transparent", border: "#d08700", text: "#d08700" },
  "Awaiting Payment": { bg: "#f9f5ea", border: "#ff4a15", text: "#ff4a15" },
  Draft: { bg: "#faf9f4", border: "rgba(160,160,160,0.2)", text: "#808080" },
  Paid: { bg: "#ebfcef", border: "#a3e9b6", text: GREEN },
};

interface RecentInvoice {
  client: string;
  number: string;
  meta: string;
  amount: string;
  status: keyof typeof RECENT_PILL;
  /** Credit-note summary sub-row (shown on refund/credited invoices). */
  creditNote?: { count: number; label: string; amount: string };
  onClick?: () => void;
  onOpenCN?: () => void;
}

/** Recent-invoice card — same cream dashed card as the Sales Invoice List. */
function RecentInvoiceCard({ client, number, meta, amount, status, creditNote, onClick, onOpenCN }: RecentInvoice) {
  const pill = RECENT_PILL[status];
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-[#faf9f4] border border-dashed border-[rgba(160,160,160,0.2)] rounded-xl p-[17px] flex flex-col gap-2 active:bg-[#f4f1e6] transition-colors"
    >
      <div className="w-full flex items-center gap-3">
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <p className="text-[16px] font-medium leading-[0.9] tracking-[-0.8px] text-[#101828] truncate" style={FONT}>{client}</p>
          <div className="flex flex-col gap-0.5">
            <p className="text-[12px] font-medium leading-[1.3] text-[#1b1b1b] truncate" style={FONT}>{number}</p>
            <p className="text-[12px] font-medium leading-[1.3] text-[#808080] truncate" style={FONT}>{meta}</p>
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1">
          <p className="text-[16px] font-bold leading-[1.3] text-[#101828] whitespace-nowrap" style={FONT}>{amount}</p>
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold leading-[15px] whitespace-nowrap"
            style={{ ...FONT, background: pill.bg, borderColor: pill.border, color: pill.text }}
          >
            {status}
          </span>
        </div>
      </div>

      {/* Credit-note summary sub-row (divider + count + amount + View) */}
      {creditNote && (
        <>
          <div className="h-px w-full bg-[rgba(160,160,160,0.25)]" />
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onOpenCN?.(); }}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-start gap-1">
              <FileText size={14} className="mt-0.5 shrink-0" style={{ color: "#1b1b1b" }} />
              <div className="flex flex-col gap-0.5">
                <p className="text-[12px] font-bold leading-[1.3] text-black" style={FONT}>{creditNote.count} Credit Note{creditNote.count > 1 ? "s" : ""}</p>
                <p className="text-[12px] font-medium leading-[15px] text-[#808080]" style={FONT}>{creditNote.label}: {creditNote.amount}</p>
              </div>
            </div>
            <span className="text-[10px] font-bold leading-[15px] text-[#1b1b1b]" style={FONT}>{"View >"}</span>
          </div>
        </>
      )}
    </button>
  );
}

/** Credit-card-with-dollar icon (duotone), tuned for the dark hero card. */
function CreditCardDollar({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect x="3" y="7" width="22" height="15" rx="3" fill="white" fillOpacity="0.12" />
      <rect x="3" y="7" width="22" height="15" rx="3" stroke="white" strokeWidth="1.6" />
      <path d="M3 12 H25" stroke="white" strokeWidth="1.6" />
      <circle cx="23" cy="23.5" r="6.6" fill="#1b1b1b" stroke="white" strokeWidth="1.6" />
      <path
        d="M23 19.7 V27.3 M24.9 21 c-0.5 -0.6 -1.2 -0.9 -1.9 -0.9 c-1 0 -1.9 0.55 -1.9 1.45 c0 0.9 0.85 1.2 1.9 1.4 c1.05 0.2 1.9 0.55 1.9 1.45 c0 0.9 -0.9 1.45 -1.9 1.45 c-0.75 0 -1.55 -0.3 -2.05 -0.95"
        stroke="white"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Dashboard({ tab = "dashboard", onOpenInvoices, onBack, onMenu, onSettings, onOpenNeedAttention, onOpenInvoice, onCreate, onUpload, onRecurring, onOpenPaid, onOpenOutstanding, scenario = 0 }: DashboardProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
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

        {/* Sheet header */}
        <div className="flex items-center justify-between w-full px-4 py-3">
          {onBack && (
            <button onClick={onBack} aria-label="Back" className="size-[30px] rounded-full flex items-center justify-center mr-1">
              <ChevronLeft size={16} style={{ color: INK }} />
            </button>
          )}
          {/* Back arrow in front of the title returns to the Accounting Hub menu (the menu is the parent). */}
          {onMenu ? (
            <button onClick={onMenu} aria-label="Back to menu" className="flex-1 flex items-center gap-1.5">
              <ChevronLeft size={22} style={{ color: INK }} />
              <span className="text-[20px] font-black leading-none tracking-[-1px]" style={{ ...FONT, color: INK }}>Sales Invoices</span>
            </button>
          ) : (
            <p className="flex-1 text-[20px] font-black leading-none tracking-[-1px]" style={{ ...FONT, color: INK }}>Sales Invoices</p>
          )}
          <div className="flex items-center">
            {/* Notifications bell removed for now. */}
            <button onClick={onSettings} aria-label="Invoice settings" className="size-10 rounded-full flex items-center justify-center">
              <Settings size={20} style={{ color: INK }} />
            </button>
          </div>
        </div>

        {/* Dark hero card (Figma 757:10561) — layered: Expected + Collected on top, Outstanding behind */}
        <div className="w-full px-4">
          <div className="relative flex flex-col isolate">
            {/* Top block — Expected this month + Collected sub-card (overlaps the Outstanding block below) */}
            <div
              className="relative z-[2] -mb-[31px] flex flex-col gap-4 rounded-[16px] bg-[#1b1b1b] p-4"
              style={{ filter: "drop-shadow(0px 10px 15px rgba(255,255,255,0.07))" }}
            >
              {/* Expected this month */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <p className="text-[16px] leading-[1.3] text-[#f9f5ea]" style={FONT}>Expected this month</p>
                  <p className="leading-none text-[#f9f5ea]" style={FONT}>
                    <span className="text-[12px]">HKD </span>
                    <span className="text-[24px] font-black tracking-[-1.2px]">{hero.expected}</span>
                  </p>
                </div>
                <CreditCardDollar size={32} />
              </div>

              {/* Collected sub-card — amount + % + progress + peer note (tappable → Paid list) */}
              <div
                role="button"
                tabIndex={0}
                onClick={onOpenPaid}
                className="w-full flex flex-col gap-2 rounded-[8px] border border-[rgba(160,160,160,0.2)] p-2"
              >
                <div className="flex items-start gap-1 w-full">
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <p className="text-[12px] font-medium leading-[1.3] text-[rgba(249,245,234,0.7)]" style={FONT}>Collected</p>
                    <p className="leading-none text-[#f9f5ea]" style={FONT}>
                      <span className="text-[12px]">HKD </span>
                      <span className="text-[18px] font-bold tracking-[-0.9px]">{hero.collected}</span>
                    </p>
                  </div>
                  <p className="text-[20px] font-bold leading-[1.1] text-center whitespace-nowrap" style={{ ...FONT, color: "#ebfcef" }}>
                    {hero.pct}%
                  </p>
                </div>
                <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "#3d3d3d" }}>
                  <div
                    className="h-1.5 rounded-full transition-[width] duration-500"
                    style={{
                      width: `${hero.pct}%`,
                      backgroundImage: fullyCollected
                        ? "linear-gradient(90deg, #00a838, #34c759)"
                        : "linear-gradient(3.5deg, #ff4a15 27%, #ff553a 40%, #ff6264 57%, #ff6c86 75%, #ff74a1 93%, #ff7ac0 129%)",
                    }}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <Rocket size={14} className="shrink-0 text-[#f9f5ea]" />
                  <p className="text-[10px] leading-[1.3] tracking-[-0.5px] text-[#f9f5ea]" style={FONT}>{PEER_NOTE}</p>
                </div>
              </div>
            </div>

            {/* Bottom block — Outstanding (sits behind the top block; padded to clear the overlap) */}
            <div className="relative z-[1] flex flex-col gap-1 rounded-b-[16px] bg-[#1b1b1b] px-4 pb-4 pt-[43px]">
              <div className="flex items-center gap-4 w-full">
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <p className="text-[12px] font-medium leading-[1.3] text-[rgba(249,245,234,0.7)]" style={FONT}>Outstanding</p>
                  <p className="leading-none text-[#f9f5ea]" style={FONT}>
                    <span className="text-[12px]">HKD </span>
                    <span className="text-[18px] font-bold tracking-[-0.9px]">{hero.outstanding}</span>
                    {nothingCollected && <span className="text-[12px] text-[rgba(249,245,234,0.7)]"> to collect</span>}
                  </p>
                  <p className="text-[12px] font-medium leading-[1.3]" style={FONT}>
                    {hero.overdue === 0 ? (
                      <span className="text-[#f9f5ea]">{hero.outstandingCount} {hero.outstandingCount === 1 ? "invoice" : "invoices"}</span>
                    ) : hero.overdue === hero.outstandingCount ? (
                      <>
                        <span className="text-[#ff4a15]">{hero.overdue} overdue </span>
                        <span className="text-[#f9f5ea]">{hero.overdue === 1 ? "invoice" : "invoices"}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-[#ff4a15]">{hero.overdue} overdue </span>
                        <span className="text-[#f9f5ea]">out of {hero.outstandingCount} invoices</span>
                      </>
                    )}
                  </p>
                </div>
                {!fullyCollected && (
                  <button
                    onClick={onOpenOutstanding}
                    className="shrink-0 h-[30px] px-3 rounded-full flex items-center justify-center"
                    style={{ backgroundImage: "linear-gradient(17.58deg, #ff4a15 15.7%, #ff553a 43.7%, #ff7fc4 153%)" }}
                  >
                    <span className="text-[14px] font-medium uppercase leading-none text-[#f9f5ea]" style={FONT}>View All</span>
                  </button>
                )}
              </div>
            </div>
          </div>
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

      {/* Recent Invoices — same cream dashed invoice card as the Sales Invoice List (≥5 shown). */}
      <div className="px-4 pt-6 pb-28 flex flex-col gap-4">
        <SectionHead title="RECENT INVOICES" onViewAll={onOpenInvoices} />
        <div className="flex flex-col gap-2">
          <RecentInvoiceCard
            client="Marlow & Finch Studio" number="INV-2026-000006" meta="Paid on 20 Jun 2026" amount="$6,345.00"
            status={SHOW_CREDIT_NOTES ? "Refund Pending" : "Paid"}
            creditNote={SHOW_CREDIT_NOTES ? { count: 1, label: "Refund amount", amount: "$2,450.00" } : undefined}
            onClick={() => onOpenInvoice?.({ number: "INV-2026-000006", client: "Marlow & Finch Studio", status: "Paid", origin: "created" })}
            onOpenCN={() => onOpenInvoice?.({ number: "INV-2026-000006", client: "Marlow & Finch Studio", status: "Paid", origin: "created" })}
          />
          <RecentInvoiceCard
            client="Marlow & Finch Studio" number="INV-2026-000005" meta="Due 25 Jun 2026" amount="$6,430.05" status="Awaiting Payment"
            onClick={() => onOpenInvoice?.({ number: "INV-2026-000005", client: "Marlow & Finch Studio", status: "Awaiting", origin: "created" })}
          />
          <RecentInvoiceCard
            client="Bright Harbor Co." number="INV-2026-000003" meta="Created 20 Jun 2026" amount="$283.23" status="Draft"
            onClick={() => onOpenInvoice?.({ number: "INV-2026-000003", client: "Bright Harbor Co.", status: "Awaiting", origin: "created" })}
          />
          <RecentInvoiceCard
            client="Otto Reyes" number="INV-2026-000002" meta="Created 18 Jun 2026" amount="$100,034.00" status="Draft"
            onClick={() => onOpenInvoice?.({ number: "INV-2026-000002", client: "Otto Reyes", status: "Awaiting", origin: "created" })}
          />
          <RecentInvoiceCard
            client="Northwind Traders" number="INV-2026-000001" meta="Paid on 12 Jun 2026" amount="$980.50" status="Paid"
            onClick={() => onOpenInvoice?.({ number: "INV-2026-000001", client: "Northwind Traders", status: "Paid", origin: "created" })}
          />
        </div>

        {/* Secondary "View all invoices" after the 5th recent row */}
        <Button variant="secondary" className="w-full" onClick={onOpenInvoices}>
          View all invoices
        </Button>
      </div>
      </motion.div>

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
