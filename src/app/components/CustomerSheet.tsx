import { useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import { motion } from "motion/react";
import { BottomSheet, sheetItem } from "./BottomSheet";
import { Search } from "./Search";
import { Tile } from "./Tile";
import { Button } from "./Buttons";
import { CUSTOMERS, type Customer } from "./CreateSalesInvoice";

interface CustomerSheetProps {
  open: boolean;
  /** Selected customer id. */
  value?: string;
  onClose?: () => void;
  onSelect?: (customer: Customer) => void;
  onAddNew?: () => void;
}

/** Customer picker — search, add new, and a selectable list. */
export function CustomerSheet({ open, value, onClose, onSelect, onAddNew }: CustomerSheetProps) {
  const [query, setQuery] = useState("");

  const filtered = CUSTOMERS.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.email.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <BottomSheet open={open} title="Customer" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <motion.div variants={sheetItem}>
          <Search
            size="md"
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </motion.div>

        <motion.div variants={sheetItem}>
          <Button variant="secondary" size="md" iconLeft={<AddIcon />} className="w-full" onClick={onAddNew}>
            Add new customer
          </Button>
        </motion.div>

        <div className="flex flex-col gap-2">
          {filtered.map((c) => (
            <motion.div key={c.id} variants={sheetItem}>
              <Tile
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
