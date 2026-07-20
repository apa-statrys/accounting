import { useState } from "react";
import { motion } from "motion/react";
import { BottomSheet, sheetItem, SERVICE_SHEET_HEIGHT } from "../BottomSheet";
import { Tile } from "../../ui/Tile";
import { Search } from "../../ui/Search";
import styles from "./index.module.css";

export interface Currency {
  code: string;
  name: string;
  flag: string;
}

export const CURRENCIES: Currency[] = [
  { code: "SGD", name: "Singapore Dollar", flag: "🇸🇬" },
  { code: "HKD", name: "Hong Kong Dollar", flag: "🇭🇰" },
  { code: "USD", name: "US Dollar", flag: "🇺🇸" },
  { code: "EUR", name: "Euro", flag: "🇪🇺" },
  { code: "GBP", name: "British Pound", flag: "🇬🇧" },
  { code: "AUD", name: "Australian Dollar", flag: "🇦🇺" },
  { code: "JPY", name: "Japanese Yen", flag: "🇯🇵" },
];

function SearchGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M17.4999 17.5001L13.8833 13.8835M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
 * DS Bottomsheets header (grabber, no ✕) with the search icon next to the
 * "Select Currency" title; tapping it reveals/hides the DS Search field.
 * Rows are the DS Tile country variant (flag + title, check when selected).
 */
export function CurrencySheet({ open, value, onClose, onSelect }: CurrencySheetProps) {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const filtered = CURRENCIES.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.code.toLowerCase().includes(query.toLowerCase())
  );

  const toggleSearch = () => {
    setSearchOpen((prev) => {
      if (prev) setQuery(""); // closing the search resets the filter
      return !prev;
    });
  };

  return (
    <BottomSheet
      open={open}
      title="Select Currency"
      onClose={onClose}
      heightClass={SERVICE_SHEET_HEIGHT}
      action={<SearchGlyph />}
      onAction={toggleSearch}
      actionLabel="Search currency"
    >
      <div className={styles.root}>
        {searchOpen && (
          <motion.div variants={sheetItem} initial="closed" animate="open">
            <Search
              placeholder="Search Currency"
              value={query}
              onChange={setQuery}
              showAction={false}
              aria-label="Search currency"
            />
          </motion.div>
        )}

        <div className={styles.rows}>
          {filtered.map((c) => (
            <motion.div key={c.code} variants={sheetItem}>
              <Tile
                title={`${c.name} ( ${c.code} )`}
                flag={<span className={styles.flag}>{c.flag}</span>}
                trailing={value === c.code ? "check" : "none"}
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
