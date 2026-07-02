import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import CloseIcon from "@mui/icons-material/Close";
import FlashOnOutlinedIcon from "@mui/icons-material/FlashOnOutlined";
import StatusBar from "./StatusBar";

import { FONT } from "../lib/theme";
const BRAND = "#FF4A15";

/** Edge-detection corner bracket — one of the four framing the document. */
function Corner({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const base = "absolute w-7 h-7 border-[#FF4A15]";
  const map: Record<string, string> = {
    tl: "top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-lg",
    tr: "top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-lg",
    bl: "bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-lg",
    br: "bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-lg",
  };
  return <span className={`${base} ${map[pos]}`} aria-hidden />;
}

/**
 * Camera + document-scanner demo. In a published build the shutter opens the native
 * scanner (iOS VisionKit / Android ML Kit); here it plays a framing → scanning sequence,
 * then hands a captured file back via `onCapture`. Render at the PAGE ROOT.
 */
export function ScanDocument({ open, onClose, onCapture }: { open: boolean; onClose?: () => void; onCapture?: () => void }) {
  const [phase, setPhase] = useState<"frame" | "scanning">("frame");
  // Latest onCapture without retriggering the timer (it's a fresh closure each parent render).
  const onCaptureRef = useRef(onCapture);
  onCaptureRef.current = onCapture;

  // Reset to the live viewfinder each time the camera opens.
  useEffect(() => {
    if (open) setPhase("frame");
  }, [open]);

  // After the shutter, play the scan sweep, then return the captured document — exactly once.
  useEffect(() => {
    if (phase !== "scanning") return;
    const t = setTimeout(() => onCaptureRef.current?.(), 1600);
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-50 flex flex-col bg-[#0d0d0d]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <StatusBar darkMode />

          {/* Top bar — close + title + (decorative) flash toggle */}
          <div className="shrink-0 flex items-center justify-between px-4 py-3">
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white"
            >
              <CloseIcon style={{ fontSize: 20 }} />
            </button>
            <span className="text-[15px] font-bold text-white" style={FONT}>Scan invoice</span>
            <span className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70" aria-hidden>
              <FlashOnOutlinedIcon style={{ fontSize: 19 }} />
            </span>
          </div>

          {/* Viewfinder */}
          <div className="flex-1 flex flex-col items-center justify-center px-8">
            <div className="relative w-full max-w-[280px] aspect-[3/4]">
              {/* The framed document the camera "sees" */}
              <div className="absolute inset-2 bg-white rounded-md overflow-hidden flex flex-col gap-3 p-5 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1.5">
                    <div className="h-3 w-20 rounded bg-[#1b1b1b]" />
                    <div className="h-1.5 w-16 rounded bg-[#e5e5e5]" />
                  </div>
                  <div className="h-8 w-8 rounded bg-[#eee]" />
                </div>
                <div className="h-px w-full bg-[#f0f0f0]" />
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="h-2 rounded bg-[#ececec]" style={{ width: `${52 - i * 7}%` }} />
                    <div className="h-2 w-9 rounded bg-[#ececec]" />
                  </div>
                ))}
                <div className="mt-auto flex items-center justify-between">
                  <div className="h-2.5 w-12 rounded bg-[#e5e5e5]" />
                  <div className="h-2.5 w-16 rounded bg-[#1b1b1b]" />
                </div>
              </div>

              {/* Edge-detection brackets — gently pulse while framing */}
              <motion.div
                className="absolute inset-0"
                animate={phase === "frame" ? { opacity: [0.55, 1, 0.55] } : { opacity: 1 }}
                transition={phase === "frame" ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
              >
                <Corner pos="tl" />
                <Corner pos="tr" />
                <Corner pos="bl" />
                <Corner pos="br" />
              </motion.div>

              {/* Scanning sweep — a band travels down the document */}
              {phase === "scanning" && (
                <div className="absolute inset-2 overflow-hidden rounded-md pointer-events-none">
                  <motion.div
                    className="absolute inset-x-0 h-20"
                    style={{ background: "linear-gradient(180deg, rgba(255,74,21,0) 0%, rgba(255,74,21,0.35) 50%, rgba(255,74,21,0) 100%)" }}
                    initial={{ y: "-80%" }}
                    animate={{ y: "420%" }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>
              )}
            </div>

            <p className="mt-8 text-[14px] leading-[1.4] text-white/70 text-center" style={FONT}>
              {phase === "frame" ? "Position the invoice within the frame" : "Scanning…"}
            </p>
          </div>

          {/* Shutter */}
          <div className="shrink-0 flex items-center justify-center pb-10 pt-4">
            {phase === "frame" ? (
              <button
                type="button"
                aria-label="Capture"
                onClick={() => setPhase("scanning")}
                className="w-[72px] h-[72px] rounded-full bg-white/15 flex items-center justify-center active:scale-95 transition-transform"
              >
                <span className="w-14 h-14 rounded-full bg-white" />
              </button>
            ) : (
              <div className="w-[72px] h-[72px] flex items-center justify-center" aria-hidden>
                <span
                  className="w-9 h-9 rounded-full border-[3px] border-white/25 animate-spin"
                  style={{ borderTopColor: BRAND }}
                />
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ScanDocument;
