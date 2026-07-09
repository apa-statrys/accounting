import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import StatusBar from "../StatusBar";
import { SheetHeader, HeaderIconButton } from "../SheetHeader";
import { ButtonDock } from "../ButtonDock";
import { BottomSheet } from "../BottomSheet";
import { SendInvoiceSheet } from "../SendInvoiceSheet";
import { CreditNoteForm } from "../credit-note-form/CreditNoteForm";
import { RefundCreditNoteFlow } from "../RefundCreditNoteFlow";
import { FilePreviewOverlay, type UploadedFileInfo } from "../UploadedFile";
import { CreditNotePreviewPage } from "../CreditNotePreviewPage";
import { CreditNoteDetailPage } from "../CreditNoteDetailPage";
import { ReviewEmail } from "../ReviewEmail";
import { ShareLinkSheet } from "../ShareLinkSheet";
import { InvoicePreviewPage } from "../InvoicePreviewPage";
import { SendSuccessToast } from "../SendSuccessToast";
import { getAccount, RECEIVING_ACCOUNTS } from "../../data/receivingAccounts";
import { CREDIT_NOTES } from "../../data/creditNotes";
import { money } from "../../lib/format";
import { DETAIL_STATUS_META } from "../../lib/status";
import { FONT, INK, MUTED } from "../../lib/theme";
import type { CreditNotePayload, DraftLine, DetailStatus, InvoiceEditSeed, InvoiceLine } from "../../types";
import { ITEMS, SUBTOTAL, DISCOUNT, TOTAL, PAID_PARTIAL, SENT_TODAY, REFUND_DATE_ISO, EDITED_TODAY } from "./demoInvoice";
import type { CreditNote, RefundProof } from "./creditNoteTypes";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Repeat } from "lucide-react";
import { MetaRow, InfoCard } from "./InfoBits";
import { CreditsAppliedSection } from "./CreditsAppliedSection";
import { ActionsMenu } from "./ActionsMenu";
import { RecordPaymentSheet } from "./RecordPaymentSheet";
import { ResendPromptSheet, SendPickerSheet } from "./SendCnSheets";

interface InvoiceDetailPageProps {
  initialStatus?: DetailStatus;
  /** Where a Draft came from — sets the default emphasis (DES-715 vs DES-716 AC4). */
  origin?: "created" | "uploaded";
  /** Generated from a recurring series (DES-782) — shows a tappable Recurrence card → series detail. */
  recurring?: boolean;
  recurringFrequency?: string;
  recurringNextDate?: string;
  /** Current series status (owned by App so the series-detail page stays in sync). */
  seriesStatus?: "Active" | "Paused" | "Cancelled";
  /** Open the recurring-series detail page (Edit recurring / Pause / Cancel live there). */
  onOpenSeries?: () => void;
  invoiceNo?: string;
  customerName?: string;
  customerEmail?: string;
  issueDateLabel?: string;
  dueDateLabel?: string;
  currency?: string;
  /** Seed a credit note for an invoice opened from the list. `amount` omitted = full credit (Cancelled);
   *  a smaller `amount` = partial (invoice stays Awaiting, balance reduced). `sent` → Resend. */
  initialCreditNote?: { no: string; amount?: number; sent: boolean };
  onBack?: () => void;
  /** Open the create/edit form prefilled with this invoice (Draft = full edit, issued = limited). */
  onEdit?: (seed: InvoiceEditSeed) => void;
  /** Draft issued → Awaiting Payment; parent shows the toast and returns to list. */
  onIssued?: () => void;
  /** Draft deleted (Draft-only); parent shows the toast and returns to list. */
  onDeleted?: () => void;
  /** Optional send completed (email / link / download); parent toast + list. */
  onSent?: () => void;
  /** Toast to flash once on mount (e.g. "Changes saved" after returning from an edit). */
  flashToast?: string;
  /** Derived refund indicator (DES-720/763) — a Paid invoice with a refund credit note shows a secondary
   *  "Refund pending" / "Refunded" tag beside the Paid badge; the refund lifecycle lives on the credit note. */
  refundTag?: "Refund pending" | "Refunded" | "Partially Refunded";
  /** Report a completed refund up to App so the lists stay in sync (keyed by invoice number). */
  onRefunded?: (invoiceNo: string, result: "partial" | "full") => void;
}

