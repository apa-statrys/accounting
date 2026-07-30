import { useMemo, useState } from "react";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import { PageAppHeader } from "../components/PageAppHeader";
import { PageHeader } from "../ui/PageHeader";
import { Search } from "../ui/Search";
import { Button } from "../ui/Button";
import { Toast } from "../components/Toast";
import { Tile } from "../ui/Tile";
import type { Customer } from "../types";

import { FONT, avatarTint } from "../lib/theme";

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
          {/* PageAppHeader's root flex-col has a 12px gap for the StatusBar→content case; wrapping
              the header + heading/search block in one gap-less div keeps that 12px firing only once
              (StatusBar→block) instead of stacking again between the header and this block (which
              already has its own pt-4 padding for that spacing) — same fix as the invoice/credit-note
              list pages. */}
          <div className="flex flex-col">
            <PageHeader type="center" title="Customers" onBack={onBack} showSearch={false} />
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

              <Search placeholder="Search" value={query} onChange={setQuery} showAction={false} />
            </div>
          </div>
        </PageAppHeader>

        <div className="bg-white px-4">
          {filtered.map((c, i) => (
            <div key={c.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid rgba(160,160,160,0.2)" : "none" }}>
              <Tile
                avatar={initials(c.name)}
                avatarColor={avatarTint(c.id)}
                title={c.name}
                text={c.email}
                onLayer="beige"
                reserveTrailing={false}
                onClick={() => onOpenCustomer?.(c)}
              />
            </div>
          ))}

          {filtered.length === 0 && (
            <p className="text-center text-[13px] text-[var(--text-placeholder)] pt-10" style={FONT}>No customers found</p>
          )}
        </div>
      </div>

      {/* Success confirmation (AC5) — shared toast style. */}
      <Toast open={!!flash} message={flash ?? ""} onDone={onFlashDone} bottomOffset={16} />
    </div>
  );
}

export default CustomerList;
