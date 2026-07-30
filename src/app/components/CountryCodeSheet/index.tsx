import { useState } from "react";
import { motion } from "motion/react";
import { BottomSheet, sheetItem } from "../BottomSheet";
import { Tile } from "../../ui/Tile";
import { CountryFlag } from "../CountryFlag";
import { COUNTRY_CODES, type CountryCode } from "../../data/countryCodes";
import styles from "./index.module.css";

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

interface CountryCodeSheetProps {
  open: boolean;
  /** The currently selected country's name (drives the check/selected row). */
  value?: string;
  onClose?: () => void;
  onSelect?: (country: CountryCode) => void;
}

interface CountryCodeRowsProps {
  value?: string;
  query: string;
  onSelect?: (country: CountryCode) => void;
}

/** Just the search-filtered row list — no BottomSheet/header of its own, so a caller that needs
 *  the picker as a sub-level of ANOTHER sheet (header/content swap, not a stacked sheet — see
 *  memory: sub-level-drawer-same-sheet) can render it directly instead of nesting a whole
 *  CountryCodeSheet (which brings its own BottomSheet). */
export function CountryCodeRows({ value, query, onSelect }: CountryCodeRowsProps) {
  const filtered = COUNTRY_CODES.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className={styles.list}>
      {filtered.map((c) => (
        <motion.div key={c.name} variants={sheetItem}>
          <Tile
            size="sm"
            title={`${c.name} (${c.dialCode})`}
            flag={<CountryFlag name={c.name} size={30} />}
            trailing={value === c.name ? "check" : "none"}
            selected={value === c.name}
            onClick={() => onSelect?.(c)}
          />
        </motion.div>
      ))}
    </div>
  );
}

/**
 * Phone country-code picker (Figma "Select Country Code") — DS Bottomsheet search-mode header
 * (same experience as Sales Invoice List's Filters→Customer search, and CountrySheet): tapping
 * the search icon swaps the title for a frosted search pill in place, with a back chevron to
 * return. Rows read "Country (+Code)" per Figma.
 */
export function CountryCodeSheet({ open, value, onClose, onSelect }: CountryCodeSheetProps) {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const closeSearch = () => { setSearchOpen(false); setQuery(""); };

  return (
    <BottomSheet
      open={open}
      title="Select Country Code"
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
        <CountryCodeRows value={value} query={query} onSelect={onSelect} />
      </div>
    </BottomSheet>
  );
}

export default CountryCodeSheet;
