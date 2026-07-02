// Record payment — full amount marks Paid, less marks Partially Paid (the outcome logic lives
// in the page's onSubmit; this sheet only captures the amount).
import { BottomSheet } from "../BottomSheet";
import { ButtonDock } from "../ButtonDock";
import { money } from "../../lib/format";
import { FONT, INK, MUTED } from "../../lib/theme";

interface RecordPaymentSheetProps {
  open: boolean;
  onClose: () => void;
  value: string;
  onChange: (v: string) => void;
  total: number;
  onSubmit: () => void;
}

export function RecordPaymentSheet({ open, onClose, value, onChange, total, onSubmit }: RecordPaymentSheetProps) {
  return (
    <BottomSheet open={open} title="Record payment" onClose={onClose}>
      <div className="flex flex-col gap-3 pb-1">
        <p className="text-[13px] leading-[1.45]" style={{ ...FONT, color: MUTED }}>
          Record a payment received for this invoice. The full amount marks it Paid; less marks
          it Partially Paid.
        </p>
        <label className="text-[12px] font-bold uppercase tracking-wide" style={{ ...FONT, color: "#a0a0a0" }}>
          Amount received
        </label>
        <div className="flex items-center gap-2 rounded-xl border border-[rgba(160,160,160,0.4)] px-3.5 h-12 bg-white">
          <span className="text-[15px]" style={{ ...FONT, color: MUTED }}>$</span>
          <input
            type="text"
            inputMode="decimal"
            value={value}
            onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
            className="flex-1 outline-none text-[15px]"
            style={{ ...FONT, color: INK }}
          />
        </div>
        <p className="text-[12px]" style={{ ...FONT, color: MUTED }}>Invoice total: {money(total)}</p>
      </div>
      <ButtonDock
        type="double"
        secondaryLabel="Cancel"
        primaryLabel="Record payment"
        onSecondary={onClose}
        onPrimary={onSubmit}
      />
    </BottomSheet>
  );
}
