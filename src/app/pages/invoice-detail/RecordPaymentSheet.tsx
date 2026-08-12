// Record Payment — captures the amount (full → Paid, less → Partially Paid; outcome logic lives in the
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
import { FONT, INK, MUTED } from "../../lib/theme";
import { Check } from "lucide-react";
import { scrollFieldIntoView } from "../../lib/scrollFieldIntoView";
import { focusFirstInvalidField } from "../../lib/focusFirstInvalidField";

interface RecordPaymentSheetProps {
  open: boolean;
  onClose: () => void;
  value: string;
  onChange: (v: string) => void;
  /** Amount still owed (invoice total less anything already paid/credited) — the cap on this field,
   *  not the invoice's original total (relevant once an invoice is Partially Paid). */
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

/** "Receiving Account" and "Payment date" are sub-levels of THIS SAME sheet (header/content swap via
 *  `step`), never a second sheet stacked on top of "Record Payment" — see memory:
 *  sub-level-drawer-same-sheet. "done" is the post-Confirm explanation step: recording a payment
 *  doesn't visibly change anything on the invoice (the accountant verifies it first), so this step
 *  says who has it now, at the moment the user is looking for confirmation. Terminal — no back. */
type PaymentStep = "form" | "account" | "date" | "done";

export function RecordPaymentSheet({
  open, onClose, value, onChange, total, currency = "USD", accountId, onAccountChange, date, onDateChange, onSubmit,
}: RecordPaymentSheetProps) {
  const [step, setStep] = useState<PaymentStep>("form");
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const currencyCountry = CURRENCY_COUNTRY[currency];

  // form-cta-validation: Amount received is the only mandatory field — a blank/zero submit used to
  // silently close the sheet with nothing recorded; now it stays open and flags the field instead.
  const [attempted, setAttempted] = useState(false);
  // Numeric keyboard still lets the user type 0 or an amount over the invoice total while
  // editing — the error only surfaces once they leave the field (blur) or try to submit.
  const [touched, setTouched] = useState(false);
  // The field opens pre-filled with the amount owed and shows no caption at all — only once the
  // user actually edits it do we surface what would still be left owing (amount owed − this entry).
  const [amountEdited, setAmountEdited] = useState(false);
  // Brief loading beat on Confirm — the same dots spinner as SendInvoiceSheet's send (Figma node
  // 4591-5847). The green "Paid" success label that used to follow it is gone: the invoice is NOT
  // paid at this point (the accountant verifies first), so the beat hands off to the "done"
  // explanation step rather than asserting an outcome that hasn't happened.
  const [sending, setSending] = useState(false);
  // Reset on OPEN rather than on close, so the sheet starts clean no matter how it was dismissed
  // (Okay button, overlay tap, swipe) — the "done" step has three separate exits.
  useEffect(() => {
    if (open) { setAttempted(false); setTouched(false); setAmountEdited(false); setSending(false); setStep("form"); }
  }, [open]);
  const amountNum = Number(value) || 0;
  const amountExceeds = amountNum > total + 0.001;
  const amountInvalid = amountNum <= 0 || amountExceeds;
  const amountError = (attempted || touched) && amountInvalid;
  const remainingAfter = Math.max(0, total - amountNum);

  const handleSubmit = () => {
    if (amountInvalid) {
      setAttempted(true);
      focusFirstInvalidField("payment-amount");
      return;
    }
    setAttempted(false);
    setSending(true);
    setTimeout(() => { setSending(false); setStep("done"); }, 900);
  };

  // Every exit from "done" commits — Okay button, overlay tap or swipe — so the payment can't be
  // lost by dismissing the explanation. onSubmit itself records it and closes the sheet.
  const leaveDone = () => onSubmit();

  const titles: Record<PaymentStep, string> = {
    form: "Record Payment",
    account: "Select Receiving Account",
    date: "Select Payment Date",
    // Titleless — the confirmation's own heading sits in the content, and BottomSheet collapses
    // the header row to a small gap when there's no title/back/action.
    done: "",
  };

  return (
    <BottomSheet
      open={open}
      title={titles[step]}
      centerTitle={step === "account" || step === "date"}
      // No back from "done" — the payment is already committed by the time it shows.
      onBack={step === "account" || step === "date" ? () => setStep("form") : undefined}
      backLabel="Back to payment"
      onClose={step === "done" ? leaveDone : onClose}
      // Fixed height so the panel doesn't resize when its content swaps between steps (short
      // form vs. the taller account list/calendar) — only the content itself should slide;
      // see memory: sub-level-drawer-same-sheet (matches InvoiceSettings' own multi-step sheet).
      // "done" is exempt: it's terminal (nothing to step back to, so nothing to match heights
      // with) and short, so it auto-sizes snugly instead of leaving a hole above the Okay button.
      heightClass={step === "done" ? undefined : "h-[70%]"}
      compact={step === "done"}
      keyboardOpen={keyboardOpen}
      footer={step === "form" ? (
        <ButtonDock
          type="double"
          keyboard={keyboardOpen}
          secondaryLabel="Cancel"
          secondaryDisabled={sending}
          // The sheet title already names the action, so the CTA is just the commit verb.
          primaryLabel="Confirm"
          primaryLoading={sending}
          onSecondary={onClose}
          onPrimary={handleSubmit}
        />
      ) : step === "done" ? (
        <ButtonDock type="single" primaryLabel="Okay" onPrimary={leaveDone} />
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
        {step === "done" ? (
          // Post-Confirm explanation. Deliberately says nothing about how long verification takes
          // (no agreed turnaround to promise) and nothing about the invoice status (which doesn't
          // change yet). NB the copy promises a notification — that depends on an approval event
          // reaching the app, which doesn't exist yet; PO-approved wording.
          <motion.div
            key="done"
            initial={{ x: 24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 24, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            // No extra top padding: BottomSheet already puts a 24px grabber row + a 32px
            // titleless gap above this. Side padding comes from .content's own --space-8.
            className="flex flex-col items-center text-center gap-4"
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
              style={{ background: INK }}
            >
              <Check size={24} strokeWidth={1.67} color="#fff" />
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="card-title-md" style={{ ...FONT, color: INK }}>Payment recorded successfully</p>
              <p className="body-sm" style={{ ...FONT, color: MUTED }}>
                We&rsquo;ve received your payment record for {money(amountNum, currency)}.
                We&rsquo;ll notify you once the payment has been verified.
              </p>
            </div>
          </motion.div>
        ) : step === "account" ? (
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
                    className="link-sentence-sm mt-2 w-full text-center py-2"
                    style={{ color: "var(--link-primary)" }}
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
                caption={
                  amountError
                    ? amountNum <= 0
                      ? "Enter the payment amount"
                      : "Amount exceeds remaining amount"
                    : amountEdited
                      ? `Remaining amount: ${money(remainingAfter, currency)}`
                      : undefined
                }
                onChange={(v) => { onChange(v.replace(/[^0-9.]/g, "")); setAmountEdited(true); }}
                onFocus={(e) => { setKeyboardOpen(true); scrollFieldIntoView(e.currentTarget); }}
                onBlur={() => { setKeyboardOpen(false); setTouched(true); }}
              />
            </div>

            {/* Which account received it + optional payment date (reconciliation info, no GL impact). */}
            <ListCard>
              <ListRow label="Receiving Account" value={formatAccount(accountId)} trailing="chevron" onClick={() => setStep("account")} />
              <ListRow
                label="Payment Date (Optional)"
                value={date ? format(date, "d MMM yyyy") : undefined}
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
