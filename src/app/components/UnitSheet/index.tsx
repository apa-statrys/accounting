import { motion } from "motion/react";
import { BottomSheet, sheetItem } from "../BottomSheet";
import { Tile } from "../../ui/Tile";
import styles from "./index.module.css";

const UNITS = ["Unit", "Hour", "Day", "Month", "Session", "Pair"];

interface UnitSheetProps {
  open: boolean;
  value?: string;
  onClose?: () => void;
  onSelect?: (unit: string) => void;
}

/**
 * Unit picker for a service/product line — DS header with centered "Select Unit" title and a
 * back chevron returning to the Add Item sheet; DS text Tiles with a check on the selection.
 */
export function UnitSheet({ open, value, onClose, onSelect }: UnitSheetProps) {
  return (
    <BottomSheet
      open={open}
      title="Select Unit"
      onClose={onClose}
      centerTitle
      onBack={onClose}
      backLabel="Back to item"
    >
      <div className={styles.list}>
        {UNITS.map((u) => (
          <motion.div key={u} variants={sheetItem}>
            <Tile
              title={u}
              selected={value === u}
              trailing={value === u ? "check" : "none"}
              onClick={() => onSelect?.(u)}
            />
          </motion.div>
        ))}
      </div>
    </BottomSheet>
  );
}

export default UnitSheet;
