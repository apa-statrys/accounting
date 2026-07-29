import { motion } from "motion/react";
import { BottomSheet, sheetItem } from "../BottomSheet";
import { Tile } from "../../ui/Tile";
import { Badge } from "../../ui/Badge";
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
                cornerBadge={a.primary ? <Badge label="Primary" size="sm" variant="bold" color="custom" /> : undefined}
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
    </BottomSheet>
  );
}

export default ReceivingAccountSheet;
