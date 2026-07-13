import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import StatusBar from "./StatusBar";
import { SheetHeader, HeaderIconButton } from "./SheetHeader";
import { ButtonDock } from "./ButtonDock";
import { SendSuccessToast } from "./SendSuccessToast";
import type { Customer } from "../types";

import { FONT, INK, MUTED } from "../lib/theme";

function initials(name: string): string {
  const words = name.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  return (words[0][0] + (words[1]?.[0] ?? "")).toUpperCase();
}

/** Soft card shadow used on every detail section (Shadow/Nav/menu). */
const CARD_SHADOW = "0px 4px 14px 0px rgba(226,220,203,0.3)";

/**
 * A titled section of label/value rows — renders only the rows that have a value, and hides the whole
 * card when none are present (so a client with only name+email doesn't show empty Company/Address cards).
 * `variant="solid"` = filled beige card (Billing); `variant="dashed"` = white dashed card (Company/Address).
 */
function Section({
  title,
  rows,
  variant = "dashed",
}: {
  title: string;
  rows: { label: string; value?: React.ReactNode }[];
  variant?: "solid" | "dashed";
}) {
  const present = rows.filter((r) => r.value != null && r.value !== "");
  if (!present.length) return null;
  const solid = variant === "solid";
  return (
    <div
      className="shrink-0 rounded-[12px] overflow-hidden w-full"
      style={{
        background: solid ? "#faf9f4" : "#ffffff",
        border: "1px dashed rgba(160,160,160,0.2)",
        boxShadow: CARD_SHADOW,
      }}
    >
      {/* Title as the first row inside the card (Figma 1209): grey uppercase + full-width divider. */}
      <p className="px-4 pt-3.5 pb-3 text-[12px] font-bold uppercase tracking-wide leading-[16.5px]" style={{ ...FONT, color: "#a0a0a0", borderBottom: "1px solid rgba(160,160,160,0.2)" }}>{title}</p>
      {present.map((r, i) => (
          <div
            key={r.label}
            className="flex items-center justify-between gap-4 px-4 py-[15px]"
            style={{ borderBottom: i === present.length - 1 ? "none" : "1px solid rgba(160,160,160,0.2)" }}
          >
            <span className="text-[14px] leading-[1.3] shrink-0" style={{ ...FONT, color: INK }}>{r.label}</span>
            <span className="min-w-0 text-right text-[14px] font-medium leading-[1.3] truncate" style={{ ...FONT, color: "#101828" }}>{r.value}</span>
          </div>
        ))}
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
 * Client Field Spec, present fields only), grouped into Billing / Company Details / Address cards, with a
 * bottom "Edit Customer" button (DES-714 — opens the full-page Edit form).
 */
export function CustomerDetailPage({ customer, onBack, onEdit, flash, onFlashDone }: CustomerDetailPageProps) {
  // The record is owned by App now (edits happen on the full-page form and flow back via props).
  const record = customer;

  return (
    <div className="relative bg-white rounded-[48px] overflow-hidden shadow-2xl flex flex-col" style={{ width: 375, height: 812 }}>
      <StatusBar />

      <SheetHeader
        title={record.name}
        type="inside-page"
        state="fixed"
        leading={<HeaderIconButton aria-label="Back" onClick={onBack}><ChevronLeftIcon /></HeaderIconButton>}
        trailing={<span className="w-[30px] h-[30px] block" aria-hidden />}
      />

      <div className="flex-1 overflow-y-auto thin-scrollbar bg-white px-4 pt-4 pb-28 flex flex-col gap-4">
        {/* Identity — avatar + name + email */}
        <div className="flex items-center gap-3">
          <span
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "#f3ecda", color: INK, fontFamily: FONT.fontFamily }}
          >
            <span className="font-medium" style={{ fontSize: 17.6, letterSpacing: -0.88 }}>{initials(record.name)}</span>
          </span>
          <span className="min-w-0">
            <span className="block text-[16px] font-bold leading-none tracking-[-0.8px] truncate" style={{ ...FONT, color: "#101828" }}>{record.name}</span>
            <span className="block text-[14px] font-medium mt-[3px] truncate" style={{ ...FONT, color: MUTED }}>{record.email}</span>
          </span>
        </div>

        <Section title="Default Currency" variant="solid" rows={[
          { label: "Currency", value: record.currency },
        ]} />

        <Section title="Company Details" rows={[
          { label: "First Name", value: record.firstName },
          { label: "Last Name", value: record.lastName },
          { label: "Company Registration No.", value: record.regNo },
          { label: "Phone Number", value: record.phone },
          { label: "Website", value: record.website },
        ]} />

        <Section title="Address" rows={[
          { label: "Country", value: record.country },
          { label: "Address", value: record.address },
          { label: "City", value: record.city },
          { label: "Zip / Postal", value: record.zip },
          { label: "State", value: record.state },
        ]} />
      </div>

      <ButtonDock
        type="single"
        primaryLabel="Edit Customer"
        onPrimary={() => onEdit?.()}
        homeIndicator
      />

      <SendSuccessToast open={!!flash} message={flash ?? ""} onDone={onFlashDone} />
    </div>
  );
}

export default CustomerDetailPage;
