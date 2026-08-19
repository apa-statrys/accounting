import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { PageAppHeader } from "../components/PageAppHeader";
import { PageHeader } from "../ui/PageHeader";
import { TextField } from "../ui/TextField";
import { ButtonDock } from "../components/ButtonDock";
import { BottomSheet } from "../components/BottomSheet";
import { CurrencySheet, CURRENCY_COUNTRY } from "../components/CurrencySheet";
import { CountrySheet } from "../components/CountrySheet";
import { CountryCodeSheet } from "../components/CountryCodeSheet";
import { CountryFlag } from "../components/CountryFlag";
import { Tile } from "../ui/Tile";
import { DEFAULT_COUNTRY_CODE } from "../data/countryCodes";
import type { Customer } from "../types";

import { FONT, avatarTint } from "../lib/theme";
import { scrollFieldIntoView } from "../lib/scrollFieldIntoView";
import { focusFirstInvalidField } from "../lib/focusFirstInvalidField";
// "Details" / "Address" / "Invoice" section headers (Figma "Sales Invoice - Client" node 1333-30838).
const SECTION_TITLE_STYLE = { ...FONT, fontWeight: 700, fontSize: 16, lineHeight: 1.3, color: "var(--text-primary)" } as const;

/** Two-letter initials from a name (skips symbols like "&") — for the duplicate-warning avatar. */
function initials(name: string): string {
  const words = name.split(/\s+/).filter((w) => /[a-z0-9]/i.test(w[0] ?? ""));
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase();
}

import { EMAIL_RE } from "../lib/format";
const PHONE_RE = /^[+()\d][\d\s()-]{5,}$/;
const URL_RE = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/;

/** Countries without postal codes — Zip is hidden (and not required) for these (e.g. Hong Kong). */
const NO_POSTAL_COUNTRIES = ["Hong Kong"];

/** Dev-only demo "someone else's" edit (PageControls "Concurrent edit conflict" toggle, edit mode
 *  only) — a fixed stand-in for what a real concurrent-session save would have changed, since this
 *  prototype has no backend to actually race against. Phone/Address only: identity fields (name,
 *  email) already have their own possible-duplicate warning above, and mixing the two would muddy
 *  which sheet is demonstrating what. */
const CONFLICT_DEMO_PHONE = "+1 415 555 0134";
const CONFLICT_DEMO_ADDRESS = "482 Market Street, Suite 300";

export interface AddCustomerPageProps {
  /** "add" (DES-713) or "edit" (DES-714) — drives the title, CTA label, and dirty-gating. */
  mode?: "add" | "edit";
  /** The record being edited (DES-714) — seeds every field; its id is preserved on save. */
  initial?: Customer;
  /** Existing records — used for the possible-duplicate warning (DES-713 AC4). Exclude the edited record. */
  existing?: Customer[];
  /** Seeds the Currency field (invoice/Settings default) for a fresh add. */
  defaultCurrency?: string;
  onBack?: () => void;
  /** Returns the full client record on save (Add: new id; Edit: keeps initial.id). */
  onAdd?: (customer: Customer) => void;
  /** Dev (PageControls): seed the form as if a failed save already happened, so every required
   *  field's inline error shows on mount instead of requiring a real empty submit. */
  devShowErrors?: boolean;
  /** Dev (PageControls, edit mode only): simulate another user having changed this same customer's
   *  Phone Number + Address while this session was open — Save shows the conflict sheet instead of
   *  saving straight through. No real backend to race against in this prototype, so this is the
   *  only way to demo the "someone else edited it first" screen. */
  simulateConflict?: boolean;
}

/**
 * Add / Edit Client — FULL PAGE (DES-713 add / DES-714 edit). The complete Client Field Specification with
 * the required set enforced (Company Name, Email, Address, City, Postal Code, Country). Edit mode hides its
 * Save/Cancel dock until something actually changes (`dirty`), and the header back chevron confirms via the
 * same "Unsaved changes?" sheet + Save/Cancel CTAs as AddInvoiceDetails' editingIssuedInvoice pattern (714
 * AC1) — one consistent edit experience across the app. The lightweight company+email version stays a
 * BottomSheet for the in-invoice quick-add.
 */
