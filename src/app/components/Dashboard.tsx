import { useState } from "react";
import { motion } from "motion/react";
import { Bell, ChevronLeft, ChevronRight, FilePlus, Settings } from "lucide-react";
import { ATTENTION_TASKS } from "./NeedAttention";
import { NeedAttentionStack } from "./NeedAttentionStack";
import { CreateInvoiceSheet } from "./CreateInvoiceSheet";

const FONT = { fontFamily: "GT Walsheim LC, sans-serif" } as const;
const INK = "#1b1b1b";
const MUTED = "#808080";
const GREEN = "#006a1d";

/** Peer-benchmark note shown under the hero card in every scenario. */
const PEER_NOTE = "You’re ahead of 71% of similar businesses this month";

/** Hero-card demo states (dev switcher). Collected + Outstanding = Expected; pct = collected/expected. */
interface HeroScenario {
  label: string;
  expected: string;
  pct: number;
  collected: string;
  collectedCount: number;
  outstanding: string;
  outstandingCount: number;
  /** Overdue invoices within the outstanding count. */
  overdue: number;
}

export const HERO_SCENARIOS: HeroScenario[] = [
  {
    label: "Happy path",
    expected: "20,000.00", pct: 75,
    collected: "15,000.00", collectedCount: 6,
    outstanding: "5,000.00", outstandingCount: 2, overdue: 0,
  },
  {
    label: "Some overdue",
    expected: "20,000.00", pct: 75,
    collected: "15,000.00", collectedCount: 6,
    outstanding: "5,000.00", outstandingCount: 2, overdue: 1,
  },
  {
    label: "All overdue",
    expected: "20,000.00", pct: 75,
    collected: "15,000.00", collectedCount: 6,
    outstanding: "5,000.00", outstandingCount: 2, overdue: 2,
  },
  {
    label: "Fully collected",
    expected: "20,000.00", pct: 100,
    collected: "20,000.00", collectedCount: 8,
    outstanding: "0.00", outstandingCount: 0, overdue: 0,
  },
  {
    label: "Nothing collected",
    expected: "20,000.00", pct: 0,
    collected: "0.00", collectedCount: 0,
    outstanding: "20,000.00", outstandingCount: 8, overdue: 0,
  },
];

interface DashboardProps {
  tab?: "dashboard" | "invoices" | "search";
  onOpenDashboard?: () => void;
  onOpenInvoices?: () => void;
  onOpenSearch?: () => void;
  /** Back out of the Sales Invoices section (to the Accounting hub). */
  onBack?: () => void;
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
  /** Open the list filtered to paid invoices (Collected hero stat). */
  onOpenPaid?: () => void;
  /** Open the list filtered to outstanding/awaiting invoices (Outstanding hero stat). */
  onOpenOutstanding?: () => void;
  /** Which hero demo state to render (dev — driven by QuickNav). */
  scenario?: number;
}

/** Uppercase section header with an optional "View All" affordance (hidden when no handler). */
function SectionHead({ title, onViewAll }: { title: string; onViewAll?: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <p className="flex-1 text-[14px] font-medium leading-[1.3]" style={{ ...FONT, color: INK }}>{title}</p>
      {onViewAll && (
        <button onClick={onViewAll} className="flex items-center gap-1 h-[30px]">
          <span className="text-[14px] font-medium uppercase leading-none" style={{ ...FONT, color: INK }}>View All</span>
          <ChevronRight size={16} style={{ color: INK }} />
        </button>
      )}
    </div>
  );
}

function Badge({ kind }: { kind: "paid" | "awaiting" }) {
  const paid = kind === "paid";
  return (
    <span
      className="px-2 py-0.5 rounded-full border text-[10px] font-bold leading-[15px]"
      style={{
        ...FONT,
        background: paid ? "#ebfcef" : "#f9f5ea",
        borderColor: paid ? "#a3e9b6" : "#ff4a15",
        color: paid ? GREEN : "#ff4a15",
      }}
    >
      {paid ? "Paid" : "Awaiting Payment"}
    </span>
  );
}

