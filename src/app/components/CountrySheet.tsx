import { useState } from "react";
import { motion } from "motion/react";
import { BottomSheet, sheetItem } from "./BottomSheet";
import { Tile } from "./Tile";
import { Search } from "./Search";

interface Country {
  name: string;
  flag: string;
}

/** Curated country list (prototype). */
const COUNTRIES: Country[] = [
  { name: "Singapore", flag: "🇸🇬" },
  { name: "Hong Kong", flag: "🇭🇰" },
  { name: "United States", flag: "🇺🇸" },
  { name: "United Kingdom", flag: "🇬🇧" },
  { name: "Australia", flag: "🇦🇺" },
  { name: "Canada", flag: "🇨🇦" },
  { name: "Germany", flag: "🇩🇪" },
  { name: "France", flag: "🇫🇷" },
  { name: "Netherlands", flag: "🇳🇱" },
  { name: "India", flag: "🇮🇳" },
  { name: "Japan", flag: "🇯🇵" },
  { name: "China", flag: "🇨🇳" },
  { name: "Malaysia", flag: "🇲🇾" },
  { name: "Indonesia", flag: "🇮🇩" },
  { name: "United Arab Emirates", flag: "🇦🇪" },
];

interface CountrySheetProps {
  open: boolean;
  value?: string;
  onClose?: () => void;
  onSelect?: (country: string) => void;
}

/** Country picker for a client record. */
export function CountrySheet({ open, value, onClose, onSelect }: CountrySheetProps) {
  const [query, setQuery] = useState("");
  const filtered = COUNTRIES.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <BottomSheet open={open} title="Country" onClose={onClose} tall>
      <div className="flex flex-col gap-4">
        <motion.div variants={sheetItem}>
          <Search
            size="md"
            placeholder="Search Country"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </motion.div>

        <div className="flex flex-col gap-2">
          {filtered.map((c) => (
            <motion.div key={c.name} variants={sheetItem}>
              <Tile
                title={c.name}
                showIcon
                icon={<span className="text-[16px] leading-none">{c.flag}</span>}
                showDescription={false}
                selected={value === c.name}
                onClick={() => onSelect?.(c.name)}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </BottomSheet>
  );
}

export default CountrySheet;
