import { motion } from "motion/react";
import styles from "./index.module.css";

/**
 * SegmentedControlBase — design-system single segment (Figma "[APP] Design
 * System" → SegmentedControlBase, node 4587-1189). A tappable pill inside a
 * SegmentedControls track — white + shadow when active, transparent +
 * secondary text otherwise. Compose several via ui/SegmentedControls; styling
 * in index.module.css. The active pill (`.thumb`) is a shared framer-motion
 * `layoutId` element (added 2026-07-29, decided in-repo — Figma has no
 * prototype motion for this component) so it slides between segments
 * instead of popping; `thumbId` scopes that id per SegmentedControls
 * instance so two on the same page don't animate into each other.
 */

interface SegmentedControlBaseProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  /** Optional leading icon slot (Figma iconSwap), 16px. */
  icon?: React.ReactNode;
  /** Shared layoutId (from the parent ui/SegmentedControls) for the sliding active pill. */
  thumbId?: string;
}

export function SegmentedControlBase({ label, active = false, onClick, icon, thumbId }: SegmentedControlBaseProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`${styles.segment} ${active ? styles.active : ""}`}
    >
      {active && (
        <motion.span
          layoutId={thumbId}
          className={styles.thumb}
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
        />
      )}
      <span className={styles.content}>
        {icon}
        {label}
      </span>
    </button>
  );
}

export default SegmentedControlBase;
