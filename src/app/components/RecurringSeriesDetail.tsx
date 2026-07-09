import { useState } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronDownIcon from "@mui/icons-material/KeyboardArrowDown";
import MenuIcon from "@mui/icons-material/Menu";
import { Repeat, XCircle } from "lucide-react";
import StatusBar from "./StatusBar";
import { SheetHeader, HeaderIconButton } from "./SheetHeader";
import { ButtonDock } from "./ButtonDock";
import { BottomSheet } from "./BottomSheet";
import { FONT } from "./../lib/theme";
import type { DetailStatus } from "../types";

type SeriesStatus = "Active" | "Paused" | "Cancelled";

interface RecurringSeriesDetailProps {
  status: SeriesStatus;
  customerName: string;
  amountLabel: string;
  frequency: string;
  startDate: string;
  nextDate: string;
  ends: string;
  autoSend: boolean;
  onBack?: () => void;
  onEdit?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  /** Open a generated invoice from the log (DES-782 AC5 — navigate to any individual invoice). */
  onOpenInvoice?: (inv: { number: string; status: DetailStatus; scheduled?: boolean }) => void;
  /** The series' invoices (log). More than 3 collapses behind "Show more". */
  invoices?: { number: string; label: string; date: string; amount?: string; status: DetailStatus; kind: "paid" | "await" | "scheduled" }[];
}

const CARD_SHADOW = "0px 4px 14px 0px rgba(226,220,203,0.3)";

// The series status pill (top card).
const STATUS_PILL: Record<SeriesStatus, { bg: string; text: string }> = {
  Active: { bg: "#ebfcef", text: "#006a1d" },
  Paused: { bg: "#fff7e6", text: "#b45309" },
  Cancelled: { bg: "#f4f4f4", text: "#808080" },
};

