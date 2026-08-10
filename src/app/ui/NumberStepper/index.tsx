import { Minus, Plus } from "lucide-react";
import styles from "./index.module.css";

/**
 * NumberStepper — a bordered "− value +" control for adjusting a small integer amount
 * in place (e.g. a line item's credited/refunded quantity) without opening the keyboard.
 * Not a Figma DS component yet (no matching frame) — built to the same field tokens as
 * TextField (--field-border/--field-bg, --radius-xl) so it reads as part of the same family.
 */

interface NumberStepperProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  /** Describes what's being stepped, for the button aria-labels — "Decrease {label}" /
   *  "Increase {label}", e.g. label="quantity". Defaults to "value". */
  label?: string;
}

export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
  disabled = false,
  label = "value",
}: NumberStepperProps) {
  return (
    <div className={`${styles.root} ${disabled ? styles.disabled : ""}`}>
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        className={styles.btn}
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - step))}
      >
        <Minus size={16} strokeWidth={1.67} />
      </button>
      <span className={styles.value}>{value}</span>
      <button
        type="button"
        aria-label={`Increase ${label}`}
        className={styles.btn}
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + step))}
      >
        <Plus size={16} strokeWidth={1.67} />
      </button>
    </div>
  );
}

export default NumberStepper;
