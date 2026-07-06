import type { ExtractedInvoice, ExistingInvoice } from "../types";

/** Invoices already in the system — used for the duplicate-number warning (DES-716). */
export const EXISTING_INVOICES: ExistingInvoice[] = [
  { number: "INV-2026-000041", customer: "Bright Harbor Co.", issueDate: "20 Jun 2026", dueDate: "20 Jul 2026", currency: "USD", amount: "$283.23", status: "Draft" },
  // Issued match (demo for the "View Invoice" duplicate path — Awaiting Payment). This one was
  // UPLOADED, so it uses the uploaded-invoice format UPL-YYYY-NNNNNN (never our INV-YYYY-NNNNNN).
  { number: "UPL-2026-000042", customer: "Marlow & Finch Studio", issueDate: "12 Jun 2026", dueDate: "12 Jul 2026", currency: "USD", amount: "$6,430.05", status: "Awaiting" },
  { number: "INV-2026-000043", customer: "Otto Reyes", issueDate: "18 Jun 2026", dueDate: "18 Jul 2026", currency: "USD", amount: "$100,034.00", status: "Draft" },
];

/**
 * Demo extraction for the uploaded PNG invoice.
 *
 * In production an OCR/LLM pass would read these off the file; to keep the
 * prototype free of token cost we return fixed demo values that match the
 * sample invoice and flag the customer email as "not found" so the user fills it in.
 */
export const DEMO_EXTRACTION: ExtractedInvoice = {
  invoiceNumber: "UPL-2026-000103", // uploaded invoices use UPL-YYYY-NNNNNN, not our INV format
  customerName: "Daniel Smith",
  customerEmail: "",
  emailNotFound: true,
  currency: "USD",
  issueDate: new Date(2025, 4, 17),
  dueDate: "26 May 2025",
  services: [
    { id: "ext-a", name: "Product A", currency: "USD", unit: "Piece", quantity: 10, unitPrice: 19.99 },
    { id: "ext-b", name: "Product B", currency: "USD", unit: "Piece", quantity: 5, unitPrice: 9.99 },
  ],
};

/**
 * OCR read the invoice's LINE ITEMS but could NOT read the customer name or email (DES-716). The editor
 * shows the "N out of M extracted" review card and empty Customer name + Email inputs (email flagged
 * "Cannot extract the information"), plus the "Save … to my customer list" checkbox.
 */
export const DEMO_EXTRACTION_NO_CUSTOMER: ExtractedInvoice = {
  invoiceNumber: "UPL-2026-000103", // uploaded invoices use UPL-YYYY-NNNNNN, not our INV format
  customerName: "",
  customerEmail: "",
  emailNotFound: true,
  currency: "USD",
  issueDate: new Date(2025, 4, 17),
  dueDate: "26 May 2025",
  services: [
    { id: "ext-a", name: "Product A", currency: "USD", unit: "Piece", quantity: 10, unitPrice: 19.99 },
    { id: "ext-b", name: "Product B", currency: "USD", unit: "Piece", quantity: 5, unitPrice: 9.99 },
  ],
};

/**
 * OCR read nothing usable — drop the user into the upload form blank (DES-716).
 * `isExtracted` stays true (upload mode: invoice-number field + attached file), but every
 * field is empty so the user fills the required fields in. Paired with `extractionFailed`.
 */
export const BLANK_EXTRACTION: ExtractedInvoice = {
  invoiceNumber: "",
  customerName: "",
  customerEmail: "",
  emailNotFound: true,
  currency: "",
  issueDate: new Date(2026, 5, 22),
  dueDate: "",
  services: [],
};

/**
 * Demo extraction whose customer matches an existing client (Marlow & Finch Studio).
 * Used to show the "auto-matched" trigger case on the upload review screen.
 */
export const DEMO_EXTRACTION_MATCHED: ExtractedInvoice = {
  invoiceNumber: "UPL-2026-000042", // already exists → demonstrates the duplicate-number warning
  customerName: "Marlow & Finch Studio",
  customerEmail: "finch@studio.com",
  emailNotFound: false,
  currency: "USD",
  issueDate: new Date(2026, 5, 2),
  dueDate: "Next 30 days",
  services: [
    { id: "ext-c", name: "Brand identity system", currency: "USD", unit: "Project", quantity: 1, unitPrice: 4200 },
    { id: "ext-d", name: "Landing page design", currency: "USD", unit: "Page", quantity: 3, unitPrice: 580 },
  ],
};
