import { useState } from "react";
import styles from "./index.module.css";

/**
 * XClose — design-system close/dismiss button (Figma "[APP] Design System" → XClose,
 * node 1646-164). A square hit target (sm 20px / md 30px) around an X glyph, with its own
 * momentary Hover surface (Figma `state` axis). `inverse` swaps to the light-on-dark
 * palette for dark surfaces (e.g. ui/ToastMessage). Styling in index.module.css.
 */

export type XCloseSize = "sm" | "md";

interface XCloseProps {
  size?: XCloseSize;
  inverse?: boolean;
  onClick?: () => void;
  "aria-label"?: string;
}

export function XClose({ size = "sm", inverse = false, onClick, "aria-label": ariaLabel = "Close" }: XCloseProps) {
  const [hover, setHover] = useState(false);
  const classes = [styles.root, styles[size], inverse ? styles.inverse : "", hover ? styles.hover : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      className={classes}
    >
      <svg width={size === "md" ? 16 : 10} height={size === "md" ? 16 : 10} viewBox="0 0 10 10" fill="none" aria-hidden="true">
        <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      </svg>
    </button>
  );
}

export default XClose;
