import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BottomSheet, sheetItem, stepSlide } from "../BottomSheet";
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
 * Phone country-code picker (Figma "Select Country Code") — a plain, non-sticky `ui/Search` row
 * sits below the title as part of the scrollable content (decided 2026-08-20: search isn't active
 * by default, and this entry row scrolls away with the list rather than staying pinned). Tapping
 * it hands off to the same DS Bottomsheet search-mode header every other search-in-sheet flow
 * uses (title swaps for a frosted search pill, back chevron to return — see BottomSheet's own
 * `searchValue`/`onBack` props) instead of inventing a second search mechanism. Rows read
 * "Country (+Code)" per Figma.
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
      onBack={searchOpen ? closeSearch : undefined}
      searchValue={searchOpen ? query : undefined}
      onSearchChange={searchOpen ? setQuery : undefined}
      searchPlaceholder="Search Country"
      autoFocusSearch
      // Decorative on-screen keyboard fills the space below the focused search field — same
      // stand-in as Sales Invoice List's Filters→Customer search (components/Keyboard, since a
      // desktop web view never shows the real OS keyboard).
      footer={searchOpen ? <Keyboard /> : undefined}
    >
      <div className={styles.body}>
        {/* Same content-level step transition as Sales Invoice List's Filters→Customer search —
            entering/exiting search re-animates the row list too, not just the header's title/pill
            crossfade. CountryCodeRows has its own nested `sheetItem`-variant rows, so this wrapper
            uses `stepSlide()`'s STRING labels (not object-literal targets) — see BottomSheet's own
            doc comment on why that distinction matters for propagation. */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={searchOpen ? "search" : "list"}
            className={styles.stepBody}
            variants={stepSlide(searchOpen ? 1 : -1)}
            initial="closed"
            animate="open"
            exit="closed"
          >
            {!searchOpen && (
              <Search value="" onChange={() => {}} placeholder="Search Country" showAction={false} onFocus={() => setSearchOpen(true)} />
            )}
            <CountryCodeRows value={value} query={query} onSelect={onSelect} />
          </motion.div>
        </AnimatePresence>
      </div>
    </BottomSheet>
  );
}

export default CountryCodeSheet;
