import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Overlay } from "../../ui/Overlay";
import { BottomsheetsEnd } from "../BottomsheetsEnd";
import styles from "./index.module.css";

const sheet = {
  closed: {
    y: "100%",
    transition: { type: "tween" as const, duration: 0.4, ease: [0.4, 0, 0.6, 1] as const },
  },
  open: {
    y: 0,
    transition: { type: "spring" as const, stiffness: 340, damping: 34 },
  },
};

const list = {
  closed: {},
  open: { transition: { staggerChildren: 0.05, delayChildren: 0.18 } },
};

/** Per-field "fade + rise" — wrap each child you want staggered in `<motion.div variants={sheetItem}>`. */
export const sheetItem = {
  closed: { opacity: 0, y: 14 },
  open: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

/** Variant pair for a step-swap slide transition — the sub-level pattern where a deeper "level"
 *  (e.g. a picker opened from within a sheet) swaps the SAME BottomSheet's title/content instead
 *  of stacking a second sheet on top (see memory: sub-level-drawer-same-sheet). `direction: 1`
 *  slides in from the right (a "forward" sub-level), `-1` from the left (the "back"/default level).
 *
 *  Two ways to drive a step wrapper's motion.div, pick by what it contains:
 *  - Content has NO nested `variants={sheetItem}` children (e.g. Sales Invoice List's
 *    Filters→Customer search step, a plain form, a Calendar): use plain object-literal
 *    `initial={{x, opacity:0}} animate={{x:0, opacity:1}} exit={{x, opacity:0}}
 *    transition={{duration:0.2, ease:"easeInOut"}}` directly — simplest, no propagation to worry
 *    about. This is the default/preferred shape for any "next level or search" interaction.
 *  - Content is a SHARED component with its OWN nested `sheetItem`-tagged rows (e.g.
 *    ReceivingAccountRows, CountryCodeRows): you MUST use this `stepSlide()` helper with STRING
 *    variant labels (`variants={stepSlide(direction)} initial="closed" animate="open"
 *    exit="closed"`), never object-literal targets on that wrapper — an object-literal `animate`
 *    breaks Framer's variant-label propagation, so the nested `sheetItem` rows silently stay at
 *    `opacity: 0` FOREVER (confirmed via computed style — they're in the DOM, just invisible, not
 *    just slow to fade in). Mixing the two per step (e.g. RecordPaymentSheet's account step uses
 *    this form, its form/date steps use the plain object-literal form) is correct and expected. */
export function stepSlide(direction: 1 | -1) {
  return {
    closed: { x: 24 * direction, opacity: 0 },
    open: { x: 0, opacity: 1, transition: { duration: 0.2, ease: "easeInOut" as const } },
  };
}

interface BottomSheetProps {
  open: boolean;
  title: string;
  onClose?: () => void;
  children: React.ReactNode;
  /** Pinned footer (e.g. a ButtonDock) rendered below the scrollable content. */
  footer?: React.ReactNode;
  /** Reserve a taller minimum height (e.g. to match the Add Services sheet). */
  tall?: boolean;
  /** Pin to a fixed height (Tailwind class, e.g. "h-[68%]") so sibling sheets match exactly. */
  heightClass?: string;
  /** Almost-full-page drawer (e.g. a Filters/Customer-search sheet) — fixed 92% height, leaving
   *  just enough room below the phone frame's status bar. Overrides `tall`/`heightClass`. */
  fullPage?: boolean;
  /** 20px icon for the header's frosted 36px action button. */
  action?: React.ReactNode;
  onAction?: () => void;
  actionLabel?: string;
  /** Frosted back-chevron button before the title (e.g. a nested sheet returning to its parent sheet). */
  onBack?: () => void;
  backLabel?: string;
  /** Center the title (same card-title-md size as the default left-aligned title — only the alignment differs). */
  centerTitle?: boolean;
  /** Fires when the scrollable content scrolls (e.g. to collapse an inline search). */
  onContentScroll?: React.UIEventHandler<HTMLDivElement>;
  /** Tighter vertical padding around the content — for short confirm sheets. */
  compact?: boolean;
  /** Search-mode header (Figma node 1333-38370): replaces the title text with a frosted search
   *  pill (back button stays) — for a "next level" search step pushed in place of a sheet's
   *  normal content, e.g. a Filters sheet's Customer search. Passing this ignores `title`/`centerTitle`. */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  autoFocusSearch?: boolean;
  /** Extra content pinned inside the SAME sticky header as the title/search row (e.g. a row of
   *  selected-item chips) — not a second independent sticky element. Two siblings both sticky at
   *  top:0 within the same scroll container fight over the same position once both are "stuck"
   *  (whichever has the higher z-index wins the overlap), so anything that must stay pinned right
   *  under the title/search row belongs here, inheriting this header's own frost/background once
   *  instead of needing its own copy. */
  headerExtra?: React.ReactNode;
  /** True while the footer's on-screen keyboard mock is showing (caller's own `keyboardOpen` state,
   *  same one passed to its ButtonDock's `keyboard` prop) — disables the footer-overlap behavior
   *  below so the panel grows to use available empty space instead of just covering more of a
   *  fixed-size scroll area with a taller footer. Still capped by .panel's own max-height (88%);
   *  content scrolls normally if it genuinely doesn't fit even then. */
  keyboardOpen?: boolean;
  /** Floor the auto-sized panel at this many px (e.g. a sub-level-swap sheet's own first-level
   *  step, measured by the caller) so a shorter sub-level step (fewer rows, a smaller picker)
   *  doesn't shrink the sheet back down — it still grows taller than this when a step needs more
   *  room, capped as usual at the panel's own 88% max-height. Ignored when `heightClass`/`fullPage`
   *  already pin an exact height (those already don't shrink either). */
  minHeightPx?: number;
  /** Ref to the outer panel div (header + scrollable content + footer) — for a caller that needs
   *  to measure the sheet's own total rendered height (e.g. to drive `minHeightPx` on a sibling
   *  render), since that height isn't just the content it passed in via `children`. */
  panelRef?: React.Ref<HTMLDivElement>;
}

/**
 * Modal bottom sheet shell — shared open/close motion for all pickers.
 * The parent screen handles the "book-page" recede of the page behind.
 * See memory: bottom-sheet-animation.
 */
export function BottomSheet({ open, title, onClose, children, footer, tall, heightClass, fullPage, action, onAction, actionLabel = "Action", onBack, backLabel = "Back", centerTitle, onContentScroll, compact, searchValue, onSearchChange, searchPlaceholder, autoFocusSearch, headerExtra, keyboardOpen = false, minHeightPx, panelRef }: BottomSheetProps) {
  const isSearch = onSearchChange !== undefined;
  // Drives the header's frost — same transparent-at-rest/frosted-on-scroll
  // recipe as components/PageAppHeader, but tracked internally so every sheet
  // gets it for free (no per-screen `scrolled` plumbing needed).
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    if (!open) setScrolled(false);
  }, [open]);

  // The footer (components/BottomsheetsEnd) normally sits in flow below the scroll area (never
  // covers content, but its frost/blur has nothing behind it to actually frost — see memory:
  // bottom-sheet-header-footer-frost). Only when content already needs to scroll without the
  // footer do we switch it to overlap the scroll area instead (same "frost over scrolled content"
  // mechanism as a page's sticky ButtonDock), reserving exactly the footer's own height so nothing
  // is hidden. Re-measured on `open` and on the footer going from absent to present (e.g. a filters
  // sheet whose footer only renders once a filter is picked) — not on every render, so the decision
  // can't oscillate against its own effect.
  const scrollRef = useRef<HTMLDivElement>(null);

  // A "sub-level" swap (e.g. AddServicesSheet's form→unit step, SalesInvoiceList's Filters→search
  // step — see memory: sub-level-drawer-same-sheet) reuses this SAME scroll element instead of
  // mounting a fresh one, so it never gets a natural scrollTop reset the way a brand-new `open`
  // does. Title/search-mode/back-button identity change together whenever the visible step does,
  // so that combination doubles as a step signature — scroll back to top whenever it changes.
  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, title, isSearch, Boolean(onBack)]);

  const footerRef = useRef<HTMLDivElement>(null);
  const [footerOverlap, setFooterOverlap] = useState(false);
  const [footerHeight, setFooterHeight] = useState(0);
  useLayoutEffect(() => {
    if (!open || !footer) {
      setFooterOverlap(false);
      return;
    }
    const scrollEl = scrollRef.current;
    const footerEl = footerRef.current;
    if (!scrollEl || !footerEl) return;
    setFooterHeight(footerEl.offsetHeight);
    setFooterOverlap(scrollEl.scrollHeight > scrollEl.clientHeight + 1);
    // Re-measure whenever the footer goes from absent to present (e.g. a filters sheet whose
    // footer only appears once a filter is picked) — otherwise it's stuck in the non-overlap,
    // opaque layout forever since the footer didn't exist yet at the initial `open` measurement.
    // Doesn't re-run on the footer's own content changing (still just `open`+presence in the deps),
    // so it can't oscillate against itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, Boolean(footer)]);

  // While the keyboard mock is showing, force the footer back in-flow instead of overlapping —
  // lets the panel grow into whatever empty space is available (still capped by .panel's own
  // max-height) rather than wasting it while the taller footer just covers more of a frozen-size
  // scroll area. See BottomSheetProps.keyboardOpen.
  const effectiveOverlap = footerOverlap && !keyboardOpen;

  // A fixed heightClass (e.g. "h-[68%]", used so sibling sheets match exactly) sets an explicit
  // `height`, not just a cap — so a taller keyboard-mock footer had nowhere to grow into even with
  // the overlap fix above, leaving dead empty space above the panel. While the keyboard mock is
  // showing, drop the pin and fall back to the default auto-sized panel (still capped by .panel's
  // own 88% max-height) so it can grow up to use that space. Doesn't apply to `fullPage`, which is
  // already pinned near the very top of the frame with no meaningful room left to grow into.
  const effectiveHeightClass = keyboardOpen ? undefined : heightClass;

  return (
    <AnimatePresence>
      {open && (
        <motion.div className={styles.overlay} initial="closed" animate="open" exit="closed">
          {/* Scrim — the receded page (layer behind) shows through */}
          <Overlay onClick={onClose} />

          {/* Sliding sheet — sized to its content, capped so long content scrolls */}
          <motion.div
            className={[
              styles.panel,
              fullPage ? styles.panelFull : effectiveHeightClass || "",
              !fullPage && !effectiveHeightClass && tall ? styles.panelTall : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={!fullPage && !effectiveHeightClass && minHeightPx ? { minHeight: minHeightPx } : undefined}
            variants={sheet}
            ref={panelRef}
          >
            {/* Scrollable area — the grabber+title header sticks to its top (frosting
                as content scrolls beneath it), everything else scrolls normally. */}
            <div
              ref={scrollRef}
              className={["thin-scrollbar", styles.scrollArea].join(" ")}
              style={effectiveOverlap ? { paddingBottom: footerHeight } : undefined}
              onScroll={(e) => {
                setScrolled(e.currentTarget.scrollTop > 4);
                onContentScroll?.(e);
              }}
            >
              {/* Bottomsheets header (Figma "[APP] Design System" → Bottomsheets, node 4038-2684):
                  grabber + 28px/22px title + optional frosted action button. No ✕ — sheets dismiss
                  via the scrim or a footer button. */}
              <div className={[styles.dsHeader, scrolled ? styles.scrolled : ""].join(" ")}>
                <div className={styles.frost} aria-hidden />
                <div className={styles.grabberRow}>
                  <span className={styles.grabber} />
                </div>
                {/* Titleless menu sheets (e.g. the ⋯ actions menu) show just the grabber — the 60px
                    title row is collapsed to a small gap when there's no title / back / action. */}
                {!title && !onBack && !action && !isSearch ? (
                  <div className={styles.titlelessGap} />
                ) : (
                <div className={styles.titleRow}>
                  {/* Crossfade the plain title <-> search pill (same recipe as CreateSalesInvoice's
                      page-level search header) instead of an instant swap — back/action buttons
                      cross-fade together with it since they change meaning/presence at the same time. */}
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={isSearch ? "search" : "title"}
                      className={styles.titleRowFade}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18 }}
                    >
                      {onBack && (
                        <button
                          type="button"
                          className={styles.iconButton}
                          onClick={onBack}
                          aria-label={backLabel}
                        >
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      )}
                      {isSearch ? (
                        <div className={styles.searchPill}>
                          <span className={styles.pillIcon}>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                              <path d="M17.5 17.5L13.875 13.875M15.833 9.167a6.667 6.667 0 1 1-13.333 0 6.667 6.667 0 0 1 13.333 0Z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                          <input
                            className={styles.pillInput}
                            type="text"
                            value={searchValue}
                            onChange={(e) => onSearchChange?.(e.target.value)}
                            placeholder={searchPlaceholder}
                            aria-label={searchPlaceholder ?? "Search"}
                            autoFocus={autoFocusSearch}
                          />
                          {searchValue && (
                            <button
                              type="button"
                              className={styles.pillClear}
                              aria-label="Clear search"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => onSearchChange?.("")}
                            >
                              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                                <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ) : (
                        <p className={centerTitle ? styles.dsTitleCentered : styles.dsTitle}>
                          {title}
                        </p>
                      )}
                      {/* Invisible spacer balances the back button so a centered title stays optically centered. */}
                      {centerTitle && onBack && !action && !isSearch && <span className={styles.spacer} aria-hidden />}
                      {action && (
                        <button
                          type="button"
                          className={styles.iconButton}
                          onClick={onAction}
                          aria-label={actionLabel}
                        >
                          {action}
                        </button>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
                )}
                {headerExtra && <div className={styles.headerExtra}>{headerExtra}</div>}
              </div>

              {/* Aligns to the DS 16px side padding (title row is px-4) and, per Figma's
                  Bottomsheets Content slot (node 4038-2685 / 2585), has no vertical padding by default. */}
              <div className={[styles.content, compact ? styles.contentCompact : ""].join(" ")}>
                <motion.div variants={list}>{children}</motion.div>
              </div>
            </div>

            <BottomsheetsEnd ref={footerRef} overlap={effectiveOverlap} skipSpacer={compact}>
              {footer}
            </BottomsheetsEnd>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default BottomSheet;
