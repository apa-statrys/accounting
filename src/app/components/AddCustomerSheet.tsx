import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ContactsOutlinedIcon from "@mui/icons-material/ContactsOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { BottomSheet, sheetItem } from "./BottomSheet";
import { TextInput } from "./TextInput";
import { ButtonDock } from "./ButtonDock";
import { Search } from "./Search";
import { Tile } from "./Tile";
import { CurrencySheet } from "./CurrencySheet";
import { CountrySheet } from "./CountrySheet";
import { PAYMENT_CONTACTS } from "../data/paymentContacts";
import type { PaymentContact } from "../types";
import type { Customer } from "../types";

import { FONT } from "../lib/theme";
const chevron = <ExpandMoreIcon style={{ fontSize: 20, color: "#808080" }} />;

import { EMAIL_RE } from "../lib/format";
const PHONE_RE = /^[+()\d][\d\s()-]{5,}$/;
const URL_RE = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/;

/** Countries without postal codes — Zip is hidden (and not required) for these (e.g. Hong Kong). */
const NO_POSTAL_COUNTRIES = ["Hong Kong"];

interface AddCustomerSheetProps {
  open: boolean;
  /** Existing records — used for the duplicate (name/email) warning. */
  existing?: { name: string; email: string }[];
  /** Seeds the Currency field (invoice/Settings default). */
  defaultCurrency?: string;
  /** Prefill (e.g. from an OCR'd upload). */
  initialCompany?: string;
  initialEmail?: string;
  onClose?: () => void;
  /** Returns the full new client record on save. */
  onAdd?: (customer: Customer) => void;
}

/**
 * Add Client — in-invoice quick-add (DES-713 Client Field Specification). Same FIELDS as the full-page
 * `AddCustomerPage` (complete field spec + prefill-from-contact), but scoped for a fast in-invoice add: only
 * **Company Name + Email are required and shown up front**; the rest live under an "Add more details
 * (optional)" accordion. Format validation, duplicate warn + "Save Anyway", rendered inside a BottomSheet so
 * the user never leaves the invoice they're building.
 */
