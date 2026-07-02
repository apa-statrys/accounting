import { useMemo, useState } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import StatusBar from "./StatusBar";
import { SheetHeader, HeaderIconButton } from "./SheetHeader";
import { BottomSheet } from "./BottomSheet";
import { SendSuccessToast } from "./SendSuccessToast";
import { INVOICES, customerIdForInvoice, type Invoice, type Status } from "./SalesInvoiceList";
import type { Customer } from "./CreateSalesInvoice";

const FONT = { fontFamily: "GT Walsheim LC, sans-serif" } as const;
const INK = "#1b1b1b";
const MUTED = "#808080";

const STATUS_PILL: Record<Status, { bg: string; text: string }> = {
  Awaiting: { bg: "#fff7e6", text: "#b45309" },
  Draft: { bg: "#f1f1f1", text: "#6b7280" },
  PartiallyPaid: { bg: "#fff7e6", text: "#b45309" },
  Paid: { bg: "#ecfdf3", text: "#067647" },
  Cancelled: { bg: "#f3f3f3", text: "#9a9a9a" },
};

/** Map a list Invoice to the shape App's invoice-detail flow expects. */
export type OpenInvoicePayload = { number: string; client: string; status: Status; origin: "created" | "uploaded"; cnNo?: string; cnAmount?: number; cnSent?: boolean };
const toOpen = (inv: Invoice): OpenInvoicePayload => ({
  number: inv.id.replace(/[a-z]$/, ""),
  client: inv.client,
  status: inv.status,
  origin: inv.origin ?? "created",
  cnNo: inv.cnNo,
  cnAmount: inv.cnAmount,
  cnSent: inv.cnSent,
});

function initials(name: string): string {
  const words = name.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  return (words[0][0] + (words[1]?.[0] ?? "")).toUpperCase();
}

/** Dashed cream card with an optional uppercase title (matches the invoice/CN detail InfoCards). */
function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#faf9f4] border border-dashed border-[rgba(160,160,160,0.3)] rounded-xl px-4">
      {title && <p className="pt-3 text-[12px] font-bold uppercase tracking-wide" style={{ ...FONT, color: "#a0a0a0" }}>{title}</p>}
      {children}
    </div>
  );
}

/** A titled section of label/value rows — renders only the rows that have a value, and hides the whole
 *  card when none are present (so a client with only name+email doesn't show empty Company/Address cards). */
