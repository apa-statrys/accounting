import { useRef, useState } from "react";
import { motion } from "motion/react";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { FileText, Repeat } from "lucide-react";
import { CREDIT_NOTES } from "../../data/creditNotes";
import { STATUS_PILL } from "../../lib/status";
import { FONT } from "../../lib/theme";
import type { Invoice } from "../../types";
import { effectiveStatus, metaLine } from "./filters";

const REVEAL = 88;

export function InvoiceCard({ inv, highlighted, onClick, onDelete, onOpenCN, refundOverride }: { inv: Invoice; highlighted?: boolean; onClick?: () => void; onDelete?: () => void; onOpenCN?: (inv: Invoice) => void; refundOverride?: "partial" | "full" }) {
  const eff = effectiveStatus(inv);
  const s = STATUS_PILL[eff];
  const meta = metaLine(inv, eff);
  const isDraft = inv.status === "Draft";
  // Linked credit note (DES-763): refund-type CNs surface a derived refund state. A refund completed
  // in-session (refundOverride) wins → "Partially Refunded" / "Refunded".
  const linkedCn = inv.cnNo ? CREDIT_NOTES.find((c) => c.no === inv.cnNo) : undefined;
  const refundChip = refundOverride === "full" ? "Refunded"
    : refundOverride === "partial" ? "Partially Refunded"
    : linkedCn?.status === "Pending Refund" ? "Refund pending"
    : linkedCn?.status === "Refunded" ? "Refunded"
    : undefined;
  // A refunded/pending invoice stays "Paid", but the right-side pill shows the refund state as the
  // primary status (mirrors the detail page) — the paid date moves into the meta line, so no duplication.
  const pill =
    refundChip === "Refunded" ? { label: "Refunded", bg: "#eef2ff", border: "#c7d2fe", text: "#4338ca" }
    : refundChip === "Partially Refunded" ? { label: "Partially Refunded", bg: "#fff7e6", border: "#fde68a", text: "#b45309" }
    : refundChip === "Refund pending" ? { label: "Refund Pending", bg: "#fff7e6", border: "#fde68a", text: "#c2410c" }
    : s;
  // Any invoice with a linked credit note shows a credit-note summary row beneath (DES-763 AC6): count +
  // amount + "View". The top amount stays the invoice total, consistent with every other card. The amount
  // label reads "Refund amount" for refund credit notes, "Credited amount" for cancellation/partial credits.
  const hasCn = Boolean(inv.cnNo);
  const cnAmountStr = linkedCn
    ? `$${linkedCn.original.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : inv.amount;
  const cnAmountLabel = refundChip ? "Refund amount" : "Credited amount";
  const cnCount = inv.cnNo ? 1 : 0; // demo: one credit note per invoice
  // Manual swipe-to-delete (pointer events + CSS transform — no framer drag, which renders blank
  // inside an overflow-hidden wrapper). `tx` is the committed/live offset; press tracks the gesture.
  const [tx, setTx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const press = useRef<{ x: number; base: number } | null>(null);
  const movedRef = useRef(false);

  // Shared left block (client + meta) and the status pill — reused by both layouts.
  const nameMeta = (
    <div className="flex-1 min-w-0">
      <p className="text-[16px] font-medium leading-[1.2] tracking-[-0.3px] truncate text-[#101828]" style={FONT}>
        {inv.client}
      </p>
      {/* Invoice number on its own line; the date phrase ("Due in N days" / "Overdue by N days" /
          "Paid on …") sits beneath it. */}
      <div className="flex flex-col gap-0.5 mt-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="text-[12px] font-medium leading-[1.2] text-[#808080] truncate" style={FONT}>{meta.number}</p>
          {/* Recurring-series badge (DES-782) — marks invoices generated from a recurring series. */}
          {inv.recurring && (
            <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-[#fff6f2] border border-[#ffd9c2] px-1.5 py-0.5">
              <Repeat size={10} strokeWidth={2.5} style={{ color: "#ff4a15" }} />
              <span className="text-[10px] font-bold leading-none" style={{ ...FONT, color: "#ff4a15" }}>Recurring</span>
            </span>
          )}
        </div>
        <p className="text-[12px] leading-[1.2]" style={{ ...FONT, color: meta.danger ? "#d92d20" : "#a0a0a0", fontWeight: meta.danger ? 600 : 400 }}>{meta.rest}</p>
      </div>
    </div>
  );
  const pillEl = (
    <span
      className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-bold leading-[15px] whitespace-nowrap"
      style={{ ...FONT, background: pill.bg, borderColor: pill.border, color: pill.text }}
    >
      {pill.label}
    </span>
  );

  // Credit-note summary row (icon + count + amount + View) — shown on every invoice with a credit note.
  const cnSummary = (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onOpenCN?.(inv); }}
      className="group/cn w-full flex items-center justify-between gap-3 pt-3 mt-0.5 border-t border-[rgba(160,160,160,0.18)] text-left"
    >
      <span className="flex items-start gap-2 min-w-0">
        <FileText size={18} className="mt-0.5 shrink-0" style={{ color: "#1b1b1b" }} />
        <span className="flex flex-col min-w-0">
          <span className="text-[13px] font-bold leading-[1.2]" style={{ ...FONT, color: "#1b1b1b" }}>{cnCount} Credit Note{cnCount > 1 ? "s" : ""}</span>
          <span className="text-[12px] leading-[1.3] mt-0.5 truncate" style={{ ...FONT, color: "#808080" }}>{cnAmountLabel}: {cnAmountStr}</span>
        </span>
      </span>
      <span className="shrink-0 inline-flex items-center gap-0.5">
        <span className="text-[13px] font-medium" style={{ ...FONT, color: "#1b1b1b" }}>View</span>
        <ChevronRightIcon className="transition-transform group-hover/cn:translate-x-0.5" style={{ fontSize: 16, color: "#808080" }} />
      </span>
    </button>
  );

  const content = (
    <>
      {/* Top row: client + meta on the left, invoice total over the status pill on the right. */}
      <div className="flex items-start justify-between gap-2.5">
        {nameMeta}
        <div className="shrink-0 flex flex-col items-end gap-1.5">
          <p className="text-[16px] font-bold leading-[1.2] text-[#101828] whitespace-nowrap" style={FONT}>{inv.amount}</p>
          {pillEl}
        </div>
      </div>
      {/* Any invoice with a credit note → the credit-note summary row. */}
      {hasCn && cnSummary}
    </>
  );

  // Non-drafts: plain tappable card (with the recent-card highlight animation).
  if (!isDraft) {
    return (
      <motion.button
        onClick={onClick}
        initial={false}
        animate={
          highlighted
            ? { backgroundColor: "#fffaf3", borderColor: "#ff4a15", boxShadow: "0 0 0 3px rgba(255,74,21,0.12)" }
            : { backgroundColor: "#faf9f4", borderColor: "rgba(160,160,160,0.2)", boxShadow: "0 0 0 0px rgba(255,74,21,0)" }
        }
        transition={{ duration: 0.5 }}
        className="shrink-0 w-full flex flex-col gap-2 border border-dashed rounded-2xl p-4 text-left"
      >
        {content}
      </motion.button>
    );
  }

  // Drafts: swipe left to reveal a delete action; tap to open.
  return (
    <div className="shrink-0 relative rounded-2xl overflow-hidden">
      <div className="absolute right-0 top-0 bottom-0 flex items-center justify-end py-1 pr-0.5">
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete draft"
          className="h-full w-[80px] rounded-2xl bg-[#fb4d4d] flex flex-col items-center justify-center gap-0.5 text-white active:bg-[#e23d3d]"
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
        className="relative w-full flex flex-col gap-2 border border-dashed rounded-2xl p-4 text-left"
        style={{
          background: highlighted ? "#fffaf3" : "#faf9f4",
          borderColor: highlighted ? "#ff4a15" : "rgba(160,160,160,0.2)",
          boxShadow: highlighted ? "0 0 0 3px rgba(255,74,21,0.12)" : undefined,
          transform: `translateX(${tx}px)`,
          transition: dragging ? "none" : "transform 0.25s ease",
          touchAction: "pan-y",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        {content}
      </div>
    </div>
  );
}
