import styles from "./index.module.css";

/**
 * BottomSheet — design-system bottom-sheet container (Figma "[APP] Design
 * System" → Bottomsheets, node 4038-3018). Presentational only: white panel
 * with 32px top radius, grabber, sticky header (28px title + optional 36px
 * frosted action button) and a 32px bottom pad around the content slot.
 * The modal behavior — scrim, slide-up motion, positioning — stays with the
 * caller (the app's components/BottomSheet.tsx keeps doing that until flows
 * adopt this). Figma's showStickyButton variant is composition: render a
 * ButtonDock after the content. Styling in index.module.css.
 */

interface BottomSheetProps {
  title?: string;
  /** 20px icon for the header's frosted 36px action button (Figma icon-swap slot). */
  action?: React.ReactNode;
  onAction?: () => void;
  /** Accessible name for the action button. */
  actionLabel?: string;
  /** Hide the whole header — grabber and title row (Figma showHeader). */
  showHeader?: boolean;
  children?: React.ReactNode;
}

export function BottomSheet({ title, action, onAction, actionLabel = "Action", showHeader = true, children }: BottomSheetProps) {
  return (
    <div className={styles.sheet}>
      {showHeader && (
        <div className={styles.header}>
          <div className={styles.indicator}>
            <span className={styles.grabber} />
          </div>
          <div className={styles.titleRow}>
            <p className={styles.title}>{title}</p>
            {action && (
              <button type="button" className={styles.actionButton} onClick={onAction} aria-label={actionLabel}>
                {action}
              </button>
            )}
          </div>
        </div>
      )}
      <div className={styles.content}>{children}</div>
      <div className={styles.bottomPad} />
    </div>
  );
}

export default BottomSheet;
