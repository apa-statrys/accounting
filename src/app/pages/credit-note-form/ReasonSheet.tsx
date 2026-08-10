import { motion } from "motion/react";
import { BottomSheet, sheetItem } from "../../components/BottomSheet";
import { Tile } from "../../ui/Tile";

/** Required reason for raising a credit note (DES-719) — fixed enum. A free-text Description lives on
 *  the form itself (optional), so this sheet is purely the enum picker. */
export const CREDIT_REASONS = ["Return", "Defect", "Pricing error", "Goodwill", "Dispute", "Other"];

interface ReasonSheetProps {
  open: boolean;
  onClose: () => void;
  reason: string;
  setReason: (r: string) => void;
}

/** Reason picker — required (DES-719). Single-select: tapping a preset selects it AND closes the
 *  sheet immediately (same pattern as ReceivingAccountSheet/CurrencySheet — no separate Done/confirm
 *  step for a disabled-until-chosen single-select picker). The optional Description is captured on
 *  the main form, not here. */
export function ReasonSheet({ open, onClose, reason, setReason }: ReasonSheetProps) {
  return (
    <BottomSheet open={open} title="Select Reason for Credit" onClose={onClose}>
      <div className="flex flex-col gap-2">
        {CREDIT_REASONS.map((r) => (
          <motion.div key={r} variants={sheetItem}>
            <Tile
              size="sm"
              title={r}
              selected={reason === r}
              trailing={reason === r ? "check" : "none"}
              onClick={() => { setReason(r); onClose(); }}
            />
          </motion.div>
        ))}
      </div>
    </BottomSheet>
  );
}
