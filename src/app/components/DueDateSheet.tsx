import { useState } from "react";
import { addMonths, startOfDay, format } from "date-fns";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { motion } from "motion/react";
import { BottomSheet, sheetItem } from "./BottomSheet";
import { Tile } from "./Tile";
import { TextInput } from "./TextInput";
import { Calendar } from "./Calendar";

const DUE_OPTIONS = [
  { id: "issue", title: "Same as issue date", description: "11 Jun 2026" },
  { id: "15", title: "Next 15 days", description: "Due 30 Jun 2026" },
  { id: "30", title: "Next 30 days", description: "Due 15 Jul 2026" },
  { id: "45", title: "Next 45 days", description: "Due 30 Jul 2026" },
  { id: "60", title: "Next 60 days", description: "Due 14 Aug 2026" },
  { id: "90", title: "Next 90 days", description: "Due 13 Sep 2026" },
];

interface DueDateSheetProps {
  open: boolean;
  /** Currently selected option title. */
  value?: string;
  onClose?: () => void;
  onSelect?: (title: string) => void;
}

export function DueDateSheet({ open, value, onClose, onSelect }: DueDateSheetProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Custom due dates are capped at 6 months out — dates beyond that are disabled on the calendar.
  const today = startOfDay(new Date());
  const maxDate = addMonths(today, 6);

  // A custom date is any value that isn't one of the presets (it's stored as the formatted date string).
  const isCustom = !!value && !DUE_OPTIONS.some((o) => o.title === value);

  return (
    <>
      <BottomSheet open={open} title="Due Date" onClose={onClose}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {DUE_OPTIONS.map((o) => (
              <motion.div key={o.id} variants={sheetItem}>
                <Tile
                  title={o.title}
                  description={o.description}
                  selected={value === o.title}
                  onClick={() => onSelect?.(o.title)}
                />
              </motion.div>
            ))}
          </div>

          <motion.div variants={sheetItem}>
            <TextInput
              label="Custom Date"
              placeholder="dd/mm/yy"
              readOnly
              value={isCustom ? value : ""}
              iconRight={<CalendarTodayIcon style={{ fontSize: 20 }} />}
              onClick={() => setCalendarOpen(true)}
            />
          </motion.div>
        </div>
      </BottomSheet>

      {/* Custom due-date calendar — past dates and anything more than 6 months out are disabled. */}
      <BottomSheet open={calendarOpen} title="Custom Due Date" onClose={() => setCalendarOpen(false)}>
        <motion.div variants={sheetItem}>
          <Calendar
            disablePast
            maxDate={maxDate}
            onChange={(d) => {
              onSelect?.(format(d, "d MMM yyyy"));
              setCalendarOpen(false);
            }}
          />
        </motion.div>
      </BottomSheet>
    </>
  );
}

export default DueDateSheet;
