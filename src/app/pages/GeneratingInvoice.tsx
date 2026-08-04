import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { StatusBar } from "../components/StatusBar";
import { Loading } from "../ui/Loading";

interface GeneratingInvoiceProps {
  onDone: () => void;
  /** Shown first; swaps to `finalText` shortly before `onDone` fires. */
  title?: string;
  finalText?: string;
  /** Total time before `onDone` fires (ms). */
  durationMs?: number;
}

export function GeneratingInvoice({ onDone, title = "Reading your invoice…", finalText = "Almost done…", durationMs = 3000 }: GeneratingInvoiceProps) {
  const [phase, setPhase] = useState<"reading" | "done">("reading");

  useEffect(() => {
    const finalTimer = setTimeout(() => setPhase("done"), Math.max(durationMs - 700, 0));
    const doneTimer = setTimeout(onDone, durationMs + 400);

    return () => {
      clearTimeout(finalTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone, durationMs]);

  const label = phase === "done" ? finalText : title;

  return (
    <div
      className="relative bg-[var(--bg-neutral-tertiary)] rounded-[48px] overflow-hidden shadow-2xl flex flex-col items-center justify-center"
      style={{ width: 375, height: 812 }}
    >
        {/* App status bar — pinned to the top edge; the spinner stays centred below it. */}
        <StatusBar className="absolute top-0 inset-x-0 z-10" />

        {/* Loading spinner (ui/Loading) — replaces a hand-rolled icon+ring animation. */}
        <motion.div
          className="relative mb-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Loading size="lg" aria-label={label} />
        </motion.div>

        {/* Label — just two phases (title, then finalText shortly before onDone), no step list/progress bar. */}
        <div className="h-6 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={phase}
              className="text-[16px] font-bold text-gray-900 text-center"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              {label}
            </motion.p>
          </AnimatePresence>
        </div>
    </div>
  );
}
