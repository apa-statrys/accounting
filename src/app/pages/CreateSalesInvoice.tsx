import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { UserPlus, Search as SearchIcon, ChevronRight } from "lucide-react";
import { PageAppHeader } from "../components/PageAppHeader";
import { PageHeader } from "../ui/PageHeader";
import { Search } from "../ui/Search";
import { Tile } from "../ui/Tile";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { ButtonDock } from "../components/ButtonDock";
import { CUSTOMERS } from "../data/customers";
import { avatarTint } from "../lib/theme";
import { pinNew } from "../lib/pinNew";
import type { Customer, NewFlag } from "../types";

/**
 * Quick-access shortcuts to the most-billed customers. These are NOT a separate
 * customer database — just the top of the same list pulled up for convenience.
 */
const FREQUENT_IDS = ["marlow", "bright", "otto", "northwind", "lumen"];

/** Two-letter initials from a customer name (skips symbols like "&"). */
function initials(name: string): string {
  const words = name.split(/\s+/).filter((w) => /[a-z0-9]/i.test(w[0] ?? ""));
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase();
}

interface CreateSalesInvoiceProps {
  /** Currently selected customer id — keeps the tile highlighted on return. */
  selectedId?: string;
  /** The shared client register (owned by App) — single source of truth across the app. */
  customers?: Customer[];
  onClose?: () => void;
  /** Fired when a customer is chosen — advances to the next step. */
  onSelectCustomer?: (customer: Customer) => void;
  /** Open the full-page Add Customer flow (App navigates; returns here with the new one selected). */
  onAddCustomer?: () => void;
  /** The app-wide "just created" flag — pins a newly added customer to the top of "All customers"
   *  with a "New" badge for 5s (see lib/pinNew.ts). */
  newFlag?: NewFlag;
  /** Dev-only (QuickNav): force the no-"Frequently used" state — the page then reads identically
   *  to the plain Customer List (just this header's own "Select Customer" title). No real flow
   *  empties FREQUENT_IDS, so this is the only way to preview that state. */
  forceNoFrequent?: boolean;
}

/**
 * Create Sales Invoice — step 1: "Add a customer".
 * Choosing a customer advances the flow.
 */
