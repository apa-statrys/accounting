import { CheckboxBase } from "../CheckboxBase";
import styles from "./index.module.css";

/**
 * Checkbox — design-system labeled checkbox row (Figma "[APP] Design System" →
 * Checkbox, node 4127-8103). A sm CheckboxBase glyph plus a title + optional
 * description, the whole row clickable/keyboard-toggleable — not just the
 * glyph. The glyph itself is rendered non-interactive (CheckboxBase
 * `interactive={false}`) so there's one focus stop and one click handler for
 * the row, not two nested controls. Styling in index.module.css.
 */

interface CheckboxProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  /** Muted second line under the label (Figma showDescription). */
  description?: string;
  indeterminate?: boolean;
  disabled?: boolean;
  /** Checkbox after the label instead of before it — the list-row pattern (label left, glyph
   *  right, space-between) used by e.g. a Filters sheet's multi-select rows, as opposed to this
   *  component's own default "Remember me" order (glyph left, label right). */
  reverse?: boolean;
}

export function Checkbox({ checked, onChange, label, description, indeterminate = false, disabled = false, reverse = false }: CheckboxProps) {
  const toggle = () => !disabled && onChange(!checked);
  const glyph = <CheckboxBase checked={checked} indeterminate={indeterminate} disabled={disabled} size="sm" interactive={false} />;
  const text = (
    <div className={styles.textBlock}>
      <p className={styles.label}>{label}</p>
      {description && <p className={styles.description}>{description}</p>}
    </div>
  );
  return (
    <div
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          toggle();
        }
      }}
      className={`${styles.row} ${reverse ? styles.reverse : ""} ${disabled ? styles.disabled : ""} ${!description ? styles.textOnly : ""}`}
    >
      {reverse ? (
        <>
          {text}
          {glyph}
        </>
      ) : (
        <>
          {glyph}
          {text}
        </>
      )}
    </div>
  );
}

export default Checkbox;
