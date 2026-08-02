import { useState } from "react";
import styles from "./index.module.css";

/**
 * Button — design-system button (Figma "[APP] Design System" → Button, node 537-1561).
 * Variants: Hierarchy(primary|secondary|tertiary) × Size(md|sm) × Shape(rec|square) ×
 * Inverse(false|true, for dark surfaces) × states Default / Active / Disable.
 * Figma's "Active" is the pressed state: it applies while the finger/mouse is down.
 * All styling lives in index.module.css (colors via styles/theme.css).
 */

export type Hierarchy = "primary" | "secondary" | "tertiary";

/** Color-class lookup, shared with FAB (which imports this module's color classes). */
export function hierarchyClass(hierarchy: Hierarchy, inverse: boolean): string {
  if (!inverse) return styles[hierarchy];
  return {
    primary: styles.inversePrimary,
    secondary: styles.inverseSecondary,
    tertiary: styles.inverseTertiary,
  }[hierarchy];
}

interface ButtonProps {
  /** Usually a string; accepts a node so a caller can crossfade the label text in place
   *  (e.g. a brief "Sent" confirmation) without animating the whole button. */
  label?: React.ReactNode;
  onClick?: () => void;
  hierarchy?: Hierarchy;
  size?: "md" | "sm";
  /** Icon-only square button (44×44 md / 30×30 sm); pass the icon via `icon`. */
  square?: boolean;
  icon?: React.ReactNode;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  disabled?: boolean;
  /** Loading state (Figma node 4591-5847) — swaps label/icons for a 3-dot bounce
   *  indicator in the button's own text color, keeps the pressed/Active bg+stroke
   *  color (a press is what triggers loading), and ignores clicks while true. */
  loading?: boolean;
  fullWidth?: boolean;
  /** Dark-surface (Inverse=True) variants — cream fill / cream outline / cream text. */
  inverse?: boolean;
  type?: "button" | "submit";
  /** Extra layout classes from the call site (widths, flex) — not for colors. */
  className?: string;
  "aria-label"?: string;
  /** Pin the pressed ("Active") look — for the showcase's static state grid only. */
  forceActive?: boolean;
  /** Marks an irreversible action (e.g. "Delete Draft"). Only the filled PRIMARY hierarchy turns
   *  red — that's the one spot the strong destructive color belongs. SECONDARY stays neutral
   *  instead (neutral border + neutral-primary fill + ink text, same lower-emphasis weight as a
   *  plain secondary button — red is reserved for the leading action). Ignored on `inverse`. */
  destructive?: boolean;
}

export function Button({
  label,
  onClick,
  hierarchy = "primary",
  size = "md",
  square = false,
  icon,
  iconLeft,
  iconRight,
  disabled = false,
  loading = false,
  fullWidth = false,
  inverse = false,
  type = "button",
  className,
  "aria-label": ariaLabel,
  forceActive = false,
  destructive = false,
}: ButtonProps) {
  const [pressed, setPressed] = useState(false);
  const classes = [
    styles.root,
    square ? (size === "md" ? styles.squareMd : styles.squareSm) : size === "md" ? styles.md : styles.sm,
    hierarchyClass(hierarchy, inverse),
    destructive && !inverse ? styles.destructive : "",
    (pressed || forceActive || loading) && !disabled ? styles.active : "",
    fullWidth ? styles.fullWidth : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button
      type={type}
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
      disabled={disabled}
      onClick={loading ? undefined : onClick}
      onPointerDown={() => !disabled && !loading && setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className={classes}
    >
      {loading ? (
        <span className={`${styles.dots} ${size === "sm" ? styles.dotsSm : ""}`} aria-hidden="true">
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </span>
      ) : square ? (
        icon
      ) : (
        <>
          {iconLeft}
          {label}
          {iconRight}
        </>
      )}
    </button>
  );
}

export default Button;
