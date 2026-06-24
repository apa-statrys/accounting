import { motion } from "motion/react";
import { BottomSheet, sheetItem } from "./BottomSheet";
import { Calendar } from "./Calendar";

interface IssueDateSheetProps {
  open: boolean;
  value?: Date;
  onClose?: () => void;
  onSelect?: (date: Date) => void;
}

/** Issue Date picker — calendar view (choose day, month and year). */
export function IssueDateSheet({ open, value, onClose, onSelect }: IssueDateSheetProps) {
  return (
    <BottomSheet open={open} title="Issue Date" onClose={onClose}>
      <motion.div variants={sheetItem}>
        <Calendar value={value} onChange={(d) => onSelect?.(d)} />
      </motion.div>
    </BottomSheet>
  );
}

export default IssueDateSheet;
