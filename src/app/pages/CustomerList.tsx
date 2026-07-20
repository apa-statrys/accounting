import { useMemo, useState } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import { PageAppHeader } from "../components/PageAppHeader";
import { SheetHeader, HeaderIconButton } from "../components/SheetHeader";
import { SearchField } from "../components/SearchField";
import { Button } from "../ui/Button";
import { SendSuccessToast } from "../components/SendSuccessToast";
import type { Customer } from "../types";

import { FONT, INK, MUTED } from "../lib/theme";

/** Two-letter initials from a customer name (skips symbols like "&"). */
function initials(name: string): string {
  const words = name.split(/\s+/).filter((w) => /[a-z0-9]/i.test(w[0] ?? ""));
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase();
}

/** Beige round avatar with the customer's initials (Bg/Beige/secondary #f3ecda). */
function Avatar({ name }: { name: string }) {
  return (
    <span
      className="shrink-0 rounded-full flex items-center justify-center"
      style={{ width: 40, height: 40, background: "var(--bg-beige-secondary)", color: INK, fontFamily: FONT.fontFamily }}
    >
      <span className="font-medium" style={{ fontSize: 17.6, letterSpacing: -0.88 }}>{initials(name)}</span>
    </span>
  );
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
}

/**
 * Customers register (DES-713/714) — "All Customers" heading with a brand-orange count badge, a search,
 * and a divider-separated list of avatar rows (initials + name + email). Tap a row → the detail page;
 * "Add New" opens the full-page Add Client form.
 */
export function CustomerList({ customers, onBack, onOpenCustomer, onAddCustomer, flash, onFlashDone }: CustomerListProps) {
  const [query, setQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);

  const sorted = useMemo(() => [...customers].sort((a, b) => a.name.localeCompare(b.name)), [customers]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  }, [sorted, query]);

  return (
    <div className="relative bg-[var(--bg-beige-primary)] rounded-[48px] overflow-hidden shadow-2xl flex flex-col" style={{ width: 375, height: 812 }}>
      {/* Scrolling list — avatar rows with a thin divider between them. Tap → detail. The header +
          heading/search chrome stay together as ONE sticky PageAppHeader unit (frosting once the
          list scrolls beneath them) instead of a separate always-fixed block. */}
      <div
        className="flex-1 overflow-y-auto bg-white"
        onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
      >
        <PageAppHeader scrolled={scrolled}>
          <SheetHeader
            title="Customers"
            type="inside-page"
            state="fixed"
            leading={<HeaderIconButton aria-label="Back" onClick={onBack}><ChevronLeftIcon /></HeaderIconButton>}
            trailing={<span className="w-[30px] h-[30px] block" aria-hidden />}
          />
          <div className="bg-white px-4 pt-4 pb-2 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-[18px] font-bold leading-[1.1] text-[var(--text-primary)]" style={FONT}>
                  {query ? "Results" : "All Customers"}
                </p>
                <span
                  className="inline-flex items-center justify-center rounded-[4px] px-2 py-0.5 text-[14px] font-medium leading-[1.3] text-white"
                  style={{ background: "var(--bg-brand-primary)", fontFamily: FONT.fontFamily }}
                >
                  {query ? filtered.length : customers.length}
                </span>
              </div>
              <Button hierarchy="secondary" size="sm" iconLeft={<PersonAddAltIcon />} onClick={onAddCustomer} label="Add" />
            </div>

            <SearchField size="sm" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </PageAppHeader>

        <div className="bg-white px-4">
          {filtered.map((c, i) => (
            <button
              key={c.id}
              onClick={() => onOpenCustomer?.(c)}
              className="w-full flex items-center gap-3 py-4 text-left"
              style={{ borderBottom: i < filtered.length - 1 ? "1px solid rgba(160,160,160,0.2)" : "none" }}
            >
              <Avatar name={c.name} />
              <span className="flex-1 min-w-0 flex flex-col">
                <span className="text-[16px] font-medium leading-[1.1] tracking-[-0.6px] truncate" style={{ color: "#101828", fontFamily: FONT.fontFamily }}>
                  {c.name}
                </span>
                <span className="text-[14px] font-medium leading-[1.3] truncate" style={{ color: MUTED, fontFamily: FONT.fontFamily }}>
                  {c.email}
                </span>
              </span>
            </button>
          ))}

          {filtered.length === 0 && (
            <p className="text-center text-[13px] text-[var(--text-placeholder)] pt-10" style={FONT}>No customers found</p>
          )}
        </div>
      </div>

      {/* Success confirmation (AC5) — shared toast style. */}
      <SendSuccessToast open={!!flash} message={flash ?? ""} onDone={onFlashDone} />
    </div>
  );
}

export default CustomerList;
