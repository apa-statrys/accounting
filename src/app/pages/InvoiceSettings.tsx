import { useRef, useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PageAppHeader } from "../components/PageAppHeader";
import { ButtonDock } from "../components/ButtonDock";
import { Toast } from "../components/Toast";
import { BottomSheet, stepSlide } from "../components/BottomSheet";
import { TextField } from "../ui/TextField";
import { Tile } from "../ui/Tile";
import { Search } from "../ui/Search";
import { CurrencySheet, CURRENCY_COUNTRY } from "../components/CurrencySheet";
import { ReceivingAccountSheet } from "../components/ReceivingAccountSheet";
import { CountryCodeSheet } from "../components/CountryCodeSheet";
import { CountryFlag } from "../components/CountryFlag";
import { Keyboard } from "../components/Keyboard";
import { formatAccount } from "../data/receivingAccounts";
import { DEFAULT_SETTINGS } from "../data/settings";
import { DEFAULT_COUNTRY_CODE } from "../data/countryCodes";
import type { CompanySettings } from "../types";
import { PageHeader } from "../ui/PageHeader";
import { ListCard } from "../ui/ListCard";
import { ListRow } from "../ui/ListRow";
import { Button } from "../ui/Button";
import { Overlay } from "../ui/Overlay";

import { FONT, PAGE_PUSH_TRANSITION } from "../lib/theme";
import { scrollFieldIntoView } from "../lib/scrollFieldIntoView";
import { focusFirstInvalidField } from "../lib/focusFirstInvalidField";
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
  city: { label: "City", placeholder: "Enter city", hint: "The city of your registered address." },
  state: { label: "State / province", placeholder: "Enter state or province", hint: "Leave blank if not applicable." },
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
 * Currency / Payment Method / Automatic reminders commit the moment you pick them (no Save step
 * of their own — same as everywhere else those single-choice pickers are used). Company Details /
 * Business Address are real multi-field edit forms though, so they follow the app's standard edit
 * pattern instead: edits happen against a local draft, Save commits it, and the header back
 * chevron confirms via "Unsaved changes?" when dirty (see `draft`/`view`).
 */
