import { AnimatePresence, motion } from "motion/react";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { TextField } from "../../ui/TextField";
import { Toggle } from "../../ui/Toggle";
import styles from "./index.module.css";

export type DiscountMode = "amount" | "percent";

interface DiscountCardProps {
  /** Invoice currency — shown as the amount unit. */
  currency: string;
  /** Whether discounts are turned on. */
  enabled: boolean;
  onToggle: (on: boolean) => void;
  value: string;
  onChange: (v: string) => void;
  mode: DiscountMode;
  /** Open the %/amount picker sheet. */
  onOpenMode?: () => void;
}

/**
 * Discounts card — a toggle (off by default). When on, reveals a value field
 * (in the invoice currency) plus a %/amount mode dropdown.
 */
export function DiscountCard({ currency, enabled, onToggle, value, onChange, mode, onOpenMode }: DiscountCardProps) {
  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.header}>
        <p className={`${styles.title} body-sm-bold`}>Discount</p>
        <Toggle checked={enabled} onChange={onToggle} aria-label="Discount" />
      </div>

      {/* Body */}
      <AnimatePresence initial={false}>
        {enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className={styles.body}
          >
            {/* One field (Figma node 1826-15916) — value input + %/amount mode trigger share the
                same bordered box, not two side-by-side fields. */}
            <TextField
              placeholder="e.g. 10.00"
              inputMode="decimal"
              value={value}
              onChange={onChange}
              iconRight={
                <button type="button" onClick={onOpenMode} className={styles.modeButton}>
                  <span className={`${styles.modeLabel} body-sm`}>{mode === "percent" ? "%" : currency}</span>
                  <KeyboardArrowDownIcon className={styles.chevron} />
                </button>
              }
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DiscountCard;
