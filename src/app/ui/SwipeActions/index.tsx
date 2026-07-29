import styles from "./index.module.css";

/**
 * SwipeActions — design-system swipe-to-reveal action pair (Figma "[APP] Design
 * System" → SwipeActions, node 4313-8369): a neutral "more" button + a red "delete"
 * button, each 32px. Purely presentational — this renders the revealed buttons only;
 * wiring up the actual swipe/drag gesture that reveals them is the caller's job (see
 * ui/ListRow's `swiped` prop for how it's composed into a row).
 */

interface SwipeActionsProps {
  onMore?: () => void;
  onDelete?: () => void;
  /** Hide the "more" button — some rows only ever offer delete. */
  showMore?: boolean;
}

function MoreIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="4.5" r="1.25" fill="currentColor" />
      <circle cx="10" cy="10" r="1.25" fill="currentColor" />
      <circle cx="10" cy="15.5" r="1.25" fill="currentColor" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M3.33 5.83h13.34M8.33 9.17v4.16M11.67 9.17v4.16M4.58 5.83l.72 8.34a1.67 1.67 0 0 0 1.66 1.5h6.08a1.67 1.67 0 0 0 1.66-1.5l.72-8.34M7.5 5.83V3.75a.83.83 0 0 1 .83-.83h3.34a.83.83 0 0 1 .83.83v2.08"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SwipeActions({ onMore, onDelete, showMore = true }: SwipeActionsProps) {
  return (
    <div className={styles.root}>
      {showMore && (
        <button type="button" className={styles.more} onClick={onMore} aria-label="More actions">
          <MoreIcon />
        </button>
      )}
      <button type="button" className={styles.delete} onClick={onDelete} aria-label="Delete">
        <TrashIcon />
      </button>
    </div>
  );
}

export default SwipeActions;
