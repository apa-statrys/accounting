import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Overlay } from "../../ui/Overlay";
import styles from "./index.module.css";

const sheet = {
  closed: {
    y: "100%",
    transition: { type: "tween" as const, duration: 0.4, ease: [0.4, 0, 0.6, 1] as const },
  },
  open: {
    y: 0,
    transition: { type: "spring" as const, stiffness: 340, damping: 34 },
  },
};

const list = {
  closed: {},
  open: { transition: { staggerChildren: 0.05, delayChildren: 0.18 } },
};

/** Per-field "fade + rise" — wrap each child you want staggered in `<motion.div variants={sheetItem}>`. */
export const sheetItem = {
  closed: { opacity: 0, y: 14 },
  open: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

interface BottomSheetProps {
  open: boolean;
  title: string;
  onClose?: () => void;
  children: React.ReactNode;
  /** Pinned footer (e.g. a ButtonDock) rendered below the scrollable content. */
  footer?: React.ReactNode;
  /** Reserve a taller minimum height (e.g. to match the Add Services sheet). */
  tall?: boolean;
  /** Pin to a fixed height (Tailwind class, e.g. "h-[68%]") so sibling sheets match exactly. */
  heightClass?: string;
  /** 20px icon for the header's frosted 36px action button. */
  action?: React.ReactNode;
  onAction?: () => void;
  actionLabel?: string;
  /** Frosted back-chevron button before the title (e.g. a nested sheet returning to its parent sheet). */
  onBack?: () => void;
  backLabel?: string;
  /** Center the title using the smaller card-title-md scale (instead of the default left-aligned card-title-lg). */
  centerTitle?: boolean;
  /** Fires when the scrollable content scrolls (e.g. to collapse an inline search). */
  onContentScroll?: React.UIEventHandler<HTMLDivElement>;
  /** Tighter vertical padding around the content — for short confirm sheets. */
  compact?: boolean;
}

/** Shared fixed height for the Add-Services sheet and its nested pickers, so they match exactly. */
export const SERVICE_SHEET_HEIGHT = "h-[68%]";

/**
 * Modal bottom sheet shell — shared open/close motion for all pickers.
 * The parent screen handles the "book-page" recede of the page behind.
 * See memory: bottom-sheet-animation.
 */
export function BottomSheet({ open, title, onClose, children, footer, tall, heightClass, action, onAction, actionLabel = "Action", onBack, backLabel = "Back", centerTitle, onContentScroll, compact }: BottomSheetProps) {
  // Drives the header's frost — same transparent-at-rest/frosted-on-scroll
  // recipe as components/PageAppHeader, but tracked internally so every sheet
  // gets it for free (no per-screen `scrolled` plumbing needed).
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    if (!open) setScrolled(false);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className={styles.overlay} initial="closed" animate="open" exit="closed">
          {/* Scrim — the receded page (layer behind) shows through */}
          <Overlay onClick={onClose} />

          {/* Sliding sheet — sized to its content, capped so long content scrolls */}
          <motion.div
            className={[styles.panel, heightClass || "", !heightClass && tall ? styles.panelTall : ""]
              .filter(Boolean)
              .join(" ")}
            variants={sheet}
          >
            {/* Scrollable area — the grabber+title header sticks to its top (frosting
                as content scrolls beneath it), everything else scrolls normally. */}
            <div
              className={["thin-scrollbar", styles.scrollArea].join(" ")}
              onScroll={(e) => {
                setScrolled(e.currentTarget.scrollTop > 4);
                onContentScroll?.(e);
              }}
            >
              {/* Bottomsheets header (Figma "[APP] Design System" → Bottomsheets, node 4038-2684):
                  grabber + 28px/22px title + optional frosted action button. No ✕ — sheets dismiss
                  via the scrim or a footer button. */}
              <div className={[styles.dsHeader, scrolled ? styles.scrolled : ""].join(" ")}>
                <div className={styles.frost} aria-hidden />
                <div className={styles.grabberRow}>
                  <span className={styles.grabber} />
                </div>
                {/* Titleless menu sheets (e.g. the ⋯ actions menu) show just the grabber — the 60px
                    title row is collapsed to a small gap when there's no title / back / action. */}
                {!title && !onBack && !action ? (
                  <div className={styles.titlelessGap} />
                ) : (
                <div className={styles.titleRow}>
                  {onBack && (
                    <button
                      type="button"
                      className={styles.iconButton}
                      onClick={onBack}
                      aria-label={backLabel}
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  )}
                  <p className={centerTitle ? styles.dsTitleCentered : styles.dsTitle}>
                    {title}
                  </p>
                  {/* Invisible spacer balances the back button so a centered title stays optically centered. */}
                  {centerTitle && onBack && !action && <span className={styles.spacer} aria-hidden />}
                  {action && (
                    <button
                      type="button"
                      className={styles.iconButton}
                      onClick={onAction}
                      aria-label={actionLabel}
                    >
                      {action}
                    </button>
                  )}
                </div>
                )}
              </div>

              {/* Aligns to the DS 16px side padding (title row is px-4) and, per Figma's
                  Bottomsheets Content slot (node 4038-2685 / 2585), has no vertical padding by default. */}
              <div className={[styles.content, compact ? styles.contentCompact : ""].join(" ")}>
                <motion.div variants={list}>{children}</motion.div>
              </div>
            </div>

            {footer ? (
              <div className={styles.footer}>{footer}</div>
            ) : (
              // No footer: Figma's fixed 32px "Padding Bottom" spacer (node 4038-3023) —
              // compact sheets keep their own smaller contentCompact bottom padding instead.
              !compact && <div className={styles.bottomPad} />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default BottomSheet;
