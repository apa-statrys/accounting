import { useMemo, useState } from "react";
import { motion } from "motion/react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { TextInput } from "./TextInput";
import type { TextInputSize } from "./TextInput";
import { BottomSheet, sheetItem } from "./BottomSheet";
import { Tile } from "../ui/Tile";
import { Search } from "../ui/Search";
import { FONT } from "../lib/theme";

export interface DialCountry {
  name: string;
  flag: string;
  /** International dial code including the leading "+", e.g. "+65". */
  dial: string;
}

/** Curated dial-code list (prototype) — ordered by likely use, covers every seeded customer country. */
export const DIAL_COUNTRIES: DialCountry[] = [
  { name: "United States", flag: "🇺🇸", dial: "+1" },
  { name: "Hong Kong", flag: "🇭🇰", dial: "+852" },
  { name: "Singapore", flag: "🇸🇬", dial: "+65" },
  { name: "United Kingdom", flag: "🇬🇧", dial: "+44" },
  { name: "Australia", flag: "🇦🇺", dial: "+61" },
  { name: "Canada", flag: "🇨🇦", dial: "+1" },
  { name: "China", flag: "🇨🇳", dial: "+86" },
  { name: "France", flag: "🇫🇷", dial: "+33" },
  { name: "Germany", flag: "🇩🇪", dial: "+49" },
  { name: "India", flag: "🇮🇳", dial: "+91" },
  { name: "Indonesia", flag: "🇮🇩", dial: "+62" },
  { name: "Italy", flag: "🇮🇹", dial: "+39" },
  { name: "Japan", flag: "🇯🇵", dial: "+81" },
  { name: "Malaysia", flag: "🇲🇾", dial: "+60" },
  { name: "Netherlands", flag: "🇳🇱", dial: "+31" },
  { name: "New Zealand", flag: "🇳🇿", dial: "+64" },
  { name: "Spain", flag: "🇪🇸", dial: "+34" },
  { name: "United Arab Emirates", flag: "🇦🇪", dial: "+971" },
];

const DEFAULT_COUNTRY = DIAL_COUNTRIES[0];

/**
 * Split a stored phone string ("+65 6812 3400") into its dial-code country and the national part
 * ("6812 3400"). Matches the longest dial code first so "+852" wins over "+85". Falls back to the
 * default country with the whole string treated as the national number when nothing matches.
 */
function parsePhone(value: string): { country: DialCountry; national: string } {
  const trimmed = value.trim();
  if (trimmed.startsWith("+")) {
    const byLongest = [...DIAL_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
    const match = byLongest.find((c) => trimmed.startsWith(c.dial));
    if (match) return { country: match, national: trimmed.slice(match.dial.length).trim() };
  }
  return { country: DEFAULT_COUNTRY, national: trimmed };
}

/** Recombine a dial code + national number into the single stored string (empty national → empty). */
function joinPhone(dial: string, national: string): string {
  const n = national.trim();
  return n ? `${dial} ${n}` : "";
}

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

interface DialCodeSheetProps {
  open: boolean;
  selected: DialCountry;
  onClose?: () => void;
  onSelect?: (country: DialCountry) => void;
}

/** Country dial-code picker — mirrors CountrySheet (DS header + toggleable search); each row shows
 *  the flag + country name with its dial code as the second line. */
function DialCodeSheet({ open, selected, onClose, onSelect }: DialCodeSheetProps) {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const q = query.toLowerCase();
  const filtered = DIAL_COUNTRIES.filter(
    (c) => c.name.toLowerCase().includes(q) || c.dial.includes(query.replace(/\s/g, ""))
  );

  const toggleSearch = () => {
    setSearchOpen((prev) => {
      if (prev) setQuery("");
      return !prev;
    });
  };

  return (
    <BottomSheet
      open={open}
      title="Select Country Code"
      onClose={onClose}
      tall
      dsHeader
      action={<SearchGlyph />}
      onAction={toggleSearch}
      actionLabel="Search country code"
    >
      <div className="flex flex-col gap-4">
        {searchOpen && (
          <motion.div variants={sheetItem} initial="closed" animate="open">
            <Search
              placeholder="Search country or code"
              value={query}
              onChange={setQuery}
              showAction={false}
              aria-label="Search country code"
            />
          </motion.div>
        )}

        <div className="flex flex-col gap-2">
          {filtered.map((c) => {
            const isSelected = c.name === selected.name;
            return (
              <motion.div key={c.name} variants={sheetItem}>
                <Tile
                  title={c.name}
                  text={c.dial}
                  flag={<span className="text-[26px] leading-none">{c.flag}</span>}
                  trailing={isSelected ? "check" : "none"}
                  selected={isSelected}
                  onClick={() => onSelect?.(c)}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </BottomSheet>
  );
}

export interface PhoneInputProps {
  id?: string;
  label?: string;
  placeholder?: string;
  /** Full phone string, e.g. "+65 6812 3400". */
  value: string;
  /** Emits the recombined full phone string. */
  onChange: (value: string) => void;
  error?: string | boolean;
  size?: TextInputSize;
  required?: boolean;
  showHint?: boolean;
  hintText?: string;
  className?: string;
}

/**
 * Phone-number field with a tappable country-code selector on the left (flag + dial code + chevron),
 * matching the Figma. Opens a DialCodeSheet to change the country. The dial code and the typed number
 * are stored together as one string via `value` / `onChange`, so callers keep a single `phone` field.
 */
export function PhoneInput({
  id,
  label = "Phone Number",
  placeholder = "Enter contact phone number",
  value,
  onChange,
  error,
  size = "md",
  required,
  showHint,
  hintText,
  className,
}: PhoneInputProps) {
  // The selected country lives in local state so picking a code sticks even before a number is typed
  // (an empty number can't carry a dial code in the combined string). Seeded from the incoming value.
  const [country, setCountry] = useState<DialCountry>(() => parsePhone(value).country);
  const national = useMemo(() => {
    const trimmed = value.trim();
    if (trimmed.startsWith(country.dial)) return trimmed.slice(country.dial.length).trim();
    return parsePhone(value).national;
  }, [value, country]);
  const [sheetOpen, setSheetOpen] = useState(false);

  const prefix = (
    <button
      type="button"
      onClick={() => setSheetOpen(true)}
      className="flex items-center gap-1"
      style={{ ...FONT, color: "#1b1b1b", background: "none", border: "none", padding: 0, cursor: "pointer" }}
      aria-label="Select country code"
    >
      <span style={{ fontSize: 16, lineHeight: 1 }}>{country.flag}</span>
      <span className="body-md">{country.dial}</span>
      <ExpandMoreIcon style={{ fontSize: 16, color: "#808080" }} />
    </button>
  );

  return (
    <>
      <TextInput
        id={id}
        label={label}
        type="tel"
        placeholder={placeholder}
        size={size}
        required={required}
        showHint={showHint}
        hintText={hintText}
        error={error}
        iconLeft={prefix}
        className={className}
        value={national}
        onChange={(e) => onChange(joinPhone(country.dial, e.target.value))}
      />
      <DialCodeSheet
        open={sheetOpen}
        selected={country}
        onClose={() => setSheetOpen(false)}
        onSelect={(c) => {
          setCountry(c);
          onChange(joinPhone(c.dial, national));
          setSheetOpen(false);
        }}
      />
    </>
  );
}

export default PhoneInput;
