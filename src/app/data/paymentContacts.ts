/**
 * Demo Statrys payment contacts (DES-713 AC2 — "prefill from a payment contact").
 *
 * In production these are the payees/beneficiaries the client already holds on the BANKING side — the
 * client record is the SAME synced record shared with payments/contacts. The real source + sync is
 * backend ("implemented on Tech side" per Beatrice); this is a demo stand-in so the prefill picker works.
 * Fields map 1:1 onto the Add Client form so selecting one auto-fills every matching field (all editable).
 */
import type { PaymentContact } from "../types";

export const PAYMENT_CONTACTS: PaymentContact[] = [
  { id: "pc-nimbus", name: "Nimbus Cloud Ltd", email: "ap@nimbuscloud.io", firstName: "Grace", lastName: "Tan", regNo: "201811223C", phone: "+65 6123 4567", website: "nimbuscloud.io", address: "12 Marina View, #22-01", city: "Singapore", zip: "018961", country: "Singapore", currency: "SGD" },
  { id: "pc-orchid", name: "Orchid Textiles Co.", email: "billing@orchidtextiles.hk", phone: "+852 2890 1122", address: "Unit 5A, Kwun Tong Ind. Centre", city: "Hong Kong", country: "Hong Kong", currency: "HKD" },
  { id: "pc-brightwave", name: "Brightwave Media GmbH", email: "finance@brightwave.de", firstName: "Lukas", lastName: "Weber", regNo: "HRB 92831", phone: "+49 30 1234 5678", website: "brightwave.de", address: "Torstraße 140", city: "Berlin", state: "Berlin", zip: "10119", country: "Germany", currency: "EUR" },
  { id: "pc-copperfield", name: "Copperfield & Sons", email: "accounts@copperfield.co.uk", phone: "+44 20 7946 0991", address: "48 Shoreditch High St", city: "London", zip: "E1 6JQ", country: "United Kingdom", currency: "GBP" },
  { id: "pc-aurora", name: "Aurora Robotics Inc.", email: "ap@aurorarobotics.com", firstName: "Maya", lastName: "Chen", phone: "+1 415 555 0142", website: "aurorarobotics.com", address: "500 Terry Francois Blvd", city: "San Francisco", state: "CA", zip: "94158", country: "United States", currency: "USD" },
  { id: "pc-sakura", name: "Sakura Foods K.K.", email: "keiri@sakurafoods.jp", phone: "+81 3 1234 5678", address: "2-11-3 Meguro", city: "Tokyo", zip: "153-0063", country: "Japan", currency: "JPY" },
];
