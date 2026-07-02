import { useState } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { ImageIcon, UploadCloud, Trash2, ChevronDown } from "lucide-react";
import StatusBar from "./StatusBar";
import { SheetHeader, HeaderIconButton } from "./SheetHeader";
import { ButtonDock } from "./ButtonDock";
import { BottomSheet } from "./BottomSheet";
import { TextInput } from "./TextInput";
import { Tile } from "./Tile";
import { Search } from "./Search";
import { CurrencySheet, CURRENCIES } from "./CurrencySheet";
import { ReceivingAccountSheet } from "./ReceivingAccountSheet";
import { formatAccount } from "../data/receivingAccounts";
import { DEFAULT_SETTINGS } from "../data/settings";
import type { CompanySettings } from "../types";
import { Toggle } from "./Toggle";

import { FONT } from "../lib/theme";
import { EMAIL_RE } from "../lib/format";

// Company-logo upload rules (DES-764).
const LOGO_TYPES = ["image/jpeg", "image/png"];
const LOGO_MAX_MB = 10;

/** Reminder schedule (DES-764 AC5): two reminders, each timing chosen from presets via a bottom sheet.
 *  "Don't send" (first option) disables that reminder. The per-invoice toggle inherits `chaserEnabled`. */
export const REMINDER_OFF = "Don't send";
export const REMINDER_DEFS: { title: string; options: string[] }[] = [
  {
    title: "Reminder 1",
    options: [REMINDER_OFF, "7 days before due date", "5 days before due date", "3 days before due date", "1 day before due date", "On due date"],
  },
  {
    title: "Reminder 2",
    options: [REMINDER_OFF, "On due date", "1 day after due date", "3 days after due date", "7 days after due date", "14 days after due date"],
  },
];

/** Inline brand mark — orange monogram tile from the company initial (no external asset; CSP-safe). */
function LogoMark({ letter = "L", size = 40 }: { letter?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden role="img">
      <rect width="40" height="40" rx="11" fill="#FF4A15" />
      <text
        x="20" y="20" textAnchor="middle" dominantBaseline="central"
        fontFamily="GT Walsheim LC, sans-serif" fontSize="24" fontWeight="700" fill="#ffffff"
      >
        {letter}
      </text>
    </svg>
  );
}

/** Revolut-style grouped section — an uppercase header label above a card of divided rows. */
function Group({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      {title && (
        <span className="px-1 text-[12px] font-bold uppercase tracking-wide text-[#a0a0a0]" style={FONT}>{title}</span>
      )}
      <div className="rounded-2xl bg-[#faf9f4] border border-dashed border-[rgba(160,160,160,0.3)] overflow-hidden">
        {children}
      </div>
    </div>
  );
}

/** A row inside a Group: an optional leading element + title/subtitle, then a value+chevron (navigates
 *  to a sheet) OR a custom `trailing` (e.g. an inline toggle, in which case the row isn't a button). */
function Row({ leading, title, subtitle, value, onClick, trailing, last }: {
  leading?: React.ReactNode;
  title: string;
  subtitle?: string;
  value?: string;
  onClick?: () => void;
  trailing?: React.ReactNode;
  last?: boolean;
}) {
  const border = last ? "" : "border-b border-[rgba(160,160,160,0.18)]";
  const body = (
    <>
      {leading && <span className="shrink-0">{leading}</span>}
      <span className="flex-1 min-w-0 text-left">
        <span className="block text-[15px] font-semibold leading-[1.25] text-[#101828]" style={FONT}>{title}</span>
        {subtitle && <span className="block text-[13px] leading-[1.3] text-[#808080] truncate" style={FONT}>{subtitle}</span>}
      </span>
      {trailing ?? (
        <span className="flex items-center gap-1.5 shrink-0">
          {value && <span className="text-[14px] font-medium text-[#1b1b1b]" style={FONT}>{value}</span>}
          <ChevronRightIcon className="transition-transform duration-200 group-hover:translate-x-1" style={{ fontSize: 18, color: "var(--icon-primary)" }} />
        </span>
      )}
    </>
  );
  // A toggle row carries its own control, so it's a plain div; navigable rows are buttons.
  return trailing ? (
    <div className={`w-full flex items-center gap-3 px-[15px] py-3 ${border}`}>{body}</div>
  ) : (
    <button type="button" onClick={onClick} className={`group w-full flex items-center gap-3 px-[15px] py-3 text-left ${border}`}>
      {body}
    </button>
  );
}

