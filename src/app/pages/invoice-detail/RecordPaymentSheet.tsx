// Mark as paid — captures the amount (full → Paid, less → Partially Paid; outcome logic lives in the
// page's onSubmit), plus which bank account received it and an optional payment date (DES-715 comment:
// an indicator to aid reconciliation — no GL impact).
import { useState } from "react";
import { format } from "date-fns";
import { BottomSheet } from "../../components/BottomSheet";
import { ButtonDock } from "../../components/ButtonDock";
import { Item } from "../../components/Item";
import { Calendar } from "../../components/Calendar";
import { ReceivingAccountSheet } from "../../components/ReceivingAccountSheet";
import { money } from "../../lib/format";
import { formatAccount } from "../../data/receivingAccounts";
import { FONT, INK, MUTED } from "../../lib/theme";

interface RecordPaymentSheetProps {
  open: boolean;
  onClose: () => void;
  value: string;
  onChange: (v: string) => void;
  total: number;
  /** Which bank account received the payment (DES-715 comment — BA dropdown). */
  accountId: string;
  onAccountChange: (id: string) => void;
  /** Optional date of payment. */
  date: Date | null;
  onDateChange: (d: Date | null) => void;
  onSubmit: () => void;
}

export function RecordPaymentSheet({
  open, onClose, value, onChange, total, accountId, onAccountChange, date, onDateChange, onSubmit,
}: RecordPaymentSheetProps) {
  const [accountOpen, setAccountOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  return (
    <>
      <BottomSheet open={open} title="Mark as paid" onClose={onClose}>
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

          {/* Which account received it + optional payment date (reconciliation info, no GL impact). */}
          <div className="mt-1 w-full bg-white rounded-xl overflow-hidden border border-dashed border-[rgba(160,160,160,0.2)]">
            <Item variant="dropdown" label="Received in" value={formatAccount(accountId)} onClick={() => setAccountOpen(true)} />
            <Item variant="dropdown" label="Payment date" value={date ? format(date, "d MMM yyyy") : "Optional"} onClick={() => setDateOpen(true)} />
          </div>
        </div>

        <ButtonDock
          type="double"
          secondaryLabel="Cancel"
          primaryLabel="Mark as paid"
          onSecondary={onClose}
          onPrimary={onSubmit}
        />
      </BottomSheet>

      {/* Which of the client's bank accounts received the money (Statrys accounts only). */}
      <ReceivingAccountSheet
        open={accountOpen}
        value={accountId}
        hideExternal
        onClose={() => setAccountOpen(false)}
        onSelect={(id) => { onAccountChange(id); setAccountOpen(false); }}
      />

      {/* Optional payment date. */}
      <BottomSheet open={dateOpen} title="Payment date" onClose={() => setDateOpen(false)}>
        <Calendar value={date ?? undefined} onChange={(d) => { onDateChange(d); setDateOpen(false); }} />
        {date && (
          <button
            type="button"
            onClick={() => { onDateChange(null); setDateOpen(false); }}
            className="mt-2 w-full text-center text-[13px] font-medium py-2"
            style={{ ...FONT, color: MUTED }}
          >
            Clear date
          </button>
        )}
      </BottomSheet>
    </>
  );
}
