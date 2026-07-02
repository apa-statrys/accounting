import { useState } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import CloseIcon from "@mui/icons-material/Close";
import StatusBar from "./StatusBar";
import { SheetHeader, HeaderIconButton } from "./SheetHeader";
import { ButtonDock } from "./ButtonDock";
import { Tile } from "./Tile";
import { RECEIVING_ACCOUNTS, getAccount } from "./ReceivingAccountSheet";

const FONT = { fontFamily: "GT Walsheim LC, sans-serif" } as const;
const INK = "#1b1b1b";
const MUTED = "#808080";

const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
  /** Chose "Mark as already refunded" → records the captured proof (date, method, amount + optional file). */
  onMarkRefunded: (proof: { date: string; method: string; amount: number; proofFile?: string }) => void;
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
  // "Mark as already refunded" capture (DES-720): proof = date + method + amount (required); file optional.
  const [mDate, setMDate] = useState("2026-06-22");
  const [mMethod, setMMethod] = useState("");
  const [mProof, setMProof] = useState<string | null>(null);
  // Amount is fixed to the credit note (the refund must equal it) — recorded, not re-typed.
  const manualValid = !!mDate && !!mMethod;

  const title =
    step === "method" ? "Refund credit note"
    : step === "account" ? "Choose Account"
    : step === "manual" ? "Record refund"
    : "Confirm refund transfer";

  const onContinue = () => {
    if (step === "method") {
      setStep(method === "ba" ? "account" : "manual");
    } else if (step === "account") {
      setStep("confirm");
    } else if (step === "manual") {
      onMarkRefunded({ date: mDate, method: mMethod, amount, proofFile: mProof ?? undefined });
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
              <Tile title="Statrys Business Account" showDescription={false} selected={method === "ba"} onClick={() => setMethod("ba")} />
              <Tile title="Mark as already refunded" showDescription={false} selected={method === "manual"} onClick={() => setMethod("manual")} />
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
              <label className="text-[12px] font-bold uppercase tracking-wide" style={{ ...FONT, color: "#a0a0a0" }}>Amount refunded</label>
              {/* Locked to the credit note amount (the refund must equal it). */}
              <div className="flex items-center justify-between rounded-xl border border-[rgba(160,160,160,0.4)] px-3.5 h-12 bg-[#faf9f4]">
                <span className="text-[15px]" style={{ ...FONT, color: MUTED }}>{currency}</span>
                <span className="text-[16px] font-bold" style={{ ...FONT, color: INK }}>{amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold uppercase tracking-wide" style={{ ...FONT, color: "#a0a0a0" }}>Refund date</label>
              <input type="date" value={mDate} onChange={(e) => setMDate(e.target.value)} className="w-full h-12 px-3.5 rounded-xl border border-[rgba(160,160,160,0.4)] text-[15px] bg-white" style={{ ...FONT, color: INK }} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold uppercase tracking-wide" style={{ ...FONT, color: "#a0a0a0" }}>Method</label>
              <div className="flex flex-col gap-2">
                {["Bank transfer", "Card", "Cash"].map((opt) => (
                  <Tile key={opt} title={opt} showDescription={false} selected={mMethod === opt} onClick={() => setMMethod(opt)} />
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold uppercase tracking-wide" style={{ ...FONT, color: "#a0a0a0" }}>Proof (optional)</label>
              {mProof ? (
                <div className="flex items-center justify-between rounded-xl border border-[rgba(160,160,160,0.4)] px-3.5 h-12 bg-white">
                  <span className="text-[14px] truncate" style={{ ...FONT, color: INK }}>{mProof}</span>
                  <button onClick={() => setMProof(null)} className="text-[13px] font-medium shrink-0 ml-3" style={{ ...FONT, color: "#b42318" }}>Remove</button>
                </div>
              ) : (
                <button onClick={() => setMProof("refund-receipt.pdf")} className="w-full rounded-xl border border-dashed border-[rgba(160,160,160,0.5)] py-3 text-[14px] font-medium" style={{ ...FONT, color: INK }}>+ Attach proof</button>
              )}
            </div>
          </>
        )}
      </div>

      <ButtonDock
        type="single"
        overflow
        primaryLabel={step === "confirm" ? "Confirm transfer" : step === "manual" ? "Record refund" : "Continue"}
        primaryDisabled={step === "manual" && !manualValid}
        onPrimary={onContinue}
        homeIndicator
      />
    </div>
  );
}

export default RefundCreditNoteFlow;
