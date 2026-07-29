import styles from "./index.module.css";

/**
 * CheckboxBase — design-system checkbox glyph (Figma "[APP] Design System" →
 * CheckboxBase, node 4127-7977). The bare square: unchecked (secondary
 * border), checked (brand fill + check), indeterminate (brand fill + dash —
 * only meaningful while checked), in sm (16px box / 20px hit target) or md
 * (20.8px box / 26px hit target), each with a disabled state (grey fill,
 * disabled border/icon color, regardless of checked-ness — only the glyph
 * signals checked in that state). The outer hit target is always the visual
 * box at 80% scale (Figma spec), for a bigger tap area than the visible square.
 *
 * Renders a real `role="checkbox"` button by default so it works standalone
 * (e.g. a list row's bulk-select control). Set `interactive={false}` to
 * render a plain presentational glyph instead — for composing inside a
 * parent that already owns the click/keyboard handling (see ui/Checkbox).
 * Styling in index.module.css.
 */

export type CheckboxSize = "sm" | "md";

interface CheckboxBaseProps {
  checked: boolean;
  /** Dash glyph instead of a check, for a "some but not all" parent state — only shown while checked. */
  indeterminate?: boolean;
  onChange?: (next: boolean) => void;
  size?: CheckboxSize;
  disabled?: boolean;
  "aria-label"?: string;
  /** false = plain presentational span, no button/focus/click (see ui/Checkbox). */
  interactive?: boolean;
}

function CheckIcon({ size }: { size: CheckboxSize }) {
  return (
    <svg width={size === "md" ? 13 : 10} height={size === "md" ? 10 : 8} viewBox="0 0 10 8" fill="none" aria-hidden="true">
      <path d="M1 4.2L3.6 6.8L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MinusIcon({ size }: { size: CheckboxSize }) {
  return (
    <svg width={size === "md" ? 10 : 8} height={size === "md" ? 2.5 : 2} viewBox="0 0 8 2" fill="none" aria-hidden="true">
      <path d="M1 1H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function CheckboxBase({
  checked,
  indeterminate = false,
  onChange,
  size = "sm",
  disabled = false,
  "aria-label": ariaLabel,
  interactive = true,
}: CheckboxBaseProps) {
  const rootClasses = [styles.root, styles[size]].filter(Boolean).join(" ");
  const boxClasses = [styles.box, styles[size], checked ? styles.checked : "", disabled ? styles.disabled : ""]
    .filter(Boolean)
    .join(" ");
  const glyph = checked ? (indeterminate ? <MinusIcon size={size} /> : <CheckIcon size={size} />) : null;

  if (!interactive) {
    return (
      <span className={rootClasses} aria-hidden>
        <span className={boxClasses}>{glyph}</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={rootClasses}
    >
      <span className={boxClasses}>{glyph}</span>
    </button>
  );
}

export default CheckboxBase;
