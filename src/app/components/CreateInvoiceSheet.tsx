import { FilePlus2, Upload } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { FONT, INK, MUTED } from "../lib/theme";
const BRAND = "#ff4a15";

/** Shared open/close motion — matches the app's standard bottom-sheet animation. */
const backdrop = { closed: { opacity: 0 }, open: { opacity: 1 } };

const sheet = {
  closed: { y: "100%", transition: { type: "tween" as const, duration: 0.4, ease: [0.4, 0, 0.6, 1] as const } },
  open: { y: 0, transition: { type: "spring" as const, stiffness: 340, damping: 34 } },
};

const list = { closed: {}, open: { transition: { staggerChildren: 0.06, delayChildren: 0.12 } } };
const item = { closed: { opacity: 0, y: 14 }, open: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

interface RowProps {
  title: string;
  sub: string;
  icon: React.ReactNode;
  divider: boolean;
  onClick?: () => void;
}

/** List row — left icon + title/subtitle, with a thin divider below (except the last). */
function Row({ title, sub, icon, divider, onClick }: RowProps) {
  return (
    <motion.button
      variants={item}
      onClick={onClick}
      initial={false}
      whileTap="pressed"
      className="w-full flex items-center gap-3 py-3 text-left"
      style={{ borderBottom: divider ? "1px solid rgba(160,160,160,0.2)" : "none" }}
    >
      {/* On press, only the icon recolors to brand (no row fill) — currentColor drives the lucide stroke. */}
      <motion.span
        variants={{ pressed: { color: BRAND } }}
        className="shrink-0 flex items-center justify-center"
        style={{ color: INK }}
      >
        {icon}
      </motion.span>
      <span className="flex flex-col">
        <span className="text-[18px] font-medium leading-[1.1]" style={{ ...FONT, color: INK }}>{title}</span>
        <span className="text-[14px] leading-[1.3]" style={{ ...FONT, color: MUTED }}>{sub}</span>
      </span>
    </motion.button>
  );
}

interface CreateInvoiceSheetProps {
  open: boolean;
  onClose?: () => void;
  onManual?: () => void;
  onUpload?: () => void;
}

/**
 * "Create" bottom sheet (Figma 898:17090): slides up from the FAB with a list of choices — build
 * manually or upload/scan a file. Recurring (DES-782) is NOT a separate entry here — it's a toggle
 * inside the normal Create Invoice flow. Auto-height, grabber handle.
 */
export function CreateInvoiceSheet({ open, onClose, onManual, onUpload }: CreateInvoiceSheetProps) {
  const rows = [
    { title: "Create Invoice", sub: "Build a new invoice step by step", icon: <FilePlus2 size={24} strokeWidth={1.75} />, onClick: onManual },
    { title: "Upload Invoice", sub: "Scan or upload existing invoice", icon: <Upload size={24} strokeWidth={1.75} />, onClick: onUpload },
  ];

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
            className="absolute inset-x-0 bottom-0 bg-white rounded-t-[16px] pt-3"
            style={{ boxShadow: "0px 10px 30px 0px rgba(0,0,0,0.2)" }}
            variants={sheet}
          >
            {/* Grabber */}
            <div className="flex justify-center pt-1 pb-1">
              <div className="h-[5px] w-12 rounded-full bg-[#cdcfd0]" />
            </div>

            <motion.div variants={list} className="flex flex-col px-4 pt-2 pb-2">
              {rows.map((r, i) => (
                <Row key={r.title} title={r.title} sub={r.sub} icon={r.icon} onClick={r.onClick} divider={i < rows.length - 1} />
              ))}
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
