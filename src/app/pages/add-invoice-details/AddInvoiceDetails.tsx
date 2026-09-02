import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "motion/react";
import { Plus, RefreshCw, FileText } from "lucide-react";
import { Button } from "../../ui/Button";
import CheckIcon from "@mui/icons-material/Check";
import { PageAppHeader } from "../../components/PageAppHeader";
import { PageHeader } from "../../ui/PageHeader";
import { Loading } from "../../ui/Loading";
import { Tile } from "../../ui/Tile";
import { ListCard } from "../../ui/ListCard";
import { ListRow } from "../../ui/ListRow";
import { ButtonDock } from "../../components/ButtonDock";
import { SummaryDock } from "../../components/SummaryDock";
import { TextField } from "../../ui/TextField";
import { Badge } from "../../ui/Badge";
import { ServiceItemCard } from "../../components/ServiceItemCard";
import { DiscountCard, type DiscountMode } from "../../components/DiscountCard";
import { DiscountModeSheet } from "../../components/DiscountModeSheet";
import { SummaryCard } from "../../components/SummaryCard";
import { SendInvoiceSheet } from "../../components/SendInvoiceSheet";
import { InvoicePreviewPage, InvoiceDocumentPreview } from "../shared/InvoicePreviewPage";
import { Toast } from "../../components/Toast";
import { CustomerSheet } from "../../components/CustomerSheet";
import { CURRENCIES, CURRENCY_COUNTRY, CurrencySheet } from "../../components/CurrencySheet";
import { CountryFlag } from "../../components/CountryFlag";
import { DueDateSheet } from "../../components/DueDateSheet";
import { IssueDateSheet } from "../../components/IssueDateSheet";
import { BottomSheet } from "../../components/BottomSheet";
import { ReceivingAccountSheet } from "../../components/ReceivingAccountSheet";
import { AddServicesSheet } from "../../components/AddServicesSheet";
import { CUSTOMERS } from "../../data/customers";
import { EXISTING_INVOICES } from "../../data/extraction";
import { formatAccount, getAccount } from "../../data/receivingAccounts";
import { EMAIL_RE } from "../../lib/format";
import { scrollFieldIntoView } from "../../lib/scrollFieldIntoView";
import { focusFirstInvalidField } from "../../lib/focusFirstInvalidField";
import type { Customer, ExistingInvoice, ExtractedInvoice, ServiceLine } from "../../types";
import { CoverageBanner, DuplicateBanner, ExtractionFailedBanner } from "./Banners";
import { ExistingInvoiceSheet } from "./ExistingInvoiceSheet";
import { dueLabels, extractionCoverage, toPreviewItems } from "./derive";

interface AddInvoiceDetailsProps {
  customer?: Customer | null;
  /** The shared client register (owned by App) — feeds the change-customer picker. */
  customers?: Customer[];
  /** Pre-filled data read from an uploaded invoice; flagged fields become editable inputs. */
  extracted?: ExtractedInvoice | null;
  onClose?: () => void;
  onChangeCustomer?: () => void;
  onAddServices?: () => void;
  /** Manual flow secondary — "Send Later" returns to the list. */
  onSendLater?: () => void;
  /** Save as draft (also fired by the close ✕) — returns to the list with a draft toast.
   *  Passes a summary so the list can show + highlight the freshly-saved draft card. */
  onSaveDraft?: (draft?: { client: string; amount: string; meta: string; itemsCount: number }) => void;
  /** Primary action — sends (manual) or creates (upload); returns to the list with a toast.
   *  An optional toast (title + subtext) overrides the default copy (per send method).
   *  `recent` lets the list surface + highlight the just-created card. */
  onSend?: (
    toast?: { title: string; subtext?: string },
    recent?: { client: string; amount: string; status: "Awaiting" | "Draft" | "Paid"; meta: string }
  ) => void;
  /** Dev preview — open the Delivery method sheet on mount. */
  autoOpenSend?: boolean;
  /** Dev preview (QuickNav "Send Invoice — Failed") — force the Send Invoice sheet's send
   *  action to always fail, for reviewing the delivery-failure banner/retry state. */
  forceSendError?: boolean;
  /** Dev preview — seed the invoice with demo line items. */
  seedServices?: ServiceLine[];
  /** Dev preview (PageControls "Error (no items)"): show the Items validation error on mount —
   *  same state a real "Create Invoice" tap with 0 items sets, just seeded upfront instead of
   *  requiring the tap. */
  initialItemsError?: boolean;
  /** Prefill the manual form when editing an existing invoice (from the detail page). */
  initial?: {
    customer?: Customer | null;
    invoiceNo?: string;
    currency?: string;
    services?: ServiceLine[];
    /** True when editing an ISSUED invoice (Awaiting/Overdue) vs a Draft. Informational only now —
     *  per the updated story every field is editable except the invoice number + client identity
     *  (the client tile is locked for any edit); it no longer restricts issue date/currency/etc. */
    limited?: boolean;
  } | null;
  /** Edit mode (Qonto-style): back arrow → return to the invoice detail page without saving. */
  onEditBack?: () => void;
  /** Edit mode: "Save" → persist and return to the invoice detail page. */
  onEditSave?: () => void;
  /** Upload mode: OCR read nothing — show a "couldn't read" banner and require manual fill. */
  extractionFailed?: boolean;
  /** Upload mode: re-pick a clearer file (banner link). */
  onReupload?: () => void;
  /** Upload mode, exact-duplicate (Case 1): open the matched existing invoice's detail page. */
  onOpenExisting?: (inv: ExistingInvoice) => void;
  /** Upload mode: the file the user uploaded (shown as an attachment in the review). `pages` is
   *  set for a multi-page camera scan — all pages are one document, one attachment row. */
  uploadedFile?: { name: string; size: number; pages?: number } | null;
  /** Duplicate flow → "Create new": the invoice number was system-generated (show a "Recommended" hint). */
  numberRecommended?: boolean;
  /** Edit-existing-from-duplicate: show ✕ (not back) on the editor → save as draft and return to list. */
  editExitToList?: boolean;
  /** Account default currency (DES-764 Invoice Settings) — seeds a fresh invoice's currency. */
  defaultCurrency?: string;
  /** Sender company for the email brand bar (from Invoice Settings). */
  companyName?: string;
  /** Sender company email (from Invoice Settings) — the Cc when "Send me a copy" is on. */
  companyEmail?: string;
  /** Account default for the automated-chaser toggle (DES-764 AC5) — seeds the per-invoice toggle. */
  defaultChaser?: boolean;
  /** Default receiving account id (DES-764 Payment Method) — seeds the invoice's Receiving Account. */
  defaultAccountId?: string;
  /** Locked-period demo (DES-751): seed the Issue Date, open its calendar on mount, disable dates
   *  before `issueMinDate`, show `issueSheetHelper` inside the calendar sheet, and (if `lockIssueSheet`)
   *  prevent dismissing the sheet by tapping ✕/scrim (a valid date must be picked to proceed). */
  seedIssueDate?: Date;
  autoOpenIssueSheet?: boolean;
  issueMinDate?: Date;
  issueSheetHelper?: string;
  /** Short heading shown above the calendar as a Title + Subtitle pair (issueSheetHelper becomes
   *  the subtitle) — set alongside issueSheetHelper for the locked-period case. */
  issueSheetHelperTitle?: string;
  lockIssueSheet?: boolean;
  /** Override the header title (e.g. "Upload Invoice" for the locked-period upload demo). */
  headerTitle?: string;
  /** Banner rendered at the top of the form (e.g. the locked-period alert) — replaces the OCR
   *  coverage banner when set. */
  topBanner?: React.ReactNode;
  /** Show the Issue Date as an unset, muted placeholder (e.g. "Select issue date") until a date is
   *  picked — used when the OCR date fell in a closed period and must be re-chosen. */
  issuePlaceholder?: string;
  /** Locked-period demo: disable the header Back button and the primary CTA (Send/Create Invoice). */
  lockActions?: boolean;
  /** Locked-period demo: block every in-page interaction EXCEPT the Issue Date row (and the header Back,
   *  which is locked too). The CTA sits outside the guarded area — gate it separately via `lockActions`.
   *  Create Locked-Period locks the CTA; Upload Locked-Period leaves it live for re-issue. */
  lockExceptIssueDate?: boolean;
  /** Notifies the parent when the Issue Date calendar sheet opens/closes (drives the beside-frame
   *  annotation on the Create Locked-Period demo). */
  onIssueSheetToggle?: (open: boolean) => void;
}

