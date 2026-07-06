import { useMemo, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import StatusBar from "./StatusBar";
import { SheetHeader, HeaderIconButton } from "./SheetHeader";
import { Search } from "./Search";
import { Tile } from "./Tile";
import { Button } from "./Buttons";
import { ButtonDock } from "./ButtonDock";
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

  const renderTile = (c: Customer) => (
    <Tile
      key={c.id}
      title={c.name}
      description={c.email}
      selected={pendingId === c.id}
      onClick={() => setPendingId(c.id)}
    />
  );

  const GROUP_LABEL = "text-[12px] font-medium leading-[1.3] text-[#808080]";

  // Add a new customer on a full page (App handles it, then returns here with the new one selected).
  const openAdd = () => onAddCustomer?.();

  return (
    <div
      className="relative bg-[#F9F5EA] rounded-[48px] overflow-hidden shadow-2xl flex flex-col"
      style={{ width: 375, height: 812 }}
    >
      <StatusBar />

      <SheetHeader
        title={recurring ? "New Recurring Invoice" : "New Invoice"}
        type="inside-page"
        state="fixed"
        leading={
          <HeaderIconButton aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </HeaderIconButton>
        }
        trailing={<span className="w-[30px] h-[30px] block" aria-hidden />}
      />

      {/* Body (white) */}
      <div className="flex-1 overflow-y-auto bg-white px-4 pt-5 pb-10">
        <div className="flex flex-col gap-4">
          {/* Select customer + Add new */}
          <div className="flex items-center justify-between">
            <p
              className="text-[18px] font-bold leading-[1.1] text-[#1b1b1b]"
              style={{ fontFamily: "GT Walsheim LC, sans-serif" }}
            >
              Select Customer
            </p>
            <Button variant="secondary" size="sm" iconLeft={<AddIcon />} onClick={openAdd}>
              Add New
            </Button>
          </div>

          {/* Search appears only once the list is long enough to need it (5+). */}
          {customers.length >= 5 && (
            <Search
              size="sm"
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          )}

          {/* Frequently used — quick-access avatar row (top 5 of the same list, not a separate
              database). Hidden while searching so results read as one list. */}
          {!query && frequent.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <p className={GROUP_LABEL} style={{ fontFamily: "GT Walsheim LC, sans-serif" }}>
                FREQUENTLY USED ({Math.min(frequent.length, 5)})
              </p>
              <div className="flex gap-2 overflow-x-auto chip-scroll -mx-1 px-1 pb-1">
                {frequent.slice(0, 5).map((c) => {
                  const active = pendingId === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setPendingId(c.id)}
                      className="shrink-0 w-[58px] flex flex-col items-center gap-1.5"
                      style={{ fontFamily: "GT Walsheim LC, sans-serif" }}
                    >
                      <span
                        className="w-[50px] h-[50px] rounded-full flex items-center justify-center text-[16px] font-bold transition-colors"
                        style={{
                          background: active ? "#ff4a15" : "#ffffff",
                          color: active ? "#ffffff" : "#1b1b1b",
                          border: active ? "2px solid #ff4a15" : "1px solid rgba(160,160,160,0.3)",
                        }}
                      >
                        {initials(c.name)}
                      </span>
                      <span className="w-full text-[12px] leading-[1.2] text-[#808080] text-center truncate">
                        {c.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Others — the rest of the customer list (or all matches while searching). */}
          {(query ? filtered : others).length > 0 && (
            <div className="flex flex-col gap-2">
              <p className={GROUP_LABEL} style={{ fontFamily: "GT Walsheim LC, sans-serif" }}>
                {query ? `RESULTS (${filtered.length})` : `OTHERS (${others.length})`}
              </p>
              {(query ? filtered : others).map(renderTile)}
            </div>
          )}

          {filtered.length === 0 && (
            <p
              className="text-center text-[13px] text-[#a0a0a0] pt-10"
              style={{ fontFamily: "GT Walsheim LC, sans-serif" }}
            >
              No customers found
            </p>
          )}
        </div>
      </div>

      <ButtonDock
        type="single"
        homeIndicator
        overflow
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
