import { useState } from "react";
import { motion } from "motion/react";
import { BottomSheet, sheetItem } from "../BottomSheet";
import { Tile } from "../../ui/Tile";
import { Search } from "../../ui/Search";
import { CountryFlag } from "../CountryFlag";
import { Keyboard } from "../Keyboard";
import styles from "./index.module.css";

/** Curated country list (prototype) — flag icons looked up by name via components/CountryFlag,
 *  never emoji (design rule, no emoji anywhere). Same set as data/countryCodes.ts. */
const COUNTRIES: string[] = [
  "Singapore",
  "Hong Kong",
  "United States",
  "United Kingdom",
  "Australia",
  "Canada",
  "Germany",
  "France",
  "Netherlands",
  "India",
  "Japan",
  "China",
  "Malaysia",
  "Indonesia",
  "Thailand",
  "United Arab Emirates",
];

interface CountrySheetProps {
  open: boolean;
  value?: string;
  onClose?: () => void;
  onSelect?: (country: string) => void;
}

/**
 * Country picker for a client record — plain title (DS Bottomsheet header, ✕ close) with a
 * persistent full-width `ui/Search` field pinned below it via `headerExtra` (decided 2026-08-20 —
 * replaces the old tap-the-icon-to-reveal-a-header-pill toggle; search is just always there
 * instead of a separate step). Rows are the DS Tile country variant (flag + title, check when
 * selected).
 */
export function CountrySheet({ open, value, onClose, onSelect }: CountrySheetProps) {
  const [query, setQuery] = useState("");
  const filtered = COUNTRIES.filter((c) => c.toLowerCase().includes(query.toLowerCase()));

  return (
    <BottomSheet
      open={open}
      title="Select Country"
      onClose={() => { setQuery(""); onClose?.(); }}
      tall
      headerExtra={
        <Search value={query} onChange={setQuery} placeholder="Search Country" showAction={false} autoFocus />
      }
      // Decorative on-screen keyboard fills the space below the focused search field — same
      // stand-in as Sales Invoice List's Filters→Customer search (components/Keyboard, since a
      // desktop web view never shows the real OS keyboard).
      footer={<Keyboard />}
    >
      <div className={styles.body}>
        <div className={styles.list}>
          {filtered.map((c) => (
            <motion.div key={c} variants={sheetItem}>
              <Tile
                size="sm"
                title={c}
                flag={<CountryFlag name={c} size={30} />}
                trailing={value === c ? "check" : "none"}
                selected={value === c}
                onClick={() => onSelect?.(c)}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </BottomSheet>
  );
}

export default CountrySheet;
