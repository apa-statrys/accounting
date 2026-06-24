import { useState } from "react";
import { X, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./Buttons";

interface Item {
  name: string;
  description: string;
  qty: number;
  unitPrice: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (item: Item) => void;
}

export function AddItemBottomSheet({ open, onClose, onAdd }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [qty, setQty] = useState(1);
  const [unitPrice, setUnitPrice] = useState("");

  const lineTotal = qty * (parseFloat(unitPrice) || 0);
  const canAdd = name.trim().length > 0 && parseFloat(unitPrice) > 0;

  const handleAdd = () => {
    if (!canAdd) return;
    onAdd({ name, description, qty, unitPrice: parseFloat(unitPrice) });
    setName(""); setDescription(""); setQty(1); setUnitPrice("");
    onClose();
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
            <div className="flex items-center justify-between mb-5">
              <span className="text-[20px] font-bold text-gray-900">Add item</span>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#F0EDE6] flex items-center justify-center"
              >
                <X size={15} strokeWidth={2.5} className="text-gray-600" />
              </button>
            </div>

            {/* Item name */}
            <p className="text-[14px] font-semibold text-gray-900 mb-2">Item name</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Brand identity design"
              className="w-full border border-gray-200 rounded-2xl px-4 py-3.5 text-[15px] text-gray-900 placeholder-gray-300 outline-none focus:border-gray-400 mb-4"
            />

            {/* Description */}
            <p className="text-[14px] font-semibold text-gray-900 mb-2">Description</p>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional — what's included"
              className="w-full border border-gray-200 rounded-2xl px-4 py-3.5 text-[15px] text-gray-900 placeholder-gray-300 outline-none focus:border-gray-400 mb-4"
            />

            {/* Qty + Unit price */}
            <div className="flex gap-3 mb-4">
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-gray-900 mb-2">Qty</p>
                <input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3.5 text-[15px] text-gray-900 outline-none focus:border-gray-400"
                />
              </div>
              <div className="flex-[2]">
                <p className="text-[14px] font-semibold text-gray-900 mb-2">Unit price (USD)</p>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-[#FF4A15] rounded-2xl px-4 py-3.5 text-[15px] text-gray-900 placeholder-gray-300 outline-none"
                />
              </div>
            </div>

            {/* Unit / Currency card */}
            <div className="bg-[#F9F7F4] rounded-2xl divide-y divide-gray-200 mb-4">
              <button className="w-full flex items-center justify-between px-4 py-3.5">
                <span className="text-[14px] text-gray-400">Unit</span>
                <span className="flex items-center gap-1 text-[14px] font-semibold text-gray-900">
                  Unit <ChevronRight size={14} className="text-gray-400" />
                </span>
              </button>
              <button className="w-full flex items-center justify-between px-4 py-3.5">
                <span className="text-[14px] text-gray-400">Currency</span>
                <span className="flex items-center gap-1 text-[14px] font-semibold text-gray-900">
                  USD · $ <ChevronRight size={14} className="text-gray-400" />
                </span>
              </button>
            </div>

            {/* Line total */}
            <div className="flex items-center justify-between mb-5">
              <span className="text-[14px] text-gray-400">Line total</span>
              <span className="text-[17px] font-bold text-gray-900">
                ${lineTotal.toFixed(2)}
              </span>
            </div>

            {/* CTA */}
            <Button
              variant="primary"
              className="w-full"
              onClick={handleAdd}
              disabled={!canAdd}
            >
              ADD TO INVOICE
            </Button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
