import { motion } from "motion/react";
import { BottomSheet, sheetItem } from "./BottomSheet";
import { Tile } from "../ui/Tile";
import { Badge } from "../ui/Badge";
import { RECEIVING_ACCOUNTS } from "../data/receivingAccounts";

import { FONT } from "../lib/theme";

interface ReceivingAccountSheetProps {
  open: boolean;
  /** Selected account id. */
  value?: string;
  /** Sheet title — defaults to "Select Receiving Account"; refund flow passes "Refund from". */
  title?: string;
  /** Hide the "Use External Bank Account" option (e.g. a refund must be paid from a Statrys account). */
  hideExternal?: boolean;
  onClose?: () => void;
  onSelect?: (id: string) => void;
  onUseExternal?: () => void;
}

export function ReceivingAccountSheet({
  open,
  value,
  title = "Select Receiving Account",
  hideExternal = false,
  onClose,
  onSelect,
  onUseExternal,
}: ReceivingAccountSheetProps) {
  return (
    <BottomSheet open={open} title={title} onClose={onClose} dsHeader>
      <div className="flex flex-col gap-4">
        {/* The "Statrys Accounts" group header only makes sense when the external "Use Other Bank
            Accounts" option is also shown; with external hidden there's a single group, so drop it. */}
        {!hideExternal && (
          <motion.div variants={sheetItem}>
            <p className="text-[16px] font-medium leading-[1.3] text-[#1b1b1b]" style={FONT}>
              Statrys Accounts
            </p>
          </motion.div>
        )}

        {/* DS Tile country variant — 30px flag slot; the primary account wears the Figma
            corner "Primary" badge (brand gradient, pinned top-right). */}
        <div className="flex flex-col gap-2">
          {RECEIVING_ACCOUNTS.map((a) => (
            <motion.div key={a.id} variants={sheetItem}>
              <Tile
                title={a.name}
                text={a.number}
                flag={<span className="text-[26px] leading-none">{a.flag}</span>}
                cornerBadge={a.primary ? <Badge label="Primary" size="md" variant="bold" color="custom" /> : undefined}
                selected={value === a.id}
                trailing={value === a.id ? "check" : "none"}
                onClick={() => onSelect?.(a.id)}
              />
            </motion.div>
          ))}
        </div>

        {/* Separator + other-bank option (hidden when the source must be a Statrys account, e.g. a refund). */}
        {!hideExternal && (
          <motion.div variants={sheetItem} className="flex flex-col gap-4">
            <div className="border-t border-[rgba(160,160,160,0.2)]" />
            <Tile title="Use Other Bank Accounts" trailing="chevron" onClick={onUseExternal} />
          </motion.div>
        )}
      </div>
    </BottomSheet>
  );
}

export default ReceivingAccountSheet;
