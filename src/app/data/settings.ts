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
  city: "Hong Kong Island",
  state: "",
  zip: "",
  country: "Hong Kong",
  logo: { name: "lumen-logo.svg", size: 12_400 },
  paymentMethod: "personal", // Personal Saving — the PRIMARY receiving account
  chaserEnabled: true,
  reminders: ["3 days before due date", "3 days after due date"],
};
