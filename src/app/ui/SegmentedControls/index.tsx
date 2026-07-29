import { SegmentedControlBase } from "../SegmentedControlBase";
import styles from "./index.module.css";

/**
 * SegmentedControls — design-system segment row (Figma "[APP] Design System"
 * → SegmentedControls, node 4587-1099). A beige track of 2-4
 * ui/SegmentedControlBase segments; a hairline separator appears between two
 * adjacent segments that are both inactive (never next to the active one).
 * Styling in index.module.css.
 */

interface SegmentedControlsProps {
  /** 2-4 segment labels. */
  segments: string[];
  activeIndex: number;
  onChange: (index: number) => void;
}

export function SegmentedControls({ segments, activeIndex, onChange }: SegmentedControlsProps) {
  const items: React.ReactNode[] = [];
  segments.forEach((label, i) => {
    const active = i === activeIndex;
    const prevActive = i - 1 === activeIndex;
    if (i > 0 && !active && !prevActive) {
      items.push(<span key={`sep-${i}`} className={styles.separator} />);
    }
    items.push(
      <SegmentedControlBase key={i} label={label} active={active} onClick={() => onChange(i)} />
    );
  });
  return (
    <div role="tablist" className={styles.track}>
      {items}
    </div>
  );
}

export default SegmentedControls;
