import { useState } from "react";
import { motion } from "motion/react";
import { BottomSheet, sheetItem, SERVICE_SHEET_HEIGHT } from "./BottomSheet";
import { Tile } from "./Tile";
import { Search } from "./Search";

export interface Currency {
  code: string;
  name: string;
  flag: string;
}

const CURRENCIES: Currency[] = [
  { code: "SGD", name: "Singapore Dollar", flag: "🇸🇬" },
  { code: "HKD", name: "Hong Kong Dollar", flag: "🇭🇰" },
  { code: "USD", name: "US Dollar", flag: "🇺🇸" },
];

interface CurrencySheetProps {
  open: boolean;
  /** Selected currency code (per-invoice; seeded from the Settings default). */
  value?: string;
  onClose?: () => void;
  onSelect?: (code: string) => void;
}

/**
 * Currency picker — per-invoice override.
 * Seeded from the Settings default; choosing here does NOT change Settings.
 * See memory: invoice-currency-default.
 */
export function CurrencySheet({ open, value, onClose, onSelect }: CurrencySheetProps) {
  const [query, setQuery] = useState("");

  const filtered = CURRENCIES.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.code.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <BottomSheet open={open} title="Currency" onClose={onClose} heightClass={SERVICE_SHEET_HEIGHT}>
      <div className="flex flex-col gap-4">
        <motion.div variants={sheetItem}>
          <Search
            size="md"
            placeholder="Search Currency"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </motion.div>

        <div className="flex flex-col gap-2">
          {filtered.map((c) => (
            <motion.div key={c.code} variants={sheetItem}>
              <Tile
                title={`${c.name} ( ${c.code} )`}
                showIcon
                icon={<span className="text-[16px] leading-none">{c.flag}</span>}
                showDescription={false}
                selected={value === c.code}
                onClick={() => onSelect?.(c.code)}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </BottomSheet>
  );
}

export default CurrencySheet;
