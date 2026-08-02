import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { isBefore, startOfDay } from "date-fns";
import { BottomSheet, sheetItem } from "../BottomSheet";
import { Calendar } from "../Calendar";
import { FONT, INK, MUTED } from "../../lib/theme";

interface IssueDateSheetProps {
  open: boolean;
  value?: Date;
  onClose?: () => void;
  onSelect?: (date: Date) => void;
  /** Disable dates before this day (e.g. a closed accounting period boundary). */
  minDate?: Date;
  /** Warning-coloured helper line below the calendar (e.g. why early dates are unavailable). Only
   *  shown while the viewed month actually contains disabled dates — hidden once past the boundary.
   *  Doubles as the subtitle when `helperTitle` is also set (see below). */
  helperText?: string;
  /** Locked-period case only: a short heading (e.g. "Accounting period closed") shown ABOVE the
   *  calendar as a Title + Subtitle pair (helperText becomes the subtitle). The sheet's own
   *  "Select Issue Date" title stays as-is (2026-08-02: no longer replaced) — this is additional
   *  context, not a retitle. Same viewed-month gating as the plain below-calendar helperText:
   *  hidden once the user browses past the locked-period boundary to a month that's fully
   *  selectable, not always visible. */
  helperTitle?: string;
  /** Lock the sheet open — tapping ✕ / the scrim won't dismiss it (a valid date must be picked). */
  locked?: boolean;
}

/** Issue Date picker — calendar view (choose day, month and year). */
export function IssueDateSheet({ open, value, onClose, onSelect, minDate, helperText, helperTitle, locked }: IssueDateSheetProps) {
  // The first day of the month currently in view (reported by the calendar) — drives helper
  // visibility for BOTH placements (above-with-title and plain-below): only relevant while the
  // viewed month actually contains disabled dates, hidden once browsed past the boundary.
  const [viewMonth, setViewMonth] = useState<Date | null>(null);
  const showHelper = !!helperText && !!minDate && !!viewMonth && isBefore(viewMonth, startOfDay(minDate));

  return (
    <BottomSheet open={open} title="Select Issue Date" onClose={locked ? undefined : onClose}>
      <div className="flex flex-col gap-3">
        {/* Local AnimatePresence so browsing past the locked-period boundary fades this out
            instead of an instant unmount — `exit="closed"` reuses sheetItem's own closed state,
            since this row still relies on the outer stagger container's propagated "open" for entry. */}
        <AnimatePresence>
          {helperTitle && showHelper && (
            <motion.div variants={sheetItem} exit="closed" className="flex flex-col gap-1">
              <p className="card-title-md" style={{ ...FONT, color: INK }}>{helperTitle}</p>
              {helperText && (
                <p className="body-sm" style={{ ...FONT, color: MUTED }}>{helperText}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div variants={sheetItem}>
          <Calendar value={value} onChange={(d) => onSelect?.(d)} minDate={minDate} onViewChange={setViewMonth} />
        </motion.div>
        <AnimatePresence>
          {!helperTitle && showHelper && (
            <motion.p
              variants={sheetItem}
              exit="closed"
              className="text-[13px] font-normal leading-[1.35]"
              style={{ ...FONT, color: "var(--text-secondary)" }}
            >
              {helperText}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </BottomSheet>
  );
}

export default IssueDateSheet;
