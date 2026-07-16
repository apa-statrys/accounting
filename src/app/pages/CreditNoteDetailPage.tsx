import { useState } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { Asterisk } from "lucide-react";
import StatusBar from "../components/StatusBar";
import { SheetHeader, HeaderIconButton } from "../components/SheetHeader";
import { ButtonDock } from "../components/ButtonDock";
import { BottomSheet } from "../components/BottomSheet";
import { SendInvoiceSheet } from "../components/SendInvoiceSheet";
import { ReviewEmail } from "./ReviewEmail";
import { ShareLinkSheet } from "../components/ShareLinkSheet";
import { SendSuccessToast } from "../components/SendSuccessToast";
import { CreditNotePreviewPage } from "./CreditNotePreviewPage";
import { FilePreviewOverlay, type UploadedFileInfo } from "../components/UploadedFile";
import { money, fmtDate } from "../lib/format";

import { FONT, INK, MUTED } from "../lib/theme";


// Status chip palette (DES-721). Refunded = indigo, Pending Refund = amber, Applied/other = green.
const STATUS_CHIP: Record<string, { bg: string; border: string; text: string }> = {
  // Cancellation credit note (DES-719, single-invoice): Draft (not applied) → Applied.
  "Draft": { bg: "#f2f4f7", border: "#e4e7ec", text: "#475467" },
  "Applied": { bg: "#ecfdf3", border: "#abefc6", text: "#067647" },
  // Legacy application lifecycle (DES-763) — retained for register/list data.
  "Open": { bg: "#eef4ff", border: "#c7d8fe", text: "#2f5fd0" },
  "Partially Applied": { bg: "#fff7e6", border: "#fde68a", text: "#b45309" },
  "Fully Applied": { bg: "#ecfdf3", border: "#abefc6", text: "#067647" },
  // Refund lifecycle (money) — for refund credit notes.
  "Pending Refund": { bg: "#fff7e6", border: "#fde68a", text: "#b45309" },
  "Awaiting refund": { bg: "#fff7e6", border: "#fde68a", text: "#b45309" },
  "Partially Refunded": { bg: "#eef4ff", border: "#c7d8fe", text: "#2f5fd0" },
  "Refunded": { bg: "#eef2ff", border: "#c7d2fe", text: "#4338ca" },
  "Cancelled": { bg: "#f3f3f3", border: "rgba(160,160,160,0.35)", text: "#9a9a9a" },
};

export interface CreditNoteRefundProof {
  date: string;
  method: string;
  amount: number;
  proofFile?: string;
  referenceNo?: string;
  /** External refund submitted, awaiting accountant confirmation (vs a settled/reconciled refund). */
  awaiting?: boolean;
}

export interface CreditNoteDetailPageProps {
  creditNoteNo: string;
  /** The invoice this credit note relates to. */
  invoiceNo: string;
  customerName: string;
  customerEmail?: string;
  /** Sender company email (from Invoice Settings) — the Cc when "Send me a copy" is on. */
  companyEmail?: string;
  issueDateLabel: string;
  /** Resolved due date label ("26 Jul 2026") — shown in the Details card. */
  dueDateLabel?: string;
  currency?: string;
  /** Credit-note total (positive; rendered as a negative). */
  total: number;
  /** The linked invoice's total — drives the Summary's Invoice Total / Remaining Balance rows. */
  invoiceTotal?: number;
  /** Credited line items (optional — the shared register may not carry them). When a line is a clean
   *  quantity credit it carries `qty` + `unitPrice` (rendered "qty × price"); otherwise it's a value
   *  reduction shown as "Price adjustment". */
  lines?: { name: string; amount: number; qty?: number; unitPrice?: number }[];
  reason?: string;
  reasonNote?: string;
  kind?: "cancellation" | "refund";
  /** The credit note's status. Cancellation (DES-763): Open / Partially Applied / Fully Applied /
   *  Cancelled. Refund (DES-720): Pending Refund / Partially Refunded / Refunded. */
  status?: string;
  /** Refund evidence (DES-720) — shown as a "Refunded" record with an optional attachment. */
  refundProof?: CreditNoteRefundProof;
  /** Whether the note has been sent to the customer (secondary indicator + Send vs Resend). */
  sent?: boolean;
  /** When set, the subline reads "Updated <date>" (the note was edited) instead of "Created <date>". */
  updatedDateLabel?: string;
  onBack: () => void;
  /** DES-721 AC3 — open the linked invoice. */
  onViewInvoice?: () => void;
  /** Report that the note was sent so the caller can persist the sent state. */
  onSent?: () => void;
  /** DES-763 — apply the credit note to its invoice (Open / Partially Applied only). */
  onApply?: () => void;
  /** DES-719 — edit the credit note (Open / Partially Applied only). */
  onEdit?: () => void;
  /** DES-763 — void the credit note (Open only, never applied). */
  onCancel?: () => void;
  /** Receiving account shown on the note (Figma 1209) — omit to hide the card. */
  receivingAccount?: { name: string; number: string; primary: boolean };
}

