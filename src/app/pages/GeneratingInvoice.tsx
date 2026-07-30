import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { StatusBar } from "../components/StatusBar";

const DEFAULT_STEPS = [
  "Preparing invoice details…",
  "Applying your branding…",
  "Calculating totals…",
  "Finalising your invoice…",
];

interface GeneratingInvoiceProps {
  onDone: () => void;
  title?: string;
  steps?: string[];
  /** How long the progress runs before finishing (ms). */
  durationMs?: number;
}

export function GeneratingInvoice({ onDone, title = "Generating invoice", steps = DEFAULT_STEPS, durationMs = 3000 }: GeneratingInvoiceProps) {
  const STEPS = steps;
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const totalDuration = durationMs;
    const stepInterval = totalDuration / STEPS.length;

    const stepTimer = setInterval(() => {
      setStepIndex((prev) => {
        if (prev < STEPS.length - 1) return prev + 1;
        clearInterval(stepTimer);
        return prev;
      });
    }, stepInterval);

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        return prev + 1;
      });
    }, totalDuration / 100);

    const doneTimer = setTimeout(onDone, totalDuration + 400);

    return () => {
      clearInterval(stepTimer);
      clearInterval(progressTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone, durationMs]);

  return (
    <div
      className="relative bg-[var(--bg-beige-primary)] rounded-[48px] overflow-hidden shadow-2xl flex flex-col items-center justify-center"
      style={{ width: 375, height: 812 }}
    >
        {/* App status bar — pinned to the top edge; the spinner stays centred below it. */}
        <StatusBar className="absolute top-0 inset-x-0 z-10" />

        {/* Animated background blob */}
        <motion.div
          className="absolute w-64 h-64 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,74,21,0.12) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Icon */}
        <motion.div
          className="relative mb-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="w-20 h-20 rounded-3xl bg-white shadow-md flex items-center justify-center">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <rect x="6" y="4" width="24" height="28" rx="3" fill="var(--icon-neutral-inverse-primary)" stroke="#E0E0E0" strokeWidth="1.5"/>
              <path d="M11 12h14M11 17h14M11 22h8" stroke="var(--icon-primary)" strokeWidth="1.5" strokeLinecap="round"/>
              <motion.path
                d="M11 12h14M11 17h14M11 22h8"
                stroke="var(--icon-brand)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray="40"
                strokeDashoffset="40"
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
              />
            </svg>
          </div>
          {/* Spinning ring */}
          <motion.div
            className="absolute -inset-2 rounded-[22px] border-2 border-transparent"
            style={{ borderTopColor: "var(--border-brand-primary)", borderRightColor: "rgba(255,74,21,0.2)" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>

        {/* Title */}
        <motion.p
          className="text-[20px] font-bold text-gray-900 mb-2"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {title}
        </motion.p>

        {/* Animated step label */}
        <div className="h-6 mb-8 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={stepIndex}
              className="text-[14px] text-gray-400 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {STEPS[stepIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Progress bar */}
        <div className="w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[var(--bg-brand-primary)] rounded-full"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.05 }}
          />
        </div>

        {/* Percentage */}
        <p className="text-[12px] text-gray-400 mt-3">{progress}%</p>
    </div>
  );
}
