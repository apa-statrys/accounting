import { useState } from "react";
import { motion } from "motion/react";
import { BottomSheet, sheetItem } from "../BottomSheet";
import { Tile } from "../../ui/Tile";
import { CountryFlag } from "../CountryFlag";
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
  "United Arab Emirates",
];

function SearchGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M17.4999 17.5001L13.8833 13.8835M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface CountrySheetProps {
  open: boolean;
  value?: string;
  onClose?: () => void;
  onSelect?: (country: string) => void;
}

/**
 * Country picker for a client record — DS Bottomsheet search-mode header (Figma node 1333-38370,
 * same experience as Sales Invoice List's Filters→Customer search): tapping the search icon swaps
 * the "Select Country" title for a frosted search pill in place, with a back chevron to return to
 * the plain title. Rows are the DS Tile country variant (flag + title, check when selected).
 */
export function CountrySheet({ open, value, onClose, onSelect }: CountrySheetProps) {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const filtered = COUNTRIES.filter((c) => c.toLowerCase().includes(query.toLowerCase()));

  const closeSearch = () => { setSearchOpen(false); setQuery(""); };

  return (
    <BottomSheet
      open={open}
      title="Select Country"
      onClose={() => { closeSearch(); onClose?.(); }}
      tall
      action={!searchOpen ? <SearchGlyph /> : undefined}
      onAction={!searchOpen ? () => setSearchOpen(true) : undefined}
      actionLabel="Search country"
      onBack={searchOpen ? closeSearch : undefined}
      searchValue={searchOpen ? query : undefined}
      onSearchChange={searchOpen ? setQuery : undefined}
      searchPlaceholder="Search Country"
      autoFocusSearch
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
