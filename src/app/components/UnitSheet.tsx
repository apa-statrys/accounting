import { motion } from "motion/react";
import { BottomSheet, sheetItem } from "./BottomSheet";
import { Tile } from "./Tile";

const UNITS = ["Unit", "Hour", "Day", "Month", "Session", "Pair"];

interface UnitSheetProps {
  open: boolean;
  value?: string;
  onClose?: () => void;
  onSelect?: (unit: string) => void;
}

/** Unit picker for a service/product line. */
export function UnitSheet({ open, value, onClose, onSelect }: UnitSheetProps) {
  return (
    <BottomSheet open={open} title="Unit" onClose={onClose}>
      <div className="flex flex-col gap-2">
        {UNITS.map((u) => (
          <motion.div key={u} variants={sheetItem}>
            <Tile
              title={u}
              showDescription={false}
              selected={value === u}
              onClick={() => onSelect?.(u)}
            />
          </motion.div>
        ))}
      </div>
    </BottomSheet>
  );
}

export default UnitSheet;
