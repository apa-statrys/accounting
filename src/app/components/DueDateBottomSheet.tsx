import { useState } from "react";
import { X, CalendarDays } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const ISSUE_DATE = new Date(2026, 5, 11); // Jun 11, 2026

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const PRESETS = [
  { label: "Same as issue date", days: 0 },
  { label: "15 days", days: 15 },
  { label: "30 days", days: 30 },
  { label: "45 days", days: 45 },
  { label: "60 days", days: 60 },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (label: string) => void;
}

export function DueDateBottomSheet({ open, onClose, onSelect }: Props) {
  const [customDate, setCustomDate] = useState("");

  const handlePreset = (preset: typeof PRESETS[number]) => {
    const date = addDays(ISSUE_DATE, preset.days);
    onSelect(formatDate(date));
    onClose();
  };

  const handleCustom = (val: string) => {
    setCustomDate(val);
    if (val) {
      const parsed = new Date(val);
      if (!isNaN(parsed.getTime())) {
        onSelect(formatDate(parsed));
        onClose();
      }
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 z-20 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 z-30 bg-white rounded-t-[28px] px-4 pt-3 pb-8"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-5" />

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[20px] font-bold text-gray-900">Due date</span>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#F0EDE6] flex items-center justify-center"
              >
                <X size={15} strokeWidth={2.5} className="text-gray-600" />
              </button>
            </div>

            {/* Preset options */}
            <div className="space-y-2 mb-5">
              {PRESETS.map((preset) => {
                const date = addDays(ISSUE_DATE, preset.days);
                return (
                  <button
                    key={preset.days}
                    onClick={() => handlePreset(preset)}
                    className="w-full flex flex-col px-4 py-4 bg-white border border-gray-200 rounded-2xl text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-[15px] font-semibold text-gray-900">{preset.label}</span>
                    <span className="text-[13px] text-gray-400 mt-0.5">Due {formatDate(date)}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom date */}
            <p className="text-[15px] font-semibold text-gray-900 mb-2">Custom date</p>
            <div className="flex items-center justify-between px-4 py-4 border border-gray-200 rounded-2xl bg-white">
              <input
                type="date"
                value={customDate}
                onChange={(e) => handleCustom(e.target.value)}
                className="flex-1 bg-transparent outline-none text-[15px] text-gray-400 appearance-none"
                placeholder="dd/mm/yyyy"
              />
              <CalendarDays size={18} className="text-gray-400 shrink-0" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
