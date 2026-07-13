import { useEffect, useMemo, useRef, useState } from "react";
import { addDays, format } from "date-fns";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import StatusBar from "../StatusBar";
import { SheetHeader, HeaderIconButton } from "../SheetHeader";
import { ButtonDock } from "../ButtonDock";
import { IssueDateSheet } from "../IssueDateSheet";
import { NumericKeypad } from "../NumericKeypad";
import { FONT, INK, MUTED } from "../../lib/theme";
import type { CreditNoteEditSeed, CreditNotePayload, DraftLine, InvoiceLine } from "../../types";
import { EMAIL_RE } from "../../lib/format";
import { fmtAmount, formatDMY, lineAmount } from "./lineMath";
import { ReasonSheet } from "./ReasonSheet";
import { ClientEditSheet } from "./ClientEditSheet";
import { DueDateSheet } from "../DueDateSheet";
import { ReceivingAccountSheet } from "../ReceivingAccountSheet";
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
  const initLines = (): DraftLine[] =>
    items.map((it, i) => ({ id: `cn-${i}`, name: it.name, unit: it.unit, qty: refund ? 1 : it.qty, unitPrice: refund ? "" : String(it.unitPrice), maxQty: it.qty, origAmount: it.amount }));
  // Which refund input is focused (raw while editing; comma/2dp formatted when blurred).
  const [focusedLineId, setFocusedLineId] = useState<string | null>(null);
  // While the keypad is up, the content scroll is locked; a scroll gesture closes the keypad.
  const [scrollLocked, setScrollLocked] = useState(false);
  const closeKeypad = () => {
    (document.activeElement as HTMLElement | null)?.blur?.();
    setFocusedLineId(null);
    setScrollLocked(false);
  };
  const [lines, setLines] = useState<DraftLine[]>(initial?.lines ?? initLines);

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
      ? Math.min(Math.max(0, Number(l.unitPrice) || 0), lineOriginal(l))
      : Math.max(0, lineOriginal(l) - lineAmount(l));
  const originalTotal = useMemo(() => lines.reduce((sum, l) => sum + lineOriginal(l), 0), [lines]);
  // Credit/Refund amount = sum of per-line credits; remaining = what the customer is left charged for.
  const credited = useMemo(() => lines.reduce((sum, l) => sum + lineCredit(l), 0), [lines]);
  const amountDue = Math.max(0, originalTotal - credited);
  const exceedsCap = credited > outstanding + 0.001;
  const isFull = Math.abs(credited - outstanding) < 0.001;
  // A reason is always required; the free-text Description is required only when the reason is "Other"
  // (DES-719 — dropdown + optional free text; "Other" needs a description to be meaningful).
  const needsNote = reason === "Other";
  const canCreate =
    credited > 0 && !exceedsCap && reason !== "" && (!needsNote || reasonNote.trim() !== "");

  const setUnitPrice = (id: string, raw: string) =>
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, unitPrice: raw.replace(/[^0-9.]/g, "") } : l)));
  // Refund mode: edit the refund amount directly, capped at the line's original amount.
  const setLineRefund = (id: string, raw: string) =>
    setLines((prev) => prev.map((l) => {
      if (l.id !== id) return l;
      const clean = raw.replace(/[^0-9.]/g, "");
      const orig = l.origAmount ?? lineAmount(l);
      return { ...l, unitPrice: (Number(clean) || 0) > orig ? String(orig) : clean };
    }));
  // Custom keypad → mutate the focused refund line's raw value (max one dot, max 2 decimals, capped).
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
      // Refund caps the line total at the original; credit mode (per-unit price) isn't capped here.
      const orig = l.origAmount ?? lineAmount(l);
      return { ...l, unitPrice: refund && (Number(v) || 0) > orig ? String(orig) : v };
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
  // Quick shortcuts for the focused line (keypad accessory bar). "Full" credits/refunds the whole line,
  // "Half" = 50%, "None" removes the credit. Works in both models: credit mode stores the CORRECTED
  // per-unit price (0 = full credit), refund mode stores the refund amount directly.
  const round2 = (n: number) => String(Math.round(n * 100) / 100);
  const applyLineShortcut = (portion: "full" | "half") => {
    if (!focusedLineId) return;
    setLines((prev) => prev.map((l) => {
      if (l.id !== focusedLineId) return l;
      const orig = l.origAmount ?? lineAmount(l);
      if (refund) {
        // Refund amount = full / half of the line's original.
        return { ...l, unitPrice: round2(portion === "full" ? orig : orig / 2) };
      }
      // Credit mode: reset to full quantity, then set the corrected per-unit price that yields the credit.
      const q = l.maxQty || 1;
      const correctedTotal = portion === "full" ? 0 : orig / 2;
      return { ...l, qty: q, unitPrice: round2(correctedTotal / q) };
    }));
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
  const clientDirty = draftName !== name || draftEmail !== email;
  const clientValid = draftName.trim().length > 0 && EMAIL_RE.test(draftEmail.trim());
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
      <KeyboardArrowDownIcon style={{ fontSize: 18, color: INK, transform: itemsExpanded ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
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
    // Only a free-text reason ("Other") carries a note; presets store none.
    reasonNote: needsNote ? reasonNote.trim() : "",
    draftLines: lines,
    accountId,
  });

  const handleCreate = () => {
    if (!canCreate) return;
    onCreate(buildPayload());
  };

  // Back — save a Draft (DES-719) when the parent provides onSaveDraft (the create flow); else just leave.
  const handleBack = () => (onSaveDraft ? onSaveDraft(buildPayload()) : onBack());

  return (
    <div className="absolute inset-0 z-50 bg-white rounded-[48px] overflow-hidden flex flex-col" style={{ width: 375, height: 812 }}>
      <StatusBar />

      <SheetHeader
        title={isEdit ? "Edit Credit Note" : refund ? "Refund with Credit Note" : "New Credit Note"}
        type="inside-page"
        state="fixed"
        leading={
          <HeaderIconButton aria-label="Back" onClick={handleBack}>
            <ChevronLeftIcon />
          </HeaderIconButton>
        }
        trailing={
          !isEdit && !refund ? (
            <span className="flex items-center gap-1.5 pr-1 text-[12px]" style={{ ...FONT, color: MUTED }}>
              {saveState === "saving"
                ? <span className="w-3.5 h-3.5 rounded-full border-2 border-[#e2e2e2] border-t-[#ff4a15] animate-spin" aria-hidden />
                : <span style={{ color: "#0f9d58" }}>✓</span>}
              {saveState === "saving" ? "Saving" : "Saved"}
            </span>
          ) : (
            <span className="w-[30px] h-[30px] block" aria-hidden />
          )
        }
      />

      <div
        className={`flex-1 thin-scrollbar bg-white px-4 flex flex-col gap-5 ${scrollLocked ? "overflow-hidden" : "overflow-y-auto"} ${focusedLineId ? "pb-[340px]" : "pb-28"}`}
        onWheel={() => { if (focusedLineId) closeKeypad(); }}
        onTouchMove={() => { if (focusedLineId) closeKeypad(); }}
      >
        {/* Beige zone (DES-719 UI) — CN title + details card + customer card + related invoice on #f9f5ea. */}
        <div className="-mx-4 px-4 pt-5 pb-5 bg-[#f9f5ea] flex flex-col gap-4">
          {/* CN number — page title */}
          <h1 className="text-[20px] font-bold leading-[1.1]" style={{ ...FONT, color: "#1b1b1b" }}>{creditNoteNo}</h1>

          {/* Details — Credit Issue Date / Due Date (editable) + Receiving Account + Currency (locked). */}
          <div className="rounded-[12px] bg-white border border-dashed border-[rgba(160,160,160,0.2)] overflow-hidden" style={{ boxShadow: "0px 4px 14px 0px rgba(226,220,203,0.3)" }}>
            <button type="button" onClick={() => setIssueDateOpen(true)} className="w-full flex items-center justify-between px-4 pt-4 pb-[17px] text-left border-b border-[rgba(160,160,160,0.2)]">
              <span className="text-[14px]" style={{ ...FONT, color: MUTED }}>Credit Issue Date</span>
              <span className="flex items-center gap-1.5">
                <span className="text-[14px] font-medium" style={{ ...FONT, color: "#101828" }}>{formatDMY(issueDate)}</span>
                <ChevronRightIcon style={{ fontSize: 16, color: "var(--icon-primary)" }} />
              </span>
            </button>
            <button type="button" onClick={() => setDueOpen(true)} className="w-full flex items-center justify-between px-4 pt-4 pb-[17px] text-left border-b border-[rgba(160,160,160,0.2)]">
              <span className="text-[14px]" style={{ ...FONT, color: MUTED }}>Due Date</span>
              <span className="flex items-center gap-1.5">
                <span className="text-[14px] font-medium" style={{ ...FONT, color: "#101828" }}>{dueLabel}</span>
                <ChevronRightIcon style={{ fontSize: 16, color: "var(--icon-primary)" }} />
              </span>
            </button>
            {/* Receiving account / payment method — editable before Create (DES-719), between Due Date
                and Currency. Tap to choose a Statrys account (external is out of scope for a CN). */}
            <button type="button" onClick={() => setAcctSheetOpen(true)} className="w-full flex items-center justify-between px-4 pt-4 pb-[17px] text-left border-b border-[rgba(160,160,160,0.2)]">
              <span className="text-[14px]" style={{ ...FONT, color: MUTED }}>Receiving Account</span>
              <span className="flex items-center gap-1.5 min-w-0">
                <span className="text-[14px] font-medium truncate" style={{ ...FONT, color: "#101828" }}>{formatAccount(accountId)}</span>
                <ChevronRightIcon style={{ fontSize: 16, color: "var(--icon-primary)" }} />
              </span>
            </button>
            <div className="w-full flex items-center justify-between px-4 pt-4 pb-[17px]">
              <span className="text-[14px]" style={{ ...FONT, color: MUTED }}>Currency</span>
              <span className="text-[14px] font-medium" style={{ ...FONT, color: MUTED }}>{currency}</span>
            </div>
          </div>

          {/* Related invoice — the link this credit note is stored against. */}
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-medium" style={{ ...FONT, color: MUTED }}>Related Invoice:</span>
            <span className="text-[14px] font-bold" style={{ ...FONT, color: "#1b1b1b" }}>{invoiceNo}</span>
          </div>

        </div>

        {/* Customer — carried over; tap to edit for this credit note only (no chevron, matches Figma).
            White zone, directly above Reason For Credit. */}
        <button type="button" onClick={openClientSheet} className="w-full text-left rounded-[12px] bg-white border border-dashed border-[rgba(160,160,160,0.2)] p-[17px]">
          <p className="text-[16px] font-medium leading-[0.95] tracking-[-0.8px]" style={{ ...FONT, color: "#101828" }}>{name}</p>
          <p className="text-[14px] font-medium leading-[1.3] mt-1.5" style={{ ...FONT, color: MUTED }}>{email}</p>
        </button>

        {/* Reason — white zone (DES-719). Required, chosen from the fixed enum in the sheet. */}
        <div className="flex flex-col gap-[7px] pt-1">
          <label className="text-[16px] font-medium leading-[1.3]" style={{ ...FONT, color: "#090a0a" }}>Reason For Credit <span style={{ color: "#dc2626" }}>*</span></label>
          <button
            type="button"
            onClick={() => setReasonSheetOpen(true)}
            className="w-full flex items-center justify-between rounded-[8px] border px-4 h-[48px] bg-white text-left"
            style={{ borderColor: "rgba(208,208,208,0.4)", boxShadow: "0px 4px 7px rgba(0,0,0,0.1)" }}
          >
            <span className="text-[16px] truncate" style={{ ...FONT, color: reason ? "#1b1b1b" : "#9ca3af" }}>
              {/* "Other" shows the user's free-text description on the main page, not the word "Other". */}
              {reason === "Other" ? (reasonNote.trim() || "Other") : (reason || "Select a reason")}
            </span>
            <KeyboardArrowDownIcon style={{ fontSize: 24, color: "#808080" }} />
          </button>
        </div>

        {/* Corrected invoice — edit each line to its CORRECT value; the credit is derived automatically. */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2 px-1">
            <p className="text-[12px] font-bold uppercase tracking-wide" style={{ ...FONT, color: "#a0a0a0" }}>{refund ? "Items to refund" : "Items"} <span style={{ color: "#b42318" }}>*</span></p>
            {credited > 0 && (
              <span
                className="px-2 py-0.5 rounded-full border text-[10px] font-bold leading-[15px]"
                style={
                  isFull
                    ? { ...FONT, background: "#fef2f2", borderColor: "#f5c6c0", color: "#b42318" }
                    : { ...FONT, background: "#fff7e6", borderColor: "#fde68a", color: "#b45309" }
                }
              >
                {isFull ? "Full Credit" : "Partial Credit"}
              </span>
            )}
          </div>
          {/* Per-line cards — edit each line to its CORRECTED value; Original / Corrected / Credited are
              shown explicitly so the derivation is legible (the credit is never typed directly). */}
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

                {refund ? (
                  <>
                    {/* Refund amount — entered directly (you already received the money) */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[12px]" style={{ ...FONT, color: MUTED }}>Refund amount</span>
                      <div className="flex items-center gap-1 rounded-lg border px-3 h-10 bg-white" style={{ borderColor: "rgba(160,160,160,0.4)" }}>
                        <span className="text-[13px]" style={{ ...FONT, color: MUTED }}>{currency}</span>
                        <input
                          inputMode="none"
                          // Raw while focused; comma + 2-decimal formatted when blurred. Empty → "0.00" placeholder.
                          // inputMode="none" suppresses the OS keyboard — input comes from the custom keypad below.
                          value={focusedLineId === l.id ? l.unitPrice : l.unitPrice ? fmtAmount(lineCredit(l)) : ""}
                          placeholder="0.00"
                          onFocus={(e) => focusAmount(l.id, e.currentTarget)}
                          onBlur={blurAmount}
                          onChange={(e) => setLineRefund(l.id, e.target.value)}
                          className="flex-1 min-w-0 text-right outline-none text-[15px] bg-transparent"
                          style={{ ...FONT, color: INK }}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Corrected values — quantity + unit price */}
                    <div className="flex items-end gap-3">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[12px]" style={{ ...FONT, color: MUTED }}>Quantity</span>
                        <div className="flex items-center rounded-lg border bg-white overflow-hidden" style={{ borderColor: "rgba(160,160,160,0.4)" }}>
                          <button type="button" onClick={() => decQty(l.id)} disabled={l.qty === 0} aria-label="Decrease quantity" className="w-9 h-10 flex items-center justify-center disabled:opacity-30">
                            <RemoveIcon style={{ fontSize: 16, color: INK }} />
                          </button>
                          <span className="w-8 text-center text-[14px] font-medium" style={{ ...FONT, color: INK }}>{l.qty}</span>
                          <button type="button" onClick={() => incQty(l.id)} disabled={l.qty >= l.maxQty} aria-label="Increase quantity" className="w-9 h-10 flex items-center justify-center disabled:opacity-30">
                            <AddIcon style={{ fontSize: 16, color: INK }} />
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

                    {/* Credited — the derived per-line credit, only when this line was lowered */}
                    {lineCredit(l) > 0.001 && (
                      <div className="flex items-center justify-between border-t border-[rgba(160,160,160,0.18)] pt-2.5">
                        <span className="text-[13px]" style={{ ...FONT, color: MUTED }}>Credited</span>
                        <span className="text-[14px] font-medium" style={{ ...FONT, color: "#b42318" }}>−{money(lineCredit(l))}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
            {lines.length > COLLAPSED_ITEMS && showMoreBtn}
          </div>
        </div>

        {/* Summary — auto-derived; the user never types a total. */}
        <div className="flex flex-col gap-2">
          <p className="px-1 text-[12px] font-bold uppercase tracking-wide" style={{ ...FONT, color: "#a0a0a0" }}>
            {refund ? "Refund Summary" : "Summary"}
          </p>
          <div className="bg-[#faf9f4] border border-dashed border-[rgba(160,160,160,0.3)] rounded-xl px-4 py-1">
            <div className="flex items-center justify-between py-2.5">
              {/* Refund: against the amount paid. Credit: against the (possibly already-reduced) balance. */}
              <span className="text-[13px]" style={{ ...FONT, color: MUTED }}>{refund ? "Original paid amount" : alreadyCredited > 0.001 ? "Current balance" : "Invoice Total"}</span>
              <span className="text-[13px]" style={{ ...FONT, color: INK }}>{money(invoiceTotal)}</span>
            </div>
            {refund ? (
              <>
                {/* Total refund is the highlighted figure; remaining after refund follows. */}
                <div className="h-px bg-[rgba(160,160,160,0.3)] my-1" />
                <div className="flex items-center justify-between py-3">
                  <span className="text-[15px] font-black tracking-[-0.3px]" style={{ ...FONT, color: INK }}>Total refund</span>
                  <span className="text-[18px] font-black tracking-[-0.5px]" style={{ ...FONT, color: "#b42318" }}>− {money(credited)}</span>
                </div>
                <div className="flex items-center justify-between py-2.5 border-t border-[rgba(160,160,160,0.18)]">
                  <span className="text-[13px]" style={{ ...FONT, color: MUTED }}>Remaining after refund</span>
                  <span className="text-[13px] font-medium" style={{ ...FONT, color: INK }}>{money(amountDue)}</span>
                </div>
              </>
            ) : (
              <>
                {/* Auto-calculated: Credit Amount = Original Total − Edited Total. */}
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-[13px]" style={{ ...FONT, color: MUTED }}>Credit Amount</span>
                  <span className="text-[13px] font-medium" style={{ ...FONT, color: "#b42318" }}>− {money(credited)}</span>
                </div>
                <div className="h-px bg-[rgba(160,160,160,0.3)] my-1" />
                {/* Amount Due = Edited Invoice Total. */}
                <div className="flex items-center justify-between py-3">
                  <span className="text-[15px] font-bold" style={{ ...FONT, color: INK }}>Amount Due</span>
                  <span className="text-[15px] font-bold" style={{ ...FONT, color: INK }}>{money(amountDue)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Validation — credited amount can't exceed the outstanding (shown inline by the amount) */}
        {exceedsCap && (
          <div className="flex items-start gap-2 rounded-xl bg-[#fef2f2] border border-[#f5c6c0] px-3.5 py-3">
            <ErrorOutlineIcon style={{ fontSize: 18, color: "#b42318" }} />
            <p className="text-[13px] leading-[1.4]" style={{ ...FONT, color: "#b42318" }}>
              The {refund ? "refund" : "credit"} can't exceed {money(outstanding)} — lower the corrected amounts less.
            </p>
          </div>
        )}

        {(() => {
          const helper = refund
            ? credited <= 0.001
              ? "Lower a line to its corrected value — the refund is calculated automatically."
              : isFull
              ? "This refunds the full amount paid."
              : "A partial refund — the invoice stays pending refund with the remaining reduced."
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

      <ButtonDock
        type="single"
        overflow
        primaryLabel={isEdit ? (submitLabel ?? "Save changes") : refund ? "Create Credit Note" : "Apply to Invoice"}
        primaryDisabled={!canCreate}
        onPrimary={handleCreate}
        homeIndicator
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
        reasonNote={reasonNote}
        setReasonNote={setReasonNote}
      />

      {/* Edit client details — applies to this credit note only (not the invoice or client record) */}
      <ClientEditSheet
        open={clientSheetOpen}
        onClose={() => setClientSheetOpen(false)}
        draftName={draftName}
        draftEmail={draftEmail}
        setDraftName={setDraftName}
        setDraftEmail={setDraftEmail}
        dirty={clientDirty}
        valid={clientValid}
        onSave={saveClient}
      />

      {/* Custom numeric keypad — slides up while an amount field is focused (refund OR credit unit price).
          Demo stand-in for the OS keyboard a desktop web view can't show. */}
      {focusedLineId && (
        <NumericKeypad
          onPress={keypadPress}
          onBackspace={keypadBackspace}
          onDone={closeKeypad}
          accessory={
            <>
              {([
                { key: "full", label: refund ? "Full refund" : "Full credit" },
                { key: "half", label: "50%" },
              ] as const).map((c) => (
                <button
                  key={c.key}
                  type="button"
                  // onMouseDown + preventDefault keeps the amount input focused (keypad stays open).
                  onMouseDown={(e) => { e.preventDefault(); applyLineShortcut(c.key); }}
                  className="shrink-0 h-9 px-3.5 rounded-full bg-white border border-[rgba(160,160,160,0.4)] text-[13px] font-medium text-[#1b1b1b] active:bg-[#e9e9ee] whitespace-nowrap"
                  style={FONT}
                >
                  {c.label}
                </button>
              ))}
            </>
          }
        />
      )}
    </div>
  );
}

export default CreditNoteForm;
