import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Zap, Images, Check, ChevronLeft, Image as ImageIcon } from "lucide-react";
import StatusBar from "../StatusBar";

import { FONT } from "../../lib/theme";
const BRAND = "#FF4A15";
/** Demo photo-library grid — a fixed count of placeholder tiles, no real photo backend. */
const LIBRARY_TILE_COUNT = 12;

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

/** Small captured-page preview tile for the filmstrip below the viewfinder — a miniature of
 *  the same document mock, numbered so order is legible even once it scrolls off-screen. */
function PageThumb({ index }: { index: number }) {
  return (
    <div
      className="relative shrink-0 w-12 h-16 rounded-md bg-white overflow-hidden shadow-[0_2px_6px_rgba(0,0,0,0.35)] flex flex-col gap-1 p-1.5"
      aria-hidden
    >
      <div className="h-1 w-6 rounded-sm bg-[var(--bg-neutral-inverse-primary)]" />
      <div className="h-0.5 w-5 rounded-sm bg-[#e5e5e5]" />
      <div className="mt-auto flex flex-col gap-0.5">
        <div className="h-0.5 w-full rounded-sm bg-[#ececec]" />
        <div className="h-0.5 w-4/5 rounded-sm bg-[#ececec]" />
      </div>
      <span
        className="absolute -top-1 -left-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
        style={{ background: BRAND, ...FONT }}
      >
        {index + 1}
      </span>
    </div>
  );
}

