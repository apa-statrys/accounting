import { useState } from "react";
import styles from "./index.module.css";

/**
 * Button — design-system button (Figma "[APP] Design System" → Button, node 537-1561).
 * Variants: Hierarchy(primary|secondary|tertiary) × Size(md|sm) × Shape(rec|square) ×
 * Inverse(false|true, for dark surfaces) × states Default / Active / Disable.
 * Figma's "Active" is the pressed state: it applies while the finger/mouse is down.
 * All styling lives in index.module.css (colors via ui/tokens.css).
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
  label?: string;
  onClick?: () => void;
  hierarchy?: Hierarchy;
  size?: "md" | "sm";
  /** Icon-only square button (44×44 md / 30×30 sm); pass the icon via `icon`. */
  square?: boolean;
  icon?: React.ReactNode;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  disabled?: boolean;
  fullWidth?: boolean;
  /** Dark-surface (Inverse=True) variants — cream fill / cream outline / cream text. */
  inverse?: boolean;
  type?: "button" | "submit";
  /** Extra layout classes from the call site (widths, flex) — not for colors. */
  className?: string;
  "aria-label"?: string;
  /** Pin the pressed ("Active") look — for the showcase's static state grid only. */
  forceActive?: boolean;
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
  fullWidth = false,
  inverse = false,
  type = "button",
  className,
  "aria-label": ariaLabel,
  forceActive = false,
}: ButtonProps) {
  const [pressed, setPressed] = useState(false);
  const classes = [
    styles.root,
    square ? (size === "md" ? styles.squareMd : styles.squareSm) : size === "md" ? styles.md : styles.sm,
    hierarchyClass(hierarchy, inverse),
    (pressed || forceActive) && !disabled ? styles.active : "",
    fullWidth ? styles.fullWidth : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button
      type={type}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      onPointerDown={() => !disabled && setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className={classes}
    >
      {square ? (
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
