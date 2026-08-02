import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { isBefore, startOfDay } from "date-fns";
import { BottomSheet, sheetItem } from "../BottomSheet";
import { Calendar } from "../Calendar";
import { FONT } from "../../lib/theme";

interface IssueDateSheetProps {
  open: boolean;
  value?: Date;
  onClose?: () => void;
  onSelect?: (date: Date) => void;
  /** Disable dates before this day (e.g. a closed accounting period boundary). */
  minDate?: Date;
  /** Warning-coloured helper line above the calendar (e.g. why early dates are unavailable). Only
   *  shown while the viewed month actually contains disabled dates — hidden once past the boundary.
   *  Plain text, no bold heading (2026-08-02: dropped the earlier Title+Subtitle treatment — same
   *  wording, just not styled as a heading). */
  helperText?: string;
  /** Optional short lead-in line shown above `helperText`, in the exact same plain style (e.g.
   *  "Accounting period closed" before "Dates on or before 31 Dec 2026 aren't available."). The
   *  sheet's own "Select Issue Date" title never changes — this is additional context, not a
   *  retitle. Same viewed-month gating as `helperText`. */
  helperTitle?: string;
  /** Lock the sheet open — tapping ✕ / the scrim won't dismiss it (a valid date must be picked). */
  locked?: boolean;
}

/** Issue Date picker — calendar view (choose day, month and year). */
export function IssueDateSheet({ open, value, onClose, onSelect, minDate, helperText, helperTitle, locked }: IssueDateSheetProps) {
  // The first day of the month currently in view (reported by the calendar) — drives helper
  // visibility: only relevant while the viewed month actually contains disabled dates, hidden
  // once browsed past the boundary.
  const [viewMonth, setViewMonth] = useState<Date | null>(null);
  const showHelper = !!helperText && !!minDate && !!viewMonth && isBefore(viewMonth, startOfDay(minDate));
  const helperStyle = { ...FONT, color: "var(--text-secondary)" };

  return (
    <BottomSheet open={open} title="Select Issue Date" onClose={locked ? undefined : onClose}>
      <div className="flex flex-col gap-3">
        {/* Local AnimatePresence so browsing past the locked-period boundary fades this out
            instead of an instant unmount — `exit="closed"` reuses sheetItem's own closed state,
            since this row still relies on the outer stagger container's propagated "open" for entry. */}
        <AnimatePresence>
          {showHelper && (
            <motion.div variants={sheetItem} exit="closed" className="flex flex-col gap-0.5">
              {helperTitle && (
                <p className="text-[13px] font-normal leading-[1.35]" style={helperStyle}>{helperTitle}</p>
              )}
              <p className="text-[13px] font-normal leading-[1.35]" style={helperStyle}>{helperText}</p>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div variants={sheetItem}>
          <Calendar value={value} onChange={(d) => onSelect?.(d)} minDate={minDate} onViewChange={setViewMonth} />
        </motion.div>
      </div>
    </BottomSheet>
  );
}

export default IssueDateSheet;