export function InvoiceSettings({ initial = DEFAULT_SETTINGS, onExit }: InvoiceSettingsProps) {
  const [s, setS] = useState<CompanySettings>(initial);
  const [sheet, setSheet] = useState<SheetKey>(null);
  // Snapshot taken when a sheet opens, so the "Save" CTA only renders once something's changed.
  const [baseline, setBaseline] = useState<CompanySettings | null>(null);
  // Company Details / Business Address edit against this local draft, not `s` directly — `s` stays
  // the persisted settings (what the main list rows show) until Save actually commits the draft
  // into it. Without this, typing a field mutated `s` immediately with no way to discard, so the
  // header back chevron's "Unsaved changes?" confirm and the dock's own Cancel would've had
  // nothing real to discard — same edit-vs-live-mutation gap the app's other edit forms avoid
  // (AddCustomerPage, AddInvoiceDetails, CreditNoteForm, AddServicesSheet all edit a local draft).
  const [draft, setDraft] = useState<CompanySettings | null>(null);
  const editingSection = sheet === "company" || sheet === "address";
  // Read source for anything rendered inside the Company Details / Business Address pages —
  // falls back to `s` only for the brief instant before `openSheet` seeds `draft`.
  const view = draft ?? s;
  // form-cta-validation: each sheet's CTA is never disabled — a failed Save reveals inline errors
  // on every offending field and focuses the first one, instead. Flips true on a failed Save
  // attempt within that sheet; reset whenever a sheet (re)opens.
  const [companyAttempted, setCompanyAttempted] = useState(false);
  const [addressAttempted, setAddressAttempted] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  // Edit Logo (preview + reposition before committing) — a freshly picked file lands here first
  // rather than writing straight to the draft, so Save/back-cancel has something real to
  // commit/discard.
  const [logoEditOpen, setLogoEditOpen] = useState(false);
  const [pendingLogo, setPendingLogo] = useState<{ name: string; size: number; url: string } | null>(null);
  // Real <input type="file"> — the button below just proxies its click (no styleable native
  // file input), same as any hidden-input file-picker pattern.
  const logoInputRef = useRef<HTMLInputElement>(null);
  // Country picker (only dropdown left in Business Address — City/State are plain free-text
  // fields, decided 2026-08-20, so there's no per-country options list to drive anymore).
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [countryQuery, setCountryQuery] = useState("");
  // Search-mode header (same interaction as CountrySheet/CountryCodeSheet, decided 2026-08-20): a
  // plain non-sticky `ui/Search` row sits in the list as the entry point; tapping it swaps the
  // sticky title row for a frosted search pill in place, back returns to the plain title.
  const [countrySearchOpen, setCountrySearchOpen] = useState(false);
  const closeCountrySearch = () => { setCountrySearchOpen(false); setCountryQuery(""); };
  const [phoneCountry, setPhoneCountry] = useState(DEFAULT_COUNTRY_CODE);
  // Country-code picker — a standalone CountryCodeSheet stacked on top of the Company Details
  // page (same pattern AddCustomerPage uses), not a sub-level swap — pages don't have a "panel"
  // to swap steps within the way a BottomSheet did.
  const [phoneCodeOpen, setPhoneCodeOpen] = useState(false);
  // Success toast (PMT-41258 AC2-AC4: every save path here — Company Details/Business Address'
  // own Save, and Currency/Payment Method/Automatic reminders' auto-save-on-pick — shows one).
  // Single shared flag since only one can ever be showing at a time.
  const [savedToastOpen, setSavedToastOpen] = useState(false);
  const flashSaved = () => setSavedToastOpen(true);
  const [scrolled, setScrolled] = useState(false);
  // Company Details / Business Address are separate full pages now (each with their own scroll
  // container), so each needs its own header-frost scroll flag — sharing the main page's `scrolled`
  // would let a scroll inside one of them corrupt the main list header's frost state.
  const [companyScrolled, setCompanyScrolled] = useState(false);
  const [addressScrolled, setAddressScrolled] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const openSheet = (k: SheetKey) => { setBaseline(s); setDraft(s); setLogoError(null); setCompanyAttempted(false); setAddressAttempted(false); setSheet(k); };
  const openCountryPicker = () => { closeCountrySearch(); setCountryPickerOpen(true); };
  // Edit-only back — same "Unsaved changes?" confirm shape as every other edit flow in the app.
  const [discardSettingsOpen, setDiscardSettingsOpen] = useState(false);
  const requestSheetBack = () => (dirty ? setDiscardSettingsOpen(true) : setSheet(null));

  /** Pick a country — City/State are free text now (decided 2026-08-20) so nothing dependent on
   *  the old options lists needs resetting; only Zip still reacts (no-postal countries). */
  const selectCountry = (val: string) => {
    setDraft((p) => (p ? { ...p, country: val, zip: NO_POSTAL_COUNTRIES.includes(val) ? "" : p.zip } : p));
    setCountryPickerOpen(false);
  };

  // Company Details / Business Address route through `draft` (discardable); every other field
  // (Currency, Payment Method, the Automatic reminders toggle) has no Save step of its own — picking
  // one commits immediately — so it writes straight to `s`.
  const set = <K extends keyof CompanySettings>(k: K, v: CompanySettings[K]) => {
    if (editingSection) setDraft((p) => (p ? { ...p, [k]: v } : p));
    else setS((p) => ({ ...p, [k]: v }));
  };

  // A field is OK when filled (email must also be valid); optional fields may be blank.
  const fieldOk = (k: FieldKey) => {
    const v = view[k].trim();
    if (k === "email") return EMAIL_RE.test(v);
    return FIELD_META[k].required ? v.length > 0 : true;
  };
  // Inline error message for a field, or false when it's fine — mirrors AddCustomerPage's `err`.
  const fieldError = (k: FieldKey): string | false => {
    if (fieldOk(k)) return false;
    if (k === "email") return view.email.trim() ? "Enter a valid email address" : "Email address is required";
    return `${FIELD_META[k].label} is required`;
  };
  const zipShown = !NO_POSTAL_COUNTRIES.includes(view.country);
  const companyValid = fieldOk("companyName") && fieldOk("email");
  const detailsValid = DETAIL_FIELDS.every(fieldOk);
  // DES-764: only Address is required in the Business Address section (Country / City / Zip optional).
  const addressValid = fieldOk("address");

  // Has the open section changed since it was opened? The CTA itself is only rendered once dirty —
  // an untouched sheet has nothing to save (see the ButtonDock footers below).
  const dirty = (() => {
    if (!baseline || !draft) return false;
    if (sheet === "company")
      return (
        draft.companyName !== baseline.companyName ||
        draft.email !== baseline.email ||
        JSON.stringify(draft.logo) !== JSON.stringify(baseline.logo) ||
        DETAIL_FIELDS.some((k) => draft[k] !== baseline[k])
      );
    if (sheet === "address") return ADDRESS_FIELDS.some((k) => draft[k] !== baseline[k]);
    return false;
  })();

  // form-cta-validation: the CTA is never disabled — a failed Save reveals every offending field's
  // inline error at once and focuses the first one, instead of just refusing to proceed. A valid
  // Save commits the draft into `s` — this is the only place Company Details / Business Address
  // edits actually persist; Cancel/back-without-saving just closes, leaving `s` untouched.
  const handleSaveCompany = () => {
    if (companyValid && detailsValid) { setS(draft ?? s); setSheet(null); flashSaved(); return; }
    setCompanyAttempted(true);
    const order: FieldKey[] = ["companyName", "email", ...DETAIL_FIELDS];
    const firstInvalid = order.find((k) => !fieldOk(k));
    if (firstInvalid) focusFirstInvalidField(`settings-${firstInvalid}`);
  };
  const handleSaveAddress = () => {
    if (addressValid) { setS(draft ?? s); setSheet(null); flashSaved(); return; }
    setAddressAttempted(true);
    focusFirstInvalidField("settings-address");
  };
  const handleSaveActiveSection = () => (sheet === "company" ? handleSaveCompany() : sheet === "address" ? handleSaveAddress() : undefined);

  /** One field's TextField, configured from FIELD_META — used inside the section sheets.
   *  Phone uses TextField's own "mobile" type (flag + dial code + chevron selector) instead of
   *  a hand-rolled one — see memory: no-handrolled-ds-duplicates. `attempted` gates whether this
   *  field's own inline error shows yet (that sheet's own failed-Save flag). */
  const field = (k: FieldKey, attempted: boolean) => {
    const err = attempted ? fieldError(k) : false;
    return (
    <TextField
      type={k === "phone" ? "mobile" : "text"}
      label={FIELD_META[k].label}
      inputType={FIELD_META[k].type}
      placeholder={FIELD_META[k].placeholder}
      mandatory={FIELD_META[k].required}
      selectorLabel={k === "phone" ? phoneCountry.dialCode : undefined}
      selectorIcon={k === "phone" ? <CountryFlag name={phoneCountry.name} size={20} /> : undefined}
      onSelectorClick={k === "phone" ? () => setPhoneCodeOpen(true) : undefined}
      value={view[k]}
      onChange={(v) => set(k, v)}
      onFocus={(e) => { setKeyboardOpen(true); scrollFieldIntoView(e.currentTarget); }}
      onBlur={() => setKeyboardOpen(false)}
      error={!!err}
      caption={err || undefined}
      dataReq={`settings-${k}`}
    />
    );
  };

  /** Opens the real OS file picker (the visible button just proxies this hidden input's click —
   *  a native file input can't be styled directly). */
  const pickLogo = () => logoInputRef.current?.click();

  /** A real file was picked → validate against the rules, then open Edit Logo to preview/
   *  reposition the ACTUAL image before it's committed (object URL, never uploaded anywhere —
   *  this prototype has no backend). */
  const onLogoFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // let picking the same file again still fire this handler
    if (!file) return;
    if (!LOGO_TYPES.includes(file.type)) { setLogoError("Use a JPG, JPEG, or PNG file."); return; }
    if (file.size > LOGO_MAX_MB * 1024 * 1024) { setLogoError(`Logo must be ${LOGO_MAX_MB} MB or smaller.`); return; }
    setLogoError(null);
    setPendingLogo({ name: file.name, size: file.size, url: URL.createObjectURL(file) });
    setLogoEditOpen(true);
  };
  const saveLogoEdit = () => {
    if (pendingLogo) {
      // Replacing an earlier real upload — release its object URL now that nothing references it.
      if (view.logo?.url) URL.revokeObjectURL(view.logo.url);
      set("logo", pendingLogo);
    }
    setLogoEditOpen(false);
    setPendingLogo(null);
  };
  // Nothing's been committed yet either way, so back just discards — no separate "unsaved
  // changes?" confirm needed the way Company Details' own back chevron has one.
  const cancelLogoEdit = () => {
    if (pendingLogo?.url) URL.revokeObjectURL(pendingLogo.url);
    setLogoEditOpen(false);
    setPendingLogo(null);
  };

  // Unsaved-changes confirm (Company Details / Business Address, dirty only) — same shape as
  // AddCustomerPage/AddInvoiceDetails/CreditNoteForm's back-tap confirm. Save persists via the same
  // handler the dock's own Save button calls (still runs validation); Cancel discards by just
  // closing — `s` was never touched mid-edit, so there's nothing else to roll back. Rendered inside
  // EACH page's own motion.div (never as a plain top-level sibling) — BottomSheet's overlay is
  // `position: fixed` at z-index 40, which only stacks above a page's own z-50 once it's nested
  // inside that page's transformed motion.div (Framer sets an inline `transform`, which contains
  // fixed descendants to that subtree); as a bare sibling it silently rendered BEHIND the page.
  const unsavedSettingsConfirm = (
    <BottomSheet
      open={discardSettingsOpen}
      title="Unsaved changes?"
      onClose={() => setDiscardSettingsOpen(false)}
      hideClose
      compact
      footer={
        <ButtonDock
          type="double"
          primaryLabel="Save"
          secondaryLabel="Cancel"
          onPrimary={() => { setDiscardSettingsOpen(false); handleSaveActiveSection(); }}
          onSecondary={() => { setDiscardSettingsOpen(false); setSheet(null); }}
        />
      }
    >
      <p className="body-sm" style={{ ...FONT, color: "var(--text-secondary)" }}>
        You have unsaved changes. Save them before you go, or cancel to discard them.
      </p>
    </BottomSheet>
  );

  return (
    <div className="relative bg-[var(--bg-neutral-tertiary)] rounded-[48px] overflow-hidden shadow-2xl flex flex-col" style={{ width: 375, height: 812 }}>
      <div
        className="flex-1 overflow-y-auto bg-[var(--bg-neutral-tertiary)]"
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
        <ListCard onLayer="gray">
          <ListRow
            label="Company Details"
            description="Registration, phone, website and logo"
            trailing="chevron"
            onClick={() => openSheet("company")}
          />
          <ListRow label="Business Address" description="Address, city, country and more" trailing="chevron" onClick={() => openSheet("address")} last />
        </ListCard>

        {/* Invoice defaults — currency + receiving account */}
        <ListCard onLayer="gray">
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
            value={formatAccount(s.paymentMethod) || "Select account"}
            onClick={() => setSheet("payment")}
            last
          />
        </ListCard>

        {/* Notifications — Automatic reminders is a simple on/off toggle (no schedule sub-page). */}
        <ListCard onLayer="gray">
          <ListRow
            label="Automatic reminders"
            description="Email sent 7 days before the due date"
            trailing="toggle"
            checked={s.chaserEnabled}
            onCheckedChange={(v) => { set("chaserEnabled", v); flashSaved(); }}
            last
          />
        </ListCard>
        </div>
      </div>

      {/* Company Details — a full pushed page (decided 2026-08-11: over this app's 3-field
          sheet-vs-page threshold — logo + 5 text fields) for all company identity fields: logo,
          name, email, then registration / phone / website. The phone country-code picker is a
          standalone CountryCodeSheet stacked on top (same pattern AddCustomerPage uses) — pages
          don't have a "panel" to swap sub-level steps within the way a BottomSheet did. */}
      <AnimatePresence>
      {sheet === "company" && (
        <motion.div
          className="absolute inset-0 z-50 bg-[var(--bg-neutral-tertiary)] rounded-[48px] overflow-hidden flex flex-col"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={PAGE_PUSH_TRANSITION}
        >
          <div
            className="flex-1 overflow-y-auto thin-scrollbar"
            onScroll={(e) => setCompanyScrolled(e.currentTarget.scrollTop > 4)}
          >
            <PageAppHeader scrolled={companyScrolled}>
              <PageHeader type="center" title="Company Details" onBack={requestSheetBack} showSearch={false} />
            </PageAppHeader>

            <div className={`px-4 pt-5 flex flex-col gap-4 ${keyboardOpen ? "pb-[380px]" : "pb-28"}`}>
              {/* Logo — centered tile + secondary CTA below (not the old side-by-side thumbnail +
                  text-link). No logo yet defaults to a generic image-icon placeholder — same
                  140px tile as the has-logo state (no separate/smaller nested box for the
                  placeholder), just an icon centered directly in it instead of a photo. Once a
                  real file's picked, its actual image shows here (object URL — DemoLogo is only a
                  fallback for the no-url edge case). */}
              <div className="flex flex-col items-center gap-3 pb-1">
                <div className="relative size-[140px] rounded-[28px] overflow-hidden bg-[var(--bg-neutral-secondary)] flex items-center justify-center">
                  {view.logo ? (
                    view.logo.url ? (
                      <img src={view.logo.url} alt="Company logo" className="size-full object-cover" />
                    ) : (
                      <DemoLogo size={140} />
                    )
                  ) : (
                    <ImageIcon size={40} strokeWidth={1.5} color="var(--icon-placeholder)" />
                  )}
                </div>
                <Button hierarchy="secondary" size="sm" label={view.logo ? "Change logo" : "Upload logo"} onClick={pickLogo} />
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={onLogoFilePicked}
                  className="hidden"
                />
                <AnimatePresence initial={false}>
                  {logoError && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="text-[12px] text-[#d92d20] overflow-hidden text-center"
                      style={FONT}
                    >
                      {logoError}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {field("companyName", companyAttempted)}
              {field("email", companyAttempted)}
              {DETAIL_FIELDS.map((k) => <div key={k}>{field(k, companyAttempted)}</div>)}
            </div>
          </div>

          <ButtonDock
            type="single"
            sticky
            primaryLabel="Save"
            primaryDisabled={!dirty}
            onPrimary={handleSaveCompany}
            keyboard={keyboardOpen}
          />

          <CountryCodeSheet
            open={phoneCodeOpen}
            value={phoneCountry.name}
            onClose={() => setPhoneCodeOpen(false)}
            onSelect={(c) => { setPhoneCountry(c); setPhoneCodeOpen(false); }}
          />

          {/* Edit Logo — full-page crop over the still-mounted, dimmed Company Details page (this
              app's own sheet-over-page scrim, ui/Overlay — never a separate solid-black page).
              The crop image itself is edge-to-edge (no framing card/box around it — same bare
              treatment as before), draggable, with a plain Cancel/Choose text row near
              the bottom sitting directly on the scrim rather than a separate opaque footer bar.
              Choose commits `pendingLogo` into the draft; Cancel/tapping the scrim both just
              discard it — nothing's been saved either way, so this doesn't need its own "Unsaved
              changes?" confirm the way Company Details itself does. */}
          <AnimatePresence>
          {logoEditOpen && (
            <motion.div className="absolute inset-0 z-50 overflow-hidden rounded-[48px] flex flex-col items-center justify-center gap-6" initial="closed" animate="open" exit="closed">
              <Overlay onClick={cancelLogoEdit} />

              {/* Crop viewport — full frame width, no wrapping card/background of its own (bare
                  image, edge-to-edge). The picked image renders oversized inside it and clips on
                  overflow; dragging pans it. Numeric drag bounds (not a ref-based container) since
                  the point is exactly the opposite of framer's usual "keep it inside the box" —
                  here the image is meant to be BIGGER than the frame, so there's room to pan. */}
              <div className="relative w-full aspect-square overflow-hidden">
                {(() => {
                  const maxOffset = Math.max(0, (500 - 375) / 2);
                  return (
                    <motion.div
                      drag
                      dragConstraints={{ left: -maxOffset, right: maxOffset, top: -maxOffset, bottom: maxOffset }}
                      dragElastic={0.1}
                      dragMomentum={false}
                      className="absolute inset-0 flex items-center justify-center cursor-grab active:cursor-grabbing"
                    >
                      {pendingLogo && (
                        <img
                          src={pendingLogo.url}
                          alt="Logo preview"
                          width={500}
                          height={500}
                          className="object-cover pointer-events-none"
                        />
                      )}
                    </motion.div>
                  );
                })()}
                {/* Rule-of-thirds guide — purely a visual aid, not an actual crop boundary (the
                    whole viewport IS the crop). */}
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute left-0 right-0 top-1/3 h-px bg-white/40" />
                  <div className="absolute left-0 right-0 top-2/3 h-px bg-white/40" />
                  <div className="absolute top-0 bottom-0 left-1/3 w-px bg-white/40" />
                  <div className="absolute top-0 bottom-0 left-2/3 w-px bg-white/40" />
                </div>
              </div>

              {/* Plain Cancel/Choose text row, floating directly on the scrim. */}
              <div className="absolute inset-x-6 bottom-8 flex items-center justify-between">
                <button type="button" onClick={cancelLogoEdit} className="text-[17px] text-white">Cancel</button>
                <button type="button" onClick={saveLogoEdit} className="text-[17px] font-medium text-white">Choose</button>
              </div>
            </motion.div>
          )}
          </AnimatePresence>

          {unsavedSettingsConfirm}
        </motion.div>
      )}
      </AnimatePresence>

      {/* Business Address — a full pushed page (decided 2026-08-11: over this app's 3-field
          sheet-vs-page threshold — up to 5 fields) for the whole section. City/State are plain
          free-text fields (decided 2026-08-20); Country is the only dropdown left, a standalone
          BottomSheet stacked on top (same shape as CountrySheet/CountryCodeSheet) — pages don't
          have a "panel" to swap sub-level steps within the way a BottomSheet did. */}
      <AnimatePresence>
      {sheet === "address" && (
        <motion.div
          className="absolute inset-0 z-50 bg-[var(--bg-neutral-tertiary)] rounded-[48px] overflow-hidden flex flex-col"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={PAGE_PUSH_TRANSITION}
        >
          <div
            className="flex-1 overflow-y-auto thin-scrollbar"
            onScroll={(e) => setAddressScrolled(e.currentTarget.scrollTop > 4)}
          >
            <PageAppHeader scrolled={addressScrolled}>
              <PageHeader type="center" title="Business Address" onBack={requestSheetBack} showSearch={false} />
            </PageAppHeader>

            <div className={`px-4 pt-5 flex flex-col gap-4 ${keyboardOpen ? "pb-[380px]" : "pb-28"}`}>
              {/* Country first. Dropdown TextField to match the Create/Edit Customer fields (plain
                  text + chevron, no flag icon — matches Figma). */}
              <TextField
                type="dropdown"
                label={FIELD_META.country.label}
                placeholder="Select country"
                mandatory={FIELD_META.country.required}
                value={view.country}
                onClick={openCountryPicker}
              />

              {/* City / State — plain free-text fields (decided 2026-08-20, reversed the old
                  per-country dropdown-options behavior) — same as Create/Edit Customer. */}
              {field("city", addressAttempted)}
              {field("state", addressAttempted)}

              {/* Zip — hidden for countries without postal codes (e.g. Hong Kong). */}
              <AnimatePresence>
                {zipShown && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    {field("zip", addressAttempted)}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Address last */}
              {field("address", addressAttempted)}
            </div>
          </div>

          <ButtonDock
            type="single"
            sticky
            primaryLabel="Save"
            primaryDisabled={!dirty}
            onPrimary={handleSaveAddress}
            keyboard={keyboardOpen}
          />

          {/* Country picker — own BottomSheet stacked on top of this page (nested here so it
              z-stacks above it). A plain, non-sticky `ui/Search` row sits in the list as the entry
              point; tapping it hands off to the same header search-pill mode CountrySheet/
              CountryCodeSheet use (decided 2026-08-20 — see those for the full pattern doc). */}
          <BottomSheet
            open={countryPickerOpen}
            title="Country"
            onBack={countrySearchOpen ? closeCountrySearch : undefined}
            onClose={() => { setCountryPickerOpen(false); closeCountrySearch(); }}
            tall
            searchValue={countrySearchOpen ? countryQuery : undefined}
            onSearchChange={countrySearchOpen ? setCountryQuery : undefined}
            searchPlaceholder="Search Country"
            autoFocusSearch
            footer={countrySearchOpen ? <Keyboard /> : undefined}
          >
            {/* Same content-level step transition as CountryCodeSheet — entering/exiting search
                re-animates the row list too, not just the header's title/pill crossfade. */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={countrySearchOpen ? "search" : "list"}
                className="flex flex-col gap-4"
                variants={stepSlide(countrySearchOpen ? 1 : -1)}
                initial="closed"
                animate="open"
                exit="closed"
              >
                {!countrySearchOpen && (
                  <Search value="" onChange={() => {}} placeholder="Search Country" showAction={false} onFocus={() => setCountrySearchOpen(true)} />
                )}
                <div className="flex flex-col gap-2">
                  {COUNTRIES.filter((o) => o.toLowerCase().includes(countryQuery.toLowerCase())).map((o) => (
                    <Tile
                      key={o}
                      size="sm"
                      title={o}
                      flag={<CountryFlag name={o} size={30} />}
                      selected={view.country === o}
                      trailing={view.country === o ? "check" : "none"}
                      onClick={() => selectCountry(o)}
                    />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </BottomSheet>

          {unsavedSettingsConfirm}
        </motion.div>
      )}
      </AnimatePresence>

      {/* Currency picker (existing component) */}
      <CurrencySheet
        open={sheet === "currency"}
        value={s.currency}
        onClose={() => setSheet(null)}
        onSelect={(code) => { set("currency", code); setSheet(null); flashSaved(); }}
      />

      {/* Payment Method — reuses the invoice's Receiving Account picker (Personal Saving = PRIMARY default) */}
      <ReceivingAccountSheet
        open={sheet === "payment"}
        value={s.paymentMethod}
        hideExternal
        onClose={() => setSheet(null)}
        onSelect={(id) => { set("paymentMethod", id); setSheet(null); flashSaved(); }}
      />

      {/* Success toast (PMT-41258 AC2-AC4) — every save path above flashes this same one. */}
      <Toast open={savedToastOpen} message="Changes saved" onDone={() => setSavedToastOpen(false)} />
    </div>
  );
}

export default InvoiceSettings;
