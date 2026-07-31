import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "motion/react";
import { FilePreviewOverlay } from "../../components/UploadedFile";
import { FileItemBase } from "../../ui/FileItemBase";
import CheckIcon from "@mui/icons-material/Check";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { PageAppHeader } from "../../components/PageAppHeader";
import { PageHeader } from "../../ui/PageHeader";
import { Loading } from "../../ui/Loading";
import { Tile } from "../../ui/Tile";
import { ListCard } from "../../ui/ListCard";
import { ListRow } from "../../ui/ListRow";
import { ButtonDock } from "../../components/ButtonDock";
import { TextField } from "../../ui/TextField";
import { Badge } from "../../ui/Badge";
import { ServiceItemCard } from "../../components/ServiceItemCard";
import { DiscountCard, type DiscountMode } from "../../components/DiscountCard";
import { DiscountModeSheet } from "../../components/DiscountModeSheet";
import { SummaryCard } from "../../components/SummaryCard";
import { SendInvoiceSheet } from "../../components/SendInvoiceSheet";
import { InvoicePreviewPage } from "../shared/InvoicePreviewPage";
import { BankInfoSheet } from "../../components/BankInfoSheet";
import { CustomerSheet } from "../../components/CustomerSheet";
import { CURRENCIES, CURRENCY_COUNTRY, CurrencySheet } from "../../components/CurrencySheet";
import { CountryFlag } from "../../components/CountryFlag";
import { Toggle } from "../../ui/Toggle";
import { DueDateSheet } from "../../components/DueDateSheet";
import { IssueDateSheet } from "../../components/IssueDateSheet";
import { BottomSheet, stepSlide } from "../../components/BottomSheet";
import { Calendar } from "../../components/Calendar";
import { FREQUENCIES, type Frequency, nextDates } from "./recurrence";
import { ReceivingAccountSheet } from "../../components/ReceivingAccountSheet";
import { AddServicesSheet } from "../../components/AddServicesSheet";
import { CUSTOMERS } from "../../data/customers";
import { EXISTING_INVOICES } from "../../data/extraction";
import { formatAccount, getAccount } from "../../data/receivingAccounts";
import { convert } from "../../lib/currency";
import { EMAIL_RE } from "../../lib/format";
import { SHOW_RECURRING } from "../../lib/flags";
import { scrollFieldIntoView } from "../../lib/scrollFieldIntoView";
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
    recent?: { client: string; amount: string; status: "Awaiting" | "Draft" | "Paid"; meta: string; recurring?: boolean }
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
  /** Sender company email (from Invoice Settings) — the Cc when "Send me a copy" is on. */
  companyEmail?: string;
  /** Account default for the automated-chaser toggle (DES-764 AC5) — seeds the per-invoice toggle. */
  defaultChaser?: boolean;
  /** Default receiving account id (DES-764 Payment Method) — seeds the invoice's Receiving Account. */
  defaultAccountId?: string;
  /** Recurring-series setup (DES-782): shows the Recurrence section + schedule instead of a one-off issue. */
  recurring?: boolean;
  /** Editing an existing series (DES-782 AC4) — recurring form with a "Save changes" CTA. */
  editingSeries?: boolean;
  /** Locked-period demo (DES-751): seed the Issue Date, open its calendar on mount, disable dates
   *  before `issueMinDate`, show `issueSheetHelper` inside the calendar sheet, and (if `lockIssueSheet`)
   *  prevent dismissing the sheet by tapping ✕/scrim (a valid date must be picked to proceed). */
  seedIssueDate?: Date;
  autoOpenIssueSheet?: boolean;
  issueMinDate?: Date;
  issueSheetHelper?: string;
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
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="w-full flex flex-col gap-2">
      <p className="body-sm-medium text-[var(--text-primary)]">
        {title}
      </p>
      {children}
    </div>
  );
}

