import { useRef, useState } from "react";
import { CREDIT_NOTES } from "../../data/creditNotes";
import { SHOW_CREDIT_NOTES } from "../../lib/flags";
import { money } from "../../lib/format";
import type { Invoice } from "../../types";
import { InvoiceRow } from "../../ui/InvoiceRow";
import { SwipeActions } from "../../ui/SwipeActions";
import { Badge, type BadgeColor } from "../../ui/Badge";
import { effectiveStatus, metaLine, type EffectiveStatus } from "./filters";
// Prototype: every invoice's detail page shows the same shared demo total (demoInvoice.TOTAL =
// $6,450). The list card's big amount mirrors it so each row's "original full amount" matches what
// the detail shows (user, 22/Jul) — the varied per-invoice `inv.amount` is no longer displayed here.
import { TOTAL } from "../invoice-detail/demoInvoice";

// Reveal = ui/SwipeActions' own delete-only width (Figma "Create Invoice", node 1826-15916 —
// same swipe-to-delete recipe as ServiceItemCard).
const REVEAL = 44;

/** Status chip label + DS Badge colour for a list row (refund state wins when present). */
function rowStatus(eff: EffectiveStatus, refundChip?: string): { label: string; color: BadgeColor } {
  if (refundChip === "Refunded") return { label: "Refunded", color: "info" };
  if (refundChip === "Partially Refunded") return { label: "Partially Refunded", color: "warning" };
  if (refundChip === "Refund pending") return { label: "Pending Refund", color: "warning" };
  switch (eff) {
    case "Paid": return { label: "Paid", color: "success" };
    case "Awaiting": return { label: "Awaiting Payment", color: "warning" };
    case "Overdue": return { label: "Overdue", color: "error" };
    case "PartiallyPaid": return { label: "Partially Paid", color: "warning" };
    case "Draft": return { label: "Draft", color: "neutral" };
    case "Cancelled": return { label: "Void", color: "neutral" };
    default: return { label: String(eff), color: "neutral" };
  }
}

/**
 * A single Sales Invoice List row, built on the DS InvoiceRow (client + number, a status Badge
 * with its date caption, the amount, and an optional credit-note strip). Drafts add swipe-left
 * to reveal Delete; a freshly created invoice (`isNew`) gets both the arrival highlight wash and a
 * "New" title badge, driven by the same single flag/timer (App.tsx's newFlag — see lib/pinNew.ts).
 * `lastItem` drops the divider on the final row of the card.
 */
