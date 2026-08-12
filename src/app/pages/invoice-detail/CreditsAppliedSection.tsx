// Credits Applied section (DES-719/763) — rendered just below the invoice status card. Recent-first;
// collapse to 2 with "View all"; each row opens the credit-note detail page (actions live there).
// Row chrome matches ui/Tile's own recipe (Figma "Sales Invoice — Client", node 1927-12439) — a
// plain Tile can't be reused verbatim (status label + right-side value/chevron + below-row proof
// blocks aren't shapes Tile's props support), so each row replicates Tile's border/radius/padding.
import { Receipt } from "lucide-react";
import { money, fmtDate } from "../../lib/format";
import { FONT, INK, MUTED } from "../../lib/theme";
import type { UploadedFileInfo } from "../../components/UploadedFile";
import type { CreditNote } from "./creditNoteTypes";

interface CreditsAppliedSectionProps {
  creditNotes: CreditNote[];
  /** Invoice/credit-note currency (fixed per invoice). */
  currency: string;
  isRefundContext: boolean;
  /** A refund has actually been paid out (any amount) — mirrors the invoice's "Refunded" tag. */
  refundSettled: boolean;
  outstanding: number;
  expanded: boolean;
  onExpand: () => void;
  /** Open a note's detail page (index into creditNotes). */
  onViewCn: (index: number) => void;
  /** Open a refund-proof attachment in the file preview overlay. */
  onPreviewProof: (file: UploadedFileInfo) => void;
}

/** Same 20px/1px-stroke chevron ui/Tile and ui/ListRow each define locally (not exported by
 *  either) — matching the DS spec exactly rather than reaching for a differently-weighted icon. */
function ChevronRightIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CreditsAppliedSection({
  creditNotes,
  currency,
  isRefundContext,
  refundSettled,
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
    // Refund CN (DES-720): a settled payout (proof, not awaiting) shows its own "Refunded" record
    // below instead, but "Awaiting refund" has no extra proof detail to show — same top label
    // treatment as every other status, not a separate banner.
    if (isRefundContext) {
      if (cn.refundProof?.awaiting) return "Awaiting refund";
      if (cn.refundProof) return null;
      return refundSettled ? "Refunded" : "Applied";
    }
    // Single-invoice model (DES-719): a created cancellation note is simply "Applied" (no
    // Open / Partially / Fully split — Create applies it in full to its one invoice).
    return "Applied";
  };
  // Badge text color per application status — Figma (node 1927:12204): white bg + neutral border,
  // only the TEXT carries the status color (not a filled pill). Reuses the same status tokens as
  // lib/status.ts instead of one-off hex.
  const CHIP_TEXT: Record<string, string> = {
    Draft: "var(--text-secondary)",
    Applied: "var(--text-success-primary)",
    Refunded: "var(--text-info-primary)",
    Cancelled: "var(--text-secondary)",
    "Awaiting refund": "var(--text-warning-primary)",
  };
  const reasonOf = (cn: CreditNote) => (cn.reason === "Others" ? (cn.reasonNote || "Other") : cn.reason);
  const ordered = creditNotes.map((cn, idx) => ({ cn, idx })).reverse();
  const collapsible = ordered.length > 2 && !expanded;
  const visible = collapsible ? ordered.slice(0, 2) : ordered;
  return (
    <div className="flex flex-col gap-2">
      {/* "( N )" count, same convention as the Items card — a cancelled note is retired rather
          than reused (a new one can be raised after), so this can genuinely hold 2+ records (e.g.
          one Cancelled + one Applied), not just the single active note at a time. */}
      <p className="body-sm-medium" style={{ ...FONT, color: INK }}>{`Credits (${creditNotes.length})`}</p>
      <div className="flex flex-col gap-2">
        {visible.map(({ cn, idx }) => {
          const proof = cn.refundProof;
          const appliedLabel = cnAppliedLabel(cn);
          // Every row opens the credit-note detail page — the actions (Apply / Edit / Send / Void) live there.
          const onRowTap = () => onViewCn(idx);
          return (
            <div
              key={cn.no}
              className="rounded-2xl border w-full box-border"
              style={{ background: "var(--bg-neutral-primary)", borderColor: "var(--border-neutral-primary)" }}
            >
              <div role="button" tabIndex={0} onClick={onRowTap} className="group flex items-center gap-2.5 px-4 py-3 min-h-[65px] text-left cursor-pointer">
                <span className="flex-1 min-w-0 flex flex-col gap-0.5">
                  {/* Cancellation CN → application status as its own line above the number, plain
                      colored text (no pill/border — Figma "Sales Invoice — Client", node 1927-12439). */}
                  {appliedLabel && (
                    <span className="caption-medium" style={{ ...FONT, color: CHIP_TEXT[appliedLabel] ?? "var(--text-secondary)" }}>
                      {appliedLabel}
                    </span>
                  )}
                  <span className="block text-[14px] truncate min-w-0" style={{ ...FONT, color: INK }}>{cn.no}</span>
                  {cn.reason && (
                    <span className="block text-[12px] leading-[1.3] truncate" style={{ ...FONT, color: MUTED }}>Reason: {reasonOf(cn)}</span>
                  )}
                  {!appliedLabel && !isRefundContext && (
                    <span className="block text-[12px] leading-[1.3]" style={{ ...FONT, color: cn.sent ? MUTED : "var(--text-warning-primary)" }}>
                      {cn.sent ? `Sent ${cn.sentDate}` : "Not sent yet"}
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-1.5 shrink-0">
                  {/* A Draft hasn't been applied, so show its amount neutrally (no red −). */}
                  <span className="text-[14px] font-medium" style={{ ...FONT, color: cn.draft ? MUTED : "var(--text-error-primary)" }}>{cn.draft ? money(cn.amount, currency) : `−${money(cn.amount, currency)}`}</span>
                  <span className="flex items-center justify-center w-[30px] h-[30px] shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: MUTED }}>
                    <ChevronRightIcon />
                  </span>
                </span>
              </div>
              {/* DES-720 settled refund record — method·date + proof. Awaiting refund has no extra
                  proof detail yet, so it's covered by the top status label above instead (no banner). */}
              {proof && !proof.awaiting && (
                <div className="mx-4 mb-3 rounded-lg border border-[rgba(15,157,88,0.25)] bg-[rgba(15,157,88,0.06)] px-2.5 py-2 flex flex-col gap-2">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--icon-success-primary)" }} />
                    <span className="text-[12px] font-semibold" style={{ ...FONT, color: "var(--text-success-primary)" }}>Refunded</span>
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
                        <Receipt size={16} strokeWidth={1.5} color={MUTED} />
                      </span>
                      <span className="flex-1 min-w-0 text-[12px] font-medium truncate" style={{ ...FONT, color: INK }}>{proof.proofFile}</span>
                      <span className="text-[12px] font-medium shrink-0" style={{ ...FONT, color: "var(--text-success-primary)" }}>View ›</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {collapsible && (
        <button onClick={onExpand} className="w-full flex items-center justify-center gap-1 py-2.5">
          <span className="text-[13px] font-medium" style={{ ...FONT, color: INK }}>View all credit notes ({creditNotes.length})</span>
        </button>
      )}
      {/* MVP: one credit note per invoice — no "Add (refund) credit note" here. The first (and only)
          CN is raised from the invoice's Refund action when none exists yet. */}
    </div>
  );
}