export function CreateSalesInvoice({ selectedId = "", customers = CUSTOMERS, onClose, onSelectCustomer, onAddCustomer, newFlag, forceNoFrequent }: CreateSalesInvoiceProps) {
  const [query, setQuery] = useState("");
  // Selecting a tile only highlights it; "Continue" advances the flow.
  const [pendingId, setPendingId] = useState<string>(selectedId);
  const [scrolled, setScrolled] = useState(false);
  // Search state (Figma node 1333-30416): activating search (tapping the inline field or the
  // header's revealed search action) replaces the whole header with a search pill and collapses
  // the body to a flat "Results N" list — no Frequently used / All customers split, no Add button.
  const [searching, setSearching] = useState(false);
  // Entering search always resets scroll to top (a fresh, usually much shorter flat list);
  // exiting just restores the sectioned view as-is, no forced scroll.
  const scrollRef = useRef<HTMLDivElement>(null);
  const startSearch = () => {
    setSearching(true);
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };
  const exitSearch = () => { setSearching(false); setQuery(""); };

  // Scroll-driven header: once the Add/Search row has scrolled under the (now static, always-
  // centered) header, its right side reveals the same two actions as a frosted pill.
  const headerRef = useRef<HTMLDivElement>(null);
  const actionsRowRef = useRef<HTMLDivElement>(null);
  const [showHeaderActions, setShowHeaderActions] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const top = e.currentTarget.scrollTop;
    setScrolled(top > 4);

    const headerBottom = headerRef.current?.getBoundingClientRect().bottom ?? 0;
    // PageAppHeader's frost eases from fully opaque to transparent across the compact PageHeader
    // row itself (ui/PageHeader's DS-fixed 48px row) — content sitting right at headerBottom is
    // still legible through the fading edge. Compare against the row's TOP (headerBottom minus
    // that fixed 48px), i.e. fully past the fade.
    const opaqueBoundary = headerBottom - 48;
    setShowHeaderActions(
      actionsRowRef.current ? actionsRowRef.current.getBoundingClientRect().bottom <= opaqueBoundary : false
    );
  };

  const filtered = useMemo(
    () =>
      customers.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.email.toLowerCase().includes(query.toLowerCase())
      ),
    [customers, query]
  );

  // Frequently used = the most-billed customers pulled to the top as shortcuts;
  // Others = everyone else, newest-created first (customers has no timestamp field, but new ones
  // are always appended to the end of the register, so reversing is exactly "newest first").
  // A just-created customer pins to the top of "All customers" specifically — "Frequently used"
  // is a distinct, curated by-billing shortcut list, not the general list a new customer joins.
  const frequent = forceNoFrequent ? [] : filtered.filter((c) => FREQUENT_IDS.includes(c.id));
  const others = forceNoFrequent
    ? pinNew([...filtered].reverse(), newFlag, "customer", (c) => c.id)
    : pinNew([...filtered].reverse().filter((c) => !FREQUENT_IDS.includes(c.id)), newFlag, "customer", (c) => c.id);
  // No "Frequently used" shortcuts (curated list emptied, e.g. every top-billed customer was
  // deleted) — the page then reads identically to the plain Customer List: static header with
  // always-visible Add + Search icons (no scroll-driven reveal), no "All customers" heading, no
  // inline Add button/search field, just the flat tile list.
  const hasFrequent = frequent.length > 0;

  // DS Tile avatar row (Figma Select Customer): initials avatar + name/email, brand
  // border + check when selected; borderless white card on the beige page.
  const renderTile = (c: Customer) => (
    <Tile
      key={c.id}
      size="md"
      avatar={initials(c.name)}
      avatarColor={avatarTint(c.id)}
      title={c.name}
      titleBadge={newFlag?.kind === "customer" && newFlag.id === c.id ? <Badge label="New" color="custom" variant="bold" size="sm" /> : undefined}
      text={c.email}
      onLayer="gray"
      selected={pendingId === c.id}
      trailing={pendingId === c.id ? "check" : "none"}
      onClick={() => setPendingId(c.id)}
    />
  );

  const SECTION_HEADING = "card-title-md text-[var(--text-primary)]";

  // Add a new customer on a full page (App handles it, then returns here with the new one selected).
  const openAdd = () => onAddCustomer?.();

  return (
    <div
      className="relative bg-[var(--bg-neutral-tertiary)] rounded-[48px] overflow-hidden shadow-2xl flex flex-col"
      style={{ width: 375, height: 812 }}
    >
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto thin-scrollbar"
        onScroll={handleScroll}
      >
        <PageAppHeader ref={headerRef} scrolled={scrolled}>
          <AnimatePresence mode="wait" initial={false}>
            {searching ? (
              // Search state (Figma node 1333-30416): the header morphs into a back button +
              // frosted search pill, replacing the title entirely. Crossfades in/out (rather than
              // an instant swap) alongside the smooth scroll-to-top triggered by startSearch.
              <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                <PageHeader
                  type="search"
                  searchValue={query}
                  onSearchChange={setQuery}
                  searchPlaceholder="Search"
                  showAction={false}
                  autoFocusSearch
                  onBack={exitSearch}
                />
              </motion.div>
            ) : hasFrequent ? (
              /* DS PageHeader — centered title, stays centered while scrolling (no scroll-driven
                 section subtitle anymore); the right side still reveals the Add/Search pill once
                 the actions row has scrolled underneath. */
              <motion.div key="default" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                <PageHeader
                  type="center"
                  title="Select Customer"
                  onBack={onClose}
                  showSearch={false}
                  // Crossfade the pill against a 36px invisible spacer (matching PageHeader's own
                  // spacer, since `right` bypasses its built-in one) — this keeps the at-rest header
                  // optically centered (symmetric with the 36px back button) while animating BOTH the
                  // pill's appear and its disappear the same way (AnimatePresence's exit runs on
                  // disappear too, instead of the instant unmount a plain conditional gives).
                  right={
                    <AnimatePresence mode="wait" initial={false}>
                      {showHeaderActions ? (
                        <motion.div
                          key="pill"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center gap-4 h-9 px-3 shrink-0 rounded-full"
                          style={{ background: "var(--alpha-white-40)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", boxShadow: "var(--shadow-md)" } as React.CSSProperties}
                        >
                          <button type="button" aria-label="Add customer" onClick={openAdd} className="flex items-center justify-center text-[var(--text-primary)]">
                            <UserPlus size={20} strokeWidth={1} />
                          </button>
                          {customers.length >= 5 && (
                            <button type="button" aria-label="Search customers" onClick={startSearch} className="flex items-center justify-center text-[var(--text-primary)]">
                              <SearchIcon size={20} strokeWidth={1} />
                            </button>
                          )}
                        </motion.div>
                      ) : (
                        <span key="spacer" className="block shrink-0" style={{ width: 36, height: 36 }} aria-hidden />
                      )}
                    </AnimatePresence>
                  }
                />
              </motion.div>
            ) : (
              /* No "Frequently used" shortcuts — static header, same as Customer List: title
                 stays centered, Add + Search sit as a plain always-visible icon pair on the right
                 (no scroll-driven pill reveal, since there's no Add/Search row lower on the page
                 to hand off from). */
              <motion.div key="default-flat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                <PageHeader
                  type="center"
                  title="Select Customer"
                  onBack={onClose}
                  showSearch={false}
                  rightSlot={
                    <div className="flex items-center gap-4">
                      <button type="button" className="flex" aria-label="Add customer" onClick={openAdd}>
                        <UserPlus size={20} strokeWidth={1} />
                      </button>
                      <button type="button" className="flex" aria-label="Search customers" onClick={startSearch}>
                        <SearchIcon size={20} strokeWidth={1} />
                      </button>
                    </div>
                  }
                />
              </motion.div>
            )}
          </AnimatePresence>
        </PageAppHeader>

        {/* Body sits on the beige page bg (Figma); tiles are borderless white cards. Each
            section (Frequently used / All customers) is its own 16px-padded box — Figma
            nodes 1333:19052 / 1366:44532 — stacked with no extra gap between them (their own
            padding provides it), heading→list and heading-row→search both 16px, tile→tile 8px. */}
        {/* Extra bottom padding while searching clears the taller dock+keyboard overlay below. */}
        <div className={searching ? "pb-[380px]" : "pb-28"}>
          {searching ? (
            /* Search results (Figma node 1333-30416): one flat "Results N" section — no
               Frequently used / All customers split, no Add button (the search field itself
               lives in the header now). Before typing, the same suggestion list shows with no
               label of its own (the search field above already frames what it is) — the "Results"
               count only appears once there's an actual query, same convention as the Sales
               Invoice list's client-search bottom sheet. */
            <div className="flex flex-col gap-4 p-4">
              {query && filtered.length > 0 && (
                <p className="body-sm text-[var(--text-secondary)]">
                  {filtered.length === 1 ? "Result 1" : `Results ${filtered.length}`}
                </p>
              )}
              <div className="flex flex-col gap-2">
                {filtered.map(renderTile)}
              </div>
              {filtered.length === 0 && (
                <p
                  className="text-center text-[13px] text-[var(--text-placeholder)] pt-10"
                  style={{ fontFamily: "GT Walsheim LC, sans-serif" }}
                >
                  No customers found
                </p>
              )}
            </div>
          ) : hasFrequent ? (
            <>
              {/* Frequently used — the most-billed customers as full tile rows (top 5 of the
                  same list, not a separate database). */}
              <div className="flex flex-col gap-4 p-4">
                <p className={SECTION_HEADING}>
                  Frequently used
                </p>
                <div className="flex flex-col gap-2">
                  {frequent.slice(0, 5).map(renderTile)}
                </div>
              </div>

              {/* All customers — heading row with the Add action (Figma), search below it;
                  tapping the search field hands off to the full search state above. */}
              <div className="flex flex-col gap-4 p-4">
                <div ref={actionsRowRef} className="flex flex-col gap-4">
                  <div className="flex items-end justify-between">
                    <p className={SECTION_HEADING}>
                      All customers
                    </p>
                    <Button
                      hierarchy="secondary"
                      size="sm"
                      iconLeft={<UserPlus size={16} strokeWidth={2} />}
                      label="Add"
                      onClick={openAdd}
                    />
                  </div>

                  {/* Search appears only once the list is long enough to need it (5+). */}
                  {customers.length >= 5 && (
                    <Search
                      placeholder="Search"
                      value={query}
                      onChange={setQuery}
                      onFocus={startSearch}
                      showAction={false}
                      aria-label="Search customers"
                    />
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {others.map(renderTile)}
                </div>
              </div>

              {filtered.length === 0 && (
                <p
                  className="text-center text-[13px] text-[var(--text-placeholder)] pt-10"
                  style={{ fontFamily: "GT Walsheim LC, sans-serif" }}
                >
                  No customers found
                </p>
              )}
            </>
          ) : (
            /* No "Frequently used" shortcuts — same flat layout as Customer List: no section
               heading, no inline Add button/search field (both live in the header now instead). */
            <div className="flex flex-col gap-4 p-4">
              <div className="flex flex-col gap-2">
                {others.map(renderTile)}
              </div>
              {filtered.length === 0 && (
                <p
                  className="text-center text-[13px] text-[var(--text-placeholder)] pt-10"
                  style={{ fontFamily: "GT Walsheim LC, sans-serif" }}
                >
                  No customers found
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Search state (Figma node 1333-30416) shows the on-screen keyboard (Figma "IOS
          controls" = Keyboard, node 4141-2746) — ButtonDock renders it natively via the
          `keyboard` prop, no separate composition needed. */}
      <ButtonDock
        type="single"
        keyboard={searching}
        sticky
        primaryLabel="Continue"
        primaryIconRight={<ChevronRight size={16} strokeWidth={1.67} />}
        primaryDisabled={!pendingId}
        onPrimary={() => {
          const chosen = customers.find((c) => c.id === pendingId);
          if (chosen) onSelectCustomer?.(chosen);
        }}
      />

    </div>
  );
}

export default CreateSalesInvoice;