function InvoiceRow({ client, meta, amount, kind, onClick }: { client: string; meta: string; amount: string; kind: "paid" | "awaiting"; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-full bg-[#faf9f4] border border-dashed border-[rgba(160,160,160,0.2)] rounded-xl p-[17px] flex items-center gap-3 text-left active:bg-[#f4f1e6] transition-colors">
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <p className="text-[16px] font-medium leading-[0.9] tracking-tight text-[#101828] truncate" style={FONT}>{client}</p>
        <p className="text-[12px] font-medium leading-[1.3]" style={{ ...FONT, color: MUTED }}>{meta}</p>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-1">
        <p className="text-[16px] font-bold leading-[1.3] text-[#101828]" style={FONT}>{amount}</p>
        <Badge kind={kind} />
      </div>
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

export function Dashboard({ tab = "dashboard", onOpenInvoices, onBack, onSettings, onOpenNeedAttention, onOpenInvoice, onCreate, onUpload, onOpenPaid, onOpenOutstanding, scenario = 0 }: DashboardProps) {
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
          <button onClick={onBack ?? onOpenInvoices} aria-label="Back" className="size-[30px] rounded-full flex items-center justify-center">
            <ChevronLeft size={16} style={{ color: INK }} />
          </button>
          <p className="flex-1 text-[20px] font-black leading-none tracking-[-1px]" style={{ ...FONT, color: INK }}>Sales Invoices</p>
          <div className="flex items-center">
            <button className="relative size-10 rounded-full flex items-center justify-center">
              <Bell size={20} style={{ color: INK }} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#ff4a15]" />
            </button>
            <button onClick={onSettings} aria-label="Invoice settings" className="size-10 rounded-full flex items-center justify-center">
              <Settings size={20} style={{ color: INK }} />
            </button>
          </div>
        </div>

        {/* Dark hero card (Figma 484:4564) — Collected + Outstanding glassy sub-cards */}
        <div className="w-full px-4">
          <div
            className="relative overflow-hidden rounded-[24px] px-4 pt-7 pb-4"
            style={{ backgroundImage: "linear-gradient(265deg, #1b1b1b 13%, rgba(27,27,27,0.9) 102%)" }}
          >
            {/* Decorative swoosh */}
            <svg className="absolute -left-3 top-0 h-full pointer-events-none" width="243" height="254" viewBox="0 0 243 254" fill="none" aria-hidden>
              <path d="M-20 40 C 80 120, 180 60, 270 170" stroke="rgba(255,255,255,0.05)" strokeWidth="60" fill="none" />
            </svg>

            <div className="relative flex flex-col gap-3">
              {/* Expected this month — aligned to the same 16px inset as the cards */}
              <div>
                <div className="flex items-center gap-1">
                  <p className="flex-1 text-[16px] leading-[1.3] text-white" style={FONT}>Expected this month</p>
                  <CreditCardDollar size={28} />
                </div>
                <p className="mt-1 leading-none text-white" style={FONT}>
                  <span className="text-[12px]">HKD </span>
                  <span className="text-[18px] font-bold tracking-[-0.9px]">{hero.expected}</span>
                </p>
              </div>

              {/* Collected card — amount + % + progress + peer note (tappable → Paid list) */}
              <button
                onClick={onOpenPaid}
                className="w-full text-left rounded-[6px] border border-white/20 backdrop-blur-[12px] p-2 flex flex-col gap-[5px]"
              >
                <div className="flex items-start justify-between w-full">
                  <div className="flex flex-col gap-[5px]">
                    <p className="text-[14px] leading-[1.3] text-white" style={FONT}>Collected</p>
                    <p className="leading-none text-white" style={FONT}>
                      <span className="text-[12px]">HKD </span>
                      <span className="text-[16px] font-medium">{hero.collected}</span>
                    </p>
                  </div>
                  <p className="text-[20px] font-bold leading-[1.1] text-right whitespace-nowrap" style={{ ...FONT, color: "#58c67f" }}>
                    {hero.pct}%
                  </p>
                </div>
                <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: "#919191" }}>
                  <div
                    className="h-2 rounded-full transition-[width] duration-500"
                    style={{
                      width: `${hero.pct}%`,
                      backgroundImage: fullyCollected
                        ? "linear-gradient(90deg, #00a838, #34c759)"
                        : "linear-gradient(3.5deg, #ff4a15 27%, #ff553a 40%, #ff6264 57%, #ff6c86 75%, #ff74a1 93%, #ff7ac0 129%)",
                    }}
                  />
                </div>
                <p className="text-[10px] leading-[1.3] tracking-[-0.5px] text-[#a0a0a0]" style={FONT}>{PEER_NOTE}</p>
              </button>

              {/* Outstanding card — amount + overdue line + View All (→ Outstanding list) */}
              {!fullyCollected && (
                <div className="w-full rounded-[6px] bg-white/10 backdrop-blur-[12px] p-2 flex items-center gap-[5px]">
                  <div className="flex-1 min-w-0 flex flex-col gap-[5px]">
                    <p className="text-[14px] leading-[1.3] text-white" style={FONT}>Outstanding</p>
                    <p className="leading-none text-white" style={FONT}>
                      <span className="text-[12px]">HKD </span>
                      <span className="text-[16px] font-medium">{hero.outstanding}</span>
                      {nothingCollected && <span className="text-[12px] text-white/70"> to collect</span>}
                    </p>
                    <p className="text-[13px] font-medium leading-[1.3]" style={FONT}>
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
                  <button
                    onClick={onOpenOutstanding}
                    className="shrink-0 h-[30px] px-3 rounded-[4px] border border-[#f9f5ea] flex items-center justify-center"
                  >
                    <span className="text-[14px] font-medium uppercase leading-none text-white" style={FONT}>View All</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Need Attention — "View All" + dedicated list only when there are more than 2 items. */}
      <div className="px-4 pt-5 flex flex-col gap-4">
        <SectionHead
          title={`NEEDS ATTENTION (${ATTENTION_TASKS.length})`}
          onViewAll={ATTENTION_TASKS.length > 2 ? onOpenNeedAttention : undefined}
        />
        <NeedAttentionStack />
      </div>

      {/* Recent Invoices */}
      <div className="px-4 pt-6 pb-28 flex flex-col gap-4">
        <SectionHead title="RECENT INVOICES" onViewAll={onOpenInvoices} />
        <div className="flex flex-col gap-2">
          <InvoiceRow client="Marlow & Finch Studio" meta="INV-2026-00006 · Payment received" amount="$6,430.05" kind="paid"
            onClick={() => onOpenInvoice?.({ number: "INV-2026-00006", client: "Marlow & Finch Studio", status: "Paid", origin: "created" })} />
          <InvoiceRow client="Marlow & Finch Studio" meta="INV-2026-00005 · Due 25 Jun 2026" amount="$6,430.05" kind="awaiting"
            onClick={() => onOpenInvoice?.({ number: "INV-2026-00005", client: "Marlow & Finch Studio", status: "Awaiting", origin: "created" })} />
          <InvoiceRow client="Marlow & Finch Studio" meta="INV-2026-00004 · Payment received" amount="$6,430.05" kind="paid"
            onClick={() => onOpenInvoice?.({ number: "INV-2026-00004", client: "Marlow & Finch Studio", status: "Paid", origin: "created" })} />
          <InvoiceRow client="Northwind Traders" meta="INV-2026-00007 · Due 05 Jun 2026" amount="$2,150.00" kind="awaiting"
            onClick={() => onOpenInvoice?.({ number: "INV-2026-00007", client: "Northwind Traders", status: "Awaiting", origin: "created" })} />
          <InvoiceRow client="Lumen Creative" meta="INV-2026-00001 · Payment received" amount="$980.50" kind="paid"
            onClick={() => onOpenInvoice?.({ number: "INV-2026-00001", client: "Lumen Creative", status: "Paid", origin: "created" })} />
        </div>

        {/* Secondary "View all invoices" after the 5th recent row */}
        <button
          onClick={onOpenInvoices}
          className="w-full h-11 rounded-full border border-[rgba(27,27,27,0.15)] flex items-center justify-center text-[15px] font-medium text-[#1b1b1b] active:bg-[#f4f1e6] transition-colors"
          style={FONT}
        >
          View all invoices
        </button>
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
