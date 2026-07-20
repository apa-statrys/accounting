import { useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { PageAppHeader } from "../components/PageAppHeader";
import { PageHeader } from "../ui/PageHeader";
import { TextInput } from "../components/TextInput";
import { ButtonDock } from "../components/ButtonDock";
import { BottomSheet } from "../components/BottomSheet";
import { CurrencySheet } from "../components/CurrencySheet";
import { CountrySheet } from "../components/CountrySheet";
import type { Customer } from "../types";

import { FONT } from "../lib/theme";
const chevron = <ExpandMoreIcon style={{ fontSize: 20, color: "var(--text-secondary)" }} />;

/** Two-letter initials from a name (skips symbols like "&") — for the duplicate-warning avatar. */
function initials(name: string): string {
  const words = name.split(/\s+/).filter((w) => /[a-z0-9]/i.test(w[0] ?? ""));
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase();
}

// Static country-code prefix shown inside the Phone field (visual only, matching the Figma).
const phonePrefix = (
  <span className="flex items-center gap-1" style={{ ...FONT, color: "var(--text-primary)" }}>
    <span style={{ fontSize: 16, lineHeight: 1 }}>🇺🇸</span>
    <span className="body-md">+1</span>
    <ExpandMoreIcon style={{ fontSize: 16, color: "var(--text-secondary)" }} />
  </span>
);

import { EMAIL_RE } from "../lib/format";
const PHONE_RE = /^[+()\d][\d\s()-]{5,}$/;
const URL_RE = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/;

/** Countries without postal codes — Zip is hidden (and not required) for these (e.g. Hong Kong). */
const NO_POSTAL_COUNTRIES = ["Hong Kong"];

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
}

/**
 * Add / Edit Client — FULL PAGE (DES-713 add / DES-714 edit). The complete Client Field Specification with
 * the required set enforced (Company Name, Email, Address, City, Postal Code, Country). Edit mode seeds from
 * an existing record, dirty-gates "Save Changes", and warns before discarding unsaved edits (714 AC1). The
 * lightweight company+email version stays a BottomSheet for the in-invoice quick-add.
 */
