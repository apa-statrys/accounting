// Mark as paid — captures the amount (full → Paid, less → Partially Paid; outcome logic lives in the
// page's onSubmit), plus which bank account received it and an optional payment date (DES-715 comment:
// an indicator to aid reconciliation — no GL impact).
import { useState } from "react";
import { format } from "date-fns";
import { motion } from "motion/react";
import { BottomSheet, sheetItem } from "../../components/BottomSheet";
import { ButtonDock } from "../../components/ButtonDock";
import { Item } from "../../components/Item";
import { TextInput } from "../../components/TextInput";
import { Calendar } from "../../components/Calendar";
import { ReceivingAccountSheet } from "../../components/ReceivingAccountSheet";
import { CURRENCIES } from "../../components/CurrencySheet";
import { money } from "../../lib/format";
import { formatAccount } from "../../data/receivingAccounts";
import { FONT, MUTED } from "../../lib/theme";

interface RecordPaymentSheetProps {
  open: boolean;
  onClose: () => void;
  value: string;
  onChange: (v: string) => void;
  total: number;
  /** Invoice currency — shown locked on the amount field (fixed per invoice, never chosen here). */
  currency?: string;
  /** Which bank account received the payment (DES-715 comment — BA dropdown). */
  accountId: string;
  onAccountChange: (id: string) => void;
  /** Optional date of payment. */
  date: Date | null;
  onDateChange: (d: Date | null) => void;
  onSubmit: () => void;
}

export function RecordPaymentSheet({
  open, onClose, value, onChange, total, currency = "USD", accountId, onAccountChange, date, onDateChange, onSubmit,
}: RecordPaymentSheetProps) {
  const [accountOpen, setAccountOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const currencyFlag = CURRENCIES.find((c) => c.code === currency)?.flag;

  return (
    <>
      <BottomSheet
        open={open}
        title="Mark as paid"
        onClose={onClose}
        dsHeader
        footer={
          <ButtonDock
            type="double"
            homeIndicator
            secondaryLabel="Cancel"
            primaryLabel="Mark as paid"
            onSecondary={onClose}
            onPrimary={onSubmit}
          />
        }
      >
        <div className="flex flex-col gap-5 -mt-2">
          <motion.div variants={sheetItem} className="flex flex-col gap-3">
            <p className="body-md leading-[1.45]" style={{ ...FONT, color: MUTED }}>
              Record a payment received for this invoice.
            </p>
            <TextInput
              label="Amount received"
              inputMode="decimal"
              size="md"
              // Locked currency prefix (flag + code) — the currency is fixed per invoice, not chosen here.
              iconLeft={
                <span className="flex items-center gap-1.5 text-[15px] font-medium text-[#1b1b1b] -ml-0.5 mr-1 whitespace-nowrap">
                  {currencyFlag && <span className="text-[18px] leading-none">{currencyFlag}</span>}
                  {currency}
                </span>
              }
              value={value}
              hintText={`Invoice total: ${money(total)}`}
              onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
            />
          </motion.div>

          {/* Which account received it + optional payment date (reconciliation info, no GL impact). */}
          <motion.div
            variants={sheetItem}
            className="w-full bg-white rounded-xl overflow-hidden border border-dashed border-[rgba(160,160,160,0.2)]"
            style={{ boxShadow: "var(--shadow-card-soft)" }}
          >
            <Item variant="dropdown" label="Received in" value={formatAccount(accountId)} onClick={() => setAccountOpen(true)} />
            <Item variant="dropdown" label="Payment date" value={date ? format(date, "d MMM yyyy") : "Optional"} onClick={() => setDateOpen(true)} />
          </motion.div>
        </div>
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
      <BottomSheet open={dateOpen} title="Payment date" onClose={() => setDateOpen(false)} dsHeader>
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
