import { useEffect, useRef, useState } from "react";
import { motion, useAnimationControls } from "motion/react";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { EditCard } from "./EditCard";
import { convert } from "../lib/currency";
import { formatMoney } from "../lib/format";
import type { ServiceLine } from "../types";

import { FONT } from "../lib/theme";
const REVEAL = 88;
const SNAP = { type: "spring" as const, stiffness: 500, damping: 40 };

interface ServiceItemCardProps {
  line: ServiceLine;
  invoiceCurrency: string;
  onClick?: () => void;
  onDelete?: () => void;
  /** Play a one-time "swipe to delete" nudge (used on the first added item). */
  hint?: boolean;
}

/**
 * A service/product line. Swipe left to reveal a delete button; tap to edit.
 * Invoice-currency amount in front; item-currency FX line beneath when they differ.
 * See memory: multi-currency-exchange-rate.
 */
export function ServiceItemCard({ line, invoiceCurrency, onClick, onDelete, hint }: ServiceItemCardProps) {
  const controls = useAnimationControls();
  const [open, setOpen] = useState(false);
  // True while a drag is in progress — so the post-drag click doesn't also open the editor.
  const draggedRef = useRef(false);

  // Snap to open / closed whenever `open` changes (drag release, tap).
  useEffect(() => {
    controls.start({ x: open ? -REVEAL : 0, transition: SNAP });
  }, [open, controls]);

  // One-time swipe-to-delete nudge (animation only, no label).
  useEffect(() => {
    if (!hint) return;
    let cancelled = false;
    (async () => {
      await new Promise((r) => setTimeout(r, 600));
      for (let i = 0; i < 2 && !cancelled; i++) {
        await controls.start({ x: -REVEAL * 0.55, transition: { duration: 0.4, ease: "easeOut" } });
        await controls.start({ x: 0, transition: { duration: 0.4, ease: "easeIn" } });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hint, controls]);

  const itemTotal = line.quantity * line.unitPrice;
  const invoiceTotal = convert(itemTotal, line.currency, invoiceCurrency);
  const showFx = line.currency !== invoiceCurrency;

  return (
    <div className="relative rounded-[12px] overflow-hidden">
        {/* Delete action tile behind the card */}
        <div className="absolute right-0 top-0 bottom-0 flex items-center justify-end py-1 pr-0.5">
          <button
            type="button"
            onClick={() => onDelete?.()}
            aria-label="Delete"
            className="h-full w-[80px] rounded-2xl bg-[#fb4d4d] flex flex-col items-center justify-center gap-0.5 text-white active:bg-[#e23d3d]"
          >
            <DeleteOutlineIcon style={{ fontSize: 22, color: "#fff" }} />
            <span className="text-[12px] font-medium" style={FONT}>Delete</span>
          </button>
        </div>

        {/* Swipeable card */}
        <motion.div
          drag="x"
          dragConstraints={{ left: -REVEAL, right: 0 }}
          dragElastic={0.04}
          animate={controls}
          onDragStart={() => { draggedRef.current = true; }}
          onDragEnd={(_, info) => setOpen(info.offset.x < -REVEAL / 2)}
          onClick={() => {
            // Swallow the click that follows a drag so it doesn't open the editor.
            if (draggedRef.current) { draggedRef.current = false; return; }
            if (open) setOpen(false);
            else onClick?.();
          }}
          className="relative bg-white"
        >
          <EditCard
            title={line.name}
            description={`${line.quantity}${line.unit ? ` ${line.unit}${line.quantity !== 1 ? "s" : ""}` : ""} x ${formatMoney(line.unitPrice, line.currency)}`}
            hideAvatar
            trailing={
              <div className="flex items-center gap-1">
                <div className="flex flex-col items-end leading-[1.3] whitespace-nowrap" style={FONT}>
                  <span className="text-[16px] font-bold text-[#1b1b1b]">
                    {formatMoney(invoiceTotal, invoiceCurrency)}
                  </span>
                  {showFx && (
                    <span className="text-[12px] text-[#808080]">
                      = {formatMoney(itemTotal, line.currency)}
                    </span>
                  )}
                </div>
                {/* Tap-to-edit affordance — items stay editable in the draft editor. */}
                <ChevronRightIcon style={{ fontSize: 16, color: "var(--icon-primary)" }} />
              </div>
            }
          />
        </motion.div>
    </div>
  );
}

export default ServiceItemCard;
