import { useEffect, useRef, useState } from "react";
import { motion, useAnimationControls } from "motion/react";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { EditCard } from "../EditCard";
import { convert } from "../../lib/currency";
import { formatMoney } from "../../lib/format";
import type { ServiceLine } from "../../types";
import styles from "./index.module.css";

const REVEAL = 88;
const SNAP = { type: "spring" as const, stiffness: 500, damping: 40 };

interface ServiceItemCardProps {
  line: ServiceLine;
  invoiceCurrency: string;
  onClick?: () => void;
  onDelete?: () => void;
  /** Play a one-time "swipe to delete" nudge (used on the first added item). */
  hint?: boolean;
  /** Read-only (issued limited edit): no swipe-to-delete, no tap-to-edit, no chevron. */
  readOnly?: boolean;
}

/**
 * A service/product line. Swipe left to reveal a delete button; tap to edit.
 * Invoice-currency amount in front; item-currency FX line beneath when they differ.
 * See memory: multi-currency-exchange-rate.
 */
export function ServiceItemCard({ line, invoiceCurrency, onClick, onDelete, hint, readOnly }: ServiceItemCardProps) {
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
    <div className={styles.root}>
        {/* Delete action tile behind the card — hidden when read-only (no swipe). */}
        {!readOnly && (
          <div className={styles.deleteWrap}>
            <button
              type="button"
              onClick={() => onDelete?.()}
              aria-label="Delete"
              className={styles.deleteButton}
            >
              <DeleteOutlineIcon className={styles.deleteIcon} />
              <span className={styles.deleteLabel}>Delete</span>
            </button>
          </div>
        )}

        {/* Card — swipeable + tappable to edit, unless read-only (issued limited edit). */}
        <motion.div
          drag={readOnly ? false : "x"}
          dragConstraints={{ left: -REVEAL, right: 0 }}
          dragElastic={0.04}
          animate={controls}
          onDragStart={() => { draggedRef.current = true; }}
          onDragEnd={(_, info) => setOpen(info.offset.x < -REVEAL / 2)}
          onClick={readOnly ? undefined : () => {
            // Swallow the click that follows a drag so it doesn't open the editor.
            if (draggedRef.current) { draggedRef.current = false; return; }
            if (open) setOpen(false);
            else onClick?.();
          }}
          className={styles.card}
        >
          <EditCard
            title={line.name}
            description={`${line.quantity}${line.unit ? ` ${line.unit}${line.quantity !== 1 ? "s" : ""}` : ""} x ${formatMoney(line.unitPrice, line.currency)}`}
            hideAvatar
            trailing={
              <div className={styles.trailing}>
                <div className={styles.amountBlock}>
                  <span className={styles.amount}>
                    {formatMoney(invoiceTotal, invoiceCurrency)}
                  </span>
                  {showFx && (
                    <span className={`${styles.fx} caption`}>
                      = {formatMoney(itemTotal, line.currency)}
                    </span>
                  )}
                </div>
                {/* Tap-to-edit affordance — hidden when the item is read-only (issued limited edit). */}
                {!readOnly && <ChevronRightIcon className={styles.chevron} />}
              </div>
            }
          />
        </motion.div>
    </div>
  );
}

export default ServiceItemCard;