/** A label/value row in the Schedule Details card. */
function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 px-4 pt-4 pb-[17px] ${last ? "" : "border-b border-[rgba(160,160,160,0.2)]"}`}>
      <span className="text-[14px] leading-[1.3]" style={{ ...FONT, color: "#1b1b1b" }}>{label}</span>
      <span className="text-[14px] font-medium leading-[1.3] text-right" style={{ ...FONT, color: "#101828" }}>{value}</span>
    </div>
  );
}

/**
 * Recurring series detail (DES-782, Figma 1039:7613) — opened from the invoice's Recurring card. A status
 * card (series status + customer + amount/invoice), Schedule Details, the Invoices log (count badge +
 * status pills + Show more), and a Pause/Edit dock. Cancel lives in the ⋯ menu.
 */
export function RecurringSeriesDetail({
  status, customerName, amountLabel, frequency, startDate, ends, autoSend,
  onBack, onEdit, onPause, onResume, onCancel, onOpenInvoice, invoices = [],
}: RecurringSeriesDetailProps) {
  const active = status === "Active";
  const cancelled = status === "Cancelled";
  const sp = STATUS_PILL[status];
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Invoice log (AC5). `kind` drives the pill + label; a cancelled series drops the not-yet-generated
  // (scheduled) rows. More than 3 collapses behind "Show more".
  // Rows only ever show invoice-lifecycle statuses. The series' Active/Paused/Completed state lives on
  // the top status card — never as a per-invoice "Paused" (that would leak series scope onto an invoice).
  const kindMeta = {
    paid: { label: "Paid", bg: "#ebfcef", text: "#006a1d" },
    await: { label: "Awaiting Payment", bg: "#fef9c2", text: "#d08700" },
    scheduled: { label: "Scheduled", bg: "#f5f4f1", text: "#808080" },
  } as const;
  const visible = cancelled ? invoices.filter((r) => r.kind !== "scheduled") : invoices;
  const shown = visible.length > 3 && !expanded ? visible.slice(0, 3) : visible;

  return (
    <div className="relative bg-[#F9F5EA] rounded-[48px] overflow-hidden shadow-2xl flex flex-col" style={{ width: 375, height: 812 }}>
      <StatusBar />

      <SheetHeader
        title="Recurring Schedule"
        type="inside-page"
        state="fixed"
        leading={<HeaderIconButton aria-label="Back" onClick={onBack}><ChevronLeftIcon /></HeaderIconButton>}
        trailing={
          cancelled
            ? <span className="w-[30px] h-[30px] block" aria-hidden />
            : <HeaderIconButton aria-label="Actions" onClick={() => setMenuOpen(true)}><MenuIcon /></HeaderIconButton>
        }
      />

      <div className="flex-1 overflow-y-auto thin-scrollbar bg-white px-4 pt-5 pb-6 flex flex-col gap-4">
        {/* Status card — series status + customer + amount per invoice */}
        <div
          className="w-full shrink-0 bg-[#faf9f4] border border-dashed border-[rgba(160,160,160,0.5)] rounded-[12px] px-4 py-[14px] flex flex-col gap-1"
          style={{ boxShadow: CARD_SHADOW }}
        >
          <span className="self-start inline-flex items-center gap-1 rounded-full px-1.5 py-0.5" style={{ background: sp.bg }}>
            <Repeat size={10} strokeWidth={2.75} style={{ color: sp.text }} />
            <span className="text-[10px] font-medium leading-[1.3] tracking-[-0.5px]" style={{ ...FONT, color: sp.text }}>{status}</span>
          </span>
          <span className="text-[20px] font-black leading-none" style={{ ...FONT, color: "#1b1b1b" }}>{customerName}</span>
          <span className="text-[14px] font-medium leading-[1.3]" style={{ ...FONT, color: "#808080" }}>{amountLabel} per invoice</span>
        </div>

        {/* Schedule details */}
        <div
          className="w-full shrink-0 bg-white rounded-xl overflow-hidden border border-dashed border-[rgba(160,160,160,0.2)]"
          style={{ boxShadow: CARD_SHADOW }}
        >
          <div className="px-4 pt-2 pb-[9px] border-b border-[rgba(160,160,160,0.2)]">
            <p className="text-[12px] font-bold leading-[16.5px] text-[#a0a0a0]" style={FONT}>SCHEDULE DETAILS</p>
          </div>
          <Row label="Frequency" value={frequency} />
          <Row label="Start Date" value={startDate} />
          <Row label="Ends" value={ends} />
          <Row label="Auto-send" value={autoSend ? "On" : "Off"} last />
        </div>

        {/* Invoices log (AC5) — count badge + status pills; tap to open; Show more when >3. */}
        <div
          className="w-full shrink-0 bg-white rounded-xl overflow-hidden border border-dashed border-[rgba(160,160,160,0.2)]"
          style={{ boxShadow: CARD_SHADOW }}
        >
          <div className="px-4 pt-2 pb-[9px] border-b border-[rgba(160,160,160,0.2)] flex items-center gap-1.5">
            <p className="text-[12px] font-bold leading-[16.5px] text-[#a0a0a0]" style={FONT}>INVOICES</p>
            {visible.length > 0 && (
              <span className="inline-flex items-center justify-center rounded-[4px] bg-[#ff4a15] px-2 py-0.5" style={FONT}>
                <span className="text-[14px] font-medium leading-[1.3] text-white">{visible.length}</span>
              </span>
            )}
          </div>
          {shown.map((r) => {
            const km = kindMeta[r.kind];
            const scheduled = r.kind === "scheduled";
            return (
              <button
                key={r.number}
                type="button"
                onClick={() => onOpenInvoice?.({ number: r.number, status: r.status, scheduled })}
                className="w-full flex items-center justify-between gap-3 px-4 pt-2 pb-[9px] text-left border-b border-[rgba(160,160,160,0.2)]"
              >
                <span className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[14px] font-bold leading-[1.3] truncate" style={{ ...FONT, color: "#1b1b1b" }}>{r.label}</span>
                  <span className="text-[14px] font-medium leading-[1.3]" style={{ ...FONT, color: "#101828" }}>{r.date}</span>
                </span>
                <span className="shrink-0 inline-flex items-center rounded-full px-1.5 py-0.5" style={{ background: km.bg }}>
                  <span className="text-[10px] font-medium leading-[1.3] tracking-[-0.5px] whitespace-nowrap" style={{ ...FONT, color: km.text }}>{km.label}</span>
                </span>
              </button>
            );
          })}
          {/* Show more / less — only when there are more than 3 invoices. */}
          {visible.length > 3 && (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="w-full flex items-center gap-1 px-4 pt-2 pb-[9px] bg-[#f5f4f1] text-left"
            >
              <span className="text-[14px] font-medium leading-[1.3]" style={{ ...FONT, color: "#1b1b1b" }}>{expanded ? "Show less" : "Show more"}</span>
              <ChevronDownIcon style={{ fontSize: 18, color: "#1b1b1b", transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
            </button>
          )}
        </div>

        {cancelled && (
          <p className="text-[13px] leading-[1.45]" style={{ ...FONT, color: "#808080" }}>
            This series has been cancelled — no further invoices will be generated. Invoices already
            created remain in your list.
          </p>
        )}
      </div>

      {/* Dock — Pause/Resume Recurring (secondary) + Edit Recurring (primary). Cancel is in the ⋯ menu. */}
      {!cancelled && (
        <ButtonDock
          type="double"
          overflow
          secondaryLabel={active ? "Pause Recurring" : "Resume Recurring"}
          primaryLabel="Edit Recurring"
          onSecondary={active ? onPause : onResume}
          onPrimary={onEdit}
          homeIndicator
        />
      )}

      {/* ⋯ menu — Cancel recurring (destructive, irreversible; kept out of the dock). */}
      <BottomSheet open={menuOpen} title="Recurring actions" onClose={() => setMenuOpen(false)}>
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => { setMenuOpen(false); onCancel?.(); }}
            className="w-full flex items-center gap-3 py-3.5 text-left"
          >
            <XCircle size={20} style={{ color: "#b42318" }} />
            <span className="text-[15px]" style={{ ...FONT, color: "#b42318" }}>Cancel recurring</span>
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}

export default RecurringSeriesDetail;
