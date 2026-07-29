import { useState } from "react";
import { motion } from "motion/react";
import { BottomSheet, sheetItem } from "../BottomSheet";
import { Tile } from "../../ui/Tile";
import { Search } from "../../ui/Search";
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

/**
 * Phone country-code picker (Figma "Select Country Code") — same shell/row pattern as
 * CountrySheet (DS Bottomsheet, search toggle, DS Tile country rows), rows read
 * "Country (+Code)" per Figma.
 */
export function CountryCodeSheet({ open, value, onClose, onSelect }: CountryCodeSheetProps) {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const filtered = COUNTRY_CODES.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));

  const toggleSearch = () => {
    setSearchOpen((prev) => {
      if (prev) setQuery(""); // closing the search resets the filter
      return !prev;
    });
  };

  return (
    <BottomSheet
      open={open}
      title="Select Country Code"
      onClose={onClose}
      tall
      action={<SearchGlyph />}
      onAction={toggleSearch}
      actionLabel="Search country"
    >
      <div className={styles.body}>
        {searchOpen && (
          <motion.div variants={sheetItem} initial="closed" animate="open">
            <Search
              placeholder="Search Country"
              value={query}
              onChange={setQuery}
              showAction={false}
              aria-label="Search country"
            />
          </motion.div>
        )}

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
      </div>
    </BottomSheet>
  );
}

export default CountryCodeSheet;
