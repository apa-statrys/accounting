import { motion } from "motion/react";
import { BottomSheet, sheetItem } from "../BottomSheet";
import { Tile } from "../../ui/Tile";
import { CountryFlag } from "../CountryFlag";
import { RECEIVING_ACCOUNTS } from "../../data/receivingAccounts";
import styles from "./index.module.css";

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

interface ReceivingAccountRowsProps {
  value?: string;
  hideExternal?: boolean;
  onSelect?: (id: string) => void;
  onUseExternal?: () => void;
}

/** Just the account rows — no BottomSheet/header of its own, so a caller that needs this picker
 *  as a sub-level of ANOTHER sheet (header/content swap, not a stacked sheet — see memory:
 *  sub-level-drawer-same-sheet) can render it directly instead of nesting a whole
 *  ReceivingAccountSheet (which brings its own BottomSheet). */
export function ReceivingAccountRows({ value, hideExternal = false, onSelect, onUseExternal }: ReceivingAccountRowsProps) {
  return (
    <div className={styles.root}>
      {/* The "Statrys Accounts" group header only makes sense when the external "Use Other Bank
          Accounts" option is also shown; with external hidden there's a single group, so drop it. */}
      {!hideExternal && (
        <motion.div variants={sheetItem}>
          <p className={styles.heading}>Statrys Accounts</p>
        </motion.div>
      )}

      <div className={styles.accounts}>
        {RECEIVING_ACCOUNTS.map((a) => (
          <motion.div key={a.id} variants={sheetItem}>
            <Tile
              size="sm"
              title={a.name}
              text={a.number}
              flag={<CountryFlag name={a.country} size={30} />}
              badgeLabel={a.primary ? "Primary" : undefined}
              selected={value === a.id}
              trailing={value === a.id ? "check" : "none"}
              onClick={() => onSelect?.(a.id)}
            />
          </motion.div>
        ))}
      </div>

      {!hideExternal && (
        <motion.div variants={sheetItem} className={styles.externalGroup}>
          <div className={styles.divider} />
          <Tile size="sm" title="Use Other Bank Accounts" trailing="chevron" onClick={onUseExternal} />
        </motion.div>
      )}
    </div>
  );
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
    <BottomSheet open={open} title={title} onClose={onClose}>
      <ReceivingAccountRows value={value} hideExternal={hideExternal} onSelect={onSelect} onUseExternal={onUseExternal} />
    </BottomSheet>
  );
}

export default ReceivingAccountSheet;
