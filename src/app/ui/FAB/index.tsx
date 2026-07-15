import { useState } from "react";
import styles from "./index.module.css";
import buttonStyles from "../Button/index.module.css";
import { hierarchyClass, type Hierarchy } from "../Button";

/**
 * FAB — design-system floating action button (Figma "[APP] Design System" → FAB,
 * node 4141-6164). Same color rules as Button (color classes imported from
 * ui/Button/index.module.css); what differs: fully-rounded pill shape, Shadow/lg,
 * 20px icon slots, and a Circle shape (46×46, icon-only).
 */

interface FABProps {
  label?: string;
  onClick?: () => void;
  hierarchy?: Hierarchy;
  /** Icon-only circle FAB (46×46); pass the icon via `icon`. */
  circle?: boolean;
  /** Rounded pill only: smoothly morph into a 46px circle (label folds away,
   *  the iconLeft stays). Toggle it on scroll for the pill→circle interaction. */
  collapsed?: boolean;
  icon?: React.ReactNode;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  disabled?: boolean;
  inverse?: boolean;
  /** Extra layout classes from the call site (positioning) — not for colors. */
  className?: string;
  "aria-label"?: string;
  /** Pin the pressed ("Active") look — for the showcase's static state grid only. */
  forceActive?: boolean;
}

export function FAB({
  label,
  onClick,
  hierarchy = "primary",
  circle = false,
  collapsed = false,
  icon,
  iconLeft,
  iconRight,
  disabled = false,
  inverse = false,
  className,
  "aria-label": ariaLabel,
  forceActive = false,
}: FABProps) {
  const [pressed, setPressed] = useState(false);
  const classes = [
    styles.fab,
    circle ? styles.circle : styles.rounded,
    !circle && collapsed ? styles.collapsed : "",
    hierarchyClass(hierarchy, inverse),
    (pressed || forceActive) && !disabled ? buttonStyles.active : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      onPointerDown={() => !disabled && setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className={classes}
    >
      {circle ? (
        icon
      ) : (
        <>
          {iconLeft}
          {label && <span className={styles.label}>{label}</span>}
          {iconRight}
        </>
      )}
    </button>
  );
}

export default FAB;