import { FONT, MUTED, avatarTint, initials } from "../../lib/theme";

/** Section label (Figma "Create Invoice", node 1826-15916): body-sm medium, text-primary,
 *  sentence case — not the 12px bold-uppercase placeholder-grey style used elsewhere. */
function Section({
  title,
  titleRight,
  children,
}: {
  title: string;
  titleRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="body-sm-medium text-[var(--text-primary)]">{title}</p>
        {titleRight}
      </div>
      {children}
    </div>
  );
}

/**
 * Create Sales Invoice — step 2: "Add Invoice Details".
 * Reached after a customer is chosen on the customer-selection screen.
 */
export function AddInvoiceDetails({
  customer,
  customers,
  extracted,
  onClose,
  onChangeCustomer,
  onSendLater,
  onSaveDraft,
  onSend,
  autoOpenSend,
  forceSendError,
  seedServices,
  initialItemsError,
  initial,
  onEditBack,
  onEditSave,
  extractionFailed,
  onReupload,
  onOpenExisting,
  uploadedFile,
  numberRecommended,
  editExitToList,
  defaultCurrency = "USD",
  companyName = "Lumen Studio",
  companyEmail = "hello@lumenstudio.co",
  defaultChaser = true,
  defaultAccountId = "personal",
  seedIssueDate,
  autoOpenIssueSheet = false,
  issueMinDate,
  issueSheetHelper,
  issueSheetHelperTitle,
  lockIssueSheet = false,
  headerTitle,
  topBanner,
  issuePlaceholder,
  lockActions = false,
  lockExceptIssueDate = false,
  onIssueSheetToggle,
}: AddInvoiceDetailsProps) {
  // When `extracted` is present we came from an upload.
  const isExtracted = !!extracted;
  // `initial` means we opened the form to edit an existing invoice (from the detail page).
  const isEditing = !!initial;
  // NB: an issued-invoice edit (Awaiting/Overdue, `initial.limited`) no longer restricts the form —
  // updated story: every field is editable except the auto-generated invoice number (not on this form)
  // and the client identity (locked via the customer tile below, for any edit). So there's no separate
  // "locked edit" branch anymore; the form behaves like a create except the client tile is read-only.
  // The plain "Edit invoice" limited-edit flow (an issued invoice, opened from its detail page) —
  // excludes edit-from-duplicate (still a draft, autosaves like a fresh create). No autosave here:
  // an already-issued invoice shouldn't silently persist changes — the user explicitly Saves or
  // Cancels instead.
  const editingIssuedInvoice = isEditing && !editExitToList;

  // Step 5 (Qonto-style): try to match the OCR'd customer to an existing client.
  const autoMatch = useMemo(() => {
    if (!extracted) return null;
    const em = extracted.customerEmail.trim().toLowerCase();
    const nm = extracted.customerName.trim().toLowerCase();
    return CUSTOMERS.find((c) => (em && c.email.toLowerCase() === em) || c.name.toLowerCase() === nm) ?? null;
  }, [extracted]);

  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(customer ?? initial?.customer ?? autoMatch ?? null);
  // Pre-fill from OCR; fall back to the auto-matched client so matched uploads still show a name/email.
  const [editName, setEditName] = useState(extracted?.customerName || autoMatch?.name || "");
  const [editEmail, setEditEmail] = useState(extracted?.customerEmail || autoMatch?.email || "");
  // Uploaded invoices use a user-entered number (DES-716), not a system-generated one.
  const [editInvoiceNo, setEditInvoiceNo] = useState(extracted?.invoiceNumber ?? "");
  const [existingViewOpen, setExistingViewOpen] = useState(false);
  // Preview the original uploaded file (demo: a representative document, no real bytes).
  const [filePreviewOpen, setFilePreviewOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // Whether to also save the typed-in customer to the client list (default on).

  // The linked client (auto-matched or picked). When null on an upload, we're in
  // the "no match" state and the customer name/email are editable inline.
  const linked = currentCustomer;

  // Uploads: name/email always come from the editable (pre-filled) fields so edits take effect.
  const name = isExtracted ? editName : linked?.name ?? "Marlow & Finch Studio";
  const email = isExtracted ? editEmail : linked?.email ?? "apa@marlowfinch.co";

  // Customer name / email couldn't be read off the file — flag the empty field until supplied.
  const nameMissing = isExtracted && editName.trim() === "";
  const emailMissing = isExtracted && editEmail.trim() === "";
  const emailValid = EMAIL_RE.test(editEmail.trim());

  // Extraction coverage — drives the "N out of M extracted" review card (OCR-missing case only).
  const { fieldsTotal, fieldsExtracted, fieldsNeedAttention } = extractionCoverage(extracted, emailMissing);

  const [sendSheetOpen, setSendSheetOpen] = useState(false);
  // Brief loading state on the Send Invoice button itself (Figma node 4591-5847) before the
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
  // Local success toast (e.g. "Invoice downloaded") — separate from the parent's own toast/nav
  // since this page stays mounted underneath the Send sheet while it fires.
  const [localToast, setLocalToast] = useState<string | null>(null);
  const [customerSheetOpen, setCustomerSheetOpen] = useState(false);

  const [issueDate, setIssueDate] = useState<Date>(extracted?.issueDate ?? seedIssueDate ?? new Date(2026, 5, 15));
  const [issueSheetOpen, setIssueSheetOpen] = useState(autoOpenIssueSheet);
  // Let the parent (Create Locked-Period demo) swap its beside-frame annotation when the calendar opens.
  useEffect(() => { onIssueSheetToggle?.(issueSheetOpen); }, [issueSheetOpen, onIssueSheetToggle]);
  // Placeholder mode (locked-period upload demo): the Issue Date reads "Select issue date" until picked.
  const [issuePicked, setIssuePicked] = useState(!issuePlaceholder);
  // Create flow: the Issue Date defaults to today, shown with a "Today (…)" descriptor until the user
  // picks another date (mirrors the Due Date row's "Next 30 days (…)" pattern).
  const [issueChanged, setIssueChanged] = useState(false);
  const showIssueToday = !isExtracted && !isEditing && !seedIssueDate && !issuePlaceholder && !issueChanged;
  // Set when the user hits the CTA with the Issue Date still unset — flags the row + scrolls to it.
  const [issueError, setIssueError] = useState(false);
  const issueRowRef = useRef<HTMLDivElement>(null);
  const [dueDate, setDueDate] = useState(extracted?.dueDate || "Next 30 days");
  const [dueSheetOpen, setDueSheetOpen] = useState(false);
  // Currency seeds from the customer default (→ Settings default), or OCR/edit-seed for an
  // uploaded/edited invoice. The user MAY pick a different currency per invoice; that choice lives
  // only on this invoice and is never written back to the customer or Settings.
  const [currency, setCurrency] = useState(extracted?.currency || initial?.currency || defaultCurrency);
  const [currencySheetOpen, setCurrencySheetOpen] = useState(false);
  // DES-764 AC5: per-invoice automated-chaser toggle, seeded from the account default.
  const [chaser, setChaser] = useState(defaultChaser);
  const [accountId, setAccountId] = useState(defaultAccountId);
  const [accountSheetOpen, setAccountSheetOpen] = useState(false);

  const [servicesSheetOpen, setServicesSheetOpen] = useState(false);
  const [services, setServices] = useState<ServiceLine[]>(extracted?.services ?? initial?.services ?? seedServices ?? []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hintFirst, setHintFirst] = useState(false);
  const [discountOn, setDiscountOn] = useState(false);
  const [discount, setDiscount] = useState("");
  const [discountMode, setDiscountMode] = useState<DiscountMode>("percent");
  const [discountModeSheetOpen, setDiscountModeSheetOpen] = useState(false);

  // Snapshot of every field editable in a plain edit-invoice session, captured once on mount —
  // drives the dirty check for the "Unsaved changes?" confirm (editingIssuedInvoice only; the
  // autosave-on-exit duplicate-edit path doesn't use this).
  const editBaselineRef = useRef({
    currency,
    issueDateMs: issueDate.getTime(),
    dueDate,
    accountId,
    chaser,
    discountOn,
    discount,
    discountMode,
    servicesJson: JSON.stringify(services),
  });
  const dirty =
    editingIssuedInvoice &&
    (currency !== editBaselineRef.current.currency ||
      issueDate.getTime() !== editBaselineRef.current.issueDateMs ||
      dueDate !== editBaselineRef.current.dueDate ||
      accountId !== editBaselineRef.current.accountId ||
      chaser !== editBaselineRef.current.chaser ||
      discountOn !== editBaselineRef.current.discountOn ||
      discount !== editBaselineRef.current.discount ||
      discountMode !== editBaselineRef.current.discountMode ||
      JSON.stringify(services) !== editBaselineRef.current.servicesJson);

  const subtotal = services.reduce((sum, s) => sum + s.quantity * s.unitPrice, 0);
  const rawDiscount =
    discountMode === "percent"
      ? subtotal * ((Number(discount) || 0) / 100)
      : Number(discount) || 0;
  // Only counts when the Discounts toggle is on.
  const discountAmount = discountOn ? Math.min(Math.max(rawDiscount, 0), subtotal) : 0;
  const total = subtotal - discountAmount;

  // Uploaded → user-entered number; manual → system-generated (or the edited invoice's number).
  const invoiceNo = isExtracted ? editInvoiceNo : initial?.invoiceNo ?? "INV-2026-000042";
  // Duplicate check = INVOICE NUMBER ONLY (PO decision, overrides DES-716's "warn + override"):
  // an invoice number can never be re-used. Any entered number that already exists HARD-BLOCKS
  // "Create Invoice" — the only way forward is to open the existing invoice, or edit the number to
  // a free one. The customer is intentionally NOT part of the match.
  const existingInvoice = isExtracted
    ? EXISTING_INVOICES.find((i) => i.number.toLowerCase() === editInvoiceNo.trim().toLowerCase())
    : undefined;
  // A duplicate always opens the existing invoice's detail page.
  const existingPrimaryLabel = "Open existing invoice";
  const amountLabel = `${currency} ${total.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  // Summary for the freshly-saved draft card on the list (✕ → save as draft).
  const draftAmount = amountLabel;
  const clientLabel = name.trim() || "Untitled customer";
  // Due Date labels — the relative "Next N days" term resolved against the issue date.
  const { dueDateLabel, dueRowLabel, dueShort } = dueLabels(issueDate, dueDate);
  // Meta line for the recent list card — drafts show the created date, issued invoices the due date.
  const draftMeta = `${invoiceNo} · Created ${format(issueDate, "d MMM yyyy")}`;
  const sentMeta = `${invoiceNo} · Due ${dueShort}`;
  const saveDraft = () =>
    onSaveDraft?.({ client: clientLabel, amount: draftAmount, meta: draftMeta, itemsCount: services.length });
  // Tapping back on a fresh create (never on an in-progress edit) confirms the auto-save with a
  // sheet instead of silently dropping the user onto the list — "Go to invoice list" continues
  // the existing saveDraft flow, "Keep editing" just dismisses and stays on this page.
  const [savedDraftSheetOpen, setSavedDraftSheetOpen] = useState(false);
  // Tapping back on a dirty edit-invoice session confirms before discarding — the header back
  // chevron reuses this (it's the ambiguous action); the footer's own "Cancel" stays a direct,
  // unconfirmed discard since it's already an explicit, unambiguous choice sitting next to Save.
  const [discardEditOpen, setDiscardEditOpen] = useState(false);
  const requestEditBack = () => (dirty ? setDiscardEditOpen(true) : onEditBack?.());
  // Recent (sent/created) card the list highlights when this invoice is issued.
  const recentSent = { client: clientLabel, amount: draftAmount, status: "Awaiting" as const, meta: sentMeta };

  // Dev preview — open the Delivery method sheet on mount.
  useEffect(() => {
    if (autoOpenSend) setSendSheetOpen(true);
  }, [autoOpenSend]);

  // Autosave indicator — hidden until the client actually edits something (landing on a freshly
  // uploaded/created invoice with nothing touched yet has nothing to report "Saved" about), then
  // "Saving…" on that first and every subsequent edit, settling to "Saved". Compares against a
  // remembered initial snapshot rather than a "skip first run" flag — a one-shot flag isn't robust
  // to StrictMode's double-invoked effects (same pitfall as the servicesRef comment below), which
  // would otherwise fire once already-false on mount and show "Saved" before anything's touched.
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");
  const [hasEdited, setHasEdited] = useState(false);
  const autosaveDeps = [
    editName, editEmail, editInvoiceNo, currentCustomer,
    issueDate, dueDate, currency, accountId, services, discount, discountMode, discountOn,
  ];
  const initialAutosaveSnapshot = useRef(JSON.stringify(autosaveDeps));
  useEffect(() => {
    if (JSON.stringify(autosaveDeps) === initialAutosaveSnapshot.current) return;
    setHasEdited(true);
    setSaveState("saving");
    const t = setTimeout(() => setSaveState("saved"), 700);
    return () => clearTimeout(t);
  }, autosaveDeps);

  // Scroll target for the duplicate ("Similar invoice found") section.
  const invoiceNoRef = useRef<HTMLDivElement>(null);

  // Scroll the Services section up only when the count actually GROWS (user added a line),
  // never on arrival. Comparing against the previous count is robust to StrictMode's
  // double-invoked effects (a "skip first run" flag isn't), so the review page opens at the top.
  const servicesRef = useRef<HTMLDivElement>(null);
  const prevServicesLen = useRef(services.length);
  useEffect(() => {
    const grew = services.length > prevServicesLen.current;
    prevServicesLen.current = services.length;
    if (grew && services.length > 1) {
      const t = setTimeout(
        () => servicesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
        350
      );
      return () => clearTimeout(t);
    }
  }, [services.length]);

  const scrollRef = useRef<HTMLDivElement>(null);

  // On-screen keyboard mock (Figma "IOS controls" = Keyboard) — shown while the Discount amount
  // field is focused, same convention as every other real text entry point in the app.
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  // Items validation error (Send Invoice tapped with none added yet) — clears itself the moment
  // an item exists, not just on the next tap.
  const [itemsError, setItemsError] = useState(!!initialItemsError);
  useEffect(() => {
    if (services.length > 0) setItemsError(false);
  }, [services.length]);

  // Upload review's Create Invoice CTA stays enabled (not silently disabled) — tapping it with
  // Customer name/email unfilled/invalid or an unset Issue Date surfaces every failing field's
  // error at once (never stops at the first) and focuses the first one in visual order. Each
  // error clears itself once its own field is fixed, not just on the next tap.
  const [customerFieldsError, setCustomerFieldsError] = useState(false);
  useEffect(() => {
    if (name.trim() && emailValid) setCustomerFieldsError(false);
  }, [name, emailValid]);

  // DES-718 send methods (Shareable Link / Download).
  const shareLink = `https://pay.statrys.com/i/${invoiceNo}`;

  // Line items in the invoice currency, for the PDF preview.
  const previewItems = toPreviewItems(services);
  // Bank details for the PDF preview's "Payment Details" block — shared by the full preview and
  // the Send sheet's own compact PDF-segment preview.
  const previewBank = (() => {
    const a = getAccount(accountId);
    return {
      holder: a?.holder ?? "Your Company Ltd",
      bankName: a?.bankName ?? "",
      number: a?.number ?? "",
      swift: a?.swift ?? "",
      currency: a?.currency ?? currency,
    };
  })();
  const previewIssueDateLabel = format(issueDate, "d MMM yyyy");
  const previewStatus = { label: "Pending", color: "warning" as const };

  // Locked-period upload (DES-751): the OCR Issue Date sat in a closed period, so it must be
  // re-picked. Block the CTA while it's still the "Select issue date" placeholder — flag the row
  // red and scroll it into view. Returns true when blocked.
  const issueDateMissing = !!issuePlaceholder && !issuePicked;

  // Combined validator for the upload-review Create Invoice CTA — collects every failing field at
  // once (customer name/email + issue date), then focuses the first one in visual order.
  const validateUploadReview = (): boolean => {
    const customerBad = !(name.trim() && emailValid);
    const issueBad = issueDateMissing;
    if (!customerBad && !issueBad) return true;
    if (customerBad) setCustomerFieldsError(true);
    if (issueBad) setIssueError(true);
    focusFirstInvalidField(
      !name.trim() ? "invoice-customer-name" : !emailValid ? "invoice-customer-email" : "invoice-issue-date"
    );
    return false;
  };

  const openAddService = () => {
    setEditingId(null);
    setServicesSheetOpen(true);
  };
  const openEditService = (id: string) => {
    setEditingId(id);
    setServicesSheetOpen(true);
  };

  // Limited edit (issued invoice): only issue-bound fields are locked. Business fields —
  // customer, due date, items, receiving account (payment method), discount — stay editable.
  // Currency seeds from the customer default (line items may differ and convert into it). It's
  // selectable per invoice in the create/edit flow (tap → currency sheet), but LOCKED for an issued
  // invoice (limited edit) — matching the Invoice Settings currency row, read-only and no chevron.
  // Item's `value` is string-only (no icon slot), so this row is code-only — no flag.
  const curMeta = CURRENCIES.find((c) => c.code === currency);
  const currencyLabel = curMeta ? curMeta.code : currency;

  // Issued limited edit (Awaiting/Overdue) — updated story: ALL invoice fields are editable except the
  // auto-generated invoice number and the client identity (name/address/email). So the detail rows
  // (Currency, Issue Date, Due Date, Receiving Account) are editable exactly as in a fresh create; the
  // client stays locked separately (see the customer tile below), and the number never appears here.
  const details = [
    { label: "Currency", value: currencyLabel, onClick: () => setCurrencySheetOpen(true), locked: false, readOnly: false },
    { label: "Issue Date", value: !issuePicked ? issuePlaceholder! : showIssueToday ? `Today (${format(issueDate, "d MMM yyyy")})` : format(issueDate, "d MMM yyyy"), onClick: () => setIssueSheetOpen(true), locked: false, readOnly: false, placeholder: !issuePicked },
    { label: "Due Date", value: dueRowLabel, onClick: () => setDueSheetOpen(true), locked: false, readOnly: false },
    { label: "Receiving Account", value: formatAccount(accountId), onClick: () => setAccountSheetOpen(true), locked: false, readOnly: false },
  ];

  return (
    <div
      className="relative bg-black rounded-[48px] overflow-hidden shadow-2xl"
      style={{ width: 375, height: 812 }}
    >
      {/* Page — stays in place; the open sheet dims it with its own scrim (no recede). */}
      <div className="absolute inset-0 flex flex-col bg-[var(--bg-neutral-tertiary)] overflow-hidden rounded-[48px]">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto thin-scrollbar"
          onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
        >
        <PageAppHeader scrolled={scrolled}>
          {/* DS PageHeader (center) — the back chevron plays the old ✕/back role (fresh creates
              confirm the auto-save on exit); the autosave chip lives in the header's custom right
              slot. editExitToList (edit-existing-draft-found-via-duplicate-check) skips that
              confirm sheet — it's an ALREADY-existing draft being edited, not a fresh one just
              created, so "Saved as draft" + Delete Draft would misrepresent it; save and leave directly,
              same as before the confirm sheet existed. editingIssuedInvoice instead confirms via
              requestEditBack when `dirty` — an untouched edit session still returns directly. */}
          <PageHeader
            type="center"
            title={headerTitle ?? (isEditing ? "Edit invoice" : "Create Invoice")}
            onBack={lockActions || lockExceptIssueDate ? () => {} : editingIssuedInvoice ? requestEditBack : editExitToList ? saveDraft : onSaveDraft ? () => setSavedDraftSheetOpen(true) : onClose}
            // No right-side search action anywhere on this page — editingIssuedInvoice has no
            // custom `right` content (it doesn't autosave), which would otherwise fall through to
            // PageHeader's default search button.
            showSearch={false}
            right={
              // Figma "Create Invoice" header (node 1387-18223): the DS Loading spinner, not a
              // hand-rolled spinning border — "Saved" keeps the existing check (Figma's own mock
              // only shows the "Saving" state). Hidden for the plain Edit Invoice flow — that one
              // doesn't autosave (see editingIssuedInvoice), so there's nothing to report here —
              // and hidden until the client's first real edit (hasEdited), so a freshly landed
              // page doesn't claim "Saved" before anything's actually been touched.
              editingIssuedInvoice || !hasEdited ? undefined : (
                <div className="flex items-center gap-1 whitespace-nowrap" aria-live="polite">
                  {saveState === "saving" ? (
                    <Loading size="xs" aria-label="Saving" />
                  ) : (
                    <CheckIcon style={{ fontSize: 15, color: "var(--text-success-primary)" }} />
                  )}
                  <span className="text-[12px] text-[var(--text-secondary)]" style={FONT}>
                    {saveState === "saving" ? "Saving" : "Saved"}
                  </span>
                </div>
              )
            }
          />
        </PageAppHeader>

        <div
          className={`px-4 pt-5 flex flex-col gap-4 ${keyboardOpen ? "pb-[380px]" : "pb-28"}`}
          // Locked-period demos: the only permitted in-page interaction is picking the Issue Date. A
          // capture-phase click guard swallows every click outside the Issue Date row (scrolling is a
          // separate event stream, so it stays fully usable).
          onClickCapture={
            lockExceptIssueDate
              ? (e) => {
                  if (!issueRowRef.current?.contains(e.target as Node)) {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }
              : undefined
          }
        >
          {/* Custom top banner (e.g. the locked-period alert) — replaces the OCR coverage banner.
              Locked-period demo: once the user picks a valid issue date (issueMinDate guarantees
              it's outside the closed period), the "period closed" warning no longer applies — hide
              it instead of leaving it up after the blocking condition is already resolved. */}
          {(!issuePlaceholder || !issuePicked) && topBanner}


        {/* Duplicate found — shown at the very top, above the uploaded-file preview. */}
        {isExtracted && existingInvoice && <DuplicateBanner />}

        {/* Extraction coverage — only when a field couldn't be read (OCR-missing case). */}
        {isExtracted && !extractionFailed && !topBanner && fieldsNeedAttention > 0 && (
          <CoverageBanner fieldsExtracted={fieldsExtracted} fieldsTotal={fieldsTotal} />
        )}

        {/* Files — what the user just uploaded; a multi-page scan shows one tile per page,
            horizontally scrollable, since it can be more than one file/photo now. Tap a tile to
            preview the original; Re-upload (title-right, same re-upload path as the OCR-failure
            banner's "Upload a clearer file" link) picks a different file entirely. */}
        {isExtracted && uploadedFile && (
          <Section
            title="Files"
            titleRight={
              onReupload && (
                <button
                  type="button"
                  onClick={onReupload}
                  className="flex items-center gap-1 body-sm-medium"
                  style={{ color: "var(--link-primary)" }}
                >
                  <RefreshCw size={14} strokeWidth={1.67} />
                  Re-upload
                </button>
              )
            }
          >
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {Array.from({ length: uploadedFile.pages && uploadedFile.pages > 1 ? uploadedFile.pages : 1 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setFilePreviewOpen(true)}
                  className="shrink-0 w-[76px] flex flex-col items-center gap-1.5 rounded-2xl border p-2.5"
                  style={{ background: "var(--bg-neutral-primary)", borderColor: "var(--border-neutral-primary)" }}
                >
                  <FileText size={22} strokeWidth={1.5} style={{ color: "var(--icon-secondary)" }} />
                  <span className="caption w-full truncate text-center" style={{ color: "var(--text-secondary)" }}>
                    {uploadedFile.pages && uploadedFile.pages > 1 ? `Page ${i + 1}` : uploadedFile.name}
                  </span>
                </button>
              ))}
            </div>
          </Section>
        )}

        {/* Banner — OCR-failure notice (couldn't read the file) takes priority over the summary */}
        {extractionFailed && <ExtractionFailedBanner onReupload={onReupload} />}

        {/* Customer — matched / unmatched (upload) or the selected card */}
        <Section title="Bill To">
        {!isExtracted ? (
          isEditing ? (
            /* DES-817: Client (Customer) is not editable in Draft/after Send — locked once created.
               To change it the user must start a new invoice (or edit the client record). */
            <Tile title={name} text={email} avatar={initials(name)} avatarColor={avatarTint(name)} onLayer="gray" reserveTrailing={false} />
          ) : (
            /* DS Tile on the beige page — tap (chevron) reopens the customer picker. */
            <Tile title={name} text={email} avatar={initials(name)} avatarColor={avatarTint(name)} onLayer="gray" trailing="chevron" onClick={onChangeCustomer} />
          )
        ) : (
          /* Upload review (DES-716) — OCR extracts the customer name + email, so show them as
             pre-filled, editable fields (not a card). An unmatched client is saved to the customer
             list automatically on create; a missing field is flagged until supplied. */
          <div className="scroll-mt-24 flex flex-col gap-3">
            {/* Customer name — amber highlight + caption when OCR couldn't read it (proactive,
                shown from the moment the review opens); tapping Create Invoice while still empty
                escalates to a real (red) validation error instead — see validateUploadReview. */}
            <TextField
              dataReq="invoice-customer-name"
              label="Customer name"
              placeholder="Customer name"
              mandatory
              value={editName}
              onChange={setEditName}
              highlight={nameMissing && !customerFieldsError}
              error={customerFieldsError && !editName.trim()}
              caption={
                customerFieldsError && !editName.trim()
                  ? "Enter the customer name."
                  : nameMissing
                  ? "Couldn't extract detail."
                  : undefined
              }
              onFocus={(e) => { setKeyboardOpen(true); scrollFieldIntoView(e.currentTarget); }}
              onBlur={() => setKeyboardOpen(false)}
            />

            {/* Email — amber highlight + caption when OCR couldn't read it (proactive); tapping
                Create Invoice while empty or an invalid format escalates to a real (red)
                validation error instead — see validateUploadReview. */}
            <TextField
              dataReq="invoice-customer-email"
              label="Email address"
              inputType="email"
              placeholder="name@email.com"
              mandatory
              value={editEmail}
              onChange={setEditEmail}
              highlight={emailMissing && !customerFieldsError}
              error={customerFieldsError && !emailValid}
              caption={
                customerFieldsError && !emailValid
                  ? editEmail.trim() ? "Enter a valid email address." : "Enter the email address."
                  : emailMissing
                  ? "Couldn't extract detail."
                  : undefined
              }
              onFocus={(e) => { setKeyboardOpen(true); scrollFieldIntoView(e.currentTarget); }}
              onBlur={() => setKeyboardOpen(false)}
            />
          </div>
        )}
        </Section>

        {/* Invoice number — user-entered for uploads (DES-716) */}
        {isExtracted && (
          <div ref={invoiceNoRef} className="scroll-mt-20 flex flex-col gap-1">
            <TextField
              label="Invoice Number"
              placeholder="e.g. UPL-2026-000042"
              mandatory
              highlight={!!existingInvoice}
              value={editInvoiceNo}
              onChange={setEditInvoiceNo}
              onFocus={(e) => { setKeyboardOpen(true); scrollFieldIntoView(e.currentTarget); }}
              onBlur={() => setKeyboardOpen(false)}
              iconRight={
                existingInvoice ? (
                  <Badge label="Already exists" color="error" variant="text" size="sm" />
                ) : numberRecommended ? (
                  <Badge label="Recommended" color="success" variant="text" size="sm" />
                ) : undefined
              }
            />
          </div>
        )}

        {/* Invoice details — Figma "Create Invoice" (node 1387-18118): ListCard/ListRow, value +
            description stacked (e.g. "Next 30 days" / "15 Jul 2026"), Currency gets a flag. Locked
            rows (limited edit, DES-817) stay dimmed with no chevron/tap, same semantics as before. */}
        <Section title="Invoice Details">
          <ListCard onLayer="gray">
            {details.map((d, i) => {
              const isIssueRow = d.label === "Issue Date";
              const rowError = isIssueRow && issueError && !issuePicked;
              // Unset Issue Date (placeholder mode) reads amber by default to signal it must be re-picked;
              // the required-field error escalates it to red once the CTA is tapped.
              const rowWarning = isIssueRow && !issuePicked && !rowError;
              return (
                <div key={d.label} ref={isIssueRow ? issueRowRef : undefined} data-req={isIssueRow ? "invoice-issue-date" : undefined} className="scroll-mt-24" style={d.locked ? { opacity: 0.5 } : undefined}>
                  <ListRow
                    label={d.label}
                    value={d.value}
                    valueFlag={d.label === "Currency" ? <CountryFlag name={CURRENCY_COUNTRY[currency]} size={16} /> : undefined}
                    trailing={d.locked ? "none" : "chevron"}
                    onClick={d.locked ? undefined : d.onClick}
                    last={i === details.length - 1}
                    placeholder={(d as { placeholder?: boolean }).placeholder}
                    error={rowError}
                    warning={rowWarning}
                    caption={rowError ? "Issue date is required" : undefined}
                  />
                </div>
              );
            })}
          </ListCard>
        </Section>

        {/* Items (Figma "Create Invoice", node 1387-18118 — renamed from "Services / Products" to
            match) */}
        <div ref={servicesRef} className="scroll-mt-5">
        <Section title={services.length > 0 ? `Items ( ${services.length} )` : "Items"}>
          {services.length === 0 ? (
            /* Secondary CTA on the beige page (same treatment as "Add more items" once there are
               items) — red caption when Send Invoice was tapped with no items yet (see `itemsError`). */
            <div data-req="invoice-items">
              <Button hierarchy="secondary" size="sm" fullWidth iconLeft={<Plus size={18} />} label="Add your items" onClick={openAddService} />
              <AnimatePresence initial={false}>
                {itemsError && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="text-[12px] pt-1 overflow-hidden"
                    style={{ ...FONT, color: "var(--text-error-primary)" }}
                  >
                    You need to add an item
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* ListCard of rows (Figma "Create Invoice", node 1826-15914). */}
              <ListCard onLayer="gray">
                <AnimatePresence initial={false}>
                  {services.map((s, idx) => (
                    <motion.div
                      key={s.id}
                      layout
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      style={{ overflow: "hidden" }}
                    >
                      <ServiceItemCard
                        line={s}
                        invoiceCurrency={currency}
                        hint={hintFirst && idx === 0}
                        onClick={() => openEditService(s.id)}
                        onDelete={() => setServices((prev) => prev.filter((x) => x.id !== s.id))}
                        last={idx === services.length - 1}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </ListCard>
              {/* "Add more items" as a secondary CTA below the list, not a trailing list row. */}
              <Button hierarchy="secondary" size="sm" fullWidth iconLeft={<Plus size={18} />} label="Add more items" onClick={openAddService} />
            </div>
          )}
        </Section>
        </div>

        {/* Discounts — appears once the first service is added. Editable in the issued limited edit
            (Awaiting/Overdue) too, per the updated story (only invoice number + client stay locked). */}
        <AnimatePresence>
          {services.length > 0 && (
            <motion.div
              key="discount-card"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.3 }}
            >
              <DiscountCard
                currency={currency}
                enabled={discountOn}
                onToggle={setDiscountOn}
                value={discount}
                onChange={setDiscount}
                mode={discountMode}
                onOpenMode={() => setDiscountModeSheetOpen(true)}
                onFocus={(e) => { setKeyboardOpen(true); scrollFieldIntoView(e.currentTarget); }}
                onBlur={() => setKeyboardOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Automated chaser (DES-764 AC5) — per-invoice toggle, seeded from the account default.
            Bare title+description+toggle row (Figma "Create Invoice", node 1826-15914) — no card
            chrome. Backend auto-deactivates it once the invoice is Paid (out of scope). */}
        <AnimatePresence>
          {services.length > 0 && (
            <motion.div
              key="automatic-reminders"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.3 }}
            >
              <ListRow
                label="Automatic reminders"
                description="Email sent 7 days before the due date"
                trailing="toggle"
                checked={chaser}
                onCheckedChange={setChaser}
                last
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary — appears with the line items */}
        <AnimatePresence>
          {services.length > 0 && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.3 }}
            >
              <Section title="Summary">
                <SummaryCard
                  currency={currency}
                  subtotal={subtotal}
                  discount={discountAmount}
                  total={total}
                />
              </Section>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>

        {isEditing && editingIssuedInvoice ? (
          // Plain Edit Invoice (an issued invoice, opened from its detail page) — always shown,
          // disabled until the user actually changes something (`dirty`); no separate Cancel CTA
          // (decided 2026-08-20: one primary action, not a pair). The header chevron is still the
          // way to leave without saving, confirming via requestEditBack when dirty.
          <ButtonDock
            type="single"
            sticky
            primaryLabel="Save"
            // Disabled until dirty (above) — once enabled, never blocked by incomplete fields
            // (decided 2026-08-12), same as the header back chevron's "Unsaved changes?" confirm
            // sheet, whose own Save button never validated at all. An edit with 0 items still
            // saves; InvoiceDetailPage shows what's missing (e.g. "No items added yet") instead of
            // silently hiding the section.
            primaryDisabled={!dirty}
            onPrimary={onEditSave}
            keyboard={keyboardOpen}
          />
        ) : isEditing ? (
          <ButtonDock
            type="single"
            sticky
            primaryLabel="Save"
            // Save is always allowed, incomplete or not (decided 2026-08-12) — a draft can be left
            // and resumed at any time; InvoiceDetailPage shows what's missing instead.
            onPrimary={onEditSave}
            keyboard={keyboardOpen}
          />
        ) : isExtracted && existingInvoice ? (
          // Duplicate number (match by number only): creating a copy is hard-blocked — the only
          // action is to open the existing invoice (or edit the number to a free one).
          <ButtonDock
            type="single"
            sticky
            primaryLabel={existingPrimaryLabel}
            onPrimary={() => onOpenExisting?.(existingInvoice)}
            keyboard={keyboardOpen}
          />
        ) : isExtracted ? (
          <ButtonDock
            type="single"
            sticky
            primaryLabel="Create Invoice"
            // Always enabled (same convention as the manual-create dock below) — tapping with
            // Customer name/email unfilled/invalid or an unset Issue Date surfaces every failing
            // field's error at once and focuses the first one (validateUploadReview), instead of
            // the button just sitting disabled with no explanation.
            // Uploaded invoices are record-only by default (DES-716): issuing moves them
            // to Awaiting Payment (sending happened elsewhere). The toast confirms the record
            // action — the Awaiting Payment status is shown by the detail-page badge.
            // Locked-period demo: an unset Issue Date shows the required-field error; once picked,
            // lockActions keeps the CTA inert so it never lands.
            onPrimary={() => {
              if (!validateUploadReview()) return;
              if (lockActions) return;
              onSend?.({ title: "Invoice created successfully" }, recentSent);
            }}
            keyboard={keyboardOpen}
          />
        ) : (
          // Always enabled (Figma "Create Invoice", node 1387-18118) — an empty items list no
          // longer blocks the button; tapping it with none surfaces the error on the Items Tile
          // instead of the button just sitting disabled with no explanation. SummaryDock (Figma
          // "Sales Invoice - Client" node 2004:12766/2004:13021) replaces the old scroll-triggered
          // ButtonDock slot with a persistent total + tap-to-expand Subtotal/Discount/Total panel.
          <SummaryDock
            currency={currency}
            subtotal={subtotal}
            discount={discountAmount}
            total={total}
            // "Review & Send" (not "Create Invoice") — tapping it opens the Send Invoice sheet
            // (handleSendInvoiceClick) to review/edit the delivery email before it actually sends,
            // unlike the upload-review flow's own "Create Invoice" CTA below (isExtracted branch),
            // which really does just record the invoice immediately with no review step.
            primaryLabel="Review & Send"
            primaryLoading={sendPending}
            // Locked-period demo: the CTA stays visually enabled but tapping it goes nowhere.
            onPrimary={() => {
              if (lockActions) return;
              if (services.length === 0) {
                setItemsError(true);
                focusFirstInvalidField("invoice-items");
                return;
              }
              handleSendInvoiceClick();
            }}
            keyboard={keyboardOpen}
          />
        )}
      </div>

      {/* Per-invoice currency — the choice stays on this invoice; it is never written back to the
          customer default or Settings. */}
      <CurrencySheet
        open={currencySheetOpen}
        value={currency}
        onClose={() => setCurrencySheetOpen(false)}
        onSelect={(code) => {
          setCurrency(code);
          setCurrencySheetOpen(false);
        }}
      />

      <IssueDateSheet
        open={issueSheetOpen}
        value={issueDate}
        minDate={issueMinDate}
        helperText={issueSheetHelper}
        helperTitle={issueSheetHelperTitle}
        locked={lockIssueSheet}
        onClose={() => setIssueSheetOpen(false)}
        onSelect={(d) => {
          setIssueDate(d);
          setIssuePicked(true);
          setIssueChanged(true);
          setIssueError(false);
          setIssueSheetOpen(false);
        }}
      />

      <DueDateSheet
        open={dueSheetOpen}
        value={dueDate}
        onClose={() => setDueSheetOpen(false)}
        onSelect={(title) => {
          setDueDate(title);
          setDueSheetOpen(false);
        }}
      />

      {/* Back-tap confirm (fresh create/upload-review only, never mid-edit) — nothing is saved yet:
          "Go to invoice list" saves this as a draft on the way out; "Delete Draft" abandons it
          entirely (no draft ever created) and goes back to the list the same as the plain ✕/close;
          "Keep editing" (tertiary/ghost — least emphasis, it's just dismissing this sheet) resumes
          right where the user was, same as before this sheet existed. */}
      <BottomSheet
        open={savedDraftSheetOpen}
        title="Saved as draft"
        onClose={() => setSavedDraftSheetOpen(false)}
        hideClose
        compact
        footer={
          <ButtonDock
            type="triple"
            primaryLabel="Go to invoice list"
            secondaryLabel="Delete Draft"
            tertiaryLabel="Keep editing"
            // Close the sheet, THEN navigate away once its own close animation (BottomSheet's
            // 400ms slide-down) actually finishes — navigating in the same tick as setOpen(false)
            // races the sheet's exit against the incoming screen's enter transition instead of
            // sequencing them, so the sheet visibly gets cut off mid-close.
            onPrimary={() => { setSavedDraftSheetOpen(false); setTimeout(saveDraft, 400); }}
            onSecondary={() => { setSavedDraftSheetOpen(false); setTimeout(() => onClose?.(), 400); }}
            onTertiary={() => setSavedDraftSheetOpen(false)}
          />
        }
      >
        <p className="body-sm" style={{ ...FONT, color: MUTED }}>
          {isExtracted ? (
            <>Invoice {invoiceNo} has been saved as a draft. You&rsquo;ll find it in your invoice list, ready to edit and send whenever you are.</>
          ) : (
            <>Your invoice has been saved as a draft. You&rsquo;ll find it in your invoice list, ready to edit and send whenever you are.</>
          )}
        </p>
      </BottomSheet>

      {/* Unsaved-changes confirm (editingIssuedInvoice, dirty only) — the header back chevron
          reuses this instead of discarding directly (requestEditBack); the footer's own "Cancel"
          stays a direct, unconfirmed discard since it's already explicit. Save persists via the
          same onEditSave the footer's Save button calls; Cancel here discards via onEditBack. */}
      <BottomSheet
        open={discardEditOpen}
        title="Unsaved changes?"
        onClose={() => setDiscardEditOpen(false)}
        hideClose
        compact
        footer={
          <ButtonDock
            type="double"
            primaryLabel="Save"
            secondaryLabel="Cancel"
            onPrimary={() => { setDiscardEditOpen(false); onEditSave?.(); }}
            onSecondary={() => { setDiscardEditOpen(false); onEditBack?.(); }}
          />
        }
      >
        <p className="body-sm" style={{ ...FONT, color: MUTED }}>
          You have unsaved changes to this invoice. Save them before you go, or cancel to discard them.
        </p>
      </BottomSheet>

      <ReceivingAccountSheet
        open={accountSheetOpen}
        value={accountId}
        // Only Statrys accounts can receive an invoice payment — hide "Use Other Bank Accounts".
        hideExternal
        onClose={() => setAccountSheetOpen(false)}
        onSelect={(id) => {
          setAccountId(id);
          setAccountSheetOpen(false);
        }}
      />

      <AddServicesSheet
        key={editingId ?? "new"}
        open={servicesSheetOpen}
        invoiceCurrency={currency}
        initial={editingId ? services.find((s) => s.id === editingId) : null}
        onClose={() => {
          setServicesSheetOpen(false);
          setEditingId(null);
        }}
        onAdd={(draft) => {
          const isFirst = !editingId && services.length === 0;
          setServices((prev) =>
            editingId
              ? prev.map((s) => (s.id === editingId ? { ...draft, id: editingId } : s))
              : [...prev, { ...draft, id: `${Date.now()}-${Math.round(Math.random() * 1e6)}` }]
          );
          setServicesSheetOpen(false);
          setEditingId(null);
          if (isFirst) {
            setHintFirst(true);
            setTimeout(() => setHintFirst(false), 6000);
          }
        }}
        onDelete={
          editingId
            ? () => {
                setServices((prev) => prev.filter((s) => s.id !== editingId));
                setServicesSheetOpen(false);
                setEditingId(null);
              }
            : undefined
        }
      />

      <SendInvoiceSheet
        open={sendSheetOpen}
        customerName={name}
        customerEmail={email}
        companyName={companyName}
        companyEmail={companyEmail}
        invoiceNo={invoiceNo}
        amountLabel={amountLabel}
        dueDateLabel={dueDateLabel}
        link={shareLink}
        forceError={forceSendError}
        // ✕ on the Send Invoice page returns to the (still pre-filled) editor (user, 15/Jul) —
        // autosave already holds the work, so no draft toast / list redirect.
        onClose={() => setSendSheetOpen(false)}
        onSend={() => onSend?.({ title: "Invoice marked as sent" }, recentSent)}
        // Marked Sent only if the link was actually copied/shared (option B).
        onSent={() => onSend?.({ title: "Invoice marked as sent" }, recentSent)}
        onDownload={() => { setLocalToast("Invoice downloaded"); setPdfPreviewOpen(true); }}
        onQuickDownload={() => setLocalToast("Invoice downloaded")}
        docPreview={
          <InvoiceDocumentPreview
            invoiceNo={invoiceNo}
            customerName={name}
            customerEmail={email}
            companyName={companyName}
            issueDateLabel={previewIssueDateLabel}
            dueDateLabel={dueDateLabel}
            currency={currency}
            items={previewItems}
            subtotal={subtotal}
            discount={discountAmount}
            total={total}
            bank={previewBank}
            status={previewStatus}
            className="p-0"
          />
        }
      />

      {/* Read-only summary of the existing (duplicate) invoice */}
      <ExistingInvoiceSheet open={existingViewOpen} invoice={existingInvoice} onClose={() => setExistingViewOpen(false)} />

      {/* Original uploaded file — shows the actual invoice document (same InvoiceDocumentPreview
          the full PDF preview and Send sheet use, populated from this page's current field values),
          not a generic faux-scan mockup. Title is the uploaded file's own name; "Re-upload" reuses
          the row's own re-upload path. */}
      <BottomSheet
        open={filePreviewOpen}
        title={uploadedFile?.name ?? "Invoice"}
        onClose={() => setFilePreviewOpen(false)}
        heightClass="h-[72%]"
        footer={onReupload ? <ButtonDock type="single" primaryLabel="Re-upload" onPrimary={onReupload} /> : undefined}
      >
        <InvoiceDocumentPreview
          invoiceNo={invoiceNo}
          customerName={name}
          customerEmail={email}
          companyName={companyName}
          issueDateLabel={previewIssueDateLabel}
          dueDateLabel={dueDateLabel}
          currency={currency}
          items={previewItems}
          subtotal={subtotal}
          discount={discountAmount}
          total={total}
          bank={previewBank}
        />
      </BottomSheet>

      <DiscountModeSheet
        open={discountModeSheetOpen}
        value={discountMode}
        currency={currency}
        onClose={() => setDiscountModeSheetOpen(false)}
        onSelect={(m) => {
          setDiscountMode(m);
          setDiscountModeSheetOpen(false);
        }}
      />

      {/* PDF preview — shown instantly over the (still-mounted) Delivery method page; no transition. */}
      {pdfPreviewOpen && (
        <div className="absolute inset-0 z-50">
          <InvoicePreviewPage
            invoiceNo={invoiceNo}
            customerName={name}
            customerEmail={email}
            companyName={companyName}
            issueDateLabel={previewIssueDateLabel}
            dueDateLabel={dueDateLabel}
            currency={currency}
            items={previewItems}
            subtotal={subtotal}
            discount={discountAmount}
            total={total}
            bank={previewBank}
            status={previewStatus}
            // Only ever reached via the Send sheet's own Download row — already "just to show"
            // (the download already fired there), so no dock button and no side effect here; Back
            // returns to the Send sheet, which already jumped itself to the Share/Download tab.
            hideDownload
            onBack={() => setPdfPreviewOpen(false)}
          />
        </div>
      )}

      <CustomerSheet
        open={customerSheetOpen}
        value={currentCustomer?.id}
        customers={customers}
        onClose={() => setCustomerSheetOpen(false)}
        onSelect={(c) => {
          setCurrentCustomer(c);
          setCustomerSheetOpen(false);
        }}
      />

      {/* Rendered last so it wins the z-index tie against the full-screen PDF preview above —
          the download toast needs to show even while that preview is covering everything else. */}
      <Toast open={!!localToast} message={localToast ?? ""} onDone={() => setLocalToast(null)} />
    </div>
  );
}

export default AddInvoiceDetails;
