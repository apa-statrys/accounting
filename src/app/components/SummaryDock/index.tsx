import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, X } from "lucide-react";
import styles from "./index.module.css";
import { Button } from "../../ui/Button";
import { SummaryCard } from "../SummaryCard";
import { Keyboard } from "../Keyboard";
import { money } from "../../lib/format";

/**
 * Sticky invoice-total footer (Figma "Sales Invoice - Client", node 2004:12766 collapsed /
 * 2004:13021 expanded) — a persistent "amount + View details" row beside an auto-width primary
 * button, that expands upward in place into a Subtotal/Discount/Total breakdown with its own
 * "Summary" header + close button. Distinct from ButtonDock's `slot` (whose primary button is
 * always full-width, stacked BELOW the slot content, and shows/hides from external state) — here
 * the button sits inline beside the total, and the expand/collapse is a self-contained tap
 * interaction. Reuses SummaryCard's `bare` rows for the breakdown, same as ButtonDock's slot does —
 * a caller whose breakdown isn't a Subtotal/Discount/Total invoice shape (e.g. Credit Note's
 * Invoice Total/Credit Amount/Amount Due) passes its own `rows`/`amount` instead.
 */
interface SummaryDockProps {
  currency?: string;
  subtotal?: number;
  discount?: number;
  total?: number;
  /** Overrides the collapsed footer's amount display — for a caller whose headline figure isn't
   *  a plain `total` (e.g. Credit Note's "Amount Due", a refund's "−Total refund" in error red).
   *  Falls back to `money(total, currency)` when omitted. */
  amount?: React.ReactNode;
  /** Overrides the expanded panel's breakdown — for a caller whose rows aren't a Subtotal/
   *  Discount/Total invoice shape (e.g. Credit Note's Invoice Total/Credit Amount/Amount Due).
   *  Falls back to `<SummaryCard bare subtotal discount total>` when omitted. */
  rows?: React.ReactNode;
  primaryLabel?: React.ReactNode;
  onPrimary?: () => void;
  primaryLoading?: boolean;
  /** Mirrors ButtonDock's on-screen keyboard mock (Figma "IOS controls") for a field focused
   *  elsewhere on the page. */
  keyboard?: boolean;
  className?: string;
}

export function SummaryDock({
  currency = "",
  subtotal = 0,
  discount = 0,
  total = 0,
  amount,
  rows,
  primaryLabel = "Create Invoice",
  onPrimary,
  primaryLoading,
  keyboard = false,
  className = "",
}: SummaryDockProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={[styles.root, expanded ? styles.expanded : "", className].filter(Boolean).join(" ")}>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="panel"
            className={styles.panel}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <div className={styles.header}>
              <p className="card-title-md" style={{ color: "var(--text-primary)", margin: 0 }}>
                Summary
              </p>
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setExpanded(false)}
                aria-label="Close summary"
              >
                <X size={20} strokeWidth={1.67} />
              </button>
            </div>
            <div className={styles.rows}>
              {rows ?? <SummaryCard bare currency={currency} subtotal={subtotal} discount={discount} total={total} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={styles.footer}>
        <div className={styles.info}>
          <p className={`body-md-bold ${styles.amount}`}>{amount ?? money(total, currency)}</p>
          <button
            type="button"
            className={styles.viewDetails}
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            <span className="link-sentence-sm">View details</span>
            <ChevronDown
              size={16}
              strokeWidth={1.67}
              color="var(--link-primary)"
              className={`${styles.chevron} ${expanded ? styles.chevronOpen : ""}`}
            />
          </button>
        </div>
        <Button hierarchy="primary" label={primaryLabel} onClick={onPrimary} loading={primaryLoading} />
      </div>

      {keyboard && <Keyboard />}
    </div>
  );
}

export default SummaryDock;
