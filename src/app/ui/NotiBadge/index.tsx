import styles from "./index.module.css";

/**
 * NotiBadge — design-system unread-count pill (Figma "[APP] Design System" →
 * NotiBadge, node 4532-223). Non-interactive, meant to overlay a corner of
 * another element (e.g. ui/TabsBase). `inverse` swaps it to a white pill with
 * a brand border/text — used when the badge sits on a brand-colored surface
 * (e.g. an active button-style tab) where the solid variant would disappear.
 */

interface NotiBadgeProps {
  count?: string;
  inverse?: boolean;
  className?: string;
}

export function NotiBadge({ count = "99+", inverse = false, className }: NotiBadgeProps) {
  const classes = [styles.badge, inverse ? styles.inverse : styles.solid, className].filter(Boolean).join(" ");
  return (
    <span className={classes} aria-hidden={false}>
      {count}
    </span>
  );
}

export default NotiBadge;
