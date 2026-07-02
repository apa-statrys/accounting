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
  /** Fires when the scrollable content scrolls (e.g. to collapse an inline search). */
  onContentScroll?: React.UIEventHandler<HTMLDivElement>;
}

/** Shared fixed height for the Add-Services sheet and its nested pickers, so they match exactly. */
export const SERVICE_SHEET_HEIGHT = "h-[68%]";

/**
 * Modal bottom sheet shell — shared open/close motion for all pickers.
 * The parent screen handles the "book-page" recede of the page behind.
 * See memory: bottom-sheet-animation.
 */
export function BottomSheet({ open, title, onClose, children, footer, tall, heightClass, hideClose, onContentScroll }: BottomSheetProps) {
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

            <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar bg-white px-6 pt-5 pb-8" onScroll={onContentScroll}>
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
