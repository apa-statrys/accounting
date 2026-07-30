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
  variant?: "button" | "underline";
  /** Per-tab unread count (Figma showUnread), aligned by index to `tabs` — omit an
   *  entry (or pass undefined) to leave that tab's badge off. */
  unread?: Array<string | undefined>;
}

export function HorizontalTabs({ tabs, activeIndex, onChange, variant = "button", unread }: HorizontalTabsProps) {
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
            variant={variant}
            active={i === activeIndex}
            onClick={() => onChange(i)}
            unread={unread?.[i]}
          />
        ))}
      </div>
    </div>
  );
}

export default HorizontalTabs;
