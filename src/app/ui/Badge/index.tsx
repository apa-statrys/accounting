import styles from "./index.module.css";

/**
 * Badge — design-system status label (Figma "[APP] Design System" → Badge,
 * node 2723-16430). Non-interactive. Styling in index.module.css.
 * `color="custom"` is the brand gradient and exists only for bold/text styles
 * (no Subtle+Custom variant in Figma).
 */

export type BadgeColor = "neutral" | "success" | "warning" | "error" | "info" | "custom";

interface BadgeProps {
  label: string;
  size?: "sm" | "md" | "lg";
  variant?: "subtle" | "bold" | "text";
  color?: BadgeColor;
  /** Optional leading icon — 12px at sm/md, 16px at lg. */
  icon?: React.ReactNode;
}

export function Badge({ label, size = "md", variant = "subtle", color = "neutral", icon }: BadgeProps) {
  const classes = [styles.badge, styles[size], styles[color], styles[variant]].filter(Boolean).join(" ");
  const gradientText = color === "custom" && variant === "text";
  return (
    <span className={classes}>
      {icon}
      <span className={gradientText ? styles.gradientLabel : undefined}>{label}</span>
    </span>
  );
}

export default Badge;
