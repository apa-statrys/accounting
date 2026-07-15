// Feature gates for unreleased flows. `import.meta.env.DEV` is true only under the local Vite dev
// server (localhost); ANY build — Vercel preview and production (main) — is false.
//
//  • SHOW_CREDIT_NOTES — DES-719 / 763 credit notes. ENABLED everywhere (incl. prod `main`) so the PO
//    can walk the lifecycle on the hosted demo (2026-07-13). Set back to `import.meta.env.DEV` to hide.
//  • SHOW_RECURRING    — DES-782 recurring invoices / series. Hidden EVERYWHERE incl. local dev
//    (2026-07-15: recurring moved to the next phase — set back to `import.meta.env.DEV` to resume).
export const SHOW_CREDIT_NOTES: boolean = true;
export const SHOW_RECURRING: boolean = false;
