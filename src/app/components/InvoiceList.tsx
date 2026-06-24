import { useState } from "react";
import { Plus, FileText, Pencil, Upload } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const FONT = { fontFamily: "GT Walsheim LC, sans-serif" } as const;

/* ----- click feedback: tiny haptic + generated click sound ----- */
let audioCtx: AudioContext | null = null;

function playClick() {
  try {
    const Ctx = (window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) as
      | typeof AudioContext
      | undefined;
    if (!Ctx) return;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === "suspended") void audioCtx.resume();
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(200, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.15, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.08);
  } catch {
    /* audio not available */
  }
}

function feedback() {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(8);
  } catch {
    /* haptics not available */
  }
  playClick();
}

/* Ordered top → bottom (Manual sits nearest the FAB). Both tertiary by default. */
const OPTIONS = [
  { id: "upload", label: "Upload", Icon: Upload },
  { id: "manual", label: "Manual", Icon: Pencil },
] as const;

interface InvoiceListProps {
  /** Start the manual create-sales-invoice flow. */
  onManual?: () => void;
  /** Start the upload-invoice flow (not built yet). */
  onUpload?: () => void;
}

export function InvoiceList({ onManual, onUpload }: InvoiceListProps) {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    feedback();
    setOpen((v) => !v);
  };

  const close = () => {
    feedback();
    setOpen(false);
  };

  const choose = (id: string) => {
    feedback();
    setOpen(false);
    if (id === "manual") onManual?.();
    else onUpload?.();
  };

  return (
    <div
      className="relative bg-[#F9F5EA] rounded-[48px] overflow-hidden shadow-2xl flex flex-col"
      style={{ width: 375, height: 812 }}
    >
      {/* Status bar */}
      <div className="flex items-center justify-between px-6 pt-4 pb-1">
        <span className="text-[15px] font-semibold tracking-tight">9:41</span>
        <div className="absolute left-1/2 -translate-x-1/2 top-2 w-28 h-7 bg-black rounded-full" />
        <div className="flex items-center gap-1.5">
          <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
            <rect x="0" y="4" width="3" height="8" rx="0.5" fill="black" />
            <rect x="4.5" y="2.5" width="3" height="9.5" rx="0.5" fill="black" />
            <rect x="9" y="0.5" width="3" height="11.5" rx="0.5" fill="black" />
            <rect x="13.5" y="0" width="3" height="12" rx="0.5" fill="black" fillOpacity="0.3" />
          </svg>
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
            <path d="M8 2.5C10.2 2.5 12.2 3.4 13.6 4.9L15 3.4C13.2 1.5 10.7 0.3 8 0.3C5.3 0.3 2.8 1.5 1 3.4L2.4 4.9C3.8 3.4 5.8 2.5 8 2.5Z" fill="black" />
            <path d="M8 5.5C9.4 5.5 10.6 6.1 11.5 7L12.9 5.5C11.6 4.2 9.9 3.4 8 3.4C6.1 3.4 4.4 4.2 3.1 5.5L4.5 7C5.4 6.1 6.6 5.5 8 5.5Z" fill="black" />
            <circle cx="8" cy="10" r="1.5" fill="black" />
          </svg>
          <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
            <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="black" strokeOpacity="0.35" />
            <rect x="2" y="2" width="18" height="8" rx="2" fill="black" />
            <path d="M23 4V8C23.8 7.6 24.5 6.9 24.5 6C24.5 5.1 23.8 4.4 23 4Z" fill="black" fillOpacity="0.4" />
          </svg>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <h1 className="text-[22px] font-bold text-[#1B1B1B]" style={FONT}>
          Sales
        </h1>
      </div>

      {/* Empty state */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-5">
        <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center">
          <FileText size={32} strokeWidth={1.5} className="text-[#1B1B1B]" />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-[20px] font-bold text-[#1B1B1B]" style={FONT}>
            No invoices yet
          </h2>
          <p className="text-[14px] leading-[1.5] text-[#808080]" style={FONT}>
            Create your first sales invoice to start getting paid. Tap the
            <span className="font-semibold text-[#1B1B1B]"> + </span>
            button to add one manually or upload an existing invoice.
          </p>
        </div>
      </div>

      {/* Dim overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute inset-0 z-20 bg-black/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={close}
            aria-hidden
          />
        )}
      </AnimatePresence>

      {/* Speed-dial FAB */}
      <div className="absolute bottom-8 right-6 z-30 flex flex-col items-end gap-3">
        <AnimatePresence>
          {open &&
            OPTIONS.map((opt, i) => (
              <motion.button
                key={opt.id}
                onClick={() => choose(opt.id)}
                className="flex items-center gap-3"
                initial={{ opacity: 0, y: 14, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 14, scale: 0.85 }}
                whileTap={{ scale: 0.9 }}
                transition={{
                  type: "spring",
                  stiffness: 520,
                  damping: 30,
                  delay: (OPTIONS.length - 1 - i) * 0.045,
                }}
              >
                <span className="text-[16px] font-bold text-white" style={FONT}>
                  {opt.label}
                </span>
                <span className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg">
                  <opt.Icon size={20} className="text-[#1b1b1b]" />
                </span>
              </motion.button>
            ))}
        </AnimatePresence>

        <motion.button
          onClick={toggle}
          aria-label={open ? "Close" : "Create invoice"}
          aria-expanded={open}
          whileTap={{ scale: 0.9 }}
          className="w-14 h-14 rounded-full bg-[#1B1B1B] flex items-center justify-center shadow-xl"
        >
          <motion.span
            className="flex"
            animate={{ rotate: open ? 45 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            <Plus size={24} className="text-white" />
          </motion.span>
        </motion.button>
      </div>
    </div>
  );
}
