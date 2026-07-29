import { useEffect, useRef, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { PageAppHeader } from "../../components/PageAppHeader";
import { PageHeader } from "../../ui/PageHeader";
import { ButtonDock } from "../../components/ButtonDock";
import { BottomSheet } from "../../components/BottomSheet";
import { Tile } from "../../ui/Tile";
import { Badge } from "../../ui/Badge";
import { CountryFlag } from "../../components/CountryFlag";
import { RECEIVING_ACCOUNTS, getAccount } from "../../data/receivingAccounts";
import { money } from "../../lib/format";

import { FONT, INK, MUTED } from "../../lib/theme";


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

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-3 ${last ? "" : "border-b border-[rgba(160,160,160,0.18)]"}`}>
      <span className="text-[14px]" style={{ ...FONT, color: MUTED }}>{label}</span>
      <span className="text-[14px] font-medium text-right" style={{ ...FONT, color: INK }}>{value}</span>
    </div>
  );
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
  // "Mark as already refunded" capture (DES-720): date + bank account used (required) + at least one proof
  // (a file OR a reference number). Amount is fixed to the credit note (recorded, not re-typed).
  const [mDate, setMDate] = useState("2026-06-22");
  // Bank account used — a dropdown; defaults to the primary Statrys account (Personal Saving).
  const DEFAULT_ACCOUNT = RECEIVING_ACCOUNTS.find((a) => a.primary) ?? RECEIVING_ACCOUNTS[0];
  const [mAccount, setMAccount] = useState(`${DEFAULT_ACCOUNT.name} (${DEFAULT_ACCOUNT.number})`);
  const [acctOpen, setAcctOpen] = useState(false);
  const [mProof, setMProof] = useState<string | null>(null);
  const [mRef, setMRef] = useState("");
  // Editable refund amount (DES-720) — defaults to the outstanding refund; can't exceed it.
  const [mAmount, setMAmount] = useState(amount.toFixed(2));
  const enteredAmount = Number(mAmount) || 0;
  const exceedsOutstanding = enteredAmount > amount + 0.001;
  const manualValid = enteredAmount > 0 && !exceedsOutstanding && !!mDate && !!mAccount && (!!mProof || mRef.trim() !== "");
  // "What is a reference number?" inline accordion — expands to reveal the explainer.
  const [refInfo, setRefInfo] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // "Reference number" (manual step) focused → the dock swaps its home indicator for the
  // on-screen keyboard (Figma "IOS controls" = Keyboard, same idea as CreateSalesInvoice).
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  // All steps share one scroll container (below) — advancing/going back a step must land on
  // top of the new step's content, not wherever the previous step happened to be scrolled to.
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [step]);

  const title =
    step === "method" ? "Choose Refund Method"
    : step === "account" ? "Choose Account"
    : step === "manual" ? "Record refund"
    : "Confirm refund transfer";

  const onContinue = () => {
    if (step === "method") {
      setStep(method === "ba" ? "account" : "manual");
    } else if (step === "account") {
      setStep("confirm");
    } else if (step === "manual") {
      onMarkRefunded({ date: mDate, method: mAccount, amount: enteredAmount, proofFile: mProof ?? undefined, referenceNo: mRef.trim() || undefined });
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
    <div className="absolute inset-0 z-50 bg-white rounded-[48px] overflow-hidden flex flex-col" style={{ width: 375, height: 812 }}>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto thin-scrollbar bg-white"
        onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
      >
      <PageAppHeader scrolled={scrolled}>
      <PageHeader
        type="center"
        title={title}
        onBack={onLeading}
        backIcon={step === "method" ? <CloseIcon style={{ fontSize: 20 }} /> : undefined}
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
                  cornerBadge={a.primary ? <Badge label="Primary" size="sm" variant="bold" color="custom" /> : undefined}
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
              <div className="flex items-start justify-between gap-4 py-3 border-b border-[rgba(160,160,160,0.18)]">
                <span className="text-[14px] shrink-0" style={{ ...FONT, color: MUTED }}>From</span>
                <span className="min-w-0 text-right">
                  <span className="block text-[14px] font-medium" style={{ ...FONT, color: INK }}>{fromAcct?.name}</span>
                  <span className="block text-[12px] leading-[1.3] mt-0.5 break-all" style={{ ...FONT, color: MUTED }}>{fromAcct?.number}</span>
                </span>
              </div>
              <Row label="Currency" value={currency} />
              <Row label="To" value={customerName} />
              <Row label="Amount" value={money(amount, currency)} />
              <Row label="Reference" value={creditNoteNo || invoiceNo} last />
            </div>
          </>
        )}

        {step === "manual" && (
          <>
            {/* DES-720: a refund made outside Statrys — capture date + method + amount (required) as proof. */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold uppercase tracking-wide" style={{ ...FONT, color: "var(--text-placeholder)" }}>Amount refunded <span style={{ color: "var(--text-error-primary)" }}>*</span></label>
              {/* Editable; capped at the outstanding refund amount. */}
              <div className="flex items-center gap-1 rounded-xl border px-3.5 h-12 bg-white" style={{ borderColor: exceedsOutstanding ? "#dc2626" : "rgba(160,160,160,0.4)" }}>
                <span className="text-[15px]" style={{ ...FONT, color: MUTED }}>{currency}</span>
                <input
                  inputMode="decimal"
                  value={mAmount}
                  onChange={(e) => setMAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                  className="flex-1 min-w-0 text-right outline-none text-[16px] bg-transparent"
                  style={{ ...FONT, color: INK }}
                />
              </div>
              {exceedsOutstanding && (
                <p className="text-[12px] leading-[1.4]" style={{ ...FONT, color: "var(--text-error-primary)" }}>
                  Refund exceed to the refund amount {currency} {amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold uppercase tracking-wide" style={{ ...FONT, color: "var(--text-placeholder)" }}>Refund date <span style={{ color: "var(--text-error-primary)" }}>*</span></label>
              <input type="date" value={mDate} onChange={(e) => setMDate(e.target.value)} className="w-full h-12 px-3.5 rounded-xl border border-[rgba(160,160,160,0.4)] text-[15px] bg-white" style={{ ...FONT, color: INK }} />
            </div>
            {/* Bank account used (DES-720) — a dropdown of the Statrys accounts + any registered external
                accounts; defaults to the primary Statrys account. */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold uppercase tracking-wide" style={{ ...FONT, color: "var(--text-placeholder)" }}>Bank account used <span style={{ color: "var(--text-error-primary)" }}>*</span></label>
              {/* Collapsed field shows the selected account; tap to open the picker sheet. */}
              <button type="button" onClick={() => setAcctOpen(true)} className="w-full flex items-center justify-between rounded-xl border px-3.5 h-12 bg-white text-left" style={{ borderColor: acctOpen ? "var(--text-primary)" : "rgba(160,160,160,0.4)" }}>
                <span className="text-[15px] truncate" style={{ ...FONT, color: mAccount ? INK : "#9ca3af" }}>{mAccount || "Select account"}</span>
                <KeyboardArrowDownIcon style={{ fontSize: 22, color: "var(--text-secondary)" }} />
              </button>
            </div>

            {/* Proof of refund — a file AND/OR a reference number; at least one is required. */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold uppercase tracking-wide" style={{ ...FONT, color: "var(--text-placeholder)" }}>Proof of refund <span style={{ color: "var(--text-error-primary)" }}>*</span></label>
              {mProof ? (
                <div className="flex items-center justify-between rounded-xl border border-[rgba(160,160,160,0.4)] px-3.5 h-12 bg-white">
                  <span className="text-[14px] truncate" style={{ ...FONT, color: INK }}>{mProof}</span>
                  <button onClick={() => setMProof(null)} className="text-[13px] font-medium shrink-0 ml-3" style={{ ...FONT, color: "#b42318" }}>Remove</button>
                </div>
              ) : (
                <button onClick={() => setMProof("refund-receipt.pdf")} className="w-full rounded-xl border border-dashed border-[rgba(160,160,160,0.5)] py-3 text-[14px] font-medium" style={{ ...FONT, color: INK }}>+ Upload receipt / screenshot</button>
              )}
              <div className="flex items-center gap-3 my-0.5">
                <span className="flex-1 h-px bg-[rgba(160,160,160,0.3)]" />
                <span className="text-[11px] font-bold tracking-wide" style={{ ...FONT, color: "var(--text-placeholder)" }}>OR</span>
                <span className="flex-1 h-px bg-[rgba(160,160,160,0.3)]" />
              </div>
              <input
                value={mRef}
                onChange={(e) => setMRef(e.target.value)}
                onFocus={() => setKeyboardOpen(true)}
                onBlur={() => setKeyboardOpen(false)}
                placeholder="Reference number"
                className="w-full h-12 px-3.5 rounded-xl border border-[rgba(160,160,160,0.4)] text-[15px] bg-white outline-none"
                style={{ ...FONT, color: INK }}
              />
              {/* Inline accordion — chevron rotates; expands the explainer below. */}
              <button type="button" onClick={() => setRefInfo((v) => !v)} className="self-start flex items-center gap-1 text-[12px] font-medium" style={{ ...FONT, color: MUTED }}>
                What is a reference number?
                <KeyboardArrowDownIcon style={{ fontSize: 16, transform: refInfo ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
              </button>
              {refInfo && (
                <p className="text-[12.5px] leading-[1.45] rounded-xl bg-[#f6f5f0] px-3.5 py-3" style={{ ...FONT, color: MUTED }}>
                  The transaction or transfer ID provided by your bank after a refund is sent. You can usually
                  find it in your bank's transaction details.
                </p>
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
        homeIndicator={!keyboardOpen}
        keyboard={keyboardOpen}
      />

      {/* Bank account used picker (DES-720) — Statrys accounts + registered external accounts. */}
      <BottomSheet open={acctOpen} title="Select Account" onClose={() => setAcctOpen(false)}>
        <div className="flex flex-col gap-2">
          <span className="px-1 text-[11px] font-bold uppercase tracking-wide" style={{ ...FONT, color: "var(--text-placeholder)" }}>Statrys accounts</span>
          {RECEIVING_ACCOUNTS.map((a) => {
            const label = `${a.name} (${a.number})`;
            return (
              <Tile key={a.id} size="sm" title={a.name} text={a.number} flag={<CountryFlag name={a.country} size={30} />} selected={mAccount === label} trailing={mAccount === label ? "check" : "none"} onClick={() => { setMAccount(label); setAcctOpen(false); }} />
            );
          })}
          {/* Refunds pay out from a Statrys account only — external "Other accounts" are hidden. */}
        </div>
      </BottomSheet>
    </div>
  );
}

export default RefundCreditNoteFlow;
