import styles from "./index.module.css";

/**
 * TabsBase — design-system single tab item (Figma "[APP] Design System" → TabsBase,
 * node 2723-16660). Compose several into a row (see ui/HorizontalTabs) to make a
 * tab bar. Styling in index.module.css.
 */

interface TabsBaseProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  size?: "md" | "lg";
  variant?: "button" | "underline";
  /** Optional leading icon — 16px at md, 20px at lg. */
  icon?: React.ReactNode;
}

export function TabsBase({ label, active = false, onClick, size = "md", variant = "button", icon }: TabsBaseProps) {
  const classes = [
    styles.tab,
    styles[size],
    styles[variant],
    active ? styles.active : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button type="button" role="tab" aria-selected={active} onClick={onClick} className={classes}>
      {icon}
      {label}
    </button>
  );
}

export default TabsBase;
