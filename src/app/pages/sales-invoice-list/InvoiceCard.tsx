import { useRef, useState } from "react";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { CREDIT_NOTES } from "../../data/creditNotes";
import { SHOW_CREDIT_NOTES } from "../../lib/flags";
import { FONT } from "../../lib/theme";
import { money } from "../../lib/format";
import type { Invoice } from "../../types";
import { InvoiceRow } from "../../ui/InvoiceRow";
import type { BadgeColor } from "../../ui/Badge";
import { effectiveStatus, metaLine, type EffectiveStatus } from "./filters";
// Prototype: every invoice's detail page shows the same shared demo total (demoInvoice.TOTAL =
// $6,450). The list card's big amount mirrors it so each row's "original full amount" matches what
// the detail shows (user, 22/Jul) — the varied per-invoice `inv.amount` is no longer displayed here.
import { TOTAL } from "../invoice-detail/demoInvoice";

const REVEAL = 88;

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
 * A single Sales Invoice List row, built on the DS InvoiceRow (client + number/recurring, a status
 * Badge with its date caption, the amount, and an optional credit-note strip). Drafts add swipe-left
 * to reveal Delete; a freshly created invoice gets the arrival highlight. `lastItem` drops the divider
 * on the final row of the card.
 */
export function InvoiceCard({ inv, highlighted, lastItem, onClick, onDelete, onOpenCN, refundOverride }: { inv: Invoice; highlighted?: boolean; lastItem?: boolean; onClick?: () => void; onDelete?: () => void; onOpenCN?: (inv: Invoice) => void; refundOverride?: "partial" | "full" }) {
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
  // Drop a duplicate leading status word from the caption ("Paid on …" → "on …", "Void on …" → "on …").
  let caption = meta.rest;
  if (status.label === "Paid") caption = caption.replace(/^Paid /, "");
  if (status.label === "Void") caption = caption.replace(/^Void /, "");

  // Credit-note strip (DES-763 AC6): shows the linked CN NUMBER (no amount) and opens that credit note.
  const hasCn = SHOW_CREDIT_NOTES && Boolean(inv.cnNo);

  const row = (
    <InvoiceRow
      size="md"
      title={inv.client}
      invoiceNo={meta.number || undefined}
      recurring={inv.recurring}
      status={status.label}
      statusColor={status.color}
      statusCaption={caption || undefined}
      amount={money(TOTAL)}
      creditedAmount={hasCn ? inv.cnNo : undefined}
      creditedLabel=""
      onCreditedClick={hasCn ? () => onOpenCN?.(inv) : undefined}
      lastItem={lastItem}
      onClick={onClick}
    />
  );

  // The recent-arrival highlight wash — a soft warm background behind the row.
  const highlightBg = highlighted ? "#fffaf3" : "transparent";

  // Non-drafts: plain row (with the arrival highlight).
  if (!isDraft) {
    return (
      <div className="shrink-0 transition-colors duration-500 rounded-lg" style={{ background: highlightBg }}>
        {row}
      </div>
    );
  }

  // Drafts: swipe left to reveal a delete action; tap to open.
  return (
    <DraftSwipeRow highlightBg={highlightBg} onDelete={onDelete} onClick={onClick}>
      {row}
    </DraftSwipeRow>
  );
}

/** Swipe-left-to-delete wrapper for draft rows (pointer events + CSS transform — framer `drag` renders
 *  blank inside overflow-hidden). The foreground carries a solid background so it covers the Delete
 *  action until swiped; tap while open just closes it. */
function DraftSwipeRow({ children, highlightBg, onDelete, onClick }: { children: React.ReactNode; highlightBg: string; onDelete?: () => void; onClick?: () => void }) {
  const [tx, setTx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const press = useRef<{ x: number; base: number } | null>(null);
  const movedRef = useRef(false);

  return (
    <div className="shrink-0 relative overflow-hidden rounded-lg">
      <div className="absolute right-0 top-0 bottom-0 flex items-center justify-end py-1">
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete draft"
          className="h-full w-[80px] rounded-xl bg-[#fb4d4d] flex flex-col items-center justify-center gap-0.5 text-white active:bg-[#e23d3d]"
        >
          <DeleteOutlineIcon style={{ fontSize: 22, color: "#fff" }} />
          <span className="text-[12px] font-medium" style={FONT}>Delete</span>
        </button>
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
          setTx(Math.max(-REVEAL, Math.min(0, press.current.base + dx)));
        }}
        onPointerUp={() => {
          if (!press.current) return;
          press.current = null;
          setDragging(false);
          setTx((cur) => (cur < -REVEAL / 2 ? -REVEAL : 0));
        }}
        onPointerCancel={() => {
          press.current = null;
          setDragging(false);
          setTx((cur) => (cur < -REVEAL / 2 ? -REVEAL : 0));
        }}
        onClick={() => {
          if (movedRef.current) { movedRef.current = false; return; }
          if (tx !== 0) { setTx(0); return; }
          onClick?.();
        }}
        style={{
          background: highlightBg === "transparent" ? "#ffffff" : highlightBg,
          transform: `translateX(${tx}px)`,
          transition: dragging ? "none" : "transform 0.25s ease, background-color 0.5s",
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
