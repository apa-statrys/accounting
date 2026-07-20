import { useMemo, useState } from "react";
import { UserPlus } from "lucide-react";
import { PageAppHeader } from "../components/PageAppHeader";
import { PageHeader } from "../ui/PageHeader";
import { Search } from "../ui/Search";
import { Tile } from "../ui/Tile";
import { Button } from "../ui/Button";
import { ButtonDock } from "../components/ButtonDock";
import { CUSTOMERS } from "../data/customers";
import type { Customer } from "../types";

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

/** Pastel avatar tints (Figma Select Customer shows varied avatar colors);
 *  picked deterministically from the customer id so a tint never changes
 *  as the list filters/reorders. */
const AVATAR_TINTS = ["#efeff0", "#d8e8f2", "#f3ecda", "#e7dfc9"];

function avatarTint(id: string): string {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
  return AVATAR_TINTS[hash % AVATAR_TINTS.length];
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
  /** Recurring-series flow (DES-782) — reflected in the header title. */
  recurring?: boolean;
}

/**
 * Create Sales Invoice — step 1: "Add a customer".
 * Choosing a customer advances the flow.
 */
export function CreateSalesInvoice({ selectedId = "", customers = CUSTOMERS, onClose, onSelectCustomer, onAddCustomer, recurring = false }: CreateSalesInvoiceProps) {
  const [query, setQuery] = useState("");
  // Selecting a tile only highlights it; "Continue" advances the flow.
  const [pendingId, setPendingId] = useState<string>(selectedId);
  const [scrolled, setScrolled] = useState(false);

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
  // Others = everyone else. Both render the same Tile card for visual consistency.
  const frequent = filtered.filter((c) => FREQUENT_IDS.includes(c.id));
  const others = filtered.filter((c) => !FREQUENT_IDS.includes(c.id));

  // DS Tile avatar row (Figma Select Customer): initials avatar + name/email, brand
  // border + check when selected; borderless white card on the beige page.
  const renderTile = (c: Customer) => (
    <Tile
      key={c.id}
      avatar={initials(c.name)}
      avatarColor={avatarTint(c.id)}
      title={c.name}
      text={c.email}
      onLayer="beige"
      selected={pendingId === c.id}
      trailing={pendingId === c.id ? "check" : "none"}
      onClick={() => setPendingId(c.id)}
    />
  );

  const SECTION_HEADING = "text-[18px] font-medium leading-[1.1] text-[var(--text-primary)]";

  // Add a new customer on a full page (App handles it, then returns here with the new one selected).
  const openAdd = () => onAddCustomer?.();

  return (
    <div
      className="relative bg-[var(--bg-beige-primary)] rounded-[48px] overflow-hidden shadow-2xl flex flex-col"
      style={{ width: 375, height: 812 }}
    >
      <div
        className="flex-1 overflow-y-auto thin-scrollbar"
        onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
      >
        <PageAppHeader scrolled={scrolled}>
          {/* DS PageHeader (center) — per Figma the Add action lives in the body's
              "All customers" row, so the header is title-only. The recurring flow
              keeps its context as the secondary line. */}
          <PageHeader
            type="center"
            title="Select Customer"
            text={recurring ? "New Recurring Invoice" : undefined}
            onBack={onClose}
            showSearch={false}
          />
        </PageAppHeader>

        {/* Body sits on the beige page bg (Figma); tiles are borderless white cards. */}
        <div className="px-4 pt-5 pb-28">
        <div className="flex flex-col gap-4">
          {/* Frequently used — the most-billed customers as full tile rows (top 5 of the same
              list, not a separate database). Hidden while searching so results read as one list. */}
          {!query && frequent.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className={SECTION_HEADING} style={{ fontFamily: "GT Walsheim LC, sans-serif" }}>
                Frequently used
              </p>
              {frequent.slice(0, 5).map(renderTile)}
            </div>
          )}

          {/* All customers — heading row with the Add action (Figma), search below it. */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className={SECTION_HEADING} style={{ fontFamily: "GT Walsheim LC, sans-serif" }}>
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
                showAction={false}
                aria-label="Search customers"
              />
            )}

            {(query ? filtered : others).map(renderTile)}
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
        </div>
      </div>

      <ButtonDock
        type="single"
        homeIndicator
        sticky
        primaryLabel="Continue"
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
