// Feature gates for unreleased flows. `import.meta.env.DEV` is true only under the local Vite dev
// server (localhost); ANY build — Vercel preview and production (main) — is false. So these features
// stay usable while developing on localhost but never ship to prod. Decided 2026-07-13.
//
//  • SHOW_CREDIT_NOTES — DES-719 / 763 credit notes (list, create/apply, refund, invoice Credits).
//  • SHOW_RECURRING    — DES-782 recurring invoices / series.
export const SHOW_CREDIT_NOTES: boolean = import.meta.env.DEV;
export const SHOW_RECURRING: boolean = import.meta.env.DEV;
