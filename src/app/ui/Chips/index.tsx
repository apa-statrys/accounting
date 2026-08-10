import { useState } from "react";
import { X } from "lucide-react";
import styles from "./index.module.css";

/**
 * Chips — design-system pill (Figma "[APP] Design System" → Chips, node
 * 4565-2176). Two types: "filter" (default) — a single 30px toggle, transparent
 * background, black label in both states, only the border switches (Border/
 * Neutral/primary at rest, black Button/btn-secondary when `active`) — and
 * "input" — a removable value pill (e.g. an email recipient): white background,
 * a trailing 16px dismiss "x", and a momentary Pressed surface (Bg/Neutral/
 * primary-hover + Border/Beige/primary-hover) while held down. Styling in
 * index.module.css.
 */

export type ChipsType = "filter" | "input";

interface ChipsProps {
  label: string;
  type?: ChipsType;
  /** Filter type only — the active/selected toggle state. */
  active?: boolean;
  /** Filter type only (or an input chip that's also tappable, e.g. to edit) — tap anywhere on the chip. */
  onClick?: () => void;
  /** Input type only — shows the trailing "x" and fires this when it's tapped. */
  onDismiss?: () => void;
}

export function Chips({ label, type = "filter", active = false, onClick, onDismiss }: ChipsProps) {
  const isInput = type === "input";
  const [pressed, setPressed] = useState(false);
  const classes = [
    styles.chip,
    isInput ? styles.input : "",
    active ? styles.active : "",
    isInput && pressed ? styles.pressed : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (isInput) {
    // Never a <button> nested around the dismiss <button> — the label span (+ optional onClick)
    // and the dismiss button are two independent tap targets, not one control inside another.
    return (
      <span
        className={classes}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
      >
        <span className={styles.label} onClick={onClick}>
          {label}
        </span>
        {onDismiss && (
          <button type="button" aria-label={`Remove ${label}`} className={styles.dismiss} onClick={onDismiss}>
            <X size={16} strokeWidth={1.67} />
          </button>
        )}
      </span>
    );
  }

  return (
    <button type="button" className={classes} aria-pressed={active} onClick={onClick}>
      {label}
    </button>
  );
}

export default Chips;
