import { AnimatePresence, motion } from "motion/react";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { TextInput } from "../TextInput";
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
        <p className={`${styles.title} card-title-sm`}>Discounts</p>
        <Toggle checked={enabled} onChange={onToggle} aria-label="Discounts" />
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
            <div className={styles.row}>
              <div className={styles.fieldWrap}>
                <TextInput
                  size="md"
                  showHint={false}
                  placeholder="e.g. 10.00"
                  inputMode="decimal"
                  iconRight={<span className={`${styles.suffix} card-title-sm`}>{mode === "percent" ? "%" : currency}</span>}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                />
              </div>

              {/* Mode picker — opens a bottom sheet */}
              <button type="button" onClick={onOpenMode} className={styles.modeButton}>
                <span className={`${styles.modeLabel} body-md`}>{mode === "percent" ? "%" : currency}</span>
                <KeyboardArrowDownIcon className={styles.chevron} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DiscountCard;