export function AddCustomerSheet({ open, existing = [], defaultCurrency = "USD", initialCompany = "", initialEmail = "", onClose, onAdd }: AddCustomerSheetProps) {
  const [company, setCompany] = useState(initialCompany);
  const [email, setEmail] = useState(initialEmail);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [regNo, setRegNo] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency);

  const [showMore, setShowMore] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [overrideDup, setOverrideDup] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);

  // AC2 — prefill from a Statrys payment contact (contact picker).
  const [contactOpen, setContactOpen] = useState(false);
  const [contactQuery, setContactQuery] = useState("");

  const contactMatches = useMemo(() => {
    const q = contactQuery.trim().toLowerCase();
    if (!q) return PAYMENT_CONTACTS;
    return PAYMENT_CONTACTS.filter((c) =>
      [c.name, c.email, c.city, c.country].some((v) => v?.toLowerCase().includes(q))
    );
  }, [contactQuery]);

  const noPostal = NO_POSTAL_COUNTRIES.includes(country);

  // AC2: auto-fill every matching field from the selected contact; all remain editable afterwards.
  const prefillFromContact = (c: PaymentContact) => {
    setCompany(c.name ?? "");
    setEmail(c.email ?? "");
    setFirstName(c.firstName ?? "");
    setLastName(c.lastName ?? "");
    setRegNo(c.regNo ?? "");
    setPhone(c.phone ?? "");
    setWebsite(c.website ?? "");
    setAddress(c.address ?? "");
    setCity(c.city ?? "");
    setStateVal(c.state ?? "");
    setCountry(c.country ?? "");
    setZip(c.country && NO_POSTAL_COUNTRIES.includes(c.country) ? "" : (c.zip ?? ""));
    if (c.currency) setCurrency(c.currency);
    setOverrideDup(false);
    setShowMore(true); // reveal the optional fields so the prefilled values are visible
    setContactOpen(false);
    setContactQuery("");
  };

  // In-invoice quick-add: only Company Name + Email are required (the rest live under the optional
  // accordion). Optional fields validate format only when filled.
  const errors = {
    company: !company.trim() && "Company name is required",
    email: !email.trim() ? "Email is required" : !EMAIL_RE.test(email.trim()) && "Enter a valid email",
    phone: phone.trim() && !PHONE_RE.test(phone.trim()) ? "Enter a valid phone number" : false,
    website: website.trim() && !URL_RE.test(website.trim()) ? "Enter a valid website" : false,
  } as const;

  const isValid = !Object.values(errors).some(Boolean);
  // Errors surface after a save attempt (submitted). Format errors (phone/website) also surface once filled.
  const err = (key: keyof typeof errors) => (submitted && errors[key] ? errors[key] : false);

  const duplicate =
    isValid &&
    existing.find(
      (c) =>
        c.name.trim().toLowerCase() === company.trim().toLowerCase() ||
        c.email.trim().toLowerCase() === email.trim().toLowerCase()
    );

  const reset = () => {
    setCompany(""); setEmail(""); setFirstName(""); setLastName(""); setRegNo(""); setPhone(""); setWebsite("");
    setAddress(""); setCity(""); setStateVal(""); setZip(""); setCountry(""); setCurrency(defaultCurrency);
    setShowMore(false); setSubmitted(false); setOverrideDup(false); setContactQuery("");
  };

  const handleSave = () => {
    setSubmitted(true);
    if (!isValid) {
      // Reveal the accordion if the only blockers (bad phone/website) live inside it.
      if (!errors.company && !errors.email) setShowMore(true);
      return;
    }
    if (duplicate && !overrideDup) { setOverrideDup(true); return; }
    onAdd?.({
      id: `cust-${Date.now()}`,
      name: company.trim(),
      email: email.trim(),
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      regNo: regNo.trim() || undefined,
      phone: phone.trim() || undefined,
      website: website.trim() || undefined,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      state: stateVal.trim() || undefined,
      zip: noPostal ? undefined : (zip.trim() || undefined),
      country: country.trim() || undefined,
      currency,
    });
    reset();
  };

  return (
    <>
      <BottomSheet
        open={open}
        title="New Customer"
        onClose={onClose}
        tall
        footer={
          <ButtonDock
            type="single"
            primaryLabel={duplicate && overrideDup ? "Save Anyway" : "Add Customer"}
            primaryDisabled={!isValid}
            onPrimary={handleSave}
            homeIndicator
          />
        }
      >
        <div className="flex flex-col gap-4">
          {/* AC2 — prefill from a Statrys payment contact */}
          <motion.div variants={sheetItem} className="flex flex-col gap-4">
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              className="group flex items-center gap-3 rounded-xl border border-dashed border-[rgba(160,160,160,0.4)] bg-[#faf9f4] px-3.5 py-3 text-left"
            >
              <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "#f0eee6" }}>
                <ContactsOutlinedIcon style={{ fontSize: 18, color: "#1b1b1b" }} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[14px] font-semibold" style={{ ...FONT, color: "#1b1b1b" }}>Prefill from a payment contact</span>
                <span className="block text-[12px] mt-0.5" style={{ ...FONT, color: "#808080" }}>Reuse a saved Statrys contact</span>
              </span>
              <ChevronRightIcon className="transition-transform group-hover:translate-x-0.5 shrink-0" style={{ fontSize: 18, color: "#808080" }} />
            </button>
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-[rgba(160,160,160,0.25)]" />
              <span className="text-[11px] font-medium uppercase tracking-wide" style={{ ...FONT, color: "#a0a0a0" }}>or enter manually</span>
              <span className="h-px flex-1 bg-[rgba(160,160,160,0.25)]" />
            </div>
          </motion.div>

          {/* Possible duplicate warning */}
          {duplicate && overrideDup && (
            <motion.div
              variants={sheetItem}
              className="flex items-start gap-2.5 rounded-xl bg-[#fff4ec] border border-[#ffd9c2] px-3.5 py-3"
            >
              <ErrorOutlineIcon style={{ fontSize: 18, color: "#ff4a15", marginTop: 1 }} />
              <p className="text-[13px] leading-[1.35] text-[#7a3a1f]" style={FONT}>
                A client with this name or email already exists ({duplicate.name}). Save anyway, or cancel to reuse it.
              </p>
            </motion.div>
          )}

          <motion.div variants={sheetItem}>
            <TextInput label="Company Name" placeholder="e.g. Marlow & Finch Studio" size="md" required showHint={!err("company")}
              error={err("company")} value={company} onChange={(e) => setCompany(e.target.value)} />
          </motion.div>

          <motion.div variants={sheetItem}>
            <TextInput label="Email Address" type="email" placeholder="name@company.com" size="md" required showHint={!err("email")}
              error={err("email")} value={email} onChange={(e) => setEmail(e.target.value)} />
          </motion.div>

          {/* Optional details — everything beyond Company + Email lives here (collapsed by default). */}
          <motion.button
            type="button"
            variants={sheetItem}
            onClick={() => setShowMore((v) => !v)}
            className="flex items-center justify-between w-full pt-1"
          >
            <span className="text-[14px] font-medium text-[#1b1b1b]" style={FONT}>Add more details (optional)</span>
            <motion.span animate={{ rotate: showMore ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <KeyboardArrowDownIcon style={{ fontSize: 22, color: "#808080" }} />
            </motion.span>
          </motion.button>

          <AnimatePresence initial={false}>
            {showMore && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-4 pt-1">
                  <div className="flex gap-4">
                    <TextInput label="First Name" placeholder="e.g. Daniel" size="md" showHint={false} className="flex-1"
                      value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    <TextInput label="Last Name" placeholder="e.g. Smith" size="md" showHint={false} className="flex-1"
                      value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>

                  <TextInput label="Company Registration Number" placeholder="e.g. 201912345A" size="md" showHint={false}
                    value={regNo} onChange={(e) => setRegNo(e.target.value)} />

                  <TextInput label="Phone Number" type="tel" placeholder="+65 8123 4567" size="md" showHint={!err("phone")}
                    error={err("phone")} value={phone} onChange={(e) => setPhone(e.target.value)} />

                  <TextInput label="Website" placeholder="e.g. marlowfinch.co" size="md" showHint={!err("website")}
                    error={err("website")} value={website} onChange={(e) => setWebsite(e.target.value)} />

                  <TextInput label="Address" placeholder="Street address" size="md" showHint={false}
                    value={address} onChange={(e) => setAddress(e.target.value)} />

                  <TextInput label="Country" placeholder="Select country" size="md" showHint={false} readOnly
                    iconRight={chevron} value={country} onClick={() => setCountryOpen(true)} />

                  <div className="flex gap-4">
                    <TextInput label="City" placeholder="e.g. Singapore" size="md" showHint={false} className="flex-1"
                      value={city} onChange={(e) => setCity(e.target.value)} />
                    {!noPostal && (
                      <TextInput label="Zip / Postal" placeholder="e.g. 049513" size="md" showHint={false} className="flex-1"
                        value={zip} onChange={(e) => setZip(e.target.value)} />
                    )}
                  </div>

                  <TextInput label="State" placeholder="e.g. Central" size="md" showHint={false}
                    value={stateVal} onChange={(e) => setStateVal(e.target.value)} />

                  <TextInput label="Default Currency" placeholder="Select currency" size="md" showHint={false} readOnly
                    iconRight={chevron} value={currency} onClick={() => setCurrencyOpen(true)} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </BottomSheet>

      {/* AC2 — payment-contact picker: search + select → prefill (all fields stay editable). */}
      <BottomSheet open={contactOpen} title="Prefill from a payment contact" onClose={() => setContactOpen(false)} heightClass="h-[72%]">
        <div className="flex flex-col gap-3">
          <Search placeholder="Search contacts" value={contactQuery} onChange={(e) => setContactQuery(e.target.value)} />
          <div className="flex flex-col gap-2">
            {contactMatches.map((c) => (
              <Tile
                key={c.id}
                title={c.name}
                description={[c.email, [c.city, c.country].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}
                onClick={() => prefillFromContact(c)}
              />
            ))}
            {contactMatches.length === 0 && (
              <p className="py-8 text-center text-[13px]" style={{ ...FONT, color: "#808080" }}>No contacts found.</p>
            )}
          </div>
        </div>
      </BottomSheet>

      <CountrySheet
        open={countryOpen}
        value={country}
        onClose={() => setCountryOpen(false)}
        onSelect={(c) => {
          setCountry(c);
          if (NO_POSTAL_COUNTRIES.includes(c)) setZip("");
          setCountryOpen(false);
        }}
      />

      <CurrencySheet
        open={currencyOpen}
        value={currency}
        onClose={() => setCurrencyOpen(false)}
        onSelect={(code) => {
          setCurrency(code);
          setCurrencyOpen(false);
        }}
      />
    </>
  );
}

export default AddCustomerSheet;
