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
}

export function ListText({ text, description, flag, size = "md" }: ListTextProps) {
  if (flag) {
    return (
      <span className={`${styles.currency} ${size === "sm" ? styles.sm : styles.md}`}>
        <span className={styles.flag}>{flag}</span>
        <span className={styles.text}>{text}</span>
      </span>
    );
  }
  return (
    <span className={`${styles.root} ${size === "sm" ? styles.sm : styles.md}`}>
      <span className={styles.text}>{text}</span>
      {description && <span className={styles.description}>{description}</span>}
    </span>
  );
}

export default ListText;
