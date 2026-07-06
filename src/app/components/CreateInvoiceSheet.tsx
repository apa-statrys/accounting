import { FilePlus2, UploadCloud, Repeat } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { FONT, INK, MUTED } from "../lib/theme";
const BRAND = "#ff4a15";

/** Recurring invoices (DES-782) are built but hidden from the Create sheet for now — flip to re-enable. */
const SHOW_RECURRING = false;

/** Shared open/close motion — matches the app's standard bottom-sheet animation. */
const backdrop = { closed: { opacity: 0 }, open: { opacity: 1 } };

const sheet = {
  closed: { y: "100%", transition: { type: "tween" as const, duration: 0.4, ease: [0.4, 0, 0.6, 1] as const } },
  open: { y: 0, transition: { type: "spring" as const, stiffness: 340, damping: 34 } },
};

const list = { closed: {}, open: { transition: { staggerChildren: 0.06, delayChildren: 0.12 } } };
const item = { closed: { opacity: 0, y: 14 }, open: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

interface TileProps {
  title: string;
  sub: string;
  icon: React.ReactNode;
  onClick?: () => void;
}

/** Beige action tile with hover (lift + brand outline) and selected/pressed (sink + solid brand) states. */
function Tile({ title, sub, icon, onClick }: TileProps) {
  return (
    <motion.button
      variants={item}
      onClick={onClick}
      initial={false}
      whileHover={{ borderColor: "rgba(255,74,21,0.6)", boxShadow: "0 10px 26px rgba(0,0,0,0.08)", y: -2 }}
      whileTap={{ scale: 0.98, borderColor: BRAND, backgroundColor: "#f4ede0" }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      className="w-full flex flex-col items-center justify-center gap-4 rounded-xl p-[25px]"
      style={{
        background: "#f9f5ea",
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: "rgba(160,160,160,0.45)",
      }}
    >
      {icon}
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-[18px] font-bold leading-[1.1]" style={{ ...FONT, color: INK }}>{title}</p>
        <p className="text-[16px] font-medium leading-[1.3]" style={{ ...FONT, color: MUTED }}>{sub}</p>
      </div>
    </motion.button>
  );
}

interface CreateInvoiceSheetProps {
  open: boolean;
  onClose?: () => void;
  onManual?: () => void;
  onUpload?: () => void;
  /** Start a recurring invoice series (DES-782) — same create flow + a schedule. */
  onRecurring?: () => void;
}

/**
 * "Create" bottom sheet (Figma 426:13541): slides up from the FAB with three
 * choices — build manually, upload a file, or set up a recurring series (DES-782).
 * Auto-height, grabber handle.
 */
export function CreateInvoiceSheet({ open, onClose, onManual, onUpload, onRecurring }: CreateInvoiceSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="absolute inset-0 z-40" initial="closed" animate="open" exit="closed">
          {/* Scrim */}
          <motion.div
            className="absolute inset-0 bg-black/25"
            variants={backdrop}
            transition={{ duration: 0.35 }}
            onClick={onClose}
            aria-hidden
          />

          {/* Sheet */}
          <motion.div
            className="absolute inset-x-0 bottom-0 bg-white rounded-t-[28px] pt-3"
            variants={sheet}
          >
            {/* Grabber */}
            <div className="flex justify-center pt-1 pb-1">
              <div className="h-1 w-10 rounded-full bg-[#d1d5dc]" />
            </div>

            <motion.div variants={list} className="flex flex-col gap-4 px-6 pt-5 pb-2">
              <Tile
                title="Create Invoice"
                sub="Build a new invoice step by step"
                icon={<FilePlus2 size={32} strokeWidth={1.75} style={{ color: INK }} />}
                onClick={onManual}
              />
              <Tile
                title="Add Existing Invoice"
                sub="Upload or scan an invoice"
                icon={<UploadCloud size={32} strokeWidth={1.75} style={{ color: INK }} />}
                onClick={onUpload}
              />
              {SHOW_RECURRING && (
                <Tile
                  title="Recurring Invoice"
                  sub="Bill a customer on a set schedule"
                  icon={<Repeat size={32} strokeWidth={1.75} style={{ color: INK }} />}
                  onClick={onRecurring}
                />
              )}
            </motion.div>

            {/* Home indicator */}
            <div className="flex justify-center py-3">
              <div className="h-[5px] w-[134px] rounded-full bg-black" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CreateInvoiceSheet;
