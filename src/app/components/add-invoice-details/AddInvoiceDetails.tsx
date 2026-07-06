import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { motion } from "motion/react";
import { UploadedFileCard, FilePreviewOverlay } from "../UploadedFile";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AddIcon from "@mui/icons-material/Add";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CheckIcon from "@mui/icons-material/Check";
import StatusBar from "../StatusBar";
import { SheetHeader, HeaderIconButton } from "../SheetHeader";
import { ButtonDock } from "../ButtonDock";
import { Button } from "../Buttons";
import { EditCard } from "../EditCard";
import { TextInput } from "../TextInput";
import { Item } from "../Item";
import { ServiceItemCard } from "../ServiceItemCard";
import { DiscountCard, type DiscountMode } from "../DiscountCard";
import { DiscountModeSheet } from "../DiscountModeSheet";
import { SummaryCard } from "../SummaryCard";
import { SendInvoiceSheet } from "../SendInvoiceSheet";
import { ShareLinkSheet } from "../ShareLinkSheet";
import { InvoicePreviewPage } from "../InvoicePreviewPage";
import { ReviewEmail } from "../ReviewEmail";
import { CustomerSheet } from "../CustomerSheet";
import { CURRENCIES, CurrencySheet } from "../CurrencySheet";
import { Toggle } from "../Toggle";
import { DueDateSheet } from "../DueDateSheet";
import { IssueDateSheet } from "../IssueDateSheet";
import { BottomSheet } from "../BottomSheet";
import { Tile } from "../Tile";
import { Calendar } from "../Calendar";
import { RecurrenceSection } from "./RecurrenceSection";
import { FREQUENCIES, type Frequency } from "./recurrence";
import { ReceivingAccountSheet } from "../ReceivingAccountSheet";
import { AddServicesSheet } from "../AddServicesSheet";
import { CUSTOMERS } from "../../data/customers";
import { EXISTING_INVOICES } from "../../data/extraction";
import { formatAccount, getAccount } from "../../data/receivingAccounts";
import { convert } from "../../lib/currency";
import { EMAIL_RE } from "../../lib/format";
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
  onSaveDraft?: (draft?: { client: string; amount: string; meta: string }) => void;
  /** Primary action — sends (manual) or creates (upload); returns to the list with a toast.
   *  An optional toast (title + subtext) overrides the default copy (per send method).
   *  `recent` lets the list surface + highlight the just-created card. */
  onSend?: (
    toast?: { title: string; subtext?: string },
    recent?: { client: string; amount: string; status: "Awaiting" | "Draft" | "Paid"; meta: string }
  ) => void;
  /** Dev preview — open the Delivery method sheet on mount. */
  autoOpenSend?: boolean;
  /** Dev preview — seed the invoice with demo line items. */
  seedServices?: ServiceLine[];
  /** Prefill the manual form when editing an existing invoice (from the detail page). */
  initial?: {
    customer?: Customer | null;
    invoiceNo?: string;
    currency?: string;
    services?: ServiceLine[];
    /** Issued invoice = limited edit: lock customer, issue date, currency, receiving account. */
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
  /** Upload mode: the file the user uploaded (shown as an attachment in the review). */
  uploadedFile?: { name: string; size: number } | null;
  /** Duplicate flow → "Create new": the invoice number was system-generated (show a "Recommended" hint). */
  numberRecommended?: boolean;
  /** Edit-existing-from-duplicate: show ✕ (not back) on the editor → save as draft and return to list. */
  editExitToList?: boolean;
  /** Account default currency (DES-764 Invoice Settings) — seeds a fresh invoice's currency. */
  defaultCurrency?: string;
  /** Sender company for the email brand bar (from Invoice Settings). */
  companyName?: string;
  /** Account default for the automated-chaser toggle (DES-764 AC5) — seeds the per-invoice toggle. */
  defaultChaser?: boolean;
  /** Default receiving account id (DES-764 Payment Method) — seeds the invoice's Receiving Account. */
  defaultAccountId?: string;
  /** Recurring-series setup (DES-782): shows the Recurrence section + schedule instead of a one-off issue. */
  recurring?: boolean;
  /** Editing an existing series (DES-782 AC4) — recurring form with a "Save changes" CTA. */
  editingSeries?: boolean;
}

