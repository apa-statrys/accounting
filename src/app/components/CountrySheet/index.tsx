import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BottomSheet, sheetItem, stepSlide } from "../BottomSheet";
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
 * Country picker for a client record — a plain, non-sticky `ui/Search` row sits below the title
 * as part of the scrollable content (decided 2026-08-20: search isn't active by default, and this
 * entry row scrolls away with the list rather than staying pinned). Tapping it hands off to the
 * same DS Bottomsheet search-mode header every other search-in-sheet flow uses (title swaps for a
 * frosted search pill, back chevron to return — see BottomSheet's own `searchValue`/`onBack`
 * props) instead of inventing a second search mechanism. Rows are the DS Tile country variant
 * (flag + title, check when selected).
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
            crossfade. Rows below are a shared shape with their own nested `sheetItem` variants, so
            this wrapper uses `stepSlide()`'s STRING labels (not object-literal targets) — see
            BottomSheet's own doc comment on why that distinction matters for propagation. */}
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
          </motion.div>
        </AnimatePresence>
      </div>
    </BottomSheet>
  );
}

export default CountrySheet;
