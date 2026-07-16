import { AnimatePresence, motion } from "motion/react";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { TextInput } from "./TextInput";
import { Toggle } from "../ui/Toggle";

export type DiscountMode = "amount" | "percent";

import { FONT } from "../lib/theme";

interface DiscountCardProps {
  /** Invoice currency — shown as the amount unit. */
  currency: string;
  /** Whether discounts are turned on. */
  enabled: boolean;
  onToggle: (on: boolean) => void;
  value: string;
  onChange: (v: string) => void;
  mode: DiscountMode;
  /** Open the %/amount picker sheet. */
  onOpenMode?: () => void;
}

/**
 * Discounts card — a toggle (off by default). When on, reveals a value field
 * (in the invoice currency) plus a %/amount mode dropdown.
 */
export function DiscountCard({ currency, enabled, onToggle, value, onChange, mode, onOpenMode }: DiscountCardProps) {
  return (
    <div
      className="w-full bg-white border border-dashed border-[rgba(160,160,160,0.2)] rounded-xl p-[17px] flex flex-col gap-3"
      style={{ boxShadow: "var(--shadow-card-soft)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="card-title-2xs text-[#1b1b1b]" style={FONT}>Discounts</p>
        <Toggle checked={enabled} onChange={onToggle} aria-label="Discounts" />
      </div>

      {/* Body */}
      <AnimatePresence initial={false}>
        {enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-visible"
          >
            <div className="flex items-stretch gap-2 pt-1">
              <div className="flex-1 min-w-0">
                <TextInput
                  size="md"
                  showHint={false}
                  placeholder="e.g. 10.00"
                  inputMode="decimal"
                  iconRight={<span className="text-[16px] font-medium text-[#1b1b1b]" style={FONT}>{mode === "percent" ? "%" : currency}</span>}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                />
              </div>

              {/* Mode picker — opens a bottom sheet */}
              <button
                type="button"
                onClick={onOpenMode}
                className="shrink-0 h-[44px] w-[72px] px-3 rounded-lg border border-[rgba(160,160,160,0.4)] bg-white flex items-center justify-between"
              >
                <span className="text-[16px] text-[#1b1b1b]" style={FONT}>{mode === "percent" ? "%" : currency}</span>
                <KeyboardArrowDownIcon style={{ fontSize: 18, color: "#808080" }} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DiscountCard;
