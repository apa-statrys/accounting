import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { addDays, format } from "date-fns";
import { Check, ChevronDown } from "lucide-react";
import { PageAppHeader } from "../../components/PageAppHeader";
import { PageHeader } from "../../ui/PageHeader";
import { HorizontalTabs } from "../../ui/HorizontalTabs";
import { Banner } from "../../ui/Banner";
import { BottomSheet } from "../../components/BottomSheet";
import { ButtonDock } from "../../components/ButtonDock";
import { ListCard } from "../../ui/ListCard";
import { ListRow } from "../../ui/ListRow";
import { Badge } from "../../ui/Badge";
import { NumberStepper } from "../../ui/NumberStepper";
import { TextArea } from "../../ui/TextArea";
import { TextField } from "../../ui/TextField";
import { Tile } from "../../ui/Tile";
import { Loading } from "../../ui/Loading";
import { SummaryDock } from "../../components/SummaryDock";
import { IssueDateSheet } from "../../components/IssueDateSheet";
import { Keyboard } from "../../components/Keyboard";
import { NumericKeypad } from "../../components/NumericKeypad";
import { CountryFlag } from "../../components/CountryFlag";
import { CURRENCY_COUNTRY } from "../../components/CurrencySheet";
import { FONT, INK, MUTED, initials } from "../../lib/theme";
import { scrollFieldIntoView } from "../../lib/scrollFieldIntoView";
import { focusFirstInvalidField } from "../../lib/focusFirstInvalidField";
import type { CreditNoteEditSeed, CreditNotePayload, DraftLine, InvoiceLine } from "../../types";
import { fmtAmount, lineAmount } from "./lineMath";
import { ReasonSheet } from "./ReasonSheet";
import { ClientEditSheet } from "./ClientEditSheet";
import { DueDateSheet } from "../../components/DueDateSheet";
import { ReceivingAccountSheet } from "../../components/ReceivingAccountSheet";
import { formatAccount, RECEIVING_ACCOUNTS } from "../../data/receivingAccounts";

interface CreditNoteFormProps {
  /** Generated credit-note number (own sequence, e.g. CN-2026-000001). */
  creditNoteNo: string;
  /** The invoice this credit note cancels/reduces — carried over and stored as the link. */
  invoiceNo: string;
  customerName: string;
  customerEmail: string;
  /** Same currency as the credited invoice (locked). */
  currency: string;
  /** Carried-over line items from the invoice; editable for a partial credit. */
  items: InvoiceLine[];
  /** Invoice total — for reference in the summary. */
  invoiceTotal: number;
  /** Amount already credited by OTHER credit notes (excludes the one being edited). */
  alreadyCredited: number;
  /** The cap — credited amount cannot exceed this. */
  outstanding: number;
  /** "edit" reopens an existing credit note (AC4): edit title/CTA, no demo create-failure, prefilled. */
  mode?: "create" | "edit";
  /** Edit seed — when present, the form restores this credit note's prior state. */
  initial?: CreditNoteEditSeed;
  /** Open the reason picker sheet as soon as this form mounts (the CN detail's empty "Reason" row
   *  jumps straight here + opens the picker, instead of landing on a blank form the client still
   *  has to hunt through to find the missing field). */
  autoOpenReason?: boolean;
  /** Refund context (DES-720, from a Paid invoice): refund-mode labels (cap = amount paid, "Refund amount"). */
  refund?: boolean;
  /** Overrides the primary CTA label in edit mode — e.g. "Apply to Invoice" when re-applying an applied note. */
  submitLabel?: string;
  onBack: () => void;
  /** Create or save the credit note. The (possibly edited) client info applies to THIS note only. */
  onCreate: (payload: CreditNotePayload) => void;
  /** When set, the back arrow saves the current form state as a Draft (DES-719) instead of discarding. */
  onSaveDraft?: (payload: CreditNotePayload) => void;
  /** Dev (PageControls): seed the form as if Create was already tapped with nothing filled in, so
   *  the Reason error + red Items asterisk show on mount instead of requiring a real empty submit. */
  devShowErrors?: boolean;
  /** Dev (PageControls): seed the first line's unit price above its original-amount cap, so the
   *  per-line "exceeds the original amount" error shows on mount. */
  devLineExceedsCap?: boolean;
}

/**
 * New Credit Note form (DES-719) — pre-filled from the invoice, all fields editable.
 * Full credit (= outstanding) cancels the invoice; partial reduces the amount due.
 * The credited amount cannot exceed the invoice's outstanding amount.
 */
