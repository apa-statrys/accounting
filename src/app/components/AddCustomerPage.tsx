import { useState } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import StatusBar from "./StatusBar";
import { SheetHeader, HeaderIconButton } from "./SheetHeader";
import { TextInput } from "./TextInput";
import { ButtonDock } from "./ButtonDock";
import { BottomSheet } from "./BottomSheet";
import { CurrencySheet } from "./CurrencySheet";
import { CountrySheet } from "./CountrySheet";
import type { Customer } from "../types";

import { FONT } from "../lib/theme";
const chevron = <ExpandMoreIcon style={{ fontSize: 20, color: "#808080" }} />;

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
  /** Existing records — used for the duplicate (name/email) warning (exclude the edited record). */
  existing?: { name: string; email: string }[];
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
  const [currency, setCurrency] = useState(initial?.currency ?? defaultCurrency);

  const [overrideDup, setOverrideDup] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);

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
    currency !== (initial?.currency ?? defaultCurrency);

  const requestBack = () => (dirty ? setDiscardOpen(true) : onBack?.());

  const noPostal = NO_POSTAL_COUNTRIES.includes(country);

  // Required (DES-713 final spec): Company Name, Email, Address, City, Zip/Postal, Country. Optional
  // fields validate format only when filled. Zip is not required for no-postal countries (e.g. HK).
  // All fields are required EXCEPT Company Registration Number. Fields with a format also validate it.
  const errors = {
    company: !company.trim() && "Company name is required",
    email: !email.trim() ? "Email is required" : !EMAIL_RE.test(email.trim()) && "Enter a valid email",
    firstName: !firstName.trim() && "First name is required",
    lastName: !lastName.trim() && "Last name is required",
    phone: !phone.trim() ? "Phone number is required" : !PHONE_RE.test(phone.trim()) ? "Enter a valid phone number" : false,
    website: !website.trim() ? "Website is required" : !URL_RE.test(website.trim()) ? "Enter a valid website" : false,
    address: !address.trim() && "Address is required",
    city: !city.trim() && "City is required",
    zip: !noPostal && !zip.trim() ? "Postal code is required" : false,
    country: !country.trim() && "Country is required",
    state: !stateVal.trim() && "State is required",
  } as const;

  const isValid = !Object.values(errors).some(Boolean);
  // The Save CTA is validity-gated (disabled until required fields + formats are valid), so required-empty
  // fields don't need an inline error — the required marker + disabled CTA convey it. Only FORMAT errors
  // (bad email/phone/website) surface live, once the field has content, so the user sees why it's blocked.
  const err = (key: keyof typeof errors) => {
    if (key === "email") return email.trim() && !EMAIL_RE.test(email.trim()) ? "Enter a valid email" : false;
    if (key === "phone") return phone.trim() && !PHONE_RE.test(phone.trim()) ? "Enter a valid phone number" : false;
    if (key === "website") return website.trim() && !URL_RE.test(website.trim()) ? "Enter a valid website" : false;
    return false;
  };

  const duplicate =
    isValid &&
    existing.find(
      (c) =>
        c.name.trim().toLowerCase() === company.trim().toLowerCase() ||
        c.email.trim().toLowerCase() === email.trim().toLowerCase()
    );

  const handleSave = () => {
    if (!isValid) return;
    if (duplicate && !overrideDup) { setOverrideDup(true); return; }
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
      currency,
    });
  };

  return (
    <div className="relative bg-white rounded-[48px] overflow-hidden shadow-2xl flex flex-col" style={{ width: 375, height: 812 }}>
      <StatusBar />

      <SheetHeader
        title={isEdit ? "Edit Customer" : "New Customer"}
        type="inside-page"
        state="fixed"
        leading={<HeaderIconButton aria-label="Back" onClick={requestBack}><ChevronLeftIcon /></HeaderIconButton>}
        trailing={<span className="w-[30px] h-[30px] block" aria-hidden />}
      />

      <div className="flex-1 overflow-y-auto thin-scrollbar bg-white px-4 pt-5 pb-28">
        <div className="flex flex-col gap-4">
          {duplicate && overrideDup && (
            <div className="flex items-start gap-2.5 rounded-xl bg-[#fff4ec] border border-[#ffd9c2] px-3.5 py-3">
              <ErrorOutlineIcon style={{ fontSize: 18, color: "#ff4a15", marginTop: 1 }} />
              <p className="text-[13px] leading-[1.35] text-[#7a3a1f]" style={FONT}>
                A client with this name or email already exists ({duplicate.name}). Save anyway, or go back to reuse it.
              </p>
            </div>
          )}

          <TextInput label="Company Name" placeholder="e.g. Marlow & Finch Studio" size="md" required showHint={!err("company")}
            error={err("company")} value={company} onChange={(e) => setCompany(e.target.value)} />

          <TextInput label="Email Address" type="email" placeholder="name@company.com" size="md" required showHint={!err("email")}
            error={err("email")} value={email} onChange={(e) => setEmail(e.target.value)} />

          <div className="flex gap-4">
            <TextInput label="First Name" placeholder="e.g. Daniel" size="md" required showHint={!err("firstName")} className="flex-1"
              error={err("firstName")} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <TextInput label="Last Name" placeholder="e.g. Smith" size="md" required showHint={!err("lastName")} className="flex-1"
              error={err("lastName")} value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>

          <TextInput label="Company Registration Number" placeholder="e.g. 201912345A" size="md" showHint={false}
            value={regNo} onChange={(e) => setRegNo(e.target.value)} />

          <TextInput label="Phone Number" type="tel" placeholder="+65 8123 4567" size="md" required showHint={!err("phone")}
            error={err("phone")} value={phone} onChange={(e) => setPhone(e.target.value)} />

          <TextInput label="Website" placeholder="e.g. marlowfinch.co" size="md" required showHint={!err("website")}
            error={err("website")} value={website} onChange={(e) => setWebsite(e.target.value)} />

          <TextInput label="Address" placeholder="Street address" size="md" required showHint={!err("address")}
            error={err("address")} value={address} onChange={(e) => setAddress(e.target.value)} />

          <TextInput label="Country" placeholder="Select country" size="md" required showHint={!err("country")}
            error={err("country")} readOnly iconRight={chevron} value={country} onClick={() => setCountryOpen(true)} />

          <div className="flex gap-4">
            <TextInput label="City" placeholder="e.g. Singapore" size="md" required showHint={!err("city")}
              error={err("city")} className="flex-1" value={city} onChange={(e) => setCity(e.target.value)} />
            {!noPostal && (
              <TextInput label="Zip / Postal" placeholder="e.g. 049513" size="md" required showHint={!err("zip")}
                error={err("zip")} className="flex-1" value={zip} onChange={(e) => setZip(e.target.value)} />
            )}
          </div>

          <TextInput label="State" placeholder="e.g. Central" size="md" required showHint={!err("state")}
            error={err("state")} value={stateVal} onChange={(e) => setStateVal(e.target.value)} />

          <TextInput label="Default Currency" placeholder="Select currency" size="md" required showHint={false} readOnly
            iconRight={chevron} value={currency} onClick={() => setCurrencyOpen(true)} />
        </div>
      </div>

      <ButtonDock
        type="single"
        primaryLabel={duplicate && overrideDup ? "Save Anyway" : isEdit ? "Save Changes" : "Add Customer"}
        primaryDisabled={!isValid || (isEdit && !dirty)}
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

      {/* Unsaved-changes discard warning (DES-714 AC1) */}
      <BottomSheet
        open={discardOpen}
        title="Discard changes?"
        onClose={() => setDiscardOpen(false)}
        footer={
          <ButtonDock
            type="double"
            overflow
            secondaryLabel="Keep Editing"
            primaryLabel="Discard"
            onSecondary={() => setDiscardOpen(false)}
            onPrimary={() => { setDiscardOpen(false); onBack?.(); }}
            homeIndicator
          />
        }
      >
        <p className="text-[14px] leading-[1.45]" style={{ ...FONT, color: "#808080" }}>
          You have unsaved changes. If you go back now, they'll be lost.
        </p>
      </BottomSheet>
    </div>
  );
}

export default AddCustomerPage;
