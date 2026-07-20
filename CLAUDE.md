# CLAUDE.md

## What this repo is

A **mobile invoicing app UI prototype** (React + TS + Vite, 375×812 phone frame) with **dummy data
only** — hosted on Vercel to share flows with the PO and stakeholders, eventually ported to Figma Make.
Built screen-by-screen against Jira tickets (fetch live via the Atlassian connector) and Figma frames.

**The owner is not a developer; this codebase is maintained by Claude.** Optimize every change for
that: small focused files, one obvious home per concern, boring explicit code. **No state libraries,
no context providers, no barrel/index re-export files, no test suites.** Never change a flow's
behavior unless the task asks for it.

## Run / verify

- Dev server: **http://localhost:5173/** (usually already running). Start it with
  **`./node_modules/.bin/vite`** if not — there's no `dev` script in `package.json` (and `pnpm`
  isn't guaranteed to be installed), so don't run `pnpm dev`.
- Same server, two entry points, no extra process needed: **`/`** is the app prototype,
  **`/#showcase`** is the design-system component gallery (a lightweight Storybook stand-in) —
  just open the link.
- Build check: **`./node_modules/.bin/vite build`** — NB plain `pnpm build` fails locally
  (pnpm v11 blocks un-approved build scripts before running any script); calling vite directly skips that.
- Transform-check one changed file (catches import/syntax errors, NOT runtime errors):
  `curl -s -o /tmp/m.out -w "%{http_code}" "http://localhost:5173/src/app/components/X.tsx"`
  then grep `/tmp/m.out` for `Failed to resolve|Transform failed|SyntaxError|Pre-transform error`.
- Full typecheck (strongest check; no tsconfig in repo, keep it that way):
  `npx -y -p typescript tsc --noEmit --jsx react-jsx --module esnext --moduleResolution bundler --target es2020 --skipLibCheck src/app/App.tsx` — or write a temp tsconfig in scratch space including `src` plus a `*.module.css` declaration shim.
- Always grep that new imports/symbols exist after using them. Verify UI changes by clicking through
  the affected flow in the browser.

## Where things live (refactored 2026-07-02; pages/components split 2026-07-14 — keep this structure)

```
src/app/
  App.tsx            # THE screen router + all cross-screen state (customers, settings,
                     # refundState, openInvoice, nav context). Deliberately one file — don't split.
  types.ts           # ALL shared types (Screen, Customer, Invoice, CreditNote, DraftLine,
                     # CompanySettings, DetailStatus, …). One-component-only types stay in that file.
  data/              # ALL demo seed data, one file per register:
                     #   customers, invoices (+customerIdForInvoice), creditNotes, extraction,
                     #   receivingAccounts (+formatAccount/getAccount), attentionTasks,
                     #   settings (DEFAULT_SETTINGS), heroScenarios
  lib/               # shared pure helpers:
                     #   theme.ts  → FONT / INK / MUTED (never re-declare these per file)
                     #   format.ts → money / fmtDate / formatMoney / EMAIL_RE
                     #   currency.ts → RATES / SUPPORTED_CURRENCIES / convert
                     #   status.ts → STATUS_PILL (list) / DETAIL_STATUS_META (detail page)
  ui/                # design-system components rebuilt from the Figma "[APP] Design System"
                     #   (file Lt9QLcfsxzo9gdTV8hbWgs). One folder per component with
                     #   index.tsx + index.module.css (Toggle, Button, FAB, TabsBase,
                     #   HorizontalTabs …); colors/radii come straight from styles/theme.css
                     #   and styles/tokens/*.css (:root CSS vars, Figma variable names in
                     #   comments) — no separate ui/tokens.css, one source of truth. FAB reuses
                     #   Button's color classes — keep those color-only.
                     #   Showcase.tsx = review gallery at /#showcase. RULE: every DS component
                     #   build OR update changes both the component folder and its Showcase page
                     #   (NAV entry + Overview demo + Variants grid) in the same pass.
  components/        # shared widgets only — sheets, cards, nav, inputs (no screens). Same
                     #   folder-per-component shape as ui/ now (index.tsx + index.module.css,
                     #   e.g. SearchField/, SelectionCard/, BottomSheet/ — SearchField/
                     #   SelectionCard renamed from Search/Tile 2026-07-16 to stop colliding
                     #   with ui/'s same-named DS components (genuinely different, not dupes).
                     #   ButtonDock + EditCard render ui/Button inside.
                     #   NB components/ui/ = legacy checkbox + utils (used by ReviewEmail,
                     #   ButtonDock); don't confuse with the DS ui/ above.
  pages/             # screens. A screen that owns sub-pages/parts lives in a folder
                     # holding the main page + its private pieces (folder-per-screen
                     # reorg 2026-07-17); standalone single-file screens stay flat.
    sales-invoice-list/   # SalesInvoiceList (page) + filters.ts (pure) + InvoiceCard
    add-invoice-details/  # AddInvoiceDetails (page) + derive.ts + recurrence.ts + Banners + ExistingInvoiceSheet
    credit-note-form/     # CreditNoteForm (page) + lineMath.ts + ReasonSheet + ClientEditSheet
    invoice-detail/       # InvoiceDetailPage (page) + demoInvoice.ts + creditNoteTypes.ts +
                          # InfoBits + CreditsAppliedSection + ActionsMenu + RecordPaymentSheet +
                          # SendCnSheets + RefundCreditNoteFlow (DES-720, private to this page)
    upload-invoice/       # UploadInvoice (page) + ScanDocument (native-scanner stand-in, private)
    credit-note-list/     # CreditNotesList (page) + CreditNoteDetailPage + CreditNotePreviewPage
                          # (the CN detail/preview are also opened from invoice-detail & the list)
    shared/               # pages rendered inside >1 screen's flow: InvoicePreviewPage
                          # (invoice-detail + add-invoice-details), ReviewEmail (both send
                          # flows + CN detail). Flat single-file screens (Dashboard, AccountingHub,
                          # InvoiceSettings, NeedAttention, CustomerList, CustomerDetailPage,
                          # AddCustomerPage, CreateSalesInvoice, GeneratingInvoice, DuplicateDecision,
                          # RecurringSeriesDetail) stay directly under pages/.
```

