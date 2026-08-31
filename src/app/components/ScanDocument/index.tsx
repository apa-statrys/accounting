import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Zap, Images, Check } from "lucide-react";
import StatusBar from "../StatusBar";

import { FONT } from "../../lib/theme";
const BRAND = "#FF4A15";

/** Edge-detection corner bracket — one of the four framing the document. */
function Corner({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const base = "absolute w-7 h-7 border-[var(--border-brand-primary)]";
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
 * scanner (iOS VisionKit / Android ML Kit); here it plays a framing → scanning → review
 * sequence. After each capture the user keeps the page or retakes it; once kept, they can
 * shoot another page (multi-page invoice) or tap Done to finish — all kept pages become ONE
 * invoice document, handed back via a single `onCapture(pageCount)` call. The bottom-bar
 * photo-library button adds a page the same way (no retake needed for an already-existing
 * photo) — same spot as iOS Camera's last-shot thumbnail, so upload isn't camera-only.
 * Renders full-screen (`absolute inset-0`) over whatever's underneath (CreateInvoiceSheet) —
 * needs a positioned ancestor sized to the phone frame, same as any other sheet overlay.
 */
export function ScanDocument({
  open,
  onClose,
  onCapture,
}: {
  open: boolean;
  onClose?: () => void;
  /** Fires once the user taps Done — total pages kept, all treated as one document. */
  onCapture?: (pageCount: number) => void;
}) {
  const [phase, setPhase] = useState<"frame" | "scanning" | "review">("frame");
  const [pages, setPages] = useState(0);

  // Reset to the live viewfinder, page count cleared, each time the camera opens.
  useEffect(() => {
    if (open) {
      setPhase("frame");
      setPages(0);
    }
  }, [open]);

  // After the shutter, play the scan sweep, then land on the keep/retake review step.
  useEffect(() => {
    if (phase !== "scanning") return;
    const t = setTimeout(() => setPhase("review"), 1400);
    return () => clearTimeout(t);
  }, [phase]);

  const handleRetake = () => setPhase("frame");
  const handleKeep = () => {
    setPages((p) => p + 1);
    setPhase("frame");
  };
  const handleImport = () => setPages((p) => p + 1);
  const handleDone = () => onCapture?.(pages);

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

          {/* Top bar — close + title (page count once multi-page) + (decorative) flash toggle */}
          <div className="shrink-0 flex items-center justify-between px-4 py-3">
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white"
            >
              <X size={20} strokeWidth={1.67} />
            </button>
            <span className="text-[15px] font-bold text-white" style={FONT}>
              {phase === "review" ? "Review page" : pages > 0 ? `Page ${pages + 1}` : "Scan invoice"}
            </span>
            <span className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70" aria-hidden>
              <Zap size={19} strokeWidth={1.67} />
            </span>
          </div>

          {/* Viewfinder */}
          <div className="flex-1 flex flex-col items-center justify-center px-8">
            <div className="relative w-full max-w-[280px] aspect-[3/4]">
              {/* The framed document the camera "sees" */}
              <div className="absolute inset-2 bg-white rounded-md overflow-hidden flex flex-col gap-3 p-5 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1.5">
                    <div className="h-3 w-20 rounded bg-[var(--bg-neutral-inverse-primary)]" />
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
                  <div className="h-2.5 w-16 rounded bg-[var(--bg-neutral-inverse-primary)]" />
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

              {/* Kept-page confirmation badge */}
              {phase === "review" && (
                <div
                  className="absolute -top-3 -right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.35)]"
                  style={{ background: BRAND }}
                  aria-hidden
                >
                  <Check size={18} strokeWidth={2.25} color="#fff" />
                </div>
              )}
            </div>

            <p className="mt-8 text-[14px] leading-[1.4] text-white/70 text-center" style={FONT}>
              {phase === "scanning"
                ? "Scanning…"
                : phase === "review"
                ? "Keep this page, or retake it"
                : pages > 0
                ? "Add another page, or tap Done to finish"
                : "Position the invoice within the frame"}
            </p>
          </div>

          {/* Review step — keep this page (adds it to the document) or retake it */}
          {phase === "review" ? (
            <div className="shrink-0 flex items-center gap-3 px-6 pb-10 pt-4">
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 h-12 rounded-full bg-white/15 text-white text-[15px] font-semibold active:scale-95 transition-transform"
                style={FONT}
              >
                Retake
              </button>
              <button
                type="button"
                onClick={handleKeep}
                className="flex-1 h-12 rounded-full text-white text-[15px] font-semibold active:scale-95 transition-transform"
                style={{ ...FONT, background: BRAND }}
              >
                Keep Photo
              </button>
            </div>
          ) : (
            /* Shutter + photo-library import (same spot as iOS Camera's last-shot thumbnail) +
               Done once at least one page is kept — balanced 44px slots either side of the shutter. */
            <div className="shrink-0 flex items-center justify-between px-8 pb-10 pt-4">
              <div className="w-11 h-11 flex items-center justify-center">
                {phase === "frame" && (
                  <button
                    type="button"
                    aria-label="Upload from library"
                    onClick={handleImport}
                    className="w-11 h-11 rounded-lg bg-white/15 flex items-center justify-center text-white active:scale-95 transition-transform"
                  >
                    <Images size={20} strokeWidth={1.67} />
                  </button>
                )}
              </div>

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

              <div className="w-11 h-11 flex items-center justify-center">
                {phase === "frame" && pages > 0 && (
                  <button
                    type="button"
                    aria-label={`Done — use ${pages} page${pages === 1 ? "" : "s"}`}
                    onClick={handleDone}
                    className="relative w-11 h-11 rounded-full flex items-center justify-center text-white active:scale-95 transition-transform"
                    style={{ background: BRAND }}
                  >
                    <Check size={20} strokeWidth={2} />
                    <span
                      className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-white text-[10px] font-bold flex items-center justify-center"
                      style={{ ...FONT, color: BRAND }}
                    >
                      {pages}
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ScanDocument;
