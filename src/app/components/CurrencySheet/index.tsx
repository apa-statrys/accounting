import { motion } from "motion/react";
import { BottomSheet, sheetItem } from "../BottomSheet";
import { Tile } from "../../ui/Tile";
import { CountryFlag } from "../CountryFlag";
import styles from "./index.module.css";

export interface Currency {
  code: string;
  name: string;
}

/** The 11 currencies the app supports, for now (decided 2026-07-28) — don't add more without asking. */
export const CURRENCIES: Currency[] = [
  { code: "EUR", name: "Euro" },
  { code: "HKD", name: "Hong Kong Dollar" },
  { code: "USD", name: "US Dollar" },
  { code: "CNH", name: "Chinese Yuan" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "GBP", name: "British Pound" },
  { code: "SGD", name: "Singapore Dollar" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "NZD", name: "New Zealand Dollar" },
];

/** Currency code → the country whose flag represents it (components/CountryFlag lookup) — never
 *  emoji. EUR maps to "European Union" (not a single member state); CNH (offshore yuan) maps to
 *  China, same flag as onshore CNY. */
export const CURRENCY_COUNTRY: Record<string, string> = {
  EUR: "European Union",
  HKD: "Hong Kong",
  USD: "United States",
  CNH: "China",
  JPY: "Japan",
  GBP: "United Kingdom",
  SGD: "Singapore",
  CHF: "Switzerland",
  AUD: "Australia",
  CAD: "Canada",
  NZD: "New Zealand",
};

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
 * DS Bottomsheets header (grabber, no ✕) — no search: `fullPage` (+ `compact` to reclaim
 * the empty no-footer spacer) gives just enough room for all 11 rows to show at once with
 * no scrolling — see memory: bottomsheet-use-available-height.
 * Rows are the DS Tile country variant (flag + code as title, full name as
 * the second line, check when selected) — matches Figma's two-line row.
 */
export function CurrencySheet({ open, value, onClose, onSelect }: CurrencySheetProps) {
  return (
    <BottomSheet open={open} title="Select Currency" onClose={onClose} fullPage compact>
      <div className={styles.root}>
        <div className={styles.rows}>
          {CURRENCIES.map((c) => (
            <motion.div key={c.code} variants={sheetItem}>
              <Tile
                size="sm"
                title={c.code}
                text={c.name}
                flag={<CountryFlag name={CURRENCY_COUNTRY[c.code]} size={30} />}
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
