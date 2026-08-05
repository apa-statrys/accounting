// Mark as paid — captures the amount (full → Paid, less → Partially Paid; outcome logic lives in the
// page's onSubmit), plus which bank account received it and an optional payment date (DES-715 comment:
// an indicator to aid reconciliation — no GL impact).
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "motion/react";
import { BottomSheet, stepSlide } from "../../components/BottomSheet";
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
import { focusFirstInvalidField } from "../../lib/focusFirstInvalidField";

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

  // form-cta-validation: Amount received is the only mandatory field — a blank/zero submit used to
  // silently close the sheet with nothing recorded; now it stays open and flags the field instead.
  const [attempted, setAttempted] = useState(false);
  useEffect(() => { if (open) setAttempted(false); }, [open]);
  const amountNum = Number(value) || 0;
  const amountError = attempted && amountNum <= 0;

  const handleSubmit = () => {
    if (amountNum <= 0) {
      setAttempted(true);
      focusFirstInvalidField("payment-amount");
      return;
    }
    setAttempted(false);
    onSubmit();
  };

  const titles: Record<PaymentStep, string> = {
    form: "Mark as paid",
    account: "Select Payment Method",
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
      // Fixed height so the panel doesn't resize when its content swaps between steps (short
      // form vs. the taller account list/calendar) — only the content itself should slide;
      // see memory: sub-level-drawer-same-sheet (matches InvoiceSettings' own multi-step sheet).
      heightClass="h-[70%]"
      keyboardOpen={keyboardOpen}
      footer={step === "form" ? (
        <ButtonDock
          type="double"
          keyboard={keyboardOpen}
          secondaryLabel="Cancel"
          primaryLabel="Mark as paid"
          onSecondary={onClose}
          onPrimary={handleSubmit}
        />
      ) : undefined}
    >
      {/* Step transitions: plain object-literal initial/animate/exit on a single wrapper — same
          self-contained "next level" slide as Sales Invoice List's Filters→Customer search step
          — EXCEPT "account", whose content (ReceivingAccountRows) has its own nested
          variants={sheetItem} rows that only fade in via Framer's variant-label PROPAGATION, so
          that wrapper must keep string labels (variants={stepSlide(1)} initial="closed"
          animate="open") — an object-literal animate here breaks propagation and leaves those
          rows stuck at opacity:0 forever (confirmed via computed style, not just slow). */}
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
          <motion.div key="date" initial={{ x: 24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 24, opacity: 0 }} transition={{ duration: 0.2, ease: "easeInOut" }}>
            <Calendar value={date ?? undefined} onChange={(d) => { onDateChange(d); setStep("form"); }} />
            <AnimatePresence initial={false}>
              {date && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => { onDateChange(null); setStep("form"); }}
                    className="mt-2 w-full text-center text-[13px] font-medium py-2"
                    style={{ ...FONT, color: MUTED }}
                  >
                    Clear date
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ x: -24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -24, opacity: 0 }} transition={{ duration: 0.2, ease: "easeInOut" }} className="flex flex-col gap-5">
            <div className="flex flex-col gap-3">
              <p className="body-sm" style={{ ...FONT, color: MUTED }}>
                If the amount is less than the invoice total, the invoice will remain Partially Paid.
              </p>
              <TextField
                dataReq="payment-amount"
                type="left-icon"
                label="Amount received"
                mandatory
                inputMode="decimal"
                // Locked currency prefix (flag + code) — the currency is fixed per invoice, not chosen here.
                icon={
                  <span className="flex items-center gap-1.5 text-[15px] font-medium text-[var(--text-primary)] -ml-0.5 mr-1 whitespace-nowrap">
                    {currencyCountry && <CountryFlag name={currencyCountry} size={18} />}
                    {currency}
                  </span>
                }
                value={value}
                error={amountError}
                caption={amountError ? "Enter the payment amount" : `Invoice total: ${money(total, currency)}`}
                onChange={(v) => onChange(v.replace(/[^0-9.]/g, ""))}
                onFocus={(e) => { setKeyboardOpen(true); scrollFieldIntoView(e.currentTarget); }}
                onBlur={() => setKeyboardOpen(false)}
              />
            </div>

            {/* Which account received it + optional payment date (reconciliation info, no GL impact). */}
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
        )}
      </AnimatePresence>
    </BottomSheet>
  );
}
