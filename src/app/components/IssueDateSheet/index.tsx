import { useState } from "react";
import { motion } from "motion/react";
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
   *  calendar as a Title + Subtitle pair (helperText becomes the subtitle) — replaces the sheet's
   *  own "Select Issue Date" title, and is always visible (not gated on the viewed month like the
   *  plain below-calendar helperText is), since the whole reason the date needs picking is this. */
  helperTitle?: string;
  /** Lock the sheet open — tapping ✕ / the scrim won't dismiss it (a valid date must be picked). */
  locked?: boolean;
}

/** Issue Date picker — calendar view (choose day, month and year). */
export function IssueDateSheet({ open, value, onClose, onSelect, minDate, helperText, helperTitle, locked }: IssueDateSheetProps) {
  // The first day of the month currently in view (reported by the calendar) — drives helper visibility.
  const [viewMonth, setViewMonth] = useState<Date | null>(null);
  const showBelowHelper =
    !helperTitle && !!helperText && !!minDate && !!viewMonth && isBefore(viewMonth, startOfDay(minDate));

  return (
    <BottomSheet open={open} title={helperTitle ? "" : "Select Issue Date"} onClose={locked ? undefined : onClose}>
      <div className="flex flex-col gap-3">
        {helperTitle && (
          <motion.div variants={sheetItem} className="flex flex-col gap-1">
            <p className="card-title-md" style={{ ...FONT, color: INK }}>{helperTitle}</p>
            {helperText && (
              <p className="body-sm" style={{ ...FONT, color: MUTED }}>{helperText}</p>
            )}
          </motion.div>
        )}
        <motion.div variants={sheetItem}>
          <Calendar value={value} onChange={(d) => onSelect?.(d)} minDate={minDate} onViewChange={setViewMonth} />
        </motion.div>
        {showBelowHelper && (
          <motion.p
            variants={sheetItem}
            className="text-[13px] font-normal leading-[1.35]"
            style={{ ...FONT, color: "var(--text-secondary)" }}
          >
            {helperText}
          </motion.p>
        )}
      </div>
    </BottomSheet>
  );
}

export default IssueDateSheet;
