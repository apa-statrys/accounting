import styles from "./index.module.css";

/**
 * Chips — design-system filter toggle (Figma "[APP] Design System" → Chips,
 * node 4565-2176). A single 30px pill: transparent background, black label
 * in both states — only the border switches (Border/Neutral/primary at rest,
 * black Button/btn-secondary when active). Styling in index.module.css.
 */

interface ChipsProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export function Chips({ label, active = false, onClick }: ChipsProps) {
  return (
    <button
      type="button"
      className={`${styles.chip} ${active ? styles.active : ""}`}
      aria-pressed={active}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export default Chips;
