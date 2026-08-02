import { useState } from "react";
import { Camera } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PageAppHeader } from "../components/PageAppHeader";
import { ButtonDock } from "../components/ButtonDock";
import { BottomSheet, stepSlide } from "../components/BottomSheet";
import { TextField } from "../ui/TextField";
import { Tile } from "../ui/Tile";
import { CurrencySheet, CURRENCY_COUNTRY } from "../components/CurrencySheet";
import { ReceivingAccountSheet } from "../components/ReceivingAccountSheet";
import { CountryCodeRows } from "../components/CountryCodeSheet";
import { CountryFlag } from "../components/CountryFlag";
import { Keyboard } from "../components/Keyboard";
import { getAccount } from "../data/receivingAccounts";
import { DEFAULT_SETTINGS } from "../data/settings";
import { DEFAULT_COUNTRY_CODE } from "../data/countryCodes";
import type { CompanySettings } from "../types";
import { PageHeader } from "../ui/PageHeader";
import { ListCard } from "../ui/ListCard";
import { ListRow } from "../ui/ListRow";

import { FONT } from "../lib/theme";
import { scrollFieldIntoView } from "../lib/scrollFieldIntoView";
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

/** Demo company logo — an inline SVG geometric mark on a gradient tile (no external asset;
 *  CSP-safe). Stands in for a real uploaded logo in the prototype. */
