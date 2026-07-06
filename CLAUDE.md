# CLAUDE.md

## What this repo is

A **mobile invoicing app UI prototype** (React + TS + Vite, 375×812 phone frame) with **dummy data
only** — hosted on Vercel to share flows with the PO and stakeholders, eventually ported to Figma Make.
Built screen-by-screen against Jira tickets (`doc/sales-invoice-flows/tickets/`) and Figma frames.

**The owner is not a developer; this codebase is maintained by Claude.** Optimize every change for
that: small focused files, one obvious home per concern, boring explicit code. **No state libraries,
no context providers, no barrel/index re-export files, no test suites.** Never change a flow's
behavior unless the task asks for it.

## Run / verify

- Dev server: **http://localhost:5173/** (usually already running; `pnpm dev` if not).
- Build check: **`./node_modules/.bin/vite build`** — NB plain `pnpm build` fails locally
  (pnpm v11 blocks un-approved build scripts before running any script); calling vite directly skips that.
- Transform-check one changed file (catches import/syntax errors, NOT runtime errors):
  `curl -s -o /tmp/m.out -w "%{http_code}" "http://localhost:5173/src/app/components/X.tsx"`
  then grep `/tmp/m.out` for `Failed to resolve|Transform failed|SyntaxError|Pre-transform error`.
- Full typecheck (strongest check; no tsconfig in repo, keep it that way):
  `npx -y -p typescript tsc --noEmit --jsx react-jsx --module esnext --moduleResolution bundler --target es2020 --skipLibCheck src/app/App.tsx` — or write a temp tsconfig in scratch space including `src` plus a `*.module.css` declaration shim.
- Always grep that new imports/symbols exist after using them. Verify UI changes by clicking through
  the affected flow in the browser.

## Where things live (refactored 2026-07-02 — keep this structure)

```
src/app/
  App.tsx            # THE screen router + all cross-screen state (customers, settings,
                     # refundState, openInvoice, nav context). Deliberately one file — don't split.
  types.ts           # ALL shared types (Screen, Customer, Invoice, CreditNote, DraftLine,
                     # CompanySettings, DetailStatus, …). One-component-only types stay in that file.
  data/              # ALL demo seed data, one file per register:
                     #   customers, invoices (+customerIdForInvoice), creditNotes, extraction,
                     #   receivingAccounts (+formatAccount/getAccount), paymentContacts,
                     #   attentionTasks, settings (DEFAULT_SETTINGS), heroScenarios
  lib/               # shared pure helpers:
                     #   theme.ts  → FONT / INK / MUTED (never re-declare these per file)
                     #   format.ts → money / fmtDate / formatMoney / EMAIL_RE
                     #   currency.ts → RATES / SUPPORTED_CURRENCIES / convert
                     #   status.ts → STATUS_PILL (list) / DETAIL_STATUS_META (detail page)
  components/        # small components flat; the 4 big screens each have a folder:
    sales-invoice-list/   # SalesInvoiceList (page) + filters.ts (pure) + InvoiceCard
    add-invoice-details/  # AddInvoiceDetails (page) + derive.ts + Banners + ExistingInvoiceSheet
    credit-note-form/     # CreditNoteForm (page) + lineMath.ts + ReasonSheet + ClientEditSheet
    invoice-detail/       # InvoiceDetailPage (page) + demoInvoice.ts + creditNoteTypes.ts +
                          # InfoBits + CreditsAppliedSection + ActionsMenu + RecordPaymentSheet + SendCnSheets
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

| screen | component | | screen | component |
|---|---|---|---|---|
| dashboard (landing) | Dashboard | | invoiceDetail | invoice-detail/InvoiceDetailPage |
| hub (Menu) | AccountingHub | | creditNote / refundCreditNote | credit-note-form/CreditNoteForm |
| list | sales-invoice-list/SalesInvoiceList | | creditNotes | CreditNotesList |
| customer (pick) | CreateSalesInvoice | | customers | CustomerList |
| details (editor) | add-invoice-details/AddInvoiceDetails | | customerDetail | CustomerDetailPage |
| upload / extracting | UploadInvoice / GeneratingInvoice | | addCustomer / editCustomer | AddCustomerPage |
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
- Credit-note lifecycle, refund lifecycle, corrected-invoice model, per-note send state, status
  chips: the full spec is **`doc/sales-invoice-flows/invoice-detail-behavior.md`** — read it before
  touching `invoice-detail/`, `credit-note-form/`, `CreditNoteDetailPage`, or `CreditNotesList`.
- Client delete/archive is out of scope (referential integrity; record shared with payments side).
- Sheet motion: sheets dim the page with `bg-black/25` scrim (no page recede/scale). `ButtonDock`
  labels single-line. Currency sheet height = Add-Services sheet (`SERVICE_SHEET_HEIGHT`).

## Docs (read before the matching task)

- `doc/sales-invoice-flows/context-sales-invoice.md` — working context + session log (keep updated).
- `doc/sales-invoice-flows/invoice-detail-behavior.md` — full invoice-detail / credit-note / refund spec.
- `doc/sales-invoice-flows/history/` — per-ticket build notes (customers 713/714, settings 764,
  built-per-ticket 715/716/718 + screen history).
- `doc/sales-invoice-flows/open-questions.md` — pending decisions (e.g. lock a CN once sent?,
  edit→auto-resend, provisional draft numbers — all pending Beatrice).
- `doc/sales-invoice-flows/tickets/` — the Jira tickets. **Preferred: fetch tickets live via the
  Jira (Atlassian) connector** and save them as `.md` files in the feature's `tickets/` folder — if
  it isn't authenticated this session, ask the user to run `/mcp` → "claude.ai Atlassian Rovo".
  Fallback for the existing PDFs: `pypdf` (poppler/`pdftotext` and the Read tool's PDF render are
  unavailable): `python3 -m pip install --quiet --user pypdf`, then a small pypdf script. Two FigJam
  exports: `Sales Invoices Details User Flows.pdf` (authoritative for detail-page actions) and
  `Upload sales invoice flow.pdf`.

## Out of scope / backend (unchanged by any of this)

Reconciliation auto-match, Overdue auto-transition, sequential number generation, real PDF files,
journal posting, backend persistence (all state resets on reload), BA transfer execution (stub),
chaser auto-deactivation on Paid, real duplicate matching (number-only in prototype), native scanner
(`ScanDocument` is a stand-in; real build uses the OS document scanner — decided 2026-06-24).

## Repo / deploy

Private GitHub **`apa-statrys/accounting`** (SSH). **The user runs commits/pushes themselves — only
stage (`git add`).** Vercel uses `pnpm install --frozen-lockfile`: keep `package.json` and
`pnpm-lock.yaml` in sync; don't add dependencies casually.