/**
 * Camera + document-scanner demo. In a published build the shutter opens the native
 * scanner (iOS VisionKit / Android ML Kit); here it plays a framing → scanning → review
 * sequence. The review step is a plain confirm of that one shot, not a screen you navigate
 * away from: Use Image adds it as a page, and the back chevron up top (not a ✕ — this doesn't
 * close anything) drops back to the live scanner to try again, same as the shutter tap never
 * happened; it never exits the whole scan. Once at least one page is confirmed, the user can
 * shoot another page (multi-page invoice) or tap Done to finish — all pages become ONE invoice
 * document, handed back via a single `onCapture(pageCount)` call. The bottom-bar photo-library
 * button opens a multi-select photo grid (no retake needed for already-existing photos) — same
 * spot as iOS Camera's last-shot thumbnail, so upload isn't camera-only; picking several at
 * once adds them all as pages in one go.
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
  const [phase, setPhase] = useState<"frame" | "scanning" | "review" | "library">("frame");
  const [pages, setPages] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // Reset to the live viewfinder, page count cleared, each time the camera opens.
  useEffect(() => {
    if (open) {
      setPhase("frame");
      setPages(0);
      setSelected(new Set());
    }
  }, [open]);

  // After the shutter, play the scan sweep, then land on the Retake / Use Image review step.
  useEffect(() => {
    if (phase !== "scanning") return;
    const t = setTimeout(() => setPhase("review"), 1400);
    return () => clearTimeout(t);
  }, [phase]);

  const handleDone = () => onCapture?.(pages);
  const handleRetake = () => setPhase("frame");
  const handleUseImage = () => {
    setPages((p) => p + 1);
    setPhase("frame");
  };
  const openLibrary = () => {
    setSelected(new Set());
    setPhase("library");
  };
  const handleCancelLibrary = () => {
    setSelected(new Set());
    setPhase("frame");
  };
  const toggleSelect = (i: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  const handleAddSelected = () => {
    setPages((p) => p + selected.size);
    setSelected(new Set());
    setPhase("frame");
  };

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

          {/* Top bar — back chevron (review step returns to the scanner; library grid returns
              to the camera) or ✕ (closes the whole scan) + title + trailing control */}
          <div className="shrink-0 flex items-center justify-between px-4 py-3">
            <button
              type="button"
              aria-label={phase === "library" ? "Back to camera" : phase === "review" ? "Back to scanner" : "Close"}
              onClick={phase === "library" ? handleCancelLibrary : phase === "review" ? handleRetake : onClose}
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white"
            >
              {phase === "library" || phase === "review" ? (
                <ChevronLeft size={20} strokeWidth={1.67} />
              ) : (
                <X size={20} strokeWidth={1.67} />
              )}
            </button>
            <span className="text-[15px] font-bold text-white" style={FONT}>
              {phase === "library"
                ? selected.size > 0
                  ? `${selected.size} Selected`
                  : "Select Photos"
                : phase === "review"
                ? "Review page"
                : pages > 0
                ? `Page ${pages + 1}`
                : "Scan invoice"}
            </span>
            {phase === "library" ? (
              <span className="w-9 h-9" aria-hidden />
            ) : (
              <span className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70" aria-hidden>
                <Zap size={19} strokeWidth={1.67} />
              </span>
            )}
          </div>

          {phase === "library" ? (
            /* Multi-select photo grid — tap several, then Add them all as pages in one go. */
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: LIBRARY_TILE_COUNT }).map((_, i) => {
                  const isSelected = selected.has(i);
                  return (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Photo ${i + 1}${isSelected ? ", selected" : ""}`}
                      onClick={() => toggleSelect(i)}
                      className="relative aspect-square rounded-md overflow-hidden bg-white/10 flex items-center justify-center active:scale-95 transition-transform"
                    >
                      <ImageIcon size={22} strokeWidth={1.5} className="text-white/40" />
                      {isSelected && (
                        <>
                          <span className="absolute inset-0 bg-black/30" aria-hidden />
                          <span className="absolute inset-0 border-2 rounded-md" style={{ borderColor: BRAND }} aria-hidden />
                          <span
                            className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: BRAND }}
                            aria-hidden
                          >
                            <Check size={12} strokeWidth={2.5} color="#fff" />
                          </span>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Viewfinder */
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
                  ? "Use this image, or go back to retake it"
                  : pages > 0
                  ? "Add another page, or tap Done to finish"
                  : "Position the invoice within the frame"}
              </p>
            </div>
          )}

          {/* Captured-page filmstrip — scrolls horizontally once it overflows the frame. */}
          {phase !== "library" && pages > 0 && (
            <div className="shrink-0 overflow-x-auto px-6 pb-3">
              <div className="flex gap-2 w-max">
                {Array.from({ length: pages }).map((_, i) => (
                  <PageThumb key={i} index={i} />
                ))}
              </div>
            </div>
          )}

          {phase === "library" ? (
            /* Add every selected photo as a page in one go — no per-photo retake, they're
               already-existing files. */
            <div className="shrink-0 px-6 pb-10 pt-4">
              <button
                type="button"
                onClick={handleAddSelected}
                disabled={selected.size === 0}
                className="w-full h-12 rounded-full text-white text-[15px] font-semibold active:scale-95 transition-transform disabled:opacity-40"
                style={{ ...FONT, background: BRAND }}
              >
                {selected.size > 0 ? `Add ${selected.size} Photo${selected.size === 1 ? "" : "s"}` : "Select Photos"}
              </button>
            </div>
          ) : phase === "review" ? (
            /* Review step — a plain confirm of this one shot. The back chevron up top returns
               to the live scanner; this is the only other action, adding it as a page. */
            <div className="shrink-0 px-6 pb-10 pt-4">
              <button
                type="button"
                onClick={handleUseImage}
                className="w-full h-12 rounded-full text-white text-[15px] font-semibold active:scale-95 transition-transform"
                style={{ ...FONT, background: BRAND }}
              >
                Use Image
              </button>
            </div>
          ) : (
            /* Shutter + photo-library import (same spot as iOS Camera's last-shot thumbnail) +
               Done once at least one page is shot — balanced 44px slots either side of the shutter. */
            <div className="shrink-0 flex items-center justify-between px-8 pb-10 pt-4">
              <div className="w-11 h-11 flex items-center justify-center">
                {phase === "frame" && (
                  <button
                    type="button"
                    aria-label="Choose from library"
                    onClick={openLibrary}
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
