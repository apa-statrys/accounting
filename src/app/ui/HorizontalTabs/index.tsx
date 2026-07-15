import styles from "./index.module.css";
import { TabsBase } from "../TabsBase";

/**
 * HorizontalTabs — design-system tab row (Figma "[APP] Design System" → "HorzontalTabs"
 * [sic], node 2725-16713; renamed to the correct spelling in code). A row of TabsBase
 * items; styling in index.module.css.
 */

interface HorizontalTabsProps {
  tabs: string[];
  activeIndex: number;
  onChange: (index: number) => void;
  size?: "md" | "lg";
  variant?: "button" | "underline";
}

export function HorizontalTabs({ tabs, activeIndex, onChange, size = "md", variant = "button" }: HorizontalTabsProps) {
  return (
    <div className={styles.scroller}>
      <div
        role="tablist"
        className={`${styles.row} ${variant === "button" ? styles.buttonRow : styles.underlineRow}`}
      >
        {variant === "underline" && <span className={styles.track} />}
        {tabs.map((label, i) => (
          <TabsBase
            key={i}
            label={label}
            size={size}
            variant={variant}
            active={i === activeIndex}
            onClick={() => onChange(i)}
          />
        ))}
      </div>
    </div>
  );
}

export default HorizontalTabs;
