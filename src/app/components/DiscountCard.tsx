import { AnimatePresence, motion } from "motion/react";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { TextInput } from "./TextInput";

export type DiscountMode = "amount" | "percent";

const FONT = { fontFamily: "GT Walsheim LC, sans-serif" } as const;

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

/** iOS-style toggle switch. */
function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className="relative w-[44px] h-[26px] rounded-full transition-colors shrink-0"
      style={{ background: on ? "#2f80ed" : "#d9d9d9" }}
    >
      <motion.span
        className="absolute top-[3px] left-[3px] w-5 h-5 rounded-full bg-white shadow"
        animate={{ x: on ? 18 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 34 }}
      />
    </button>
  );
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
        <Toggle on={enabled} onClick={() => onToggle(!enabled)} />
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
