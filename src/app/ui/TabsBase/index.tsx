import { NotiBadge } from "../NotiBadge";
import styles from "./index.module.css";

/**
 * TabsBase — design-system single tab item (Figma "[APP] Design System" → TabsBase,
 * node 2723-16660 — updated 2026-07-23: the size (md|lg) axis was dropped, sized by
 * padding alone now; updated 2026-07-24: added the `unread` NotiBadge slot, and fixed
 * the label type to Body sm/Medium (14px) — it had drifted to Caption (12px)).
 * Compose several into a row (see ui/HorizontalTabs) to make a tab bar. Styling in
 * index.module.css.
 */

interface TabsBaseProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  variant?: "button" | "underline";
  /** Optional leading icon — 12px (Figma "DropdownIcon" slot). */
  icon?: React.ReactNode;
  /** Unread count (Figma showUnread) — renders a ui/NotiBadge in the corner. Button-style
   *  overlays it absolutely on the tab's edge; underline-style sits it inline after the label.
   *  Active + button-style flips the badge to `inverse` since the tab itself is brand-colored. */
  unread?: string;
}

export function TabsBase({ label, active = false, onClick, variant = "button", icon, unread }: TabsBaseProps) {
  const classes = [
    styles.tab,
    styles[variant],
    active ? styles.active : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button type="button" role="tab" aria-selected={active} onClick={onClick} className={classes}>
      {icon}
      {label}
      {unread && (
        <NotiBadge
          count={unread}
          inverse={active && variant === "button"}
          className={variant === "button" ? styles.badgeOverlay : styles.badgeInline}
        />
      )}
    </button>
  );
}

export default TabsBase;
