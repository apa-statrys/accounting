import { ChevronRight } from "lucide-react";
import { FinanceBottomNav } from "./FinanceBottomNav";

import { FONT, INK, MUTED } from "../lib/theme";
import { SHOW_CREDIT_NOTES } from "../lib/flags";

interface AccountingHubProps {
  /** Back to the dashboard (the Hub is a reachable menu, not the landing). */
  onBack?: () => void;
  /** Open the Sales Invoices list. */
  onOpenSalesInvoices?: () => void;
  /** Open the Credit Notes list (DES-763). */
  onOpenCreditNotes?: () => void;
  /** Open the Customers flow. */
  onOpenCustomers?: () => void;
  /** Open the Purchase Invoices flow (not built yet). */
  onOpenPurchaseInvoices?: () => void;
}

interface EntryDef {
  id: string;
  label: string;
  onClick?: () => void;
  /** Flagged not-yet-built so stakeholders see scope at a glance. */
  soon?: boolean;
  /** Built but not released — shown as "Design in progress" (visible but inert). */
  wip?: boolean;
}

/** One tappable entry-point row inside the card (label + chevron, no leading icon). */
function EntryRow({ label, onClick, soon, wip, last }: EntryDef & { last: boolean }) {
  const inert = !onClick;
  return (
    <button
      onClick={onClick}
      disabled={inert}
      className="w-full flex items-center gap-3.5 px-4 py-4 text-left active:bg-black/[0.02] transition-colors"
      style={last ? undefined : { borderBottom: "1px solid rgba(160,160,160,0.16)" }}
    >
      <span className="flex-1 min-w-0 flex items-center gap-2">
        <span className="text-[15px] font-medium leading-tight" style={{ ...FONT, color: wip ? MUTED : INK }}>
          {label}
        </span>
        {(soon || wip) && (
          <span
            className="px-1.5 py-px rounded-full text-[10px] font-semibold leading-[14px]"
            style={{ ...FONT, background: "#f3f3f3", color: MUTED }}
          >
            {wip ? "Design in progress" : "Soon"}
          </span>
        )}
      </span>
      <ChevronRight size={18} style={{ color: "#c4c4c4" }} className="shrink-0" />
    </button>
  );
}

/** The single rounded card holding all entry rows. */
function EntryCard({ items }: { items: EntryDef[] }) {
  return (
    <div
      className="rounded-2xl overflow-hidden bg-white"
      style={{ border: "1px solid rgba(160,160,160,0.18)" }}
    >
      {items.map((item, i) => (
        <EntryRow key={item.id} {...item} last={i === items.length - 1} />
      ))}
    </div>
  );
}

/**
 * Accounting entry-point hub — a reachable Menu (opened from the dashboard), not the landing.
 * Modelled on Qonto's invoicing section: grouped by money direction (Sales = money in,
 * Purchases = money out). Credit Notes live under Sales as a peer of Sales Invoices (DES-763).
 */
export function AccountingHub({ onOpenSalesInvoices, onOpenCreditNotes, onOpenCustomers, onOpenPurchaseInvoices }: AccountingHubProps) {
  const sales: EntryDef[] = [
    { id: "sales-invoices", label: "Sales Invoices", onClick: onOpenSalesInvoices },
    // Credit Notes (DES-719/763): functional on localhost; on prod it's shown as "Design in progress"
    // (visible but inert) so stakeholders see it's coming without reaching the unfinished flow.
    { id: "credit-notes", label: "Credit Notes", onClick: SHOW_CREDIT_NOTES ? onOpenCreditNotes : undefined, wip: !SHOW_CREDIT_NOTES },
    { id: "customers", label: "Customers", onClick: onOpenCustomers },
  ];

  const purchases: EntryDef[] = [
    { id: "purchase-invoices", label: "Purchase Invoices", onClick: onOpenPurchaseInvoices, soon: true },
  ];

  return (
    <div className="relative bg-white rounded-[48px] overflow-hidden shadow-2xl" style={{ width: 375, height: 812 }}>
      <style>{`.hub-scroll{-ms-overflow-style:none;scrollbar-width:none;}.hub-scroll::-webkit-scrollbar{display:none;}`}</style>

      <div className="hub-scroll h-full overflow-y-auto bg-white">
        {/* Warm header wash */}
        <div
          className="flex flex-col gap-2 pb-6 rounded-b-2xl"
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

          {/* Title row — the Menu is the top-level parent, so there's no back arrow here. */}
          <div className="w-full px-4 flex items-center gap-2">
            <p className="text-[24px] font-black leading-none tracking-[-1px]" style={{ ...FONT, color: INK }}>
              Menu
            </p>
          </div>
        </div>

        {/* Entry-point cards — Sales (with Customers) and Purchases as separate blocks */}
        <div className="px-4 pt-6 pb-40 flex flex-col gap-4">
          <EntryCard items={sales} />
          <EntryCard items={purchases} />
        </div>
      </div>

      {/* Finance-app shell nav (Menu tab active) */}
      <FinanceBottomNav active="menu" />
    </div>
  );
}

export default AccountingHub;
