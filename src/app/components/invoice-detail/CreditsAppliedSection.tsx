// Credits Applied section (DES-719/763) — rendered just below the invoice status card. Recent-first;
// collapse to 2 with "View all"; each row opens the credit-note detail page (actions live there).
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AddIcon from "@mui/icons-material/Add";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import { money, fmtDate } from "../../lib/format";
import { FONT, INK, MUTED } from "../../lib/theme";
import type { UploadedFileInfo } from "../UploadedFile";
import type { CreditNote } from "./creditNoteTypes";
import { InfoCard } from "./InfoBits";

interface CreditsAppliedSectionProps {
  creditNotes: CreditNote[];
  isRefundContext: boolean;
  /** Whether more cancellation credit can still be raised ("+ Add credit note"). */
  cancellable: boolean;
  fullyRefunded: boolean;
  outstanding: number;
  expanded: boolean;
  onExpand: () => void;
  /** Open a note's detail page (index into creditNotes). */
  onViewCn: (index: number) => void;
  onAddCredit: () => void;
  onAddRefund: () => void;
  /** Open a refund-proof attachment in the file preview overlay. */
  onPreviewProof: (file: UploadedFileInfo) => void;
}

export function CreditsAppliedSection({
  creditNotes,
  isRefundContext,
  cancellable,
  fullyRefunded,
  outstanding,
  expanded,
  onExpand,
  onViewCn,
  onAddCredit,
  onAddRefund,
  onPreviewProof,
}: CreditsAppliedSectionProps) {
  // Cancellation application status for the row hint.
  const cnAppliedLabel = (cn: CreditNote) => {
    if (cn.draft) return "Draft";
    if (cn.cancelled) return "Cancelled";
    if (isRefundContext) return null;
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
                  <span className="text-[14px] font-medium" style={{ ...FONT, color: cn.draft ? MUTED : "#b42318" }}>{cn.draft ? money(cn.amount) : `−${money(cn.amount)}`}</span>
                  <ChevronRightIcon className="transition-transform group-hover:translate-x-0.5" style={{ fontSize: 18, color: MUTED }} />
                </span>
              </div>
              {/* DES-720 refund record — a green "Refunded" chip + method·date, and (manual path only)
                  the tappable proof attachment. BA transfers record method·date with no file. */}
              {proof && (
                <div className="mt-2 rounded-lg border border-[rgba(15,157,88,0.25)] bg-[rgba(15,157,88,0.06)] px-2.5 py-2 flex flex-col gap-2">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#0f9d58" }} />
                    <span className="text-[12px] font-semibold" style={{ ...FONT, color: "#0f9d58" }}>Refunded</span>
                    <span className="text-[12px] ml-auto text-right" style={{ ...FONT, color: MUTED }}>{proof.method} · {fmtDate(proof.date)}</span>
                  </span>
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
              )}
            </div>
          );
        })}
        {collapsible && (
          <button onClick={onExpand} className="w-full flex items-center justify-center gap-1 py-3 border-t border-[rgba(160,160,160,0.18)]">
            <span className="text-[13px] font-medium" style={{ ...FONT, color: INK }}>View all credit notes ({creditNotes.length})</span>
          </button>
        )}
        {cancellable && (
          <button onClick={onAddCredit} className="group w-full flex items-center gap-1.5 py-3 border-t border-[rgba(160,160,160,0.18)]">
            <AddIcon style={{ fontSize: 18, color: "#ff4a15" }} />
            <span className="text-[14px] font-medium" style={{ ...FONT, color: "#ff4a15" }}>Add credit note</span>
          </button>
        )}
        {/* DES-720 cumulative refunds: as long as the invoice isn't fully refunded, the client can
            raise ANOTHER refund credit note (capped at the remaining invoice value) — including after
            an earlier refund has already been paid out. Creating one re-opens a pending payout, so the
            dock's "Refund Credit Note" CTA reappears. Reuses the refund form (cap = outstanding). */}
        {isRefundContext && !fullyRefunded && outstanding > 0.001 && (
          <button onClick={onAddRefund} className="group w-full flex items-center gap-1.5 py-3 border-t border-[rgba(160,160,160,0.18)]">
            <AddIcon style={{ fontSize: 18, color: "#ff4a15" }} />
            <span className="text-[14px] font-medium" style={{ ...FONT, color: "#ff4a15" }}>Add refund credit note</span>
          </button>
        )}
      </>
    </InfoCard>
  );
}
