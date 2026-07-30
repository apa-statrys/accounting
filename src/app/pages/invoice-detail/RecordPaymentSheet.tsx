// Mark as paid — captures the amount (full → Paid, less → Partially Paid; outcome logic lives in the
// page's onSubmit), plus which bank account received it and an optional payment date (DES-715 comment:
// an indicator to aid reconciliation — no GL impact).
import { useState } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "motion/react";
import { BottomSheet, sheetItem, stepSlide } from "../../components/BottomSheet";
import { ButtonDock } from "../../components/ButtonDock";
import { ListCard } from "../../ui/ListCard";
import { ListRow } from "../../ui/ListRow";
import { TextField } from "../../ui/TextField";
import { Calendar } from "../../components/Calendar";
import { ReceivingAccountRows } from "../../components/ReceivingAccountSheet";
import { CURRENCY_COUNTRY } from "../../components/CurrencySheet";
import { CountryFlag } from "../../components/CountryFlag";
import { money } from "../../lib/format";
import { formatAccount } from "../../data/receivingAccounts";
import { FONT, MUTED } from "../../lib/theme";
import { scrollFieldIntoView } from "../../lib/scrollFieldIntoView";

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

/** "Received in" and "Payment date" are sub-levels of THIS SAME sheet (header/content swap via
 *  `step`), never a second sheet stacked on top of "Mark as paid" — see memory:
 *  sub-level-drawer-same-sheet. */
type PaymentStep = "form" | "account" | "date";

export function RecordPaymentSheet({
  open, onClose, value, onChange, total, currency = "USD", accountId, onAccountChange, date, onDateChange, onSubmit,
}: RecordPaymentSheetProps) {
  const [step, setStep] = useState<PaymentStep>("form");
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const currencyCountry = CURRENCY_COUNTRY[currency];

  const titles: Record<PaymentStep, string> = {
    form: "Mark as paid",
    account: "Select Receiving Account",
    date: "Select Payment Date",
  };

  return (
    <BottomSheet
      open={open}
      title={titles[step]}
      centerTitle={step !== "form"}
      onBack={step !== "form" ? () => setStep("form") : undefined}
      backLabel="Back to payment"
      onClose={() => { onClose(); setStep("form"); }}
      keyboardOpen={keyboardOpen}
      footer={step === "form" ? (
        <ButtonDock
          type="double"
          keyboard={keyboardOpen}
          secondaryLabel="Cancel"
          primaryLabel="Mark as paid"
          onSecondary={onClose}
          onPrimary={onSubmit}
        />
      ) : undefined}
    >
      <AnimatePresence mode="wait" initial={false}>
        {step === "account" ? (
          <motion.div key="account" variants={stepSlide(1)} initial="closed" animate="open" exit="closed">
            <ReceivingAccountRows
              value={accountId}
              hideExternal
              onSelect={(id) => { onAccountChange(id); setStep("form"); }}
            />
          </motion.div>
        ) : step === "date" ? (
          <motion.div key="date" variants={stepSlide(1)} initial="closed" animate="open" exit="closed">
            <Calendar value={date ?? undefined} onChange={(d) => { onDateChange(d); setStep("form"); }} />
            {date && (
              <button
                type="button"
                onClick={() => { onDateChange(null); setStep("form"); }}
                className="mt-2 w-full text-center text-[13px] font-medium py-2"
                style={{ ...FONT, color: MUTED }}
              >
                Clear date
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div key="form" variants={stepSlide(-1)} initial="closed" animate="open" exit="closed" className="flex flex-col gap-5">
            <motion.div variants={sheetItem} className="flex flex-col gap-3">
              <p className="body-sm" style={{ ...FONT, color: MUTED }}>
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
                onFocus={(e) => { setKeyboardOpen(true); scrollFieldIntoView(e.currentTarget); }}
                onBlur={() => setKeyboardOpen(false)}
              />
            </motion.div>

            {/* Which account received it + optional payment date (reconciliation info, no GL impact). */}
            <motion.div variants={sheetItem}>
              <ListCard>
                <ListRow label="Received in" value={formatAccount(accountId)} trailing="chevron" onClick={() => setStep("account")} />
                <ListRow
                  label="Payment date"
                  value={date ? format(date, "d MMM yyyy") : "Optional"}
                  trailing="chevron"
                  onClick={() => setStep("date")}
                  last
                />
              </ListCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </BottomSheet>
  );
}
