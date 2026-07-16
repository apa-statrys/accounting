import CloseIcon from "@mui/icons-material/Close";
import { motion, AnimatePresence } from "motion/react";
import { HeaderIconButton } from "./SheetHeader";

import { FONT } from "../lib/theme";

const backdrop = {
  closed: { opacity: 0 },
  open: { opacity: 1 },
};

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
  /** Hide the header close (✕) — e.g. a confirm dialog dismissed via its buttons. */
  hideClose?: boolean;
  /** DS header (Figma Bottomsheets, node 4038-3018): grabber indicator + 28px title + optional
      frosted `action` button — replaces the legacy title+✕ row (no ✕, no divider, 32px radius). */
  dsHeader?: boolean;
  /** 20px icon for the DS header's frosted 36px action button (dsHeader only). */
  action?: React.ReactNode;
  onAction?: () => void;
  actionLabel?: string;
  /** dsHeader only: frosted back-chevron button before the title (e.g. a nested sheet
   *  returning to its parent sheet). */
  onBack?: () => void;
  backLabel?: string;
  /** dsHeader only: center the title at 22px medium (instead of the 28px left title). */
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
export function BottomSheet({ open, title, onClose, children, footer, tall, heightClass, hideClose, dsHeader, action, onAction, actionLabel = "Action", onBack, backLabel = "Back", centerTitle, onContentScroll, compact }: BottomSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="absolute inset-0 z-40" initial="closed" animate="open" exit="closed">
          {/* Scrim — the receded page (layer behind) shows through */}
          <motion.div
            className="absolute inset-0 bg-black/25"
            variants={backdrop}
            transition={{ duration: 0.35 }}
            onClick={onClose}
            aria-hidden
          />

          {/* Sliding sheet — sized to its content, capped so long content scrolls */}
          <motion.div
            className={`absolute inset-x-0 bottom-0 flex flex-col ${heightClass ? `${heightClass} max-h-[88%]` : `max-h-[88%] ${tall ? "min-h-[78%]" : ""}`}`}
            variants={sheet}
          >
            {dsHeader ? (
              /* DS Bottomsheets header — grabber + 28px title + optional frosted action button
                 (same recipe as ui/BottomSheet; motion keeps living here) */
              <div className="bg-white rounded-t-[32px]">
                <div className="flex justify-center items-start h-6 pt-2">
                  <span className="w-12 h-[5px] rounded-full bg-[#1b1b1b]/30" />
                </div>
                <div className="flex items-center gap-3 h-[60px] px-4">
                  {onBack && (
                    <button
                      type="button"
                      className="flex items-center justify-center w-9 h-9 shrink-0 rounded-full text-[#1b1b1b]"
                      style={{
                        background: "var(--ds-white-40)",
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                        boxShadow: "var(--ds-shadow-menu-page-header)",
                      }}
                      onClick={onBack}
                      aria-label={backLabel}
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  )}
                  <p
                    className={
                      centerTitle
                        ? "flex-1 min-w-0 text-[22px] font-medium text-[#1b1b1b] text-center"
                        : "flex-1 min-w-0 text-[28px] font-medium text-[#1b1b1b]"
                    }
                    style={{ ...FONT, lineHeight: 0.9, letterSpacing: centerTitle ? "-0.66px" : "-1.4px" }}
                  >
                    {title}
                  </p>
                  {/* Invisible spacer balances the back button so a centered title stays optically centered. */}
                  {centerTitle && onBack && !action && <span className="w-9 h-9 shrink-0" aria-hidden />}
                  {action && (
                    <button
                      type="button"
                      className="flex items-center justify-center w-9 h-9 shrink-0 rounded-full text-[#1b1b1b]"
                      style={{
                        background: "var(--ds-white-40)",
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                        boxShadow: "var(--ds-shadow-menu-page-header)",
                      }}
                      onClick={onAction}
                      aria-label={actionLabel}
                    >
                      {action}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-white rounded-t-2xl border-b border-[#f0f0f0] px-6 pt-3 pb-3">
                <p className="h4 text-[#1b1b1b]" style={FONT}>
                  {title}
                </p>
                {!hideClose && (
                  <HeaderIconButton aria-label="Close" onClick={onClose}>
                    <CloseIcon />
                  </HeaderIconButton>
                )}
              </div>
            )}

            {/* dsHeader sheets align content to the DS 16px side padding (title row is px-4);
                legacy-header sheets keep px-6 to match their px-6 title. */}
            <div className={`flex-1 min-h-0 overflow-y-auto thin-scrollbar bg-white ${dsHeader ? "px-4" : "px-6"} ${compact ? "pt-1 pb-2" : "pt-5 pb-8"}`} onScroll={onContentScroll}>
              <motion.div variants={list}>{children}</motion.div>
            </div>

            {footer && <div className="bg-white">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default BottomSheet;
