import { useMemo, useState } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import AddIcon from "@mui/icons-material/Add";
import StatusBar from "./StatusBar";
import { SheetHeader, HeaderIconButton } from "./SheetHeader";
import { Search } from "./Search";
import { Tile } from "./Tile";
import { Button } from "./Buttons";
import { SendSuccessToast } from "./SendSuccessToast";
import type { Customer } from "./CreateSalesInvoice";

const FONT = { fontFamily: "GT Walsheim LC, sans-serif" } as const;

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
}

/**
 * Customers register (DES-713/714) — restyled to match the invoice-creation "Select Customer" picker:
 * search + a "Frequently used" circular-avatar row + an "Others" list of dashed Tile cards. Tap a
 * customer → the detail page; "Add New" opens the full-page Add Client form.
 */
export function CustomerList({ customers, onBack, onOpenCustomer, onAddCustomer, flash, onFlashDone }: CustomerListProps) {
  const [query, setQuery] = useState("");

  const sorted = useMemo(() => [...customers].sort((a, b) => a.name.localeCompare(b.name)), [customers]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  }, [sorted, query]);

  const renderTile = (c: Customer) => (
    <Tile key={c.id} title={c.name} description={c.email} onClick={() => onOpenCustomer?.(c)} />
  );

  return (
    <div className="relative bg-[#F9F5EA] rounded-[48px] overflow-hidden shadow-2xl flex flex-col" style={{ width: 375, height: 812 }}>
      <StatusBar />

      <SheetHeader
        title="Customers"
        type="inside-page"
        state="fixed"
        leading={<HeaderIconButton aria-label="Back" onClick={onBack}><ChevronLeftIcon /></HeaderIconButton>}
        trailing={<span className="w-[30px] h-[30px] block" aria-hidden />}
      />

      <div className="flex-1 overflow-y-auto bg-white px-4 pt-5 pb-10">
        <div className="flex flex-col gap-4">
          {/* Single heading (carries the count, flips to Results while searching) + Add new */}
          <div className="flex items-center justify-between">
            <p className="text-[18px] font-bold leading-[1.1] text-[#1b1b1b]" style={FONT}>
              {query ? `Results (${filtered.length})` : `All Customers (${customers.length})`}
            </p>
            <Button variant="secondary" size="sm" iconLeft={<AddIcon />} onClick={onAddCustomer}>Add New</Button>
          </div>

          <Search size="sm" placeholder="Search customers" value={query} onChange={(e) => setQuery(e.target.value)} />

          {/* All customers as Tile cards (or matches while searching). Tap → detail. */}
          {filtered.length > 0 && (
            <div className="flex flex-col gap-2">
              {filtered.map(renderTile)}
            </div>
          )}

          {filtered.length === 0 && (
            <p className="text-center text-[13px] text-[#a0a0a0] pt-10" style={FONT}>No customers found</p>
          )}
        </div>
      </div>

      {/* Success confirmation (AC5) — shared toast style. */}
      <SendSuccessToast open={!!flash} message={flash ?? ""} onDone={onFlashDone} />
    </div>
  );
}

export default CustomerList;
