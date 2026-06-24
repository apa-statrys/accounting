import { useState } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./Buttons";

interface Props {
  open: boolean;
  onClose: () => void;
  onApply: (value: number, type: "amount" | "percent") => void;
}

export function DiscountBottomSheet({ open, onClose, onApply }: Props) {
  const [type, setType] = useState<"amount" | "percent">("amount");
  const [value, setValue] = useState("");

  const handleApply = () => {
    const num = parseFloat(value);
    if (!isNaN(num) && num > 0) {
      onApply(num, type);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="absolute inset-0 z-20 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
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
            <div className="flex items-center justify-between mb-6">
              <span className="text-[20px] font-bold text-gray-900">Discount</span>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#F0EDE6] flex items-center justify-center"
              >
                <X size={15} strokeWidth={2.5} className="text-gray-600" />
              </button>
            </div>

            {/* Input + toggle row */}
            <div className="flex items-center bg-[#F2F2F2] rounded-2xl px-4 py-1 gap-3 mb-6">
              {/* Currency label */}
              <span className="text-[15px] text-gray-400 font-medium shrink-0">SGD</span>

              {/* Value input */}
              <input
                type="number"
                min={0}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0"
                className="flex-1 bg-transparent outline-none text-[18px] text-gray-900 py-3"
              />

              {/* SGD / % segmented toggle */}
              <div className="flex items-center bg-[#E4E4E4] rounded-xl p-1 gap-1 shrink-0">
                <button
                  onClick={() => setType("amount")}
                  className={`px-4 py-2 rounded-lg text-[14px] font-semibold transition-all ${
                    type === "amount"
                      ? "bg-[#FF4A15] text-white shadow-sm"
                      : "text-gray-500"
                  }`}
                >
                  SGD
                </button>
                <button
                  onClick={() => setType("percent")}
                  className={`px-4 py-2 rounded-lg text-[14px] font-semibold transition-all ${
                    type === "percent"
                      ? "bg-[#FF4A15] text-white shadow-sm"
                      : "text-gray-500"
                  }`}
                >
                  %
                </button>
              </div>
            </div>

            <Button
              variant="primary"
              className="w-full"
              onClick={handleApply}
              disabled={!value || parseFloat(value) <= 0}
            >
              APPLY DISCOUNT
            </Button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
