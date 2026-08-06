import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PageAppHeader } from "../../components/PageAppHeader";
import { PageHeader } from "../../ui/PageHeader";
import { ButtonDock } from "../../components/ButtonDock";
import { BottomSheet } from "../../components/BottomSheet";
import { SendInvoiceSheet } from "../../components/SendInvoiceSheet";
import { CreditNoteForm } from "../credit-note-form/CreditNoteForm";
import { RefundCreditNoteFlow } from "./RefundCreditNoteFlow";
import { FilePreviewOverlay, type UploadedFileInfo } from "../../components/UploadedFile";
import { CreditNotePreviewPage, CreditNoteDocumentPreview } from "../credit-note-list/CreditNotePreviewPage";
import { CreditNoteDetailPage } from "../credit-note-list/CreditNoteDetailPage";
import { InvoicePreviewPage, InvoiceDocumentPreview } from "../shared/InvoicePreviewPage";
import { Toast } from "../../components/Toast";
import { getAccount, RECEIVING_ACCOUNTS } from "../../data/receivingAccounts";
import { SHOW_CREDIT_NOTES } from "../../lib/flags";
import { CREDIT_NOTES } from "../../data/creditNotes";
import { money } from "../../lib/format";
import { DETAIL_STATUS_META } from "../../lib/status";
import { FONT, INK, MUTED, initials } from "../../lib/theme";
import type { CreditNotePayload, DraftLine, DetailStatus, InvoiceEditSeed, InvoiceLine } from "../../types";
import { ITEMS, SUBTOTAL, DISCOUNT, TOTAL, PAID_PARTIAL, SENT_TODAY, REFUND_DATE_ISO, EDITED_TODAY } from "./demoInvoice";
import type { CreditNote, RefundProof } from "./creditNoteTypes";
import { MoreVertical, X } from "lucide-react";
import { Tile } from "../../ui/Tile";
import { ListCard } from "../../ui/ListCard";
import { ListRow } from "../../ui/ListRow";
import { CountryFlag } from "../../components/CountryFlag";
import { CURRENCY_COUNTRY } from "../../components/CurrencySheet";
import { CreditsAppliedSection } from "./CreditsAppliedSection";
import { ActionsMenu } from "./ActionsMenu";
import { LockedPeriodDialog } from "../locked-period/LockedPeriodDialog";
import { LockedPeriodBanner } from "../locked-period/LockedPeriodBanner";
import { RecordPaymentSheet } from "./RecordPaymentSheet";
import { ResendPromptSheet, SendPickerSheet } from "./SendCnSheets";

interface InvoiceDetailPageProps {
  initialStatus?: DetailStatus;
  /** Where a Draft came from — sets the default emphasis (DES-715 vs DES-716 AC4). */
  origin?: "created" | "uploaded";
  invoiceNo?: string;
  /** Drafts only: line-item count at save time. A manually-created draft saved with 0 items (backed
   *  out of the editor via "Go to invoice list" before adding anything) has nothing to show/send —
   *  the Items/Summary cards are hidden, the amount reads 0, and the CTA offers Edit, not Send. */
  itemsCount?: number;
  customerName?: string;
  customerEmail?: string;
  /** Sender company email (from Invoice Settings) — the Cc when "Send me a copy" is on. */
  companyEmail?: string;
  issueDateLabel?: string;
  dueDateLabel?: string;
  /** Shown next to the "Paid" badge (e.g. "Paid 20 Jun 2026") — same "bare date, no repeated
   *  status word" convention as Void/Draft. */
  paidDateLabel?: string;
  currency?: string;
  /** Seed a credit note for an invoice opened from the list. `amount` omitted = full credit (Cancelled);
   *  a smaller `amount` = partial (invoice stays Awaiting, balance reduced). `sent` → Resend. */
  /** `draft` seeds the note un-applied with a Draft chip (dev deep link for the draft-CN demo). */
  initialCreditNote?: { no: string; amount?: number; sent: boolean; draft?: boolean; awaiting?: boolean };
  onBack?: () => void;
  /** Header shows a back chevron instead of the usual X — for entry points that are a genuine
   *  detour with somewhere to return to (e.g. DuplicateDecision's "View Original Invoice"), not
   *  the normal "tap a row, view its detail" flow. */
  backChevron?: boolean;
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
  /** Dev QuickNav deep link: open the seeded credit note's detail overlay on mount. */
  initialViewCn?: boolean;
  /** Locked-period demo (DES-751): "Send invoice" and "Edit invoice" open a blocking locked-period
   *  dialog instead of proceeding (the invoice is dated in a closed accounting period). */
  lockedPeriod?: boolean;
}

