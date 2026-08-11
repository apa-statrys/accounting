import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { format, parseISO } from "date-fns";
import { Plus, X } from "lucide-react";
import { PageAppHeader } from "../../components/PageAppHeader";
import { PageHeader } from "../../ui/PageHeader";
import { ButtonDock } from "../../components/ButtonDock";
import { BottomSheet } from "../../components/BottomSheet";
import { Tile } from "../../ui/Tile";
import { ListRow } from "../../ui/ListRow";
import { ListCard } from "../../ui/ListCard";
import { SegmentedControls } from "../../ui/SegmentedControls";
import { TextField } from "../../ui/TextField";
import { Button } from "../../ui/Button";
import { FileItemBase } from "../../ui/FileItemBase";
import { Calendar } from "../../components/Calendar";
import { CountryFlag } from "../../components/CountryFlag";
import { CURRENCY_COUNTRY } from "../../components/CurrencySheet";
import { RECEIVING_ACCOUNTS, getAccount } from "../../data/receivingAccounts";
import { money } from "../../lib/format";

import { FONT, MUTED } from "../../lib/theme";
import { scrollFieldIntoView } from "../../lib/scrollFieldIntoView";


/** DES-720 refund flow steps: choose the method (a SegmentedControls, matching SendInvoiceSheet's
 *  Email/Share pattern) — the matching form (BA account picker, or the manual capture fields)
 *  swaps in below on the same step, no separate "pick a tile → Continue" screen — then, for a BA
 *  transfer only, a review-and-confirm step. */
type Step = "choose" | "confirm";
type Method = "ba" | "manual";

export interface RefundCreditNoteFlowProps {
  customerName: string;
  /** Refund amount (the credit note total), in the invoice currency. */
  amount: number;
  /** Invoice/transfer currency (the amount is denominated in this, not the source account's currency). */
  currency: string;
  creditNoteNo: string;
  invoiceNo: string;
  /** ✕ on the first step — cancel the whole flow, back to the invoice. */
  onClose: () => void;
  /** Confirmed a Statrys BA transfer (the pre-filled draft is handed to the BA flow). */
  onConfirmBA: (fromAccountId: string) => void;
  /** Chose "Mark as already refunded" → records the captured proof (date, bank account used, amount, and a
   *  file and/or reference number as evidence). */
  onMarkRefunded: (proof: { date: string; method: string; amount: number; proofFile?: string; referenceNo?: string }) => void;
}

/**
 * Full-page refund flow (DES-720). The BA payment flow itself is out of scope — this hands off a
 * pre-filled draft for the client to review and confirm; confirming simulates the reconciliation.
 */
