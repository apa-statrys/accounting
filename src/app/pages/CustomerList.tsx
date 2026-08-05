import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { UserPlus, Search as SearchIcon } from "lucide-react";
import { PageAppHeader } from "../components/PageAppHeader";
import { PageHeader } from "../ui/PageHeader";
import { Toast } from "../components/Toast";
import { Tile } from "../ui/Tile";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { EmptyState } from "../components/EmptyState";
import type { Customer, NewFlag } from "../types";

import { avatarTint } from "../lib/theme";
import { pinNew } from "../lib/pinNew";

const noCustomersIcon = new URL("./no-customers-icon.svg", import.meta.url).href;

/** Two-letter initials from a customer name (skips symbols like "&"). */
function initials(name: string): string {
  const words = name.split(/\s+/).filter((w) => /[a-z0-9]/i.test(w[0] ?? ""));
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase();
}

export interface CustomerListProps {
  /** The client register (owned by App so the full-page add can append to it). */
  customers: Customer[];
  onBack?: () => void;
  /** Open a customer's detail page (DES-714). */
  onOpenCustomer?: (customer: Customer) => void;
  /** Open the full-page Add Client form (DES-713, Client List entry point). */
  onAddCustomer?: () => void;
  /** One-off success confirmation after a client is added (AC5). */
  flash?: string | null;
  onFlashDone?: () => void;
  /** The app-wide "just created" flag — pins a newly added customer to the top with a "New" badge
   *  for 5s (see lib/pinNew.ts). */
  newFlag?: NewFlag;
  /** Dev-only (QuickNav): render the zero-data empty state (Figma "Customer List", node
   *  2071-19448) — no real flow ever empties the demo register. */
  forceEmpty?: boolean;
}

/**
 * Customers register (DES-713/714) — "Customers" header whose right side always shows an
 * Add + Search icon pair (DS frosted `rightSlot`, e.g. Dashboard's bell+settings pill), no
 * scroll-driven reveal. Tapping search morphs the header into a full search field and
 * collapses the body to a flat "Result N" list (same convention as CreateSalesInvoice's
 * "Select Customer" picker and every other search list/sheet in the app). Tap a row → the
 * detail page (no selection/Continue step here, unlike the picker).
 */
export function CustomerList({ customers, onBack, onOpenCustomer, onAddCustomer, flash, onFlashDone, newFlag, forceEmpty }: CustomerListProps) {
  const [query, setQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  // Search state — activating search replaces the whole header with a search field and
  // collapses the body to a flat "Results N" list.
  const [searching, setSearching] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const startSearch = () => {
    setSearching(true);
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };
  const exitSearch = () => { setSearching(false); setQuery(""); };

  // Newest-created first — customers has no timestamp field, but new ones are always appended to
  // the end of the register (App.tsx), so reversing the array is exactly "most recently created
  // first" without needing one.
  const sorted = useMemo(() => [...customers].reverse(), [customers]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q ? sorted.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)) : sorted;
    // Pinned after the search filter — pinNew no-ops if the new customer doesn't match an active
    // query, so a pin can't make a search result set show something that doesn't match what was typed.
    return pinNew(base, newFlag, "customer", (c) => c.id);
  }, [sorted, query, newFlag]);

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
      reserveTrailing={false}
      onClick={() => onOpenCustomer?.(c)}
    />
  );

  return (
    <div className="relative bg-[var(--bg-neutral-tertiary)] rounded-[48px] overflow-hidden shadow-2xl flex flex-col" style={{ width: 375, height: 812 }}>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto thin-scrollbar"
        onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
      >
        <PageAppHeader scrolled={scrolled}>
          {forceEmpty ? (
            /* Zero-data empty state (Figma "Customer List", node 2071-19448) — plain centered
               title, no Add/Search icons (the CTA below already covers Add). */
            <PageHeader type="center" title="Customers" onBack={onBack} showSearch={false} />
          ) : (
          <AnimatePresence mode="wait" initial={false}>
            {searching ? (
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
            ) : (
              <motion.div key="default" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                <PageHeader
                  type="center"
                  title="Customers"
                  onBack={onBack}
                  showSearch={false}
                  rightSlot={
                    <div className="flex items-center gap-4">
                      <button type="button" className="flex" aria-label="Add customer" onClick={onAddCustomer}>
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
          )}
        </PageAppHeader>

        {forceEmpty ? (
          <div className="flex-1 flex flex-col p-4">
            <EmptyState
              icon={<img src={noCustomersIcon} alt="" className="size-14" />}
              title="No customers"
              subtitle="Add your first customer to get started"
              action={
                <Button
                  size="sm"
                  iconLeft={<UserPlus size={16} strokeWidth={1.67} />}
                  label="Add New Customer"
                  onClick={onAddCustomer}
                />
              }
            />
          </div>
        ) : searching ? (
          /* Search results — one flat "Results N" section; "Results" only appears once
             there's an actual query that matched something (same convention as every other
             search list/sheet in the app). */
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
              <p className="text-center text-[13px] text-[var(--text-placeholder)] pt-10" style={{ fontFamily: "GT Walsheim LC, sans-serif" }}>
                No customers found
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4 p-4">
            <div className="flex flex-col gap-2">
              {filtered.map(renderTile)}
            </div>

            {filtered.length === 0 && (
              <p className="text-center text-[13px] text-[var(--text-placeholder)] pt-10" style={{ fontFamily: "GT Walsheim LC, sans-serif" }}>
                No customers found
              </p>
            )}
          </div>
        )}
      </div>

      {/* Success confirmation (AC5) — shared toast style. */}
      <Toast open={!!flash} message={flash ?? ""} onDone={onFlashDone} bottomOffset={16} />
    </div>
  );
}

export default CustomerList;