/** Radio indicator — 26px ring; brand-filled dot when selected (used by the "Ends Recurring" sheet). */
function RadioDot({ selected }: { selected: boolean }) {
  return (
    <span
      className="shrink-0 rounded-full flex items-center justify-center"
      style={{ width: 26, height: 26, border: `2px solid ${selected ? "#ff4a15" : "#cdcfd0"}` }}
    >
      {selected && <span className="rounded-full" style={{ width: 12, height: 12, background: "var(--bg-brand-primary)" }} />}
    </span>
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
  companyEmail = "hello@lumenstudio.co",
  defaultChaser = true,
  defaultAccountId = "personal",
  recurring = false,
  editingSeries = false,
  seedIssueDate,
  autoOpenIssueSheet = false,
  issueMinDate,
  issueSheetHelper,
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
  // OCR read nothing — banner stays until dismissed; the form starts blank.
  const [failBannerOpen, setFailBannerOpen] = useState(true);
  // `initial` means we opened the form to edit an existing invoice (from the detail page).
  const isEditing = !!initial;
  // NB: an issued-invoice edit (Awaiting/Overdue, `initial.limited`) no longer restricts the form —
  // updated story: every field is editable except the auto-generated invoice number (not on this form)
  // and the client identity (locked via the customer tile below, for any edit). So there's no separate
  // "locked edit" branch anymore; the form behaves like a create except the client tile is read-only.
  // Recurring-series setup (DES-782): a per-invoice "Recurring Invoice" toggle (below Invoice Details)
  // turns a one-off into a series and reveals the schedule. Shown on a fresh create AND when editing a
  // scheduled recurring draft (combined content + schedule edit) — but never for uploads or a normal edit.
  const [recurringOn, setRecurringOn] = useState(recurring && !isExtracted);
  const isRecurring = editingSeries || (recurringOn && !isExtracted);
  // The recurring card shows on a fresh create, or when editing a recurring draft (isEditing && recurring).
  // Gated off for prod (SHOW_RECURRING).
  const canToggleRecurring = SHOW_RECURRING && !isExtracted && !editingSeries && (!isEditing || recurring);

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
  const showIssueToday = !isExtracted && !isEditing && !isRecurring && !seedIssueDate && !issuePlaceholder && !issueChanged;
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
  // "Use Other Bank Accounts" card-details sheet (opened from the receiving-account sheet).
  const [otherBankOpen, setOtherBankOpen] = useState(false);
  // Confirmed external card's last 4 digits — the receiving account shows "Visa (..1234)".
  // A Statrys account pick clears it. Prototype-only: resets with the editor.
  const [externalCardLast4, setExternalCardLast4] = useState<string | null>(null);

  // Recurring-series setup (DES-782) — only surfaced when `recurring`.
  const [recFreq, setRecFreq] = useState<Frequency>("Monthly");
  // Default the series start to the invoice's issue date, but never in the past — DES-782 requires a
  // future start (the start picker also disables past dates). Falls back to today when the issue date
  // is already past.
  const [recStart, setRecStart] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return issueDate > today ? issueDate : today;
  });
  const [recEnd, setRecEnd] = useState<{ mode: "never" } | { mode: "count"; count: number } | { mode: "date"; date?: Date }>({ mode: "never" });
  // Free-form "max invoices" text for the Ends sheet (lets the user pick any count, not just presets).
  const [recMaxInput, setRecMaxInput] = useState("");
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
    onSaveDraft?.({ client: clientLabel, amount: draftAmount, meta: draftMeta });
  // Tapping back on a fresh create (never on an in-progress edit) confirms the auto-save with a
  // sheet instead of silently dropping the user onto the list — "Go to invoice list" continues
  // the existing saveDraft flow, "Keep editing" just dismisses and stays on this page.
  const [savedDraftSheetOpen, setSavedDraftSheetOpen] = useState(false);
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

  // Sticky dock's price-summary slot (Figma "Create Invoice", node 1419-52781) — shown until the
  // real inline Summary card scrolls into view, since it'd be redundant once the user can see it.
  const scrollRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const [summaryVisible, setSummaryVisible] = useState(false);
  useEffect(() => {
    const root = scrollRef.current;
    const target = summaryRef.current;
    if (!root || !target) {
      setSummaryVisible(false);
      return;
    }
    // threshold 1 (not the default 0) — a sliver of the card peeking into view at the bottom
    // edge shouldn't count as "visible", or the sticky slot disappears before the user can
    // actually read the real card.
    const observer = new IntersectionObserver(([entry]) => setSummaryVisible(entry.isIntersecting), { root, threshold: 1 });
    observer.observe(target);
    return () => observer.disconnect();
  }, [services.length > 0]);

  // On-screen keyboard mock (Figma "IOS controls" = Keyboard) — shown while the Discount amount
  // field is focused, same convention as every other real text entry point in the app.
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  // Items validation error (Send Invoice tapped with none added yet) — clears itself the moment
  // an item exists, not just on the next tap.
  const [itemsError, setItemsError] = useState(false);
  useEffect(() => {
    if (services.length > 0) setItemsError(false);
  }, [services.length]);

  // Upload review's Create Invoice CTA stays enabled (not silently disabled) — tapping it with
  // Customer name/email unfilled or an invalid email surfaces the error and scrolls to it, same
  // convention as the Items error above and guardIssueDate below. Clears itself once fixed, not
  // just on the next tap.
  const [customerFieldsError, setCustomerFieldsError] = useState(false);
  useEffect(() => {
    if (name.trim() && emailValid) setCustomerFieldsError(false);
  }, [name, emailValid]);
  const guardCustomerFields = () => {
    if (name.trim() && emailValid) return false;
    setCustomerFieldsError(true);
    setTimeout(() => flaggedRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
    return true;
  };

  // DES-718 send methods (Shareable Link / Download).
  const shareLink = `https://pay.statrys.com/i/${invoiceNo}`;

  // Line items in the invoice currency, for the PDF preview.
  const previewItems = toPreviewItems(services, currency);

  // Locked-period upload (DES-751): the OCR Issue Date sat in a closed period, so it must be
  // re-picked. Block the CTA while it's still the "Select issue date" placeholder — flag the row
  // red and scroll it into view. Returns true when blocked.
  const issueDateMissing = !!issuePlaceholder && !issuePicked;
  const guardIssueDate = () => {
    if (!issueDateMissing) return false;
    setIssueError(true);
    setTimeout(() => issueRowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
    return true;
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

  // Recurring series labels (DES-782). Each generated invoice gets its own issue/due date from the
  // schedule, so the one-off Issue/Due rows are hidden in recurring mode.
  // For a count-based end, show the date the series actually stops (the Nth invoice's date) with the
  // count in parens — so the user sees *when* it ends without counting periods themselves.
  const recEndLabel =
    recEnd.mode === "never" ? "Never (until cancelled)"
    : recEnd.mode === "count"
      ? (recEnd.count > 0
          ? `${format(nextDates(recStart, recFreq, recEnd.count)[recEnd.count - 1], "d MMM yyyy")} (${recEnd.count} ${recEnd.count === 1 ? "invoice" : "invoices"})`
          : "After a number of invoices")
    : recEnd.date ? format(recEnd.date, "d MMM yyyy") : "On a specific date";

  // Issued limited edit (Awaiting/Overdue) — updated story: ALL invoice fields are editable except the
  // auto-generated invoice number and the client identity (name/address/email). So the detail rows
  // (Currency, Issue Date, Due Date, Receiving Account) are editable exactly as in a fresh create; the
  // client stays locked separately (see the customer tile below), and the number never appears here.
  const details = [
    { label: "Currency", value: currencyLabel, onClick: () => setCurrencySheetOpen(true), locked: false, readOnly: false },
    ...(isRecurring
      ? []
      : [
          { label: "Issue Date", value: !issuePicked ? issuePlaceholder! : showIssueToday ? `Today (${format(issueDate, "d MMM yyyy")})` : format(issueDate, "d MMM yyyy"), onClick: () => setIssueSheetOpen(true), locked: false, readOnly: false, placeholder: !issuePicked },
          { label: "Due Date", value: dueRowLabel, onClick: () => setDueSheetOpen(true), locked: false, readOnly: false },
        ]),
    { label: "Receiving Account", value: externalCardLast4 ? `Visa (..${externalCardLast4})` : formatAccount(accountId), onClick: () => setAccountSheetOpen(true), locked: false, readOnly: false },
  ];

  return (
    <div
      className="relative bg-black rounded-[48px] overflow-hidden shadow-2xl"
      style={{ width: 375, height: 812 }}
    >
      {/* Page — stays in place; the open sheet dims it with its own scrim (no recede). */}
      <div className="absolute inset-0 flex flex-col bg-[var(--bg-beige-primary)] overflow-hidden rounded-[48px]">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto thin-scrollbar"
          onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
        >
        <PageAppHeader scrolled={scrolled}>
          {/* DS PageHeader (center) — the back chevron plays the old ✕/back role (create flows save a
              draft on exit); the autosave chip lives in the header's custom right slot. */}
          <PageHeader
            type="center"
            title={headerTitle ?? (editingSeries ? "Edit recurring series" : isRecurring ? (isEditing ? "Edit invoice" : "New Recurring Invoice") : isEditing ? "Edit invoice" : "Create Invoice")}
            onBack={lockActions || lockExceptIssueDate ? () => {} : isEditing && !editExitToList ? onEditBack : onSaveDraft ? () => setSavedDraftSheetOpen(true) : onClose}
            right={
              // Figma "Create Invoice" header (node 1387-18223): the DS Loading spinner, not a
              // hand-rolled spinning border — "Saved" keeps the existing check (Figma's own mock
              // only shows the "Saving" state).
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
          {/* Custom top banner (e.g. the locked-period alert) — replaces the OCR coverage banner. */}
          {topBanner}


        {/* Duplicate found — shown at the very top, above the uploaded-file preview. */}
        {isExtracted && existingInvoice && <DuplicateBanner />}

        {/* Extraction coverage — only when a field couldn't be read (OCR-missing case). */}
        {isExtracted && !extractionFailed && !topBanner && fieldsNeedAttention > 0 && (
          <CoverageBanner fieldsExtracted={fieldsExtracted} fieldsTotal={fieldsTotal} />
        )}

        {/* Uploaded file (top) — what the user just uploaded; tap the row to preview the original,
            or Replace to pick a different file (same re-upload path as the OCR-failure banner's
            "Upload a clearer file" link). */}
        {isExtracted && uploadedFile && (
          <FileItemBase
            name={uploadedFile.name}
            size={`${(uploadedFile.size / 1024 / 1024).toFixed(1)} MB`}
            fileType={uploadedFile.name.split(".").pop()?.toLowerCase() ?? "file"}
            state="completed"
            action="replace"
            onClick={() => setFilePreviewOpen(true)}
            onReplace={onReupload}
          />
        )}

        {/* Banner — OCR-failure notice (couldn't read the file) takes priority over the summary */}
        {extractionFailed && failBannerOpen && (
          <ExtractionFailedBanner onReupload={onReupload} onDismiss={() => setFailBannerOpen(false)} />
        )}

        {/* Customer — matched / unmatched (upload) or the selected card */}
        <Section title="Bill To">
        {!isExtracted ? (
          isEditing ? (
            /* DES-817: Client (Customer) is not editable in Draft/after Send — locked once created.
               To change it the user must start a new invoice (or edit the client record). */
            <Tile title={name} text={email} avatar={initials(name)} avatarColor={avatarTint(name)} onLayer="beige" reserveTrailing={false} />
          ) : (
            /* DS Tile on the beige page — tap (chevron) reopens the customer picker. */
            <Tile title={name} text={email} avatar={initials(name)} avatarColor={avatarTint(name)} onLayer="beige" trailing="chevron" onClick={onChangeCustomer} />
          )
        ) : (
          /* Upload review (DES-716) — OCR extracts the customer name + email, so show them as
             pre-filled, editable fields (not a card). An unmatched client is saved to the customer
             list automatically on create; a missing field is flagged until supplied. */
          <div ref={flaggedRef} className="scroll-mt-24 flex flex-col gap-3">
            {/* Customer name — amber highlight + caption when OCR couldn't read it (proactive,
                shown from the moment the review opens); tapping Create Invoice while still empty
                escalates to a real (red) validation error instead — see guardCustomerFields. */}
            <div className="flex flex-col gap-1">
              <TextField
                label="Customer name"
                placeholder="Customer name"
                mandatory
                value={editName}
                onChange={setEditName}
                highlight={nameMissing && !customerFieldsError}
                error={customerFieldsError && !editName.trim()}
                onFocus={(e) => { setKeyboardOpen(true); scrollFieldIntoView(e.currentTarget); }}
                onBlur={() => setKeyboardOpen(false)}
              />
              {customerFieldsError && !editName.trim() ? (
                <p className="text-[12px] leading-[1.4] text-[var(--text-error-primary)]" style={FONT}>
                  Enter the customer name.
                </p>
              ) : (
                nameMissing && (
                  <p className="text-[12px] leading-[1.4] text-[var(--text-warning-primary)]" style={FONT}>
                    Couldn't extract this field. Enter it manually.
                  </p>
                )
              )}
            </div>

            {/* Email — amber highlight + caption when OCR couldn't read it (proactive); tapping
                Create Invoice while empty or an invalid format escalates to a real (red)
                validation error instead — see guardCustomerFields. */}
            <div className="flex flex-col gap-1">
              <TextField
                label="Email address"
                inputType="email"
                placeholder="name@email.com"
                mandatory
                value={editEmail}
                onChange={setEditEmail}
                highlight={emailMissing && !customerFieldsError}
                error={customerFieldsError && !emailValid}
                onFocus={(e) => { setKeyboardOpen(true); scrollFieldIntoView(e.currentTarget); }}
                onBlur={() => setKeyboardOpen(false)}
              />
              {customerFieldsError && !emailValid ? (
                <p className="text-[12px] leading-[1.4] text-[var(--text-error-primary)]" style={FONT}>
                  {editEmail.trim() ? "Enter a valid email address." : "Enter the email address."}
                </p>
              ) : (
                emailMissing && (
                  <p className="text-[12px] leading-[1.4] text-[var(--text-warning-primary)]" style={FONT}>
                    Couldn't extract this field. Enter it manually.
                  </p>
                )
              )}
            </div>
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

        {/* Recurring (DES-782) — sits directly under the customer. Discount-card pattern: a toggle header
            that expands the schedule fields inside the same card. Off by default; also shown (locked on)
            when editing an existing series. When on, Invoice Details hides Issue/Due (dates come from the
            schedule) and Automatic Reminders becomes Auto-send. */}
        {(canToggleRecurring || editingSeries) && (
          <div
            className="w-full bg-white border border-dashed border-[rgba(160,160,160,0.2)] rounded-xl p-[17px] flex flex-col gap-3"
            style={{ boxShadow: "var(--shadow-card-soft)" }}
          >
            {/* Header — the toggle only appears on a fresh create; in edit it's fixed on (can't be turned
                off), so the title just sits as a label. */}
            <div className="flex items-center justify-between">
              <span className="card-title-sm text-[#101828]" style={FONT}>Recurring Invoice</span>
              {!isEditing && !editingSeries && (
                <Toggle checked={isRecurring} onChange={setRecurringOn} aria-label="Recurring Invoice" />
              )}
            </div>

            {/* Body — schedule fields, revealed when on */}
            <AnimatePresence initial={false}>
              {isRecurring && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <ListCard>
                    <ListRow label="Frequency" value={recFreq} trailing="chevron" onClick={() => setRecFreqOpen(true)} />
                    <ListRow label="Start Date" value={format(recStart, "d MMM yyyy")} trailing="chevron" onClick={() => setRecStartOpen(true)} />
                    <ListRow label="Ends" value={recEndLabel} trailing="chevron" onClick={() => setRecEndOpen(true)} last />
                  </ListCard>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Invoice Schedule (DES-782) — recap of the recurring schedule; sits right under the Recurring
            Invoice card and appears as soon as the series is set up (start/ends both default when on). */}
        {isRecurring && (
          <div
            className="w-full rounded-[12px] p-[17px] flex flex-col gap-3"
            style={{ background: "#f8f8f9", border: "1px dashed rgba(160,160,160,0.2)" }}
          >
            <div className="flex items-center gap-2">
              <CalendarTodayIcon style={{ fontSize: 16, color: "var(--text-brand)" }} />
              <span className="card-title-sm text-[#101828]" style={FONT}>Invoice Schedule</span>
            </div>
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-2 py-2 items-start">
                <span className="text-[12px] font-medium uppercase leading-[1.3] text-[var(--text-secondary)]" style={FONT}>Starts</span>
                <span className="body-sm-medium text-[#101828]" style={FONT}>{format(recStart, "d MMM yyyy")}</span>
              </div>
              <div className="flex flex-col gap-2 py-2 items-end">
                <span className="text-[12px] font-medium uppercase leading-[1.3] text-[var(--text-brand)]" style={FONT}>Next Invoice</span>
                <span className="body-sm-medium text-[#101828]" style={FONT}>{format(nextDates(recStart, recFreq, 2)[1], "d MMM yyyy")}</span>
              </div>
            </div>
          </div>
        )}

        {/* Invoice details — Figma "Create Invoice" (node 1387-18118): ListCard/ListRow, value +
            description stacked (e.g. "Next 30 days" / "15 Jul 2026"), Currency gets a flag. Locked
            rows (limited edit, DES-817) stay dimmed with no chevron/tap, same semantics as before. */}
        <Section title="Invoice Details">
          <ListCard onLayer="beige">
            {details.map((d, i) => {
              const isIssueRow = d.label === "Issue Date";
              const rowError = isIssueRow && issueError && !issuePicked;
              // Unset Issue Date (placeholder mode) reads amber by default to signal it must be re-picked;
              // the required-field error escalates it to red once the CTA is tapped.
              const rowWarning = isIssueRow && !issuePicked && !rowError;
              return (
                <div key={d.label} ref={isIssueRow ? issueRowRef : undefined} className="scroll-mt-24" style={d.locked ? { opacity: 0.5 } : undefined}>
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
            /* DS Tile on the beige page — tap (chevron) opens the add-service sheet. Red border +
               caption when Send Invoice was tapped with no items yet (see `itemsError`). */
            <>
              <Tile
                title="Add your items"
                text="Name it, set a quantity"
                onLayer="beige"
                trailing="chevron"
                error={itemsError}
                onClick={openAddService}
              />
              {itemsError && (
                <p className="text-[12px] pt-1" style={{ ...FONT, color: "var(--text-error-primary)" }}>
                  You need to add an item
                </p>
              )}
            </>
          ) : (
            // ListCard of rows (Figma "Create Invoice", node 1826-15914) — "Add more items" is the
            // list's own trailing row, not a separate outlined button below it.
            <ListCard onLayer="beige">
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
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
              <ListRow label="Add more items" trailing="chevron" onClick={openAddService} last />
            </ListCard>
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

        {/* Auto-send to customer (DES-782) — the recurring counterpart of Automatic Reminders; appears
            once items are added. On generation, send automatically (→ Awaiting) or leave each as a Draft. */}
        <AnimatePresence>
          {services.length > 0 && isRecurring && (
            <motion.div
              key="auto-send"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.3 }}
            >
              {/* Bare title+description+toggle row (Figma "Create Invoice", node 1826-15914) — no
                  card chrome, matching the Discount/Automatic reminders rows below. */}
              <ListRow
                label="Auto-send to customer"
                description={recAutoSend ? "Send invoices automatically" : "Saved as a draft to review"}
                trailing="toggle"
                checked={recAutoSend}
                onCheckedChange={setRecAutoSend}
                last
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Automated chaser (DES-764 AC5) — per-invoice toggle, seeded from the account default.
            Bare title+description+toggle row (Figma "Create Invoice", node 1826-15914) — no card
            chrome. Backend auto-deactivates it once the invoice is Paid (out of scope).
            Hidden in recurring mode — the Recurrence section's "Auto-send to customer" covers sending. */}
        <AnimatePresence>
          {services.length > 0 && !isRecurring && (
            <motion.div
              key="automatic-reminders"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.3 }}
            >
              <ListRow
                label="Automatic reminders"
                description="Email until invoice is paid"
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
              <div ref={summaryRef}>
                <Section title="Summary">
                  <SummaryCard
                    currency={currency}
                    subtotal={subtotal}
                    discount={discountAmount}
                    total={total}
                  />
                </Section>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>

        {isRecurring ? (
          // Recurring (DES-782): create schedules the first invoice; a series edit saves the cadence; a
          // recurring-DRAFT edit (isEditing) saves the combined content + schedule and returns to the detail.
          <ButtonDock
            type="single"
            sticky
            primaryLabel={editingSeries || isEditing ? "Save changes" : "Create Invoice"}
            primaryDisabled={services.length === 0}
            onPrimary={
              isEditing && !editingSeries
                ? onEditSave
                : () =>
                    onSend?.(
                      { title: editingSeries ? "Recurring series updated" : "Recurring series created" },
                      // Editing a series updates the schedule only — no new invoice row. Creating one drops
                      // the first invoice into the list as Draft + Recurring badge. It's ALWAYS Draft at
                      // creation: the invoice is scheduled for a future date and hasn't been sent yet, so it
                      // can't be Awaiting — auto-send moves it to Awaiting on the scheduled date (backend).
                      editingSeries
                        ? undefined
                        : { ...recentSent, status: "Draft", recurring: true, meta: `— · Scheduled ${format(recStart, "d MMM yyyy")}` }
                    )
            }
            keyboard={keyboardOpen}
          />
        ) : isEditing ? (
          <ButtonDock
            type="single"
            sticky
            primaryLabel="Save"
            // Edit-existing-from-duplicate is still a draft — Save is always allowed (user can
            // leave at any time). The limited edit-from-detail flow keeps the items gate.
            primaryDisabled={services.length === 0 && !editExitToList}
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
            // Customer name/email unfilled or invalid surfaces the error on those fields instead
            // of the button just sitting disabled with no explanation (guardCustomerFields).
            // Uploaded invoices are record-only by default (DES-716): issuing moves them
            // to Awaiting Payment (sending happened elsewhere). The toast confirms the record
            // action — the Awaiting Payment status is shown by the detail-page badge.
            // Locked-period demo: an unset Issue Date shows the required-field error (guardIssueDate
            // scrolls + flags); once picked, lockActions keeps the CTA inert so it never lands.
            onPrimary={() => {
              if (guardCustomerFields()) return;
              if (guardIssueDate()) return;
              if (lockActions) return;
              onSend?.({ title: "Invoice created successfully" }, recentSent);
            }}
            keyboard={keyboardOpen}
          />
        ) : (
          // Always enabled (Figma "Create Invoice", node 1387-18118) — an empty items list no
          // longer blocks the button; tapping it with none surfaces the error on the Items Tile
          // instead of the button just sitting disabled with no explanation.
          <ButtonDock
            type="single"
            sticky
            slot={
              services.length > 0 && !summaryVisible ? (
                <SummaryCard bare currency={currency} subtotal={subtotal} discount={discountAmount} total={total} />
              ) : undefined
            }
            primaryLabel="Create Invoice"
            primaryLoading={sendPending}
            // Locked-period demo: the CTA stays visually enabled but tapping it goes nowhere.
            onPrimary={() => {
              if (lockActions) return;
              if (services.length === 0) {
                setItemsError(true);
                servicesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
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
          "Go to invoice list" saves this as a draft on the way out; "Discard" abandons it entirely
          (no draft ever created) and goes back to the list the same as the plain ✕/close;
          "Keep editing" (tertiary/ghost — least emphasis, it's just dismissing this sheet) resumes
          right where the user was, same as before this sheet existed. */}
      <BottomSheet
        open={savedDraftSheetOpen}
        title="Saved as draft"
        onClose={() => setSavedDraftSheetOpen(false)}
        compact
        footer={
          <ButtonDock
            type="triple"
            primaryLabel="Go to invoice list"
            secondaryLabel="Discard"
            tertiaryLabel="Keep editing"
            onPrimary={() => { setSavedDraftSheetOpen(false); saveDraft(); }}
            onSecondary={() => { setSavedDraftSheetOpen(false); onClose?.(); }}
            onTertiary={() => setSavedDraftSheetOpen(false)}
          />
        }
      >
        <p className="body-sm" style={{ ...FONT, color: MUTED }}>
          Invoice {invoiceNo} has been saved as a draft. You&rsquo;ll find it in your invoice list, ready to edit and send whenever you are.
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
          setExternalCardLast4(null); // a Statrys pick replaces the external card
          setAccountSheetOpen(false);
        }}
      />

      {/* Card-details sheet — back returns to the account sheet; Confirm lands on the editor
          with the receiving account showing "Visa (..1234)". */}
      <BankInfoSheet
        open={otherBankOpen}
        onBack={() => { setOtherBankOpen(false); setAccountSheetOpen(true); }}
        onClose={() => setOtherBankOpen(false)}
        onConfirm={(last4) => { setExternalCardLast4(last4); setOtherBankOpen(false); }}
      />

      {/* Recurring-series pickers (DES-782) */}
      <BottomSheet open={recFreqOpen} title="Select Frequency" onClose={() => setRecFreqOpen(false)}>
        <div className="flex flex-col gap-2">
          {FREQUENCIES.map((f) => (
            <Tile key={f} size="sm" title={f} selected={recFreq === f} trailing={recFreq === f ? "check" : "none"} onClick={() => { setRecFreq(f); setRecFreqOpen(false); }} />
          ))}
        </div>
      </BottomSheet>

      <BottomSheet open={recStartOpen} title="Select Start Date" onClose={() => setRecStartOpen(false)}>
        <Calendar value={recStart} disablePast onChange={(d) => { setRecStart(d); setRecStartOpen(false); }} />
      </BottomSheet>

      {/* "Select End Date" is a sub-level of THIS SAME sheet (header/content swap via
          `recEndDateOpen`), never a second sheet stacked on top of "Ends Recurring" — see
          memory: sub-level-drawer-same-sheet. */}
      <BottomSheet
        open={recEndOpen}
        title={recEndDateOpen ? "Select End Date" : "Ends Recurring"}
        centerTitle={recEndDateOpen}
        onBack={recEndDateOpen ? () => setRecEndDateOpen(false) : undefined}
        backLabel="Back to ends"
        onClose={() => { setRecEndOpen(false); setRecEndDateOpen(false); }}
        keyboardOpen={keyboardOpen}
        footer={recEndDateOpen ? undefined : (
          <ButtonDock
            type="single"
            primaryLabel="Confirm"
            primaryDisabled={(recEnd.mode === "count" && recEnd.count <= 0) || (recEnd.mode === "date" && !recEnd.date)}
            onPrimary={() => setRecEndOpen(false)}
            keyboard={keyboardOpen}
          />
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          {recEndDateOpen ? (
            <motion.div key="date" variants={stepSlide(1)} initial="closed" animate="open" exit="closed">
              <Calendar value={recEnd.mode === "date" ? recEnd.date : undefined} disablePast onChange={(d) => { setRecEnd({ mode: "date", date: d }); setRecMaxInput(""); setRecEndDateOpen(false); }} />
            </motion.div>
          ) : (
            <motion.div key="ends" variants={stepSlide(-1)} initial="closed" animate="open" exit="closed">
              <div className="flex flex-col gap-4">
                {/* Never */}
                <button
                  type="button"
                  onClick={() => { setRecEnd({ mode: "never" }); setRecMaxInput(""); }}
                  className="w-full min-h-[66px] flex items-center gap-3 rounded-[12px] bg-[var(--bg-neutral-secondary)] px-2 py-4 text-left"
                >
                  <RadioDot selected={recEnd.mode === "never"} />
                  <span className="card-title-sm text-[#101828]" style={FONT}>Never ( Run until you cancelled )</span>
                </button>

                {/* After a certain number of invoices — reveals a max-count field when selected */}
                <div className="w-full flex flex-col gap-3 rounded-[12px] bg-[var(--bg-neutral-secondary)] px-2 py-4">
                  <button
                    type="button"
                    onClick={() => { const n = parseInt(recMaxInput, 10); setRecEnd({ mode: "count", count: Number.isFinite(n) && n > 0 ? n : 0 }); }}
                    className="w-full flex items-center gap-3 text-left"
                  >
                    <RadioDot selected={recEnd.mode === "count"} />
                    <span className="card-title-sm text-[#101828]" style={FONT}>After a certain number of invoices</span>
                  </button>
                  {recEnd.mode === "count" && (
                    <div className="flex flex-col gap-1.5">
                      <TextField
                        placeholder="Enter max invoices"
                        inputMode="numeric"
                        value={recMaxInput}
                        onChange={(v) => {
                          const digits = v.replace(/\D/g, "");
                          setRecMaxInput(digits);
                          const n = parseInt(digits, 10);
                          setRecEnd({ mode: "count", count: Number.isFinite(n) && n > 0 ? n : 0 });
                        }}
                        onFocus={(e) => { setKeyboardOpen(true); scrollFieldIntoView(e.currentTarget); }}
                        onBlur={() => setKeyboardOpen(false)}
                      />
                      {recEnd.count > 0 && (
                        <span className="text-[12px] leading-[1.3]" style={{ ...FONT, color: MUTED }}>
                          Last invoice on {format(nextDates(recStart, recFreq, recEnd.count)[recEnd.count - 1], "d MMM yyyy")}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* On a specific date — reveals a date field when selected; tapping it opens the calendar */}
                <div className="w-full flex flex-col gap-3 rounded-[12px] bg-[var(--bg-neutral-secondary)] px-2 py-4">
                  <button
                    type="button"
                    onClick={() => setRecEnd({ mode: "date", date: recEnd.mode === "date" ? recEnd.date : undefined })}
                    className="w-full flex items-center gap-3 text-left"
                  >
                    <RadioDot selected={recEnd.mode === "date"} />
                    <span className="card-title-sm text-[#101828]" style={FONT}>On a specific date</span>
                  </button>
                  {recEnd.mode === "date" && (
                    <TextField
                      type="date-picker"
                      placeholder="dd/mm/yy"
                      value={recEnd.date ? format(recEnd.date, "d MMM yyyy") : ""}
                      onClick={() => setRecEndDateOpen(true)}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
        // ✕ on the Send Invoice page returns to the (still pre-filled) editor (user, 15/Jul) —
        // autosave already holds the work, so no draft toast / list redirect.
        onClose={() => setSendSheetOpen(false)}
        onSend={() => onSend?.({ title: "Invoice marked as sent" }, recentSent)}
        // Marked Sent only if the link was actually copied/shared (option B).
        onSent={() => onSend?.({ title: "Invoice marked as sent" }, recentSent)}
        onDownload={() => setPdfPreviewOpen(true)}
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
            status={{ label: "Pending", bg: "var(--bg-warning-subtle)", border: "var(--border-warning-subtle)", text: "var(--text-warning-primary)" }}
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
    </div>
  );
}

export default AddInvoiceDetails;
