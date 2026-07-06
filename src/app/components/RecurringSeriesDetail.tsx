import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import { Repeat, PauseCircle, PlayCircle, XCircle } from "lucide-react";
import StatusBar from "./StatusBar";
import { SheetHeader, HeaderIconButton } from "./SheetHeader";
import { ButtonDock } from "./ButtonDock";
import { FONT, INK, MUTED } from "./../lib/theme";

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
}

const CHIP: Record<SeriesStatus, { bg: string; border: string; text: string }> = {
  Active: { bg: "#ebfcef", border: "#a3e9b6", text: "#006a1d" },
  Paused: { bg: "#fff7e6", border: "#fde68a", text: "#b45309" },
  Cancelled: { bg: "#f4f4f4", border: "#e0e0e0", text: "#808080" },
};

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-3 ${last ? "" : "border-b border-[rgba(160,160,160,0.18)]"}`}>
      <span className="text-[14px]" style={{ ...FONT, color: MUTED }}>{label}</span>
      <span className="text-[14px] font-medium text-right" style={{ ...FONT, color: INK }}>{value}</span>
    </div>
  );
}

/**
 * Recurring series detail (DES-782) — opened from the invoice detail's Recurrence card. Shows the
 * schedule + status. Primary action is Edit series; Pause/Resume and Cancel are action rows (in-session
 * state, owned by App). Editing follows the DES-782 rules (customer/currency/start date locked).
 */
export function RecurringSeriesDetail({
  status, customerName, amountLabel, frequency, startDate, nextDate, ends, autoSend,
  onBack, onEdit, onPause, onResume, onCancel,
}: RecurringSeriesDetailProps) {
  const chip = CHIP[status];
  const active = status === "Active";
  const cancelled = status === "Cancelled";

  return (
    <div className="relative bg-[#F9F5EA] rounded-[48px] overflow-hidden shadow-2xl flex flex-col" style={{ width: 375, height: 812 }}>
      <StatusBar />

      <SheetHeader
        title="Recurring series"
        type="inside-page"
        state="fixed"
        leading={<HeaderIconButton aria-label="Back" onClick={onBack}><ChevronLeftIcon /></HeaderIconButton>}
        trailing={<span className="w-[30px] h-[30px] block" aria-hidden />}
      />

      <div className="flex-1 overflow-y-auto thin-scrollbar bg-white px-4 pt-5 pb-6 flex flex-col gap-4">
        {/* Header — series title + status chip */}
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 min-w-0">
            <Repeat size={20} strokeWidth={2.25} style={{ color: "#ff4a15" }} />
            <span className="text-[18px] font-bold truncate" style={{ ...FONT, color: INK }}>{customerName}</span>
          </span>
          <span
            className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-bold leading-[15px]"
            style={{ ...FONT, background: chip.bg, borderColor: chip.border, color: chip.text }}
          >
            {status}
          </span>
        </div>

        {cancelled && (
          <p className="text-[13px] leading-[1.45]" style={{ ...FONT, color: MUTED }}>
            This series has been cancelled — no further invoices will be generated. Invoices already
            created remain in your list.
          </p>
        )}

        {/* Schedule */}
        <div
          className="w-full bg-white rounded-xl px-4 border border-dashed border-[rgba(160,160,160,0.2)]"
          style={{ boxShadow: "var(--shadow-card-soft)" }}
        >
          <Row label="Amount per invoice" value={amountLabel} />
          <Row label="Frequency" value={frequency} />
          <Row label="Start date" value={startDate} />
          <Row label="Next invoice" value={cancelled ? "—" : status === "Paused" ? "Paused" : nextDate} />
          <Row label="Ends" value={ends} />
          <Row label="Auto-send to customer" value={autoSend ? "On" : "Off"} last />
        </div>

        {/* Series controls — Pause/Resume + Cancel (hidden once cancelled). Editing is the primary
            action in the dock below; these are the lower-frequency lifecycle actions. */}
        {!cancelled && (
          <div
            className="w-full bg-white rounded-xl overflow-hidden border border-dashed border-[rgba(160,160,160,0.2)]"
            style={{ boxShadow: "var(--shadow-card-soft)" }}
          >
            <button
              type="button"
              onClick={active ? onPause : onResume}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left border-b border-[#f1f1f1]"
            >
              {active
                ? <PauseCircle size={20} style={{ color: INK }} />
                : <PlayCircle size={20} style={{ color: INK }} />}
              <span className="text-[15px]" style={{ ...FONT, color: INK }}>{active ? "Pause series" : "Resume series"}</span>
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
            >
              <XCircle size={20} style={{ color: "#b42318" }} />
              <span className="text-[15px]" style={{ ...FONT, color: "#b42318" }}>Cancel series</span>
            </button>
          </div>
        )}
      </div>

      {/* Primary action — edit the series (DES-782 AC4). */}
      {!cancelled && (
        <ButtonDock
          type="single"
          overflow
          primaryLabel="Edit series"
          onPrimary={onEdit}
          homeIndicator
        />
      )}
    </div>
  );
}

export default RecurringSeriesDetail;
