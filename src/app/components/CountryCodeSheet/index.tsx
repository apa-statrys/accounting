import { useState } from "react";
import { motion } from "motion/react";
import { BottomSheet, sheetItem } from "../BottomSheet";
import { Tile } from "../../ui/Tile";
import { Search } from "../../ui/Search";
import { CountryFlag } from "../CountryFlag";
import { Keyboard } from "../Keyboard";
import { COUNTRY_CODES, type CountryCode } from "../../data/countryCodes";
import styles from "./index.module.css";

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
  const q = query.trim().toLowerCase();
  const digits = q.replace(/\D/g, "");
  const filtered = COUNTRY_CODES.filter(
    (c) => c.name.toLowerCase().includes(q) || (digits.length > 0 && c.dialCode.replace("+", "").includes(digits))
  );
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
 * Phone country-code picker (Figma "Select Country Code") — plain title (DS Bottomsheet header,
 * ✕ close) with a persistent full-width `ui/Search` field pinned below it via `headerExtra`
 * (decided 2026-08-20 — replaces the old tap-the-icon-to-reveal-a-header-pill toggle; search is
 * just always there instead of a separate step). Not focused by default — the on-screen keyboard
 * mock only appears once the user actually taps into the field (decided 2026-08-20). Rows read
 * "Country (+Code)" per Figma.
 */
export function CountryCodeSheet({ open, value, onClose, onSelect }: CountryCodeSheetProps) {
  const [query, setQuery] = useState("");
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  return (
    <BottomSheet
      open={open}
      title="Select Country Code"
      onClose={() => { setQuery(""); onClose?.(); }}
      tall
      keyboardOpen={keyboardOpen}
      headerExtra={
        <Search
          value={query}
          onChange={setQuery}
          placeholder="Search Country"
          showAction={false}
          onFocus={() => setKeyboardOpen(true)}
          onBlur={() => setKeyboardOpen(false)}
        />
      }
      // Decorative on-screen keyboard fills the space below the focused search field — same
      // stand-in as Sales Invoice List's Filters→Customer search (components/Keyboard, since a
      // desktop web view never shows the real OS keyboard). Only shown once the field is actually
      // focused (decided 2026-08-20) — search isn't active by default on open.
      footer={keyboardOpen ? <Keyboard /> : undefined}
    >
      <div className={styles.body}>
        <CountryCodeRows value={value} query={query} onSelect={onSelect} />
      </div>
    </BottomSheet>
  );
}

export default CountryCodeSheet;
