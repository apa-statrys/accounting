import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { BottomSheet, sheetItem } from "./BottomSheet";
import { TextInput } from "./TextInput";
import { ButtonDock } from "./ButtonDock";
import { CurrencySheet } from "./CurrencySheet";
import { CountrySheet } from "./CountrySheet";
import type { Customer } from "./CreateSalesInvoice";

const FONT = { fontFamily: "GT Walsheim LC, sans-serif" } as const;
const chevron = <ExpandMoreIcon style={{ fontSize: 20, color: "#808080" }} />;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+()\d][\d\s()-]{5,}$/;
const URL_RE = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/;

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
  /** Returns the new client record (id + company name + email) on save. */
  onAdd?: (customer: Customer) => void;
}

/**
 * Add Client form (DES-713 — Client Field Specification), scoped for the
 * create-invoice Customer List: only Company Name + Email are required to add;
 * the rest of the spec's fields live under an optional "Add more details"
 * expander. Validates formats, warns on a possible duplicate, then adds.
 */
export function AddCustomerSheet({ open, existing = [], defaultCurrency = "USD", initialCompany = "", initialEmail = "", onClose, onAdd }: AddCustomerSheetProps) {
  const [company, setCompany] = useState(initialCompany);
  const [email, setEmail] = useState(initialEmail);
  const [currency, setCurrency] = useState(defaultCurrency);

  // Optional (collapsed) fields
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

  const [showMore, setShowMore] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [overrideDup, setOverrideDup] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);

  // Required: Company Name + Email. Optional fields validate format only when filled.
  const errors = {
    company: !company.trim() && "Company name is required",
    email: !email.trim() ? "Email is required" : !EMAIL_RE.test(email.trim()) && "Enter a valid email",
    phone: phone.trim() && !PHONE_RE.test(phone.trim()) ? "Enter a valid phone number" : false,
    website: website.trim() && !URL_RE.test(website.trim()) ? "Enter a valid website" : false,
  } as const;

  const isValid = !Object.values(errors).some(Boolean);

  const duplicate =
    isValid &&
    existing.find(
      (c) =>
        c.name.trim().toLowerCase() === company.trim().toLowerCase() ||
        c.email.trim().toLowerCase() === email.trim().toLowerCase()
    );

  const err = (key: keyof typeof errors) => (submitted && errors[key] ? errors[key] : false);

  const reset = () => {
    setCompany(""); setEmail(""); setCurrency(defaultCurrency);
    setFirstName(""); setLastName(""); setRegNo(""); setPhone(""); setWebsite("");
    setAddress(""); setCity(""); setStateVal(""); setZip(""); setCountry("");
    setShowMore(false); setSubmitted(false); setOverrideDup(false);
  };

  const handleSave = () => {
    setSubmitted(true);
    if (!isValid) {
      // Reveal the expander if the only problems are inside it (phone/website).
      if (!errors.company && !errors.email) setShowMore(true);
      return;
    }
    if (duplicate && !overrideDup) {
      setOverrideDup(true);
      return;
    }
    onAdd?.({ id: `cust-${Date.now()}`, name: company.trim(), email: email.trim() });
    reset();
  };

  return (
    <>
      <BottomSheet
        open={open}
        title="New Customer"
        onClose={onClose}
        footer={
          <ButtonDock
            type="single"
            primaryLabel={duplicate && overrideDup ? "Save Anyway" : "Add Customer"}
            onPrimary={handleSave}
            homeIndicator
          />
        }
      >
        <div className="flex flex-col gap-4">
          {/* Possible duplicate warning */}
          {submitted && duplicate && (
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
            <TextInput label="Company Name" placeholder="e.g. Marlow & Finch Studio" size="md" showHint={!err("company")}
              error={err("company")} value={company} onChange={(e) => setCompany(e.target.value)} />
          </motion.div>

          <motion.div variants={sheetItem}>
            <TextInput label="Email Address" type="email" placeholder="name@company.com" size="md" showHint={!err("email")}
              error={err("email")} value={email} onChange={(e) => setEmail(e.target.value)} />
          </motion.div>

          {/* Optional details */}
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

                  <div className="flex gap-4">
                    <TextInput label="City" placeholder="e.g. Singapore" size="md" showHint={false} className="flex-1"
                      value={city} onChange={(e) => setCity(e.target.value)} />
                    <TextInput label="Zip / Postal" placeholder="e.g. 049513" size="md" showHint={false} className="flex-1"
                      value={zip} onChange={(e) => setZip(e.target.value)} />
                  </div>

                  <TextInput label="State" placeholder="e.g. Central" size="md" showHint={false}
                    value={stateVal} onChange={(e) => setStateVal(e.target.value)} />

                  <TextInput label="Country" placeholder="Select country" size="md" showHint={false} readOnly
                    iconRight={chevron} value={country} onClick={() => setCountryOpen(true)} />

                  <TextInput label="Default Currency" placeholder="Select currency" size="md" showHint={false} readOnly
                    iconRight={chevron} value={currency} onClick={() => setCurrencyOpen(true)} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </BottomSheet>

      <CountrySheet
        open={countryOpen}
        value={country}
        onClose={() => setCountryOpen(false)}
        onSelect={(c) => {
          setCountry(c);
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
