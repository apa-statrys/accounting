import { X, UserRoundPlus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Customer {
  initials: string;
  name: string;
  email: string;
}

const CUSTOMERS: Customer[] = [
  { initials: "MF", name: "Marlow & Finch Studio", email: "ap@marlowfinch.co" },
  { initials: "BH", name: "Bright Harbor Co.", email: "billing@brightharbor.com" },
  { initials: "OR", name: "Otto Reyes", email: "otto@reyesdesign.io" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (customer: Customer) => void;
}

export function CustomerBottomSheet({ open, onClose, onSelect }: Props) {
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
            <div className="flex items-center justify-between mb-5">
              <span className="text-[20px] font-bold text-gray-900">Bill to</span>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#F0EDE6] flex items-center justify-center"
              >
                <X size={15} strokeWidth={2.5} className="text-gray-600" />
              </button>
            </div>

            {/* Customer list */}
            <div className="space-y-2">
              {CUSTOMERS.map((c) => (
                <button
                  key={c.email}
                  onClick={() => { onSelect(c); onClose(); }}
                  className="w-full flex items-center gap-3 px-4 py-4 bg-white border border-gray-200 rounded-2xl text-left hover:bg-gray-50 transition-colors"
                >
                  {/* Customer avatar removed for now (pending invoice-number confirmation) */}
                  <div>
                    <p className="text-[15px] font-semibold text-gray-900">{c.name}</p>
                    <p className="text-[13px] text-gray-400 mt-0.5">{c.email}</p>
                  </div>
                </button>
              ))}

              {/* Add new customer */}
              <button className="w-full flex items-center gap-3 px-4 py-4 border-2 border-dashed border-gray-200 rounded-2xl text-left hover:border-gray-300 transition-colors">
                <div className="w-11 h-11 rounded-full bg-[#FFE8E2] flex items-center justify-center shrink-0">
                  <UserRoundPlus size={18} className="text-[#FF4A15]" />
                </div>
                <span className="text-[15px] font-semibold text-[#FF4A15]">Add a new customer</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