function Section({ title, rows }: { title: string; rows: { label: string; value?: React.ReactNode }[] }) {
  const present = rows.filter((r) => r.value != null && r.value !== "");
  if (!present.length) return null;
  return (
    <Card title={title}>
      <div className="pt-1">
        {present.map((r, i) => (
          <div key={r.label} className={`flex items-start justify-between gap-4 py-2.5 ${i === present.length - 1 ? "" : "border-b border-[rgba(160,160,160,0.18)]"}`}>
            <span className="text-[13px] shrink-0" style={{ ...FONT, color: MUTED }}>{r.label}</span>
            <span className="min-w-0 text-right text-[13px] font-medium" style={{ ...FONT, color: INK }}>{r.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export interface CustomerDetailPageProps {
  customer: Customer;
  onBack?: () => void;
  /** Open one of this customer's invoices in the invoice detail. */
  onOpenInvoice?: (payload: OpenInvoicePayload) => void;
  /** DES-714 — open the full-page Edit form for this client (from the Client List only). */
  onEdit?: () => void;
  /** One-off confirmation (e.g. "Changes saved" after returning from Edit). */
  flash?: string | null;
  onFlashDone?: () => void;
}

/**
 * Customer detail (Option B — beyond the ticket, Qonto/Stripe pattern): the full client record (DES-713
 * Client Field Spec, present fields only) + this customer's invoices, with Edit in the ⋯ menu. Invoices are
 * linked from the shared INVOICES demo data by client name; tapping one opens the invoice detail.
 * (DES-714 note: Edit should become the full-page form + unsaved-changes warning — still on the bottom sheet.)
 */
export function CustomerDetailPage({ customer, onBack, onOpenInvoice, onEdit, flash, onFlashDone }: CustomerDetailPageProps) {
  // The record is owned by App now (edits happen on the full-page form and flow back via props).
  const record = customer;
  const [menuOpen, setMenuOpen] = useState(false);

  // Link by stable customer id (rename-safe); fall back to name for records not in the register.
  const invoices = useMemo(
    () => INVOICES.filter((inv) => {
      const cid = customerIdForInvoice(inv);
      return cid ? cid === record.id : inv.client.trim().toLowerCase() === record.name.trim().toLowerCase();
    }),
    [record.id, record.name]
  );
  const contactPerson = [record.firstName, record.lastName].filter(Boolean).join(" ");

  return (
    <div className="relative bg-white rounded-[48px] overflow-hidden shadow-2xl flex flex-col" style={{ width: 375, height: 812 }}>
      <StatusBar />

      <SheetHeader
        title={record.name}
        type="inside-page"
        state="fixed"
        leading={<HeaderIconButton aria-label="Back" onClick={onBack}><ChevronLeftIcon /></HeaderIconButton>}
        trailing={<HeaderIconButton aria-label="More actions" onClick={() => setMenuOpen(true)}><MoreHorizIcon /></HeaderIconButton>}
      />

      <div className="flex-1 overflow-y-auto thin-scrollbar bg-white px-4 pt-5 pb-28 flex flex-col gap-4">
        {/* Identity */}
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-full flex items-center justify-center text-[16px] font-bold shrink-0" style={{ ...FONT, background: "#fff", color: INK, border: "1px solid rgba(160,160,160,0.3)" }}>
            {initials(record.name)}
          </span>
          <span className="min-w-0">
            <span className="block text-[16px] font-bold truncate" style={{ ...FONT, color: INK }}>{record.name}</span>
            {record.country && <span className="block text-[12px] mt-0.5" style={{ ...FONT, color: MUTED }}>{[record.city, record.country].filter(Boolean).join(", ")}</span>}
          </span>
        </div>

        <Section title="Contact" rows={[
          { label: "Email", value: record.email },
          { label: "Phone", value: record.phone },
          { label: "Website", value: record.website },
        ]} />

        <Section title="Company" rows={[
          { label: "Contact person", value: contactPerson || undefined },
          { label: "Registration no.", value: record.regNo },
        ]} />

        <Section title="Address" rows={[
          { label: "Address", value: record.address },
          { label: "City", value: record.city },
          { label: "State", value: record.state },
          { label: "Postal code", value: record.zip },
          { label: "Country", value: record.country },
        ]} />

        <Section title="Billing" rows={[
          { label: "Default currency", value: record.currency },
        ]} />

        {/* Invoices (Qonto-style, beyond the ticket) */}
        <div className="flex flex-col gap-1.5">
          <p className="px-1 text-[12px] font-bold uppercase tracking-wide" style={{ ...FONT, color: "#a0a0a0" }}>Invoices ({invoices.length})</p>
          {invoices.length > 0 ? (
            <div className="bg-[#faf9f4] border border-dashed border-[rgba(160,160,160,0.3)] rounded-xl px-4">
              {invoices.map((inv, i) => {
                const number = inv.id.replace(/[a-z]$/, "");
                const rest = inv.meta.split("·").slice(1).join("·").trim();
                const pill = STATUS_PILL[inv.status];
                return (
                  <button
                    key={inv.id}
                    onClick={() => onOpenInvoice?.(toOpen(inv))}
                    className={`group w-full flex items-center gap-3 py-3 text-left ${i === invoices.length - 1 ? "" : "border-b border-[rgba(160,160,160,0.18)]"}`}
                  >
                    <span className="flex-1 min-w-0">
                      <span className="block text-[14px] font-medium truncate" style={{ ...FONT, color: INK }}>{number}</span>
                      <span className="block text-[12px] truncate mt-0.5" style={{ ...FONT, color: MUTED }}>{rest}</span>
                    </span>
                    <span className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[14px] font-medium" style={{ ...FONT, color: INK }}>{inv.amount}</span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ ...FONT, background: pill.bg, color: pill.text }}>{inv.status}</span>
                    </span>
                    <ChevronRightIcon className="transition-transform group-hover:translate-x-0.5 shrink-0" style={{ fontSize: 18, color: MUTED }} />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="bg-[#faf9f4] border border-dashed border-[rgba(160,160,160,0.3)] rounded-xl px-4 py-8">
              <p className="text-center text-[13px]" style={{ ...FONT, color: MUTED }}>No invoices for this customer yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* ⋯ actions */}
      <BottomSheet open={menuOpen} title="Customer actions" onClose={() => setMenuOpen(false)}>
        <div className="flex flex-col">
          <button onClick={() => { setMenuOpen(false); onEdit?.(); }} className="w-full flex items-center gap-3 py-3.5 text-left">
            <EditOutlinedIcon style={{ fontSize: 20, color: INK }} />
            <span className="text-[15px]" style={{ ...FONT, color: INK }}>Edit customer</span>
          </button>
        </div>
      </BottomSheet>

      <SendSuccessToast open={!!flash} message={flash ?? ""} onDone={onFlashDone} />
    </div>
  );
}

export default CustomerDetailPage;
