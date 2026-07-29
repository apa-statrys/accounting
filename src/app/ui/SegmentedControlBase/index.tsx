import styles from "./index.module.css";

/**
 * SegmentedControlBase — design-system single segment (Figma "[APP] Design
 * System" → SegmentedControlBase, node 4587-1189). A tappable pill inside a
 * SegmentedControls track — white + shadow when active, transparent +
 * secondary text otherwise. Compose several via ui/SegmentedControls; styling
 * in index.module.css.
 */

interface SegmentedControlBaseProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  /** Optional leading icon slot (Figma iconSwap), 16px. */
  icon?: React.ReactNode;
}

export function SegmentedControlBase({ label, active = false, onClick, icon }: SegmentedControlBaseProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`${styles.segment} ${active ? styles.active : ""}`}
    >
      {icon}
      {label}
    </button>
  );
}

export default SegmentedControlBase;
