import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { motion } from "motion/react";
import { BottomSheet, sheetItem } from "./BottomSheet";
import { Tile } from "./Tile";
import { TextInput } from "./TextInput";

const DUE_OPTIONS = [
  { id: "issue", title: "Same as issue date", description: "11 Jun 2026" },
  { id: "15", title: "Next 15 days", description: "Due 30 Jun 2026" },
  { id: "30", title: "Next 30 days", description: "Due 15 Jul 2026" },
  { id: "45", title: "Next 45 days", description: "Due 30 Jul 2026" },
  { id: "60", title: "Next 60 days", description: "Due 14 Aug 2026" },
];

interface DueDateSheetProps {
  open: boolean;
  /** Currently selected option title. */
  value?: string;
  onClose?: () => void;
  onSelect?: (title: string) => void;
}

export function DueDateSheet({ open, value, onClose, onSelect }: DueDateSheetProps) {
  return (
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
            iconRight={<CalendarTodayIcon style={{ fontSize: 20 }} />}
          />
        </motion.div>
      </div>
    </BottomSheet>
  );
}

export default DueDateSheet;