function DemoLogo({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" role="img" aria-label="Company logo">
      <defs>
        <linearGradient id="lumenBg" x1="0" y1="0" x2="72" y2="72" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0f766e" />
          <stop offset="1" stopColor="#14b8a6" />
        </linearGradient>
      </defs>
      <rect width="72" height="72" rx="20" fill="url(#lumenBg)" />
      {/* Two interlocking rounded chevrons — a clean, brand-neutral studio mark. */}
      <path d="M23 25 L37 36 L23 47" fill="none" stroke="var(--icon-on-color)" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M37 25 L51 36 L37 47" fill="none" stroke="var(--icon-on-color)" strokeOpacity="0.55" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Same search-mode header trigger as CountrySheet/CountryCodeSheet — tapping it swaps the
 *  sheet's title for a frosted search pill in place, same interaction everywhere in the app. */
function SearchGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M17.4999 17.5001L13.8833 13.8835M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Text fields editable one-at-a-time via a single-input sheet. */
type FieldKey = "companyName" | "email" | "registrationNumber" | "phone" | "website" | "address" | "city" | "state" | "zip" | "country";
interface FieldMeta { label: string; placeholder: string; hint?: string; type?: "email" | "tel"; required?: boolean }
const FIELD_META: Record<FieldKey, FieldMeta> = {
  companyName: { label: "Company name", placeholder: "Statrys Limited", hint: "The name shown on every invoice.", required: true },
  email: { label: "Email address", type: "email", placeholder: "billing@company.com", hint: "Where customers can reach you about invoices.", required: true },
  registrationNumber: { label: "Company Registration Number", placeholder: "12345678", hint: "Your official company registration number.", required: true },
  phone: { label: "Phone number", type: "tel", placeholder: "Enter contact phone number", hint: "Shown on invoices for customer queries." },
  website: { label: "Website", placeholder: "https://company.com", hint: "e.g. yourcompany.com" },
  address: { label: "Address", placeholder: "123 Queen's Road Central", hint: "Street address shown on your invoices.", required: true },
  city: { label: "City", placeholder: "Select", hint: "The city of your registered address." },
  state: { label: "State / province", placeholder: "Select", hint: "Leave blank if not applicable." },
  zip: { label: "Zip / postal code", placeholder: "Enter zip or postal code", hint: "Postal or ZIP code of your address." },
  country: { label: "Country", placeholder: "Select", hint: "Country where your business operates." },
};

type SheetKey = "company" | "address" | "currency" | "payment" | null;
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
  // Search-mode header (Figma node 1333-38370, same interaction as CountrySheet/CountryCodeSheet):
  // the title-row search icon swaps to a frosted search pill in place, back returns to the plain title.
  const [pickerSearchOpen, setPickerSearchOpen] = useState(false);
  const closePickerSearch = () => { setPickerSearchOpen(false); setPickerQuery(""); };
  const [phoneCountry, setPhoneCountry] = useState(DEFAULT_COUNTRY_CODE);
  // Country-code picker is a sub-level of the Company Details sheet (same sheet, swapped header/
  // content — see memory: sub-level-drawer-same-sheet), not a second sheet stacked on top.
  const [phoneCodeOpen, setPhoneCodeOpen] = useState(false);
  const [phoneCodeQuery, setPhoneCodeQuery] = useState("");
  const [phoneCodeSearchOpen, setPhoneCodeSearchOpen] = useState(false);
  const closePhoneCodeSearch = () => { setPhoneCodeSearchOpen(false); setPhoneCodeQuery(""); };
  const [scrolled, setScrolled] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const openSheet = (k: SheetKey) => { setBaseline(s); setLogoError(null); setSheet(k); };
  const openPicker = (p: { field: "country" | "city" | "state"; title: string; options: string[] }) => { closePickerSearch(); setPicker(p); };

  /** Apply a dropdown choice — changing country resets the dependent city + state. */
  const selectOption = (val: string) => {
    if (!picker) return;
    if (picker.field === "country") setS((p) => ({ ...p, country: val, state: "", city: "", zip: NO_POSTAL_COUNTRIES.includes(val) ? "" : p.zip }));
    else set(picker.field, val);
    setPicker(null);
  };

  const set = <K extends keyof CompanySettings>(k: K, v: CompanySettings[K]) => setS((p) => ({ ...p, [k]: v }));
  const payAccount = getAccount(s.paymentMethod);

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
  // DES-764: only Address is required in the Business Address section (Country / City / Zip optional).
  const addressValid = fieldOk("address");

  // Has the open section changed since it was opened? "Save changes" enables only when it has.
  const dirty = (() => {
    if (!baseline) return false;
    if (sheet === "company")
      return (
        s.companyName !== baseline.companyName ||
        s.email !== baseline.email ||
        JSON.stringify(s.logo) !== JSON.stringify(baseline.logo) ||
        DETAIL_FIELDS.some((k) => s[k] !== baseline[k])
      );
    if (sheet === "address") return ADDRESS_FIELDS.some((k) => s[k] !== baseline[k]);
    return false;
  })();

  /** One field's TextField, configured from FIELD_META — used inside the section sheets.
   *  Phone uses TextField's own "mobile" type (flag + dial code + chevron selector) instead of
   *  a hand-rolled one — see memory: no-handrolled-ds-duplicates. */
  const field = (k: FieldKey) => (
    <TextField
      type={k === "phone" ? "mobile" : "text"}
      label={FIELD_META[k].label}
      inputType={FIELD_META[k].type}
      placeholder={FIELD_META[k].placeholder}
      mandatory={FIELD_META[k].required}
      selectorLabel={k === "phone" ? phoneCountry.dialCode : undefined}
      selectorIcon={k === "phone" ? <CountryFlag name={phoneCountry.name} size={20} /> : undefined}
      onSelectorClick={k === "phone" ? () => { closePhoneCodeSearch(); setPhoneCodeOpen(true); } : undefined}
      value={s[k]}
      onChange={(v) => set(k, v)}
      onFocus={(e) => { setKeyboardOpen(true); scrollFieldIntoView(e.currentTarget); }}
      onBlur={() => setKeyboardOpen(false)}
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

  return (
    <div className="relative bg-[var(--bg-beige-primary)] rounded-[48px] overflow-hidden shadow-2xl flex flex-col" style={{ width: 375, height: 812 }}>
      <div
        className="flex-1 overflow-y-auto bg-[var(--bg-beige-primary)]"
        onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
      >
        <PageAppHeader scrolled={scrolled}>
          {/* DS PageHeader (left): big 32px title + subtitle, back chevron only. */}
          <PageHeader
            type="left"
            collapsed={scrolled}
            title="Invoice Settings"
            text="These settings apply to all new sales invoices"
            onBack={() => onExit?.(s)}
            showSearch={false}
          />
        </PageAppHeader>

        <div className="px-4 pt-2 pb-6 flex flex-col gap-4">
        {/* Company — Company Details + Business Address */}
        <ListCard onLayer="beige">
          <ListRow
            label="Company Details"
            description="Registration, phone, website and logo"
            trailing="chevron"
            onClick={() => openSheet("company")}
          />
          <ListRow label="Business Address" description="Address, city, country and more" trailing="chevron" onClick={() => openSheet("address")} last />
        </ListCard>

        {/* Invoice defaults — currency + receiving account */}
        <ListCard onLayer="beige">
          <ListRow
            label="Currency"
            description="Default currency for invoices"
            trailing="chevron"
            value={s.currency}
            valueFlag={<CountryFlag name={CURRENCY_COUNTRY[s.currency] ?? ""} size={16} />}
            onClick={() => setSheet("currency")}
          />
          <ListRow
            label="Payment Method"
            description="Default account"
            trailing="chevron"
            value={payAccount?.name ?? "Select account"}
            valueDescription={payAccount?.number}
            onClick={() => setSheet("payment")}
            last
          />
        </ListCard>

        {/* Notifications — Automatic reminders is a simple on/off toggle (no schedule sub-page). */}
        <ListCard onLayer="beige">
          <ListRow
            label="Automatic reminders"
            description="Email until invoice is paid"
            trailing="toggle"
            checked={s.chaserEnabled}
            onCheckedChange={(v) => set("chaserEnabled", v)}
            last
          />
        </ListCard>
        </div>
      </div>

      {/* Company Details — one sheet for all company identity fields: logo, name, email, then
          registration / phone / website. The phone country-code picker is a sub-level of THIS
          SAME sheet (header/content swap via `phoneCodeOpen`), never a second sheet stacked on
          top — see memory: sub-level-drawer-same-sheet. Its own search is the same title-icon
          swap as the standalone CountrySheet/CountryCodeSheet (`phoneCodeSearchOpen`), not an
          inline search field in the body. No fixed heightClass at all (either step) — it sizes
          to content and only grows into the panel's own 88% cap, scrolling past that, rather
          than pinning to a shorter fixed height while there's still room to grow. */}
      <BottomSheet
        open={sheet === "company"}
        title={phoneCodeOpen ? "Select Country Code" : "Company Details"}
        centerTitle={phoneCodeOpen}
        onBack={
          phoneCodeSearchOpen ? closePhoneCodeSearch
          : phoneCodeOpen ? () => setPhoneCodeOpen(false)
          : undefined
        }
        backLabel="Back to details"
        onClose={() => { setSheet(null); setPhoneCodeOpen(false); closePhoneCodeSearch(); }}
        keyboardOpen={keyboardOpen}
        action={phoneCodeOpen && !phoneCodeSearchOpen ? <SearchGlyph /> : undefined}
        onAction={phoneCodeOpen && !phoneCodeSearchOpen ? () => setPhoneCodeSearchOpen(true) : undefined}
        actionLabel="Search country"
        searchValue={phoneCodeSearchOpen ? phoneCodeQuery : undefined}
        onSearchChange={phoneCodeSearchOpen ? setPhoneCodeQuery : undefined}
        searchPlaceholder="Search Country"
        autoFocusSearch
        footer={
          phoneCodeSearchOpen ? <Keyboard /> :
          phoneCodeOpen ? undefined : (
            <ButtonDock type="single" primaryLabel="Save changes" primaryDisabled={!(dirty && companyValid && detailsValid)} onPrimary={() => setSheet(null)} keyboard={keyboardOpen} />
          )
        }
      >
        <AnimatePresence mode="wait" initial={false}>
          {phoneCodeOpen ? (
            <motion.div key="phoneCode" variants={stepSlide(1)} initial="closed" animate="open" exit="closed">
              <CountryCodeRows
                value={phoneCountry.name}
                query={phoneCodeQuery}
                onSelect={(c) => { setPhoneCountry(c); closePhoneCodeSearch(); setPhoneCodeOpen(false); }}
              />
            </motion.div>
          ) : (
            <motion.div key="details" variants={stepSlide(-1)} initial="closed" animate="open" exit="closed">
              <div className="flex flex-col gap-4">
                {/* Logo — beige monogram preview + "Change Logo" (mock picker; sandbox has no real image). */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-4">
                    <span className="shrink-0"><DemoLogo size={64} /></span>
                    <button type="button" onClick={pickLogo} className="flex items-center gap-1 text-[var(--text-primary)]">
                      <Camera size={16} strokeWidth={1.75} />
                      <span className="text-[16px] font-medium" style={FONT}>Change logo</span>
                    </button>
                  </div>
                  {logoError && <p className="text-[12px] text-[#d92d20]" style={FONT}>{logoError}</p>}
                </div>

                {field("companyName")}
                {field("email")}
                {DETAIL_FIELDS.map((k) => <div key={k}>{field(k)}</div>)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </BottomSheet>

      {/* Business Address — one sheet for the whole section. The country/city/state dropdown
          picker is a sub-level of THIS SAME sheet (header/content swap via `picker`), never a
          second sheet stacked on top — see memory: sub-level-drawer-same-sheet. Search (only
          offered once a list has more than 8 rows) is the same title-icon swap as the standalone
          CountrySheet/CountryCodeSheet, not an inline search field in the body. No fixed
          heightClass at all (either step) — sizes to content, only capped at the panel's own 88%. */}
      <BottomSheet
        open={sheet === "address"}
        title={picker?.title ?? "Business Address"}
        centerTitle={!!picker}
        onBack={
          pickerSearchOpen ? closePickerSearch
          : picker ? () => setPicker(null)
          : undefined
        }
        backLabel="Back to address"
        onClose={() => { setSheet(null); setPicker(null); closePickerSearch(); }}
        keyboardOpen={keyboardOpen}
        action={picker && picker.options.length > 8 && !pickerSearchOpen ? <SearchGlyph /> : undefined}
        onAction={picker && picker.options.length > 8 && !pickerSearchOpen ? () => setPickerSearchOpen(true) : undefined}
        actionLabel={`Search ${picker?.title.toLowerCase() ?? ""}`}
        searchValue={pickerSearchOpen ? pickerQuery : undefined}
        onSearchChange={pickerSearchOpen ? setPickerQuery : undefined}
        searchPlaceholder={`Search ${picker?.title.toLowerCase() ?? ""}`}
        autoFocusSearch
        footer={
          pickerSearchOpen ? <Keyboard /> :
          picker ? undefined : (
            <ButtonDock type="single" primaryLabel="Save changes" primaryDisabled={!(dirty && addressValid)} onPrimary={() => setSheet(null)} keyboard={keyboardOpen} />
          )
        }
      >
        <AnimatePresence mode="wait" initial={false}>
          {picker ? (
            <motion.div key="picker" variants={stepSlide(1)} initial="closed" animate="open" exit="closed">
              <div className="flex flex-col gap-2">
                {picker.options
                  .filter((o) => o.toLowerCase().includes(pickerQuery.toLowerCase()))
                  .map((o) => (
                    <Tile
                      key={o}
                      size="sm"
                      title={o}
                      flag={picker.field === "country" ? <CountryFlag name={o} size={30} /> : undefined}
                      selected={s[picker.field] === o}
                      trailing={s[picker.field] === o ? "check" : "none"}
                      onClick={() => selectOption(o)}
                    />
                  ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="address" variants={stepSlide(-1)} initial="closed" animate="open" exit="closed">
              <div className="flex flex-col gap-4">
                {/* Country first — drives the city/state options below. Dropdown TextField to match
                    the Create/Edit Customer fields (plain text + chevron, no flag icon — matches Figma). */}
                <TextField
                  type="dropdown"
                  label={FIELD_META.country.label}
                  placeholder="Select country"
                  mandatory={FIELD_META.country.required}
                  value={s.country}
                  onClick={() => openPicker({ field: "country", title: "Country", options: COUNTRIES })}
                />

                {/* City — dropdown when the country has preset cities, otherwise free text */}
                {(COUNTRY_DATA[s.country]?.cities.length ?? 0) > 0 ? (
                  <TextField
                    type="dropdown"
                    label={FIELD_META.city.label}
                    placeholder="Select city"
                    mandatory={FIELD_META.city.required}
                    value={s.city}
                    onClick={() => openPicker({ field: "city", title: "City", options: COUNTRY_DATA[s.country].cities })}
                  />
                ) : (
                  field("city")
                )}

                {/* State — only shown when the country has states/provinces */}
                {(COUNTRY_DATA[s.country]?.states.length ?? 0) > 0 && (
                  <TextField
                    type="dropdown"
                    label={FIELD_META.state.label}
                    placeholder="Select state / province"
                    value={s.state}
                    onClick={() => openPicker({ field: "state", title: "State / province", options: COUNTRY_DATA[s.country].states })}
                  />
                )}

                {/* Zip — hidden for countries without postal codes (e.g. Hong Kong) */}
                {zipShown && field("zip")}

                {/* Address last */}
                {field("address")}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
