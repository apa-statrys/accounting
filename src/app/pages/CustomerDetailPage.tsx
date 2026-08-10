import { useState } from "react";
import { PageAppHeader } from "../components/PageAppHeader";
import { PageHeader } from "../ui/PageHeader";
import { ButtonDock } from "../components/ButtonDock";
import { Toast } from "../components/Toast";
import { Tile } from "../ui/Tile";
import { ListCard } from "../ui/ListCard";
import { ListRow } from "../ui/ListRow";
import type { Customer } from "../types";

import { FONT, INK } from "../lib/theme";

function initials(name: string): string {
  const words = name.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  return (words[0][0] + (words[1]?.[0] ?? "")).toUpperCase();
}

/** A labeled ListCard of label/value rows — renders only the rows that have a value, and hides
 *  the whole section when none are present (so a client with only name+email doesn't show an
 *  empty Company Details/Address section). Same "label + ListCard" section shape as every other
 *  detail page (InvoiceDetailPage's Invoice Details, CreditNoteDetailPage's Credit Details, …). */
function FieldSection({ title, rows }: { title: string; rows: { label: string; value?: string }[] }) {
  const present = rows.filter((r) => r.value != null && r.value !== "");
  if (!present.length) return null;
  return (
    <div className="flex flex-col gap-2">
      <p className="body-sm-medium" style={{ ...FONT, color: INK }}>{title}</p>
      <ListCard>
        {present.map((r, i) => (
          <ListRow key={r.label} label={r.label} value={r.value} last={i === present.length - 1} />
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
 * a bottom "Edit Customer" button (DES-714 — opens the full-page Edit form). Same DS Tile/ListCard/ListRow
 * shape as the invoice detail page, not a bespoke dashed-card layout.
 */
export function CustomerDetailPage({ customer, onBack, onEdit, flash, onFlashDone }: CustomerDetailPageProps) {
  // The record is owned by App now (edits happen on the full-page form and flow back via props).
  const record = customer;
  const [scrolled, setScrolled] = useState(false);

  return (
    <div className="relative bg-white rounded-[48px] overflow-hidden shadow-2xl flex flex-col" style={{ width: 375, height: 812 }}>
      <div
        className="flex-1 overflow-y-auto thin-scrollbar bg-white"
        onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
      >
        <PageAppHeader scrolled={scrolled}>
          <PageHeader type="center" title={record.name} onBack={onBack} showSearch={false} />
        </PageAppHeader>

        <div className="px-4 pt-4 pb-28 flex flex-col gap-4">
          {/* Identity — DS Tile, same pattern as every other customer display in the app
              (InvoiceDetailPage's Bill To, CreditNoteDetailPage's Credit To). */}
          <Tile avatar={initials(record.name)} title={record.name} text={record.email} />

          <FieldSection title="Default Currency" rows={[
            { label: "Currency", value: record.currency },
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

      <ButtonDock
        type="single"
        sticky
        primaryLabel="Edit Customer"
        onPrimary={() => onEdit?.()}
      />

      <Toast open={!!flash} message={flash ?? ""} onDone={onFlashDone} />
    </div>
  );
}

export default CustomerDetailPage;
