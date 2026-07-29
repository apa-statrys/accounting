import { useEffect, useRef, useState } from "react";
import { motion, useAnimationControls } from "motion/react";
import { ListRow } from "../../ui/ListRow";
import { SwipeActions } from "../../ui/SwipeActions";
import { convert } from "../../lib/currency";
import { formatMoney } from "../../lib/format";
import type { ServiceLine } from "../../types";
import styles from "./index.module.css";

// Reveal = ui/SwipeActions' own delete-only width (Figma "Create Invoice", node 1826-15916).
const REVEAL = 44;
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
  /** Hides the row's bottom divider — pass on the last item in the list. */
  last?: boolean;
}

/**
 * A service/product line, rendered as a ui/ListRow (Figma "Create Invoice", node 1826-15914:
 * label + qty×price description, the item's own note as a caption, amount + chevron trailing —
 * same row recipe as the Invoice Details rows above it). Swipe left to reveal a delete button;
 * tap to edit. Invoice-currency amount in front; item-currency FX line beneath when they differ.
 * See memory: multi-currency-exchange-rate.
 */
export function ServiceItemCard({ line, invoiceCurrency, onClick, onDelete, hint, readOnly, last }: ServiceItemCardProps) {
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
        {/* Delete action behind the card — ui/SwipeActions (Figma node 1826-15916), delete-only.
            Hidden when read-only (no swipe). */}
        {!readOnly && (
          <div className={styles.deleteWrap}>
            <SwipeActions showMore={false} onDelete={() => onDelete?.()} />
          </div>
        )}

        {/* Card — swipeable + tappable to edit, unless read-only (issued limited edit). */}
        <motion.div
          drag={readOnly ? false : "x"}
          dragConstraints={{ left: -REVEAL, right: 0 }}
          dragElastic={0.04}
          animate={controls}
          onDragStart={() => { draggedRef.current = true; }}
          onDragEnd={(_, info) => {
            setOpen(info.offset.x < -REVEAL / 2);
          }}
          onClick={readOnly ? undefined : () => {
            // Swallow the click that follows a drag so it doesn't open the editor.
            if (draggedRef.current) { draggedRef.current = false; return; }
            if (open) setOpen(false);
            else onClick?.();
          }}
          className={styles.card}
        >
          <ListRow
            label={line.name}
            description={`${line.quantity}${line.unit ? ` ${line.unit}${line.quantity !== 1 ? "s" : ""}` : ""} x ${formatMoney(line.unitPrice, line.currency)}`}
            caption={line.description || undefined}
            value={formatMoney(invoiceTotal, invoiceCurrency)}
            valueDescription={showFx ? `= ${formatMoney(itemTotal, line.currency)}` : undefined}
            trailing={readOnly ? "none" : "chevron"}
            last={last}
          />
        </motion.div>
    </div>
  );
}

export default ServiceItemCard;
