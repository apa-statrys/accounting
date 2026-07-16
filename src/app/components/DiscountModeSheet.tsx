import { motion } from "motion/react";
import { BottomSheet, sheetItem } from "./BottomSheet";
import { Tile } from "../ui/Tile";
import type { DiscountMode } from "./DiscountCard";

interface DiscountModeSheetProps {
  open: boolean;
  value: DiscountMode;
  /** Invoice currency — labels the fixed-amount option. */
  currency: string;
  onClose?: () => void;
  onSelect?: (mode: DiscountMode) => void;
}

/** Picker for how a discount is applied: percentage or a fixed amount. */
export function DiscountModeSheet({ open, value, currency, onClose, onSelect }: DiscountModeSheetProps) {
  const options: { mode: DiscountMode; title: string; description: string }[] = [
    { mode: "percent", title: "Percentage (%)", description: "Discount as a percent of the subtotal" },
    { mode: "amount", title: `Fixed Amount (${currency})`, description: "Discount a set amount" },
  ];

  return (
    <BottomSheet open={open} title="Discount Type" onClose={onClose} dsHeader>
      <div className="flex flex-col gap-2">
        {options.map((o) => (
          <motion.div key={o.mode} variants={sheetItem}>
            <Tile
              title={o.title}
              text={o.description}
              selected={value === o.mode}
              trailing={value === o.mode ? "check" : "none"}
              onClick={() => onSelect?.(o.mode)}
            />
          </motion.div>
        ))}
      </div>
    </BottomSheet>
  );
}

export default DiscountModeSheet;