export function InvoiceCard({ inv, isNew, lastItem, onClick, onDelete, onOpenCN, refundOverride }: { inv: Invoice; isNew?: boolean; lastItem?: boolean; onClick?: () => void; onDelete?: () => void; onOpenCN?: (inv: Invoice) => void; refundOverride?: "partial" | "full" }) {
  const eff = effectiveStatus(inv);
  const meta = metaLine(inv, eff);
  const isDraft = inv.status === "Draft";

  // Linked credit note (DES-763): refund-type CNs surface a derived refund state; an in-session refund
  // (refundOverride) wins. Credit notes are gated off for prod via SHOW_CREDIT_NOTES.
  const linkedCn = SHOW_CREDIT_NOTES && inv.cnNo ? CREDIT_NOTES.find((c) => c.no === inv.cnNo) : undefined;
  const refundChip = !SHOW_CREDIT_NOTES ? undefined
    : refundOverride === "full" ? "Refunded"
    : refundOverride === "partial" ? "Partially Refunded"
    : linkedCn?.kind === "refund" ? "Refund pending"
    : undefined;

  const status = rowStatus(eff, refundChip);
  // Drop a duplicate leading status word from the caption ("Paid 22 Jun 2026" → "22 Jun 2026",
  // "Void 8 Jun 2026" → "8 Jun 2026") — the badge already carries the word, so the caption is
  // just the bare date, same pattern as every other status.
  let caption = meta.rest;
  if (status.label === "Paid") caption = caption.replace(/^Paid /, "");
  if (status.label === "Void") caption = caption.replace(/^Void /, "");
  // Refunded gets its own settled date (the linked credit note's date) instead of the invoice's
  // original payment date — "Paid 22 Jun 2026" next to a "Refunded" badge would be confusing.
  // Pending / Partially Refunded stay caption-less (no settled date to show yet).
  if (refundChip === "Refunded") caption = linkedCn?.date ?? "";
  else if (refundChip) caption = "";

  // Credit-note strip (DES-763 AC6): shows the linked CN NUMBER (no amount) and opens that credit note.
  const hasCn = SHOW_CREDIT_NOTES && Boolean(inv.cnNo);

  const row = (
    <InvoiceRow
      title={inv.client}
      titleBadge={isNew ? <Badge label="New" color="custom" variant="bold" size="sm" /> : undefined}
      invoiceNo={meta.number || undefined}
      status={status.label}
      statusColor={status.color}
      statusCaption={caption || undefined}
      amount={inv.itemsCount === 0 ? money(0) : money(TOTAL)}
      creditedAmount={hasCn ? inv.cnNo : undefined}
      creditedLabel=""
      onCreditedClick={hasCn ? () => onOpenCN?.(inv) : undefined}
      lastItem={lastItem}
      onClick={onClick}
    />
  );

  // Non-drafts: plain row. (A just-created row is called out via its "New" title badge alone —
  // no background wash, per 2026-08-04 feedback.)
  if (!isDraft) {
    return <div className="shrink-0 rounded-lg">{row}</div>;
  }

  // Drafts: swipe left to reveal a delete action; tap to open.
  return (
    <DraftSwipeRow onDelete={onDelete} onClick={onClick}>
      {row}
    </DraftSwipeRow>
  );
}

/** Swipe-left-to-delete wrapper for draft rows (pointer events + CSS transform — framer `drag` renders
 *  blank inside overflow-hidden). The foreground carries a solid background so it covers the Delete
 *  action until swiped; tap while open just closes it. */
function DraftSwipeRow({ children, onDelete, onClick }: { children: React.ReactNode; onDelete?: () => void; onClick?: () => void }) {
  const [tx, setTx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const press = useRef<{ x: number; base: number } | null>(null);
  const movedRef = useRef(false);
  // Mirrors `tx` synchronously so onPointerUp can read the just-dragged position without
  // waiting on React's setState batching.
  const txRef = useRef(0);

  return (
    <div className="shrink-0 relative overflow-hidden rounded-lg">
      <div className="absolute inset-0 flex items-center justify-end px-1">
        <SwipeActions showMore={false} onDelete={onDelete} />
      </div>

      <div
        onPointerDown={(e) => {
          (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
          press.current = { x: e.clientX, base: tx };
          movedRef.current = false;
          setDragging(true);
        }}
        onPointerMove={(e) => {
          if (!press.current) return;
          const dx = e.clientX - press.current.x;
          if (Math.abs(dx) > 4) movedRef.current = true;
          const next = Math.max(-REVEAL, Math.min(0, press.current.base + dx));
          txRef.current = next;
          setTx(next);
        }}
        onPointerUp={() => {
          if (!press.current) return;
          press.current = null;
          setDragging(false);
          setTx(txRef.current < -REVEAL / 2 ? -REVEAL : 0);
        }}
        onPointerCancel={() => {
          press.current = null;
          setDragging(false);
          setTx(txRef.current < -REVEAL / 2 ? -REVEAL : 0);
        }}
        onClick={() => {
          if (movedRef.current) { movedRef.current = false; return; }
          if (tx !== 0) { setTx(0); return; }
          onClick?.();
        }}
        style={{
          background: "#ffffff",
          transform: `translateX(${tx}px)`,
          transition: dragging ? "none" : "transform 0.25s ease",
          touchAction: "pan-y",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}