/** Text fields editable one-at-a-time via a single-input sheet. */
type FieldKey = "companyName" | "email" | "registrationNumber" | "phone" | "website" | "address" | "city" | "state" | "zip" | "country";
interface FieldMeta { label: string; placeholder: string; hint?: string; type?: string; required?: boolean }
const FIELD_META: Record<FieldKey, FieldMeta> = {
  companyName: { label: "Company name", placeholder: "Statrys Limited", hint: "The name shown on every invoice.", required: true },
  email: { label: "Email address", type: "email", placeholder: "billing@company.com", hint: "Where customers can reach you about invoices.", required: true },
  registrationNumber: { label: "Registration number", placeholder: "12345678", hint: "Your official company registration number.", required: true },
  phone: { label: "Phone number", placeholder: "+852 1234 5678", hint: "Shown on invoices for customer queries." },
  website: { label: "Website", placeholder: "https://company.com", hint: "e.g. yourcompany.com" },
  address: { label: "Address", placeholder: "123 Queen's Road Central", hint: "Street address shown on your invoices.", required: true },
  city: { label: "City", placeholder: "Select", hint: "The city of your registered address.", required: true },
  state: { label: "State / province", placeholder: "Select", hint: "Leave blank if not applicable." },
  zip: { label: "Zip / postal code", placeholder: "Enter zip or postal code", hint: "Postal or ZIP code of your address.", required: true },
  country: { label: "Country", placeholder: "Select", hint: "Country where your business operates.", required: true },
};

type SheetKey = "identity" | "details" | "address" | "currency" | "payment" | null;
const DETAIL_FIELDS: FieldKey[] = ["registrationNumber", "phone", "website"];
const ADDRESS_FIELDS: FieldKey[] = ["address", "city", "state", "zip", "country"];

/** Full country list for the dropdown (alphabetical). */
const COUNTRIES = [
  "Australia", "Brazil", "Canada", "China", "France", "Germany", "Hong Kong", "India",
  "Indonesia", "Ireland", "Italy", "Japan", "Malaysia", "Mexico", "Netherlands",
  "New Zealand", "Singapore", "Spain", "United Kingdom", "United States",
];

/** Country → its states/provinces and cities (demo data). Absent / empty → free-text input. */
const COUNTRY_DATA: Record<string, { states: string[]; cities: string[] }> = {
  "Hong Kong": { states: [], cities: ["Hong Kong Island", "Kowloon", "New Territories"] },
  Singapore: { states: [], cities: ["Singapore"] },
  "United States": { states: ["California", "New York", "Texas", "Florida", "Washington"], cities: [] },
  "United Kingdom": { states: ["England", "Scotland", "Wales", "Northern Ireland"], cities: ["London", "Manchester", "Birmingham", "Edinburgh"] },
  Australia: { states: ["New South Wales", "Victoria", "Queensland"], cities: ["Sydney", "Melbourne", "Brisbane"] },
};

/** Countries without postal codes — hide the Zip field for these (e.g. Hong Kong). */
const NO_POSTAL_COUNTRIES = ["Hong Kong"];

const COUNTRY_FLAGS: Record<string, string> = {
  Australia: "🇦🇺", Brazil: "🇧🇷", Canada: "🇨🇦", China: "🇨🇳", France: "🇫🇷", Germany: "🇩🇪",
  "Hong Kong": "🇭🇰", India: "🇮🇳", Indonesia: "🇮🇩", Ireland: "🇮🇪", Italy: "🇮🇹", Japan: "🇯🇵",
  Malaysia: "🇲🇾", Mexico: "🇲🇽", Netherlands: "🇳🇱", "New Zealand": "🇳🇿", Singapore: "🇸🇬",
  Spain: "🇪🇸", "United Kingdom": "🇬🇧", "United States": "🇺🇸",
};

/** Labeled tappable dropdown field (opens an option sheet). */
function PickerField({ label, value, placeholder, leading, onClick }: { label?: string; value: string; placeholder: string; leading?: React.ReactNode; onClick: () => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="body-md text-[#1b1b1b]" style={FONT}>{label}</span>}
      <button
        type="button"
        onClick={onClick}
        className="flex items-center justify-between gap-2 rounded-xl border border-[rgba(160,160,160,0.4)] bg-white px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 min-w-0">
          {leading}
          <span className="text-[15px] truncate" style={{ ...FONT, color: value ? "#1b1b1b" : "#9ca3af" }}>{value || placeholder}</span>
        </span>
        <ChevronDown size={18} className="text-[#808080] shrink-0" />
      </button>
    </div>
  );
}

interface InvoiceSettingsProps {
  initial?: CompanySettings;
  /** Leaving the screen persists the live edits (no explicit Save button). */
  onExit?: (settings: CompanySettings) => void;
}