/** Small dashed cream card matching the invoice detail's InfoCard. */
// Detail card (Figma 1209 style): white with a dashed border + soft shadow and the title as the first
// row inside (grey uppercase + full-width divider). `tone="hero"` is the cream status card.
function Card({ title, tone = "section", children }: { title?: string; tone?: "section" | "hero"; children: React.ReactNode }) {
  const hero = tone === "hero";
  return (
    <div
      className={`border border-dashed rounded-[12px] px-4 ${hero ? "bg-[#faf9f4] border-[rgba(160,160,160,0.5)]" : "bg-white border-[rgba(160,160,160,0.2)]"}`}
      style={{ boxShadow: "0px 4px 14px 0px rgba(226,220,203,0.3)" }}
    >
      {title && (
        <p className="-mx-4 px-4 pt-3.5 pb-3 text-[12px] font-bold uppercase tracking-wide leading-[16.5px] border-b border-[rgba(160,160,160,0.2)]" style={{ ...FONT, color: "#a0a0a0" }}>{title}</p>
      )}
      {children}
    </div>
  );
}

function Row({ label, value, last }: { label: string; value: React.ReactNode; last?: boolean }) {
  return (
    <div className={`flex items-start justify-between gap-4 py-3 ${last ? "" : "border-b border-[rgba(160,160,160,0.18)]"}`}>
      <span className="text-[13px] shrink-0" style={{ ...FONT, color: MUTED }}>{label}</span>
      <span className="min-w-0 text-right text-[13px] font-medium" style={{ ...FONT, color: INK }}>{value}</span>
    </div>
  );
}

/**
 * Credit Note detail page (DES-721) — the structured landing view for a credit note (status, key
 * details, related invoice, and actions in the dock), mirroring the invoice detail. The PDF document
 * is a secondary "Preview PDF" action, not the landing (Stripe/Temu pattern).
 */
