import styles from "./index.module.css";

/**
 * BottomSheet — design-system bottom-sheet container (Figma "[APP] Design
 * System" → Bottomsheets, node 4038-3018, showStickyButton toggle). Presentational
 * only: white panel with 32px top radius, sticky header (BottomsheetsHeader,
 * node 4038-2652: grabber + 28px title + optional 36px frosted action button)
 * and either a `footer` slot (BottomsheetsEnd, node 4127-7752 — pass a
 * `ButtonDock`, which already renders that gradient/blur/padding, don't
 * reimplement it here) or, with no footer, a plain 32px bottom pad. The modal
 * behavior — scrim, slide-up motion, positioning — stays with the caller (the
 * app's components/BottomSheet.tsx keeps doing that until flows adopt this).
 * Styling in index.module.css.
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
  /** Sticky footer slot (Figma showStickyButton) — pass a `ButtonDock`; renders
   *  in place of the plain bottom pad. */
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

export function BottomSheet({ title, action, onAction, actionLabel = "Action", showHeader = true, footer, children }: BottomSheetProps) {
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
      {footer ? <div className={styles.footer}>{footer}</div> : <div className={styles.bottomPad} />}
    </div>
  );
}

export default BottomSheet;
