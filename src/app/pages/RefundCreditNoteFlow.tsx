import { useState } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import CloseIcon from "@mui/icons-material/Close";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import StatusBar from "../components/StatusBar";
import { SheetHeader, HeaderIconButton } from "../components/SheetHeader";
import { ButtonDock } from "../components/ButtonDock";
import { BottomSheet } from "../components/BottomSheet";
import { Tile } from "../components/Tile";
import { Tile as DsTile } from "../ui/Tile";
import { RECEIVING_ACCOUNTS, getAccount } from "../data/receivingAccounts";
import { money } from "../lib/format";

import { FONT, INK, MUTED } from "../lib/theme";


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
  // "Mark as already refunded" capture (DES-720): only Amount refunded + Bank account used are required;
  // refund date and proof (an uploaded receipt) are optional. Amount defaults to the credit note.
  const [mDate, setMDate] = useState("2026-06-22");
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
    <div className="absolute inset-0 z-50 bg-white rounded-[48px] overflow-hidden flex flex-col" style={{ width: 375, height: 812 }}>
      <StatusBar />
      <SheetHeader
        title={title}
        type="inside-page"
        state="fixed"
        leading={
          <HeaderIconButton aria-label={step === "method" ? "Close" : "Back"} onClick={onLeading}>
            {step === "method" ? <CloseIcon /> : <ChevronLeftIcon />}
          </HeaderIconButton>
        }
        trailing={<span className="w-[30px] h-[30px] block" aria-hidden />}
      />

      <div className="flex-1 overflow-y-auto thin-scrollbar bg-white px-4 pt-5 pb-28 flex flex-col gap-4">
        {step === "method" && (
          <>
            <div className="flex flex-col gap-2">
              <DsTile title="Bank transfer" text="Refund via your Statrys Business Account" selected={method === "ba"} trailing={method === "ba" ? "check" : "none"} onClick={() => setMethod("ba")} />
              <DsTile title="Mark as Refunded" text="You refunded already" selected={method === "manual"} trailing={method === "manual" ? "check" : "none"} onClick={() => setMethod("manual")} />
            </div>
          </>
        )}

        {step === "account" && (
          <>
            <div className="flex flex-col gap-2">
              {RECEIVING_ACCOUNTS.map((a) => (
                <Tile
                  key={a.id}
                  title={a.name}
                  description={a.number}
                  showIcon
                  icon={<span className="text-[16px] leading-none">{a.flag}</span>}
                  showStatus={a.primary}
                  status="PRIMARY"
                  selected={fromAccount === a.id}
                  onClick={() => setFromAccount(a.id)}
                />
              ))}
            </div>
          </>
        )}

        {step === "confirm" && (
          <>
            <div className="bg-[#faf9f4] border border-dashed border-[rgba(160,160,160,0.3)] rounded-xl px-4">
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
              <Row label="Amount" value={money(amount)} />
              <Row label="Reference" value={creditNoteNo || invoiceNo} last />
            </div>
          </>
        )}

        {step === "manual" && (
          <>
            {/* DES-720: a refund made outside Statrys — capture date + method + amount (required) as proof. */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold uppercase tracking-wide" style={{ ...FONT, color: "#a0a0a0" }}>Amount refunded <span style={{ color: "#dc2626" }}>*</span></label>
              {/* Editable; capped at the outstanding refund amount. */}
              <div className="flex items-center gap-1 rounded-xl border px-3.5 h-12 bg-white" style={{ borderColor: exceedsOutstanding ? "#dc2626" : "rgba(160,160,160,0.4)" }}>
                <span className="text-[15px]" style={{ ...FONT, color: MUTED }}>{currency}</span>
                <input
                  inputMode="decimal"
                  value={mAmount}
                  onChange={(e) => setMAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                  className="flex-1 min-w-0 text-right outline-none text-[16px] font-bold bg-transparent"
                  style={{ ...FONT, color: INK }}
                />
              </div>
              {exceedsOutstanding && (
                <p className="text-[12px] leading-[1.4]" style={{ ...FONT, color: "#dc2626" }}>
                  Refund exceed to the refund amount {currency} {amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold uppercase tracking-wide" style={{ ...FONT, color: "#a0a0a0" }}>Refund date</label>
              <input type="date" value={mDate} onChange={(e) => setMDate(e.target.value)} className="w-full h-12 px-3.5 rounded-xl border border-[rgba(160,160,160,0.4)] text-[15px] bg-white" style={{ ...FONT, color: INK }} />
            </div>
            {/* Bank account used (DES-720) — a dropdown of the Statrys accounts + any registered external
                accounts; defaults to the primary Statrys account. */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold uppercase tracking-wide" style={{ ...FONT, color: "#a0a0a0" }}>Bank account used <span style={{ color: "#dc2626" }}>*</span></label>
              {/* Collapsed field shows the selected account; tap to open the picker sheet. */}
              <button type="button" onClick={() => setAcctOpen(true)} className="w-full flex items-center justify-between rounded-xl border px-3.5 h-12 bg-white text-left" style={{ borderColor: acctOpen ? "#1b1b1b" : "rgba(160,160,160,0.4)" }}>
                <span className="text-[15px] truncate" style={{ ...FONT, color: mAccount ? INK : "#9ca3af" }}>{mAccount || "Select account"}</span>
                <KeyboardArrowDownIcon style={{ fontSize: 22, color: "#808080" }} />
              </button>
            </div>

            {/* Proof of refund — an optional uploaded receipt / screenshot. */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold uppercase tracking-wide" style={{ ...FONT, color: "#a0a0a0" }}>Proof of refund</label>
              {mProof ? (
                <div className="flex items-center justify-between rounded-xl border border-[rgba(160,160,160,0.4)] px-3.5 h-12 bg-white">
                  <span className="text-[14px] truncate" style={{ ...FONT, color: INK }}>{mProof}</span>
                  <button onClick={() => setMProof(null)} className="text-[13px] font-medium shrink-0 ml-3" style={{ ...FONT, color: "#b42318" }}>Remove</button>
                </div>
              ) : (
                <button onClick={() => setMProof("refund-receipt.pdf")} className="w-full rounded-xl border border-dashed border-[rgba(160,160,160,0.5)] py-3 text-[14px] font-medium" style={{ ...FONT, color: INK }}>+ Upload receipt / screenshot</button>
              )}
            </div>
          </>
        )}
      </div>

      <ButtonDock
        type="single"
        sticky
        primaryLabel={step === "confirm" ? "Confirm transfer" : step === "manual" ? "Record refund" : "Continue"}
        primaryDisabled={step === "manual" && !manualValid}
        onPrimary={onContinue}
        homeIndicator
      />

      {/* Bank account used picker (DES-720) — Statrys accounts only (external "Other accounts" hidden). */}
      <BottomSheet open={acctOpen} title="Select Account" onClose={() => setAcctOpen(false)} dsHeader>
        <div className="flex flex-col gap-2">
          {RECEIVING_ACCOUNTS.map((a) => {
            const label = `${a.name} (${a.number})`;
            return (
              <DsTile key={a.id} title={a.name} text={a.number} flag={<span className="text-[20px] leading-none">{a.flag}</span>} selected={mAccount === label} trailing={mAccount === label ? "check" : "none"} onClick={() => { setMAccount(label); setAcctOpen(false); }} />
            );
          })}
        </div>
      </BottomSheet>
    </div>
  );
}

export default RefundCreditNoteFlow;
