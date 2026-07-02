# Invoice Settings — DES-764 (`InvoiceSettings.tsx`, `settings` screen, built)

> Moved out of CLAUDE.md on 2026-07-02 (repo refactor). Behavior is current and decided.
> `CompanySettings` type lives in `src/app/types.ts`; `DEFAULT_SETTINGS` in `src/app/data/settings.ts`.

Account-level settings set once and auto-applied to every invoice (not editable per-invoice). Opened
from the dashboard **gear** (`onSettings`). **Edits apply live; the back arrow persists** (`onExit(s)` →
App `settings` state) — there is **no Save button** (section sheets have a dirty-gated "Save changes" that
just closes). **No invoice-template preview** (decided 2026-06-29 — not shown). Intro: "These settings
apply to all new sales invoices." Cards spaced `gap-4` (16px).

- **Layout (Revolut-style, grouped):** **grouped sections**, each a header label over a `Group` (dashed
  cream card holding `Row`s with internal dividers, **no row icons**). Order: ① **Company** (FIRST,
  top) — identity **logo + company name + email** as the first row → "Company Profile" sheet, then Company
  Details → sheet, Business Address → sheet; ② **Invoice defaults** — Currency → `CurrencySheet`, Payment
  Method (value = account name) → `ReceivingAccountSheet`; ③ **Notifications** — Automatic reminders (value
  "On/Off", **chevron → its own detail sub-page**). Each `Row` = optional `leading` (only the identity row
  uses it, for the logo) + title + subtitle + trailing value-chevron OR toggle.
- **Automatic Reminders sub-page** (internal `view` state `"main" | "reminders"`, NOT an App screen; back
  arrow → `main`): a master **`Toggle`** ("Automatic reminders", `chaserEnabled`) on top; while **on**, a
  `Group` of **2 reminder rows** (`REMINDER_DEFS`) — each shows its chosen timing (or "Disabled") + chevron,
  tap → a **`BottomSheet` of `Tile` radio options**. Reminder 1 = before-due presets (7/5/3/1 days before, on
  due date), Reminder 2 = after-due presets (on due date, 1/3/7/14 days after); the first option in each is
  **`REMINDER_OFF` ("Don't send")** which disables that reminder. Stored in `reminders: string[]` (default
  `["3 days before due date","3 days after due date"]`). Replaced the earlier checkbox/preset-cadence
  models; timings are preset-only (no free entry / add-remove rows).
- **Payment Method (DES-764, #2):** the default **receiving account** customers pay into. Reuses the
  invoice's **`ReceivingAccountSheet`** (same `RECEIVING_ACCOUNTS` source of truth, now in
  `src/app/data/receivingAccounts.ts`) — `paymentMethod` stores the account **id**, default **`personal`**
  (Personal Saving, the PRIMARY account). Card value = `formatAccount(...)` e.g. "Personal Saving (..168)".
  **Wired into the invoice:** `AddInvoiceDetails` takes a `defaultAccountId` prop (App passes
  `settings.paymentMethod`) seeding the invoice's Receiving Account row.
- **Automated chaser (DES-764 AC5, #1):** account default lives in Settings → **Notifications → Automatic
  reminders** sub-page (master `Toggle` `chaserEnabled` + 2-reminder preset picker, see above). The
  **per-invoice toggle** is in `AddInvoiceDetails` as an **"Automatic reminders" card styled like the
  Discounts card** (white dashed card + brand `Toggle`; title = "Automatic reminders" / subtitle = "Email
  until invoice is paid"), placed **between Discounts and Summary** (gated on `services.length > 0`),
  `defaultChaser` prop seeded from `settings.chaserEnabled`, shown across all creation flows (create /
  upload / edit). Both this card's and the Discount card's titles use **`card-title-2xs`** (matching the
  customer card). Auto-deactivation once Paid = backend (out of scope). Brand-orange switch = shared
  **`Toggle.tsx`** (the Radix `ui/switch` was avoided — its tokens are undefined in this theme).
- **Logo** = inline **`LogoMark`** (orange monogram tile from the company initial — CSP-safe, no external
  asset; swap for the real SVG/PNG later). Upload control = centered dashed dropzone ("Upload company logo"
  / "JPG or PNG • Up to 10 MB"); rules JPG/PNG ≤10 MB. Demo company = **Lumen Studio** (`DEFAULT_SETTINGS`, HK).
- **Per-section editing** — each section opens **ONE** bottom sheet (not one per field). **"Save changes"**
  CTA is **dirty-gated** (disabled until something changes) **and** validity-gated (required fields filled,
  email valid). Inputs have meaningful **placeholders, no helper text**.
- **Business Address** — **Country first (dropdown)**, drives **City** (dropdown when the country has preset
  cities, else free text) and **State** (dropdown, shown **only** if the country has states). Changing country
  resets city/state (+ zip). **Zip hidden for Hong Kong** (`NO_POSTAL_COUNTRIES`, not required there).
  **Address is last.** Country/city/state pickers reuse the **`Tile`** selection style; country options show
  a **flag**; the long country list has a **search** (`>8` options). Address sheet + picker share **`h-[72%]`**.
- **Currency is FIXED + seed precedence (DES-764 + DES-713):** `AddInvoiceDetails` takes a `defaultCurrency`
  prop; the invoice currency is **seeded read-only** — **never chosen per invoice** (the `CurrencySheet`
  selector was removed; line items may still carry their own currency and convert into the invoice
  currency). **Seed precedence (highest first):** OCR (`extracted.currency`) → edit-seed (`initial.currency`)
  → **customer default (`customer.currency`, DES-713 per-client)** → account **Settings** (`settings.currency`).
  Implemented as `extracted?.currency || initial?.currency || defaultCurrency`, with App passing
  `defaultCurrency={customer?.currency ?? settings.currency}` (demo: Meridian=EUR, Halcyon=GBP). Seeding is
  **one-directional** — the invoice currency **never writes back** to the customer record or Settings. The
  **customer/invoice currency = what you BILL in; NOT the functional currency** (accountant-only, out of
  scope). They connect only via FX at the ledger.
