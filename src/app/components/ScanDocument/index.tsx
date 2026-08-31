import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, Reorder } from "motion/react";
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

/** The demo invoice-page visual — same mock reused at filmstrip-thumbnail, viewfinder, and
 *  full-page-preview sizes (via `className`), so all three stay pixel-consistent. */
function DocMockCard({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-white rounded-md overflow-hidden flex flex-col gap-3 p-5 shadow-[0_0_40px_rgba(0,0,0,0.5)] ${className}`}>
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
  );
}

/** Small captured-page tile for a filmstrip — a miniature of the same document mock; tap to
 *  jump to that page full-screen. Order is implicit (left to right), no number badge needed.
 *  `active` rings the currently-open page (inside the full-screen preview's own filmstrip);
 *  `dimmed` shows one marked for removal without actually hiding it yet. `onToggleRemove`, when
 *  given, adds a ✕ badge (same UI as the library filmstrip's remove control) so a page can be
 *  marked/unmarked for removal right from the filmstrip, without opening it full-screen first. */
function PageThumb({
  index,
  onClick,
  active = false,
  dimmed = false,
  onToggleRemove,
}: {
  index: number;
  onClick: () => void;
  active?: boolean;
  dimmed?: boolean;
  onToggleRemove?: () => void;
}) {
  return (
    <div className="relative shrink-0 w-12 h-16">
      <button
        type="button"
        aria-label={`View page ${index + 1}`}
        onClick={onClick}
        className={`w-full h-full rounded-md bg-white overflow-hidden shadow-[0_2px_6px_rgba(0,0,0,0.35)] flex flex-col gap-1 p-1.5 active:scale-95 transition-transform ${
          dimmed ? "opacity-40" : ""
        }`}
        style={active ? { boxShadow: `0 0 0 2px ${BRAND}` } : undefined}
      >
        <div className="h-1 w-6 rounded-sm bg-[var(--bg-neutral-inverse-primary)]" />
        <div className="h-0.5 w-5 rounded-sm bg-[#e5e5e5]" />
        <div className="mt-auto flex flex-col gap-0.5">
          <div className="h-0.5 w-full rounded-sm bg-[#ececec]" />
          <div className="h-0.5 w-4/5 rounded-sm bg-[#ececec]" />
        </div>
      </button>
      {onToggleRemove && (
        <button
          type="button"
          aria-label={dimmed ? `Restore page ${index + 1}` : `Remove page ${index + 1}`}
          onClick={onToggleRemove}
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-black/70 flex items-center justify-center text-white"
        >
          <X size={10} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}

/**
 * Camera + document-scanner demo. In a published build the shutter opens the native
 * scanner (iOS VisionKit / Android ML Kit); here it plays a framing → scanning → review
 * sequence. The review step is a plain confirm of that one shot, not a screen you navigate
 * away from: Use Image adds it as a page, and the back chevron up top (not a ✕ — this doesn't
 * close anything) drops back to the live scanner to try again, same as the shutter tap never
 * happened; it never exits the whole scan. Once at least one page is confirmed, a text "Next
 * (N)" button (bottom-right, replacing the shutter row's usual spacer) finishes and hands back
 * every page as ONE invoice document via a single `onCapture(pageCount)` call — or the user can
 * keep shooting. Captured pages track a stable id each (not just a count), so the filmstrip
 * below the viewfinder can be dragged to reorder them (`Reorder.Group`/`Reorder.Item`); each
 * thumbnail's own ✕ removes that page immediately (no confirm — same directness as the shutter),
 * and tapping the image opens that page full-screen instead. That full-screen view (✕ top-left
 * closes it) can swipe left/right (or use its own filmstrip, no reordering there) to browse the
 * other pages — the page itself isn't tappable, only a "Select"/"Selected" + dot control up top
 * (same shape and wording as the library preview's, just applied to a page that starts out
 * already included) toggles kept/removed for whichever page is showing; nothing is actually
 * removed until the user closes the preview, which applies every page marked that way in one go.
 * The bottom-bar photo-library button opens a multi-select photo grid the same way, but split
 * into two tap targets per tile: the image opens that photo full-screen, while an always-visible
 * dot in the corner selects/deselects right there without leaving the grid. Once full-screen,
 * the image itself is swipe-only (left/right moves between photos) — select/deselect lives in
 * the same "Select"/"Selected" + dot header control, and a filmstrip of every currently-selected
 * photo appears at the bottom (tap one to jump to it, its own ✕ removes it) — no retake needed
 * for already-existing photos, and picking several at once adds them all as pages in one go.
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
  // Stable per-page ids (not just a count) so the filmstrip can be dragged to reorder and React
  // keeps track of the right thumbnail while that happens. Never reused within one open session.
  const [pageIds, setPageIds] = useState<number[]>([]);
  const nextPageIdRef = useRef(0);
  const newPageId = () => nextPageIdRef.current++;
  // Order selected, not just membership — so each tile can show its pick number (1, 2, 3…)
  // and deselecting one renumbers the rest instead of leaving a gap.
  const [selectedOrder, setSelectedOrder] = useState<number[]>([]);
  // Which library tile is open full-screen for detail — null = showing the grid.
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  // Which already-captured page (filmstrip) is open full-screen — null = not previewing one.
  const [pagePreviewIndex, setPagePreviewIndex] = useState<number | null>(null);
  // Pages marked for removal during this browsing session — toggling only updates what's shown
  // here (dimmed in the filmstrip, unchecked on that page); nothing is actually removed until
  // the user backs out, at which point every marked page is dropped in one go.
  const [removedPages, setRemovedPages] = useState<Set<number>>(new Set());

  // Reset to the live viewfinder, page count cleared, each time the camera opens.
  useEffect(() => {
    if (open) {
      setPhase("frame");
      setPageIds([]);
      nextPageIdRef.current = 0;
      setSelectedOrder([]);
      setPreviewIndex(null);
      setPagePreviewIndex(null);
      setRemovedPages(new Set());
    }
  }, [open]);

  // After the shutter, play the scan sweep, then land on the Retake / Use Image review step.
  useEffect(() => {
    if (phase !== "scanning") return;
    const t = setTimeout(() => setPhase("review"), 1400);
    return () => clearTimeout(t);
  }, [phase]);

  const handleDone = () => onCapture?.(pageIds.length);
  const handleRetake = () => setPhase("frame");
  const handleUseImage = () => {
    setPageIds((ids) => [...ids, newPageId()]);
    setPhase("frame");
  };
  // Removes a page straight away (no defer) — this is the base filmstrip, not a browsing
  // session with its own confirm/cancel, so the action is immediate like the shutter itself.
  const removePageDirect = (id: number) => setPageIds((ids) => ids.filter((pid) => pid !== id));
  const openLibrary = () => {
    setSelectedOrder([]);
    setPreviewIndex(null);
    setPhase("library");
  };
  const handleCancelLibrary = () => {
    setSelectedOrder([]);
    setPreviewIndex(null);
    setPhase("frame");
  };
  const toggleSelect = (i: number) =>
    setSelectedOrder((prev) => (prev.includes(i) ? prev.filter((n) => n !== i) : [...prev, i]));
  // Swipe (or the filmstrip below) moves between photos without leaving the full-screen preview.
  const goToPreviousPhoto = () => setPreviewIndex((i) => (i === null ? i : Math.max(0, i - 1)));
  const goToNextPhoto = () => setPreviewIndex((i) => (i === null ? i : Math.min(LIBRARY_TILE_COUNT - 1, i + 1)));
  const handleAddSelected = () => {
    setPageIds((ids) => [...ids, ...selectedOrder.map(() => newPageId())]);
    setSelectedOrder([]);
    setPreviewIndex(null);
    setPhase("frame");
  };
  const openPagePreview = (i: number) => {
    setRemovedPages(new Set());
    setPagePreviewIndex(i);
  };
  const togglePageRemoved = (i: number) =>
    setRemovedPages((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  // Swipe (or the filmstrip below) moves between pages without leaving the full-screen preview.
  const goToPreviousPage = () => setPagePreviewIndex((i) => (i === null ? i : Math.max(0, i - 1)));
  const goToNextPage = () => setPagePreviewIndex((i) => (i === null ? i : Math.min(pageIds.length - 1, i + 1)));
  // Only applies every marked removal when the user actually backs out — staying on the preview
  // after tapping a check lets them keep flipping choices before deciding.
  const handleBackFromPagePreview = () => {
    if (removedPages.size > 0) setPageIds((ids) => ids.filter((_, idx) => !removedPages.has(idx)));
    setPagePreviewIndex(null);
    setRemovedPages(new Set());
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

          {pagePreviewIndex !== null ? (
            <>
              {/* Full-screen captured-page detail — swipe left/right to browse; the page itself
                  isn't tappable, only the header "Select"/"Selected" control toggles kept/removed
                  for whichever page is showing. The ✕ (top-left) applies every marked removal. */}
              <div className="shrink-0 flex items-center justify-between px-4 py-3">
                <button
                  type="button"
                  aria-label="Close preview"
                  onClick={handleBackFromPagePreview}
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white"
                >
                  <X size={20} strokeWidth={1.67} />
                </button>
                <span className="text-[15px] font-bold text-white" style={FONT}>
                  Page {pagePreviewIndex + 1}
                </span>
                {(() => {
                  const isRemoved = removedPages.has(pagePreviewIndex);
                  return (
                    <button
                      type="button"
                      aria-label={isRemoved ? "Select page" : "Deselect page"}
                      onClick={() => togglePageRemoved(pagePreviewIndex)}
                      className="flex items-center gap-1.5 h-9 pl-3 pr-2 rounded-full bg-white/10 text-white text-[13px] font-semibold"
                      style={FONT}
                    >
                      {isRemoved ? "Select" : "Selected"}
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center"
                        style={{
                          background: isRemoved ? "transparent" : BRAND,
                          border: isRemoved ? "1.5px solid rgba(255,255,255,0.7)" : "none",
                        }}
                      >
                        {!isRemoved && <Check size={12} strokeWidth={2.5} color="#fff" />}
                      </span>
                    </button>
                  );
                })()}
              </div>
              <div className="flex-1 flex items-center justify-center px-8">
                <motion.div
                  key={pagePreviewIndex}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.5}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -60) goToNextPage();
                    else if (info.offset.x > 60) goToPreviousPage();
                  }}
                  className="relative w-full max-w-[280px] aspect-[3/4]"
                >
                  <DocMockCard className="absolute inset-0" />
                  {!removedPages.has(pagePreviewIndex) && (
                    <>
                      <span className="absolute inset-0 border-2 rounded-md" style={{ borderColor: BRAND }} aria-hidden />
                      <span
                        className="absolute top-3 right-3 min-w-[26px] h-[26px] px-1.5 rounded-full flex items-center justify-center text-[13px] font-bold text-white"
                        style={{ background: BRAND, ...FONT }}
                        aria-hidden
                      >
                        {pagePreviewIndex + 1}
                      </span>
                    </>
                  )}
                </motion.div>
              </div>

              {/* Every captured page, so the user can jump around while deciding what to keep —
                  the one marked for removal (this session) shows dimmed, not gone. */}
              {pageIds.length > 1 && (
                <div className="shrink-0 overflow-x-auto px-6 pb-3">
                  <div className="flex gap-2 w-max">
                    {pageIds.map((id, i) => (
                      <PageThumb
                        key={id}
                        index={i}
                        onClick={() => setPagePreviewIndex(i)}
                        active={i === pagePreviewIndex}
                        dimmed={removedPages.has(i)}
                        onToggleRemove={() => togglePageRemoved(i)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Top bar — back chevron (photo detail returns to the grid; library grid returns
                  to the camera; review step returns to the scanner) or ✕ (closes the whole scan)
                  + title + trailing control */}
              <div className="shrink-0 flex items-center justify-between px-4 py-3">
                <button
                  type="button"
                  aria-label={
                    phase === "library" && previewIndex !== null
                      ? "Back to photos"
                      : phase === "library"
                      ? "Back to camera"
                      : phase === "review"
                      ? "Back to scanner"
                      : "Close"
                  }
                  onClick={
                    phase === "library" && previewIndex !== null
                      ? () => setPreviewIndex(null)
                      : phase === "library"
                      ? handleCancelLibrary
                      : phase === "review"
                      ? handleRetake
                      : onClose
                  }
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
                    ? previewIndex !== null
                      ? `Photo ${previewIndex + 1}`
                      : selectedOrder.length > 0
                      ? `${selectedOrder.length} Selected`
                      : "Select Photos"
                    : phase === "review"
                    ? "Review page"
                    : pageIds.length > 0
                    ? `Page ${pageIds.length + 1}`
                    : "Scan invoice"}
                </span>
                {phase === "library" && previewIndex !== null ? (
                  (() => {
                    const pickNumber = selectedOrder.indexOf(previewIndex) + 1;
                    const isSelected = pickNumber > 0;
                    return (
                      <button
                        type="button"
                        aria-label={isSelected ? `Deselect photo ${previewIndex + 1}` : `Select photo ${previewIndex + 1}`}
                        onClick={() => toggleSelect(previewIndex)}
                        className="flex items-center gap-1.5 h-9 pl-3 pr-2 rounded-full bg-white/10 text-white text-[13px] font-semibold"
                        style={FONT}
                      >
                        {isSelected ? "Selected" : "Select"}
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                          style={{
                            background: isSelected ? BRAND : "transparent",
                            border: isSelected ? "none" : "1.5px solid rgba(255,255,255,0.7)",
                          }}
                        >
                          {isSelected ? pickNumber : ""}
                        </span>
                      </button>
                    );
                  })()
                ) : phase === "library" ? (
                  <span className="w-9 h-9" aria-hidden />
                ) : (
                  <span className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70" aria-hidden>
                    <Zap size={19} strokeWidth={1.67} />
                  </span>
                )}
              </div>

              {phase === "library" && previewIndex !== null ? (
                /* Full-screen photo detail — swipe left/right to browse; select/deselect only
                   via the header "Select" control (tapping the image itself just swipes). */
                <div className="flex-1 flex items-center justify-center px-8">
                  <motion.div
                    key={previewIndex}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.5}
                    onDragEnd={(_, info) => {
                      if (info.offset.x < -60) goToNextPhoto();
                      else if (info.offset.x > 60) goToPreviousPhoto();
                    }}
                    className="relative w-full max-w-[280px] aspect-square rounded-lg overflow-hidden bg-white/10 flex items-center justify-center"
                  >
                    <ImageIcon size={64} strokeWidth={1} className="text-white/30" />
                    {selectedOrder.includes(previewIndex) && (
                      <>
                        <span className="absolute inset-0 border-2 rounded-lg" style={{ borderColor: BRAND }} aria-hidden />
                        <span
                          className="absolute top-3 right-3 min-w-[26px] h-[26px] px-1.5 rounded-full flex items-center justify-center text-[13px] font-bold text-white"
                          style={{ background: BRAND, ...FONT }}
                          aria-hidden
                        >
                          {selectedOrder.indexOf(previewIndex) + 1}
                        </span>
                      </>
                    )}
                  </motion.div>
                </div>
              ) : phase === "library" ? (
                /* Multi-select photo grid — tap the image to preview it full-screen; tap the dot
                   to select/deselect right here without leaving the grid. */
                <div className="flex-1 overflow-y-auto px-4 py-4">
                  <div className="grid grid-cols-4 gap-2">
                    {Array.from({ length: LIBRARY_TILE_COUNT }).map((_, i) => {
                      const pickNumber = selectedOrder.indexOf(i) + 1;
                      const isSelected = pickNumber > 0;
                      return (
                        <div key={i} className="relative aspect-square rounded-md overflow-hidden bg-white/10">
                          <button
                            type="button"
                            aria-label={`Photo ${i + 1}${isSelected ? `, selected (${pickNumber})` : ""}`}
                            onClick={() => setPreviewIndex(i)}
                            className="absolute inset-0 flex items-center justify-center active:scale-95 transition-transform"
                          >
                            <ImageIcon size={22} strokeWidth={1.5} className="text-white/40" />
                            {isSelected && (
                              <>
                                <span className="absolute inset-0 bg-black/30" aria-hidden />
                                <span className="absolute inset-0 border-2 rounded-md" style={{ borderColor: BRAND }} aria-hidden />
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            aria-label={isSelected ? `Deselect photo ${i + 1}` : `Select photo ${i + 1}`}
                            onClick={() => toggleSelect(i)}
                            className="absolute top-1 right-1 min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                            style={{
                              background: isSelected ? BRAND : "rgba(0,0,0,0.35)",
                              border: isSelected ? "none" : "1.5px solid rgba(255,255,255,0.7)",
                              ...FONT,
                            }}
                          >
                            {isSelected ? pickNumber : ""}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Viewfinder */
                <div className="flex-1 flex flex-col items-center justify-center px-8">
                  <div className="relative w-full max-w-[280px] aspect-[3/4]">
                    <DocMockCard className="absolute inset-2" />

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
                    {phase === "scanning"
                      ? "Scanning…"
                      : phase === "review"
                      ? "Use this image, or go back to retake it"
                      : pageIds.length > 0
                      ? "Add another page, or tap Next to finish"
                      : "Position the invoice within the frame"}
                  </p>
                </div>
              )}

              {/* Captured-page filmstrip — scrolls horizontally once it overflows the frame.
                  Hidden on the review step so the one shot being confirmed isn't competing for
                  attention with earlier pages. Tap a thumbnail to view that page full-screen, its
                  own ✕ removes it immediately, and the strip can be dragged to reorder pages. */}
              {(phase === "frame" || phase === "scanning") && pageIds.length > 0 && (
                <div className="shrink-0 overflow-x-auto px-6 pb-3">
                  <Reorder.Group
                    as="div"
                    axis="x"
                    values={pageIds}
                    onReorder={setPageIds}
                    className="flex gap-2 w-max"
                  >
                    {pageIds.map((id, i) => (
                      <Reorder.Item key={id} value={id} as="div" className="shrink-0">
                        <PageThumb
                          index={i}
                          onClick={() => openPagePreview(i)}
                          onToggleRemove={() => removePageDirect(id)}
                        />
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                </div>
              )}

              {/* Selected-photos filmstrip — only on the full-screen photo preview, so the user
                  can see everything picked so far while browsing. Tap a thumbnail to jump to
                  that photo; the ✕ removes it from the selection without opening it. */}
              {phase === "library" && previewIndex !== null && selectedOrder.length > 0 && (
                <div className="shrink-0 overflow-x-auto px-6 pb-3">
                  <div className="flex gap-2 w-max">
                    {selectedOrder.map((idx) => (
                      <div key={idx} className="relative shrink-0 w-12 h-12 rounded-md overflow-hidden bg-white/10">
                        <button
                          type="button"
                          aria-label={`View photo ${idx + 1}`}
                          onClick={() => setPreviewIndex(idx)}
                          className="absolute inset-0 flex items-center justify-center active:scale-95 transition-transform"
                          style={idx === previewIndex ? { boxShadow: `inset 0 0 0 2px ${BRAND}` } : undefined}
                        >
                          <ImageIcon size={16} strokeWidth={1.5} className="text-white/40" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Remove photo ${idx + 1} from selection`}
                          onClick={() => toggleSelect(idx)}
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-black/70 flex items-center justify-center text-white"
                        >
                          <X size={10} strokeWidth={2.5} />
                        </button>
                      </div>
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
                    disabled={selectedOrder.length === 0}
                    className="w-full h-12 rounded-full text-white text-[15px] font-semibold active:scale-95 transition-transform disabled:opacity-40"
                    style={{ ...FONT, background: BRAND }}
                  >
                    {selectedOrder.length > 0 ? `Add ${selectedOrder.length} Photo${selectedOrder.length === 1 ? "" : "s"}` : "Select Photos"}
                  </button>
                </div>
              ) : phase === "review" ? (
                /* Review step — Retake tries the shot again, Use Image adds it as a page. The
                   back chevron up top does the same thing as Retake, just from the header. */
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
                    onClick={handleUseImage}
                    className="flex-1 h-12 rounded-full text-white text-[15px] font-semibold active:scale-95 transition-transform"
                    style={{ ...FONT, background: BRAND }}
                  >
                    Use Image
                  </button>
                </div>
              ) : (
                /* Shutter + photo-library import (same spot as iOS Camera's last-shot
                   thumbnail) + Next once at least one page is shot. */
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

                  <div className="flex items-center justify-center min-w-[44px]">
                    {phase === "frame" && pageIds.length > 0 && (
                      <button
                        type="button"
                        onClick={handleDone}
                        className="h-9 px-4 rounded-full text-white text-[14px] font-semibold whitespace-nowrap active:scale-95 transition-transform"
                        style={{ ...FONT, background: BRAND }}
                      >
                        Next ({pageIds.length})
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ScanDocument;
