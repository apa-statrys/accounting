import { useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { PageAppHeader } from "../components/PageAppHeader";
import { PageHeader } from "../ui/PageHeader";
import { Toast } from "../components/Toast";
import { Avatar } from "../ui/Avatar";
import { ListCard } from "../ui/ListCard";
import { ListRow } from "../ui/ListRow";
import { CountryFlag } from "../components/CountryFlag";
import { CURRENCY_COUNTRY } from "../components/CurrencySheet";
import type { Customer } from "../types";

import { FONT, INK, MUTED, avatarTint } from "../lib/theme";

function initials(name: string): string {
  const words = name.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  return (words[0][0] + (words[1]?.[0] ?? "")).toUpperCase();
}

/** A labeled ListCard of label/value rows — renders only the rows that have a value, and hides
 *  the whole section when none are present (so a client with only name+email doesn't show an
 *  empty Company Details/Address section). Same "label + ListCard" section shape as every other
 *  detail page (InvoiceDetailPage's Invoice Details, CreditNoteDetailPage's Credit Details, …). */
function FieldSection({ title, rows }: { title: string; rows: { label: string; value?: string; flag?: React.ReactNode }[] }) {
  const present = rows.filter((r) => r.value != null && r.value !== "");
  if (!present.length) return null;
  return (
    <div className="flex flex-col gap-2">
      <p className="body-sm-medium" style={{ ...FONT, color: INK }}>{title}</p>
      <ListCard>
        {present.map((r, i) => (
          <ListRow key={r.label} label={r.label} value={r.value} valueFlag={r.flag} last={i === present.length - 1} />
        ))}
      </ListCard>
    </div>
  );
}

export interface CustomerDetailPageProps {
  customer: Customer;
  onBack?: () => void;
  /** DES-714 — open the full-page Edit form for this client (from the Client List only). */
  onEdit?: () => void;
  /** One-off confirmation (e.g. "Changes saved" after returning from Edit). */
  flash?: string | null;
  onFlashDone?: () => void;
}

/**
 * Customer detail (Option B — beyond the ticket, Qonto/Stripe pattern): the full client record (DES-713
 * Client Field Spec, present fields only), grouped into Billing / Company Details / Address sections, with
 * an Edit icon in the header's top-right (DES-714 — opens the full-page Edit form; not a sticky dock CTA,
 * since editing isn't this read-only page's primary action). Same gradient-hero + ListCard/ListRow shape
 * as the invoice detail page, not a bespoke dashed-card layout.
 */
export function CustomerDetailPage({ customer, onBack, onEdit, flash, onFlashDone }: CustomerDetailPageProps) {
  // The record is owned by App now (edits happen on the full-page form and flow back via props).
  const record = customer;
  const [scrolled, setScrolled] = useState(false);
  // Blank header title by default — the hero right below it already carries the customer's name.
  // Once the hero has scrolled out from under the sticky header, the title takes over showing it
  // (same "reveal on scroll" idea as PageAppHeader's own frost, just gated on a taller distance).
  const heroRef = useRef<HTMLDivElement>(null);
  const [pastHero, setPastHero] = useState(false);

  return (
    // Beige, not white — PageAppHeader is transparent at rest, so it needs the outer frame's
    // beige to show through behind it, blending into the hero gradient below instead of a hard
    // white→beige seam (same fix as the invoice/credit-note detail heroes).
    <div className="relative rounded-[48px] overflow-hidden shadow-2xl flex flex-col" style={{ width: 375, height: 812, background: "var(--bg-beige-primary)" }}>
      <div
        className="flex-1 overflow-y-auto thin-scrollbar"
        onScroll={(e) => {
          const top = e.currentTarget.scrollTop;
          setScrolled(top > 4);
          setPastHero(top > (heroRef.current?.offsetHeight ?? 0));
        }}
      >
        <PageAppHeader scrolled={scrolled}>
          <PageHeader
            type="center"
            title={pastHero ? record.name : ""}
            onBack={onBack}
            showSearch={!!onEdit}
            rightIcon={<Pencil size={20} strokeWidth={1} />}
            rightLabel="Edit customer"
            onRightClick={() => onEdit?.()}
          />
        </PageAppHeader>

        {/* Identity hero — full-bleed beige→white gradient, a direct sibling of the header (not
            nested inside the padded body below) so it bleeds edge-to-edge flush against it, same
            structure as the invoice/credit-note detail heroes. Avatar + name headline + email
            subtitle stand in for the money headline those pages lead with. */}
        <div
          ref={heroRef}
          className="p-4 flex items-center gap-3"
          style={{ backgroundImage: "linear-gradient(180deg, var(--bg-beige-primary) 1%, var(--bg-neutral-primary) 99%)" }}
        >
          <Avatar size="2xl" initials={initials(record.name)} color={avatarTint(record.id)} />
          <div className="min-w-0">
            <p className="card-title-md truncate" style={{ color: INK }}>{record.name}</p>
            <p className="body-sm truncate" style={{ ...FONT, color: MUTED }}>{record.email}</p>
          </div>
        </div>

        <div className="px-4 pt-4 pb-8 flex flex-col gap-4 bg-white">
          <FieldSection title="Default Currency" rows={[
            {
              label: "Currency",
              value: record.currency,
              // Same "Currency" row shape as InvoiceDetailPage's own Invoice Details card —
              // the country flag for the currency, not the customer's own address country.
              flag: record.currency ? <CountryFlag name={CURRENCY_COUNTRY[record.currency]} size={16} /> : undefined,
            },
          ]} />

          <FieldSection title="Company Details" rows={[
            { label: "First Name", value: record.firstName },
            { label: "Last Name", value: record.lastName },
            { label: "Company Registration No.", value: record.regNo },
            { label: "Phone Number", value: record.phone },
            { label: "Website", value: record.website },
          ]} />

          <FieldSection title="Address" rows={[
            { label: "Country", value: record.country },
            { label: "Address", value: record.address },
            { label: "City", value: record.city },
            { label: "Zip / Postal", value: record.zip },
            { label: "State", value: record.state },
          ]} />
        </div>
      </div>

      {/* No dock on this page (see the header's Edit icon above), so the toast sits close to the
          bottom edge — same "no dock at all" bottomOffset convention InvoiceDetailPage uses. */}
      <Toast open={!!flash} message={flash ?? ""} bottomOffset={16} onDone={onFlashDone} />
    </div>
  );
}

export default CustomerDetailPage;
