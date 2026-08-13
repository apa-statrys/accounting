import { Toggle } from "../../ui/Toggle";
import styles from "./index.module.css";

/**
 * PageControls — persistent "dev states" switcher for whichever screen is open, docked in
 * the right-side gutter beside the phone frame (same gutter DevInspector's hover panel uses).
 * Lets a dev/PO flip straight to a page's documented states (default/empty/etc.) without
 * digging through the QuickNav sidebar — and doubles as a live list of what states exist for
 * handoff. Purely presentational; App.tsx builds `groups` per screen from its own state.
 */

export interface PageControlOption {
  label: string;
  active: boolean;
  onSelect: () => void;
}

/** A plain on/off switch — for a group with exactly two states and no third variant, this reads
 *  faster than picking between two labeled buttons (e.g. "Applied CN"). */
export interface PageControlToggle {
  checked: boolean;
  onChange: (next: boolean) => void;
}

export interface PageControlGroup {
  label: string;
  /** Either a multi-option button list (2+ named states)... */
  options?: PageControlOption[];
  /** ...or a single on/off switch — mutually exclusive with `options`. */
  toggle?: PageControlToggle;
}

export function PageControls({ groups }: { groups: PageControlGroup[] }) {
  if (groups.length === 0) return null;

  return (
    <aside className={styles.panel}>
      <p className={styles.title}>Page States</p>
      <p className={styles.subtitle}>For dev handoff</p>
      {groups.map((group) => (
        <div key={group.label} className={styles.group}>
          {group.toggle ? (
            <div className={styles.toggleRow}>
              <p className={styles.groupLabel}>{group.label}</p>
              <Toggle checked={group.toggle.checked} onChange={group.toggle.onChange} aria-label={group.label} />
            </div>
          ) : (
            <>
              <p className={styles.groupLabel}>{group.label}</p>
              <div className={styles.options}>
                {group.options?.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={opt.onSelect}
                    className={[styles.option, opt.active ? styles.optionActive : ""].filter(Boolean).join(" ")}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      ))}
    </aside>
  );
}

export default PageControls;
