import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { addDays, format } from "date-fns";
import { Check, ChevronDown, Minus, Plus } from "lucide-react";
import { PageAppHeader } from "../../components/PageAppHeader";
import { PageHeader } from "../../ui/PageHeader";
import { HorizontalTabs } from "../../ui/HorizontalTabs";
import { Banner } from "../../ui/Banner";
import { ListCard } from "../../ui/ListCard";
import { ListRow } from "../../ui/ListRow";
import { TextArea } from "../../ui/TextArea";
import { TextField } from "../../ui/TextField";
import { Tile } from "../../ui/Tile";
import { Loading } from "../../ui/Loading";
import { ButtonDock } from "../../components/ButtonDock";
import { IssueDateSheet } from "../../components/IssueDateSheet";
import { NumericKeypad } from "../../components/NumericKeypad";
import { FONT, INK, MUTED, initials } from "../../lib/theme";
import { scrollFieldIntoView } from "../../lib/scrollFieldIntoView";
import { focusFirstInvalidField } from "../../lib/focusFirstInvalidField";
import { Toast } from "../../components/Toast";
import type { CreditNoteEditSeed, CreditNotePayload, DraftLine, InvoiceLine } from "../../types";
import { fmtAmount, formatDMY, lineAmount } from "./lineMath";
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
  /** Refund context (DES-720, from a Paid invoice): refund-mode labels (cap = amount paid, "Refund amount"). */
  refund?: boolean;
  /** Overrides the primary CTA label in edit mode — e.g. "Apply to Invoice" when re-applying an applied note. */
  submitLabel?: string;
  onBack: () => void;
  /** Create or save the credit note. The (possibly edited) client info applies to THIS note only. */
  onCreate: (payload: CreditNotePayload) => void;
  /** When set, the back arrow saves the current form state as a Draft (DES-719) instead of discarding. */
  onSaveDraft?: (payload: CreditNotePayload) => void;
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
  refund = false,
  submitLabel,
  onBack,
  onCreate,
  onSaveDraft,
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
  const [reasonSheetOpen, setReasonSheetOpen] = useState(false);
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
    items.map((it, i) => ({ id: `cn-${i}`, name: it.name, unit: it.unit, qty: it.qty, unitPrice: String(it.unitPrice), maxQty: it.qty, origAmount: it.amount }));
  // Which refund input is focused (raw while editing; comma/2dp formatted when blurred).
  const [focusedLineId, setFocusedLineId] = useState<string | null>(null);
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
  // A reason is always required; the free-text Description below it is always OPTIONAL.
  const canCreate = credited > 0 && !exceedsCap && reason !== "";

  // form-cta-validation: the CTA is always enabled; a failed click focuses the first invalid field
  // and reveals its inline error. `attempted` flips on the first failed submit (errors clear as fixed).
  const [attempted, setAttempted] = useState(false);
  // Amount-invalid has no single field to point at (a cross-line total) — surfaces as a toast instead.
  const [localToast, setLocalToast] = useState<string | null>(null);

  // Sticky dock's summary slot (same idea as Create Invoice, Figma node 1419-52781) — shown
  // until the real inline Summary card scrolls into view, since it'd be redundant once visible.
  const scrollRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const [summaryVisible, setSummaryVisible] = useState(false);
  useEffect(() => {
    const root = scrollRef.current;
    const target = summaryRef.current;
    if (!root || !target) return;
    // threshold 1 (not the default 0) — a sliver of the card peeking into view at the bottom
    // edge shouldn't count as "visible", or the sticky slot disappears before the user can
    // actually read the real card.
    const observer = new IntersectionObserver(([entry]) => setSummaryVisible(entry.isIntersecting), { root, threshold: 1 });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  // On-screen keyboard mock (Figma "IOS controls" = Keyboard) — shown while the Description
  // field is focused, same convention as every other real text entry point in the app. (Line-item
  // amounts use the separate NumericKeypad below, not this — different, numeric-only input.)
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const reasonInvalid = reason === "";
  const amountInvalid = credited <= 0.001; // nothing credited yet (exceedsCap has its own banner)
  const reasonError = attempted && reasonInvalid;
  const amountError = attempted && amountInvalid;

  // Per-line cap: the amount credited/refunded can never exceed what was invoiced, so the unit price
  // is capped at the ORIGINAL unit price (original ÷ invoiced qty). With the qty stepper already capped
  // at maxQty, this guarantees each line total (qty × unit price) stays ≤ the line's original amount.
  const unitCap = (l: DraftLine) => lineOriginal(l) / (l.maxQty || 1);
  const capStr = (cap: number) => (Number.isInteger(cap) ? String(cap) : cap.toFixed(2));
  const clampUnit = (l: DraftLine, v: string) => ((Number(v) || 0) > unitCap(l) + 0.001 ? capStr(unitCap(l)) : v);

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
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, unitPrice: clampUnit(l, raw.replace(/[^0-9.]/g, "")) } : l)));
  // Custom keypad → mutate the focused line's per-unit price (max one dot, max 2 decimals). A press that
  // would push the value over the original unit price clamps it back to that maximum (hard cap).
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
      return { ...l, unitPrice: clampUnit(l, v) };
    }));
  };
  // Focus an amount field → open the keypad, scroll it into view, then lock scrolling once settled.
  const focusAmount = (id: string, el: HTMLElement) => {
    setFocusedLineId(id);
    setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
    setTimeout(() => setScrollLocked(true), 320);
  };
  const blurAmount = () => { setFocusedLineId(null); setScrollLocked(false); };
  const keypadBackspace = () => {
    if (!focusedLineId) return;
    setLines((prev) => prev.map((l) => (l.id === focusedLineId ? { ...l, unitPrice: l.unitPrice.slice(0, -1) } : l)));
  };
  // Step qty up to the invoiced max, or down to 0 (0 = excluded, but the line stays so it can be re-added).
  const incQty = (id: string) =>
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, qty: Math.min(l.maxQty, l.qty + 1) } : l)));
  const decQty = (id: string) =>
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, qty: Math.max(0, l.qty - 1) } : l)));

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
    issueDateLabel: formatDMY(issueDate),
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
    // Failed submit → reveal inline errors. Reason is a real field (focus it); the credited-amount
    // total isn't (no single field to blame), so it surfaces as a toast instead.
    setAttempted(true);
    if (reasonInvalid) {
      focusFirstInvalidField("cn-reason");
    } else if (amountInvalid) {
      setLocalToast(
        refund
          ? "Set a quantity to refund on at least one item."
          : "Lower at least one item's amount to credit — the credit can't be zero."
      );
    }
  };

  // Back — save a Draft (DES-719) when the parent provides onSaveDraft (the create flow); else just leave.
  const handleBack = () => (onSaveDraft ? onSaveDraft(buildPayload()) : onBack());

  // Optional free-text description (any reason) — rendered below the summary in both flows.
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
            title={isEdit ? "Edit Credit Note" : refund ? "New Refund" : "New Credit Note"}
            onBack={handleBack}
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
            <ListRow label="Credit Issue Date" value={formatDMY(issueDate)} trailing="chevron" onClick={() => setIssueDateOpen(true)} />
            {/* Due Date shows for both credit + refund (defaults to Next 30 days). The Receiving Account
                row is cancellation-only — a refund CN's source account is chosen in the refund flow. */}
            <ListRow label="Due Date" value={dueLabel} trailing="chevron" onClick={() => setDueOpen(true)} />
            {!refund && (
              <ListRow label="Receiving Account" value={formatAccount(accountId)} trailing="chevron" onClick={() => setAcctSheetOpen(true)} />
            )}
            <ListRow label="Currency" value={currency} />
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

        {/* Credit note: description sits above the items (refund shows it below the summary). */}
        {!refund && descriptionBlock}

        {/* Corrected invoice — edit each line to its CORRECT value; the credit is derived automatically. */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <p className="body-sm-medium" style={{ ...FONT, color: INK }}>
              {refund ? "Items to Refund" : "Items"} <span style={{ color: amountError ? "var(--text-error-primary)" : undefined }}>*</span>
            </p>
            {!refund && credited > 0 && (
              <span
                className="px-2 py-0.5 rounded-full border text-[10px] font-bold leading-[15px]"
                style={
                  isFull
                    ? { ...FONT, background: "var(--bg-error-subtle)", borderColor: "var(--border-error-subtle)", color: "var(--text-error-primary)" }
                    : { ...FONT, background: "var(--bg-warning-subtle)", borderColor: "var(--border-warning-subtle)", color: "var(--text-warning-primary)" }
                }
              >
                {isFull ? "Full Credit" : "Partial Credit"}
              </span>
            )}
          </div>
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
                className="bg-white border border-[rgba(160,160,160,0.25)] rounded-xl p-4 flex flex-col gap-3"
                style={{ boxShadow: "var(--shadow-card-soft)" }}
              >
                <p className="text-[14px] font-semibold leading-tight" style={{ ...FONT, color: INK }}>{i + 1}. {l.name}</p>

                {/* Original invoiced amount — read-only reference */}
                <div className="flex items-center justify-between">
                  <span className="text-[13px]" style={{ ...FONT, color: MUTED }}>Original amount</span>
                  <span className="text-[13px]" style={{ ...FONT, color: MUTED }}>{money(lineOriginal(l))}</span>
                </div>

                {/* Quantity + unit price — refund: how many units × price to give back; credit: the
                    corrected values. The per-line credit/refund is derived below. */}
                <div className="flex items-end gap-3">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[12px]" style={{ ...FONT, color: MUTED }}>Quantity</span>
                    <div className="flex items-center rounded-lg border bg-white overflow-hidden" style={{ borderColor: "rgba(160,160,160,0.4)" }}>
                      <button type="button" onClick={() => decQty(l.id)} disabled={l.qty === 0} aria-label="Decrease quantity" className="w-9 h-10 flex items-center justify-center disabled:opacity-30">
                        <Minus size={16} strokeWidth={1.67} color={INK} />
                      </button>
                      <span className="w-8 text-center text-[14px] font-medium" style={{ ...FONT, color: INK }}>{l.qty}</span>
                      <button type="button" onClick={() => incQty(l.id)} disabled={l.qty >= l.maxQty} aria-label="Increase quantity" className="w-9 h-10 flex items-center justify-center disabled:opacity-30">
                        <Plus size={16} strokeWidth={1.67} color={INK} />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <span className="text-[12px]" style={{ ...FONT, color: MUTED }}>Unit price</span>
                    <div className="flex items-center gap-1 rounded-lg border px-3 h-10 bg-white" style={{ borderColor: "rgba(160,160,160,0.4)" }}>
                      <span className="text-[13px] shrink-0" style={{ ...FONT, color: MUTED }}>{currency}</span>
                      <input
                        inputMode="none"
                        value={focusedLineId === l.id ? l.unitPrice : l.unitPrice ? fmtAmount(Number(l.unitPrice) || 0) : ""}
                        placeholder="0.00"
                        onFocus={(e) => focusAmount(l.id, e.currentTarget)}
                        onBlur={blurAmount}
                        onChange={(e) => setUnitPrice(l.id, e.target.value)}
                        className="flex-1 min-w-0 text-right outline-none text-[15px] bg-transparent"
                        style={{ ...FONT, color: INK }}
                      />
                    </div>
                  </div>
                </div>

                {/* Credit mode: derived per-line credit (Original − corrected). */}
                {!refund && lineCredit(l) > 0.001 && (
                  <div className="flex items-center justify-between border-t border-[rgba(160,160,160,0.18)] pt-2.5">
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
        <div ref={summaryRef} className="flex flex-col gap-2">
          <p className="body-sm-medium" style={{ ...FONT, color: INK }}>
            {refund ? "Refund Summary" : "Summary"}
          </p>
          <div className="bg-[var(--bg-neutral-primary)] rounded-[var(--radius-3xl)] px-4 py-1 overflow-hidden">
            <div className="flex items-center justify-between py-2.5 border-b border-[var(--border-neutral-primary)]">
              {/* Refund: against the amount paid. Credit: against the (possibly already-reduced) balance. */}
              <span className="body-sm" style={{ ...FONT, color: MUTED }}>{refund ? "Original paid amount" : alreadyCredited > 0.001 ? "Current balance" : "Invoice Total"}</span>
              <span className="body-sm" style={{ ...FONT, color: INK }}>{money(invoiceTotal)}</span>
            </div>
            {refund ? (
              /* Total refund is the highlighted figure. */
              <div className="flex items-center justify-between py-2.5">
                <span className="body-sm-bold" style={{ ...FONT, color: INK }}>Total refund</span>
                <span className="body-sm-bold" style={{ ...FONT, color: "var(--text-error-primary)" }}>−{money(credited)}</span>
              </div>
            ) : (
              <>
                {/* Auto-calculated: Credit Amount = Original Total − Edited Total. */}
                <div className="flex items-center justify-between py-2.5 border-b border-[var(--border-neutral-primary)]">
                  <span className="body-sm" style={{ ...FONT, color: MUTED }}>Credit Amount</span>
                  <span className="body-sm" style={{ ...FONT, color: "var(--text-error-primary)" }}>−{money(credited)}</span>
                </div>
                {/* Amount Due = Edited Invoice Total. */}
                <div className="flex items-center justify-between py-2.5">
                  <span className="body-sm-bold" style={{ ...FONT, color: INK }}>Amount Due</span>
                  <span className="body-sm-bold" style={{ ...FONT, color: INK }}>{money(amountDue)}</span>
                </div>
              </>
            )}
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

        {/* Refund: description sits below the summary. */}
        {refund && descriptionBlock}
        </div>
      </div>

      <ButtonDock
        type="single"
        sticky
        slot={
          !summaryVisible ? (
            <div className="flex flex-col">
              <div className="flex items-start justify-between gap-4 py-2.5">
                <span className="body-sm text-[var(--text-secondary)]">
                  {refund ? "Original paid amount" : alreadyCredited > 0.001 ? "Current balance" : "Invoice Total"}
                </span>
                <span className="body-sm text-[var(--text-primary)]">{money(invoiceTotal)}</span>
              </div>
              {!refund && (
                <div className="flex items-start justify-between gap-4 py-2.5 border-b border-[rgba(208,208,208,0.4)]">
                  <span className="body-sm text-[var(--text-secondary)]">Credit Amount</span>
                  <span className="body-sm text-[var(--text-error-primary)]">−{money(credited)}</span>
                </div>
              )}
              <div className="flex items-center justify-between gap-4 py-3">
                <span className="body-sm-bold text-[var(--text-primary)]">{refund ? "Total refund" : "Amount Due"}</span>
                <span className={`body-sm-bold ${refund ? "text-[var(--text-error-primary)]" : "text-[var(--text-primary)]"}`}>
                  {refund ? "−" : ""}{money(refund ? credited : amountDue)}
                </span>
              </div>
            </div>
          ) : undefined
        }
        primaryLabel={isEdit ? (submitLabel ?? "Save changes") : "Create Credit Note"}
        onPrimary={handleCreate}
        keyboard={keyboardOpen}
      />

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

      {/* Credited-total validation failure — no single field to blame, so it's a toast (form-cta-validation). */}
      <Toast open={!!localToast} message={localToast ?? ""} variant="error" onDone={() => setLocalToast(null)} />
    </div>
  );
}

export default CreditNoteForm;