export function AddCustomerPage({ mode = "add", initial, existing = [], defaultCurrency = "USD", onBack, onAdd }: AddCustomerPageProps) {
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
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const [dupOpen, setDupOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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

  const requestBack = () => (dirty ? setDiscardOpen(true) : onBack?.());

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
      // Reveal all inline errors, then scroll the first invalid field into view (rAF so the
      // error hint has rendered and the scroll target height is final).
      setSubmitAttempted(true);
      const firstInvalid = FIELD_ORDER.find((k) => errors[k]);
      if (firstInvalid) {
        requestAnimationFrame(() => {
          const el = document.getElementById(`client-field-${firstInvalid}`);
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
        });
      }
      return;
    }
    // AC4: a match opens the possible-duplicate warning instead of saving; the user resolves it there.
    if (duplicate) { setDupOpen(true); return; }
    commitSave();
  };

  return (
    <div
      className="relative rounded-[48px] overflow-hidden shadow-2xl flex flex-col"
      style={{ width: 375, height: 812, background: "var(--ds-bg-beige-primary)" }}
    >
      <div
        className="flex-1 overflow-y-auto thin-scrollbar"
        onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
      >
        <PageAppHeader scrolled={scrolled}>
          <PageHeader
            type="center"
            title={isEdit ? "Edit Customer" : "New Customer"}
            showSearch={false}
            onBack={requestBack}
          />
        </PageAppHeader>

        <div className="px-4 pt-5 pb-28">
        <div className="flex flex-col gap-4">
          <TextInput id="client-field-company" label="Company Name" placeholder="e.g. Atlas Logistics" size="md" required
            error={err("company")} value={company} onChange={(e) => setCompany(e.target.value)} />

          <div className="flex gap-4">
            <TextInput label="First Name" placeholder="Enter first name" size="md" showHint={false} className="flex-1"
              value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <TextInput label="Last Name" placeholder="Enter last name" size="md" showHint={false} className="flex-1"
              value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>

          <TextInput label="Company Registration Number" placeholder="Enter registration number" size="md" showHint={false}
            value={regNo} onChange={(e) => setRegNo(e.target.value)} />

          <TextInput id="client-field-email" label="Email Address" type="email" placeholder="e.g. abc@gmail.com" size="md" required
            error={err("email")} value={email} onChange={(e) => setEmail(e.target.value)} />

          <TextInput id="client-field-phone" label="Phone Number" type="tel" placeholder="Enter contact phone number" size="md"
            iconLeft={phonePrefix} error={err("phone")} value={phone} onChange={(e) => setPhone(e.target.value)} />

          <TextInput id="client-field-website" label="Website" placeholder="Enter company website" size="md"
            error={err("website")} value={website} onChange={(e) => setWebsite(e.target.value)} />

          <TextInput id="client-field-country" label="Country" placeholder="Select country" size="md" required
            error={err("country")} readOnly iconRight={chevron} value={country} onClick={() => setCountryOpen(true)} />

          <TextInput id="client-field-address" label="Address" placeholder="Enter company address" size="md" required
            error={err("address")} value={address} onChange={(e) => setAddress(e.target.value)} />

          <div className="flex gap-4">
            <TextInput id="client-field-city" label="City" placeholder="Enter city" size="md" required
              error={err("city")} className="flex-1" value={city} onChange={(e) => setCity(e.target.value)} />
            {!noPostal && (
              <TextInput id="client-field-zip" label="Zip / Postal" placeholder="e.g. 11102" size="md" required
                error={err("zip")} className="flex-1" value={zip} onChange={(e) => setZip(e.target.value)} />
            )}
          </div>

          <TextInput label="State" placeholder="Enter state or province" size="md" showHint={false}
            value={stateVal} onChange={(e) => setStateVal(e.target.value)} />

          <TextInput label="Currency" placeholder="Select default invoice currency" size="md" showHint={false} readOnly
            iconRight={chevron} value={currency} onClick={() => setCurrencyOpen(true)} />
        </div>
        </div>
      </div>

      <ButtonDock
        type="single"
        sticky
        primaryLabel={isEdit ? "Save Changes" : "Add Customer"}
        primaryDisabled={isEdit && !dirty}
        onPrimary={handleSave}
        homeIndicator
      />

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

      {/* Unsaved-changes discard warning (DES-714 AC1). Safe action (Keep Editing) is the
          filled primary; the destructive Discard is the outline secondary. */}
      <BottomSheet
        open={discardOpen}
        title="Discard changes?"
        onClose={() => setDiscardOpen(false)}
        compact
        footer={
          <ButtonDock
            type="double"
            primaryLabel="Keep Editing"
            secondaryLabel="Discard"
            onPrimary={() => setDiscardOpen(false)}
            onSecondary={() => { setDiscardOpen(false); onBack?.(); }}
            homeIndicator
          />
        }
      >
        <p className="text-[16px] leading-[1.45]" style={{ ...FONT, color: "var(--text-secondary)" }}>
          You have unsaved changes. If you go back now, they'll be lost.
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
            homeIndicator
          />
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-[16px] leading-[1.45]" style={{ ...FONT, color: "var(--text-secondary)" }}>
            {isEdit
              ? "We found another customer with the same email address. Do you want to save anyway?"
              : "We found an existing customer with the same email address. Do you want to create another customer?"}
          </p>
          {duplicate && (
            <div className="flex items-center gap-3 rounded-[12px] border border-[#e3e5e5] px-3 py-2.5">
              <span
                className="shrink-0 rounded-full flex items-center justify-center text-[15px] font-medium"
                style={{ width: 40, height: 40, background: "var(--bg-beige-secondary)", color: "var(--text-primary)", ...FONT }}
              >
                {initials(duplicate.name)}
              </span>
              <span className="flex-1 min-w-0 flex flex-col">
                <span className="text-[15px] font-medium truncate" style={{ ...FONT, color: "#101828" }}>
                  {duplicate.name}
                </span>
                <span className="text-[13px] truncate" style={{ ...FONT, color: "var(--text-secondary)" }}>
                  {duplicate.email}
                </span>
              </span>
            </div>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}

export default AddCustomerPage;
