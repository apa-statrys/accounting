import type { CompanySettings } from "../types";

/** Demo defaults — account settings already configured (Statrys HK), so invoices auto-apply them. */
export const DEFAULT_SETTINGS: CompanySettings = {
  currency: "USD",
  companyName: "Lumen Studio",
  registrationNumber: "2659283",
  email: "hello@lumenstudio.co",
  phone: "+852 1234 5678",
  website: "lumenstudio.co",
  address: "",
  city: "Sydney",
  state: "New South Wales",
  zip: "",
  country: "Australia",
  // No logo pre-set (PMT-41258: "Display Initials if no logo") — the Company Details page
  // falls back to an initials placeholder until one's uploaded through its own flow.
  logo: null,
  paymentMethod: "personal", // Personal Saving — the PRIMARY receiving account
  chaserEnabled: true,
  reminders: ["3 days before due date", "3 days after due date"],
};
