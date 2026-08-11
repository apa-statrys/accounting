import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { format, parseISO } from "date-fns";
import { ChevronDown, X } from "lucide-react";
import { PageAppHeader } from "../../components/PageAppHeader";
import { PageHeader } from "../../ui/PageHeader";
import { ButtonDock } from "../../components/ButtonDock";
import { BottomSheet } from "../../components/BottomSheet";
import { Tile } from "../../ui/Tile";
import { ListRow } from "../../ui/ListRow";
import { TextField } from "../../ui/TextField";
import { Calendar } from "../../components/Calendar";
import { CountryFlag } from "../../components/CountryFlag";
import { CURRENCY_COUNTRY } from "../../components/CurrencySheet";
import { RECEIVING_ACCOUNTS, getAccount } from "../../data/receivingAccounts";
import { money } from "../../lib/format";

import { FONT, INK, MUTED } from "../../lib/theme";
import { scrollFieldIntoView } from "../../lib/scrollFieldIntoView";


/** DES-720 refund flow steps: choose method → (BA) pick the source account → review & confirm the draft. */
type Step = "method" | "account" | "confirm" | "manual";
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
  const [step, setStep] = useState<Step>("method");
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

  const title =
    step === "method" ? "Choose Refund Method"
    : step === "account" ? "Choose Payment Account"
    : step === "manual" ? "Record refund"
    : "Confirm refund transfer";

  const onContinue = () => {
    if (step === "method") {
      setStep(method === "ba" ? "account" : "manual");
    } else if (step === "account") {
      setStep("confirm");
    } else if (step === "manual") {
      onMarkRefunded({ date: mDate, method: mAccount, amount: enteredAmount, proofFile: mProof ?? undefined });
    } else {
      onConfirmBA(fromAccount);
    }
  };

  // First step ✕ exits the flow; later steps step back one.
  const onLeading = () => {
    if (step === "account" || step === "manual") setStep("method");
    else if (step === "confirm") setStep("account");
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
        backIcon={step === "method" ? <X size={20} strokeWidth={1} /> : undefined}
        backLabel={step === "method" ? "Close" : "Back"}
        showSearch={false}
      />
      </PageAppHeader>

      {/* Extra bottom padding while the reference-number field is focused clears the taller
          dock+keyboard overlay. */}
      <div className={`px-4 pt-5 flex flex-col gap-4 ${keyboardOpen ? "pb-[380px]" : "pb-28"}`}>
        {step === "method" && (
          <>
            <div className="flex flex-col gap-2">
              <Tile title="Bank transfer" text="Refund via your Statrys Business Account" selected={method === "ba"} trailing={method === "ba" ? "check" : "none"} onClick={() => setMethod("ba")} />
              <Tile title="Mark as Refunded" text="You refunded already" selected={method === "manual"} trailing={method === "manual" ? "check" : "none"} onClick={() => setMethod("manual")} />
            </div>
          </>
        )}

        {step === "account" && (
          <>
            <div className="flex flex-col gap-2">
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
          </>
        )}

        {step === "confirm" && (
          <>
            <div className="bg-[var(--bg-neutral-secondary)] border border-dashed border-[rgba(160,160,160,0.3)] rounded-xl px-4">
              {/* From — account name + full account number */}
              <ListRow label="From" value={fromAcct?.name ?? ""} valueDescription={fromAcct?.number} />
              <ListRow label="Currency" value={currency} valueFlag={<CountryFlag name={CURRENCY_COUNTRY[currency]} size={16} />} />
              <ListRow label="To" value={customerName} />
              <ListRow label="Amount" value={money(amount, currency)} />
              <ListRow label="Reference" value={creditNoteNo || invoiceNo} last />
            </div>
          </>
        )}

        {step === "manual" && (
          <>
            {/* DES-720: a refund made outside Statrys — capture date + method + amount (required) as proof. */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold uppercase tracking-wide" style={{ ...FONT, color: "var(--text-placeholder)" }}>Amount refunded <span>*</span></label>
              {/* Editable; capped at the outstanding refund amount. */}
              <div className="flex items-center gap-1 rounded-xl border px-3.5 h-12 bg-white" style={{ borderColor: exceedsOutstanding ? "var(--border-error-bold)" : "rgba(160,160,160,0.4)" }}>
                <span className="text-[15px]" style={{ ...FONT, color: MUTED }}>{currency}</span>
                <input
                  inputMode="decimal"
                  value={mAmount}
                  onChange={(e) => setMAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                  onFocus={(e) => { setKeyboardOpen(true); scrollFieldIntoView(e.currentTarget); }}
                  onBlur={() => setKeyboardOpen(false)}
                  className="flex-1 min-w-0 text-right outline-none text-[16px] bg-transparent"
                  style={{ ...FONT, color: INK }}
                />
              </div>
              <AnimatePresence initial={false}>
                {exceedsOutstanding && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="text-[12px] leading-[1.4] overflow-hidden"
                    style={{ ...FONT, color: "var(--text-error-primary)" }}
                  >
                    Refund exceed to the refund amount {currency} {amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            <div ref={dateFieldRef} className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold uppercase tracking-wide" style={{ ...FONT, color: "var(--text-placeholder)" }}>Refund date</label>
              <TextField
                type="date-picker"
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
                accounts; defaults to the primary Statrys account. */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold uppercase tracking-wide" style={{ ...FONT, color: "var(--text-placeholder)" }}>Payment account <span>*</span></label>
              {/* Collapsed field shows the selected account; tap to open the picker sheet. */}
              <button type="button" onClick={() => setAcctOpen(true)} className="w-full flex items-center justify-between rounded-xl border px-3.5 h-12 bg-white text-left" style={{ borderColor: acctOpen ? "var(--text-primary)" : "rgba(160,160,160,0.4)" }}>
                <span className="text-[15px] truncate" style={{ ...FONT, color: mAccount ? INK : "var(--text-placeholder)" }}>{mAccount || "Select account"}</span>
                <ChevronDown size={22} strokeWidth={1.67} color="var(--text-secondary)" />
              </button>
            </div>

            {/* Proof of refund — an optional uploaded receipt / screenshot. */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold uppercase tracking-wide" style={{ ...FONT, color: "var(--text-placeholder)" }}>Proof of refund</label>
              {mProof ? (
                <div className="flex items-center justify-between rounded-xl border border-[rgba(160,160,160,0.4)] px-3.5 h-12 bg-white">
                  <span className="text-[14px] truncate" style={{ ...FONT, color: INK }}>{mProof}</span>
                  <button onClick={() => setMProof(null)} className="text-[13px] font-medium shrink-0 ml-3" style={{ ...FONT, color: "var(--text-error-primary)" }}>Remove</button>
                </div>
              ) : (
                <button onClick={() => setMProof("refund-receipt.pdf")} className="w-full rounded-xl border border-dashed border-[rgba(160,160,160,0.5)] py-3 text-[14px] font-medium" style={{ ...FONT, color: INK }}>+ Upload receipt / screenshot</button>
              )}
            </div>
          </>
        )}
      </div>
      </div>

      <ButtonDock
        type="single"
        sticky
        primaryLabel={step === "confirm" ? "Confirm transfer" : step === "manual" ? "Record refund" : "Continue"}
        primaryDisabled={step === "manual" && !manualValid}
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
