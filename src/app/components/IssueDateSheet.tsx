import { useState } from "react";
import { motion } from "motion/react";
import { isBefore, startOfDay } from "date-fns";
import { BottomSheet, sheetItem } from "./BottomSheet";
import { Calendar } from "./Calendar";
import { FONT } from "../lib/theme";

interface IssueDateSheetProps {
  open: boolean;
  value?: Date;
  onClose?: () => void;
  onSelect?: (date: Date) => void;
  /** Disable dates before this day (e.g. a closed accounting period boundary). */
  minDate?: Date;
  /** Warning-coloured helper line below the calendar (e.g. why early dates are unavailable). Only
   *  shown while the viewed month actually contains disabled dates — hidden once past the boundary. */
  helperText?: string;
  /** Lock the sheet open — tapping ✕ / the scrim won't dismiss it (a valid date must be picked). */
  locked?: boolean;
}

/** Issue Date picker — calendar view (choose day, month and year). */
export function IssueDateSheet({ open, value, onClose, onSelect, minDate, helperText, locked }: IssueDateSheetProps) {
  // The first day of the month currently in view (reported by the calendar) — drives helper visibility.
  const [viewMonth, setViewMonth] = useState<Date | null>(null);
  const showHelper =
    !!helperText && !!minDate && !!viewMonth && isBefore(viewMonth, startOfDay(minDate));

  return (
    <BottomSheet open={open} title="Issue Date" onClose={locked ? undefined : onClose}>
      <div className="flex flex-col gap-3">
        <motion.div variants={sheetItem}>
          <Calendar value={value} onChange={(d) => onSelect?.(d)} minDate={minDate} onViewChange={setViewMonth} />
        </motion.div>
        {showHelper && (
          <motion.p
            variants={sheetItem}
            className="text-[13px] font-medium leading-[1.35]"
            style={{ ...FONT, color: "#b45309" }}
          >
            {helperText}
          </motion.p>
        )}
      </div>
    </BottomSheet>
  );
}

export default IssueDateSheet;