/** Status-aware sales-invoice detail (DES-715 / DES-716). */
export function InvoiceDetailPage({
  initialStatus = "Awaiting",
  origin = "created",
  recurring = false,
  recurringFrequency = "Monthly",
  recurringNextDate = "1 Aug 2026",
  seriesStatus = "Active",
  onOpenSeries,
  invoiceNo = "INV-2026-000042",
  customerName = "Marlow & Finch Studio",
  customerEmail = "apa@marlowfinch.co",
  issueDateLabel = "10 Jun 2026",
  dueDateLabel = "10 Jul 2026",
  currency = "USD",
  initialCreditNote,
  onBack,
  onEdit,
  onIssued,
  onDeleted,
  onSent,
  flashToast,
  refundTag,
  onRefunded,
}: InvoiceDetailPageProps) {
  const [status, setStatus] = useState<DetailStatus>(initialStatus);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [bankExpanded, setBankExpanded] = useState(false);
  // Credit notes raised against this invoice (DES-719) — cumulative, capped at the total.
  // Model lives in ./creditNoteTypes.ts (CreditNote + RefundProof).
  // A credit note opened from the list is seeded here (DES-719 AC4 demo). Corrected Invoice Model:
  // `draftLines` is the CORRECTED invoice (full items reduced to credit `amt`), so it edits cleanly;
  // `lines` is the customer-facing credit-note document (only the per-line credits that changed).
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>(() => {
    if (!initialCreditNote) return [];
    const amt = initialCreditNote.amount ?? TOTAL;
    const isFull = amt >= TOTAL - 0.001;
    // Reduce items in order until the credited amount is consumed → the corrected invoice.
    let remaining = amt;
    const draftLines: DraftLine[] = ITEMS.map((it, i) => {
      const reduce = isFull ? it.amount : Math.min(remaining, it.amount);
      remaining -= reduce;
      const correctedTotal = it.amount - reduce;
      return { id: `cn-${i}`, name: it.name, unit: it.unit, qty: it.qty, unitPrice: String(correctedTotal / it.qty), maxQty: it.qty, origAmount: it.amount };
    });
    const docLines = ITEMS
      .map((it, i) => ({ name: it.name, amount: it.amount - Number(draftLines[i].unitPrice) * draftLines[i].qty }))
      .filter((l) => l.amount > 0.001);
    return [{
      no: initialCreditNote.no,
      amount: amt,
      // A seeded credit note represents one already applied to the invoice (DES-763) — so it reduces the
      // outstanding on open. (Newly created notes start Open, applied = 0.)
      applied: amt,
      name: customerName,
      email: customerEmail,
      lines: docLines,
      date: issueDateLabel,
      reason: isFull ? "Return" : "Pricing error",
      issueDate: new Date(2026, 5, 15),
      draftLines,
      sent: !!initialCreditNote.sent,
      sentDate: initialCreditNote.sent ? "20 Jun 2026" : undefined,
    }];
  });
  const [creditFormOpen, setCreditFormOpen] = useState(false);
  // Refund-with-credit-note form open (DES-720, from a Paid invoice).
  const [refundFormOpen, setRefundFormOpen] = useState(false);
  // Refund flow page (DES-720 AC3–AC5): method → (BA) pick source account → confirm transfer.
  const [refundFlowOpen, setRefundFlowOpen] = useState(false);
  // DES-720 cumulative refunds: money ACTUALLY paid out so far (vs `credited` = total committed to refund
  // credit notes). The gap `credited − refundedOut` is a committed-but-unpaid refund still awaiting payout.
  // Seeded to the credited total when the invoice opens already-refunded (list-sync tag), so a demo
  // "Partially Refunded" invoice starts settled — a NEW refund note then re-opens a pending payout.
  const [refundedOut, setRefundedOut] = useState(() =>
    refundTag === "Refunded" || refundTag === "Partially Refunded"
      ? creditNotes.reduce((s, c) => s + c.amount, 0)
      : 0
  );
  // Which existing credit note is being edited (index into creditNotes), or null (DES-719 AC4).
  const [editingCnIndex, setEditingCnIndex] = useState<number | null>(null);
  // A locked (settled/sent) credit note opened READ-ONLY to review the document (index or null).
  const [viewingCnIndex, setViewingCnIndex] = useState<number | null>(null);
  // Refund-proof attachment open in the file preview overlay (DES-720 evidence).
  const [proofPreview, setProofPreview] = useState<UploadedFileInfo | null>(null);
  // "View all credit notes" expand — collapse to the 2 most recent when there are more.
  const [cnExpanded, setCnExpanded] = useState(false);
  // After editing a previously-sent credit note, prompt to re-send the updated version (AC4).
  const [resendPromptOpen, setResendPromptOpen] = useState(false);
  const [recordPayOpen, setRecordPayOpen] = useState(false);
  const [recordAmount, setRecordAmount] = useState("");
  // "Mark as paid" also captures which bank account received it + an optional payment date (DES-715
  // comment — indicator for reconciliation; no GL impact). Seeded to the primary receiving account.
  const [recordAccountId, setRecordAccountId] = useState("personal");
  const [recordDate, setRecordDate] = useState<Date | null>(null);
  const [paidAmount, setPaidAmount] = useState(PAID_PARTIAL);
  // Amount received beyond the total (DES-715/716 AC6 — flagged for review).
  const [overpayment, setOverpayment] = useState(0);
  const [localToast, setLocalToast] = useState<string | null>(null);

  // Flash a one-off toast on arrival (e.g. "Changes saved" after an edit).
  useEffect(() => {
    if (flashToast) setLocalToast(flashToast);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Optional-send sub-flow state (reused from the create flow).
  const [sendSheetOpen, setSendSheetOpen] = useState(false);
  const [emailReviewOpen, setEmailReviewOpen] = useState(false);
  const [shareLinkOpen, setShareLinkOpen] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  // Whether the send sub-flow is sending the invoice or the just-created credit note.
  const [sendContext, setSendContext] = useState<"invoice" | "creditNote">("invoice");
  // Which credit note the send flow targets (index into creditNotes). With several notes on one invoice
  // each is its own document, so the send flow is parameterised by index rather than always the latest.
  const [sendCnIndex, setSendCnIndex] = useState(0);
  // "Send credit note" picker sheet — shown only when there are MULTIPLE unsent notes to choose between.
  const [sendPickerOpen, setSendPickerOpen] = useState(false);

  const meta = DETAIL_STATUS_META[status];
  const issued = status !== "Draft";
  // A recurring invoice awaiting its auto-send date reads as "Scheduled" — a display label only; the real
  // status stays Draft so it still filters under Draft (DES-782). It has no number until issued.
  const scheduledRecurring = recurring && status === "Draft";
  // Page header = the document's number. A draft has no invoice number yet (assigned on issue), so it
  // carries a separate DF (draft) number; a scheduled recurring draft just reads "Invoice".
  const headerTitle = scheduledRecurring
    ? "Invoice"
    : status === "Draft" && origin === "uploaded"
    ? (invoiceNo ? invoiceNo.replace(/^INV/, "UL") : "Uploaded invoice") // uploaded draft (DES-716/817)
    : status === "Draft" && !recurring
    ? "Invoice Detail" // created manual draft (DES-817)
    : status === "Draft"
    ? (invoiceNo ? invoiceNo.replace(/^INV/, "DF") : "Draft")
    : (invoiceNo || "Invoice");
  // Uploaded drafts default to "Mark as sent" (already issued externally → Awaiting payment);
  // "Mark as paid" is the secondary path for invoices already settled. Created drafts default to sending.
  const uploaded = origin === "uploaded";
  // Created + uploaded drafts share the DES-817 detail layout: Bill To → Receiving account card →
  // Invoice details → Items → Summary. Only the header + hero line differ by source (uploaded shows
  // the UL number + "Uploaded on"; created shows "Invoice Detail" + "Created on").
  const draftDetail = status === "Draft" && !recurring;
  // The same sectioned layout also drives the issued Awaiting + Overdue detail (real INV number,
  // invoice-number row). Recurring occurrences keep their own layout.
  const sectionedLayout = (status === "Draft" || status === "Awaiting" || status === "Overdue") && !recurring;
  // The account shown on the created-draft receiving card (default = the primary Statrys account).
  const receivingAcct = RECEIVING_ACCOUNTS.find((a) => a.primary) ?? RECEIVING_ACCOUNTS[0];
  // Read-only states for content. Paid still exposes a ⋯ menu (Refund with Credit Note); Cancelled/
  // Refunded have no menu actions.
  const terminal = status === "Paid" || status === "Cancelled" || status === "Refunded";
  const showMenu = !terminal || status === "Paid";
  const sendable = status === "Awaiting" || status === "Overdue" || status === "PartiallyPaid";
  const overdueDays = 17; // demo

  // Refund context (Paid/PendingRefund/Refunded, or a derived refund tag) vs cancellation context.
  const refundCtx = status === "Paid" || status === "PendingRefund" || status === "Refunded" || !!refundTag;
  // Credit-note derived values. Refund CNs use their full amount (refund lifecycle); cancellation CNs
  // (DES-763) reduce the invoice ONLY once applied, so cancellation `credited` counts applied amounts.
  const appliedTotal = creditNotes.reduce((s, c) => s + (c.applied ?? 0), 0);
  // Cancelled notes are kept as records but reserve NO credit room (they were never applied).
  const creditNoteTotal = creditNotes.reduce((s, c) => s + (c.cancelled ? 0 : c.amount), 0);
  const credited = refundCtx ? creditNoteTotal : appliedTotal;
  const outstanding = TOTAL - credited;
  // `paidAmount` is a demo constant (PAID_PARTIAL) present on every invoice — it only means "actually paid"
  // when the status is PartiallyPaid; otherwise nothing has been paid.
  const paidSoFar = status === "PartiallyPaid" ? paidAmount : 0;
  // #3 — a cancellation credit note credits only the UNPAID remainder (TOTAL − paidSoFar), so a Partially-Paid
  // invoice can be credit-noted for what's still owed. Refunds credit the full/paid value.
  const creditBase = refundCtx ? TOTAL : TOTAL - paidSoFar;
  // #2 fix — the room to raise MORE credit is capped against COMMITTED amounts (every note's face value,
  // incl. unapplied/Open ones), not just applied — else multiple Open notes each see the full balance and
  // the total credit can exceed the invoice. Capped at creditBase. Used for the add gate AND the form cap.
  const creditRoom = Math.max(0, creditBase - creditNoteTotal);
  // What's still owed on a Partially-Paid invoice = remainder minus credit already applied.
  const remaining = Math.max(0, TOTAL - paidSoFar - appliedTotal);
  // The invoice's CURRENT corrected line items — each ITEM reduced by the credits already applied to it
  // (matched by name). A NEW credit note opens on THIS state (e.g. Brand shows 3,000 after CN-001), so the
  // client can't re-credit a line and the cumulative math stays correct (DES-719 multi-CN).
  const correctedItems: InvoiceLine[] = ITEMS.map((it) => {
    const creditedForItem = creditNotes.reduce(
      (s, cn) => s + cn.lines.filter((l) => l.name === it.name).reduce((a, l) => a + l.amount, 0),
      0
    );
    const amount = Math.max(0, it.amount - creditedForItem);
    return { name: it.name, qty: it.qty, unit: it.unit, unitPrice: amount / it.qty, amount };
  });
  const lastCreditNote = creditNotes[creditNotes.length - 1];
  // Sent-state lives per credit note. Any unsent note means there's still something to "Send" (vs
  // "Resend" only once every note has gone out). The send flow targets `sendCnIndex` (default latest).
  const unsentCnCount = creditNotes.filter((c) => !c.sent).length;
  const anyUnsent = unsentCnCount > 0;
  const selectedSendCn = creditNotes[sendCnIndex] ?? lastCreditNote;
  // CN-YYYY-NNNNNN — own sequence, independent of the invoice number. Continue PAST the shared register's
  // highest number so a live-created note never collides with a seeded one (e.g. CN-2026-000001).
  const CN_SEQ_MAX = CREDIT_NOTES.reduce((max, c) => {
    const n = parseInt(c.no.slice(-6), 10);
    return Number.isFinite(n) ? Math.max(max, n) : max;
  }, 0);
  const nextCreditNoteNo = `CN-2026-${String(CN_SEQ_MAX + creditNotes.length + 1).padStart(6, "0")}`;
  // Cancel / add more credit — allowed on any unpaid-or-partly-paid invoice (#3 adds PartiallyPaid) while
  // there's uncommitted room (COMMITTED, not just applied — a full Open note already blocks adding). #2 fix.
  const cancellable = (status === "Awaiting" || status === "Overdue" || status === "PartiallyPaid") && creditRoom > 0.001;
  // Send values switch to the SELECTED credit note while sending it.
  const sendNo = sendContext === "creditNote" && selectedSendCn ? selectedSendCn.no : invoiceNo;
  const sendTotal = sendContext === "creditNote" && selectedSendCn ? selectedSendCn.amount : TOTAL;
  const sendName = sendContext === "creditNote" && selectedSendCn ? selectedSendCn.name : customerName;
  const sendEmail = sendContext === "creditNote" && selectedSendCn ? selectedSendCn.email : customerEmail;

  // The one-line status explainer under the amount.
  const bannerText: Record<DetailStatus, string> = {
    Draft: "",
    Awaiting: credited > 0 ? `${money(credited)} credited from ${money(TOTAL)}` : "Due in 3 days",
    Overdue: credited > 0
      ? `${money(credited)} credited from ${money(TOTAL)}`
      : `Overdue by ${overdueDays} days`,
    PartiallyPaid: `${money(paidAmount)} received · ${money(remaining)} still due`,
    Paid: overpayment > 0 ? `Paid · overpaid by ${money(overpayment)}, flagged for review` : "Paid in full",
    Cancelled: "Voided with a credit note · no longer collectable",
    // DES-720: refund context leads with the amount to refund; remaining paid is the secondary line.
    PendingRefund: `${money(outstanding)} remaining paid`,
    Refunded: credited >= TOTAL - 0.001 ? "Refunded in full" : `${money(outstanding)} remaining paid`,
  };

  // Refund money model (DES-720, cumulative). `credited` = total committed to refund credit notes;
  // `refundedOut` = money actually paid out. `refundPending` is the committed-but-unpaid remainder — a
  // refund still awaiting its payout (a fresh CN, or a NEW note raised after an earlier refund settled).
  const refundPending = Math.max(0, credited - refundedOut);
  const fullyRefunded = refundedOut >= TOTAL - 0.001 && refundedOut > 0.001;

  // Refund context (DES-720): the headline leads with the refund amount, not the amount due (paid
  // invoices owe nothing). Context = status "Pending Refund"/"Refunded" or a derived refund tag.
  // The tag reflects money ACTUALLY refunded: full → Refunded, some → Partially Refunded; before any
  // payout it falls back to the list-sync tag (and the "Pending Refund" status badge shows on its own).
  const effectiveRefundTag =
    fullyRefunded ? "Refunded"
    : refundedOut > 0.001 ? "Partially Refunded"
    : refundTag;
  const isRefundContext = status === "PendingRefund" || status === "Refunded" || !!effectiveRefundTag;
  // Headline: while a payout is due, lead with the pending amount ("Amount to refund"); once settled,
  // show the cumulative amount refunded to date.
  const headlineAmount =
    !isRefundContext ? (credited > 0 ? outstanding : TOTAL)
    : refundPending > 0.001 ? refundPending
    : refundedOut;
  const headlineLabel =
    !isRefundContext ? undefined
    : refundPending > 0.001 ? "Amount to refund"
    : "Amount refunded";
  // Refund context shows just the amount to refund (no "remaining paid" line); other statuses keep their banner.
  // Paused in-session → show the pause date (today, for the demo).
  const pausedLabel = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const headlineBanner = scheduledRecurring
    ? seriesStatus === "Paused"
      ? `Paused on ${pausedLabel}`
      : `Scheduled on ${issueDateLabel}`
    : isRefundContext ? "" : bannerText[status];
  // Refund dock (DES-720): while a payout is due (refundPending > 0) the primary action is "Refund Credit
  // Note"; once everything committed has been paid out the remaining action is sending the credit-note
  // document (AC6) → "Send/Resend Credit Note". A new note raised later re-opens a pending payout.
  const refundDone = refundPending <= 0.001;

  // Entry point for "Send Credit Note" from any dock (refund + unpaid/cancellation). With MULTIPLE unsent
  // notes, open the picker (default selection = latest); otherwise go straight to the send flow — the one
  // unsent note if there is one, else the latest note (a resend).
  const openSendCreditNote = () => {
    setSendContext("creditNote");
    if (unsentCnCount >= 2) {
      setSendCnIndex(creditNotes.length - 1);
      setSendPickerOpen(true);
    } else {
      const firstUnsent = creditNotes.findIndex((c) => !c.sent);
      setSendCnIndex(firstUnsent >= 0 ? firstUnsent : creditNotes.length - 1);
      setSendSheetOpen(true);
    }
  };

  const closeSendFlows = () => {
    setSendSheetOpen(false);
    setEmailReviewOpen(false);
    setShareLinkOpen(false);
    setPdfPreviewOpen(false);
  };

  // Send completion — credit-note sends stay on the page with a toast; invoice sends bubble up.
  const completeSend = () => {
    closeSendFlows();
    if (sendContext === "creditNote") {
      setLocalToast("Credit note sent");
      setSendContext("invoice");
      // Mark the SELECTED credit note (the one the send flow targeted) as sent, stamped today.
      setCreditNotes((prev) => prev.map((c, i) => (i === sendCnIndex ? { ...c, sent: true, sentDate: SENT_TODAY } : c)));
    } else {
      onSent?.();
    }
  };

  // Build a CreditNote from the form payload (shared by create + edit). `sent` defaults to false;
  // an edit preserves the existing sent state by overriding it.
  const cnFromPayload = (no: string, p: CreditNotePayload): CreditNote => ({
    no, amount: p.amount, name: p.name, email: p.email, lines: p.lines,
    date: p.issueDateLabel, reason: p.reason, reasonNote: p.reasonNote,
    draftLines: p.draftLines, issueDate: p.issueDate, sent: false,
  });

  // Void an OPEN (never-applied) credit note (DES-763) — it never touched the invoice, so just remove it.
  const voidCreditNote = (index: number) => {
    // Keep the note as a Cancelled RECORD (don't delete). It was never applied (Open / Pending Refund), so
    // the invoice is unaffected — we stay on the CN detail, now showing the Cancelled state.
    setCreditNotes((prev) => prev.map((c, i) => (i === index ? { ...c, cancelled: true, applied: 0 } : c)));
    // Cancelling the last live pending-refund note reverts the invoice Pending Refund → Paid.
    if (isRefundContext && !creditNotes.some((c, i) => i !== index && !c.cancelled)) setStatus("Paid");
    setLocalToast(isRefundContext ? "Refund cancelled" : "Credit note cancelled");
  };

  // Create a credit note (DES-719 + DES-763): it starts **Open** (applied = 0) and does NOT change the
  // invoice yet. We land the user on the new note's detail so they can Apply / Edit / Send it.
  const applyCreditNote = (p: CreditNotePayload) => {
    const newIndex = creditNotes.length;
    setCreditNotes((prev) => [...prev, { ...cnFromPayload(nextCreditNoteNo, p), applied: 0 }]);
    setCreditFormOpen(false);
    setViewingCnIndex(newIndex);
    setLocalToast("Credit note created");
  };

  // Apply a credit note to its linked invoice (DES-763). Offsets the invoice outstanding by as much of the
  // note as it can absorb; the note becomes Fully Applied (all consumed) or Partially Applied (leftover).
  // When the applied credit fully covers the invoice, the invoice is Cancelled.
  const applyCnToInvoice = (index: number) => {
    const cn = creditNotes[index];
    const otherApplied = creditNotes.reduce((s, c, i) => s + (i === index ? 0 : (c.applied ?? 0)), 0);
    // Credit against the UNPAID remainder (creditBase = TOTAL − paidAmount), so a Partially-Paid invoice
    // can be credited for what's still owed.
    const invOutstanding = creditBase - otherApplied;
    const remainingCn = cn.amount - (cn.applied ?? 0);
    const delta = Math.min(remainingCn, invOutstanding);
    const newCnApplied = (cn.applied ?? 0) + delta;
    setCreditNotes((prev) => prev.map((c, i) => (i === index ? { ...c, applied: newCnApplied } : c)));
    // Fully credited: an unpaid invoice → Cancelled; a Partially-Paid one → Paid (paid + credited = total).
    if (otherApplied + newCnApplied >= creditBase - 0.001) setStatus(status === "PartiallyPaid" ? "Paid" : "Cancelled");
    setLocalToast("Credit note applied");
  };

  // Refund-method outcome (DES-720 AC3–AC5). Statrys BA hands off to the BA payment flow (out of scope →
  // stub: a toast; the invoice stays Pending Refund until the transfer auto-reconciles). "Mark as already
  // refunded" records it now → Refunded.
  // BA refund confirmed (DES-720 AC4/AC5) — the pre-filled outgoing draft is handed off; the BA flow owns
  // execution (out of scope → stub). On confirm we simulate reconciliation: a full refund → Refunded;
  // a partial refund stays Pending Refund (cumulative refunds reduce what's left).
  // Settle the currently-pending refund payout: refundedOut catches up to the committed `credited` total.
  // Full (cumulative refunded = invoice total) → Refunded; otherwise Partially Refunded (still settled —
  // a later note can re-open a payout). Shared by the BA and manual branches.
  const settleRefund = (toast: string, proof?: RefundProof) => {
    setRefundFlowOpen(false);
    const priorOut = refundedOut;
    const newRefundedOut = credited; // this payout clears everything committed so far
    setRefundedOut(newRefundedOut);
    // Manual "mark as already refunded" carries proof (date/method/amount + optional file) — DES-720
    // requires it as evidence. Attach it to the note(s) settled by THIS payout (cumulative position just
    // crossed the paid-out line). The BA path passes no proof (execution handled by the transfer flow).
    if (proof) {
      setCreditNotes((prev) => {
        let cum = 0;
        return prev.map((c) => {
          cum += c.amount;
          return cum > priorOut + 0.001 ? { ...c, refundProof: proof } : c;
        });
      });
    }
    const full = newRefundedOut >= TOTAL - 0.001;
    if (full && status === "PendingRefund") setStatus("Refunded");
    setLocalToast(toast);
    onRefunded?.(invoiceNo, full ? "full" : "partial");
  };

  // BA transfer confirmed (pre-filled draft handed off; execution out of scope → stub). Records the
  // transfer as refund history (the source account + date) — no uploaded file (the BA flow owns that).
  const completeBaRefund = (fromAccountId: string) => {
    const acct = getAccount(fromAccountId);
    const proof: RefundProof = {
      date: REFUND_DATE_ISO,
      method: `Statrys · ${acct?.name ?? "Business Account"}`,
      amount: refundPending,
    };
    settleRefund(credited >= TOTAL - 0.001 ? "Invoice Fully refunded" : "Invoice partially refunded", proof);
  };

  // "Mark as already refunded" (manual) — stores the captured proof on the settled note (DES-720).
  const markAlreadyRefunded = (proof: RefundProof) => settleRefund("Marked as refunded", proof);

  // Apply a newly created REFUND credit note (DES-720). Creating it always moves a Paid invoice to
  // Pending Refund; the actual money-out (and the move to Refunded) happens in the refund-method step.
  const applyRefundCreditNote = (p: CreditNotePayload) => {
    const newIndex = creditNotes.length;
    const cn = cnFromPayload(nextCreditNoteNo, p);
    setCreditNotes((prev) => [...prev, cn]);
    setRefundFormOpen(false);
    setStatus("PendingRefund");
    setViewingCnIndex(newIndex); // land on the refund CN detail (Pending Refund) — editable until transferred
    setLocalToast("Refund credit note created");
  };

  // Save edits to an existing credit note (AC4). An OPEN note stays unapplied (Apply is a separate step);
  // an already-APPLIED (Partially Applied) note RE-APPLIES the corrected amount so edit-up AND edit-down both
  // flow to the invoice balance (the edit CTA reads "Apply to Invoice"). Fully Applied notes aren't editable.
  const saveCreditNote = (index: number, p: CreditNotePayload) => {
    const existing = creditNotes[index];
    const wasApplied = (existing.applied ?? 0) > 0.001;
    const otherApplied = creditNotes.reduce((s, c, i) => s + (i === index ? 0 : (c.applied ?? 0)), 0);
    // Re-apply = the new credit, capped at the unpaid remainder it can still absorb (never exceeds it).
    const newApplied = wasApplied ? Math.min(p.amount, creditBase - otherApplied) : 0;
    const updated = creditNotes.map((c, i) => (i === index ? { ...cnFromPayload(c.no, p), sent: c.sent, sentDate: c.sentDate, applied: newApplied, updatedDate: EDITED_TODAY } : c));
    setCreditNotes(updated);
    // Re-applying an applied note can now fully cover the remainder → Cancelled (unpaid) / Paid (partly paid).
    if (wasApplied && otherApplied + newApplied >= creditBase - 0.001) setStatus(status === "PartiallyPaid" ? "Paid" : "Cancelled");
    setEditingCnIndex(null);
    // AC4: if this note was already sent, prompt to re-send the updated version; else return to the
    // credit-note detail page (the note was opened for edit from there) and confirm.
    if (existing.sent) {
      setSendCnIndex(index); // the re-send targets THIS edited note, not necessarily the latest
      setResendPromptOpen(true);
    } else {
      setViewingCnIndex(index);
      setLocalToast(wasApplied ? "Credit note applied" : "Credit note updated");
    }
  };

  const bank = {
    holder: "Your Company Ltd",
    bankName: "Statrys",
    // Statrys account number — prefixed with the account's country (HK / SG).
    number: "HK883-168888-168",
    swift: "STYSHKHH",
    currency,
  };

  // Prefill payload for the edit form — this invoice's customer, number, items.
  const editSeed: InvoiceEditSeed = {
    customer: { id: "edit", name: customerName, email: customerEmail },
    invoiceNo,
    currency,
    services: ITEMS.map((it, i) => ({
      id: `edit-${i}`,
      name: it.name,
      currency,
      unit: it.unit,
      quantity: it.qty,
      unitPrice: it.unitPrice,
    })),
    limited: issued,
  };
  const openEdit = () => { setActionsOpen(false); onEdit?.(editSeed); };

  // Required-field gate for issuing/sending a draft (DES-715 AC2 / DES-716 AC3).
  const requiredComplete = !!customerName && ITEMS.length > 0 && !!dueDateLabel;
  const duplicate = () => { setActionsOpen(false); setLocalToast("Invoice duplicated"); };

  return (
    <div className="relative bg-white rounded-[48px] overflow-hidden shadow-2xl flex flex-col" style={{ width: 375, height: 812 }}>
      <StatusBar />

      <SheetHeader
        title={headerTitle}
        type="inside-page"
        state="fixed"
        leading={
          <HeaderIconButton aria-label="Back" onClick={onBack}>
            <ChevronLeftIcon />
          </HeaderIconButton>
        }
        trailing={
          showMenu ? (
            <HeaderIconButton aria-label="More actions" onClick={() => setActionsOpen(true)}>
              <MoreHorizIcon />
            </HeaderIconButton>
          ) : (
            <span className="w-[30px] h-[30px] block" aria-hidden />
          )
        }
      />

      <div className="flex-1 overflow-y-auto thin-scrollbar bg-white px-4 pt-5 pb-28 flex flex-col gap-6">
        {/* Status + amount */}
        <InfoCard>
          <div className="py-3 flex flex-col gap-1.5">
            <span className="self-start flex items-center gap-1.5">
              {/* The "Paid" status badge is suppressed in refund context — the refund tag below is the
                  primary badge, and the green "Paid on …" line carries the paid state. */}
              {!effectiveRefundTag && (
                <span
                  className="px-2.5 py-0.5 rounded-full border text-[11px] font-bold leading-[16px]"
                  style={{ ...FONT, background: meta.bg, borderColor: meta.border, color: meta.text }}
                >
                  {meta.label}
                </span>
              )}
              {/* Derived refund tag — invoice stays Paid; the refund lives on the credit note (763 model). */}
              {effectiveRefundTag && (
                <span
                  className="px-2.5 py-0.5 rounded-full border text-[11px] font-bold leading-[16px]"
                  style={
                    effectiveRefundTag === "Refunded"
                      ? { ...FONT, background: "#eef2ff", borderColor: "#c7d2fe", color: "#4338ca" }
                      : { ...FONT, background: "#fff7e6", borderColor: "#fde68a", color: "#b45309" }
                  }
                >
                  {effectiveRefundTag === "Refund pending" ? "Refund Pending" : effectiveRefundTag}
                </span>
              )}
            </span>
            {/* Headline: refund context → amount to refund (with a small label); otherwise amount due / total. */}
            <div className="flex items-baseline gap-2 flex-wrap">
              <p className="text-[20px] font-black leading-none tracking-[-0.8px]" style={{ ...FONT, color: INK }}>
                {money(headlineAmount)}
              </p>
              {headlineLabel && (
                <span className="text-[12px] leading-none" style={{ ...FONT, color: MUTED }}>{headlineLabel}</span>
              )}
            </div>
            {headlineBanner && (
              <p className="text-[13px] leading-[1.3]" style={{ ...FONT, color: status === "Overdue" ? "#b42318" : MUTED }}>
                {headlineBanner}
              </p>
            )}
            {/* Draft hero carries a source line under the amount (DES-817 UI): created drafts show
                "Created on", uploaded drafts show "Uploaded on". */}
            {draftDetail && (
              <p className="text-[13px] leading-[1.3]" style={{ ...FONT, color: MUTED }}>
                {uploaded ? "Uploaded on" : "Created on"} {issueDateLabel}
              </p>
            )}
            {/* Refund context: the refund amount is primary above, so the paid amount drops to a secondary
                line with a green "Paid on <date>" note beside it. */}
            {isRefundContext && (
              <p className="text-[11px] leading-[1.3]" style={FONT}>
                <span style={{ color: INK, fontWeight: 500 }}>{money(TOTAL)}</span>
                <span style={{ color: MUTED }}> · </span>
                <span style={{ color: "#0f9d58", fontWeight: 500 }}>Paid full on 28 Jun 2026</span>
              </p>
            )}
            {status === "PartiallyPaid" && (
              <div className="w-full mt-1 h-2 rounded-full bg-[#f0eee6] overflow-hidden">
                <div className="h-full rounded-full bg-[#b45309]" style={{ width: `${(paidAmount / TOTAL) * 100}%` }} />
              </div>
            )}
          </div>
        </InfoCard>

        {/* Credits Applied — sits above the customer/details for any invoice with a credit note (DES-763). */}
        {creditNotes.length > 0 && (
          <CreditsAppliedSection
            creditNotes={creditNotes}
            isRefundContext={isRefundContext}
            credited={credited}
            cancellable={cancellable}
            fullyRefunded={fullyRefunded}
            outstanding={outstanding}
            expanded={cnExpanded}
            onExpand={() => setCnExpanded(true)}
            onViewCn={setViewingCnIndex}
            onAddCredit={() => setCreditFormOpen(true)}
            onAddRefund={() => setRefundFormOpen(true)}
            onPreviewProof={setProofPreview}
          />
        )}

        {/* Recurring series (DES-782) — tap to open the series detail (Pause / Resume / Cancel live there). */}
        {recurring && (
          <button
            type="button"
            onClick={onOpenSeries}
            className="group w-full bg-white border border-dashed border-[rgba(160,160,160,0.2)] rounded-xl px-4 text-left"
            style={{ boxShadow: "var(--shadow-card-soft)" }}
          >
            <div className="py-3 flex items-center justify-between gap-2 border-b border-[rgba(160,160,160,0.18)]">
              <span className="flex items-center gap-2 min-w-0">
                <Repeat size={16} strokeWidth={2.25} style={{ color: "#ff4a15" }} />
                <span className="text-[15px] font-medium truncate" style={{ ...FONT, color: INK }}>Recurring series</span>
              </span>
              <span className="shrink-0 flex items-center gap-1.5">
                <span
                  className="inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-bold leading-[15px]"
                  style={{
                    ...FONT,
                    ...(seriesStatus === "Active"
                      ? { background: "#ebfcef", borderColor: "#a3e9b6", color: "#006a1d" }
                      : seriesStatus === "Paused"
                      ? { background: "#fff7e6", borderColor: "#fde68a", color: "#b45309" }
                      : { background: "#f4f4f4", borderColor: "#e0e0e0", color: "#808080" }),
                  }}
                >
                  {seriesStatus}
                </span>
                <ChevronRightIcon className="transition-transform group-hover:translate-x-0.5" style={{ fontSize: 18, color: "#808080" }} />
              </span>
            </div>
            <MetaRow label="Frequency" value={recurringFrequency} />
            <MetaRow
              label="Next invoice"
              value={seriesStatus === "Active" ? recurringNextDate : seriesStatus === "Paused" ? "Paused" : "Series cancelled"}
              last
            />
          </button>
        )}

        {/* Customer — avatar removed for now (pending invoice-number confirmation).
            Sectioned layout (DES-817 draft + Awaiting) labels it "Bill To". */}
        <InfoCard title={sectionedLayout ? "Bill To" : undefined}>
          <div className="py-3 flex items-center gap-3">
            <div className="min-w-0">
              <p className="text-[15px] font-medium leading-tight truncate" style={{ ...FONT, color: INK }}>{customerName}</p>
              <p className="text-[13px] leading-[1.4] mt-0.5 truncate" style={{ ...FONT, color: MUTED }}>{customerEmail}</p>
            </div>
          </div>
        </InfoCard>

        {/* Receiving account (DES-817) — display-only card styled like the recurring series card
            (no icon, no chevron: there's no separate account detail screen to open). */}
        {sectionedLayout && (
          <div className="flex flex-col gap-1.5">
            <p className="px-1 text-[12px] font-bold uppercase tracking-wide" style={{ ...FONT, color: "#a0a0a0" }}>Receiving Account</p>
            <div className="w-full bg-[#faf9f4] border border-dashed border-[rgba(160,160,160,0.3)] rounded-xl px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[15px] font-medium truncate" style={{ ...FONT, color: INK }}>{receivingAcct.name}</span>
                {receivingAcct.primary && (
                  <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold leading-[14px]" style={{ ...FONT, background: "#101828", color: "#fff" }}>PRIMARY</span>
                )}
              </div>
              <p className="text-[13px] leading-[1.4] mt-0.5 truncate" style={{ ...FONT, color: MUTED }}>{receivingAcct.number}</p>
            </div>
          </div>
        )}

        {/* Details — sectioned layout (DES-817) titles it "Invoice Details" and leads with Currency. */}
        <InfoCard title={sectionedLayout ? "Invoice Details" : undefined}>
          {/* No invoice-number row on a draft: created drafts have no number until issue (DES-715),
              and the uploaded draft carries its UL- label in the header instead. Shown once issued. */}
          {issued && <MetaRow label="Invoice number" value={invoiceNo} />}
          {sectionedLayout ? (
            <>
              <MetaRow label="Currency" value={currency} />
              <MetaRow label="Issue Date" value={issueDateLabel} />
              <MetaRow label="Due Date" value={`Next 30 days · ${dueDateLabel}`} last />
            </>
          ) : (
            <>
              <MetaRow label="Issue date" value={issueDateLabel} />
              {/* A recurring draft has no issue date yet, so its due date is the inherited default TERM
                  (DES-782 — each generated invoice is a standard invoice; term applied on issue), not a
                  fixed date. Once issued, it shows the concrete date like any other invoice. */}
              <MetaRow label="Due date" value={recurring && status === "Draft" ? "Next 30 days after issue" : `Next 30 days · ${dueDateLabel}`} />
              <MetaRow label="Currency" value={currency} last />
            </>
          )}
        </InfoCard>

        {/* Line items — items only; totals live in their own Summary card below */}
        <InfoCard title={sectionedLayout ? `Items ( ${ITEMS.length} )` : "Items"}>
          {ITEMS.map((it, i) => (
            <div key={it.name} className={`flex items-start justify-between py-2.5 ${i === ITEMS.length - 1 ? "" : "border-b border-[rgba(160,160,160,0.18)]"}`}>
              <div className="flex-1 min-w-0 pr-3">
                <p className="text-[14px] font-medium leading-tight" style={{ ...FONT, color: INK }}>{it.name}</p>
                <p className="text-[12px] leading-[1.3] mt-0.5" style={{ ...FONT, color: MUTED }}>
                  {it.qty} {it.unit} · {money(it.unitPrice)}
                </p>
              </div>
              <p className="text-[14px] font-medium" style={{ ...FONT, color: INK }}>{money(it.amount)}</p>
            </div>
          ))}
        </InfoCard>

        {/* Summary — Subtotal, Discount (only if any), Total. Total is always the final amount due;
            credit notes (DES-719) and partial payments add their own lines below it. */}
        <InfoCard title="Summary">
          <div className="flex items-center justify-between py-2.5">
            <span className="text-[13px]" style={{ ...FONT, color: MUTED }}>Subtotal</span>
            <span className="text-[13px]" style={{ ...FONT, color: INK }}>{money(SUBTOTAL)}</span>
          </div>
          {/* Discount row always shown (0.00 when none). Draft detail (DES-817) shows it in the
              accent colour to echo the Figma. */}
          <div className="flex items-center justify-between py-2.5">
            <span className="text-[13px]" style={{ ...FONT, color: MUTED }}>Discount</span>
            <span className="text-[13px] font-medium" style={{ ...FONT, color: sectionedLayout ? "#ff4a15" : INK }}>{DISCOUNT > 0 ? `−${money(DISCOUNT)}` : money(0)}</span>
          </div>
          {/* When credit is APPLIED, Total is just a reference and Amount due is the prominent figure.
              An UNapplied (Open) credit note isn't shown here — it's surfaced in the Credits Applied card
              above, and doesn't touch the invoice amount until applied. */}
          <div className={`flex items-center justify-between ${credited > 0 ? "pb-1.5" : "pb-3"} ${sectionedLayout && credited === 0 ? "pt-3 mt-1 -mx-4 px-4 rounded-lg bg-[#f2efe4]" : "pt-3 border-t border-[rgba(160,160,160,0.25)]"}`}>
            <span className={credited > 0 ? "text-[13px] font-medium" : "text-[15px] font-bold"} style={{ ...FONT, color: credited > 0 ? MUTED : INK }}>Total</span>
            <span className={credited > 0 ? "text-[13px] font-medium" : "text-[15px] font-bold"} style={{ ...FONT, color: credited > 0 ? MUTED : INK }}>{money(TOTAL)}</span>
          </div>
          {credited > 0 && (
            <>
              <div className="flex items-center justify-between pb-2.5">
                <span className="text-[13px]" style={{ ...FONT, color: MUTED }}>{isRefundContext ? "Refunded" : "Credit notes applied"}</span>
                <span className="text-[13px] font-medium" style={{ ...FONT, color: "#b42318" }}>−{money(credited)}</span>
              </div>
              <div className="flex items-center justify-between pb-3 pt-3 border-t border-[rgba(160,160,160,0.25)]">
                <span className="text-[17px] font-black tracking-[-0.4px]" style={{ ...FONT, color: INK }}>{isRefundContext ? "Net Paid" : "Amount due"}</span>
                <span className="text-[17px] font-black tracking-[-0.4px]" style={{ ...FONT, color: INK }}>{money(outstanding)}</span>
              </div>
            </>
          )}
          {status === "PartiallyPaid" && (
            <div className="flex items-center justify-between pb-3">
              <span className="text-[13px]" style={{ ...FONT, color: "#b45309" }}>Remaining due</span>
              <span className="text-[13px] font-medium" style={{ ...FONT, color: "#b45309" }}>{money(remaining)}</span>
            </div>
          )}
        </InfoCard>

        {/* Receiving payment details — only the critical fields; rest behind an accordion.
            The sectioned layout shows the receiving account as a card up top (DES-817), so skip it here. */}
        {status !== "Cancelled" && !sectionedLayout && (
          <InfoCard title={status === "Paid" ? "Payment received to" : "Receiving account"}>
            <MetaRow label="Account holder" value={bank.holder} />
            <MetaRow label="Account number" value={bank.number} />
            <AnimatePresence initial={false}>
              {bankExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden"
                >
                  <MetaRow label="Bank" value={bank.bankName} />
                  <MetaRow label="SWIFT / BIC" value={bank.swift} />
                  {/* Payment reference only exists once issued (no number on a draft). */}
                  {issued && <MetaRow label="Payment reference" value={invoiceNo} />}
                </motion.div>
              )}
            </AnimatePresence>
            <button
              onClick={() => setBankExpanded((v) => !v)}
              className="w-full flex items-center justify-center gap-1 py-3"
            >
              <span className="text-[13px] font-medium" style={{ ...FONT, color: INK }}>
                {bankExpanded ? "Show less" : "Show more"}
              </span>
              <KeyboardArrowDownIcon
                style={{ fontSize: 18, color: INK, transform: bankExpanded ? "rotate(180deg)" : "none", transition: "transform .2s" }}
              />
            </button>
          </InfoCard>
        )}
      </div>

      {/* Primary action — per status */}
      {status === "Draft" ? (
        scheduledRecurring ? (
          // Scheduled recurring draft — invoice-level actions only (same as a normal draft): Send now +
          // Edit (a one-off, content-only edit of this occurrence). Delete lives in the ⋯ menu. All
          // series actions (Edit recurring / Pause / Cancel) live on the series detail.
          <ButtonDock
            type="double"
            overflow
            secondaryLabel="Edit invoice"
            primaryLabel="Send now"
            onSecondary={openEdit}
            onPrimary={() => setSendSheetOpen(true)}
            homeIndicator
          />
        ) : uploaded ? (
          // Uploaded draft: it was already sent elsewhere, so the likely next step is recording
          // payment → "Mark as paid" primary, "Mark as sent" (→ Awaiting) secondary.
          <ButtonDock
            type="double"
            overflow
            secondaryLabel="Mark as sent"
            primaryLabel="Mark as paid"
            onSecondary={onIssued}
            onPrimary={() => { setRecordAmount(String(TOTAL)); setRecordPayOpen(true); }}
            homeIndicator
          />
        ) : (
          <ButtonDock
            type="double"
            overflow
            secondaryLabel="Mark as paid"
            primaryLabel="Send invoice"
            primaryDisabled={!requiredComplete}
            onSecondary={() => { setRecordAmount(String(TOTAL)); setRecordPayOpen(true); }}
            onPrimary={() => setSendSheetOpen(true)}
            homeIndicator
          />
        )
      ) : sendable ? (
        <ButtonDock
          type="double"
          overflow
          // On the INVOICE detail the secondary always sends the INVOICE (credit notes are sent from their
          // own detail page). Label is "Send invoice" to match the Figma (696:4595).
          secondaryLabel="Send invoice"
          primaryLabel="Mark as paid"
          onSecondary={() => setSendSheetOpen(true)}
          onPrimary={() => { setRecordAmount(String(TOTAL)); setRecordPayOpen(true); }}
          homeIndicator
        />
      ) : isRefundContext ? (
        // Refund credit note (DES-720). Sending the credit-note document and moving the money are
        // INDEPENDENT actions off a created refund CN (AC6): the client may send the note any time —
        // before or after the actual refund. So while the refund is still pending we show BOTH —
        // primary "Refund Credit Note" (the money-out) + secondary "Send/Resend Credit Note" (the
        // document). Once the refund is done the money-out action is gone, leaving only send/resend.
        refundDone ? (
          <ButtonDock
            type="single"
            overflow
            primaryLabel={anyUnsent ? "Send Credit Note" : "Resend Credit Note"}
            onPrimary={openSendCreditNote}
            homeIndicator
          />
        ) : (
          // Refund pending (Figma 696:5495): Send Invoice (secondary) + Continue Refund (primary, money-out).
          // The refund CREDIT NOTE is sent from its own detail page; here the secondary sends the invoice.
          <ButtonDock
            type="double"
            overflow
            secondaryLabel="Send invoice"
            primaryLabel="Continue Refund"
            onSecondary={() => setSendSheetOpen(true)}
            onPrimary={() => setRefundFlowOpen(true)}
            homeIndicator
          />
        )
      ) : status === "Cancelled" && creditNotes.length > 0 ? (
        // Cancelled via a credit note → the credit note is the persistent action (send or resend).
        // The header back arrow handles "later", so no secondary is needed.
        <ButtonDock
          type="single"
          overflow
          primaryLabel={anyUnsent ? "Send Credit Note" : "Resend Credit Note"}
          onPrimary={openSendCreditNote}
          homeIndicator
        />
      ) : (
        <ButtonDock type="single" overflow primaryLabel="Preview as PDF" onPrimary={() => setPdfPreviewOpen(true)} homeIndicator />
      )}

      {/* Secondary actions sheet */}
      <ActionsMenu
        open={actionsOpen}
        onClose={() => setActionsOpen(false)}
        status={status}
        uploaded={uploaded}
        scheduledRecurring={scheduledRecurring}
        terminal={terminal}
        cancellable={cancellable}
        creditNotesCount={creditNotes.length}
        onRefundWithCn={() => { setActionsOpen(false); setRefundFormOpen(true); }}
        onSendInvoice={() => { setActionsOpen(false); setSendSheetOpen(true); }}
        onEdit={openEdit}
        onDuplicate={duplicate}
        onCreateCn={() => { setActionsOpen(false); setCreditFormOpen(true); }}
        onDeleteDraft={() => { setActionsOpen(false); setConfirmDelete(true); }}
      />

      {/* Delete confirm (Draft only) */}
      <BottomSheet open={confirmDelete} title="Delete this draft?" onClose={() => setConfirmDelete(false)}>
        <p className="text-[14px] leading-[1.45] pb-4" style={{ ...FONT, color: MUTED }}>
          This draft will be removed from the system. This can’t be undone.
        </p>
        <ButtonDock
          type="double"
          secondaryLabel="Keep draft"
          primaryLabel="Delete"
          onSecondary={() => setConfirmDelete(false)}
          onPrimary={() => { setConfirmDelete(false); onDeleted?.(); }}
        />
      </BottomSheet>

      {/* Create Credit Note (DES-719) — opens on the invoice's CURRENT corrected state, so a second
          note shows lines already credited by earlier notes (Brand = 3,000 after CN-001). */}
      {creditFormOpen && (
        <CreditNoteForm
          creditNoteNo={nextCreditNoteNo}
          invoiceNo={invoiceNo}
          customerName={customerName}
          customerEmail={customerEmail}
          currency={currency}
          items={correctedItems}
          invoiceTotal={remaining}
          alreadyCredited={credited}
          outstanding={creditRoom}
          onBack={() => setCreditFormOpen(false)}
          onCreate={applyCreditNote}
        />
      )}

      {/* Refund with Credit Note (DES-720) — from a Paid invoice; refund-mode labels, cap = amount paid.
          Creating it moves the invoice to Pending Refund. */}
      {refundFormOpen && (
        <CreditNoteForm
          refund
          creditNoteNo={nextCreditNoteNo}
          invoiceNo={invoiceNo}
          customerName={customerName}
          customerEmail={customerEmail}
          currency={currency}
          items={correctedItems}
          invoiceTotal={outstanding}
          alreadyCredited={credited}
          outstanding={outstanding}
          onBack={() => setRefundFormOpen(false)}
          onCreate={applyRefundCreditNote}
        />
      )}

      {/* Refund flow (DES-720 AC3–AC5) — full-page: choose method → (BA) pick source account → confirm
          the pre-filled transfer draft. BA execution is out of scope; confirm simulates reconciliation. */}
      {refundFlowOpen && (
        <RefundCreditNoteFlow
          customerName={customerName}
          amount={refundPending}
          currency={currency}
          creditNoteNo={lastCreditNote?.no ?? ""}
          invoiceNo={invoiceNo}
          onClose={() => setRefundFlowOpen(false)}
          onConfirmBA={completeBaRefund}
          onMarkRefunded={markAlreadyRefunded}
        />
      )}

      {/* View Credit Note (DES-721) — read-only preview opened from the invoice's related credit notes.
          Shows status + type chips, a Related-invoice action (back to this invoice), and Send. */}
      {viewingCnIndex !== null && creditNotes[viewingCnIndex] && (() => {
        const cn = creditNotes[viewingCnIndex];
        // The note's own status. Refund CN → Pending Refund until its payout settles, then Refunded (refund =
        // full invoice) or Partially Refunded (refund < invoice total). Cancellation CN (DES-763) → Open /
        // Partially Applied / Fully Applied by how much is applied.
        const through = creditNotes.slice(0, viewingCnIndex + 1).reduce((s, c) => s + c.amount, 0);
        const applied = cn.applied ?? 0;
        const cnStatus = cn.cancelled
          ? "Cancelled"
          : isRefundContext
          ? (through > refundedOut + 0.001 ? "Pending Refund" : refundedOut >= TOTAL - 0.001 ? "Refunded" : "Partially Refunded")
          : applied <= 0.001 ? "Open" : credited >= TOTAL - 0.001 ? "Fully Applied" : "Partially Applied";
        return (
          <div className="absolute inset-0 z-50">
            <CreditNoteDetailPage
              status={cnStatus}
              kind={isRefundContext ? "refund" : "cancellation"}
              creditNoteNo={cn.no}
              invoiceNo={invoiceNo}
              customerName={cn.name}
              customerEmail={cn.email}
              issueDateLabel={cn.date}
              currency={currency}
              // Enrich each credited line with its original invoice value (matched by name) for context.
              lines={cn.lines.map((l) => ({ ...l, original: ITEMS.find((it) => it.name === l.name)?.amount }))}
              total={cn.amount}
              invoiceTotal={TOTAL}
              reason={cn.reason}
              reasonNote={cn.reasonNote}
              refundProof={cn.refundProof}
              sent={cn.sent}
              updatedDateLabel={cn.updatedDate}
              onBack={() => setViewingCnIndex(null)}
              // AC3: the linked invoice is this very detail page → returning to it IS opening the invoice.
              onViewInvoice={() => setViewingCnIndex(null)}
              // AC4: sending happens inside the detail page's own send flow; persist the sent state here.
              onSent={() => setCreditNotes((prev) => prev.map((c, i) => (i === viewingCnIndex ? { ...c, sent: true, sentDate: SENT_TODAY } : c)))}
              // DES-763 (cancellation CNs): Apply + Void only while Open; Edit at any application status.
              // DES-720 (refund CNs): Edit + Cancel while Pending Refund (until the refund is transferred).
              onApply={!isRefundContext && cnStatus === "Open" ? () => applyCnToInvoice(viewingCnIndex) : undefined}
              onEdit={!cn.cancelled && (!isRefundContext || cnStatus === "Pending Refund") ? () => { const i = viewingCnIndex; setViewingCnIndex(null); setEditingCnIndex(i); } : undefined}
              onCancel={!cn.cancelled && ((!isRefundContext && cnStatus === "Open") || (isRefundContext && cnStatus === "Pending Refund")) ? () => voidCreditNote(viewingCnIndex) : undefined}
            />
          </div>
        );
      })()}

      {/* Refund-proof attachment preview (DES-720 evidence). */}
      <FilePreviewOverlay open={proofPreview !== null} file={proofPreview} onClose={() => setProofPreview(null)} />

      {/* Edit an existing credit note (DES-719 AC4) — reopened with its prior state restored.
          The cap is the outstanding plus this note's own amount (it's being replaced). */}
      {editingCnIndex !== null && creditNotes[editingCnIndex] && (() => {
        const cn = creditNotes[editingCnIndex];
        const seedLines: DraftLine[] = cn.draftLines
          ?? cn.lines.map((l, i) => ({ id: `cn-${i}`, name: l.name, unit: "service", qty: 1, unitPrice: String(l.amount), maxQty: 1, origAmount: l.amount }));
        // A refund CN edits in refund mode (cap = amount paid); a cancellation CN edits in credit mode.
        const editingRefund = isRefundContext;
        // A Partially-Applied cancellation note re-applies on save → the CTA says "Apply to Invoice".
        const editingApplied = !editingRefund && (cn.applied ?? 0) > 0.001;
        return (
          <CreditNoteForm
            mode="edit"
            refund={editingRefund}
            submitLabel={editingApplied ? "Apply to Invoice" : undefined}
            creditNoteNo={cn.no}
            invoiceNo={invoiceNo}
            customerName={cn.name}
            customerEmail={cn.email}
            currency={currency}
            items={ITEMS}
            invoiceTotal={TOTAL}
            alreadyCredited={credited - cn.amount}
            outstanding={creditRoom + cn.amount}
            initial={{ name: cn.name, email: cn.email, reason: cn.reason ?? "", reasonNote: cn.reasonNote ?? "", issueDate: cn.issueDate ?? new Date(2026, 5, 26), lines: seedLines }}
            onBack={() => { setEditingCnIndex(null); setViewingCnIndex(editingCnIndex); }}
            onCreate={(p) => saveCreditNote(editingCnIndex, p)}
          />
        );
      })()}

      {/* Re-send prompt after editing a sent credit note (AC4) */}
      <ResendPromptSheet
        open={resendPromptOpen}
        onClose={() => setResendPromptOpen(false)}
        onNotNow={() => { setResendPromptOpen(false); setLocalToast("Credit note updated"); }}
        onSendUpdate={() => { setResendPromptOpen(false); setSendContext("creditNote"); setSendSheetOpen(true); }}
      />

      {/* "Send credit note" picker — opened only when there are 2+ unsent notes. */}
      <SendPickerSheet
        open={sendPickerOpen}
        onClose={() => setSendPickerOpen(false)}
        creditNotes={creditNotes}
        selectedIndex={sendCnIndex}
        onSelect={setSendCnIndex}
        onSend={() => { setSendPickerOpen(false); setSendSheetOpen(true); }}
      />

      {/* Record payment — full marks Paid, less marks Partially Paid */}
      <RecordPaymentSheet
        open={recordPayOpen}
        onClose={() => setRecordPayOpen(false)}
        value={recordAmount}
        onChange={setRecordAmount}
        total={TOTAL}
        accountId={recordAccountId}
        onAccountChange={setRecordAccountId}
        date={recordDate}
        onDateChange={setRecordDate}
        onSubmit={() => {
          const amt = Math.max(0, Number(recordAmount) || 0);
          setRecordPayOpen(false);
          if (amt > TOTAL) {
            setOverpayment(amt - TOTAL);
            setStatus("Paid");
            setLocalToast("Payment recorded · overpayment flagged");
          } else if (amt === TOTAL) {
            setOverpayment(0);
            setStatus("Paid");
            setLocalToast("Payment recorded");
          } else if (amt > 0) {
            setPaidAmount(amt);
            setStatus("PartiallyPaid");
            setLocalToast("Partial payment recorded");
          }
        }}
      />

      {/* Optional send (reused sub-flows) */}
      <SendInvoiceSheet
        open={sendSheetOpen}
        customerName={sendName}
        customerEmail={sendEmail}
        onClose={() => { setSendSheetOpen(false); setSendContext("invoice"); }}
        onConfirm={(method) => {
          // All methods keep the Delivery method page mounted underneath and open instantly
          // (no transition): email review / share-link sheet / PDF preview overlay it.
          if (method === "email") setEmailReviewOpen(true);
          else if (method === "link") setShareLinkOpen(true);
          else if (method === "pdf") setPdfPreviewOpen(true);
        }}
      />

      {/* Email review — shown instantly over the (still-mounted) Delivery method page; no transition. */}
      {emailReviewOpen && (
        <div className="absolute inset-0 z-50">
          <ReviewEmail
            customerName={sendName}
            customerEmail={sendEmail}
            invoiceNo={sendNo}
            amountLabel={`${currency} ${sendTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            dueDateLabel={dueDateLabel}
            onBack={() => setEmailReviewOpen(false)}
            onSend={completeSend}
          />
        </div>
      )}

      <ShareLinkSheet
        open={shareLinkOpen}
        link={`https://pay.statrys.com/i/${sendNo.toLowerCase()}`}
        onSent={completeSend}
        onDismiss={() => setShareLinkOpen(false)}
      />

      {/* PDF preview — shown instantly over the (still-mounted) Delivery method page; no transition.
          A credit-note send renders the dedicated credit-note document; otherwise the invoice. */}
      {pdfPreviewOpen && (
        <div className="absolute inset-0 z-50">
          {sendContext === "creditNote" && selectedSendCn ? (
            <CreditNotePreviewPage
              creditNoteNo={selectedSendCn.no}
              invoiceNo={invoiceNo}
              customerName={selectedSendCn.name}
              customerEmail={selectedSendCn.email}
              issueDateLabel={selectedSendCn.date}
              currency={currency}
              lines={selectedSendCn.lines}
              total={selectedSendCn.amount}
              reason={selectedSendCn.reason}
              reasonNote={selectedSendCn.reasonNote}
              onBack={() => setPdfPreviewOpen(false)}
              onDownloaded={() => { setPdfPreviewOpen(false); completeSend(); }}
            />
          ) : (
            <InvoicePreviewPage
              invoiceNo={sendNo}
              customerName={sendName}
              customerEmail={sendEmail}
              issueDateLabel={issueDateLabel}
              dueDateLabel={dueDateLabel}
              currency={currency}
              items={ITEMS}
              subtotal={SUBTOTAL}
              discount={DISCOUNT}
              total={sendTotal}
              bank={bank}
              status={{ label: meta.label, bg: meta.bg, border: meta.border, text: meta.text }}
              onBack={() => setPdfPreviewOpen(false)}
              onDownloaded={() => {
                // From a sendable invoice, download counts as a send channel;
                // for terminal/read-only invoices it's just a re-download.
                setPdfPreviewOpen(false);
                if (sendable) completeSend();
                else setLocalToast("Invoice downloaded");
              }}
            />
          )}
        </div>
      )}

      {/* Local toast for in-page outcomes (void / re-download) */}
      <SendSuccessToast open={!!localToast} message={localToast ?? ""} onDone={() => setLocalToast(null)} />
    </div>
  );
}

export default InvoiceDetailPage;
