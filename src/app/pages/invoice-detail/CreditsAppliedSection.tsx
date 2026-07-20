// Credits Applied section (DES-719/763) — rendered just below the invoice status card. Recent-first;
// collapse to 2 with "View all"; each row opens the credit-note detail page (actions live there).
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import { money, fmtDate } from "../../lib/format";
import { FONT, INK, MUTED } from "../../lib/theme";
import type { UploadedFileInfo } from "../../components/UploadedFile";
import type { CreditNote } from "./creditNoteTypes";
import { InfoCard } from "./InfoBits";

interface CreditsAppliedSectionProps {
  creditNotes: CreditNote[];
  /** Invoice/credit-note currency (fixed per invoice). */
  currency: string;
  isRefundContext: boolean;
  fullyRefunded: boolean;
  outstanding: number;
  expanded: boolean;
  onExpand: () => void;
  /** Open a note's detail page (index into creditNotes). */
  onViewCn: (index: number) => void;
  /** Open a refund-proof attachment in the file preview overlay. */
  onPreviewProof: (file: UploadedFileInfo) => void;
}

export function CreditsAppliedSection({
  creditNotes,
  currency,
  isRefundContext,
  fullyRefunded,
  outstanding,
  expanded,
  onExpand,
  onViewCn,
  onPreviewProof,
}: CreditsAppliedSectionProps) {
  // Cancellation application status for the row hint.
  const cnAppliedLabel = (cn: CreditNote) => {
    if (cn.draft) return "Draft";
    if (cn.cancelled) return "Cancelled";
    // Refund CN (DES-720): reads "Applied" once committed, until the payout record (proof) takes over
    // the row below ("Awaiting refund by accountant" / green "Refunded").
    if (isRefundContext) return cn.refundProof ? null : "Applied";
    // Single-invoice model (DES-719): a created cancellation note is simply "Applied" (no
    // Open / Partially / Fully split — Create applies it in full to its one invoice).
    return "Applied";
  };
  const reasonOf = (cn: CreditNote) => (cn.reason === "Others" ? (cn.reasonNote || "Other") : cn.reason);
  const ordered = creditNotes.map((cn, idx) => ({ cn, idx })).reverse();
  const collapsible = ordered.length > 2 && !expanded;
  const visible = collapsible ? ordered.slice(0, 2) : ordered;
  return (
    <InfoCard title={`Credits ( ${creditNotes.length} )`}>
      <>
        {visible.map(({ cn, idx }, i) => {
          const rowBorder = i === visible.length - 1 ? "" : "border-b border-[rgba(160,160,160,0.18)]";
          const proof = cn.refundProof;
          const appliedLabel = cnAppliedLabel(cn);
          // Every row opens the credit-note detail page — the actions (Apply / Edit / Send / Void) live there.
          const onRowTap = () => onViewCn(idx);
          return (
            <div key={cn.no} className={`py-3 ${rowBorder}`}>
              <div role="button" tabIndex={0} onClick={onRowTap} className="group flex items-center gap-3 text-left cursor-pointer">
                <span className="flex-1 min-w-0">
                  <span className="block text-[14px] font-medium truncate" style={{ ...FONT, color: INK }}>{cn.no}</span>
                  {cn.reason && (
                    <span className="block text-[12px] leading-[1.3] mt-0.5 truncate" style={{ ...FONT, color: MUTED }}>Reason: {reasonOf(cn)}</span>
                  )}
                  {/* Cancellation CN → application status as a coloured chip (Figma 696:4595). */}
                  {appliedLabel ? (
                    <span
                      className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold"
                      style={{ ...FONT,
                        background: appliedLabel === "Draft" ? "#f2f4f7" : appliedLabel === "Applied" ? "#ecfdf3" : "#f3f3f3",
                        borderColor: appliedLabel === "Draft" ? "#e4e7ec" : appliedLabel === "Applied" ? "#abefc6" : "rgba(160,160,160,0.35)",
                        color: appliedLabel === "Draft" ? "#475467" : appliedLabel === "Applied" ? "#067647" : "#9a9a9a",
                      }}
                    >
                      {appliedLabel}
                    </span>
                  ) : isRefundContext ? null : (
                    <span className="block text-[12px] leading-[1.3] mt-0.5" style={{ ...FONT, color: cn.sent ? MUTED : "#b45309" }}>
                      {cn.sent ? `Sent on ${cn.sentDate}` : "Not sent yet"}
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-1.5 shrink-0">
                  {/* A Draft hasn't been applied, so show its amount neutrally (no red −). */}
                  <span className="text-[14px] font-medium" style={{ ...FONT, color: cn.draft ? MUTED : "#b42318" }}>{cn.draft ? money(cn.amount, currency) : `−${money(cn.amount, currency)}`}</span>
                  <ChevronRightIcon className="transition-transform group-hover:translate-x-0.5" style={{ fontSize: 18, color: MUTED }} />
                </span>
              </div>
              {/* DES-720 refund record. Awaiting (BA confirmed / marked refunded) → a compact "Awaiting
                  refund by accountant" line (the method + evidence live on the CN detail). Settled → the
                  green "Refunded" record with method·date + proof. */}
              {proof && (proof.awaiting ? (
                <div className="mt-2 rounded-lg border border-[#fde68a] bg-[#fff7e6] px-2.5 py-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#b45309" }} />
                  <span className="text-[12px] font-semibold" style={{ ...FONT, color: "#b45309" }}>Awaiting refund by accountant</span>
                </div>
              ) : (
                <div className="mt-2 rounded-lg border border-[rgba(15,157,88,0.25)] bg-[rgba(15,157,88,0.06)] px-2.5 py-2 flex flex-col gap-2">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#0f9d58" }} />
                    <span className="text-[12px] font-semibold" style={{ ...FONT, color: "#0f9d58" }}>Refunded</span>
                    <span className="text-[12px] ml-auto text-right" style={{ ...FONT, color: MUTED }}>{proof.method} · {fmtDate(proof.date)}</span>
                  </span>
                  {proof.referenceNo && (
                    <span className="text-[12px]" style={{ ...FONT, color: MUTED }}>Ref: {proof.referenceNo}</span>
                  )}
                  {proof.proofFile && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onPreviewProof({ name: proof.proofFile!, size: 128000 }); }}
                      className="flex items-center gap-2.5 rounded-md bg-white border border-[rgba(160,160,160,0.3)] px-2 py-1.5 text-left"
                    >
                      <span className="w-7 h-7 rounded flex items-center justify-center shrink-0" style={{ background: "#f0eee6" }}>
                        <ReceiptLongOutlinedIcon style={{ fontSize: 16, color: MUTED }} />
                      </span>
                      <span className="flex-1 min-w-0 text-[12px] font-medium truncate" style={{ ...FONT, color: INK }}>{proof.proofFile}</span>
                      <span className="text-[12px] font-medium shrink-0" style={{ ...FONT, color: "#0f9d58" }}>View ›</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          );
        })}
        {collapsible && (
          <button onClick={onExpand} className="w-full flex items-center justify-center gap-1 py-3 border-t border-[rgba(160,160,160,0.18)]">
            <span className="text-[13px] font-medium" style={{ ...FONT, color: INK }}>View all credit notes ({creditNotes.length})</span>
          </button>
        )}
        {/* MVP: one credit note per invoice — no "Add (refund) credit note" here. The first (and only)
            CN is raised from the invoice's Refund action when none exists yet. */}
      </>
    </InfoCard>
  );
}