/** Status-aware sales-invoice detail (DES-715 / DES-716). */
export function InvoiceDetailPage({
  initialStatus = "Awaiting",
  origin = "created",
  invoiceNo = "INV-2026-000042",
  itemsCount,
  customerName = "Marlow & Finch Studio",
  customerEmail = "apa@marlowfinch.co",
  companyEmail = "hello@lumenstudio.co",
  issueDateLabel = "10 Jun 2026",
  dueDateLabel = "10 Jul 2026",
  paidDateLabel = "20 Jun 2026",
  currency = "USD",
  initialCreditNote,
  onBack,
  backChevron = false,
  onEdit,
  onIssued,
  onDeleted,
  onSent,
  flashToast,
  refundTag,
  onRefunded,
  initialViewCn = false,
  lockedPeriod = false,
}: InvoiceDetailPageProps) {
  const [status, setStatus] = useState<DetailStatus>(initialStatus);
  const [actionsOpen, setActionsOpen] = useState(false);
  // Locked-period demo: which blocked action was tapped (drives the dialog copy). null = closed.
  const [lockedAction, setLockedAction] = useState<null | "send" | "edit" | "createCn" | "refund">(null);
  // Locked-period demo: which blocked action was tapped on the (refund) credit-note DETAIL overlay
  // (Edit or Apply) — its own dialog so it layers above the z-50 CN overlay (the top-level dialog would
  // render behind it). null = closed.
  const [lockedCnAction, setLockedCnAction] = useState<null | "edit" | "apply">(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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
      // outstanding on open. (Newly created notes start Open, applied = 0.) A seeded DRAFT stays un-applied.
      applied: initialCreditNote.draft ? 0 : amt,
      draft: !!initialCreditNote.draft,
      name: customerName,
      email: customerEmail,
      lines: docLines,
      date: issueDateLabel,
      // Carry the invoice's due date so the CN detail (incl. refund CNs) shows a Due Date, not "—".
      dueDateLabel,
      reason: isFull ? "Return" : "Pricing error",
      issueDate: new Date(2026, 5, 15),
      draftLines,
      sent: !!initialCreditNote.sent,
      sentDate: initialCreditNote.sent ? "20 Jun 2026" : undefined,
      // Awaiting-refund demo: an external refund was submitted with proof and is waiting on the
      // accountant (drives the "Awaiting refund" chip). Applied notes carry no proof.
      refundProof: initialCreditNote.awaiting
        ? { date: REFUND_DATE_ISO, method: `Statrys · ${RECEIVING_ACCOUNTS.find((a) => a.primary)?.name ?? "Business Account"}`, amount: amt, referenceNo: "TRF-4472190", awaiting: true }
        : undefined,
    }];
  });
  const [creditFormOpen, setCreditFormOpen] = useState(false);
  // When the create form was reopened to resume a Draft, this is that note's index (else null = new).
  const [resumeDraftIndex, setResumeDraftIndex] = useState<number | null>(null);
  // Refund-with-credit-note form open (DES-720, from a Paid invoice).
  const [refundFormOpen, setRefundFormOpen] = useState(false);
  // Refund flow page (DES-720 AC3–AC5): method → (BA) pick source account → confirm transfer.
  const [refundFlowOpen, setRefundFlowOpen] = useState(false);
  // DES-720 AC5 — an EXTERNAL refund was submitted (proof recorded) and is awaiting accountant
  // confirmation. The invoice stays Pending Refund; this just stops the dock offering "Continue Refund".
  const [refundSubmitted, setRefundSubmitted] = useState(!!initialCreditNote?.awaiting);
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
  const [viewingCnIndex, setViewingCnIndex] = useState<number | null>(initialViewCn && initialCreditNote ? 0 : null);
  // Refund-proof attachment open in the file preview overlay (DES-720 evidence).
  const [proofPreview, setProofPreview] = useState<UploadedFileInfo | null>(null);
  // "View all credit notes" expand — collapse to the 2 most recent when there are more.
  const [cnExpanded, setCnExpanded] = useState(false);
  // After editing a previously-sent credit note, prompt to re-send the updated version (AC4).
  const [resendPromptOpen, setResendPromptOpen] = useState(false);
  const [recordPayOpen, setRecordPayOpen] = useState(false);
  const [recordAmount, setRecordAmount] = useState("");
  // "Record Payment" also captures which bank account received it + an optional payment date (DES-715
  // comment — indicator for reconciliation; no GL impact). Seeded to the primary receiving account.
  const [recordAccountId, setRecordAccountId] = useState("personal");
  const [recordDate, setRecordDate] = useState<Date | null>(null);
  // A logged-but-unapproved payment (new flow): the user records the amount + method, but the invoice
  // STAYS Awaiting Payment until the accountant approves it (which then flips it to Paid / Partially
  // Paid). Approval happens on the accountant side (backend, out of scope) — here we hold the pending log.
  const [pendingPayment, setPendingPayment] = useState<{ amount: number; accountId: string; date: Date | null } | null>(null);
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
  // Brief loading state on the Send invoice button itself (Figma node 4591-5847) before the
  // delivery-method sheet opens — this prototype has no real network call to await.
  const [sendPending, setSendPending] = useState(false);
  const handleSendInvoiceClick = () => {
    setSendPending(true);
    setTimeout(() => {
      setSendPending(false);
      setSendSheetOpen(true);
    }, 600);
  };
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  // True only when the preview was reached via the Send sheet's own Download row (or its PDF-segment
  // Download) — the download already "happened" there, so this hides the redundant Download PDF
  // dock. "Preview as PDF" / ActionsMenu's "Preview PDF" reach the same page with nothing downloaded
  // yet, so they keep showing it.
  const [pdfFromSend, setPdfFromSend] = useState(false);
  // Whether the send sub-flow is sending the invoice or the just-created credit note.
  const [sendContext, setSendContext] = useState<"invoice" | "creditNote">("invoice");
  // Which credit note the send flow targets (index into creditNotes). With several notes on one invoice
  // each is its own document, so the send flow is parameterised by index rather than always the latest.
  const [sendCnIndex, setSendCnIndex] = useState(0);
  // "Send credit note" picker sheet — shown only when there are MULTIPLE unsent notes to choose between.
  const [sendPickerOpen, setSendPickerOpen] = useState(false);

  const meta = DETAIL_STATUS_META[status];
  const issued = status !== "Draft";
  // Uploaded drafts default to "Mark as sent" (already issued externally → Awaiting payment);
  // "Record Payment" is the secondary path for invoices already settled. Created drafts default to sending.
  const uploaded = origin === "uploaded";
  // A manually-created draft saved with zero line items (backed out of the editor before adding
  // anything) — nothing to show or send, so Items/Summary hide, the amount reads 0, and the CTA
  // offers Edit instead of Send.
  const isEmptyDraft = status === "Draft" && !uploaded && itemsCount === 0;
  // The page header is always the generic "Invoice Details" (Figma "Invoice Detail", node
  // 1423:63521) — never a document number, not even for a draft. The actual reference (an
  // uploaded draft's UL-number, or the real number once issued) shows in the hero body instead;
  // a created draft has no number yet (assigned on issue) so it shows nothing there.
  const pageHeaderTitle = "Invoice Details";
  const heroReference = status === "Draft" && !uploaded
    ? ""
    : status === "Draft" && uploaded
    ? (invoiceNo ? invoiceNo.replace(/^INV/, "UL") : "") // uploaded draft (DES-716/817)
    : (invoiceNo || "");
  // Created + uploaded drafts share the DES-817 detail layout: Bill To → Receiving account card →
  // Invoice details → Items → Summary. Only the header + hero line differ by source (uploaded shows
  // the UL number + "Uploaded"; created shows nothing there since it has no number yet).
  // The account shown on the created-draft receiving card (default = the primary Statrys account).
  const receivingAcct = RECEIVING_ACCOUNTS.find((a) => a.primary) ?? RECEIVING_ACCOUNTS[0];
  // Read-only states for content. Paid still exposes a ⋯ menu (Refund with Credit Note); Cancelled/
  // Refunded have no menu actions.
  const terminal = status === "Paid" || status === "Cancelled" || status === "Refunded";
  // ⋯ menu: Draft (edit/delete), Awaiting/Overdue (edit / add credit note), PendingRefund. Paid,
  // Partially Paid and Void expose their actions on the dock instead, so no menu (DES-817 review).
  const showMenu = !terminal && status !== "PartiallyPaid";
  const sendable = status === "Awaiting" || status === "Overdue" || status === "PartiallyPaid";

  // Refund context (Paid/PendingRefund/Refunded, or a derived refund tag) vs cancellation context.
  const refundCtx = status === "Paid" || status === "PendingRefund" || status === "Refunded" || !!refundTag;
  // Credit-note derived values. Refund CNs use their full amount (refund lifecycle); cancellation CNs
  // (DES-763) reduce the invoice ONLY once applied, so cancellation `credited` counts applied amounts.
  const appliedTotal = creditNotes.reduce((s, c) => s + (c.applied ?? 0), 0);
  // Cancelled notes are kept as records but reserve NO credit room; Drafts (DES-719) aren't created
  // yet, so they reserve nothing and don't count toward credited.
  const creditNoteTotal = creditNotes.reduce((s, c) => s + (c.cancelled || c.draft ? 0 : c.amount), 0);
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
      (s, cn) => (cn.draft ? s : s + cn.lines.filter((l) => l.name === it.name).reduce((a, l) => a + l.amount, 0)),
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

  // The one-line status explainer under the amount — sits right beside the colored status badge
  // (Figma "status + date" format), so it never repeats the badge's own word (no "Overdue" text
  // next to an "Overdue" badge, no "Paid"/"Refunded" text next to those badges either).
  const bannerText: Record<DetailStatus, string> = {
    // Created drafts show "Created <date>", uploaded drafts show "Uploaded <date>" — inline
    // beside the "Draft" badge (same "status + date" row every other status uses), not a separate
    // line. No "on" connector (matches every other date caption).
    Draft: `${uploaded ? "Uploaded" : "Created"} ${issueDateLabel}`,
    // Hero shows the ORIGINAL full total as the big number; the sub-line shows what's actually due —
    // "$X due" once a credit note reduces the balance, otherwise the due date ("Due 5 Jul 2026",
    // same absolute format as the list). All "due" lines share one font weight + size (see render).
    // No inner "·" here — "remaining due/since <date>" is one continuous clause, not two
    // fragments; the outer "·" added between the badge and this whole sub-line (see render) is
    // the one separating genuinely disjoint pieces (the badge word vs. this descriptive clause).
    Awaiting: credited > 0 ? `${money(outstanding, currency)} remaining due ${dueDateLabel}` : `Due ${dueDateLabel}`,
    // Lowercase "since" on purpose in the plain (no credit note) case — it's not an independent
    // fact the way "Due <date>"/"Paid"/"Created <date>" are (those read fine on their own next to
    // the badge); "since <date>" only makes sense as a continuation of "Overdue", so render() skips
    // the "·" for this one case and lets it read as a single sentence, "Overdue since <date>".
    Overdue: credited > 0 ? `${money(outstanding, currency)} remaining since ${dueDateLabel}` : `since ${dueDateLabel}`,
    PartiallyPaid: `${money(remaining, currency)} remaining due ${dueDateLabel}`,
    // Bare "Paid <date>" — same convention as Void's bare date (badge already says "Paid", no
    // need to repeat it). Overpayment takes priority when it applies.
    Paid: overpayment > 0 ? `Overpaid by ${money(overpayment, currency)}, flagged for review` : paidDateLabel,
    // Voided invoices show their date too, same as every other status (bare date, no repeated
    // "Void" word next to the badge that already says it — matches the list row).
    Cancelled: issueDateLabel,
    // Refund-context statuses are computed directly in headlineBanner below instead (their text
    // depends on refundAmt/refundVerb/fullyRefunded, not just which status this is — a "Paid"
    // invoice with a derived refund tag needs the same refund text as a real PendingRefund status).
    // These two keys are structurally unreachable — isRefundContext is always true whenever
    // status is actually "PendingRefund" or "Refunded".
    PendingRefund: "",
    Refunded: "",
  };

  // Refund money model (DES-720, cumulative). `credited` = total committed to refund credit notes;
  // `refundedOut` = money actually paid out. `refundPending` is the committed-but-unpaid remainder — a
  // refund still awaiting its payout (a fresh CN, or a NEW note raised after an earlier refund settled).
  const refundPending = Math.max(0, credited - refundedOut);
  const fullyRefunded = refundedOut >= TOTAL - 0.001 && refundedOut > 0.001;

  // Refund context (DES-720): the headline leads with the refund amount, not the amount due (paid
  // invoices owe nothing). Context = status "Pending Refund"/"Refunded" or a derived refund tag.
  // There is no "Partially Refunded" state — ANY money actually refunded reads as "Refunded"; before
  // any payout it falls back to the list-sync tag (and the "Pending Refund" status badge shows on its own).
  const effectiveRefundTag =
    refundedOut > 0.001 ? "Refunded"
    : refundTag === "Partially Refunded" ? "Refunded"
    : refundTag;
  const isRefundContext = status === "PendingRefund" || status === "Refunded" || !!effectiveRefundTag;
  // MVP: one credit note per invoice. Count only ACTIVE (non-cancelled) notes — a cancelled note is
  // retired, so a new CN can be raised again. Gates the "Refund with Credit Note" entry (⋯ + dock).
  const activeCnCount = creditNotes.filter((c) => !c.cancelled).length;
  // Plain Paid (no refund in progress) — its actions (Refund + Preview as PDF) live in the ⋯ menu, no dock.
  const paidActionsInMenu = status === "Paid" && !isRefundContext && activeCnCount === 0;
  // Headline: while a payout is due, lead with the pending amount ("Amount to refund"); once settled,
  // show the cumulative amount refunded to date.
  // Hero big number is ALWAYS the original full invoice total (user, 22/Jul) — for every status,
  // including refund context. Credit notes / refunds are detailed in the sub-line + Summary below,
  // not in the big number.
  const headlineAmount = isEmptyDraft ? 0 : TOTAL;
  // Refund-context sub-line: the amount still to refund (payout pending) or the amount refunded (settled).
  const refundAmt = refundPending > 0.001 ? refundPending : refundedOut;
  const refundVerb = refundPending > 0.001 ? "to refund" : "refunded";
  // Refund context shows just the amount to refund (no "remaining paid" line); other statuses keep their banner.
  const headlineBanner =
    // Refund context: same inline "status + date/amount" row as every other status. Once fully
    // refunded, show the settled date (the credit note's own date) instead of the "to refund"
    // amount — same "badge word not repeated, just the bare date" pattern as Void/Paid.
    isRefundContext
    ? (fullyRefunded ? (lastCreditNote?.date ?? "") : `${money(refundAmt, currency)} ${refundVerb}`)
    : bannerText[status];
  // Only the plain (no credit note) Overdue sub-line is a grammatical continuation of the badge
  // word rather than its own disjoint fact — every other case (Due/Paid/Uploaded/Created/Paused/
  // Scheduled/refund amount, and Overdue's own credited>0 case) reads fine as a standalone fragment
  // next to the "·". render() skips the "·" only here so it reads as one sentence: "Overdue since <date>".
  const bannerIsContinuation = status === "Overdue" && credited <= 0.001;
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
    draftLines: p.draftLines, issueDate: p.issueDate, dueDateLabel: p.dueDateLabel,
    accountId: p.accountId, sent: false,
  });

  // Cancel a credit note (DES-719) — keep it as a Cancelled RECORD and fully reverse its effect on the
  // invoice. Stays on the CN detail, which re-renders as Cancelled (Preview-only, no ⋯).
  const voidCreditNote = (index: number) => {
    setCreditNotes((prev) => prev.map((c, i) => (i === index ? { ...c, cancelled: true, applied: 0 } : c)));
    if (isRefundContext) {
      // Cancelling the last live pending-refund note reverts the invoice Pending Refund → Paid.
      if (!creditNotes.some((c, i) => i !== index && !c.cancelled)) setStatus("Paid");
    } else {
      // A cancellation CN reversal restores the invoice it had voided (or settled from Partially Paid).
      if (status === "Cancelled") setStatus("Awaiting");
      else if (status === "Paid" && paidAmount > 0.001) setStatus("PartiallyPaid");
    }
    setViewingCnIndex(null); // cancelling returns straight to the invoice detail
    setLocalToast(isRefundContext ? "Refund cancelled" : "Credit note cancelled");
  };

  // Back out of the create form (DES-719) → save what's entered as a DRAFT (applied = 0, draft = true).
  // Resuming a draft updates it in place; a fresh form appends a new draft. Returns to the invoice detail,
  // where the Credits section shows it with a Draft chip.
  const saveDraft = (p: CreditNotePayload) => {
    const idx = resumeDraftIndex != null ? resumeDraftIndex : creditNotes.length;
    setCreditNotes((prev) =>
      resumeDraftIndex != null
        ? prev.map((c, i) => (i === resumeDraftIndex ? { ...cnFromPayload(c.no, p), applied: 0, draft: true, sent: c.sent } : c))
        : [...prev, { ...cnFromPayload(nextCreditNoteNo, p), applied: 0, draft: true }]
    );
    setCreditFormOpen(false);
    setResumeDraftIndex(null);
    setLocalToast("Saved as draft");
    setViewingCnIndex(idx); // Back while creating → land on the new draft's CN detail.
  };

  // Back out of the refund create form (DES-720) → save what's entered as a DRAFT refund CN. Mirrors
  // saveDraft but returns to the refund form on resume. A draft refund CN lives while the invoice is
  // still Paid (isRefundContext only turns on once it's applied → Pending Refund).
  const saveRefundDraft = (p: CreditNotePayload) => {
    const idx = resumeDraftIndex != null ? resumeDraftIndex : creditNotes.length;
    setCreditNotes((prev) =>
      resumeDraftIndex != null
        ? prev.map((c, i) => (i === resumeDraftIndex ? { ...cnFromPayload(c.no, p), applied: 0, draft: true, sent: c.sent } : c))
        : [...prev, { ...cnFromPayload(nextCreditNoteNo, p), applied: 0, draft: true }]
    );
    setRefundFormOpen(false);
    setResumeDraftIndex(null);
    setLocalToast("Saved as draft");
    setViewingCnIndex(idx); // Back while creating → land on the new draft's CN detail.
  };

  // Reopen a Draft credit note to resume it. A draft on a Paid / refund-context invoice is a refund
  // draft (DES-720) → reopen the refund form; otherwise the cancellation form (DES-719).
  const resumeDraft = (index: number) => {
    setResumeDraftIndex(index);
    if (status === "Paid" || isRefundContext) setRefundFormOpen(true);
    else setCreditFormOpen(true);
  };

  // Create the credit note (DES-719) — it APPLIES immediately (no separate apply step): the note reduces
  // the invoice now. Resuming a draft converts that draft in place; otherwise a new note is appended.
  // A full credit cancels the invoice (or settles a partially-paid one). Returns to the invoice detail.
  const createCreditNote = (p: CreditNotePayload) => {
    const idx = resumeDraftIndex != null ? resumeDraftIndex : creditNotes.length;
    const otherApplied = creditNotes.reduce((s, c, i) => s + (i === idx ? 0 : (c.applied ?? 0)), 0);
    const applied = Math.min(p.amount, creditBase - otherApplied);
    setCreditNotes((prev) =>
      resumeDraftIndex != null
        ? prev.map((c, i) => (i === resumeDraftIndex ? { ...cnFromPayload(c.no, p), applied, draft: false, sent: c.sent } : c))
        : [...prev, { ...cnFromPayload(nextCreditNoteNo, p), applied }]
    );
    if (otherApplied + applied >= creditBase - 0.001) setStatus(status === "PartiallyPaid" ? "Paid" : "Cancelled");
    setCreditFormOpen(false);
    setResumeDraftIndex(null);
    setLocalToast("Credit note created");
  };

  // Apply a Draft credit note from its detail page (DES-719): clears the draft flag, offsets the
  // invoice, and returns to the invoice detail.
  const applyDraft = (index: number) => {
    // Refund draft (invoice still Paid): applying commits it (draft → Applied) and moves the invoice to
    // Pending Refund; the payout step stays separate. Stay on the CN detail so it now reads "Applied".
    if (status === "Paid") {
      setCreditNotes((prev) => prev.map((c, i) => (i === index ? { ...c, draft: false } : c)));
      setStatus("PendingRefund");
      setLocalToast("Refund credit note created");
      return;
    }
    const cn = creditNotes[index];
    const otherApplied = creditNotes.reduce((s, c, i) => s + (i === index ? 0 : (c.applied ?? 0)), 0);
    const applied = Math.min(cn.amount, creditBase - otherApplied);
    setCreditNotes((prev) => prev.map((c, i) => (i === index ? { ...c, applied, draft: false } : c)));
    if (otherApplied + applied >= creditBase - 0.001) setStatus(status === "PartiallyPaid" ? "Paid" : "Cancelled");
    setViewingCnIndex(null);
    setLocalToast("Credit note applied");
  };

  // Delete a Draft credit note (DES-719) — removes the record and returns to the invoice detail.
  const deleteDraft = (index: number) => {
    setCreditNotes((prev) => prev.filter((_, i) => i !== index));
    setViewingCnIndex(null);
    setLocalToast("Draft deleted");
  };


  // Refund-method outcome (DES-720 AC3–AC5). Statrys BA hands off to the BA payment flow (out of scope →
  // stub: a toast; the invoice stays Pending Refund until the transfer auto-reconciles). "Mark as already
  // refunded" records it now → Refunded.
  // BA refund confirmed (DES-720 AC4/AC5) — the pre-filled outgoing draft is handed off; the BA flow owns
  // execution (out of scope → stub). On confirm we simulate reconciliation: a full refund → Refunded;
  // a partial refund stays Pending Refund (cumulative refunds reduce what's left).
  // Submit a refund (DES-720 AC4/AC5). Both methods leave the invoice at Pending Refund — the move to
  // Refunded is the accountant's GL posting (backend), NOT a client action. We record the evidence as
  // "awaiting" and flag the refund submitted so the dock stops offering "Refund Credit Note".
  const submitRefund = (proof: RefundProof, toast: string) => {
    setRefundFlowOpen(false);
    const priorOut = refundedOut;
    setCreditNotes((prev) => {
      let cum = 0;
      return prev.map((c) => {
        cum += c.amount;
        return cum > priorOut + 0.001 && !c.cancelled ? { ...c, refundProof: { ...proof, awaiting: true } } : c;
      });
    });
    setRefundSubmitted(true);
    setLocalToast(toast);
  };

  // BA transfer confirmed (AC4) — the pre-filled outgoing draft is handed to the BA flow (execution +
  // auto-reconciliation out of scope). Invoice stays Pending Refund until the accountant validates → Refunded.
  const completeBaRefund = (fromAccountId: string) => {
    const acct = getAccount(fromAccountId);
    submitRefund(
      { date: REFUND_DATE_ISO, method: `Statrys · ${acct?.name ?? "Business Account"}`, amount: refundPending },
      "Refund transfer submitted — awaiting confirmation"
    );
  };

  // "Mark as already refunded" (external, AC5) — the client refunded outside Statrys and records the
  // evidence. Invoice stays Pending Refund until the accountant confirms and posts the GL entry.
  const markAlreadyRefunded = (proof: RefundProof) =>
    submitRefund(proof, "Refund submitted — awaiting accountant confirmation");

  // Apply a newly created REFUND credit note (DES-720). Creating it always moves a Paid invoice to
  // Pending Refund; the actual money-out (and the move to Refunded) happens in the refund-method step.
  const applyRefundCreditNote = (p: CreditNotePayload) => {
    // Resuming a draft refund CN converts it in place (draft → applied); a fresh form appends a new note.
    const idx = resumeDraftIndex != null ? resumeDraftIndex : creditNotes.length;
    setCreditNotes((prev) =>
      resumeDraftIndex != null
        ? prev.map((c, i) => (i === resumeDraftIndex ? { ...cnFromPayload(c.no, p), draft: false, sent: c.sent } : c))
        : [...prev, cnFromPayload(nextCreditNoteNo, p)]
    );
    setRefundFormOpen(false);
    setResumeDraftIndex(null);
    setStatus("PendingRefund");
    setViewingCnIndex(idx); // land on the refund CN detail (now Applied) — payout is a separate step
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
  // A Draft can always be edited — it hasn't been issued yet, so there's no accounting-period
  // date to protect. The locked-period block only applies once the invoice is actually issued.
  const openEdit = () => { setActionsOpen(false); if (lockedPeriod && issued) { setLockedAction("edit"); return; } onEdit?.(editSeed); };
  // Locked-period demo: "Send invoice" opens the blocking dialog instead of the send sheet.
  const openSend = () => { if (lockedPeriod) { setLockedAction("send"); return; } handleSendInvoiceClick(); };
  // Record Payment is allowed even in a locked period — recording a payment doesn't change the invoice's
  // accounting date, so it's not blocked (unlike Send / Edit / credit note / refund).
  const openMarkPaid = () => { setRecordAmount(String(remaining)); setRecordPayOpen(true); };

  // Required-field gate for issuing/sending a draft (DES-715 AC2 / DES-716 AC3).
  const requiredComplete = !!customerName && ITEMS.length > 0 && !!dueDateLabel;
  const duplicate = () => { setActionsOpen(false); setLocalToast("Invoice duplicated"); };

  // Mirrors the sticky primary-dock ternary below (Toast needs its type before that JSX renders) —
  // keep in sync: "double" clears with bottomOffset 150, "single" with the Toast default (96), no
  // dock at all (Cancelled / Paid with no CN) with 16, matching this app's Toast convention.
  const stickyDockKind: "single" | "double" | "none" =
    status === "Cancelled"
      ? "none"
      : status === "Draft"
        ? uploaded
          ? (pendingPayment ? "single" : "double")
          : "single"
        : sendable
          ? (pendingPayment ? "single" : "double")
          : isRefundContext
            ? ((refundDone || refundSubmitted) ? "single" : "double")
            : (status === "Paid" && activeCnCount === 0)
              ? "none"
              : "single";
  const toastBottomOffset = stickyDockKind === "double" ? 150 : stickyDockKind === "none" ? 16 : undefined;

  return (
    <div className="relative rounded-[48px] overflow-hidden shadow-2xl flex flex-col" style={{ width: 375, height: 812, background: "var(--bg-beige-primary)" }}>
      {/* No background here (was bg-white) — PageAppHeader is transparent at rest, so it needs
          the beige of the OUTER frame to show through behind it (Figma), not opaque white.
          The white "body" further down comes from its own wrapper below instead. Kept
          beige-primary (not neutral-tertiary) so it reads seamlessly with the header-tint
          gradient below, which fades FROM beige — a flat gray base fights that fade
          (reverted 2026-08-04, see CLAUDE.md gradient exception). */}
      <div
        className="flex-1 overflow-y-auto thin-scrollbar"
        onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
      >
      <PageAppHeader scrolled={scrolled}>
      <PageHeader
        type="center"
        title={pageHeaderTitle}
        onBack={onBack}
        backIcon={backChevron ? undefined : <X size={20} strokeWidth={1} />}
        backLabel={backChevron ? "Back" : "Close"}
        showSearch={showMenu || paidActionsInMenu}
        rightIcon={<MoreVertical size={20} strokeWidth={2} />}
        rightLabel="More actions"
        onRightClick={() => setActionsOpen(true)}
      />
      </PageAppHeader>

      {/* Status + amount — full-bleed beige→white gradient hero (Figma "Invoice Detail",
          node 1423:63521), edge to edge rather than inset like the cards below it. */}
      <div
        className="p-4 flex flex-col gap-2"
        style={{ backgroundImage: "linear-gradient(180deg, var(--bg-beige-primary) 1%, var(--bg-neutral-primary) 99%)" }}
      >
        <span className="flex items-center gap-1.5 flex-wrap">
          {/* The "Paid" status badge is suppressed in refund context — the refund tag takes over as
              the primary badge instead. Figma shows this as plain colored text, not a pill. */}
          {!effectiveRefundTag && (
            <span className="caption-medium" style={{ ...FONT, color: meta.text }}>{meta.label}</span>
          )}
          {/* Derived refund tag — invoice stays Paid; the refund lives on the credit note (763 model). */}
          {effectiveRefundTag && (
            <span
              className="caption-medium"
              style={{ ...FONT, color: effectiveRefundTag === "Refunded" ? "#4338ca" : "var(--text-warning-primary)" }}
            >
              {effectiveRefundTag === "Refund pending" ? "Pending Refund" : effectiveRefundTag}
            </span>
          )}
          {/* Single status sub-line for EVERY status, incl. refund context ("$X due" / "Due <date>" /
              "since <date>" / "$X to refund"), inline beside the badge (Figma "Due in 3 days"). Only
              the badge itself carries the status color — this text is always text-primary, never a
              second colored element repeating the badge's color. Hidden only while a payment is
              pending reconciliation, which has its own dedicated line below instead. A "·" separates
              it from the badge — badge + sub-line are two separate fragments, not one sentence, so
              they need the same visual break every other "status · date" line in the app uses —
              except plain Overdue (bannerIsContinuation), which reads as one sentence with the badge
              word so the "·" is dropped there instead of splitting it mid-sentence. */}
          {!pendingPayment && headlineBanner && (
            <>
              {!bannerIsContinuation && (
                <span className="caption-medium" style={{ ...FONT, color: INK }} aria-hidden="true">·</span>
              )}
              <span className="caption-medium" style={{ ...FONT, color: INK }}>
                {headlineBanner}
              </span>
            </>
          )}
        </span>
        {/* Headline: refund context → amount to refund; otherwise amount due / total. Currency code
            and the amount itself carry different weights/sizes per Figma. */}
        <p className="leading-none" style={{ ...FONT, color: INK }}>
          <span className="text-[18px] font-bold tracking-[-0.9px]">{currency}</span>
          <span className="text-[18px]"> </span>
          {/* Figma's dev-mode code export reported this run at 64px, but the text layer's own
              stored layout box is only 36px tall (get_metadata: node 0:180, height 36) — 64px
              can't physically fit at any reasonable line-height, so that figure was a code-gen
              artifact, not the real design. 40px × leading-0.9 = 36px, matching the actual box.
              fontWeight set explicitly (not Tailwind's font-black, which is 900) — the app only
              ships an 800 "Black" cut (--fw-black); at 900 the browser synthesizes a heavier,
              wider fake-bold on top of it instead of rendering the real face. */}
          <span className="text-[40px] leading-[0.9] tracking-[-2px]" style={{ fontWeight: "var(--fw-black)" }}>
            {headlineAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </p>
        {/* The document's own reference (an uploaded draft's UL-number, or the real invoice number
            once issued) — the page header itself always just reads "Invoice Details" (see
            pageHeaderTitle above). A created draft has no number yet, so nothing shows. */}
        {heroReference && (
          <p className="body-sm" style={{ ...FONT, color: INK }}>{heroReference}</p>
        )}
        {/* A payment has been recorded and is waiting on the accountant to reconcile it — the invoice
            stays Awaiting Payment until then. Shows the amount the user recorded as "Marked as paid". */}
        {pendingPayment && (
          <p className="text-[13px] font-medium leading-[1.3]" style={{ ...FONT, color: "var(--text-warning-primary)" }}>
            Pending Reconciliation of {money(pendingPayment.amount, currency)}
          </p>
        )}
      </div>

      <div className="px-4 pt-2 pb-44 flex flex-col gap-6 bg-white">
        {/* Locked-period notice (DES-751) — neutral, non-blocking; Record Payment still works. A
            Draft is never actually restricted by this (it can always be edited, and credit notes
            only ever apply to an issued invoice), so the notice only shows once issued. */}
        {lockedPeriod && issued && (
          <LockedPeriodBanner
            showContact={false}
            title="Accounting period closed"
            body={
              refundCtx
                ? "You can’t refund this invoice because its invoice date falls within a locked accounting period."
                : "You can’t edit this invoice or create a credit note because its invoice date falls within a locked accounting period."
            }
          />
        )}

        {/* Credits Applied — sits above the customer/details for any invoice with a credit note (DES-763).
            Gated off for prod (SHOW_CREDIT_NOTES). */}
        {SHOW_CREDIT_NOTES && creditNotes.length > 0 && (
          <CreditsAppliedSection
            creditNotes={creditNotes}
            currency={currency}
            isRefundContext={isRefundContext}
            refundSettled={refundedOut > 0.001}
            outstanding={outstanding}
            expanded={cnExpanded}
            onExpand={() => setCnExpanded(true)}
            // Tapping any credit note (Draft or Applied) opens its detail page — never the editor.
            onViewCn={setViewingCnIndex}
            onPreviewProof={setProofPreview}
          />
        )}

        {/* Customer — DS Tile (Figma "Invoice Detail", node 1423:63521), matching every other Bill To
            display in the app. */}
        <div className="flex flex-col gap-2">
          <p className="body-sm-medium" style={{ ...FONT, color: INK }}>Bill To</p>
          <Tile avatar={initials(customerName)} title={customerName} text={customerEmail} />
        </div>

        {/* Receiving account (DES-817) — DS Tile with the account's own country flag (Figma), same
            pattern as every other receiving-account display in the app. Wording follows the money:
            it's the "Receiving Account" while the invoice is still collecting payment, and the
            "Payment Account" once a refund is attached (paid invoice, money going back out). */}
        <div className="flex flex-col gap-2">
          <p className="body-sm-medium" style={{ ...FONT, color: INK }}>{isRefundContext ? "Payment Account" : "Receiving Account"}</p>
          <Tile
            flag={<CountryFlag name={receivingAcct.country} size={30} />}
            title={receivingAcct.name}
            text={receivingAcct.number}
            badgeLabel={receivingAcct.primary ? "Primary" : undefined}
          />
        </div>

        {/* Details — DS ListCard/ListRow (Figma), leads with Currency. */}
        <div className="flex flex-col gap-2">
          <p className="body-sm-medium" style={{ ...FONT, color: INK }}>Invoice Details</p>
          <ListCard>
            <ListRow label="Currency" value={currency} valueFlag={<CountryFlag name={CURRENCY_COUNTRY[currency]} size={16} />} />
            <ListRow label="Issue Date" value={issueDateLabel} />
            <ListRow label="Due Date" value="Next 30 days" valueDescription={dueDateLabel} last />
          </ListCard>
        </div>

        {/* An empty draft (saved with 0 items) has nothing to list or total — hide both cards rather
            than show a 3-line demo Items list or an all-zero Summary that doesn't reflect it. */}
        {!isEmptyDraft && (
          <>
        {/* Line items — items only; totals live in their own Summary card below. DS ListCard/ListRow
            (Figma), same shape as every other line-item list in the app. */}
        <div className="flex flex-col gap-2">
          <p className="body-sm-medium" style={{ ...FONT, color: INK }}>{`Items ( ${ITEMS.length} )`}</p>
          <ListCard>
            {ITEMS.map((it, i) => (
              <ListRow
                key={it.name}
                label={it.name}
                description={`${it.qty} ${it.unit} · ${money(it.unitPrice, currency)}`}
                value={money(it.amount, currency)}
                last={i === ITEMS.length - 1}
              />
            ))}
          </ListCard>
        </div>

        {/* Summary — Subtotal, Discount (only if any), Total. Total is always the final amount due;
            credit notes (DES-719) and partial payments add their own lines below it. Card surface
            matches Figma's Summary card (bg-neutral-secondary, 16px radius). */}
        <div className="flex flex-col gap-2">
          <p className="body-sm-medium" style={{ ...FONT, color: INK }}>Summary</p>
          <div className="rounded-2xl border px-4 py-1" style={{ background: "var(--bg-neutral-secondary)", borderColor: "rgba(208,208,208,0.4)" }}>
            <div className={`flex items-center justify-between py-2.5 ${DISCOUNT > 0 ? "" : "border-b"}`} style={DISCOUNT > 0 ? undefined : { borderColor: "rgba(208,208,208,0.4)" }}>
              <span className="body-sm" style={{ ...FONT, color: MUTED }}>Subtotal</span>
              <span className="body-sm" style={{ ...FONT, color: INK }}>{money(SUBTOTAL, currency)}</span>
            </div>
            {/* Discount row only shown when there's an actual discount; its bottom divider separates
                it from Total (Figma puts the divider here, not above Total) — Subtotal carries that
                divider instead when there's no Discount row. */}
            {DISCOUNT > 0 && (
              <div className="flex items-center justify-between py-2.5 border-b" style={{ borderColor: "rgba(208,208,208,0.4)" }}>
                <span className="body-sm" style={{ ...FONT, color: MUTED }}>Discount</span>
                {/* Brand-colored (decided 2026-08-02) — a discount isn't an error/refund, so it
                    doesn't share the red "subtracted amount" treatment. */}
                <span className="body-sm" style={{ ...FONT, color: "var(--text-brand)" }}>−{money(DISCOUNT, currency)}</span>
              </div>
            )}
            {/* When credit is APPLIED, Total is just a reference and Amount due is the prominent figure.
                An UNapplied (Open) credit note isn't shown here — it's surfaced in the Credits Applied card
                above, and doesn't touch the invoice amount until applied. Figma's dedicated Summary
                component (node 1927:12169): every row is body-sm (14px) — Total only switches WEIGHT
                (regular → bold), never size. */}
            <div className={`flex items-center justify-between ${credited > 0 ? "py-2.5" : "py-3"}`}>
              <span className={credited > 0 ? "body-sm font-medium" : "body-sm-bold"} style={{ ...FONT, color: credited > 0 ? MUTED : INK }}>Total</span>
              <span className={credited > 0 ? "body-sm font-medium" : "body-sm-bold"} style={{ ...FONT, color: INK }}>{money(TOTAL, currency)}</span>
            </div>
            {credited > 0 && (
              <>
                <div className="flex items-center justify-between py-2.5">
                  <span className="body-sm" style={{ ...FONT, color: MUTED }}>{isRefundContext ? "Refunded" : "Credit notes applied"}</span>
                  <span className="body-sm font-medium" style={{ ...FONT, color: "var(--text-error-primary)" }}>−{money(credited, currency)}</span>
                </div>
                <div className="flex items-center justify-between pb-3 pt-3 border-t" style={{ borderColor: "rgba(160,160,160,0.25)" }}>
                  <span className="body-sm-bold" style={{ ...FONT, color: INK }}>{isRefundContext ? "Net Paid" : "Amount due"}</span>
                  <span className="body-sm-bold" style={{ ...FONT, color: INK }}>{money(outstanding, currency)}</span>
                </div>
              </>
            )}
          </div>
        </div>
          </>
        )}

      </div>
      </div>

      {/* Primary action — per status. Void has no dock action (terminal, credit note lives on its
          own detail page). */}
      {status === "Cancelled" ? null : status === "Draft" ? (
        uploaded ? (
          // Uploaded draft: it was already sent elsewhere, so the likely next step is recording
          // payment → "Record Payment" primary, "Mark as sent" (→ Awaiting) secondary. Once a payment
          // is logged (awaiting approval) the Record Payment CTA drops, leaving just "Mark as sent".
          pendingPayment ? (
            <ButtonDock type="single" sticky primaryLabel="Mark as sent" onPrimary={onIssued} />
          ) : (
            <ButtonDock
              type="double"
              sticky
              secondaryLabel="Mark as sent"
              primaryLabel="Record Payment"
              onSecondary={onIssued}
              onPrimary={openMarkPaid}
            />
          )
        ) : (
          // Created draft: "Record Payment" is only offered on UPLOADED drafts (already settled outside
          // Statrys). A created draft is issued through Statrys, so it leads with "Send invoice" only.
          // An empty draft (0 items) has nothing to send — the CTA leads to Edit instead.
          isEmptyDraft ? (
            <ButtonDock type="single" sticky primaryLabel="Edit invoice" onPrimary={openEdit} />
          ) : (
            <ButtonDock type="single" sticky primaryLabel="Send invoice" primaryDisabled={!requiredComplete} primaryLoading={sendPending} onPrimary={openSend} />
          )
        )
      ) : sendable ? (
        // Once a payment is logged (awaiting approval) the "Record Payment" CTA drops, leaving just "Resend invoice".
        pendingPayment ? (
          <ButtonDock type="single" sticky primaryLabel="Resend invoice" primaryLoading={sendPending} onPrimary={openSend} />
        ) : (
          <ButtonDock
            type="double"
            sticky
            // On the INVOICE detail the secondary always sends the INVOICE (credit notes are sent from their
            // own detail page). Already Awaiting/Overdue/Partially Paid means it was sent once already, so
            // this is a resend, not a first send (Figma 696:4595 label updated to "Resend invoice").
            secondaryLabel="Resend invoice"
            primaryLabel="Record Payment"
            secondaryLoading={sendPending}
            onSecondary={openSend}
            onPrimary={openMarkPaid}
          />
        )
      ) : isRefundContext ? (
        // Refund credit note (DES-720). Sending the credit-note document and moving the money are
        // INDEPENDENT actions off a created refund CN (AC6): the client may send the note any time —
        // before or after the actual refund. So while the refund is still pending we show BOTH —
        // primary "Refund Credit Note" (the money-out) + secondary "Send/Resend Credit Note" (the
        // document). Once the refund is done the money-out action is gone, leaving only send/resend.
        (refundDone || refundSubmitted) ? (
          <ButtonDock
            type="single"
            sticky
            primaryLabel={anyUnsent ? "Send Credit Note" : "Resend Credit Note"}
            onPrimary={openSendCreditNote}
          />
        ) : (
          // Refund pending (Figma 696:5495): Resend Invoice (secondary — it's already been sent to
          // reach this refund state) + Refund Credit Note (primary, money-out — the DES-720 AC3 label).
          // The refund CN is sent from its own detail page.
          <ButtonDock
            type="double"
            sticky
            secondaryLabel="Resend invoice"
            primaryLabel="Refund Credit Note"
            secondaryLoading={sendPending}
            onSecondary={openSend}
            onPrimary={() => setRefundFlowOpen(true)}
          />
        )
      ) : status === "Paid" && activeCnCount === 0 ? (
        // Paid (DES-817): Refund + Preview as PDF live in the ⋯ menu (no dock).
        null
      ) : (
        <ButtonDock type="single" sticky primaryLabel="Preview as PDF" onPrimary={() => { setPdfFromSend(false); setPdfPreviewOpen(true); }} />
      )}

      {/* Secondary actions sheet */}
      <ActionsMenu
        open={actionsOpen}
        onClose={() => setActionsOpen(false)}
        status={status}
        uploaded={uploaded}
        terminal={terminal}
        cancellable={cancellable}
        creditNotesCount={activeCnCount}
        onRefundWithCn={() => { setActionsOpen(false); if (lockedPeriod) { setLockedAction("refund"); return; } setRefundFormOpen(true); }}
        onPreviewPdf={() => { setActionsOpen(false); setPdfFromSend(false); setPdfPreviewOpen(true); }}
        onSendInvoice={() => { setActionsOpen(false); setSendSheetOpen(true); }}
        onEdit={openEdit}
        onDuplicate={duplicate}
        onCreateCn={() => { setActionsOpen(false); if (lockedPeriod) { setLockedAction("createCn"); return; } setResumeDraftIndex(null); setCreditFormOpen(true); }}
        onDeleteDraft={() => { setActionsOpen(false); setConfirmDelete(true); }}
        // A logged-but-unapproved payment (Pending Reconciliation) locks editing — same reasoning
        // as the dock, which already drops its own "Record Payment"/"Send" pairing down to a
        // single resend CTA once pendingPayment is set (no edit option surfaces there either).
        hideEdit={isEmptyDraft || !!pendingPayment}
      />

      {/* Delete confirm (Draft only). Both actions are destructive-styled (see memory:
          destructive-color-by-reversibility): Delete Draft leads as the filled primary, in red;
          Keep Draft is the destructive secondary, which renders as a plain neutral outline (see
          ui/Button's `destructive` prop — the strong red is reserved for the primary). */}
      <BottomSheet
        open={confirmDelete}
        title="Delete this draft?"
        onClose={() => setConfirmDelete(false)}
        compact
        footer={
          <ButtonDock
            type="double"
            primaryLabel="Delete Draft"
            primaryDestructive
            secondaryLabel="Keep Draft"
            secondaryDestructive
            onPrimary={() => { setConfirmDelete(false); onDeleted?.(); }}
            onSecondary={() => setConfirmDelete(false)}
          />
        }
      >
        <p className="body-sm" style={{ ...FONT, color: MUTED }}>
          Are you sure you want to delete this draft invoice? This action cannot be undone.
        </p>
      </BottomSheet>

      {/* Locked-period demo (DES-751): Send / Edit / Add-credit-note blocked because the invoice is
          in a closed accounting period. Copy is specific to the action the operator attempted. */}
      <LockedPeriodDialog
        open={lockedAction !== null}
        title={
          lockedAction === "send"
            ? "Unable to send invoice"
            : lockedAction === "createCn"
            ? "Credit note can’t be added"
            : lockedAction === "refund"
            ? "Refund can’t be added"
            : "Editing isn’t available"
        }
        body={
          lockedAction === "send"
            ? "This invoice can’t be sent because it belongs to a closed accounting period (31 Dec 2026)."
            : lockedAction === "createCn"
            ? "A credit note can’t be added because this invoice’s date (31 Dec 2026) falls in a closed accounting period. Contact your accountant for assistance."
            : lockedAction === "refund"
            ? "A refund credit note can’t be added because this invoice’s date (31 Dec 2026) falls in a closed accounting period. Contact your accountant for assistance."
            : "This invoice can’t be edited because its date (31 Dec 2026) falls in a closed accounting period. Contact your accountant for assistance."
        }
        onClose={() => setLockedAction(null)}
      />

      {/* Create Credit Note (DES-719) — opens on the invoice's CURRENT corrected state, so a second
          note shows lines already credited by earlier notes (Brand = 3,000 after CN-001). */}
      {creditFormOpen && (() => {
        // Resuming a Draft (DES-719) seeds the form from the saved note; a fresh form seeds from the invoice.
        const draft = resumeDraftIndex != null ? creditNotes[resumeDraftIndex] : null;
        const seed = draft
          ? { name: draft.name, email: draft.email, reason: draft.reason ?? "", reasonNote: draft.reasonNote ?? "", issueDate: draft.issueDate ?? new Date(2026, 5, 26), lines: draft.draftLines ?? [], accountId: draft.accountId }
          : undefined;
        return (
          <CreditNoteForm
            creditNoteNo={draft ? draft.no : nextCreditNoteNo}
            invoiceNo={invoiceNo}
            customerName={customerName}
            customerEmail={customerEmail}
            currency={currency}
            items={correctedItems}
            invoiceTotal={remaining}
            alreadyCredited={credited}
            outstanding={creditRoom}
            initial={seed}
            onSaveDraft={saveDraft}
            onBack={() => { setCreditFormOpen(false); setResumeDraftIndex(null); }}
            onCreate={createCreditNote}
          />
        );
      })()}

      {/* Refund with Credit Note (DES-720) — from a Paid invoice; refund-mode labels, cap = amount paid.
          Creating it moves the invoice to Pending Refund. */}
      {refundFormOpen && (() => {
        // Resuming a Draft refund CN seeds the form from the saved note; a fresh form seeds from the invoice.
        const draft = resumeDraftIndex != null ? creditNotes[resumeDraftIndex] : null;
        const seed = draft
          ? { name: draft.name, email: draft.email, reason: draft.reason ?? "", reasonNote: draft.reasonNote ?? "", issueDate: draft.issueDate ?? new Date(2026, 5, 26), lines: draft.draftLines ?? [], accountId: draft.accountId }
          : undefined;
        return (
          <CreditNoteForm
            refund
            creditNoteNo={draft ? draft.no : nextCreditNoteNo}
            invoiceNo={invoiceNo}
            customerName={customerName}
            customerEmail={customerEmail}
            currency={currency}
            items={correctedItems}
            invoiceTotal={outstanding}
            alreadyCredited={credited}
            outstanding={outstanding}
            initial={seed}
            onSaveDraft={saveRefundDraft}
            onBack={() => { setRefundFormOpen(false); setResumeDraftIndex(null); }}
            onCreate={applyRefundCreditNote}
          />
        );
      })()}

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
        // The note's own status. Refund CN → Pending Refund until its payout settles, then Refunded once
        // paid out (there is no "Partially Refunded" state). Cancellation CN (DES-719, single-invoice) →
        // simply "Applied" (applied on create; no Open/Partially/Fully split).
        const through = creditNotes.slice(0, viewingCnIndex + 1).reduce((s, c) => s + c.amount, 0);
        const cnStatus = cn.draft
          ? "Draft"
          : cn.cancelled
          ? "Cancelled"
          : isRefundContext
          ? (cn.refundProof?.awaiting ? "Awaiting refund"
             : through > refundedOut + 0.001 ? "Applied" : "Refunded")
          : "Applied";
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
              dueDateLabel={cn.dueDateLabel}
              lines={cn.lines}
              total={cn.amount}
              invoiceTotal={TOTAL}
              reason={cn.reason}
              reasonNote={cn.reasonNote}
              refundProof={cn.refundProof}
              sent={cn.sent}
              updatedDateLabel={cn.updatedDate}
              // Locked-period demo: the CN detail's Back arrow is inert (closed period — no exit).
              onBack={lockedPeriod ? () => {} : () => setViewingCnIndex(null)}
              // AC3: the linked invoice is this very detail page → returning to it IS opening the invoice.
              onViewInvoice={() => setViewingCnIndex(null)}
              // AC4: sending happens inside the detail page's own send flow; persist the sent state here.
              onSent={() => setCreditNotes((prev) => prev.map((c, i) => (i === viewingCnIndex ? { ...c, sent: true, sentDate: SENT_TODAY } : c)))}
              // DES-719 (cancellation CNs): a DRAFT can be Applied to the invoice, Edited (resume the
              // form), or Deleted; an Applied note is view/send only. DES-720 refund CNs are NOT editable
              // after creation (AC2) — only Cancel (while Pending Refund) + Send. In the locked-period
              // demo, Apply/Edit surface the closed-period dialog instead of acting.
              onApply={cn.draft ? () => { if (lockedPeriod) { setLockedCnAction("apply"); return; } applyDraft(viewingCnIndex); } : undefined}
              onEdit={
                cn.draft
                  ? () => { if (lockedPeriod) { setLockedCnAction("edit"); return; } const i = viewingCnIndex; setViewingCnIndex(null); resumeDraft(i); }
                  : undefined
              }
              onCancel={
                cn.cancelled
                  ? undefined
                  : cn.draft
                  ? () => deleteDraft(viewingCnIndex)
                  : cnStatus === "Applied"
                  ? () => voidCreditNote(viewingCnIndex)
                  : (isRefundContext && cnStatus === "Pending Refund")
                  ? () => voidCreditNote(viewingCnIndex)
                  : undefined
              }
              receivingAccount={(() => { const a = getAccount(cn.accountId ?? "") ?? receivingAcct; return { name: a.name, number: a.number, primary: !!a.primary }; })()}
              lockedPeriod={lockedPeriod}
            />
            {/* Locked-period demo: Apply/Edit on a Draft CN dated in a closed period — inside the overlay
                so the dialog layers above the CN detail. */}
            <LockedPeriodDialog
              open={lockedCnAction !== null}
              title={lockedCnAction === "apply" ? "Credit note can’t be applied" : "Editing isn’t available"}
              body={
                lockedCnAction === "apply"
                  ? "This credit note can’t be applied because its date (31 Dec 2026) falls in a closed accounting period. Contact your accountant for assistance."
                  : "This credit note can’t be edited because its date (31 Dec 2026) falls in a closed accounting period. Contact your accountant for assistance."
              }
              onClose={() => setLockedCnAction(null)}
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
            initial={{ name: cn.name, email: cn.email, reason: cn.reason ?? "", reasonNote: cn.reasonNote ?? "", issueDate: cn.issueDate ?? new Date(2026, 5, 26), lines: seedLines, accountId: cn.accountId }}
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
        currency={currency}
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
        total={remaining}
        currency={currency}
        accountId={recordAccountId}
        onAccountChange={setRecordAccountId}
        date={recordDate}
        onDateChange={setRecordDate}
        onSubmit={() => {
          const amt = Math.max(0, Number(recordAmount) || 0);
          setRecordPayOpen(false);
          // New flow: logging a payment does NOT change the status. It records the amount + method and
          // the invoice stays Awaiting Payment until the accountant approves it (→ Paid / Partially Paid).
          if (amt > 0) {
            setPendingPayment({ amount: amt, accountId: recordAccountId, date: recordDate });
            setLocalToast("Payment logged · awaiting approval");
          }
        }}
      />

      {/* Optional send (reused sub-flows) */}
      <SendInvoiceSheet
        open={sendSheetOpen}
        customerName={sendName}
        customerEmail={sendEmail}
        companyEmail={companyEmail}
        invoiceNo={sendNo}
        amountLabel={`${currency} ${sendTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        dueDateLabel={dueDateLabel}
        docType={sendContext === "creditNote" ? "creditNote" : "invoice"}
        link={`https://pay.statrys.com/i/${sendNo.toLowerCase()}`}
        onClose={() => { setSendSheetOpen(false); setSendContext("invoice"); }}
        onSend={completeSend}
        onSent={completeSend}
        onDownload={() => {
          setPdfFromSend(true);
          setPdfPreviewOpen(true);
          setLocalToast(sendContext === "creditNote" ? "Credit note downloaded" : "Invoice downloaded");
        }}
        onQuickDownload={() => setLocalToast(sendContext === "creditNote" ? "Credit note downloaded" : "Invoice downloaded")}
        docPreview={
          sendContext === "creditNote" && selectedSendCn ? (
            <CreditNoteDocumentPreview
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
              className="p-0"
            />
          ) : (
            <InvoiceDocumentPreview
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
              className="p-0"
            />
          )
        }
      />

      {/* PDF preview — shown instantly over the (still-mounted) Send Invoice page; no transition.
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
              hideDownload={pdfFromSend}
              onBack={() => setPdfPreviewOpen(false)}
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
              hideDownload={pdfFromSend}
              onBack={() => setPdfPreviewOpen(false)}
              onDownloaded={() => {
                // Only reachable when NOT from the Send sheet's own Download row (hideDownload hides
                // the button there — that download is already "just to show", no side effect). From a
                // sendable invoice, download counts as a send channel; for terminal/read-only invoices
                // it's just a re-download.
                setPdfPreviewOpen(false);
                if (sendable) completeSend();
                else setLocalToast("Invoice downloaded");
              }}
            />
          )}
        </div>
      )}

      {/* Local toast for in-page outcomes (void / re-download) */}
      <Toast open={!!localToast} message={localToast ?? ""} bottomOffset={toastBottomOffset} onDone={() => setLocalToast(null)} />
    </div>
  );
}

export default InvoiceDetailPage;