import { FONT } from "../../lib/theme";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="w-full flex flex-col gap-2">
      <p className="text-[18px] font-bold leading-[1.1] text-[#1b1b1b]" style={FONT}>
        {title}
      </p>
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
  seedServices,
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
  defaultChaser = true,
  defaultAccountId = "personal",
  recurring = false,
  editingSeries = false,
}: AddInvoiceDetailsProps) {
  // When `extracted` is present we came from an upload.
  const isExtracted = !!extracted;
  // OCR read nothing — banner stays until dismissed; the form starts blank.
  const [failBannerOpen, setFailBannerOpen] = useState(true);
  // `initial` means we opened the form to edit an existing invoice (from the detail page).
  const isEditing = !!initial;
  // Limited edit of an issued invoice — lock fields bound at issue (DES-715 AC4).
  const lockedEdit = isEditing && !!initial?.limited;
  // Recurring-series setup (DES-782): the pure create path, or an explicit series edit (AC4). Never an
  // uploaded invoice or a normal invoice edit (guards against a stale `recurring` flag leaking in).
  const isRecurring = editingSeries || (recurring && !isEditing && !isExtracted);

  // Step 5 (Qonto-style): try to match the OCR'd customer to an existing client.
  const autoMatch = useMemo(() => {
    if (!extracted) return null;
    const em = extracted.customerEmail.trim().toLowerCase();
    const nm = extracted.customerName.trim().toLowerCase();
    return CUSTOMERS.find((c) => (em && c.email.toLowerCase() === em) || c.name.toLowerCase() === nm) ?? null;
  }, [extracted]);

  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(customer ?? initial?.customer ?? autoMatch ?? null);
  const [editName, setEditName] = useState(extracted?.customerName ?? "");
  const [editEmail, setEditEmail] = useState(extracted?.customerEmail ?? "");
  // Uploaded invoices use a user-entered number (DES-716), not a system-generated one.
  const [editInvoiceNo, setEditInvoiceNo] = useState(extracted?.invoiceNumber ?? "");
  const [existingViewOpen, setExistingViewOpen] = useState(false);
  // Preview the original uploaded file (demo: a representative document, no real bytes).
  const [filePreviewOpen, setFilePreviewOpen] = useState(false);
  // Whether to also save the typed-in customer to the client list (default on).

  // The linked client (auto-matched or picked). When null on an upload, we're in
  // the "no match" state and the customer name/email are editable inline.
  const linked = currentCustomer;

  const name = isExtracted ? (linked ? linked.name : editName) : linked?.name ?? "Marlow & Finch Studio";
  const email = isExtracted ? (linked ? linked.email : editEmail) : linked?.email ?? "apa@marlowfinch.co";

  // Customer name / email couldn't be read off the file — flag until supplied (unmatched state).
  const nameMissing = isExtracted && !linked && editName.trim() === "";
  const emailMissing = isExtracted && !linked && editEmail.trim() === "";
  const emailValid = EMAIL_RE.test(editEmail.trim());

  // Extraction coverage — drives the "N out of M extracted" review card (OCR-missing case only).
  const { fieldsTotal, fieldsExtracted, fieldsNeedAttention } = extractionCoverage(extracted, emailMissing);

  const [sendSheetOpen, setSendSheetOpen] = useState(false);
  const [emailReviewOpen, setEmailReviewOpen] = useState(false);
  const [shareLinkOpen, setShareLinkOpen] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [customerSheetOpen, setCustomerSheetOpen] = useState(false);

  const [issueDate, setIssueDate] = useState<Date>(extracted?.issueDate ?? new Date(2026, 5, 15));
  const [issueSheetOpen, setIssueSheetOpen] = useState(false);
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

  // Recurring-series setup (DES-782) — only surfaced when `recurring`.
  const [recFreq, setRecFreq] = useState<Frequency>("Monthly");
  const [recStart, setRecStart] = useState<Date>(() => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + 1); return d; });
  const [recEnd, setRecEnd] = useState<{ mode: "never" } | { mode: "count"; count: number } | { mode: "date"; date: Date }>({ mode: "never" });
  const [recAutoSend, setRecAutoSend] = useState(false);
  const [recFreqOpen, setRecFreqOpen] = useState(false);
  const [recStartOpen, setRecStartOpen] = useState(false);
  const [recEndOpen, setRecEndOpen] = useState(false);
  const [recEndDateOpen, setRecEndDateOpen] = useState(false);
  const [servicesSheetOpen, setServicesSheetOpen] = useState(false);
  const [services, setServices] = useState<ServiceLine[]>(extracted?.services ?? initial?.services ?? seedServices ?? []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hintFirst, setHintFirst] = useState(false);
  const [discountOn, setDiscountOn] = useState(false);
  const [discount, setDiscount] = useState("");
  const [discountMode, setDiscountMode] = useState<DiscountMode>("percent");
  const [discountModeSheetOpen, setDiscountModeSheetOpen] = useState(false);

  const subtotal = services.reduce(
    (sum, s) => sum + convert(s.quantity * s.unitPrice, s.currency, currency),
    0
  );
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
  // Draft duplicate → continue in its editor; an issued/closed one opens its detail page.
  const existingPrimaryLabel = existingInvoice?.status === "Draft" ? "Open existing draft" : "Open existing invoice";
  const amountLabel = `${currency} ${total.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  // Summary for the freshly-saved draft card on the list (✕ → save as draft).
  const draftAmount = `${currency === "USD" ? "$" : `${currency} `}${total.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  const clientLabel = name.trim() || "Untitled customer";
  // Due Date labels — the relative "Next N days" term resolved against the issue date.
  const { dueDateLabel, dueRowLabel, dueShort } = dueLabels(issueDate, dueDate);
  // Meta line for the recent list card — drafts show the created date, issued invoices the due date.
  const draftMeta = `${invoiceNo} · Created ${format(issueDate, "d MMM yyyy")}`;
  const sentMeta = `${invoiceNo} · Due ${dueShort}`;
  const saveDraft = () =>
    onSaveDraft?.({ client: clientLabel, amount: draftAmount, meta: draftMeta });
  // Recent (sent/created) card the list highlights when this invoice is issued.
  const recentSent = { client: clientLabel, amount: draftAmount, status: "Awaiting" as const, meta: sentMeta };

  // Dev preview — open the Delivery method sheet on mount.
  useEffect(() => {
    if (autoOpenSend) setSendSheetOpen(true);
  }, [autoOpenSend]);

  // Autosave indicator — "Saving…" on any edit, then "Saved" once it settles.
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");
  const firstChange = useRef(true);
  useEffect(() => {
    if (firstChange.current) {
      firstChange.current = false;
      return;
    }
    setSaveState("saving");
    const t = setTimeout(() => setSaveState("saved"), 700);
    return () => clearTimeout(t);
  }, [
    editName, editEmail, editInvoiceNo, currentCustomer,
    issueDate, dueDate, currency, accountId, services, discount, discountMode, discountOn,
  ]);

  // Scroll target for the duplicate ("Similar invoice found") section.
  const invoiceNoRef = useRef<HTMLDivElement>(null);

  // The flagged field (e.g. missing email) is highlighted in place — no auto-scroll on arrival,
  // so the review page always opens at the top after an upload.
  const flaggedRef = useRef<HTMLDivElement>(null);

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

  // DES-718 send methods (Shareable Link / Download).
  const shareLink = `https://pay.statrys.com/i/${invoiceNo}`;

  // Line items in the invoice currency, for the PDF preview.
  const previewItems = toPreviewItems(services, currency);

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
  const curMeta = CURRENCIES.find((c) => c.code === currency);
  const currencyLabel = curMeta ? `${curMeta.flag}  ${curMeta.code}` : currency;

  // Recurring series labels (DES-782). Each generated invoice gets its own issue/due date from the
  // schedule, so the one-off Issue/Due rows are hidden in recurring mode.
  const recEndLabel =
    recEnd.mode === "never" ? "Never (until cancelled)"
    : recEnd.mode === "count" ? `After ${recEnd.count} invoices`
    : format(recEnd.date, "d MMM yyyy");

  const details = [
    ...(lockedEdit
      ? [{ label: "Invoice Number", value: invoiceNo, onClick: () => {}, locked: true, readOnly: false }]
      : []),
    { label: "Currency", value: currencyLabel, onClick: lockedEdit ? () => {} : () => setCurrencySheetOpen(true), locked: false, readOnly: lockedEdit },
    ...(isRecurring
      ? []
      : [
          { label: "Issue Date", value: format(issueDate, "d MMM yyyy"), onClick: () => setIssueSheetOpen(true), locked: lockedEdit, readOnly: false },
          { label: "Due Date", value: dueRowLabel, onClick: () => setDueSheetOpen(true), locked: false, readOnly: false },
        ]),
    { label: "Receiving Account", value: formatAccount(accountId), onClick: () => setAccountSheetOpen(true), locked: false, readOnly: false },
  ];

  return (
    <div
      className="relative bg-black rounded-[48px] overflow-hidden shadow-2xl"
      style={{ width: 375, height: 812 }}
    >
      {/* Page — stays in place; the open sheet dims it with its own scrim (no recede). */}
      <div className="absolute inset-0 flex flex-col bg-[#F9F5EA] overflow-hidden rounded-[48px]">
        <StatusBar />

      <SheetHeader
        title={editingSeries ? "Edit recurring series" : isRecurring ? "New Recurring Invoice" : isEditing ? "Edit invoice" : "New Invoice"}
        type="inside-page"
        state="fixed"
        leading={
          isEditing && !editExitToList ? (
            <HeaderIconButton aria-label="Back" onClick={onEditBack}>
              <ChevronLeftIcon />
            </HeaderIconButton>
          ) : (
            // Edit-existing-from-duplicate (editExitToList) and create flows: ✕ saves a draft → list.
            <HeaderIconButton aria-label="Close" onClick={onSaveDraft ? saveDraft : onClose}>
              <CloseIcon />
            </HeaderIconButton>
          )
        }
        trailing={
          <div className="flex items-center gap-1 whitespace-nowrap" aria-live="polite">
            {saveState === "saving" ? (
              <motion.span
                className="w-3.5 h-3.5 rounded-full border-2 border-[#d4d4d4] border-t-[#808080]"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
              />
            ) : (
              <CheckIcon style={{ fontSize: 15, color: "#006a1d" }} />
            )}
            <span className="text-[12px] text-[#808080]" style={FONT}>
              {saveState === "saving" ? "Saving…" : "Saved"}
            </span>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto thin-scrollbar bg-white px-4 pt-5 pb-6 flex flex-col gap-4">
        {/* Extraction coverage — only when a field couldn't be read (OCR-missing case). */}
        {isExtracted && !extractionFailed && fieldsNeedAttention > 0 && (
          <CoverageBanner fieldsExtracted={fieldsExtracted} fieldsTotal={fieldsTotal} />
        )}

        {/* Uploaded file (top) — what the user just uploaded, with a button to preview the original. */}
        {isExtracted && uploadedFile && (
          <UploadedFileCard file={uploadedFile} onPreview={() => setFilePreviewOpen(true)} />
        )}

        {/* Banner — OCR-failure notice (couldn't read the file) takes priority over the summary */}
        {extractionFailed && failBannerOpen && (
          <ExtractionFailedBanner onReupload={onReupload} onDismiss={() => setFailBannerOpen(false)} />
        )}

        {/* Duplicate found — informational; the action lives in the dock ("Continue existing draft"). */}
        {isExtracted && existingInvoice && <DuplicateBanner />}

        {/* Customer — matched / unmatched (upload) or the selected card */}
        {!isExtracted ? (
          <EditCard
            title={name}
            description={email}
            hideAvatar
            role="button"
            onClick={onChangeCustomer}
            className="group cursor-pointer"
            trailing={
              <ChevronRightIcon
                className="transition-transform duration-200 group-hover:translate-x-1"
                style={{ fontSize: 16, color: "var(--icon-primary)" }}
              />
            }
          />
        ) : linked ? (
          /* Case A — auto-matched to an existing client (tap to change, chevron arrow) */
          <button
            type="button"
            onClick={() => setCustomerSheetOpen(true)}
            className="group w-full bg-white border border-dashed border-[rgba(160,160,160,0.2)] rounded-xl p-[17px] flex items-center gap-3 text-left cursor-pointer"
            style={{ boxShadow: "var(--shadow-card-soft)" }}
          >
            {/* Avatar removed for now (pending invoice-number confirmation) */}
            <div className="flex-1 min-w-0">
              <p className="card-title-2xs text-[#101828] truncate">{linked.name}</p>
              <p className="text-[12px] leading-[1.3] text-[#808080] truncate" style={FONT}>{linked.email}</p>
            </div>
            <ChevronRightIcon
              className="transition-transform duration-200 group-hover:translate-x-1"
              style={{ fontSize: 16, color: "var(--icon-primary)" }}
            />
          </button>
        ) : (
          /* Case B — no matching customer: fill details inline; the new client is saved to the
             customer list automatically on create (no opt-in checkbox). */
          <div ref={flaggedRef} className="scroll-mt-24 flex flex-col gap-3">
            {/* Customer name — warning highlight + caption when OCR couldn't read it */}
            <div className="flex flex-col gap-1">
              <TextInput
                label="Customer name"
                placeholder="Customer name"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                highlight={nameMissing}
              />
              {nameMissing && (
                <p className="text-[12px] leading-[1.4] text-[#b45309]" style={FONT}>
                  Couldn't extract this field. Enter it manually.
                </p>
              )}
            </div>

            {/* Email — warning highlight + caption when OCR couldn't read it */}
            <div className="flex flex-col gap-1">
              <TextInput
                label="Email address"
                type="email"
                placeholder="name@email.com"
                required
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                highlight={emailMissing}
              />
              {emailMissing && (
                <p className="text-[12px] leading-[1.4] text-[#b45309]" style={FONT}>
                  Couldn't extract this field. Enter it manually.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Invoice number — user-entered for uploads (DES-716) */}
        {isExtracted && (
          <div ref={invoiceNoRef} className="scroll-mt-20 flex flex-col gap-1">
            <TextInput
              label="Invoice Number"
              placeholder="e.g. UPL-2026-000042"
              required
              highlight={!!existingInvoice}
              value={editInvoiceNo}
              onChange={(e) => setEditInvoiceNo(e.target.value)}
              iconRight={
                existingInvoice ? (
                  <span
                    className="shrink-0 px-2 py-0.5 rounded-full bg-[#fff4ec] border border-[#ffd9c2] text-[10px] font-bold leading-[15px] text-[#b42318]"
                    style={FONT}
                  >
                    Already exists
                  </span>
                ) : numberRecommended ? (
                  <span
                    className="shrink-0 px-2 py-0.5 rounded-full bg-[#ebfcef] border border-[#a3e9b6] text-[10px] font-bold leading-[15px] text-[#006a1d]"
                    style={FONT}
                  >
                    Recommended
                  </span>
                ) : undefined
              }
            />
          </div>
        )}

        {/* Invoice details */}
        <Section title="Invoice Details">
          <div
            className="w-full bg-white rounded-xl overflow-hidden border border-dashed border-[rgba(160,160,160,0.2)]"
            style={{ boxShadow: "var(--shadow-card-soft)" }}
          >
            {details.map((d) => (
              <Item
                key={d.label}
                variant="dropdown"
                label={d.label}
                value={d.value}
                onClick={d.onClick}
                disabled={d.locked}
                readOnly={d.readOnly}
              />
            ))}
          </div>
        </Section>

        {/* Recurrence — schedule for the series (DES-782), only in recurring mode */}
        {isRecurring && (
          <Section title="Recurrence">
            <RecurrenceSection
              frequency={recFreq}
              startLabel={format(recStart, "d MMM yyyy")}
              endLabel={recEndLabel}
              onFrequency={() => setRecFreqOpen(true)}
              onStart={() => setRecStartOpen(true)}
              onEnd={() => setRecEndOpen(true)}
            />
          </Section>
        )}

        {/* Services / products */}
        <div ref={servicesRef} className="scroll-mt-5">
        <Section title="Services/Products">
          {services.length === 0 ? (
            <EditCard
              title="Add your services"
              description="Name it, set a quantity"
              hideAvatar
              role="button"
              aria-label="Add services"
              onClick={openAddService}
              className="group cursor-pointer"
              trailing={
                <ChevronRightIcon
                  className="transition-transform duration-200 group-hover:translate-x-1"
                  style={{ fontSize: 16, color: "var(--icon-primary)" }}
                />
              }
            />
          ) : (
            <div className="flex flex-col gap-2">
              {services.map((s, idx) => (
                <ServiceItemCard
                  key={s.id}
                  line={s}
                  invoiceCurrency={currency}
                  hint={hintFirst && idx === 0}
                  onClick={() => openEditService(s.id)}
                  onDelete={() => setServices((prev) => prev.filter((x) => x.id !== s.id))}
                />
              ))}
              <Button
                variant="secondary"
                size="md"
                iconLeft={<AddIcon />}
                className="w-full"
                onClick={openAddService}
              >
                Add Item
              </Button>
            </div>
          )}
        </Section>
        </div>

        {/* Discounts — appears once the first service is added */}
        {services.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
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
            />
          </motion.div>
        )}

        {/* Auto-send to customer (DES-782) — recurring only; sits below Discount. On generation, send
            automatically (→ Awaiting) or leave each invoice as a Draft to review. */}
        {isRecurring && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div
              className="w-full bg-white border border-dashed border-[rgba(160,160,160,0.2)] rounded-xl p-[17px] flex items-center justify-between gap-3"
              style={{ boxShadow: "var(--shadow-card-soft)" }}
            >
              <span className="min-w-0 flex flex-col gap-1">
                <span className="card-title-2xs text-[#1b1b1b]" style={FONT}>Auto-send to customer</span>
                <span className="body-sm-medium text-[#808080]" style={FONT}>
                  {recAutoSend ? "Send invoices automatically" : "Saved as a draft to review"}
                </span>
              </span>
              <Toggle checked={recAutoSend} onChange={setRecAutoSend} aria-label="Auto-send to customer" />
            </div>
          </motion.div>
        )}

        {/* Automated chaser (DES-764 AC5) — per-invoice toggle, seeded from the account default.
            Discount-card style; backend auto-deactivates it once the invoice is Paid (out of scope).
            Hidden in recurring mode — the Recurrence section's "Auto-send to customer" covers sending. */}
        {services.length > 0 && !isRecurring && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div
              className="w-full bg-white border border-dashed border-[rgba(160,160,160,0.2)] rounded-xl p-[17px] flex items-center justify-between gap-3"
              style={{ boxShadow: "var(--shadow-card-soft)" }}
            >
              <span className="min-w-0 flex flex-col gap-1">
                <span className="card-title-2xs text-[#1b1b1b]" style={FONT}>Automatic reminders</span>
                <span className="body-sm-medium text-[#808080]" style={FONT}>Email until invoice is paid</span>
              </span>
              <Toggle checked={chaser} onChange={setChaser} aria-label="Automatic reminders" />
            </div>
          </motion.div>
        )}

        {/* Summary — appears with the line items */}
        {services.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
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
      </div>

        {isRecurring ? (
          // Recurring series (DES-782): create schedules the first invoice; edit saves changes to the series.
          <ButtonDock
            type="single"
            overflow
            primaryLabel={editingSeries ? "Save changes" : "Create recurring series"}
            primaryDisabled={services.length === 0}
            onPrimary={() => onSend?.({ title: editingSeries ? "Recurring series updated" : "Recurring series created" }, recentSent)}
            homeIndicator
          />
        ) : isEditing ? (
          <ButtonDock
            type="single"
            overflow
            primaryLabel="Save"
            // Edit-existing-from-duplicate is still a draft — Save is always allowed (user can
            // leave at any time). The limited edit-from-detail flow keeps the items gate.
            primaryDisabled={services.length === 0 && !editExitToList}
            onPrimary={onEditSave}
            homeIndicator
          />
        ) : isExtracted && existingInvoice ? (
          // Duplicate number (match by number only): creating a copy is hard-blocked — the only
          // action is to open the existing invoice (or edit the number to a free one).
          <ButtonDock
            type="single"
            overflow
            primaryLabel={existingPrimaryLabel}
            onPrimary={() => onOpenExisting?.(existingInvoice)}
            homeIndicator
          />
        ) : isExtracted ? (
          <ButtonDock
            type="single"
            overflow
            primaryLabel="Create Invoice"
            primaryDisabled={!(linked || emailValid)}
            // Uploaded invoices are record-only by default (DES-716): issuing moves them
            // to Awaiting Payment (sending happened elsewhere). The toast confirms the record
            // action — the Awaiting Payment status is shown by the detail-page badge.
            onPrimary={() => onSend?.({ title: "Invoice created successfully" }, recentSent)}
            homeIndicator
          />
        ) : (
          <ButtonDock
            type="single"
            overflow
            primaryLabel="Send Invoice"
            primaryDisabled={services.length === 0}
            onPrimary={() => setSendSheetOpen(true)}
            homeIndicator
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
        onClose={() => setIssueSheetOpen(false)}
        onSelect={(d) => {
          setIssueDate(d);
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

      <ReceivingAccountSheet
        open={accountSheetOpen}
        value={accountId}
        onClose={() => setAccountSheetOpen(false)}
        onSelect={(id) => {
          setAccountId(id);
          setAccountSheetOpen(false);
        }}
        onUseExternal={() => setAccountSheetOpen(false)}
      />

      {/* Recurring-series pickers (DES-782) */}
      <BottomSheet open={recFreqOpen} title="Frequency" onClose={() => setRecFreqOpen(false)}>
        <div className="flex flex-col gap-2">
          {FREQUENCIES.map((f) => (
            <Tile key={f} title={f} selected={recFreq === f} onClick={() => { setRecFreq(f); setRecFreqOpen(false); }} />
          ))}
        </div>
      </BottomSheet>

      <BottomSheet open={recStartOpen} title="Start Date" onClose={() => setRecStartOpen(false)}>
        <Calendar value={recStart} disablePast onChange={(d) => { setRecStart(d); setRecStartOpen(false); }} />
      </BottomSheet>

      <BottomSheet open={recEndOpen} title="Ends" onClose={() => setRecEndOpen(false)}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Tile title="Never (until cancelled)" selected={recEnd.mode === "never"} onClick={() => { setRecEnd({ mode: "never" }); setRecEndOpen(false); }} />
            {[3, 6, 12].map((n) => (
              <Tile key={n} title={`After ${n} invoices`} selected={recEnd.mode === "count" && recEnd.count === n} onClick={() => { setRecEnd({ mode: "count", count: n }); setRecEndOpen(false); }} />
            ))}
          </div>

          {/* On a specific date — date-picker input (same style as the due-date custom date). */}
          <TextInput
            label="On a specific date"
            placeholder="dd/mm/yy"
            readOnly
            value={recEnd.mode === "date" ? format(recEnd.date, "d MMM yyyy") : ""}
            iconRight={<CalendarTodayIcon style={{ fontSize: 20 }} />}
            onClick={() => setRecEndDateOpen(true)}
          />
        </div>
      </BottomSheet>

      <BottomSheet open={recEndDateOpen} title="End Date" onClose={() => setRecEndDateOpen(false)}>
        <Calendar value={recEnd.mode === "date" ? recEnd.date : undefined} disablePast onChange={(d) => { setRecEnd({ mode: "date", date: d }); setRecEndDateOpen(false); setRecEndOpen(false); }} />
      </BottomSheet>

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
        onRemove={() => {
          setServices((prev) => prev.filter((s) => s.id !== editingId));
          setServicesSheetOpen(false);
          setEditingId(null);
        }}
      />

      <SendInvoiceSheet
        open={sendSheetOpen}
        customerName={name}
        customerEmail={email}
        // ✕ on the Delivery method page: the invoice isn't sent yet, so keep the user's
        // work as a draft (→ "Saved as draft" toast + invoice list), not discarded.
        onClose={() => { setSendSheetOpen(false); saveDraft(); }}
        onChangeCustomer={() => setCustomerSheetOpen(true)}
        onConfirm={(method) => {
          // All methods keep the Delivery method page mounted underneath and open instantly
          // (no transition): email review / share-link sheet / PDF preview overlay it.
          if (method === "email") setEmailReviewOpen(true);
          else if (method === "link") setShareLinkOpen(true); // marked Sent on generate
          else if (method === "pdf") setPdfPreviewOpen(true); // invoice preview, then download
        }}
      />

      {/* Email review — shown instantly over the (still-mounted) Delivery method page; no transition. */}
      {emailReviewOpen && (
        <div className="absolute inset-0 z-50">
          <ReviewEmail
            customerName={name}
            customerEmail={email}
            companyName={companyName}
            invoiceNo={invoiceNo}
            amountLabel={amountLabel}
            dueDateLabel={dueDateLabel}
            onBack={() => setEmailReviewOpen(false)}
            onSend={() => {
              setEmailReviewOpen(false);
              onSend?.({ title: "Invoice marked as sent" }, recentSent);
            }}
          />
        </div>
      )}

      <ShareLinkSheet
        open={shareLinkOpen}
        link={shareLink}
        // Marked Sent only if the link was actually copied/shared (option B).
        onSent={() => {
          setShareLinkOpen(false);
          onSend?.({ title: "Invoice marked as sent" }, recentSent);
        }}
        onDismiss={() => setShareLinkOpen(false)}
      />

      {/* Read-only summary of the existing (duplicate) invoice */}
      <ExistingInvoiceSheet open={existingViewOpen} invoice={existingInvoice} onClose={() => setExistingViewOpen(false)} />

      {/* Original uploaded file — preview overlay (shared component, rendered at page root). */}
      <FilePreviewOverlay open={filePreviewOpen} file={uploadedFile ?? null} onClose={() => setFilePreviewOpen(false)} />

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
            issueDateLabel={format(issueDate, "d MMM yyyy")}
            dueDateLabel={dueDateLabel}
            currency={currency}
            items={previewItems}
            subtotal={subtotal}
            discount={discountAmount}
            total={total}
            bank={(() => {
              const a = getAccount(accountId);
              return {
                holder: a?.holder ?? "Your Company Ltd",
                bankName: a?.bankName ?? "",
                number: a?.number ?? "",
                swift: a?.swift ?? "",
                currency: a?.currency ?? currency,
              };
            })()}
            status={{ label: "Pending", bg: "#fff7e6", border: "#fde68a", text: "#b45309" }}
            onBack={() => setPdfPreviewOpen(false)}
            onDownloaded={() => {
              setPdfPreviewOpen(false);
              onSend?.({ title: "Invoice marked as sent" }, recentSent);
            }}
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
    </div>
  );
}

export default AddInvoiceDetails;
