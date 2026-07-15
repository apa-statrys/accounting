import styles from "./index.module.css";

/**
 * Tooltip — design-system tooltip bubble (Figma "[APP] Design System" → Tooltip,
 * node 2432-14400). Static display component: it renders the bubble + arrow only;
 * positioning next to the target element is the caller's job. Non-interactive.
 * Default is the beige bubble (for dark surfaces); `inverse` is the dark bubble
 * (for light surfaces). A `description` switches to the two-line supporting-text
 * layout (12px padding, 320px max width).
 */

export type TooltipArrow = "none" | "top" | "bottom" | "bottom-left" | "bottom-right" | "left" | "right";

interface TooltipProps {
  title: string;
  /** Supporting text under the title — enables the wide two-line layout. */
  description?: string;
  /** Dark bubble for light surfaces (default beige bubble is for dark surfaces). */
  inverse?: boolean;
  /** Which side the arrow sits on / points toward. */
  arrow?: TooltipArrow;
  className?: string;
}

/* Rounded 16×8.5 triangle from Figma, drawn pointing down; rotated per direction. */
const ARROW_PATH =
  "M14.0711 0C14.962 0 15.4081 1.07714 14.7782 1.70711L8.70711 7.77818C8.31658 8.16871 7.68342 8.16871 7.29289 7.77818L1.22183 1.70711C0.591867 1.07714 1.03803 0 1.92894 0H14.0711Z";

function Arrow({ dir }: { dir: "up" | "down" | "left" | "right" }) {
  const sideways = dir === "left" || dir === "right";
  const transform =
    dir === "up"
      ? "rotate(180 8 4.2574)"
      : dir === "left"
        ? "translate(8.5147 0) rotate(90)"
        : dir === "right"
          ? "translate(0 16) rotate(-90)"
          : undefined;
  return (
    <svg
      className={styles.arrow}
      width={sideways ? 8.5147 : 16}
      height={sideways ? 16 : 8.5147}
      viewBox={sideways ? "0 0 8.5147 16" : "0 0 16 8.5147"}
      fill="none"
      aria-hidden="true"
    >
      <path d={ARROW_PATH} transform={transform} />
    </svg>
  );
}

const DIR_CLASS: Record<TooltipArrow, string> = {
  none: "",
  top: styles.top,
  bottom: styles.bottom,
  "bottom-left": styles.bottomLeft,
  "bottom-right": styles.bottomRight,
  left: styles.left,
  right: styles.right,
};

export function Tooltip({ title, description, inverse = false, arrow = "none", className }: TooltipProps) {
  const classes = [
    styles.root,
    DIR_CLASS[arrow],
    inverse ? styles.inverse : "",
    description ? styles.withDescription : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  // Arrow points away from the bubble: above the bubble it points up, etc.
  const arrowBefore = arrow === "top" || arrow === "left";
  const arrowDir = arrow === "top" ? "up" : arrow === "left" ? "left" : arrow === "right" ? "right" : "down";
  return (
    <div className={classes} role="tooltip">
      {arrowBefore && <Arrow dir={arrowDir} />}
      <div className={styles.bubble}>
        {title}
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {!arrowBefore && arrow !== "none" && <Arrow dir={arrowDir} />}
    </div>
  );
}

export default Tooltip;
