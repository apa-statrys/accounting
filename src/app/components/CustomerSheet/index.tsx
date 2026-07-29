import { useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import { motion } from "motion/react";
import { BottomSheet, sheetItem } from "../BottomSheet";
import { Search } from "../../ui/Search";
import { Tile } from "../../ui/Tile";
import { Button } from "../../ui/Button";
import { CUSTOMERS } from "../../data/customers";
import type { Customer } from "../../types";
import styles from "./index.module.css";

interface CustomerSheetProps {
  open: boolean;
  /** Selected customer id. */
  value?: string;
  /** The shared client register (owned by App) — defaults to the seed list. */
  customers?: Customer[];
  onClose?: () => void;
  onSelect?: (customer: Customer) => void;
  onAddNew?: () => void;
}

/** Customer picker — search, add new, and a selectable list. */
export function CustomerSheet({ open, value, customers = CUSTOMERS, onClose, onSelect, onAddNew }: CustomerSheetProps) {
  const [query, setQuery] = useState("");

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.email.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <BottomSheet open={open} title="Select Customer" onClose={onClose}>
      <div className={styles.root}>
        <motion.div variants={sheetItem}>
          <Search placeholder="Search" value={query} onChange={setQuery} showAction={false} />
        </motion.div>

        <motion.div variants={sheetItem}>
          <Button hierarchy="secondary" iconLeft={<AddIcon />} fullWidth onClick={onAddNew} label="Add new customer" />
        </motion.div>

        <div className={styles.list}>
          {filtered.map((c) => (
            <motion.div key={c.id} variants={sheetItem}>
              <Tile
                size="sm"
                title={c.name}
                text={c.email}
                selected={value === c.id}
                trailing={value === c.id ? "check" : "none"}
                onClick={() => onSelect?.(c)}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </BottomSheet>
  );
}

export default CustomerSheet;
