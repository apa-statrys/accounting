import { useState } from "react";
import { FileText, MoreHorizontal, Receipt, Trash2 } from "lucide-react";
import { PageAppHeader } from "../../components/PageAppHeader";
import { PageHeader } from "../../ui/PageHeader";
import { ButtonDock } from "../../components/ButtonDock";
import { BottomSheet } from "../../components/BottomSheet";
import { SendInvoiceSheet } from "../../components/SendInvoiceSheet";
import { LockedPeriodDialog } from "../locked-period/LockedPeriodDialog";
import { LockedPeriodBanner } from "../locked-period/LockedPeriodBanner";
import { Toast } from "../../components/Toast";
import { CreditNotePreviewPage, CreditNoteDocumentPreview } from "./CreditNotePreviewPage";
import { FilePreviewOverlay, type UploadedFileInfo } from "../../components/UploadedFile";
import { CountryFlag } from "../../components/CountryFlag";
import { CURRENCY_COUNTRY } from "../../components/CurrencySheet";
import { money, fmtDate } from "../../lib/format";
import { ListRow } from "../../ui/ListRow";
import { ListCard } from "../../ui/ListCard";
import { Tile } from "../../ui/Tile";
import { CREDIT_NOTE_STATUS_META } from "../../lib/status";

import { FONT, INK, MUTED, initials } from "../../lib/theme";

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
  receivingAccount?: { name: string; number: string; primary: boolean; country?: string };
  /** Locked-period demo (DES-751): "Cancel refund" opens a locked-period dialog (the note is dated in
   *  a closed accounting period) instead of the cancel-confirm flow. */
  lockedPeriod?: boolean;
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
    onBack, onViewInvoice, onSent, onApply, onEdit, onCancel, receivingAccount, lockedPeriod = false,
  } = props;

  const [actionsOpen, setActionsOpen] = useState(false);
  // Draft delete confirmation (DES-719 AC7).
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  // Locked-period demo: "Cancel refund" opens this dialog instead of the cancel-confirm flow.
  const [lockedCancelOpen, setLockedCancelOpen] = useState(false);
  const [sentLocal, setSentLocal] = useState(!!sent);
  // Send sub-flow (reused from the invoice send flow).
  const [sendSheetOpen, setSendSheetOpen] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);
  // Whether the PDF preview was opened from the send flow's own Download row (hides its redundant
  // Download PDF button — that download already "happened" there) or the plain ⋯ preview.
  const [pdfFromSend, setPdfFromSend] = useState(false);
  const [proofPreview, setProofPreview] = useState<UploadedFileInfo | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  // Status chip: application lifecycle (DES-763) for cancellation, money lifecycle for refund.
  const displayStatus = status ?? (kind === "refund" ? "Pending Refund" : "Open");
  const chip = CREDIT_NOTE_STATUS_META[displayStatus] ?? CREDIT_NOTE_STATUS_META["Open"];
  const reasonText = reason || null;
  const amountLabel = `${currency} ${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  // Shared by the full PDF preview and the Send sheet's own compact PDF-segment preview.
  const previewLines = lines && lines.length > 0 ? lines : [{ name: "Credit note total", amount: total }];
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
  // cancellable (⋯) while still pending; `onCancel` is wired by the invoice-detail entry. In this build
  // an applied-but-not-yet-paid-out refund CN carries the status "Applied" (see the invoice-detail
  // cnStatus derivation), so treat both labels as the same cancellable pre-payout state.
  const isPendingRefund = isRefund && displayStatus === "Pending Refund";
  // A refund CN that's created but not yet paid out (Pending Refund / Applied) can be cancelled → the
  // invoice reverts to Paid (DES-720). Once the payout is submitted ("Awaiting refund") or settled
  // (Partially Refunded / Refunded) it can no longer be cancelled.
  const isRefundCancellable = isRefund && (displayStatus === "Pending Refund" || displayStatus === "Applied");
  // A refund CN saved before it's created (backed out of the refund form) is still a DRAFT — an
  // unfinished document. Like any draft (DES-719) it's resumable (Edit) and deletable (⋯ Delete), NOT
  // sendable. `isOpen` is cancellation-only, so this is tracked separately to reach the draft dock/menu.
  const isRefundDraft = isRefund && displayStatus === "Draft";
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
  // A complete Draft — cancellation OR refund — leads with "Apply to invoice"; an incomplete one falls
  // back to Edit only (see the dock below). Applying a refund draft commits it and moves the invoice to
  // Pending Refund (the payout step stays separate).
  const canApply = (isOpen || isRefundDraft) && !!onApply && draftComplete;
  // ⋯ exists for a Draft (Delete only — cancellation OR refund), an Applied note (Cancel + Preview),
  // a cancellable refund (Cancel refund + Preview), or a Cancelled note (Preview as PDF — no dock).
  const hasMenu = (isOpen && !!onCancel) || (isRefundDraft && !!onCancel) || (isApplied && !!onCancel) || (isRefundCancellable && !!onCancel) || isCancelled;
  const openSend = () => setSendSheetOpen(true);

  const closeSend = () => { setSendSheetOpen(false); setPdfOpen(false); };
  const completeSend = () => { closeSend(); setSentLocal(true); setToastMessage("Credit note sent"); onSent?.(); };
  const openPdfPreview = () => { setActionsOpen(false); setPdfFromSend(false); setPdfOpen(true); };

  // Mirrors the status-driven dock ternary below (Toast needs its type before that JSX renders) —
  // keep in sync: "double" clears with bottomOffset 150, "single" with the Toast default (96), no
  // dock at all (Cancelled) with 16, matching this app's Toast convention.
  const stickyDockKind: "single" | "double" | "none" = canApply
    ? "double"
    : (isOpen || isRefundDraft) && onEdit
      ? "single"
      : isApplied
        ? (isPartiallyApplied && onEdit ? "double" : "single")
        : isCancelled
          ? "none"
          : "single";
  const toastBottomOffset = stickyDockKind === "double" ? 150 : stickyDockKind === "none" ? 16 : undefined;

  return (
    <div className="absolute inset-0 z-40 rounded-[48px] overflow-hidden flex flex-col" style={{ width: 375, height: 812, background: "var(--bg-beige-primary)" }}>
      {/* No background here (was bg-white) — PageAppHeader is transparent at rest, so it needs the
          beige of the OUTER frame to show through behind it, blending into the hero gradient below
          it instead of a hard white→beige seam. The white "body" further down comes from its own
          wrapper below instead — same fix as the invoice detail's own hero (CLAUDE.md gradient
          exception). */}
      {/* Scenario annotation — shown in the white space to the right of the phone frame, only on a
          cancelled credit note, explaining how it reversed the void back to the original invoice. */}
      {isCancelled && (
        <div
          className="hidden lg:block fixed top-1/2 -translate-y-1/2 left-[calc(50%+230px)] w-[320px]"
          style={FONT}
        >
          <div className="rounded-2xl bg-white shadow-[0_8px_30px_rgba(16,24,40,0.10)] border border-black/5 p-6">
            <p className="text-[12px] font-bold uppercase tracking-wide text-[var(--text-placeholder)] mb-4">Scenario</p>
            <p className="text-[15px] leading-[1.55] text-[var(--text-primary)] mb-4">
              A customer cancels a project, so the user creates a full credit note.
            </p>
            <p className="text-[15px] leading-[1.55] text-[var(--text-primary)] mb-4">
              Before the customer pays, they change their mind and want to continue with the project.
            </p>
            <p className="text-[15px] leading-[1.55] text-[var(--text-primary)]">
              The user cancels the credit note, so the invoice returns to its original amount.
            </p>
          </div>
        </div>
      )}

      <div
        className="flex-1 overflow-y-auto thin-scrollbar"
        onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
      >
      <PageAppHeader scrolled={scrolled}>
      <PageHeader
        type="center"
        // Drafts carry no CN number yet (decided 2026-07-15) — a generic title until the note is applied.
        title={status === "Draft" ? (kind === "refund" ? "Refund Credit Note" : "Credit Note") : creditNoteNo}
        onBack={onBack}
        showSearch={hasMenu}
        rightIcon={<MoreHorizontal size={20} strokeWidth={1} />}
        rightLabel="More actions"
        onRightClick={() => setActionsOpen(true)}
      />
      </PageAppHeader>

      {/* Status + amount — full-bleed beige→white gradient hero, a direct sibling of the header
          (not nested inside the padded content below) so it bleeds edge-to-edge flush against the
          header with no white seam — same structure as the invoice detail's own status+amount hero
          (Figma "Invoice Detail", node 1423:63521): plain colored status text (no pill), currency
          code + big black amount, muted subline below. */}
      <div
        className="p-4 flex flex-col gap-2"
        style={{ backgroundImage: "linear-gradient(180deg, var(--bg-beige-primary) 1%, var(--bg-neutral-primary) 99%)" }}
      >
        <span className="caption-medium" style={{ ...FONT, color: chip.text }}>{displayStatus}</span>
        <p className="leading-none" style={{ ...FONT, color: "var(--text-error-primary)" }}>
          <span className="text-[18px] font-bold tracking-[-0.9px]">−{currency}</span>
          <span className="text-[18px]"> </span>
          <span className="text-[40px] leading-[0.9] tracking-[-2px]" style={{ fontWeight: "var(--fw-black)" }}>
            {total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </p>
        {/* Every status keeps a date subline, same "badge · date" convention as the invoice detail's
            own hero — Awaiting refund used to show nothing at all here even though the submitted
            date is already known (refundProof.date is set once the payout is submitted, and shown
            further down in the Refund Method card regardless of `awaiting`). */}
        <p className="body-sm" style={{ ...FONT, color: MUTED }}>
          {displayStatus === "Awaiting refund"
            ? `Submitted ${refundProof ? fmtDate(refundProof.date) : (updatedDateLabel ?? issueDateLabel)}`
            : isCancelled
            ? `Cancelled ${updatedDateLabel ?? issueDateLabel}`
            : isRefund
            ? (refundSettled
                ? `Refunded ${refundProof ? fmtDate(refundProof.date) : issueDateLabel}`
                // An applied (pre-payout) refund CN reads "Applied …", matching the cancellation
                // Applied detail; a not-yet-applied refund (Pending Refund) shows "Created …".
                : displayStatus === "Applied"
                ? `Applied ${updatedDateLabel ?? issueDateLabel}`
                : `Created ${issueDateLabel}`)
            : isApplied
              ? `Applied ${updatedDateLabel ?? issueDateLabel}`
              : `${updatedDateLabel ? "Updated" : "Created"} ${updatedDateLabel ?? issueDateLabel}`}
        </p>
      </div>

      <div className="px-4 pt-2 pb-44 flex flex-col gap-4 bg-white">
        {/* Locked-period notice (DES-751) — amber, non-blocking; explains why edit/cancel are unavailable. */}
        {lockedPeriod && (
          <LockedPeriodBanner
            showContact={false}
            title="Accounting period closed"
            body={
              isOpen || isPartiallyApplied || isRefundDraft
                ? "You can’t edit or cancel this credit note because its date falls within a locked accounting period."
                : "You can’t cancel this credit note because its date falls within a locked accounting period."
            }
          />
        )}

        {/* Credit Details — Credit Issue Date / Due Date / Currency + reason (+ description) + the
            related invoice, DS ListCard/ListRow (Figma), same shape as the invoice detail's own
            Details card. The reason row is hidden until the client fills it in. */}
        <div className="flex flex-col gap-2">
          <p className="body-sm-medium" style={{ ...FONT, color: INK }}>Credit Details</p>
          <ListCard>
            <ListRow label="Credit Issue Date" value={issueDateLabel} />
            <ListRow label="Due Date" value={dueDateLabel ?? "—"} />
            <ListRow label="Currency" value={currency} valueFlag={<CountryFlag name={CURRENCY_COUNTRY[currency]} size={16} />} />
            {reasonText && <ListRow label="Reason" value={reasonText} valueDescription={reasonNote} />}
            {onViewInvoice ? (
              <ListRow label="Related Invoice" value={invoiceNo} trailing="chevron" onClick={onViewInvoice} last />
            ) : (
              <ListRow label="Related Invoice" value={invoiceNo} last />
            )}
          </ListCard>
        </div>

        {/* Credit to / Refund to — DS Tile, matching every other "Bill To"-style display in the app. */}
        <div className="flex flex-col gap-2">
          <p className="body-sm-medium" style={{ ...FONT, color: INK }}>{isRefund ? (refundSettled ? "Refunded to" : "Refund to") : "Credit to"}</p>
          <Tile avatar={initials(customerName)} title={customerName || "—"} text={customerEmail} />
        </div>

        {/* Credited / refunded items — DS ListCard/ListRow, same shape as the invoice detail's Items
            card (label + description sub-line + value). */}
        {lines && lines.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="body-sm-medium" style={{ ...FONT, color: INK }}>{isRefund ? `${refundSettled ? "Refunded" : "Refund"} items (${lines.length})` : `Credited items (${lines.length})`}</p>
            <ListCard>
              {lines.map((l, i) => {
                // Adaptive sub-line: a clean quantity credit shows "qty × unit price"; a value reduction
                // shows "Price adjustment" (cancellation only — refund items show no sub-line).
                const sub = l.qty != null && l.unitPrice != null
                  ? `${l.qty} × ${money(l.unitPrice, currency)}`
                  : (!isRefund ? "Price adjustment" : undefined);
                return (
                  <ListRow
                    key={i}
                    label={l.name}
                    description={sub}
                    value={money(l.amount, currency)}
                    last={i === lines.length - 1}
                  />
                );
              })}
            </ListCard>
          </div>
        )}

        {/* The account this note is set against (Figma 1209) — DS Tile with the account's own country
            flag, same pattern as every other receiving-account display in the app. Wording follows the
            money: a credit note settles INTO the "Receiving Account"; a refund pays OUT of the
            "Payment Account". Hidden on a refund that already has proof — the account is then on the
            "Refund Method" card below, and showing both would state it twice. */}
        {receivingAccount && !(isRefund && refundProof) && (
          <div className="flex flex-col gap-2">
            <p className="body-sm-medium" style={{ ...FONT, color: INK }}>{isRefund ? "Payment Account" : "Receiving Account"}</p>
            <Tile
              flag={receivingAccount.country ? <CountryFlag name={receivingAccount.country} size={30} /> : undefined}
              title={receivingAccount.name}
              text={receivingAccount.number}
              badgeLabel={receivingAccount.primary ? "Primary" : undefined}
            />
          </div>
        )}

        {/* Summary — hidden until there's a credit amount (nothing to total on an empty draft). Card
            surface matches the invoice detail's own Summary card (bg-neutral-secondary, 16px radius). */}
        {total > 0.001 && (
        <div className="flex flex-col gap-2">
          <p className="body-sm-medium" style={{ ...FONT, color: INK }}>Summary</p>
          <div className="rounded-2xl border px-4 py-1" style={{ background: "var(--bg-neutral-secondary)", borderColor: "rgba(208,208,208,0.4)" }}>
            {(isOpen || isCancelled) && invoiceTotal !== undefined ? (
              // Not applied yet (Open) or cancelled — the credit hasn't reduced the invoice, so
              // Credit Amount reads "(Not Applied Yet)" and Amount Due = the FULL invoice total.
              <>
                <div className="flex items-center justify-between py-2.5 border-b" style={{ borderColor: "rgba(208,208,208,0.4)" }}>
                  <span className="body-sm" style={{ ...FONT, color: MUTED }}>Invoice Total</span>
                  <span className="body-sm" style={{ ...FONT, color: INK }}>{money(invoiceTotal, currency)}</span>
                </div>
                <div className="flex items-start justify-between gap-3 py-2.5 border-b" style={{ borderColor: "rgba(208,208,208,0.4)" }}>
                  <span className="body-sm" style={{ ...FONT, color: MUTED }}>Credit Amount</span>
                  <span className="text-right">
                    <span className="block body-sm font-medium" style={{ ...FONT, color: "var(--text-error-primary)" }}>−{money(total, currency)}</span>
                    <span className="block text-[11px] mt-0.5" style={{ ...FONT, color: MUTED }}>(Not Applied Yet)</span>
                  </span>
                </div>
                {/* Amount due once this credit is applied (Figma 1209 shows the projected balance). */}
                <div className="flex items-center justify-between gap-3 py-3 mt-1 -mx-4 px-4 rounded-b-[15px]" style={{ background: "var(--bg-beige-secondary)" }}>
                  <span className="body-sm-bold" style={{ ...FONT, color: INK }}>Amount Due</span>
                  <span className="body-sm-bold shrink-0" style={{ ...FONT, color: INK }}>{money(Math.max(0, invoiceTotal - total), currency)}</span>
                </div>
              </>
            ) : isRefund && invoiceTotal !== undefined ? (
              // Refund summary (DES-720): Invoice Total + the Refund Amount (the amount refunded).
              <>
                <div className="flex items-center justify-between py-2.5 border-b" style={{ borderColor: "rgba(208,208,208,0.4)" }}>
                  <span className="body-sm" style={{ ...FONT, color: MUTED }}>Invoice Total</span>
                  <span className="body-sm" style={{ ...FONT, color: INK }}>{money(invoiceTotal, currency)}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="body-sm-bold" style={{ ...FONT, color: INK }}>Refund Amount</span>
                  <span className="body-sm-bold shrink-0" style={{ ...FONT, color: "var(--text-error-primary)" }}>−{money(total, currency)}</span>
                </div>
              </>
            ) : isCancellation && invoiceTotal !== undefined ? (
              <>
                <div className="flex items-center justify-between py-2.5 border-b" style={{ borderColor: "rgba(208,208,208,0.4)" }}>
                  <span className="body-sm" style={{ ...FONT, color: MUTED }}>Invoice Total</span>
                  <span className="body-sm" style={{ ...FONT, color: INK }}>{money(invoiceTotal, currency)}</span>
                </div>
                <div className="flex items-center justify-between py-2.5 border-b" style={{ borderColor: "rgba(208,208,208,0.4)" }}>
                  <span className="body-sm" style={{ ...FONT, color: MUTED }}>Credit Amount</span>
                  <span className="body-sm font-medium" style={{ ...FONT, color: "var(--text-error-primary)" }}>−{money(total, currency)}</span>
                </div>
                {isApplied ? (
                  // Applied (Partially/Fully) → "Amount Due" (the current balance), highlighted like the design.
                  <div className="flex items-center justify-between gap-3 py-3 mt-1 -mx-4 px-4 rounded-b-[15px]" style={{ background: "var(--bg-beige-secondary)" }}>
                    <span className="body-sm-bold" style={{ ...FONT, color: INK }}>Amount Due</span>
                    <span className="body-sm-bold shrink-0" style={{ ...FONT, color: INK }}>{money(Math.max(0, invoiceTotal - total), currency)}</span>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3 py-3">
                    <span className="min-w-0">
                      <span className="block body-sm-bold" style={{ ...FONT, color: INK }}>Remaining Balance</span>
                      <span className="block text-[11px] leading-[1.3] mt-0.5" style={{ ...FONT, color: MUTED }}>(after applying)</span>
                    </span>
                    <span className="body-sm-bold shrink-0" style={{ ...FONT, color: INK }}>{money(Math.max(0, invoiceTotal - total), currency)}</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center justify-between py-2.5 border-b" style={{ borderColor: "rgba(208,208,208,0.4)" }}>
                  <span className="body-sm" style={{ ...FONT, color: MUTED }}>Subtotal credited</span>
                  <span className="body-sm" style={{ ...FONT, color: INK }}>−{money(total, currency)}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="body-sm-bold" style={{ ...FONT, color: INK }}>Total credited</span>
                  <span className="body-sm-bold" style={{ ...FONT, color: "var(--text-error-primary)" }}>−{money(total, currency)}</span>
                </div>
              </>
            )}
          </div>
        </div>
        )}

        {/* Refund method (DES-720) — the bank account, date and proof, DS ListCard/ListRow (the
            awaiting/refunded status is shown on the hero, not here). */}
        {refundProof && (
          <div className="flex flex-col gap-2">
            <p className="body-sm-medium" style={{ ...FONT, color: INK }}>Refund Method</p>
            <ListCard>
              <ListRow label="Payment Account" value={refundProof.method} />
              <ListRow label="Refund date" value={fmtDate(refundProof.date)} last={!refundProof.referenceNo && !refundProof.proofFile} />
              {refundProof.referenceNo && (
                <ListRow label="Reference" value={refundProof.referenceNo} last={!refundProof.proofFile} />
              )}
              {refundProof.proofFile && (
                <div className="py-3">
                  <button
                    onClick={() => setProofPreview({ name: refundProof.proofFile!, size: 128000 })}
                    className="w-full flex items-center gap-2.5 rounded-md bg-white border border-[rgba(160,160,160,0.3)] px-2 py-1.5 text-left"
                  >
                    <span className="w-7 h-7 rounded flex items-center justify-center shrink-0" style={{ background: "#f0eee6" }}>
                      <Receipt size={16} strokeWidth={1.5} color={MUTED} />
                    </span>
                    <span className="flex-1 min-w-0 text-[12px] font-medium truncate" style={{ ...FONT, color: INK }}>{refundProof.proofFile}</span>
                    <span className="text-[12px] font-medium shrink-0" style={{ ...FONT, color: "var(--text-success-primary)" }}>View ›</span>
                  </button>
                </div>
              )}
            </ListCard>
          </div>
        )}
      </div>
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
        />
      ) : (isOpen || isRefundDraft) && onEdit ? (
        // Draft (cancellation missing fields, or a refund draft) — lead with Edit to finish it. A refund
        // draft is resumed through the refund form (its confirm step creates the refund), never "sent".
        <ButtonDock type="single" sticky primaryLabel="Edit" onPrimary={() => onEdit?.()} />
      ) : isApplied ? (
        isPartiallyApplied && onEdit ? (
          <ButtonDock
            type="double"
            sticky
            primaryLabel={sentLocal ? "Resend Credit Note" : "Send Credit Note"}
            secondaryLabel="Edit"
            onPrimary={openSend}
            onSecondary={() => onEdit?.()}
          />
        ) : (
          // Applied (fully) — a single "Send Credit Note" CTA (kept as "Send" even after sending).
          <ButtonDock
            type="single"
            sticky
            primaryLabel="Send Credit Note"
            onPrimary={openSend}
          />
        )
      ) : isCancelled ? (
        // Cancelled record → no dock; Preview as PDF lives in the ⋯ menu instead.
        null
      ) : isCancellation ? (
        // An Open cancellation note where Apply isn't wired → Preview only.
        <ButtonDock type="single" sticky primaryLabel="Preview as PDF" onPrimary={openPdfPreview} />
      ) : (
        // Refund CN (Pending Refund or settled) → Send/Resend the credit note. Not editable (AC2).
        <ButtonDock
          type="single"
          sticky
          primaryLabel={sentLocal ? "Resend Credit Note" : "Send Credit Note"}
          onPrimary={openSend}
        />
      )}

      {/* ⋯ actions — Open: Cancel + Preview · Applied: Edit · refund: Preview. DS header, titleless
          (grabber + actions), matching the invoice-detail ⋯ menu. */}
      <BottomSheet open={actionsOpen} title="" onClose={() => setActionsOpen(false)}>
        <div className="flex flex-col">
          {/* Draft (cancellation or refund) → only Delete Credit Note (confirmed via a prompt). */}
          {(isOpen || isRefundDraft) && onCancel && (
            <button onClick={() => { setActionsOpen(false); setConfirmDelete(true); }} className="w-full flex items-center gap-3 py-3.5 text-left">
              <Trash2 size={20} strokeWidth={1.5} color="var(--icon-error-primary)" />
              <span className="text-[15px]" style={{ ...FONT, color: "var(--text-error-primary)" }}>Delete Credit Note</span>
            </button>
          )}
          {/* Applied → Cancel credit note (full reversal) + Preview as PDF. */}
          {isApplied && (
            <>
              {onCancel && (
                <button onClick={() => { setActionsOpen(false); if (lockedPeriod) { setLockedCancelOpen(true); return; } setConfirmCancel(true); }} className="w-full flex items-center gap-3 py-3.5 text-left border-b border-[#f1f1f1]">
                  <Trash2 size={20} strokeWidth={1.5} color="var(--icon-error-primary)" />
                  <span className="text-[15px]" style={{ ...FONT, color: "var(--text-error-primary)" }}>Cancel credit note</span>
                </button>
              )}
              <button onClick={openPdfPreview} className="w-full flex items-center gap-3 py-3.5 text-left">
                <FileText size={20} strokeWidth={1.5} color={INK} />
                <span className="text-[15px]" style={{ ...FONT, color: INK }}>Preview as PDF</span>
              </button>
            </>
          )}
          {/* Cancelled record → Preview as PDF only (moved here from the dock). */}
          {isCancelled && (
            <button onClick={openPdfPreview} className="w-full flex items-center gap-3 py-3.5 text-left">
              <FileText size={20} strokeWidth={1.5} color={INK} />
              <span className="text-[15px]" style={{ ...FONT, color: INK }}>Preview as PDF</span>
            </button>
          )}
          {isRefund && !isRefundDraft && (
            // Cancellable refund (Pending Refund / Applied, pre-payout) → Cancel refund (reverse it) +
            // Preview. Settled/awaiting → Preview only. (A refund DRAFT is handled above — Delete only.)
            <>
              {isRefundCancellable && onCancel && (
                <button onClick={() => { setActionsOpen(false); if (lockedPeriod) { setLockedCancelOpen(true); return; } setConfirmCancel(true); }} className="w-full flex items-center gap-3 py-3.5 text-left border-b border-[#f1f1f1]">
                  <Trash2 size={20} strokeWidth={1.5} color="var(--icon-error-primary)" />
                  <span className="text-[15px]" style={{ ...FONT, color: "var(--text-error-primary)" }}>Cancel refund</span>
                </button>
              )}
              <button onClick={openPdfPreview} className="w-full flex items-center gap-3 py-3.5 text-left">
                <FileText size={20} strokeWidth={1.5} color={INK} />
                <span className="text-[15px]" style={{ ...FONT, color: INK }}>Preview as PDF</span>
              </button>
            </>
          )}
        </div>
      </BottomSheet>

      {/* Delete-draft confirmation (DES-719 AC7). Dock goes in the sheet footer so it aligns flush
          like every other ButtonDock (body placement double-pads it). Both actions are
          destructive-styled (see memory: destructive-color-by-reversibility): Delete Credit note
          leads as the filled primary, in red; Cancel (dismiss this prompt) is the destructive
          secondary, which renders as a plain neutral outline (see ui/Button's `destructive` prop
          — the strong red is reserved for the primary). */}
      <BottomSheet
        open={confirmDelete}
        title="Delete credit note?"
        onClose={() => setConfirmDelete(false)}
        compact
        footer={
          <ButtonDock
            type="double"
            primaryLabel="Delete Credit note"
            primaryDestructive
            secondaryLabel="Cancel"
            secondaryDestructive
            onPrimary={() => { setConfirmDelete(false); onCancel?.(); }}
            onSecondary={() => setConfirmDelete(false)}
          />
        }
      >
        <p className="body-sm" style={{ ...FONT, color: MUTED }}>
          This draft credit note will be permanently deleted. The linked invoice won't be affected.
        </p>
      </BottomSheet>

      {/* Cancel confirmation — for an APPLIED cancellation note (full reversal) or a pre-payout REFUND
          note (reverts the invoice to Paid). Previously the cancel happened immediately; both entry
          points (invoice-detail journey + CN list) now confirm first. Safe action (Keep) is the filled
          primary; the destructive Cancel is the outline secondary (memory: confirm-dialog-pattern). */}
      <BottomSheet
        open={confirmCancel}
        title={isRefund ? "Cancel refund?" : "Cancel credit note?"}
        onClose={() => setConfirmCancel(false)}
        compact
        footer={
          <ButtonDock
            type="double"
            primaryLabel={isRefund ? "Keep Refund" : "Keep Credit Note"}
            secondaryLabel={isRefund ? "Cancel Refund" : "Cancel Credit Note"}
            onPrimary={() => setConfirmCancel(false)}
            onSecondary={() => { setConfirmCancel(false); onCancel?.(); }}
          />
        }
      >
        <p className="body-sm" style={{ ...FONT, color: MUTED }}>
          {isRefund
            ? "This refund credit note will be cancelled and the invoice will return to Paid."
            : "This credit note will be cancelled and its effect on the invoice reversed."}
        </p>
      </BottomSheet>

      {/* Locked-period demo (DES-751): cancelling a refund / credit note dated in a closed period. */}
      <LockedPeriodDialog
        open={lockedCancelOpen}
        title={isRefund ? "Refund can’t be cancelled" : "Credit note can’t be cancelled"}
        body={
          isRefund
            ? "This refund can’t be cancelled because its date (31 Dec 2026) falls in a closed accounting period. Contact your accountant for assistance."
            : "This credit note can’t be cancelled because its date (31 Dec 2026) falls in a closed accounting period. Contact your accountant for assistance."
        }
        onClose={() => setLockedCancelOpen(false)}
      />

      {/* Send sub-flow */}
      <SendInvoiceSheet
        open={sendSheetOpen}
        customerName={customerName}
        customerEmail={customerEmail ?? ""}
        companyEmail={companyEmail}
        invoiceNo={creditNoteNo}
        amountLabel={amountLabel}
        dueDateLabel={issueDateLabel}
        docType="creditNote"
        link={`https://pay.statrys.com/cn/${creditNoteNo.toLowerCase()}`}
        onClose={() => setSendSheetOpen(false)}
        onSend={completeSend}
        onSent={completeSend}
        onDownload={() => { setPdfFromSend(true); setPdfOpen(true); setToastMessage("Credit note downloaded"); }}
        onQuickDownload={() => setToastMessage("Credit note downloaded")}
        docPreview={
          <CreditNoteDocumentPreview
            creditNoteNo={creditNoteNo}
            invoiceNo={invoiceNo}
            customerName={customerName}
            customerEmail={customerEmail ?? ""}
            issueDateLabel={issueDateLabel}
            currency={currency}
            lines={previewLines}
            total={total}
            reason={reason}
            reasonNote={reasonNote}
            className="p-0"
          />
        }
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
            lines={previewLines}
            total={total}
            reason={reason}
            reasonNote={reasonNote}
            hideDownload={pdfFromSend}
            onBack={() => setPdfOpen(false)}
            onDownloaded={() => setPdfOpen(false)}
          />
        </div>
      )}

      <FilePreviewOverlay open={proofPreview !== null} file={proofPreview} onClose={() => setProofPreview(null)} />

      <Toast open={!!toastMessage} message={toastMessage ?? ""} bottomOffset={toastBottomOffset} onDone={() => setToastMessage(null)} />
    </div>
  );
}

export default CreditNoteDetailPage;
