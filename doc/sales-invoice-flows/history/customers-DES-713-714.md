# Customers register — DES-713 (Add Client) + DES-714 (Edit Client)

> Moved out of CLAUDE.md on 2026-07-02 (repo refactor). Behavior described is current and decided.
> Data now lives in `src/app/data/customers.ts` (`CUSTOMERS`) with the `Customer` type in
> `src/app/types.ts`; App owns the single `customers` state seeded from it.

- **Customer register is UNIFIED (fixed 2026-07-01):** App owns the single `customers` state (seeded from
  `CUSTOMERS`) and passes it to **`CustomerList`, `CreateSalesInvoice` (`customers` + `onCustomerAdded`), and
  `CustomerSheet` (via `AddInvoiceDetails`)** — so a client added anywhere appears everywhere. (Previously
  three disconnected sources.) **Invoice↔customer link is by STABLE id** (`customerIdForInvoice` in
  `src/app/data/invoices.ts` maps via the register's original names) — renaming a client no longer orphans
  their invoices on the detail. **FX rates cover all 7 currencies used** (USD/SGD/HKD/EUR/GBP/AUD/JPY in
  `src/app/lib/currency.ts` `RATES` + `SUPPORTED_CURRENCIES`; `CurrencySheet` lists all 7) — before,
  EUR/GBP/etc. converted silently at 1:1.
- **CustomerList.tsx** (`customers` screen, **DES-713/714**) — the central Customers register under Sales
  (Qonto's Clients tab is a sibling of Sales Invoices/Credit Notes, confirmed against Qonto). Alphabetical
  rows = initials avatar + name + **email only** (decided — no amount-due/count), search, an **"+ ADD NEW"**
  outlined pill (toolbar, right of the count) → the **full-page** Add Client form (NOT a sheet). Source =
  shared **`CUSTOMERS`** register, owned by App (`customers` state) so the full-page add appends to it;
  a one-off **success toast** ("<name> added", AC5) shows on return. Tap a row → **`CustomerDetailPage`**.
- **Two-tier Add Client form (DES-713, decided 2026-07-01):** the form has **two entry points → two
  surfaces**. ① **Client List** → **`AddCustomerPage.tsx`** (`addCustomer` screen), a **FULL PAGE** with the
  complete Client Field Spec and the **required set enforced: Company Name, Email, Address, City, Postal
  Code, Country** (First/Last, Reg No, Phone, Website, State, Currency optional; formats validated when
  filled; duplicate name/email → warn + "Save Anyway"). **Zip is hidden + not required for no-postal
  countries** (`NO_POSTAL_COUNTRIES` = ["Hong Kong"] — diverges from the ticket's literal "Zip Required";
  flagged to Beatrice). ② **In-invoice quick-add** (`CreateSalesInvoice`) = **`AddCustomerSheet` BottomSheet
  with the SAME FIELDS as `AddCustomerPage`** (changed 2026-07-02), but scoped as a fast add: **only Company
  Name + Email are required and shown up front**; the rest of the spec sits under an **"Add more details
  (optional)" accordion**. Includes **prefill-from-contact (AC2)** at the top (opens the accordion on select).
  Format validation, duplicate → "Save Anyway", nested Country/Currency/Contact pickers as sibling sheets —
  all in the sheet so the user never leaves the invoice. On save it auto-selects the new client into the
  invoice. `Customer` was **extended** with the full optional field set. The full page's **Save CTA is
  validity-gated** (disabled until required + formats valid; required-empty shows no inline error — the
  disabled CTA + required marker convey it; only format errors surface live). Success uses the **shared
  `SendSuccessToast`**.
- **AC2 — "Prefill from a payment contact" (DES-713, built 2026-07-01):** AC2 is a *population method*,
  not a navigation entry point — a control at the **top of `AddCustomerPage`** ("Prefill from a payment
  contact" → `ContactsOutlined` card, above an "or enter manually" divider) opens a **`BottomSheet` picker**
  (Search + `Tile` rows) over **`src/app/data/paymentContacts.ts`** (`PAYMENT_CONTACTS` — demo Statrys
  banking-side payees; real source/sync is backend per Beatrice). Selecting one **auto-fills every matching
  field, all still editable**. Also in the in-invoice quick-add sheet (`AddCustomerSheet`, 2026-07-02).
- **Client delete/archive is OUT OF SCOPE** (both DES-713 & DES-714 Notes). Don't hard-delete —
  invoices/CNs reference the client (referential integrity), audit/retention, and the record is **shared
  with the payment/contacts side**. If ever needed → **Archive (soft, guarded when the client has
  invoices)**, as its own story (confirm with Beatrice). **AC6 (save-failure recovery) still unbuilt.**
- **CustomerDetailPage.tsx** (`customerDetail`) — **Option B (chosen 2026-07-01): a fleshed-out detail page,
  BEYOND the tickets** (713/714 spec no client view page). Shows an **identity row** (initials + name +
  city/country) then the **full DES-713 Client Field Spec as grouped `Section` cards — present fields only**
  (empty cards auto-hidden): **Contact** (email/phone/website), **Company** (contact person/reg no.),
  **Address** (address/city/state/postal/country), **Billing** (default currency) + the **Invoices** list
  (this customer's invoices, linked from the **exported `INVOICES`** by client name — some demo names don't
  match `CUSTOMERS`, so a few show an empty state; row → invoice detail, `detailReturn:"customerDetail"`).
  ⋯ **Edit customer** → **`onEdit`** opens the **full-page `AddCustomerPage` in edit mode** (DES-714, built).
  The record is **owned by App** (edits flow back via props; the detail reads `customer` directly), and a
  **"Changes saved"** `SendSuccessToast` shows on return (`flash` prop). **TODO:** real per-customer invoice
  link (name-match is demo-only); propagation matrix / concurrent-edit = backend (out of scope).
- **DES-714 Edit Client (built 2026-07-01) — `AddCustomerPage` edit mode:** `mode="edit"` + `initial` (the
  record) seeds every field; title **"Edit Customer"**, CTA **"Save Changes"** (validity-gated **AND
  dirty-gated**), **id preserved** on save, prefill-from-contact hidden (add-only). **Unsaved-changes
  discard warning (AC1):** the header back is `requestBack` → if `dirty`, a **"Discard changes?"**
  `BottomSheet` (Discard / Keep Editing) instead of leaving. **Duplicate check excludes the edited record**
  (App passes `existing` filtered by id). App screen **`editCustomer`** (reached only from the detail's ⋯,
  matching 714 "Edit from Client List only, not from within an invoice"). Save → `setCustomers(map
  id→updated)` + `setSelectedCustomer` + toast + back to detail. Out of scope (backend): propagation matrix
  (draft/future vs sent/paid), concurrent-edit conflict + audit (AC4/AC5).
