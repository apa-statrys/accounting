import { useState } from "react";
import { Plus, Pencil, Upload } from "lucide-react";
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

/* Ordered top → bottom (Manual sits nearest the FAB). Both tertiary. */
const OPTIONS = [
  { id: "upload", label: "Upload", Icon: Upload },
  { id: "manual", label: "Manual", Icon: Pencil },
] as const;

interface CreateInvoiceFabProps {
  onManual?: () => void;
  onUpload?: () => void;
  /** Lift the FAB above a floating bottom tab bar. */
  raised?: boolean;
}

/** Speed-dial FAB: Manual / Upload, with a dim overlay and click feedback. */
export function CreateInvoiceFab({ onManual, onUpload, raised = false }: CreateInvoiceFabProps) {
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
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute inset-0 z-20 bg-black/15 backdrop-blur-[1px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={close}
            aria-hidden
          />
        )}
      </AnimatePresence>

      <div className={`absolute ${raised ? "bottom-28" : "bottom-8"} right-6 z-30 flex flex-col items-end gap-3`}>
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
                transition={{ type: "spring", stiffness: 520, damping: 30, delay: (OPTIONS.length - 1 - i) * 0.045 }}
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
    </>
  );
}

export default CreateInvoiceFab;
