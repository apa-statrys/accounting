import { useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import { motion } from "motion/react";
import { BottomSheet, sheetItem } from "../BottomSheet";
import { SearchField } from "../SearchField";
import { SelectionCard } from "../SelectionCard";
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
    <BottomSheet open={open} title="Customer" onClose={onClose}>
      <div className={styles.root}>
        <motion.div variants={sheetItem}>
          <SearchField
            size="md"
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </motion.div>

        <motion.div variants={sheetItem}>
          <Button hierarchy="secondary" iconLeft={<AddIcon />} fullWidth onClick={onAddNew} label="Add new customer" />
        </motion.div>

        <div className={styles.list}>
          {filtered.map((c) => (
            <motion.div key={c.id} variants={sheetItem}>
              <SelectionCard
                title={c.name}
                description={c.email}
                selected={value === c.id}
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
