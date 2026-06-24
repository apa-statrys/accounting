import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

const FONT = { fontFamily: "GT Walsheim LC, sans-serif" } as const;

/** Animated "sent" checkmark — circle + tick draw in. */
function AnimatedCheck() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" className="shrink-0">
      <motion.circle
        cx="14"
        cy="14"
        r="12"
        fill="none"
        stroke="#4ADE80"
        strokeWidth="2"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      />
      <motion.path
        d="M8 14.5l4 4 8-8.5"
        fill="none"
        stroke="#4ADE80"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.28, duration: 0.32, ease: "easeOut" }}
      />
    </svg>
  );
}

interface SendSuccessToastProps {
  open: boolean;
  /** Short, scannable title (e.g. "Invoice sent"). */
  message?: string;
  /** Optional muted second line (e.g. "Marked as sent"). */
  subtext?: string;
  onDone?: () => void;
  duration?: number;
}

/** Top banner toast (translucent dark) with a sent checkmark — concise, Qonto-style. */
export function SendSuccessToast({
  open,
  message = "Invoice sent",
  subtext,
  onDone,
  duration = 3000,
}: SendSuccessToastProps) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => onDone?.(), duration);
    return () => clearTimeout(t);
  }, [open, duration, onDone]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute top-[54px] inset-x-3 z-50 flex items-center gap-3 rounded-[20px] bg-black/75 backdrop-blur-xl px-4 py-3 shadow-2xl"
          initial={{ y: -90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -90, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        >
          <AnimatedCheck />
          <div className="min-w-0">
            <p className="text-[14px] font-semibold leading-[1.25] text-white" style={FONT}>{message}</p>
            {subtext && (
              <p className="text-[12px] leading-[1.3] text-white/65" style={FONT}>{subtext}</p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SendSuccessToast;