Rules for new code:
- **Types → `types.ts`. Demo data → `data/`. Pure shared helpers → `lib/`.** Never define shared
  data/types inside a component file, and never import data from another component's file.
- **Splitting a big component:** never move a `useState` out of the page; no custom hooks. Extract
  only (a) pure functions to a sibling `.ts`, (b) presentational sections taking explicit props
  (values + handler references). Handlers that call setState stay in the page. If an extraction
  would need >~15 props, leave it in the page.
- `money()` ("$6,450.00", separators) and `formatMoney()` ("HKD30.00", no separators) format
  **differently on purpose** — don't merge. Dashboard's `RECENT_PILL` and CustomerDetailPage's
  local `STATUS_PILL` are intentionally different palettes from `lib/status.ts` — keep local.
- Keep export names stable when moving code; update every importer in the same change (no shims).

## Screens (`Screen` union in types.ts → rendered by App.tsx)

All screen components live in `pages/`:

| screen | component | | screen | component |
|---|---|---|---|---|
| dashboard (landing) | Dashboard | | invoiceDetail | invoice-detail/InvoiceDetailPage |
| hub (Menu) | AccountingHub | | creditNote / refundCreditNote | credit-note-form/CreditNoteForm |
| list | sales-invoice-list/SalesInvoiceList | | creditNotes | credit-note-list/CreditNotesList |
| customer (pick) | CreateSalesInvoice | | customers | CustomerList |
| details (editor) | add-invoice-details/AddInvoiceDetails | | customerDetail | CustomerDetailPage |
| upload / extracting | upload-invoice/UploadInvoice / GeneratingInvoice | | addCustomer / editCustomer | AddCustomerPage |
| duplicateCheck | DuplicateDecision | | needAttention | NeedAttention |
| settings | InvoiceSettings | | send | (send sub-flow inside the editor/detail) |

Navigation notes: detail page tracks `detailReturn` (back + in-page actions return to wherever it was
opened) and `detailFlash` (one-off toast, cleared on back). Dev-only **QuickNav** FAB (bottom-left)
jumps between screens. `refundState` (App) syncs completed refunds across list/detail/CN-list
in-session only — a reload resets it (expected prototype limit).

## Key domain rules (decided — don't re-litigate)

- Invoice numbers **`INV-YYYY-NNNNNN`**, credit notes **`CN-YYYY-NNNNNN`** (both 6-digit). Drafts
  show a derived `DF-…` header; the real number is assigned on issue (DES-715).
- **Single-line toasts**, keyed to action: "Saved as draft" / "Saved as awaiting payment" /
  "Invoice created successfully" (upload-flow) / "Invoice marked as sent" / "Draft deleted" /
  "Changes saved" / "Payment recorded" / "Invoice voided" / "Invoice duplicated".
- **Edit (limited)** for issued invoices: editable = customer, due date, items, receiving account,
  discount; locked = invoice number (shown), issue date, currency. No auto-resend on save (deferred).
- **Invoice currency is fixed per invoice** — seeded OCR → edit-seed → customer default → Settings
  default; never chosen per invoice, never written back to the customer/Settings.
- **Never show a "$" glyph for money** — always the currency code, e.g. "USD 6,450.00", "HKD 30.00",
  "EUR 30.00" (ambiguous across currencies otherwise). `lib/format.ts`'s `money()`/`formatMoney()`
  take a `currency` argument and format this way; don't hardcode "$" in new code.
- Credit-note lifecycle, refund lifecycle, corrected-invoice model, per-note send state, status
  chips: the source of truth is the code itself (`invoice-detail/`, `credit-note-form/`,
  `credit-note-list/`) plus the live Jira tickets (DES-719/720/721) — read those before changing it.
- Client delete/archive is out of scope (referential integrity; record shared with payments side).
- Sheet motion: sheets dim the page with the shared `ui/Overlay` component (`--overlay`,
  `rgba(27, 27, 27, 0.6)` — Figma dev-mode spec; no page recede/scale). `ButtonDock` labels
  single-line. Currency sheet height = Add-Services sheet (`SERVICE_SHEET_HEIGHT`).

## Specs / tickets

There is **no local `doc/` folder** (removed 2026-07-17 — it had drifted out of sync with the code).
The source of truth is now: **the code itself** for built behavior, and **the live Jira tickets**
for requirements. Fetch tickets on demand via the **Jira (Atlassian) connector** (DES-7xx numbers
are referenced throughout the code comments); if it isn't authenticated this session, ask the user
to run `/mcp` → "claude.ai Atlassian Rovo". Figma frames are the visual source (Figma connector).

## Out of scope / backend (unchanged by any of this)

Reconciliation auto-match, Overdue auto-transition, sequential number generation, real PDF files,
journal posting, backend persistence (all state resets on reload), BA transfer execution (stub),
chaser auto-deactivation on Paid, real duplicate matching (number-only in prototype), native scanner
(`ScanDocument` is a stand-in; real build uses the OS document scanner — decided 2026-06-24).

## Repo / deploy

Private GitHub **`apa-statrys/accounting`** (SSH). **The user runs commits/pushes themselves — only
stage (`git add`).** Vercel uses `pnpm install --frozen-lockfile`: keep `package.json` and
`pnpm-lock.yaml` in sync; don't add dependencies casually.