export function CreditNoteDetailPage(props: CreditNoteDetailPageProps) {
  const {
    creditNoteNo, invoiceNo, customerName, customerEmail, companyEmail = "hello@lumenstudio.co", issueDateLabel, dueDateLabel, currency = "USD",
    total, invoiceTotal, lines, reason, reasonNote, kind = "cancellation", status, refundProof, sent, updatedDateLabel,
    onBack, onViewInvoice, onSent, onApply, onEdit, onCancel, receivingAccount,
  } = props;

  const [actionsOpen, setActionsOpen] = useState(false);
  // Draft delete confirmation (DES-719 AC7).
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [sentLocal, setSentLocal] = useState(!!sent);
  // Send sub-flow (reused from the invoice send flow).
  const [sendSheetOpen, setSendSheetOpen] = useState(false);
  const [emailReviewOpen, setEmailReviewOpen] = useState(false);
  const [shareLinkOpen, setShareLinkOpen] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);
  // Whether the PDF preview was opened from the send flow (download = complete send) or ⋯ (just view).
  const [pdfFromSend, setPdfFromSend] = useState(false);
  const [proofPreview, setProofPreview] = useState<UploadedFileInfo | null>(null);
  const [toastOpen, setToastOpen] = useState(false);

  // Status chip: application lifecycle (DES-763) for cancellation, money lifecycle for refund.
  const displayStatus = status ?? (kind === "refund" ? "Pending Refund" : "Open");
  const chip = STATUS_CHIP[displayStatus] ?? STATUS_CHIP["Open"];
  const reasonText = reason || null;
  const amountLabel = `${currency} ${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  // Action layout by status (cancellation credit notes):
  //  • Open              → dock: Apply to invoice (primary) + Edit (secondary); ⋯: Cancel, Preview as PDF.
  //  • Partially Applied → dock: Send (primary) + Edit Credit Note (secondary); ⋯: Preview as PDF.
  //  • Fully Applied     → dock: Send (single, no Edit); ⋯: Preview as PDF.
  //  • Cancelled         → dock: Preview as PDF only.
  // Refund credit notes  → dock: Send/Resend; ⋯: Preview as PDF.
  const isCancellation = kind !== "refund";
  const isRefund = kind === "refund";
  // A Draft (DES-719) behaves like the old "Open": Apply to invoice + Edit dock, cancel/delete via ⋯.
  const isOpen = isCancellation && (displayStatus === "Open" || displayStatus === "Draft");
  const isPartiallyApplied = isCancellation && displayStatus === "Partially Applied";
  // Single-invoice model: "Applied" behaves like the old Fully Applied (Send-only, non-editable).
  const isFullyApplied = isCancellation && (displayStatus === "Fully Applied" || displayStatus === "Applied");
  const isApplied = isPartiallyApplied || isFullyApplied;
  // DES-720 — a refund CN is Pending Refund until transferred. NOT editable after creation (AC2) — only
  // cancellable (⋯) while still pending; `onCancel` is wired by the invoice-detail entry.
  const isPendingRefund = isRefund && displayStatus === "Pending Refund";
  // Settled refund (Partially Refunded / Refunded) — past tense, Send dock, no ⋯ menu.
  const refundSettled = isRefund && (displayStatus === "Partially Refunded" || displayStatus === "Refunded");
  // Cancelled record (a voided Open/Pending note, kept for history) — Preview-only, no menu, never applied.
  const isCancelled = displayStatus === "Cancelled";
  // Actionable Open = the invoice-detail / CN-list entry (Apply wired). Where Apply ISN'T wired (e.g. the
  // Sales Invoice List CN preview), an Open note is Preview-only — NEVER sendable, since an unapplied credit
  // must be applied to the invoice before it's sent to the customer (#4).
  // A Draft can only be applied once its required fields are filled (reason + description + a credit
  // amount). An incomplete draft leads with Edit instead of Apply to Invoice.
  // Complete = a reason + a credit amount. The free-text description is only required when the reason is
  // "Other" (mirrors the form's create validation) — preset reasons don't carry a note.
  const draftComplete = !!reason && total > 0.001 && (reason !== "Other" || !!(reasonNote && reasonNote.trim()));
  const canApply = isOpen && !!onApply && draftComplete;
  // ⋯ exists for a Draft (Delete only), an Applied note (Cancel + Preview), a Pending Refund (Cancel),
  // or a Cancelled note (Preview as PDF lives in the menu — no dock).
  const hasMenu = (isOpen && !!onCancel) || (isApplied && !!onCancel) || (isPendingRefund && !!onCancel) || isCancelled;
  const openSend = () => setSendSheetOpen(true);

  const closeSend = () => { setSendSheetOpen(false); setEmailReviewOpen(false); setShareLinkOpen(false); setPdfOpen(false); };
  const completeSend = () => { closeSend(); setSentLocal(true); setToastOpen(true); onSent?.(); };
  const openPdfPreview = () => { setActionsOpen(false); setPdfFromSend(false); setPdfOpen(true); };

  return (
    <div className="absolute inset-0 z-40 bg-white rounded-[48px] overflow-hidden flex flex-col" style={{ width: 375, height: 812 }}>
      {/* Scenario annotation — shown in the white space to the right of the phone frame, only on a
          cancelled credit note, explaining how it reversed the void back to the original invoice. */}
      {isCancelled && (
        <div
          className="hidden lg:block fixed top-1/2 -translate-y-1/2 left-[calc(50%+230px)] w-[320px]"
          style={FONT}
        >
          <div className="rounded-2xl bg-white shadow-[0_8px_30px_rgba(16,24,40,0.10)] border border-black/5 p-6">
            <p className="text-[12px] font-bold uppercase tracking-wide text-[#a0a0a0] mb-4">Scenario</p>
            <p className="text-[15px] leading-[1.55] text-[#1b1b1b] mb-4">
              A customer cancels a project, so the user creates a full credit note.
            </p>
            <p className="text-[15px] leading-[1.55] text-[#1b1b1b] mb-4">
              Before the customer pays, they change their mind and want to continue with the project.
            </p>
            <p className="text-[15px] leading-[1.55] text-[#1b1b1b]">
              The user cancels the credit note, so the invoice returns to its original amount.
            </p>
          </div>
        </div>
      )}

      <StatusBar />

      <SheetHeader
        // Drafts carry no CN number yet (decided 2026-07-15) — a generic title until the note is applied.
        title={status === "Draft" ? (kind === "refund" ? "Refund Credit Note" : "Credit Note") : creditNoteNo}
        type="inside-page"
        state="fixed"
        leading={<HeaderIconButton aria-label="Back" onClick={onBack}><ChevronLeftIcon /></HeaderIconButton>}
        trailing={hasMenu ? <HeaderIconButton aria-label="More actions" onClick={() => setActionsOpen(true)}><MoreHorizIcon /></HeaderIconButton> : <span className="w-[30px] h-[30px] block" aria-hidden />}
      />

      <div className="flex-1 overflow-y-auto thin-scrollbar bg-white px-4 pt-5 pb-44 flex flex-col gap-4">
        {/* Status + amount — cream hero card. */}
        <Card tone="hero">
          <div className="py-3 flex flex-col gap-1.5">
            <span className="self-start flex items-center gap-1.5">
              <span className="px-2.5 py-0.5 rounded-full border text-[11px] font-bold" style={{ ...FONT, background: chip.bg, borderColor: chip.border, color: chip.text }}>{displayStatus}</span>
            </span>
            <p className="text-[20px] font-black leading-none tracking-[-0.8px]" style={{ ...FONT, color: "#b42318" }}>−{money(total)}</p>
            <p className="text-[12px]" style={{ ...FONT, color: MUTED }}>
              {isCancelled
                ? `Cancelled on ${updatedDateLabel ?? issueDateLabel}`
                : isRefund
                ? (refundSettled ? `Refunded on ${refundProof ? fmtDate(refundProof.date) : issueDateLabel}` : `Created on ${issueDateLabel}`)
                : isApplied
                  ? `Applied on ${updatedDateLabel ?? issueDateLabel}`
                  : `${updatedDateLabel ? "Updated" : "Created"} on ${updatedDateLabel ?? issueDateLabel}`}
            </p>
          </div>
        </Card>

        {/* Credit Details — Credit Issue Date / Due Date / Currency + reason (+ description) + the related
            invoice, all in one card (Figma 1209). The reason row is hidden until the client fills it in. */}
        <Card title="Credit Details">
          <Row label="Credit Issue Date" value={issueDateLabel} />
          <Row label="Due Date" value={dueDateLabel ?? "—"} />
          <Row label="Currency" value={currency} />
          {reasonText && (
            <div className="flex items-start justify-between gap-4 py-3 border-b border-[rgba(160,160,160,0.18)]">
              <span className="text-[13px] shrink-0" style={{ ...FONT, color: MUTED }}>Reason</span>
              <span className="min-w-0 text-right">
                <span className="block text-[13px] font-medium" style={{ ...FONT, color: INK }}>{reasonText}</span>
                {reasonNote && <span className="block text-[12px] leading-[1.35] mt-0.5" style={{ ...FONT, color: MUTED }}>{reasonNote}</span>}
              </span>
            </div>
          )}
          {onViewInvoice ? (
            <button onClick={onViewInvoice} className="group w-full flex items-center justify-between gap-4 py-3 text-left">
              <span className="text-[13px] shrink-0" style={{ ...FONT, color: MUTED }}>Related Invoice</span>
              <span className="flex items-center gap-1 min-w-0">
                <span className="text-[13px] font-medium truncate" style={{ ...FONT, color: INK }}>{invoiceNo}</span>
                <ChevronRightIcon className="transition-transform group-hover:translate-x-0.5 shrink-0" style={{ fontSize: 16, color: "#808080" }} />
              </span>
            </button>
          ) : (
            <Row label="Related Invoice" value={invoiceNo} last />
          )}
        </Card>

        {/* Credit to / Refund to */}
        <Card title={isRefund ? (refundSettled ? "Refunded to" : "Refund to") : "Credit to"}>
          <div className="py-3">
            <span className="block text-[14px] font-medium leading-tight" style={{ ...FONT, color: INK }}>{customerName || "—"}</span>
            {customerEmail && <span className="block text-[12px] leading-[1.4] mt-0.5" style={{ ...FONT, color: MUTED }}>{customerEmail}</span>}
          </div>
        </Card>

        {/* Credited / refunded items — per-line amount "$X of $original" (both cancellation and refund). */}
        {lines && lines.length > 0 && (
          <Card title={isRefund ? `${refundSettled ? "Refunded" : "Refund"} items (${lines.length})` : `Credited items (${lines.length})`}>
            <div className="pt-1">
              {lines.map((l, i) => {
                // Adaptive sub-line: a clean quantity credit shows "qty × unit price"; a value reduction
                // shows "Price adjustment" (cancellation only — refund items show no sub-line).
                const sub = l.qty != null && l.unitPrice != null
                  ? `${l.qty} × ${money(l.unitPrice)}`
                  : (!isRefund ? "Price adjustment" : null);
                return (
                  <div key={i} className={`flex items-start justify-between gap-3 py-2.5 ${i === lines.length - 1 ? "" : "border-b border-[rgba(160,160,160,0.18)]"}`}>
                    <span className="min-w-0 pr-2">
                      <span className="block text-[13px]" style={{ ...FONT, color: INK }}>{l.name}</span>
                      {sub && <span className="block text-[12px] mt-0.5" style={{ ...FONT, color: MUTED }}>{sub}</span>}
                    </span>
                    <span className="text-[13px] font-medium shrink-0" style={{ ...FONT, color: INK }}>{money(l.amount)}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Receiving account (Figma 1209) — the account the credit is set against. Not shown for a refund
            CN: the money goes OUT, and the account used is on the "Refund Method" card below. */}
        {receivingAccount && !isRefund && (
          <Card title="Receiving Account">
            <div className="py-3">
              <div className="flex items-center gap-2">
                <span className="w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0" style={{ background: "#E4002B" }}>
                  <Asterisk size={14} strokeWidth={3} color="#fff" />
                </span>
                <span className="text-[15px] font-medium truncate" style={{ ...FONT, color: INK }}>{receivingAccount.name}</span>
                {receivingAccount.primary && (
                  <span className="ml-auto shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold leading-[14px]" style={{ ...FONT, background: "#101828", color: "#fff" }}>PRIMARY</span>
                )}
              </div>
              <p className="text-[13px] leading-[1.4] mt-1 truncate" style={{ ...FONT, color: MUTED }}>{receivingAccount.number}</p>
            </div>
          </Card>
        )}

        {/* Summary — hidden until there's a credit amount (nothing to total on an empty draft). */}
        {total > 0.001 && (
        <Card title="Summary">
          <div className="pt-1">
            {(isOpen || isCancelled) && invoiceTotal !== undefined ? (
              // Not applied yet (Open) or cancelled — the credit hasn't reduced the invoice, so
              // Credit Amount reads "(Not Applied Yet)" and Amount Due = the FULL invoice total.
              <>
                <div className="flex items-center justify-between py-2.5 border-b border-[rgba(160,160,160,0.18)]">
                  <span className="text-[13px]" style={{ ...FONT, color: MUTED }}>Invoice Total</span>
                  <span className="text-[13px]" style={{ ...FONT, color: INK }}>{money(invoiceTotal)}</span>
                </div>
                <div className="flex items-start justify-between gap-3 py-2.5 border-b border-[rgba(160,160,160,0.18)]">
                  <span className="text-[13px]" style={{ ...FONT, color: MUTED }}>Credit Amount</span>
                  <span className="text-right">
                    <span className="block text-[13px] font-medium" style={{ ...FONT, color: "#b42318" }}>−{money(total)}</span>
                    <span className="block text-[11px] mt-0.5" style={{ ...FONT, color: MUTED }}>(Not Applied Yet)</span>
                  </span>
                </div>
                {/* Amount due once this credit is applied (Figma 1209 shows the projected balance). */}
                <div className="flex items-center justify-between gap-3 py-3 mt-1 -mx-4 px-4 rounded-b-[11px]" style={{ background: "#f4efe2" }}>
                  <span className="text-[15px] font-bold" style={{ ...FONT, color: INK }}>Amount Due</span>
                  <span className="text-[15px] font-bold shrink-0" style={{ ...FONT, color: INK }}>{money(Math.max(0, invoiceTotal - total))}</span>
                </div>
              </>
            ) : isRefund && invoiceTotal !== undefined ? (
              // Refund summary (DES-720): Invoice Total + the Refund Amount (the amount refunded).
              <>
                <div className="flex items-center justify-between py-2.5 border-b border-[rgba(160,160,160,0.18)]">
                  <span className="text-[13px]" style={{ ...FONT, color: MUTED }}>Invoice Total</span>
                  <span className="text-[13px]" style={{ ...FONT, color: INK }}>{money(invoiceTotal)}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-[15px] font-bold" style={{ ...FONT, color: INK }}>Refund Amount</span>
                  <span className="text-[15px] font-bold shrink-0" style={{ ...FONT, color: "#b42318" }}>−{money(total)}</span>
                </div>
              </>
            ) : isCancellation && invoiceTotal !== undefined ? (
              <>
                <div className="flex items-center justify-between py-2.5 border-b border-[rgba(160,160,160,0.18)]">
                  <span className="text-[13px]" style={{ ...FONT, color: MUTED }}>Invoice Total</span>
                  <span className="text-[13px]" style={{ ...FONT, color: INK }}>{money(invoiceTotal)}</span>
                </div>
                <div className="flex items-center justify-between py-2.5 border-b border-[rgba(160,160,160,0.18)]">
                  <span className="text-[13px]" style={{ ...FONT, color: MUTED }}>Credit Amount</span>
                  <span className="text-[13px] font-medium" style={{ ...FONT, color: "#b42318" }}>−{money(total)}</span>
                </div>
                {isApplied ? (
                  // Applied (Partially/Fully) → "Amount Due" (the current balance), highlighted like the design.
                  <div className="flex items-center justify-between gap-3 py-3 mt-1 -mx-4 px-4 rounded-b-[11px]" style={{ background: "#f4efe2" }}>
                    <span className="text-[15px] font-bold" style={{ ...FONT, color: INK }}>Amount Due</span>
                    <span className="text-[15px] font-bold shrink-0" style={{ ...FONT, color: INK }}>{money(Math.max(0, invoiceTotal - total))}</span>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3 py-3">
                    <span className="min-w-0">
                      <span className="block text-[15px] font-bold" style={{ ...FONT, color: INK }}>Remaining Balance</span>
                      <span className="block text-[11px] leading-[1.3] mt-0.5" style={{ ...FONT, color: MUTED }}>(after applying)</span>
                    </span>
                    <span className="text-[15px] font-bold shrink-0" style={{ ...FONT, color: INK }}>{money(Math.max(0, invoiceTotal - total))}</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center justify-between py-2.5 border-b border-[rgba(160,160,160,0.18)]">
                  <span className="text-[13px]" style={{ ...FONT, color: MUTED }}>Subtotal credited</span>
                  <span className="text-[13px]" style={{ ...FONT, color: INK }}>−{money(total)}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-[15px] font-bold" style={{ ...FONT, color: INK }}>Total credited</span>
                  <span className="text-[15px] font-bold" style={{ ...FONT, color: "#b42318" }}>−{money(total)}</span>
                </div>
              </>
            )}
          </div>
        </Card>
        )}

        {/* Refund method (DES-720) — the bank account, date and proof, as a plain detail card (the
            awaiting/refunded status is shown on the hero chip, not here). */}
        {refundProof && (
          <Card title="Refund Method">
            <Row label="Bank account" value={refundProof.method} />
            <Row label="Refund date" value={fmtDate(refundProof.date)} last={!refundProof.referenceNo && !refundProof.proofFile} />
            {refundProof.referenceNo && (
              <Row label="Reference" value={refundProof.referenceNo} last={!refundProof.proofFile} />
            )}
            {refundProof.proofFile && (
              <div className="py-3">
                <button
                  onClick={() => setProofPreview({ name: refundProof.proofFile!, size: 128000 })}
                  className="w-full flex items-center gap-2.5 rounded-md bg-white border border-[rgba(160,160,160,0.3)] px-2 py-1.5 text-left"
                >
                  <span className="w-7 h-7 rounded flex items-center justify-center shrink-0" style={{ background: "#f0eee6" }}>
                    <ReceiptLongOutlinedIcon style={{ fontSize: 16, color: MUTED }} />
                  </span>
                  <span className="flex-1 min-w-0 text-[12px] font-medium truncate" style={{ ...FONT, color: INK }}>{refundProof.proofFile}</span>
                  <span className="text-[12px] font-medium shrink-0" style={{ ...FONT, color: "#0f9d58" }}>View ›</span>
                </button>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Status-driven dock (DES-763):
          Open → Apply to invoice + Edit · Partially Applied → Send + Edit · Fully Applied → Send only ·
          list-Open → Preview as PDF + Send · Cancelled → Preview only · refund → Send/Resend. */}
      {canApply ? (
        <ButtonDock
          type="double"
          sticky
          primaryLabel="Apply to invoice"
          secondaryLabel="Edit"
          onPrimary={() => onApply?.()}
          onSecondary={() => onEdit?.()}
          homeIndicator
        />
      ) : isOpen && onEdit ? (
        // Draft missing required fields (no Apply) — lead with Edit to finish it.
        <ButtonDock type="single" sticky primaryLabel="Edit" onPrimary={() => onEdit?.()} homeIndicator />
      ) : isApplied ? (
        isPartiallyApplied && onEdit ? (
          <ButtonDock
            type="double"
            sticky
            primaryLabel={sentLocal ? "Resend Credit Note" : "Send Credit Note"}
            secondaryLabel="Edit"
            onPrimary={openSend}
            onSecondary={() => onEdit?.()}
            homeIndicator
          />
        ) : (
          // Applied (fully) — a single "Send Credit Note" CTA (kept as "Send" even after sending).
          <ButtonDock
            type="single"
            sticky
            primaryLabel="Send Credit Note"
            onPrimary={openSend}
            homeIndicator
          />
        )
      ) : isCancelled ? (
        // Cancelled record → no dock; Preview as PDF lives in the ⋯ menu instead.
        null
      ) : isCancellation ? (
        // An Open cancellation note where Apply isn't wired → Preview only.
        <ButtonDock type="single" sticky primaryLabel="Preview as PDF" onPrimary={openPdfPreview} homeIndicator />
      ) : (
        // Refund CN (Pending Refund or settled) → Send/Resend the credit note. Not editable (AC2).
        <ButtonDock
          type="single"
          sticky
          primaryLabel={sentLocal ? "Resend Credit Note" : "Send Credit Note"}
          onPrimary={openSend}
          homeIndicator
        />
      )}

      {/* ⋯ actions — Open: Cancel + Preview · Applied: Edit · refund: Preview. DS header, titleless
          (grabber + actions), matching the invoice-detail ⋯ menu. */}
      <BottomSheet open={actionsOpen} title="" onClose={() => setActionsOpen(false)} dsHeader>
        <div className="flex flex-col">
          {/* Draft → only Delete Credit Note (confirmed via a prompt). */}
          {isOpen && onCancel && (
            <button onClick={() => { setActionsOpen(false); setConfirmDelete(true); }} className="w-full flex items-center gap-3 py-3.5 text-left">
              <DeleteOutlineIcon style={{ fontSize: 20, color: "#b42318" }} />
              <span className="text-[15px]" style={{ ...FONT, color: "#b42318" }}>Delete Credit Note</span>
            </button>
          )}
          {/* Applied → Cancel credit note (full reversal) + Preview as PDF. */}
          {isApplied && (
            <>
              {onCancel && (
                <button onClick={() => { setActionsOpen(false); onCancel(); }} className="w-full flex items-center gap-3 py-3.5 text-left border-b border-[#f1f1f1]">
                  <DeleteOutlineIcon style={{ fontSize: 20, color: "#b42318" }} />
                  <span className="text-[15px]" style={{ ...FONT, color: "#b42318" }}>Cancel credit note</span>
                </button>
              )}
              <button onClick={openPdfPreview} className="w-full flex items-center gap-3 py-3.5 text-left">
                <PictureAsPdfOutlinedIcon style={{ fontSize: 20, color: INK }} />
                <span className="text-[15px]" style={{ ...FONT, color: INK }}>Preview as PDF</span>
              </button>
            </>
          )}
          {/* Cancelled record → Preview as PDF only (moved here from the dock). */}
          {isCancelled && (
            <button onClick={openPdfPreview} className="w-full flex items-center gap-3 py-3.5 text-left">
              <PictureAsPdfOutlinedIcon style={{ fontSize: 20, color: INK }} />
              <span className="text-[15px]" style={{ ...FONT, color: INK }}>Preview as PDF</span>
            </button>
          )}
          {isRefund && (
            // Pending refund → Cancel refund (reverse it) + Preview. Settled/locked → Preview only.
            <>
              {isPendingRefund && onCancel && (
                <button onClick={() => { setActionsOpen(false); onCancel(); }} className="w-full flex items-center gap-3 py-3.5 text-left border-b border-[#f1f1f1]">
                  <DeleteOutlineIcon style={{ fontSize: 20, color: "#b42318" }} />
                  <span className="text-[15px]" style={{ ...FONT, color: "#b42318" }}>Cancel refund</span>
                </button>
              )}
              <button onClick={openPdfPreview} className="w-full flex items-center gap-3 py-3.5 text-left">
                <PictureAsPdfOutlinedIcon style={{ fontSize: 20, color: INK }} />
                <span className="text-[15px]" style={{ ...FONT, color: INK }}>Preview as PDF</span>
              </button>
            </>
          )}
        </div>
      </BottomSheet>

      {/* Delete-draft confirmation (DES-719 AC7). Dock goes in the sheet footer so it aligns flush
          like every other ButtonDock (body placement double-pads it). Safe action (Cancel) is the
          filled primary; destructive Delete is the outline secondary (see memory: confirm-dialog-pattern). */}
      <BottomSheet
        open={confirmDelete}
        title="Delete credit note?"
        onClose={() => setConfirmDelete(false)}
        dsHeader
        compact
        footer={
          <ButtonDock
            type="double"
            primaryLabel="Cancel"
            secondaryLabel="Delete Credit note"
            onPrimary={() => setConfirmDelete(false)}
            onSecondary={() => { setConfirmDelete(false); onCancel?.(); }}
            homeIndicator
          />
        }
      >
        <p className="text-[16px] leading-[1.45]" style={{ ...FONT, color: MUTED }}>
          This draft credit note will be permanently deleted. The linked invoice won't be affected.
        </p>
      </BottomSheet>

      {/* Send sub-flow */}
      <SendInvoiceSheet
        open={sendSheetOpen}
        customerName={customerName}
        customerEmail={customerEmail ?? ""}
        onClose={() => setSendSheetOpen(false)}
        onConfirm={(method) => {
          if (method === "email") setEmailReviewOpen(true);
          else if (method === "link") setShareLinkOpen(true);
          else if (method === "pdf") { setPdfFromSend(true); setPdfOpen(true); }
        }}
      />

      {emailReviewOpen && (
        <div className="absolute inset-0 z-50">
          <ReviewEmail
            customerName={customerName}
            customerEmail={customerEmail ?? ""}
            companyEmail={companyEmail}
            invoiceNo={creditNoteNo}
            amountLabel={amountLabel}
            dueDateLabel={issueDateLabel}
            onBack={() => setEmailReviewOpen(false)}
            onSend={completeSend}
          />
        </div>
      )}

      <ShareLinkSheet
        open={shareLinkOpen}
        link={`https://pay.statrys.com/cn/${creditNoteNo.toLowerCase()}`}
        onSent={completeSend}
        onDismiss={() => setShareLinkOpen(false)}
      />

      {pdfOpen && (
        <div className="absolute inset-0 z-50">
          <CreditNotePreviewPage
            creditNoteNo={creditNoteNo}
            invoiceNo={invoiceNo}
            customerName={customerName}
            customerEmail={customerEmail ?? ""}
            issueDateLabel={issueDateLabel}
            currency={currency}
            lines={lines && lines.length > 0 ? lines : [{ name: "Credit note total", amount: total }]}
            total={total}
            reason={reason}
            reasonNote={reasonNote}
            onBack={() => setPdfOpen(false)}
            onDownloaded={() => (pdfFromSend ? completeSend() : setPdfOpen(false))}
          />
        </div>
      )}

      <FilePreviewOverlay open={proofPreview !== null} file={proofPreview} onClose={() => setProofPreview(null)} />

      <SendSuccessToast open={toastOpen} message="Credit note sent" onDone={() => setToastOpen(false)} />
    </div>
  );
}

export default CreditNoteDetailPage;
