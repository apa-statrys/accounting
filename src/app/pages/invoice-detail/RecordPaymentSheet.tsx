// Mark as paid — captures the amount (full → Paid, less → Partially Paid; outcome logic lives in the
// page's onSubmit), plus which bank account received it and an optional payment date (DES-715 comment:
// an indicator to aid reconciliation — no GL impact).
import { useState } from "react";
import { format } from "date-fns";
import { motion } from "motion/react";
import { BottomSheet, sheetItem } from "../../components/BottomSheet";
import { ButtonDock } from "../../components/ButtonDock";
import { Item } from "../../components/Item";
import { TextField } from "../../ui/TextField";
import { Calendar } from "../../components/Calendar";
import { ReceivingAccountSheet } from "../../components/ReceivingAccountSheet";
import { CURRENCY_COUNTRY } from "../../components/CurrencySheet";
import { CountryFlag } from "../../components/CountryFlag";
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
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const currencyCountry = CURRENCY_COUNTRY[currency];

  return (
    <>
      <BottomSheet
        open={open}
        title="Mark as paid"
        onClose={onClose}
        keyboardOpen={keyboardOpen}
        footer={
          <ButtonDock
            type="double"
            keyboard={keyboardOpen}
            secondaryLabel="Cancel"
            primaryLabel="Mark as paid"
            onSecondary={onClose}
            onPrimary={onSubmit}
          />
        }
      >
        <div className="flex flex-col gap-5">
          <motion.div variants={sheetItem} className="flex flex-col gap-3">
            <p className="body-md leading-[1.45]" style={{ ...FONT, color: MUTED }}>
              If the amount is less than the invoice total, the invoice will remain Partially Paid.
            </p>
            <TextField
              type="left-icon"
              label="Amount received"
              inputMode="decimal"
              // Locked currency prefix (flag + code) — the currency is fixed per invoice, not chosen here.
              icon={
                <span className="flex items-center gap-1.5 text-[15px] font-medium text-[var(--text-primary)] -ml-0.5 mr-1 whitespace-nowrap">
                  {currencyCountry && <CountryFlag name={currencyCountry} size={18} />}
                  {currency}
                </span>
              }
              value={value}
              caption={`Invoice total: ${money(total, currency)}`}
              onChange={(v) => onChange(v.replace(/[^0-9.]/g, ""))}
              onFocus={() => setKeyboardOpen(true)}
              onBlur={() => setKeyboardOpen(false)}
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
      <BottomSheet open={dateOpen} title="Select Payment Date" onClose={() => setDateOpen(false)}>
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