/**
 * Invoice Settings (DES-764) — account-level company info, logo, and default currency,
 * set once and auto-applied to every invoice (not editable per-invoice). Identity-first
 * layout: logo+name header on top, then detail-list cards (each row → single-field sheet).
 * Edits apply live; leaving persists. Bottom CTA previews the invoice template.
 */
export function InvoiceSettings({ initial = DEFAULT_SETTINGS, onExit }: InvoiceSettingsProps) {
  const [s, setS] = useState<CompanySettings>(initial);
  const [sheet, setSheet] = useState<SheetKey>(null);
  // Snapshot taken when a sheet opens, so "Save changes" enables only after an actual edit.
  const [baseline, setBaseline] = useState<CompanySettings | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  // Active dropdown (country / city / state) inside the Business Address sheet.
  const [picker, setPicker] = useState<{ field: "country" | "city" | "state"; title: string; options: string[] } | null>(null);
  const [pickerQuery, setPickerQuery] = useState("");

  const openSheet = (k: SheetKey) => { setBaseline(s); setLogoError(null); setSheet(k); };
  const openPicker = (p: { field: "country" | "city" | "state"; title: string; options: string[] }) => { setPickerQuery(""); setPicker(p); };

  /** Apply a dropdown choice — changing country resets the dependent city + state. */
  const selectOption = (val: string) => {
    if (!picker) return;
    if (picker.field === "country") setS((p) => ({ ...p, country: val, state: "", city: "", zip: NO_POSTAL_COUNTRIES.includes(val) ? "" : p.zip }));
    else set(picker.field, val);
    setPicker(null);
  };

  const set = <K extends keyof CompanySettings>(k: K, v: CompanySettings[K]) => setS((p) => ({ ...p, [k]: v }));
  const cur = CURRENCIES.find((c) => c.code === s.currency);
  const companyInitial = (s.companyName.trim()[0] || "?").toUpperCase();

  // Required-field gaps surface inline as red "Required" right away (no Save gate).
  const errs = {
    companyName: !s.companyName.trim(),
    registrationNumber: !s.registrationNumber.trim(),
    email: !EMAIL_RE.test(s.email.trim()),
    address: !s.address.trim(),
    city: !s.city.trim(),
    zip: !s.zip.trim(),
    country: !s.country.trim(),
  };
  // A field is OK when filled (email must also be valid); optional fields may be blank.
  // Each section's Done is disabled until all its required fields are OK.
  const fieldOk = (k: FieldKey) => {
    const v = s[k].trim();
    if (k === "email") return EMAIL_RE.test(v);
    return FIELD_META[k].required ? v.length > 0 : true;
  };
  const zipShown = !NO_POSTAL_COUNTRIES.includes(s.country);
  const companyValid = fieldOk("companyName") && fieldOk("email");
  const detailsValid = DETAIL_FIELDS.every(fieldOk);
  const addressValid = fieldOk("country") && fieldOk("city") && fieldOk("address") && (!zipShown || fieldOk("zip"));

  // Has the open section changed since it was opened? "Save changes" enables only when it has.
  const dirty = (() => {
    if (!baseline) return false;
    if (sheet === "identity") return s.companyName !== baseline.companyName || s.email !== baseline.email || JSON.stringify(s.logo) !== JSON.stringify(baseline.logo);
    if (sheet === "details") return DETAIL_FIELDS.some((k) => s[k] !== baseline[k]);
    if (sheet === "address") return ADDRESS_FIELDS.some((k) => s[k] !== baseline[k]);
    return false;
  })();

  /** One field's TextInput, configured from FIELD_META — used inside the section sheets. */
  const field = (k: FieldKey) => (
    <TextInput
      label={FIELD_META[k].label}
      type={FIELD_META[k].type}
      placeholder={FIELD_META[k].placeholder}
      required={FIELD_META[k].required}
      showHint={false}
      value={s[k]}
      onChange={(e) => set(k, e.target.value)}
    />
  );

  /** Mock a logo pick (sandbox can't open a real file dialog) → validate against the rules. */
  const pickLogo = () => {
    const file = { name: "company-logo.png", type: "image/png", size: 240_000 };
    if (!LOGO_TYPES.includes(file.type)) { setLogoError("Use a JPG, JPEG, or PNG file."); return; }
    if (file.size > LOGO_MAX_MB * 1024 * 1024) { setLogoError(`Logo must be ${LOGO_MAX_MB} MB or smaller.`); return; }
    setLogoError(null);
    set("logo", { name: file.name, size: file.size });
  };

  const chevron = (
    <ChevronRightIcon className="transition-transform duration-200 group-hover:translate-x-1" style={{ fontSize: 16, color: "var(--icon-primary)" }} />
  );

  return (
    <div className="relative bg-[#F9F5EA] rounded-[48px] overflow-hidden shadow-2xl flex flex-col" style={{ width: 375, height: 812 }}>
      <StatusBar />

      <SheetHeader
        title="Invoice Settings"
        type="inside-page"
        state="fixed"
        leading={
          <HeaderIconButton aria-label="Back" onClick={() => onExit?.(s)}>
            <ChevronLeftIcon />
          </HeaderIconButton>
        }
        trailing={<span className="w-[30px] h-[30px] block" aria-hidden />}
      />

      <div className="flex-1 overflow-y-auto bg-white px-4 pt-5 pb-6 flex flex-col gap-4">
        <p className="text-[14px] leading-[1.4] text-[#808080]" style={FONT}>
          These settings apply to all new sales invoices.
        </p>

        {/* Company — identity (logo + name + email) on top, then details + address */}
        <Group title="Company">
          <button
            type="button"
            onClick={() => openSheet("identity")}
            className="group w-full flex items-center gap-3 px-[15px] py-3 text-left border-b border-[rgba(160,160,160,0.18)]"
          >
            <span className="shrink-0">
              {s.logo ? (
                <LogoMark letter={companyInitial} size={40} />
              ) : (
                <span className="size-10 rounded-[11px] bg-white border border-dashed border-[rgba(160,160,160,0.45)] flex items-center justify-center">
                  <ImageIcon size={18} className="text-[#808080]" />
                </span>
              )}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[15px] font-semibold leading-[1.25] text-[#101828] truncate" style={FONT}>
                {s.companyName || "Add company name"}
              </span>
              <span className="block text-[13px] leading-[1.3] truncate" style={{ ...FONT, color: errs.email ? "#d92d20" : "#808080" }}>
                {s.email || "Add email address"}
              </span>
            </span>
            {chevron}
          </button>
          <Row title="Company Details" subtitle="Registration, phone, website" onClick={() => openSheet("details")} />
          <Row title="Business Address" subtitle="Address, city, country and more" onClick={() => openSheet("address")} last />
        </Group>

        {/* Invoice defaults — currency + receiving account */}
        <Group title="Invoice defaults">
          <Row
            title="Currency"
            subtitle="Default currency for invoices"
            value={cur ? `${cur.flag}  ${cur.code}` : s.currency}
            onClick={() => setSheet("currency")}
          />
          <Row
            title="Payment Method"
            subtitle="Default Account"
            value={formatAccount(s.paymentMethod)}
            onClick={() => setSheet("payment")}
            last
          />
        </Group>

        {/* Notifications — Automatic reminders is a simple on/off toggle (no schedule sub-page). */}
        <Group title="Notifications">
          <Row
            title="Automatic reminders"
            subtitle="Until the invoice is paid"
            last
            trailing={
              <span className="flex items-center gap-2 shrink-0">
                <span className="text-[14px] font-medium text-[#1b1b1b]" style={FONT}>{s.chaserEnabled ? "On" : "Off"}</span>
                <Toggle checked={s.chaserEnabled} onChange={(v) => set("chaserEnabled", v)} aria-label="Automatic reminders" />
              </span>
            }
          />
        </Group>
      </div>

      {/* Identity edit sheet — logo + company name + email */}
      <BottomSheet
        open={sheet === "identity"}
        title="Company Profile"
        onClose={() => setSheet(null)}
        footer={<ButtonDock type="single" overflow primaryLabel="Save changes" primaryDisabled={!(dirty && companyValid)} onPrimary={() => setSheet(null)} homeIndicator />}
      >
        <div className="flex flex-col gap-4">
          {/* Logo */}
          <div className="flex flex-col gap-1.5">
            {s.logo ? (
              <div className="flex items-center gap-3 rounded-xl bg-[#faf9f4] border border-[rgba(160,160,160,0.2)] px-4 py-3">
                <span className="shrink-0"><LogoMark letter={companyInitial} size={40} /></span>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] text-[#1b1b1b] truncate" style={FONT}>{s.logo.name}</p>
                  <p className="text-[12px] text-[#808080]" style={FONT}>{(s.logo.size / 1024).toFixed(0)} KB</p>
                </div>
                <button type="button" onClick={() => set("logo", null)} aria-label="Remove logo" className="shrink-0">
                  <Trash2 size={18} className="text-[#808080]" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={pickLogo}
                className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[rgba(160,160,160,0.5)] bg-[#faf9f4] px-4 py-6 text-center"
              >
                <UploadCloud size={26} strokeWidth={1.75} className="text-[#808080]" />
                <span className="flex flex-col gap-0.5">
                  <span className="text-[14px] leading-[1.3] text-[#1b1b1b]" style={FONT}>Upload company logo</span>
                  <span className="text-[12px] leading-[1.3] text-[#808080]" style={FONT}>JPG or PNG • Up to 10 MB</span>
                </span>
              </button>
            )}
            {logoError && <p className="text-[12px] text-[#d92d20]" style={FONT}>{logoError}</p>}
          </div>

          {field("companyName")}
          {field("email")}
        </div>
      </BottomSheet>

      {/* Company Details — one sheet for the whole section */}
      <BottomSheet
        open={sheet === "details"}
        title="Company Details"
        onClose={() => setSheet(null)}
        footer={<ButtonDock type="single" overflow primaryLabel="Save changes" primaryDisabled={!(dirty && detailsValid)} onPrimary={() => setSheet(null)} homeIndicator />}
      >
        <div className="flex flex-col gap-3">
          {DETAIL_FIELDS.map((k) => <div key={k}>{field(k)}</div>)}
        </div>
      </BottomSheet>

      {/* Business Address — one sheet for the whole section */}
      <BottomSheet
        open={sheet === "address"}
        title="Business Address"
        onClose={() => setSheet(null)}
        heightClass="h-[72%]"
        footer={<ButtonDock type="single" overflow primaryLabel="Save changes" primaryDisabled={!(dirty && addressValid)} onPrimary={() => setSheet(null)} homeIndicator />}
      >
        <div className="flex flex-col gap-3">
          {/* Country first — drives the city/state options below */}
          <PickerField
            value={s.country}
            placeholder="Choose country"
            leading={s.country ? <span className="text-[16px] leading-none">{COUNTRY_FLAGS[s.country] ?? "🌐"}</span> : undefined}
            onClick={() => openPicker({ field: "country", title: "Country", options: COUNTRIES })}
          />

          {/* City — dropdown when the country has preset cities, otherwise free text */}
          {(COUNTRY_DATA[s.country]?.cities.length ?? 0) > 0 ? (
            <PickerField value={s.city} placeholder="Choose city" onClick={() => openPicker({ field: "city", title: "City", options: COUNTRY_DATA[s.country].cities })} />
          ) : (
            field("city")
          )}

          {/* State — only shown when the country has states/provinces */}
          {(COUNTRY_DATA[s.country]?.states.length ?? 0) > 0 && (
            <PickerField value={s.state} placeholder="Choose state / province" onClick={() => openPicker({ field: "state", title: "State / province", options: COUNTRY_DATA[s.country].states })} />
          )}

          {/* Zip — hidden for countries without postal codes (e.g. Hong Kong) */}
          {zipShown && field("zip")}

          {/* Address last */}
          {field("address")}
        </div>
      </BottomSheet>

      {/* Dropdown option picker (country / city / state) — stacks over the Address sheet */}
      <BottomSheet open={!!picker} title={picker?.title ?? ""} onClose={() => setPicker(null)} heightClass="h-[72%]">
        {picker && picker.options.length > 8 && (
          <div className="mb-3">
            <Search size="md" placeholder={`Search ${picker.title.toLowerCase()}`} value={pickerQuery} onChange={(e) => setPickerQuery(e.target.value)} />
          </div>
        )}
        <div className="flex flex-col gap-2">
          {picker?.options
            .filter((o) => o.toLowerCase().includes(pickerQuery.toLowerCase()))
            .map((o) => (
              <Tile
                key={o}
                title={o}
                showDescription={false}
                selected={!!picker.field && s[picker.field] === o}
                showIcon={picker.field === "country"}
                icon={picker.field === "country" ? <span className="text-[16px] leading-none">{COUNTRY_FLAGS[o] ?? "🌐"}</span> : undefined}
                onClick={() => selectOption(o)}
              />
            ))}
        </div>
      </BottomSheet>

      {/* Currency picker (existing component) */}
      <CurrencySheet
        open={sheet === "currency"}
        value={s.currency}
        onClose={() => setSheet(null)}
        onSelect={(code) => { set("currency", code); setSheet(null); }}
      />

      {/* Payment Method — reuses the invoice's Receiving Account picker (Personal Saving = PRIMARY default) */}
      <ReceivingAccountSheet
        open={sheet === "payment"}
        value={s.paymentMethod}
        hideExternal
        onClose={() => setSheet(null)}
        onSelect={(id) => { set("paymentMethod", id); setSheet(null); }}
      />

    </div>
  );
}

export default InvoiceSettings;
