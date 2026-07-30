import { useState } from "react";
import ChevronDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { Repeat, XCircle, Menu as MenuIcon } from "lucide-react";
import { PageAppHeader } from "../components/PageAppHeader";
import { PageHeader } from "../ui/PageHeader";
import { ButtonDock } from "../components/ButtonDock";
import { BottomSheet } from "../components/BottomSheet";
import { ListRow } from "../ui/ListRow";
import { Tile } from "../ui/Tile";
import { FONT } from "../lib/theme";
import type { DetailStatus } from "../types";

type SeriesStatus = "Active" | "Paused" | "Completed" | "Cancelled";

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
  Active: { bg: "var(--bg-success-subtle)", text: "var(--text-success-primary)" },
  Paused: { bg: "var(--bg-warning-subtle)", text: "var(--text-warning-primary)" },
  // Completed is a distinct indigo, no semantic token family fits it — kept literal on purpose.
  Completed: { bg: "#eef4ff", text: "#2f5fd0" },
  Cancelled: { bg: "var(--bg-neutral-tertiary)", text: "var(--text-secondary)" },
};

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
  const completed = status === "Completed";
  // Completed + Cancelled are terminal: view-only (no dock, no ⋯), and the log drops not-yet-generated rows.
  const readOnly = cancelled || completed;
  const sp = STATUS_PILL[status];
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Invoice log (AC5). `kind` drives the pill + label; a cancelled series drops the not-yet-generated
  // (scheduled) rows. More than 3 collapses behind "Show more".
  // Rows only ever show invoice-lifecycle statuses. The series' Active/Paused/Completed state lives on
  // the top status card — never as a per-invoice "Paused" (that would leak series scope onto an invoice).
  const kindMeta = {
    paid: { label: "Paid", bg: "var(--bg-success-subtle)", text: "var(--text-success-primary)" },
    await: { label: "Awaiting Payment", bg: "var(--bg-warning-subtle)", text: "var(--text-warning-primary)" },
    scheduled: { label: "Scheduled", bg: "var(--bg-neutral-tertiary)", text: "var(--text-secondary)" },
  } as const;
  const visible = readOnly ? invoices.filter((r) => r.kind !== "scheduled") : invoices;
  const shown = visible.length > 3 && !expanded ? visible.slice(0, 3) : visible;

  return (
    <div className="relative bg-[var(--bg-beige-primary)] rounded-[48px] overflow-hidden shadow-2xl flex flex-col" style={{ width: 375, height: 812 }}>
      <div
        className="flex-1 overflow-y-auto thin-scrollbar bg-white"
        onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
      >
        <PageAppHeader scrolled={scrolled}>
          <PageHeader
            type="center"
            title="Recurring Schedule"
            onBack={onBack}
            showSearch={!readOnly}
            rightIcon={<MenuIcon size={20} strokeWidth={1} />}
            rightLabel="Actions"
            onRightClick={() => setMenuOpen(true)}
          />
        </PageAppHeader>

        <div className="px-4 pt-5 pb-44 flex flex-col gap-4">
          {/* Status card — series status + customer + amount per invoice */}
          <div
            className="w-full shrink-0 bg-[var(--bg-neutral-secondary)] border border-dashed border-[rgba(160,160,160,0.5)] rounded-[12px] px-4 py-[14px] flex flex-col gap-1"
            style={{ boxShadow: CARD_SHADOW }}
          >
            <span className="self-start inline-flex items-center gap-1 rounded-full px-1.5 py-0.5" style={{ background: sp.bg }}>
              <Repeat size={10} strokeWidth={2.75} style={{ color: sp.text }} />
              <span className="text-[10px] font-medium leading-[1.3] tracking-[-0.5px]" style={{ ...FONT, color: sp.text }}>{status}</span>
            </span>
            <span className="text-[20px] font-black leading-none" style={{ ...FONT, color: "var(--text-primary)" }}>{customerName}</span>
            <span className="text-[14px] font-medium leading-[1.3]" style={{ ...FONT, color: "var(--text-secondary)" }}>{amountLabel} per invoice</span>
          </div>

          {/* Schedule details */}
          <div
            className="w-full shrink-0 bg-white rounded-xl overflow-hidden border border-dashed border-[rgba(160,160,160,0.2)]"
            style={{ boxShadow: CARD_SHADOW }}
          >
            <div className="px-4 pt-2 pb-[9px] border-b border-[rgba(160,160,160,0.2)]">
              <p className="text-[12px] font-bold leading-[16.5px] text-[var(--text-placeholder)]" style={FONT}>SCHEDULE DETAILS</p>
            </div>
            <div className="px-4">
              <ListRow label="Frequency" value={frequency} />
              <ListRow label="Start Date" value={startDate} />
              <ListRow label="Ends" value={ends} />
              <ListRow label="Auto-send" value={autoSend ? "On" : "Off"} last />
            </div>
          </div>

          {/* Invoices log (AC5) — count badge + status pills; tap to open; Show more when >3. */}
          <div
            className="w-full shrink-0 bg-white rounded-xl overflow-hidden border border-dashed border-[rgba(160,160,160,0.2)]"
            style={{ boxShadow: CARD_SHADOW }}
          >
            <div className="px-4 pt-2 pb-[9px] border-b border-[rgba(160,160,160,0.2)] flex items-center gap-1.5">
              <p className="text-[12px] font-bold leading-[16.5px] text-[var(--text-placeholder)]" style={FONT}>INVOICES</p>
              {visible.length > 0 && (
                <span className="inline-flex items-center justify-center rounded-[4px] bg-[var(--bg-brand-primary)] px-2 py-0.5" style={FONT}>
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
                    <span className="text-[14px] font-bold leading-[1.3] truncate" style={{ ...FONT, color: "var(--text-primary)" }}>{r.label}</span>
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
                className="w-full flex items-center gap-1 px-4 pt-2 pb-[9px] bg-[var(--bg-neutral-tertiary)] text-left"
              >
                <span className="text-[14px] font-medium leading-[1.3]" style={{ ...FONT, color: "var(--text-primary)" }}>{expanded ? "Show less" : "Show more"}</span>
                <ChevronDownIcon style={{ fontSize: 18, color: "var(--text-primary)", transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              </button>
            )}
          </div>

          {cancelled && (
            <p className="text-[13px] leading-[1.45]" style={{ ...FONT, color: "var(--text-secondary)" }}>
              This series has been cancelled — no further invoices will be generated. Invoices already
              created remain in your list.
            </p>
          )}
        </div>
      </div>

      {/* Dock — Pause/Resume Recurring (secondary) + Edit Recurring (primary). Cancel is in the ⋯ menu.
          Hidden entirely for terminal (Completed / Cancelled) series. */}
      {!readOnly && (
        <ButtonDock
          type="double"
          sticky
          secondaryLabel={active ? "Pause Recurring" : "Resume Recurring"}
          primaryLabel="Edit Recurring"
          onSecondary={active ? onPause : onResume}
          onPrimary={onEdit}
        />
      )}

      {/* ⋯ menu — Cancel recurring (destructive, irreversible; kept out of the dock). Confirms first. */}
      <BottomSheet open={menuOpen} title="Recurring actions" onClose={() => setMenuOpen(false)}>
        <Tile
          icon={<XCircle size={24} strokeWidth={1.5} color="var(--icon-error-primary)" />}
          title={<span style={{ color: "var(--text-error-primary)" }}>Cancel recurring</span>}
          onClick={() => { setMenuOpen(false); setConfirmCancel(true); }}
        />
      </BottomSheet>

      {/* Cancel confirmation (DES-782 AC5). Dock in the sheet footer so it aligns like every other dock.
          "Keep Schedule" is the primary (safe) action; "Cancel" performs the irreversible cancellation. */}
      <BottomSheet
        open={confirmCancel}
        title="Cancel this schedule?"
        onClose={() => setConfirmCancel(false)}
        compact
        footer={
          <ButtonDock
            type="double"
            secondaryLabel="Cancel"
            primaryLabel="Keep Schedule"
            onSecondary={() => { setConfirmCancel(false); onCancel?.(); }}
            onPrimary={() => setConfirmCancel(false)}
          />
        }
      >
        <p className="body-sm" style={{ ...FONT, color: "var(--text-secondary)" }}>
          This will stop future invoices from being generated. Existing invoices will remain in your Sales
          Invoice list and won't be affected. This action cannot be undone.
        </p>
      </BottomSheet>
    </div>
  );
}

export default RecurringSeriesDetail;