export function RefundCreditNoteFlow({
  customerName,
  amount,
  currency,
  creditNoteNo,
  invoiceNo,
  onClose,
  onConfirmBA,
  onMarkRefunded,
}: RefundCreditNoteFlowProps) {
  const [step, setStep] = useState<Step>("choose");
  const [method, setMethod] = useState<Method>("ba");
  const [fromAccount, setFromAccount] = useState("personal");
  const fromAcct = getAccount(fromAccount);
  // "Mark as already refunded" capture (DES-720): only Amount refunded + Bank account used are required;
  // refund date and proof (an uploaded receipt) are optional. Amount defaults to the credit note.
  const [mDate, setMDate] = useState("2026-06-22");
  // Refund date picker — same inline-drop-open Calendar pattern as Sales Invoice List / Credit Notes
  // List's own Issue Date filters (not a raw <input type="date">).
  const [dateOpen, setDateOpen] = useState(false);
  const [dateCalendarSettled, setDateCalendarSettled] = useState(false);
  useEffect(() => { setDateCalendarSettled(false); }, [dateOpen]);
  const dateFieldRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!dateOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (dateFieldRef.current && !dateFieldRef.current.contains(e.target as Node)) setDateOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [dateOpen]);
  // Bank account used — a dropdown; defaults to the primary Statrys account (Personal Saving).
  const DEFAULT_ACCOUNT = RECEIVING_ACCOUNTS.find((a) => a.primary) ?? RECEIVING_ACCOUNTS[0];
  const [mAccount, setMAccount] = useState(`${DEFAULT_ACCOUNT.name} (${DEFAULT_ACCOUNT.number})`);
  const [acctOpen, setAcctOpen] = useState(false);
  const [mProof, setMProof] = useState<string | null>(null);
  // Editable refund amount (DES-720) — defaults to the outstanding refund; can't exceed it.
  const [mAmount, setMAmount] = useState(amount.toFixed(2));
  const enteredAmount = Number(mAmount) || 0;
  const exceedsOutstanding = enteredAmount > amount + 0.001;
  const manualValid = enteredAmount > 0 && !exceedsOutstanding && !!mAccount;
  const [scrolled, setScrolled] = useState(false);
  // On-screen keyboard (Figma "IOS controls" = Keyboard, same idea as CreateSalesInvoice) — no
  // free-text field remains on the manual step, so nothing currently focuses it true.
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  // All steps share one scroll container (below) — advancing/going back a step must land on
  // top of the new step's content, not wherever the previous step happened to be scrolled to.
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [step]);

  const title = step === "confirm" ? "Confirm refund transfer" : "Refund Credit Note";

  const onContinue = () => {
    if (step === "choose") {
      if (method === "ba") setStep("confirm");
      else onMarkRefunded({ date: mDate, method: mAccount, amount: enteredAmount, proofFile: mProof ?? undefined });
    } else {
      onConfirmBA(fromAccount);
    }
  };

  // First step ✕ exits the flow; the confirm step steps back to it.
  const onLeading = () => {
    if (step === "confirm") setStep("choose");
    else onClose();
  };

  return (
    <div className="absolute inset-0 z-50 bg-[var(--bg-neutral-tertiary)] rounded-[48px] overflow-hidden flex flex-col" style={{ width: 375, height: 812 }}>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto thin-scrollbar"
        onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
      >
      <PageAppHeader scrolled={scrolled}>
      <PageHeader
        type="center"
        title={title}
        onBack={onLeading}
        backIcon={step === "choose" ? <X size={20} strokeWidth={1} /> : undefined}
        backLabel={step === "choose" ? "Close" : "Back"}
        showSearch={false}
      />
      </PageAppHeader>

      {/* Extra bottom padding while the reference-number field is focused clears the taller
          dock+keyboard overlay. */}
      <div className={`px-4 pt-5 flex flex-col gap-4 ${keyboardOpen ? "pb-[380px]" : "pb-28"}`}>
        {step === "choose" && (
          <>
            {/* Method — SegmentedControls (matches SendInvoiceSheet's Email/Share pattern) instead
                of two Tile radio cards + a separate "Continue" step: the matching form swaps in
                below immediately. A one-line caption keeps the distinction the old Tile subtext
                carried — this isn't a cosmetic toggle, one option moves real money, the other just
                logs a record. */}
            <SegmentedControls
              segments={["Bank Transfer", "Mark as Refunded"]}
              activeIndex={method === "ba" ? 0 : 1}
              onChange={(i) => setMethod(i === 0 ? "ba" : "manual")}
            />
            <p className="text-[12px] leading-[1.4] -mt-2" style={{ ...FONT, color: MUTED }}>
              {method === "ba"
                ? "Refund the client via your Statrys Business Account."
                : "You already refunded this outside Statrys — record it here for your books."}
            </p>

            {method === "ba" ? (
              <div className="flex flex-col gap-2">
                {/* Plain body-sm label above a Tile list — matches SendInvoiceSheet's "Send To". */}
                <p className="body-sm text-[var(--text-primary)]">Refund from</p>
                {RECEIVING_ACCOUNTS.map((a) => (
                  <Tile
                    key={a.id}
                    size="sm"
                    title={a.name}
                    text={a.number}
                    flag={<CountryFlag name={a.country} size={30} />}
                    badgeLabel={a.primary ? "Primary" : undefined}
                    selected={fromAccount === a.id}
                    trailing={fromAccount === a.id ? "check" : "none"}
                    onClick={() => setFromAccount(a.id)}
                  />
                ))}
              </div>
            ) : (
              <>
              {/* DES-720: a refund made outside Statrys — capture date + method + amount (required) as
                  proof. DS ui/TextField (label/mandatory/caption/error props) throughout, matching
                  RecordPaymentSheet's own "Amount received" field — not hand-rolled bordered divs
                  with a separate uppercase eyebrow label (that style is reserved for PDF-preview
                  document mockups elsewhere, e.g. CreditNotePreviewPage, never a real form field). */}
              <TextField
                type="left-icon"
                label="Amount refunded"
                mandatory
                inputMode="decimal"
                icon={
                  <span className="flex items-center gap-1.5 text-[15px] font-medium text-[var(--text-primary)] -ml-0.5 mr-1 whitespace-nowrap">
                    <CountryFlag name={CURRENCY_COUNTRY[currency]} size={18} />
                    {currency}
                  </span>
                }
                value={mAmount}
                error={exceedsOutstanding}
                caption={
                  exceedsOutstanding
                    ? `Amount exceeds the refund amount of ${currency} ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : undefined
                }
                onChange={(v) => setMAmount(v.replace(/[^0-9.]/g, ""))}
                onFocus={(e) => { setKeyboardOpen(true); scrollFieldIntoView(e.currentTarget); }}
                onBlur={() => setKeyboardOpen(false)}
              />
              <div ref={dateFieldRef} className="flex flex-col gap-1.5">
                <TextField
                  type="date-picker"
                  label="Refund date"
                  value={mDate ? format(parseISO(mDate), "d MMM yyyy") : ""}
                  placeholder="Select date"
                  onClick={() => setDateOpen((v) => !v)}
                />
                <AnimatePresence initial={false}>
                  {dateOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      onAnimationComplete={() => { if (dateOpen) setDateCalendarSettled(true); }}
                      style={{ overflow: dateCalendarSettled ? "visible" : "hidden" }}
                    >
                      <div className="pt-3">
                        <Calendar
                          value={mDate ? parseISO(mDate) : undefined}
                          onChange={(d) => { setMDate(format(d, "yyyy-MM-dd")); setDateOpen(false); }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {/* Bank account used (DES-720) — a dropdown of the Statrys accounts + any registered external
                  accounts; defaults to the primary Statrys account. Same TextField type="dropdown" as
                  AddCustomerPage's Country field, not a hand-rolled bordered button. */}
              <TextField
                type="dropdown"
                label="Payment account"
                mandatory
                value={mAccount}
                placeholder="Select account"
                onClick={() => setAcctOpen(true)}
              />

              {/* Proof of refund — an optional uploaded receipt / screenshot. Same trigger button as
                  "Add your items"/"Add more items" (AddInvoiceDetails) and the same DS
                  ui/FileItemBase row used everywhere else a file is attached (SendInvoiceSheet's
                  Download row, CreditsAppliedSection's refund proof) instead of a hand-rolled
                  dashed button + filename/Remove row. */}
              <div className="flex flex-col gap-1.5">
                <p className="body-sm text-[var(--text-primary)]">Proof of refund</p>
                {mProof ? (
                  <FileItemBase name={mProof} size="128 KB" fileType="pdf" state="completed" action="delete" onDelete={() => setMProof(null)} />
                ) : (
                  <Button hierarchy="secondary" size="sm" fullWidth iconLeft={<Plus size={18} />} label="Upload receipt / screenshot" onClick={() => setMProof("refund-receipt.pdf")} />
                )}
              </div>
              </>
            )}
          </>
        )}

        {step === "confirm" && (
          /* DS ListCard/ListRow (Figma), same shape as the CN detail's own Credit Details card —
             not the old hand-rolled dashed-border/neutral-secondary card. */
          <ListCard onLayer="gray">
            {/* From — account name + full account number */}
            <ListRow label="From" value={fromAcct?.name ?? ""} valueDescription={fromAcct?.number} />
            <ListRow label="Currency" value={currency} valueFlag={<CountryFlag name={CURRENCY_COUNTRY[currency]} size={16} />} />
            <ListRow label="To" value={customerName} />
            <ListRow label="Amount" value={money(amount, currency)} />
            <ListRow label="Reference" value={creditNoteNo || invoiceNo} last />
          </ListCard>
        )}
      </div>
      </div>

      <ButtonDock
        type="single"
        sticky
        primaryLabel={step === "confirm" ? "Confirm transfer" : method === "manual" ? "Record refund" : "Continue"}
        primaryDisabled={step === "choose" && method === "manual" && !manualValid}
        onPrimary={onContinue}
        keyboard={keyboardOpen}
      />

      {/* Bank account used picker (DES-720) — Statrys accounts only (external "Other accounts" hidden). */}
      <BottomSheet open={acctOpen} title="Select Account" onClose={() => setAcctOpen(false)}>
        <div className="flex flex-col gap-2">
          {RECEIVING_ACCOUNTS.map((a) => {
            const label = `${a.name} (${a.number})`;
            return (
              <Tile key={a.id} size="sm" title={a.name} text={a.number} flag={<CountryFlag name={a.country} size={30} />} selected={mAccount === label} trailing={mAccount === label ? "check" : "none"} onClick={() => { setMAccount(label); setAcctOpen(false); }} />
            );
          })}
        </div>
      </BottomSheet>
    </div>
  );
}

export default RefundCreditNoteFlow;