export function CreditNoteForm({
  creditNoteNo,
  invoiceNo,
  customerName,
  customerEmail,
  currency,
  items,
  invoiceTotal,
  alreadyCredited,
  outstanding,
  mode = "create",
  initial,
  autoOpenReason = false,
  refund = false,
  submitLabel,
  onBack,
  onCreate,
  onSaveDraft,
  devShowErrors = false,
  devLineExceedsCap = false,
}: CreditNoteFormProps) {
  const isEdit = mode === "edit";
  const money = (n: number) =>
    `${currency} ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Client info — carried over from the invoice (or restored from the edited note); editable here only.
  const [name, setName] = useState(initial?.name ?? customerName);
  const [email, setEmail] = useState(initial?.email ?? customerEmail);
  const [clientSheetOpen, setClientSheetOpen] = useState(false);
  const [draftName, setDraftName] = useState(initial?.name ?? customerName);
  const [draftEmail, setDraftEmail] = useState(initial?.email ?? customerEmail);
  // Credit-note issue date — defaults to today (demo) or the edited note's date.
  const [issueDate, setIssueDate] = useState<Date>(initial?.issueDate ?? new Date(2026, 5, 26));
  const [issueDateOpen, setIssueDateOpen] = useState(false);
  // Due date — pre-fills from the credited invoice's term (DES-719), editable via the shared sheet.
  const [dueTerm, setDueTerm] = useState<string>("Next 30 days");
  const [dueOpen, setDueOpen] = useState(false);
  // Receiving account / payment method (DES-719 — editable before Create). Defaults to the primary
  // Statrys account; a chosen account survives a draft-resume via the payload/seed.
  const defaultAcct = RECEIVING_ACCOUNTS.find((a) => a.primary) ?? RECEIVING_ACCOUNTS[0];
  const [accountId, setAccountId] = useState<string>(initial?.accountId ?? defaultAcct.id);
  const [acctSheetOpen, setAcctSheetOpen] = useState(false);
  // Resolve "Next N days" against the issue date → "Next N Days (15 Jul 2026)"; a custom date is shown as-is.
  const dueLabel = (() => {
    const m = dueTerm.match(/^Next (\d+) days$/);
    if (m) return `Next ${m[1]} Days (${format(addDays(issueDate, +m[1]), "d MMM yyyy")})`;
    return dueTerm;
  })();
  // The resolved due date as a plain label ("26 Jul 2026") — persisted so the CN detail can show it.
  const dueDateLabel = (() => {
    const m = dueTerm.match(/^Next (\d+) days$/);
    if (m) return format(addDays(issueDate, +m[1]), "d MMM yyyy");
    const custom = new Date(dueTerm);
    return isNaN(custom.getTime()) ? format(addDays(issueDate, 30), "d MMM yyyy") : format(custom, "d MMM yyyy");
  })();
  // Required reason (dropdown, fixed enum — DES-719) + a required free-text Description (stored in
  // `reasonNote` for the payload / edit-seed). Restored on edit.
  const [reason, setReason] = useState(initial?.reason ?? "");
  const [reasonNote, setReasonNote] = useState(initial?.reasonNote ?? "");
  const [reasonSheetOpen, setReasonSheetOpen] = useState(autoOpenReason);
  // Collapse the items list to the first few; "Show more" reveals the rest.
  const [itemsExpanded, setItemsExpanded] = useState(false);
  const COLLAPSED_ITEMS = 3;
  // Refund mode stores the REFUND amount in `unitPrice` (0 = nothing refunded yet); credit mode stores
  // the corrected line amount (= original on open).
  // Both modes carry a real per-unit price + quantity, seeded at the full invoiced qty: credit starts
  // with nothing credited (corrected = original), refund starts at the full line refundable (reduce qty
  // or unit price for a partial refund).
  // Seed each line at the original per-unit price. For refund that's a FULL refund (its default); for
  // credit that's the un-corrected invoice = nothing credited yet (its Partial default). applyFull /
  // applyPartial adjust from here when the user switches tabs.
  const initLines = (): DraftLine[] =>
    items.map((it, i) => ({
      id: `cn-${i}`,
      name: it.name,
      unit: it.unit,
      qty: it.qty,
      // Dev (PageControls "Line exceeds cap"): bump the first line's unit price above its original —
      // seeds the per-line "exceeds the original amount" error on mount.
      unitPrice: devLineExceedsCap && i === 0 ? String(it.unitPrice * 1.5) : String(it.unitPrice),
      maxQty: it.qty,
      origAmount: it.amount,
    }));
  // Which refund input is focused (raw while editing; comma/2dp formatted when blurred).
  const [focusedLineId, setFocusedLineId] = useState<string | null>(null);
  // Per-line unit-price fields whose error can surface (blurred at least once, or a failed submit
  // — see `lineUnitError` below), same reveal-on-touch convention as RecordPaymentSheet's amount field.
  const [touchedUnitIds, setTouchedUnitIds] = useState<Set<string>>(new Set());
  // While the keypad is up, the content scroll is locked; a scroll gesture closes the keypad.
  const [scrollLocked, setScrollLocked] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeKeypad = () => {
    (document.activeElement as HTMLElement | null)?.blur?.();
    setFocusedLineId(null);
    setScrollLocked(false);
  };
  const [lines, setLines] = useState<DraftLine[]>(initial?.lines ?? initLines);
  // Refund only: Full (read-only lines, default on create) vs Partial (editable). Editing a refund CN
  // opens Partial so its saved lines stay editable. Ignored by the credit-note flow.
  const [fpMode, setFpMode] = useState<"full" | "partial">(isEdit ? "partial" : "full");

  // Autosave indicator (DES-719 — the CN is a saved draft): "Saving" on any edit, "Saved" once it settles.
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");
  const firstChange = useRef(true);
  useEffect(() => {
    if (firstChange.current) { firstChange.current = false; return; }
    setSaveState("saving");
    const t = setTimeout(() => setSaveState("saved"), 700);
    return () => clearTimeout(t);
  }, [name, email, issueDate, dueTerm, accountId, reason, reasonNote, lines]);

  // Two editing models, one engine:
  //  • CREDIT (corrected invoice): each line stores the CORRECTED amount in `unitPrice`; the credit is
  //    DERIVED = original − corrected.
  //  • REFUND: each line stores the REFUND amount directly in `unitPrice` (you already received the money,
  //    you're entering what to give back); "remaining after refund" = original − refund.
  const lineOriginal = (l: DraftLine) => l.origAmount ?? lineAmount(l);
  const lineCredit = (l: DraftLine) =>
    refund
      ? Math.min(lineAmount(l), lineOriginal(l)) // refund = qty × unit price, capped at the line's original
      : Math.max(0, lineOriginal(l) - lineAmount(l));
  const originalTotal = useMemo(() => lines.reduce((sum, l) => sum + lineOriginal(l), 0), [lines]);
  // Credit/Refund amount = sum of per-line credits; remaining = what the customer is left charged for.
  const credited = useMemo(() => lines.reduce((sum, l) => sum + lineCredit(l), 0), [lines]);
  const amountDue = Math.max(0, originalTotal - credited);
  const exceedsCap = credited > outstanding + 0.001;
  const isFull = Math.abs(credited - outstanding) < 0.001;

  // Per-line cap: the amount credited/refunded can never exceed what was invoiced, so the unit price
  // can never exceed the ORIGINAL unit price (original ÷ invoiced qty) — combined with the qty stepper
  // already capped at maxQty, that guarantees each line total (qty × unit price) stays ≤ the line's
  // original amount. Typing over the cap is no longer silently clamped (form-cta-validation, same
  // reveal-on-touch/submit convention as RecordPaymentSheet's amount field): the field just shows an
  // inline error, and the failed line blocks Create until it's fixed — see `lineUnitError`/`anyLineExceeds`.
  const unitCap = (l: DraftLine) => lineOriginal(l) / (l.maxQty || 1);
  const capStr = (cap: number) => (Number.isInteger(cap) ? String(cap) : cap.toFixed(2));
  const lineUnitExceeds = (l: DraftLine) => (Number(l.unitPrice) || 0) > unitCap(l) + 0.001;
  const anyLineExceeds = lines.some(lineUnitExceeds);

  // A reason is always required; the free-text Description below it is always OPTIONAL.
  const canCreate = credited > 0 && !exceedsCap && reason !== "" && !anyLineExceeds;

  // form-cta-validation: the CTA is always enabled; a failed click focuses the first invalid field
  // and reveals its inline error. `attempted` flips on the first failed submit (errors clear as fixed).
  // Dev (PageControls) can seed it true so the errors show on mount instead of requiring a real tap.
  const [attempted, setAttempted] = useState(devShowErrors || devLineExceedsCap);

  const scrollRef = useRef<HTMLDivElement>(null);

  // On-screen keyboard mock (Figma "IOS controls" = Keyboard) — shown while the Description
  // field is focused, same convention as every other real text entry point in the app. (Line-item
  // amounts use the separate NumericKeypad below, not this — different, numeric-only input.)
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const reasonInvalid = reason === "";
  const amountInvalid = credited <= 0.001; // nothing credited yet (exceedsCap has its own banner)
  const reasonError = attempted && reasonInvalid;
  const amountError = attempted && amountInvalid;
  const lineUnitError = (l: DraftLine) => (attempted || touchedUnitIds.has(l.id)) && lineUnitExceeds(l);

  const origUnitStr = (l: DraftLine) => capStr(lineOriginal(l) / (l.maxQty || 1));
  // Full: max credit for the mode — refund gives back the full per-unit price; credit corrects to 0.
  const applyFull = () => {
    setFpMode("full");
    setLines((prev) => prev.map((l) => ({ ...l, qty: l.maxQty, unitPrice: refund ? origUnitStr(l) : "0" })));
  };
  // Partial: start from the original line values (refund = full, edit down; credit = nothing credited yet).
  const applyPartial = () => {
    setFpMode("partial");
    setLines((prev) => prev.map((l) => ({ ...l, qty: l.maxQty, unitPrice: origUnitStr(l) })));
  };

  const setUnitPrice = (id: string, raw: string) =>
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, unitPrice: raw.replace(/[^0-9.]/g, "") } : l)));
  // Custom keypad → mutate the focused line's per-unit price (max one dot, max 2 decimals). Typing
  // over the original unit price is allowed — it just surfaces as an inline error (see `lineUnitError`).
  const keypadPress = (key: string) => {
    if (!focusedLineId) return;
    setLines((prev) => prev.map((l) => {
      if (l.id !== focusedLineId) return l;
      let v = l.unitPrice;
      if (key === ".") {
        if (v.includes(".")) return l;
        v = (v === "" ? "0" : v) + ".";
      } else {
        if (v.includes(".") && v.split(".")[1].length >= 2) return l; // cap at 2 decimals
        v = v + key;
      }
      return { ...l, unitPrice: v };
    }));
  };
  // Focus an amount field → open the keypad, scroll it into view, then lock scrolling once settled.
  const focusAmount = (id: string, el: HTMLElement) => {
    setFocusedLineId(id);
    setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
    setTimeout(() => setScrollLocked(true), 320);
  };
  // Leaving the field reveals its error (if any) from here on — same reveal-on-blur convention as
  // RecordPaymentSheet's amount field.
  const blurAmount = (id: string) => {
    setFocusedLineId(null);
    setScrollLocked(false);
    setTouchedUnitIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  };
  const keypadBackspace = () => {
    if (!focusedLineId) return;
    setLines((prev) => prev.map((l) => (l.id === focusedLineId ? { ...l, unitPrice: l.unitPrice.slice(0, -1) } : l)));
  };
  // Step qty up to the invoiced max, or down to 0 (0 = excluded, but the line stays so it can be re-added).
  const setQty = (id: string, qty: number) =>
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, qty } : l)));

  const openClientSheet = () => {
    setDraftName(name);
    setDraftEmail(email);
    setClientSheetOpen(true);
  };
  const saveClient = () => {
    setName(draftName.trim());
    setEmail(draftEmail.trim());
    setClientSheetOpen(false);
  };

  // Shared "Show more / Show less" expander for the Credit Items card.
  const showMoreBtn = (
    <button
      type="button"
      onClick={() => setItemsExpanded((v) => !v)}
      className="w-full flex items-center justify-center gap-1 py-3 border-t border-[rgba(160,160,160,0.18)]"
    >
      <span className="text-[13px] font-medium" style={{ ...FONT, color: INK }}>{itemsExpanded ? "Show less" : "Show more"}</span>
      <ChevronDown size={18} strokeWidth={1.67} color={INK} style={{ transform: itemsExpanded ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
    </button>
  );

  // The customer's credit-note document lists only the CREDITED amounts (original − corrected), i.e.
  // only the lines that actually changed — not the corrected invoice values.
  const buildPayload = (): CreditNotePayload => ({
    amount: Number(credited.toFixed(2)),
    name,
    email,
    // Per credited line: a clean quantity credit (same unit price, fewer units) carries qty + unitPrice
    // so the detail can show "qty × price"; anything else (a price cut, or refund) is a value reduction.
    lines: lines
      .map((l) => {
        const credit = lineCredit(l);
        if (!refund) {
          const maxQty = l.maxQty || 1;
          const origUnit = (l.origAmount ?? lineAmount(l)) / maxQty;
          const curUnit = Number(l.unitPrice) || 0;
          const creditedQty = maxQty - l.qty;
          if (Math.abs(curUnit - origUnit) < 0.001 && creditedQty > 0) {
            return { name: l.name, amount: credit, qty: creditedQty, unitPrice: origUnit };
          }
        }
        return { name: l.name, amount: credit };
      })
      .filter((l) => l.amount > 0.001),
    issueDateLabel: format(issueDate, "d MMM yyyy"),
    issueDate,
    dueDateLabel,
    reason,
    // Optional free-text description (any reason).
    reasonNote: reasonNote.trim(),
    draftLines: lines,
    accountId,
  });

  const handleCreate = () => {
    if (canCreate) { setAttempted(false); onCreate(buildPayload()); return; }
    // Failed submit → reveal inline errors and scroll to the first offender. The credited-amount
    // total has no single field to blame, so it scrolls to the Items section heading instead of a
    // specific row.
    setAttempted(true);
    if (reasonInvalid) {
      focusFirstInvalidField("cn-reason");
    } else if (anyLineExceeds) {
      focusFirstInvalidField(lines.filter(lineUnitExceeds).map((l) => `cn-line-${l.id}`));
    } else if (amountInvalid) {
      focusFirstInvalidField("cn-items");
    }
  };

  // Edit-mode Save always persists, incomplete or not (decided 2026-08-12, same rule as
  // AddInvoiceDetails' edit-invoice dock) — a Draft is never blocked from being saved mid-edit,
  // whether it's a resumed in-progress draft (onSaveDraft wired) or an existing register note (no
  // onSaveDraft — calls onCreate directly instead of the validated handleCreate, so it can't
  // silently finalize/apply the draft, just save the edit). Only the fresh "Create Credit Note"
  // action (handleCreate, isEdit=false) still requires completeness — CreditNoteDetailPage shows
  // what's still missing (Reason / Credited items) instead of refusing to save.
  const handleSave = () => (onSaveDraft ? onSaveDraft(buildPayload()) : onCreate(buildPayload()));

  // Back-tap confirm — same two patterns AddInvoiceDetails uses for Create/Edit Invoice:
  //  • A parent-provided onSaveDraft (fresh create, or resuming an existing draft from the invoice
  //    detail) always confirms with "Saved as draft" — unconditional, no dirty check, matching
  //    AddInvoiceDetails' own create/resume-draft back behavior.
  //  • No onSaveDraft (editing an existing register note directly, e.g. CreditNotesList) only
  //    confirms when something actually changed ("Unsaved changes?", Save/Cancel) — matching
  //    AddInvoiceDetails' editingIssuedInvoice dirty-gated confirm.
  const [savedDraftOpen, setSavedDraftOpen] = useState(false);
  const [unsavedOpen, setUnsavedOpen] = useState(false);
  const editBaselineRef = useRef({
    name, email, issueDateMs: issueDate.getTime(), dueTerm, accountId, reason, reasonNote, linesJson: JSON.stringify(lines),
  });
  const dirty =
    name !== editBaselineRef.current.name ||
    email !== editBaselineRef.current.email ||
    issueDate.getTime() !== editBaselineRef.current.issueDateMs ||
    dueTerm !== editBaselineRef.current.dueTerm ||
    accountId !== editBaselineRef.current.accountId ||
    reason !== editBaselineRef.current.reason ||
    reasonNote !== editBaselineRef.current.reasonNote ||
    JSON.stringify(lines) !== editBaselineRef.current.linesJson;
  // isEdit (not onSaveDraft) is the right discriminator — a fresh create ALSO gets onSaveDraft
  // wired (InvoiceDetailPage passes it either way), so onSaveDraft alone can't tell "brand new"
  // apart from "resuming an existing draft", but mode does (see the mode={draft ? "edit" : ...}
  // callers). Fresh create → unconditional "Saved as draft"; any edit session (resumed draft OR
  // an existing register note) → dirty-gated "Unsaved changes?", matching AddInvoiceDetails.
  const handleBack = () => {
    if (!isEdit) setSavedDraftOpen(true);
    else if (dirty) setUnsavedOpen(true);
    else onBack();
  };

  // Summary breakdown rows — same recipe as components/SummaryCard's own Row (body-sm/body-sm-bold,
  // border-neutral-primary divider, py-2.5), shared between the inline "Summary" card below and the
  // sticky SummaryDock's expandable panel (its collapsed footer shows the final headline figure
  // instead) so the two never drift apart.
  const summaryRows = refund ? (
    <>
      <div className="flex items-center justify-between py-2.5 border-b border-[var(--border-neutral-primary)]">
        <span className="body-sm" style={{ ...FONT, color: MUTED }}>Original paid amount</span>
        <span className="body-sm" style={{ ...FONT, color: INK }}>{money(invoiceTotal)}</span>
      </div>
      <div className="flex items-center justify-between py-2.5">
        <span className="body-sm-bold" style={{ ...FONT, color: INK }}>Total refund</span>
        <span className="body-sm-bold" style={{ ...FONT, color: "var(--text-error-primary)" }}>−{money(credited)}</span>
      </div>
    </>
  ) : (
    <>
      <div className="flex items-center justify-between py-2.5 border-b border-[var(--border-neutral-primary)]">
        <span className="body-sm" style={{ ...FONT, color: MUTED }}>{alreadyCredited > 0.001 ? "Current balance" : "Invoice Total"}</span>
        <span className="body-sm" style={{ ...FONT, color: INK }}>{money(invoiceTotal)}</span>
      </div>
      <div className="flex items-center justify-between py-2.5 border-b border-[var(--border-neutral-primary)]">
        <span className="body-sm" style={{ ...FONT, color: MUTED }}>Credit Amount</span>
        <span className="body-sm" style={{ ...FONT, color: "var(--text-error-primary)" }}>−{money(credited)}</span>
      </div>
      <div className="flex items-center justify-between py-2.5">
        <span className="body-sm-bold" style={{ ...FONT, color: INK }}>Amount Due</span>
        <span className="body-sm-bold" style={{ ...FONT, color: INK }}>{money(amountDue)}</span>
      </div>
    </>
  );

  // Optional free-text description (any reason) — rendered right below Reason in both flows.
  const descriptionBlock = (
    <TextArea
      label="Description"
      value={reasonNote}
      onChange={setReasonNote}
      onFocus={(e) => { setKeyboardOpen(true); scrollFieldIntoView(e.currentTarget); }}
      onBlur={() => setKeyboardOpen(false)}
      placeholder={`Add a note about this ${refund ? "refund" : "credit note"}`}
      rows={3}
    />
  );

  return (
    <div className="absolute inset-0 z-50 bg-[var(--bg-neutral-tertiary)] rounded-[48px] overflow-hidden flex flex-col" style={{ width: 375, height: 812 }}>
      <div
        ref={scrollRef}
        className={`flex-1 thin-scrollbar ${scrollLocked ? "overflow-hidden" : "overflow-y-auto"}`}
        onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
        onWheel={() => { if (focusedLineId) closeKeypad(); }}
        onTouchMove={() => { if (focusedLineId) closeKeypad(); }}
      >
        <PageAppHeader scrolled={scrolled}>
          <PageHeader
            type="center"
            // "Edit ..." whenever real prior data is being resumed (a saved draft OR an existing
            // register note) — same isEditing = !!initial rule AddInvoiceDetails uses for its own
            // "Edit invoice" vs "Create Invoice" title, decoupled from `mode` (mode only controls
            // the sticky-CTA-vs-⋯-menu split below). Before this fix, resuming a Draft from the
            // invoice detail always read "New Credit Note"/"New Refund" — confusing, since it's
            // actually continuing an existing draft, not starting a fresh one.
            title={initial ? (refund ? "Edit Refund" : "Edit Credit Note") : refund ? "New Refund" : "New Credit Note"}
            onBack={handleBack}
            // No ⋯ menu in edit mode anymore — Save/Cancel live directly in a sticky dock instead
            // (below), same as AddInvoiceDetails' editingIssuedInvoice pattern, hidden until the
            // user actually changes something. showSearch stays false either way: an invisible
            // spacer for edit mode (nothing to show up here now), or to make room for create/
            // refund's own autosave chip via `right`.
            showSearch={false}
            right={
              !isEdit ? (
                // Figma "Create Invoice" header (node 1387-18223): the DS Loading spinner, not a
                // hand-rolled spinning border — same pattern as AddInvoiceDetails' autosave indicator.
                <span className="flex items-center gap-1.5 pr-1 text-[12px]" style={{ ...FONT, color: MUTED }} aria-live="polite">
                  {saveState === "saving"
                    ? <Loading size="xs" aria-label="Saving" />
                    : <Check size={15} strokeWidth={1.67} color="var(--icon-success-primary)" />}
                  {saveState === "saving" ? "Saving" : "Saved"}
                </span>
              ) : undefined
            }
          />
        </PageAppHeader>

        <div className={`px-4 pt-5 flex flex-col gap-4 ${focusedLineId ? "pb-[340px]" : keyboardOpen ? "pb-[380px]" : "pb-28"}`}>
        {/* Customer — carried over; tap to edit for this credit note only. Same "label + Tile" section
            shape as Create Invoice's own "Bill To" (AddInvoiceDetails). */}
        <div className="flex flex-col gap-2">
          <p className="body-sm-medium" style={{ ...FONT, color: INK }}>{refund ? "Refund To" : "Credit To"}</p>
          <Tile avatar={initials(name)} title={name} text={email} onClick={openClientSheet} />
        </div>

        {/* Details — Credit Issue Date / Due Date (editable) + Receiving Account + Currency (locked)
            + the related invoice, all DS ListCard/ListRow on the page's gray background (onLayer="gray")
            — same "label + ListCard" section shape as Create Invoice's own Invoice Details. */}
        <div className="flex flex-col gap-2">
          <p className="body-sm-medium" style={{ ...FONT, color: INK }}>Credit Details</p>
          <ListCard onLayer="gray">
            <ListRow label="Credit Issue Date" value={format(issueDate, "d MMM yyyy")} trailing="chevron" onClick={() => setIssueDateOpen(true)} />
            {/* Due Date shows for both credit + refund (defaults to Next 30 days). The Receiving Account
                row is cancellation-only — a refund CN's source account is chosen in the refund flow. */}
            <ListRow label="Due Date" value={dueLabel} trailing="chevron" onClick={() => setDueOpen(true)} />
            {!refund && (
              <ListRow label="Receiving Account" value={formatAccount(accountId)} trailing="chevron" onClick={() => setAcctSheetOpen(true)} />
            )}
            <ListRow label="Currency" value={currency} valueFlag={<CountryFlag name={CURRENCY_COUNTRY[currency]} size={16} />} />
            <ListRow label="Related Invoice" value={invoiceNo} last />
          </ListCard>
        </div>

        {/* Reason — required, chosen from the fixed enum in the sheet. DS TextField (dropdown),
            matching every other required-picker field in the app. */}
        <TextField
          type="dropdown"
          label="Reason For Credit"
          mandatory
          dataReq="cn-reason"
          value={reason}
          placeholder="Select a reason"
          error={reasonError}
          caption={reasonError ? `Please select a reason for this ${refund ? "refund" : "credit note"}.` : undefined}
          onClick={() => setReasonSheetOpen(true)}
        />

        {/* Description sits directly below Reason in both flows, above the items. */}
        {descriptionBlock}

        {/* Corrected invoice — edit each line to its CORRECT value; the credit is derived automatically. */}
        <div className="flex flex-col gap-2" data-req="cn-items">
          <div className="flex items-center justify-between gap-2">
            <p className="body-sm-medium" style={{ ...FONT, color: INK }}>
              {refund ? "Items to Refund" : "Items"} <span style={{ color: amountError ? "var(--text-error-primary)" : undefined }}>*</span>
            </p>
            {!refund && credited > 0 && (
              <Badge label={isFull ? "Full Credit" : "Partial Credit"} color={isFull ? "error" : "warning"} variant="text" size="sm" />
            )}
          </div>
          {/* Cross-line total (no single field to blame) — inline under the section heading + scrolled
              to on a failed submit, same as every other required-field error (form-cta-validation). */}
          {amountError && (
            <p className="text-[12px] -mt-1" style={{ ...FONT, color: "var(--text-error-primary)" }}>
              {refund
                ? "Set a quantity to refund on at least one item."
                : "Lower at least one item's amount to credit — the credit can't be zero."}
            </p>
          )}
          {/* Refund only: Full (read-only lines) vs Partial (editable). DS tab control. */}
          {refund && (
            <HorizontalTabs
              variant="button"
              tabs={["Full refund", "Partial refund"]}
              activeIndex={fpMode === "full" ? 0 : 1}
              onChange={(i) => { if (i === 0 && fpMode !== "full") applyFull(); else if (i === 1 && fpMode !== "partial") applyPartial(); }}
            />
          )}

          {refund && fpMode === "full" ? (
            /* Full refund → read-only line list, DS ListCard/ListRow on the page's gray background
               — same shape as Create Invoice's own Items card. */
            <ListCard onLayer="gray">
              {(itemsExpanded ? items : items.slice(0, COLLAPSED_ITEMS)).map((it, i, arr) => (
                <ListRow
                  key={i}
                  label={it.name}
                  description={`${it.qty} ${it.unit} · ${money(it.unitPrice)}`}
                  value={money(it.amount)}
                  last={i === arr.length - 1}
                />
              ))}
              {items.length > COLLAPSED_ITEMS && showMoreBtn}
            </ListCard>
          ) : (
          /* Per-line cards — Partial refund (editable) or credit mode (corrected values). */
          <div className="flex flex-col gap-3">
            {(itemsExpanded ? lines : lines.slice(0, COLLAPSED_ITEMS)).map((l, i) => (
              <div
                key={l.id}
                className="bg-[var(--bg-neutral-primary)] rounded-[var(--radius-3xl)] p-4 flex flex-col gap-3"
              >
                <p className="text-[14px] font-semibold leading-tight" style={{ ...FONT, color: INK }}>{i + 1}. {l.name}</p>

                {/* Original invoiced amount — read-only reference */}
                <div className="flex items-center justify-between">
                  <span className="text-[13px]" style={{ ...FONT, color: MUTED }}>Original amount</span>
                  <span className="text-[13px]" style={{ ...FONT, color: MUTED }}>{money(lineOriginal(l))}</span>
                </div>

                {/* Quantity + unit price — refund: how many units × price to give back; credit: the
                    corrected values. The per-line credit/refund is derived below. Unit price is the
                    same DS TextField "currency" type as every other currency-prefixed amount field
                    (AddServicesSheet's Unit Price) — inputMode="none" keeps the OS keyboard from
                    popping up since this page drives typing through its own NumericKeypad instead. */}
                <div className="flex items-start gap-3">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[12px]" style={{ ...FONT, color: MUTED }}>Quantity</span>
                    <NumberStepper value={l.qty} onChange={(qty) => setQty(l.id, qty)} min={0} max={l.maxQty} label="quantity" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <span className="text-[12px]" style={{ ...FONT, color: MUTED }}>Unit price</span>
                    <TextField
                      type="currency"
                      inputMode="none"
                      placeholder="0.00"
                      dataReq={`cn-line-${l.id}`}
                      value={focusedLineId === l.id ? l.unitPrice : l.unitPrice ? fmtAmount(Number(l.unitPrice) || 0) : ""}
                      error={lineUnitError(l)}
                      caption={lineUnitError(l) ? "Unit price exceeds the original amount" : undefined}
                      onFocus={(e) => focusAmount(l.id, e.currentTarget)}
                      onBlur={() => blurAmount(l.id)}
                      onChange={(v) => setUnitPrice(l.id, v)}
                      selectorLabel={currency}
                      selectorIcon={CURRENCY_COUNTRY[currency] && <CountryFlag name={CURRENCY_COUNTRY[currency]} size={20} />}
                    />
                  </div>
                </div>

                {/* Credit mode: derived per-line credit (Original − corrected). */}
                {!refund && lineCredit(l) > 0.001 && (
                  <div className="flex items-center justify-between border-t border-[var(--border-neutral-primary)] pt-2.5">
                    <span className="text-[13px]" style={{ ...FONT, color: MUTED }}>Credited</span>
                    <span className="text-[14px] font-medium" style={{ ...FONT, color: "var(--text-error-primary)" }}>−{money(lineCredit(l))}</span>
                  </div>
                )}
              </div>
            ))}
            {lines.length > COLLAPSED_ITEMS && showMoreBtn}
          </div>
          )}
        </div>

        {/* Summary — auto-derived; the user never types a total. Same card shell as Create Invoice's
            own Summary (components/SummaryCard tokens: white fill, radius-3xl, solid hairline
            dividers, restrained body-sm/body-sm-bold weights) — not the read-only detail page's
            bordered-gray card, since this is a form, same family as Create Invoice. */}
        <div className="flex flex-col gap-2">
          <p className="body-sm-medium" style={{ ...FONT, color: INK }}>
            {refund ? "Refund Summary" : "Summary"}
          </p>
          <div className="bg-[var(--bg-neutral-primary)] rounded-[var(--radius-3xl)] px-4 py-1 overflow-hidden">
            {summaryRows}
          </div>
        </div>

        {/* Validation — credited amount can't exceed the outstanding (shown inline by the amount) */}
        <AnimatePresence initial={false}>
          {exceedsCap && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <Banner
                color="error"
                text={`The ${refund ? "refund" : "credit"} can't exceed ${money(outstanding)} — lower the corrected amounts less.`}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {(() => {
          const helper = refund
            ? credited <= 0.001
              ? "Lower a line to its corrected value — the refund is calculated automatically."
              : isFull
              ? "This refunds the full amount paid."
              : ""
            : credited <= 0.001
            ? ""
            : isFull
            ? "This credits the full outstanding amount and cancels the invoice."
            : "A partial credit keeps the invoice awaiting payment with the amount due reduced.";
          return helper ? (
            <p className="px-1 text-[12px] leading-[1.4]" style={{ ...FONT, color: MUTED }}>{helper}</p>
          ) : null;
        })()}

        </div>
      </div>

      {/* Sticky total + primary button, tap-to-expand for the full breakdown — same
          components/SummaryDock pattern as Create Invoice's own sticky footer, not the older
          scroll-triggered ButtonDock `slot` this page used before. No `keyboard` prop here — with
          this many fields on one form, sliding the dock up above the keyboard on every focus/blur
          is too much motion; instead the Keyboard mock below overlays it in place (same idea as
          NumericKeypad already does for a focused unit price), so the dock never moves.
          Edit mode has no total dock — the inline Summary card above already shows the same
          totals — just a Save/Cancel dock, hidden until the user actually changes something
          (`dirty`), same as AddInvoiceDetails' editingIssuedInvoice pattern (no ⋯ menu anymore). */}
      {!isEdit ? (
        <SummaryDock
          amount={
            <span style={refund ? { color: "var(--text-error-primary)" } : undefined}>
              {refund ? "−" : ""}{money(refund ? credited : amountDue)}
            </span>
          }
          rows={summaryRows}
          primaryLabel="Create Credit Note"
          onPrimary={handleCreate}
        />
      ) : (
        dirty && (
          <ButtonDock
            type="double"
            sticky
            primaryLabel={submitLabel ?? "Save"}
            secondaryLabel="Cancel"
            onPrimary={handleSave}
            onSecondary={onBack}
            keyboard={keyboardOpen}
          />
        )
      )}

      {/* On-screen keyboard mock for the focused Description field — overlays the sticky dock
          above (higher z-index, same bottom anchor) instead of pushing it up. */}
      {keyboardOpen && (
        <div className="absolute inset-x-0 bottom-0 z-[60]">
          <Keyboard />
        </div>
      )}

      {/* Credit issue date picker */}
      <IssueDateSheet
        open={issueDateOpen}
        value={issueDate}
        onClose={() => setIssueDateOpen(false)}
        onSelect={(d) => { setIssueDate(d); setIssueDateOpen(false); }}
      />

      {/* Due date picker (DES-719) — shared with the invoice editor (30 / 60 / 90 days / custom). */}
      <DueDateSheet
        open={dueOpen}
        value={dueTerm}
        onClose={() => setDueOpen(false)}
        onSelect={(t) => { setDueTerm(t); setDueOpen(false); }}
      />

      {/* Receiving account picker (DES-719 — payment method, editable before Create). External bank
          account is out of scope for a credit note, so only Statrys accounts are offered. */}
      <ReceivingAccountSheet
        open={acctSheetOpen}
        value={accountId}
        hideExternal
        onClose={() => setAcctSheetOpen(false)}
        onSelect={(id) => { setAccountId(id); setAcctSheetOpen(false); }}
      />

      {/* Reason picker — required (DES-719). */}
      <ReasonSheet
        open={reasonSheetOpen}
        onClose={() => setReasonSheetOpen(false)}
        reason={reason}
        setReason={setReason}
      />

      {/* Edit client details — applies to this credit note only (not the invoice or client record) */}
      <ClientEditSheet
        open={clientSheetOpen}
        onClose={() => setClientSheetOpen(false)}
        draftName={draftName}
        draftEmail={draftEmail}
        setDraftName={setDraftName}
        setDraftEmail={setDraftEmail}
        onSave={saveClient}
      />

      {/* Custom numeric keypad — slides up while an amount field is focused (refund OR credit unit price).
          Demo stand-in for the OS keyboard a desktop web view can't show. */}
      {focusedLineId && (
        <NumericKeypad
          onPress={keypadPress}
          onBackspace={keypadBackspace}
          onDone={closeKeypad}
        />
      )}

      {/* Back-tap confirm (onSaveDraft flow only) — nothing is "lost", it's already saved as a draft:
          "Back to Invoice" continues that save + navigates away; "Delete Draft" discards instead
          (no draft persisted); "Keep editing" just dismisses. Same shape as AddInvoiceDetails' own
          "Saved as draft" sheet. */}
      <BottomSheet
        open={savedDraftOpen}
        title="Saved as draft"
        onClose={() => setSavedDraftOpen(false)}
        compact
        footer={
          <ButtonDock
            type="triple"
            primaryLabel="Back to Invoice"
            secondaryLabel="Delete Draft"
            tertiaryLabel="Keep editing"
            onPrimary={() => { setSavedDraftOpen(false); setTimeout(() => onSaveDraft?.(buildPayload()), 400); }}
            onSecondary={() => { setSavedDraftOpen(false); setTimeout(() => onBack(), 400); }}
            onTertiary={() => setSavedDraftOpen(false)}
          />
        }
      >
        <p className="body-sm" style={{ ...FONT, color: MUTED }}>
          This {refund ? "refund" : "credit note"} has been saved as a draft. You&rsquo;ll find it in the
          credit notes list, ready to edit and {refund ? "refund" : "apply"} whenever you are.
        </p>
      </BottomSheet>

      {/* Back-tap confirm (no onSaveDraft — editing an existing register note, dirty only): Save
          reuses the same handleSave the sticky dock's own Save button calls (never blocked by
          incompleteness); Cancel discards. Same shape as AddInvoiceDetails' own "Unsaved
          changes?" confirm. */}
      <BottomSheet
        open={unsavedOpen}
        title="Unsaved changes?"
        onClose={() => setUnsavedOpen(false)}
        compact
        footer={
          <ButtonDock
            type="double"
            primaryLabel="Save"
            secondaryLabel="Cancel"
            onPrimary={() => { setUnsavedOpen(false); handleSave(); }}
            onSecondary={() => { setUnsavedOpen(false); onBack(); }}
          />
        }
      >
        <p className="body-sm" style={{ ...FONT, color: MUTED }}>You have unsaved changes. Do you want to save them before leaving?</p>
      </BottomSheet>
    </div>
  );
}

export default CreditNoteForm;