export function AddCustomerPage({ mode = "add", initial, existing = [], defaultCurrency = "USD", onBack, onAdd, devShowErrors = false, simulateConflict = false }: AddCustomerPageProps) {
  const isEdit = mode === "edit";
  const [company, setCompany] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [firstName, setFirstName] = useState(initial?.firstName ?? "");
  const [lastName, setLastName] = useState(initial?.lastName ?? "");
  const [regNo, setRegNo] = useState(initial?.regNo ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [website, setWebsite] = useState(initial?.website ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [stateVal, setStateVal] = useState(initial?.state ?? "");
  const [zip, setZip] = useState(initial?.zip ?? "");
  const [country, setCountry] = useState(initial?.country ?? "");
  // Start unselected on a fresh add (placeholder shows); edit seeds from the saved record. Falls
  // back to `defaultCurrency` on save so downstream invoice-currency seeding still has a value.
  const [currency, setCurrency] = useState(initial?.currency ?? "");

  // Form rule (user, 15/Jul): the CTA is always enabled. Clicking it with missing/invalid required
  // fields scrolls to the first offender and surfaces its inline error instead of saving.
  const [submitAttempted, setSubmitAttempted] = useState(devShowErrors);

  const [dupOpen, setDupOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [conflictStep, setConflictStep] = useState<"notice" | "compare">("notice");
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [phoneCountry, setPhoneCountry] = useState(DEFAULT_COUNTRY_CODE);
  const [phoneCodeOpen, setPhoneCodeOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const focusKeyboard = (e: React.FocusEvent<HTMLElement>) => { setKeyboardOpen(true); scrollFieldIntoView(e.currentTarget); };
  const blurKeyboard = () => setKeyboardOpen(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrolled(e.currentTarget.scrollTop > 4);
  };

  // Dirty = any field differs from the seeded state (edit) / from empty (add). Drives the discard warning
  // (714 AC1) and dirty-gates the Save Changes CTA in edit mode.
  const dirty =
    company !== (initial?.name ?? "") ||
    email !== (initial?.email ?? "") ||
    firstName !== (initial?.firstName ?? "") ||
    lastName !== (initial?.lastName ?? "") ||
    regNo !== (initial?.regNo ?? "") ||
    phone !== (initial?.phone ?? "") ||
    website !== (initial?.website ?? "") ||
    address !== (initial?.address ?? "") ||
    city !== (initial?.city ?? "") ||
    stateVal !== (initial?.state ?? "") ||
    zip !== (initial?.zip ?? "") ||
    country !== (initial?.country ?? "") ||
    currency !== (initial?.currency ?? "");

  // Add mode has no "unsaved changes" concept to confirm — a fresh add that's still in progress
  // just goes back directly, however many fields are filled in. Only Edit mode confirms via the
  // discard warning (714 AC1), since only there is `dirty` a divergence from something already saved.
  const requestBack = () => (isEdit && dirty ? setDiscardOpen(true) : onBack?.());

  const noPostal = NO_POSTAL_COUNTRIES.includes(country);

  // Required (DES-713 final spec, matched to the Figma asterisks): Company Name, Email, Country,
  // Address, City, Zip/Postal. Everything else is optional. Optional fields with a format (phone,
  // website) validate only once filled. Zip is not required for no-postal countries (e.g. HK).
  const errors = {
    company: !company.trim() && "Company name is required",
    email: !email.trim() ? "Email is required" : !EMAIL_RE.test(email.trim()) && "Enter a valid email",
    phone: phone.trim() && !PHONE_RE.test(phone.trim()) ? "Enter a valid phone number" : false,
    website: website.trim() && !URL_RE.test(website.trim()) ? "Enter a valid website" : false,
    address: !address.trim() && "Address is required",
    city: !city.trim() && "City is required",
    zip: !noPostal && !zip.trim() ? "Postal code is required" : false,
    country: !country.trim() && "Country is required",
  } as const;

  const isValid = !Object.values(errors).some(Boolean);
  // Before the first save attempt only FORMAT errors (bad email/phone/website) surface live, once the
  // field has content. After a failed save attempt every error — including required-empty — shows and
  // clears live as the user fixes it.
  const err = (key: keyof typeof errors) => {
    if (submitAttempted) return errors[key];
    if (key === "email") return email.trim() && !EMAIL_RE.test(email.trim()) ? "Enter a valid email" : false;
    if (key === "phone") return phone.trim() && !PHONE_RE.test(phone.trim()) ? "Enter a valid phone number" : false;
    if (key === "website") return website.trim() && !URL_RE.test(website.trim()) ? "Enter a valid website" : false;
    return false;
  };

  // Visual top-to-bottom order of the validated fields — a failed save scrolls to the FIRST invalid one.
  const FIELD_ORDER: (keyof typeof errors)[] = ["company", "email", "phone", "website", "country", "address", "city", "zip"];

  // Possible duplicate (713 AC4 / 714 AC3): the Company Name OR Email collides with another existing
  // record. In EDIT mode this only applies when the identity fields were actually CHANGED to collide
  // (714 AC3) — editing other fields never warns. Evaluated once the form is otherwise valid (AC3).
  const identityChanged =
    company.trim().toLowerCase() !== (initial?.name ?? "").trim().toLowerCase() ||
    email.trim().toLowerCase() !== (initial?.email ?? "").trim().toLowerCase();
  const duplicate =
    isValid && (!isEdit || identityChanged)
      ? existing.find(
          (c) =>
            c.name.trim().toLowerCase() === company.trim().toLowerCase() ||
            c.email.trim().toLowerCase() === email.trim().toLowerCase()
        )
      : undefined;

  // Build the record and hand it up. Currency falls back to the account default when left unselected.
  const commitSave = () => {
    setSubmitAttempted(false);
    onAdd?.({
      id: initial?.id ?? `cust-${Date.now()}`,
      name: company.trim(),
      email: email.trim(),
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      regNo: regNo.trim() || undefined,
      phone: phone.trim() || undefined,
      website: website.trim() || undefined,
      address: address.trim(),
      city: city.trim(),
      state: stateVal.trim() || undefined,
      zip: noPostal ? undefined : zip.trim(),
      country: country.trim(),
      currency: currency || defaultCurrency,
    });
  };

  const handleSave = () => {
    if (!isValid) {
      // Reveal all inline errors, then focus/scroll the first invalid field into view.
      setSubmitAttempted(true);
      const firstInvalid = FIELD_ORDER.find((k) => errors[k]);
      if (firstInvalid) focusFirstInvalidField(`customer-${firstInvalid}`);
      return;
    }
    // AC4: a match opens the possible-duplicate warning instead of saving; the user resolves it there.
    if (duplicate) { setDupOpen(true); return; }
    // Dev demo only (no real backend to detect a real concurrent edit) — someone else changed this
    // customer while this session was open; resolve before saving.
    if (isEdit && simulateConflict) { setConflictStep("notice"); setConflictOpen(true); return; }
    commitSave();
  };

  // "Use Their Changes" (conflict sheet) — discards this session's edits entirely and keeps the
  // original record with the other user's changes applied on top, same shape commitSave() hands up.
  const useTheirChanges = () => {
    if (!initial) return;
    setSubmitAttempted(false);
    onAdd?.({ ...initial, phone: CONFLICT_DEMO_PHONE, address: CONFLICT_DEMO_ADDRESS });
  };

  return (
    <div
      className="relative rounded-[48px] overflow-hidden shadow-2xl flex flex-col"
      style={{ width: 375, height: 812, background: "var(--bg-neutral-tertiary)" }}
    >
      <div
        className="flex-1 overflow-y-auto thin-scrollbar"
        onScroll={handleScroll}
      >
        <PageAppHeader scrolled={scrolled}>
          <PageHeader
            type="center"
            title={isEdit ? "Edit Customer" : "New Customer"}
            showSearch={false}
            onBack={requestBack}
          />
        </PageAppHeader>

        <div className={`px-4 pt-5 ${keyboardOpen ? "pb-[380px]" : "pb-28"}`}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <p style={SECTION_TITLE_STYLE}>Details</p>
            <div className="flex flex-col gap-3">
              <TextField dataReq="customer-company" label="Company Name" mandatory placeholder="e.g. Atlas Logistics"
                error={!!err("company")} caption={err("company") || undefined} value={company} onChange={setCompany}
                onFocus={focusKeyboard} onBlur={blurKeyboard} />

              <div className="flex gap-4">
                <TextField label="First Name" placeholder="Enter first name" className="flex-1"
                  value={firstName} onChange={setFirstName} onFocus={focusKeyboard} onBlur={blurKeyboard} />
                <TextField label="Last Name" placeholder="Enter last name" className="flex-1"
                  value={lastName} onChange={setLastName} onFocus={focusKeyboard} onBlur={blurKeyboard} />
              </div>

              <TextField label="Company Registration Number" placeholder="Enter registration number"
                value={regNo} onChange={setRegNo} onFocus={focusKeyboard} onBlur={blurKeyboard} />

              <TextField dataReq="customer-email" label="Email Address" inputType="email" placeholder="e.g. abc@gmail.com" mandatory
                error={!!err("email")} caption={err("email") || undefined} value={email} onChange={setEmail}
                onFocus={focusKeyboard} onBlur={blurKeyboard} />

              {/* TextField's own "mobile" type (flag + dial code + chevron selector) — see
                  memory: no-handrolled-ds-duplicates. */}
              <TextField type="mobile" dataReq="customer-phone" label="Phone Number" inputType="tel" placeholder="Enter contact phone number"
                selectorLabel={phoneCountry.dialCode}
                selectorIcon={<CountryFlag name={phoneCountry.name} size={20} />}
                onSelectorClick={() => setPhoneCodeOpen(true)}
                error={!!err("phone")} caption={err("phone") || undefined} value={phone} onChange={setPhone}
                onFocus={focusKeyboard} onBlur={blurKeyboard} />

              <TextField dataReq="customer-website" label="Website" placeholder="Enter company website"
                error={!!err("website")} caption={err("website") || undefined} value={website} onChange={setWebsite}
                onFocus={focusKeyboard} onBlur={blurKeyboard} />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <p style={SECTION_TITLE_STYLE}>Address</p>
            <div className="flex flex-col gap-3">
              <TextField type="dropdown" dataReq="customer-country" label="Country" mandatory placeholder="Select country"
                error={!!err("country")} caption={err("country") || undefined} value={country} onClick={() => setCountryOpen(true)} />

              <TextField dataReq="customer-address" label="Address" mandatory placeholder="Enter company address"
                error={!!err("address")} caption={err("address") || undefined} value={address} onChange={setAddress}
                onFocus={focusKeyboard} onBlur={blurKeyboard} />

              <div className="flex gap-4">
                <TextField dataReq="customer-city" label="City" mandatory placeholder="Enter city"
                  error={!!err("city")} caption={err("city") || undefined} className="flex-1" value={city} onChange={setCity}
                  onFocus={focusKeyboard} onBlur={blurKeyboard} />
                {!noPostal && (
                  <TextField dataReq="customer-zip" label="Zip / Postal" mandatory placeholder="e.g. 11102"
                    error={!!err("zip")} caption={err("zip") || undefined} className="flex-1" value={zip} onChange={setZip}
                    onFocus={focusKeyboard} onBlur={blurKeyboard} />
                )}
              </div>

              <TextField label="State" placeholder="Enter state or province"
                value={stateVal} onChange={setStateVal} onFocus={focusKeyboard} onBlur={blurKeyboard} />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <p style={SECTION_TITLE_STYLE}>Invoice</p>
            <div className="flex flex-col gap-3">
              <TextField type="dropdown" label="Currency" placeholder="Select default invoice currency"
                value={currency} onClick={() => setCurrencyOpen(true)}
                icon={currency ? <CountryFlag name={CURRENCY_COUNTRY[currency]} size={20} /> : undefined} />
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Edit: hidden until something actually changes (`dirty`) — an untouched edit session has
          nothing to save or cancel, same as AddInvoiceDetails' editingIssuedInvoice dock. Cancel
          is a direct, unconfirmed discard (already an explicit choice next to Save); the header
          back chevron is the ambiguous action, so it confirms via requestBack instead. Add mode
          keeps its own single always-shown "Add Customer" CTA — there's nothing to "cancel" on a
          still-empty fresh add. */}
      {isEdit ? (
        dirty && (
          <ButtonDock
            type="double"
            sticky
            primaryLabel="Save"
            secondaryLabel="Cancel"
            onPrimary={handleSave}
            onSecondary={onBack}
            keyboard={keyboardOpen}
          />
        )
      ) : (
        <ButtonDock
          type="single"
          sticky
          primaryLabel="Add Customer"
          onPrimary={handleSave}
          keyboard={keyboardOpen}
        />
      )}

      <CountrySheet
        open={countryOpen}
        value={country}
        onClose={() => setCountryOpen(false)}
        onSelect={(c) => { setCountry(c); if (NO_POSTAL_COUNTRIES.includes(c)) setZip(""); setCountryOpen(false); }}
      />

      <CurrencySheet
        open={currencyOpen}
        value={currency}
        onClose={() => setCurrencyOpen(false)}
        onSelect={(code) => { setCurrency(code); setCurrencyOpen(false); }}
      />

      <CountryCodeSheet
        open={phoneCodeOpen}
        value={phoneCountry.name}
        onClose={() => setPhoneCodeOpen(false)}
        onSelect={(c) => { setPhoneCountry(c); setPhoneCodeOpen(false); }}
      />

      {/* Unsaved-changes confirm (DES-714 AC1) — same "Unsaved changes?" sheet + Save/Cancel CTAs
          as AddInvoiceDetails' editingIssuedInvoice back-tap confirm. Save persists via the same
          handleSave the dock's own Save button calls (still runs validation/duplicate-check);
          Cancel discards via onBack, same as the dock's own Cancel. */}
      <BottomSheet
        open={discardOpen}
        title="Unsaved changes?"
        onClose={() => setDiscardOpen(false)}
        compact
        footer={
          <ButtonDock
            type="double"
            primaryLabel="Save"
            secondaryLabel="Cancel"
            onPrimary={() => { setDiscardOpen(false); handleSave(); }}
            onSecondary={() => { setDiscardOpen(false); onBack?.(); }}
          />
        }
      >
        <p className="body-sm" style={{ ...FONT, color: "var(--text-secondary)" }}>
          You have unsaved changes. Save them before you go, or cancel to discard them.
        </p>
      </BottomSheet>

      {/* Possible-duplicate warning (713 AC4 add / 714 AC3 edit) — identifies the matched record and
          lets the user cancel or save anyway. */}
      <BottomSheet
        open={dupOpen}
        title="Customer already exists"
        onClose={() => setDupOpen(false)}
        compact
        footer={
          <ButtonDock
            type="double"
            secondaryLabel="Cancel"
            primaryLabel={isEdit ? "Save Anyway" : "Create Anyway"}
            onSecondary={() => setDupOpen(false)} // Cancel → stay on the customer form
            onPrimary={() => { setDupOpen(false); commitSave(); }}
          />
        }
      >
        <div className="flex flex-col gap-3">
          <p className="body-sm" style={{ ...FONT, color: "var(--text-secondary)" }}>
            {isEdit
              ? "We found another customer with the same email address. Do you want to save anyway?"
              : "We found an existing customer with the same email address. Do you want to create another customer?"}
          </p>
          {duplicate && (
            <Tile
              avatar={initials(duplicate.name)}
              avatarColor={avatarTint(duplicate.id)}
              title={duplicate.name}
              text={duplicate.email}
              reserveTrailing={false}
            />
          )}
        </div>
      </BottomSheet>

      {/* Concurrent-edit conflict (dev demo — PageControls "Concurrent edit conflict" toggle,
          edit mode only). A deeper "Review Changes" level swaps content in this SAME sheet
          instance (step state + slide, not a second sheet stacked on top) rather than opening a
          separate screen. "Keep My Changes" saves this session's edits as normal; "Use Their
          Changes" discards them and keeps the other user's version instead (useTheirChanges). */}
      <BottomSheet
        open={conflictOpen}
        title={conflictStep === "notice" ? "This customer was updated by someone else" : "Review the changes"}
        onBack={conflictStep === "compare" ? () => setConflictStep("notice") : undefined}
        onClose={() => setConflictOpen(false)}
        compact
        footer={
          conflictStep === "notice" ? (
            <ButtonDock
              type="triple"
              primaryLabel="Review Changes"
              secondaryLabel="Keep My Changes"
              tertiaryLabel="Use Their Changes"
              onPrimary={() => setConflictStep("compare")}
              onSecondary={() => { setConflictOpen(false); commitSave(); }}
              onTertiary={() => { setConflictOpen(false); useTheirChanges(); }}
            />
          ) : (
            <ButtonDock
              type="double"
              primaryLabel="Keep My Changes"
              secondaryLabel="Use Their Changes"
              onPrimary={() => { setConflictOpen(false); commitSave(); }}
              onSecondary={() => { setConflictOpen(false); useTheirChanges(); }}
            />
          )
        }
      >
        <AnimatePresence mode="wait">
          {conflictStep === "notice" ? (
            <motion.div key="notice" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="body-sm" style={{ ...FONT, color: "var(--text-secondary)" }}>
                Someone else changed this customer's Phone Number and Address while you were editing.
                Choose how to resolve this before saving.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="compare"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              className="flex flex-col gap-3"
            >
              {[
                { label: "Phone Number", mine: phone, theirs: CONFLICT_DEMO_PHONE },
                { label: "Address", mine: address, theirs: CONFLICT_DEMO_ADDRESS },
              ].map((row) => (
                <div key={row.label} className="rounded-xl border border-[var(--border-neutral-primary)] p-3 flex flex-col gap-2">
                  <p className="text-[13px] font-bold" style={{ ...FONT, color: "var(--text-primary)" }}>{row.label}</p>
                  <div>
                    <p className="text-[12px]" style={{ ...FONT, color: "var(--text-secondary)" }}>Your version</p>
                    <p className="text-[14px]" style={{ ...FONT, color: "var(--text-primary)" }}>{row.mine || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[12px]" style={{ ...FONT, color: "var(--text-secondary)" }}>Their version</p>
                    <p className="text-[14px]" style={{ ...FONT, color: "var(--text-primary)" }}>{row.theirs}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </BottomSheet>
    </div>
  );
}

export default AddCustomerPage;
