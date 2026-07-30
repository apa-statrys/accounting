import styles from "./index.module.css";

/**
 * ListText — design-system value display for a ListRow's trailing edge (Figma
 * "[APP] Design System" → ListText, node 4291-7735). Three layouts, inferred from
 * which props are set (no separate `type` enum): plain value, value + a right-aligned
 * description below it, or a leading flag/icon + value (the "Currency" layout — e.g.
 * a country flag + "USD"). Size(sm|md) controls the value's font size.
 */

interface ListTextProps {
  text: string;
  /** Second line under `text`, right-aligned, secondary color — mutually exclusive with `flag`. */
  description?: string;
  /** Leading icon (e.g. a country flag) — switches to the one-line "Currency" layout. */
  flag?: React.ReactNode;
  size?: "sm" | "md";
  /** Render `text` as a muted placeholder (e.g. an unset "Select issue date") — not a Figma axis,
   *  mirrors ui/TextField's placeholder state for a value that still needs picking. */
  placeholder?: boolean;
  /** Flag the value as invalid (e.g. a required field left unset) — red text, wins over `warning`. */
  error?: boolean;
  /** Soft attention state (e.g. a value that must be re-picked) — amber text. */
  warning?: boolean;
}

export function ListText({ text, description, flag, size = "md", placeholder = false, error = false, warning = false }: ListTextProps) {
  const textClass = [styles.text, error ? styles.error : warning ? styles.warning : placeholder ? styles.placeholder : ""]
    .filter(Boolean)
    .join(" ");
  if (flag) {
    return (
      <span className={`${styles.currency} ${size === "sm" ? styles.sm : styles.md}`}>
        <span className={styles.flag}>{flag}</span>
        <span className={textClass}>{text}</span>
      </span>
    );
  }
  return (
    <span className={`${styles.root} ${size === "sm" ? styles.sm : styles.md}`}>
      <span className={textClass}>{text}</span>
      {description && <span className={styles.description}>{description}</span>}
    </span>
  );
}

export default ListText;
