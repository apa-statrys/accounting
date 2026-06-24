# CLAUDE.md

## Sales Invoice Flows (active work)

This repo is a **mobile invoicing app prototype** (React + TS + Vite, ported eventually to
Figma Make), built screen-by-screen against Jira tickets and Figma frames.

**Before starting any sales-invoice task, read:**

- **`doc/sales-invoice-flows/context-sales-invoice.md`** — working context: architecture,
  screen flow, key components, decided behaviors (don't re-litigate), how to run/verify
  locally, design tokens, and pending/deferred work. Keep this file updated as flows land.
- **`doc/sales-invoice-flows/tickets/`** — source requirements (the Jira PDFs):
  - `DES-713` — Story 1: Sales Invoice List and Invoice Settings (PDF body actually
    specs the Add-Client form; "Invoice Settings" is sub-task DES-764)
  - `DES-714` — Story 2: Edit Client Details Record
  - `DES-715` — Story 3: Create Sale Invoice (now in repo; sub-task DES-764 Sales
    Invoice settings)
  - `DES-716` — Story 4: Client upload Invoice
  - `DES-718` — Story 5: Client Send Sales Invoices
  - `DES-719` — Story 6: Create Sales Credit Notes
  - `DES-720` — Story 7: Refund Client with Credit Notes
  - `DES-721` — Story 8: View Credit Note Details
  - `DES-766` — Create and Manage Sales Invoice List (ADMIN & CLIENT) — not yet read

Read ticket PDFs with `pypdf` (poppler/`pdftotext` and the Read tool's PDF render are
unavailable): `python3 -m pip install --quiet --user pypdf`, then a small pypdf script.
There are also two FigJam exports in `tickets/`: **`Sales Invoices Details User Flows.pdf`**
(authoritative for the detail-page actions) and `Upload sales invoice flow.pdf`.

## Run / verify locally

Vite dev server on **http://localhost:5173/**. Transform-check a changed file (catches
import/transform/syntax errors, NOT runtime errors):
`curl -s -o /tmp/m.out -w "%{http_code}" "http://localhost:5173/src/app/components/X.tsx"`
then grep `/tmp/m.out` for `Failed to resolve|Transform failed|SyntaxError|Pre-transform error`.
Always grep that new imports/symbols exist after using them. Phone frame is **375×812**.

## App shell & navigation (`src/app/App.tsx`)

Screen router. `Screen = "dashboard" | "list" | "customer" | "details" | "upload" | "extracting" |
"send" | "invoiceDetail" | "needAttention" | "duplicateCheck"`. App **lands on `dashboard`** (the
Accounting Hub was removed 2026-06-24). Dev-only **QuickNav** FAB (bottom-left) jumps between sections. Detail page tracks `detailReturn` (back **and** in-page actions return to wherever
it was opened — list / dashboard / needAttention) and `detailFlash` (one-off toast on arrival; back
clears it so it shows once). Invoice numbers use **`INV-YYYY-NNNNN`** (5-digit, e.g. `INV-2026-00001`).
**`doc/sales-invoice-flows/context-sales-invoice.md` → "Session update (2026-06-24)" is the current
truth** for the upload/duplicate flow, dashboard hero, send sub-flow, and Needs Attention.

- **AccountingHub.tsx** / **FinanceBottomNav.tsx** — the finance-app Menu hub. **Removed from the app
  2026-06-24** (no longer the landing; files remain on disk but unused). Dashboard is now the root,
  with **no back arrow**.
- **Dashboard.tsx** — Sales dashboard (Figma 484:4564), the landing screen. **Hero = two glassy sub-cards**: Collected
  (border + blur, green `#58c67f` %, gradient progress bar, peer note) and Outstanding (bg-white/10 +
  blur, overdue line, outlined **View All** → Outstanding list). Header bell **+ Settings gear**
  (`onSettings`, unwired — DES-764). **Recent Invoices = 5 rows + a "View all invoices" button.**
  **NEEDS ATTENTION** preview stack; **"View All" only when > 2** → `needAttention`.
- **DuplicateDecision.tsx** (`duplicateCheck`) + **UploadedFile.tsx** (`UploadedFileCard` +
  `FilePreviewOverlay`) — see the upload/duplicate flow in the detail-page section below.
- **NeedAttention.tsx** — dedicated "Needs Attention" screen. Cards = cream `#faf9f4` + **solid** border
  + **black CTA pill** (the dashboard stack now matches: cream cards, black CTA). `ATTENTION_TASKS`
  (exported here) is the single source of truth for the dashboard count + stack. Types: payment-match /
  extracted / overdue / duplicate / overpayment; tap a card/CTA → that invoice's detail. Helper text:
  "N items require action. Open an item to resolve it."
- **CreateSalesInvoice.tsx** customer page — **Frequently used = row of 5 circular initial avatars**
  (orange when selected); **OTHERS** below as `Tile` rows; search → one flat RESULTS list.
- **SalesInvoiceList.tsx** — list; cards tappable → detail; one demo draft is `origin:"uploaded"`
  (INV-2026-00002), INV-2026-00003 is a created draft. Card meta: invoice number medium-weight,
  due/paid date regular (overdue 600 red). **Customer avatars removed app-wide** (temporary, pending
  invoice-number layout confirmation).

## Invoice detail page (`InvoiceDetailPage.tsx`) — status-aware, follows the FigJam user flow

All info in **dashed `InfoCard`s**. Statuses: Draft / Awaiting / Overdue / PartiallyPaid /
Paid / Void. Actions per state (from `Sales Invoices Details User Flows.pdf`):

- **Created draft** → primary **Send invoice**, secondary **Mark as paid**; ⋯ Edit + Duplicate + Delete.
- **Uploaded draft** → primary **Mark as sent** (→ Awaiting via `onIssued`, toast "Invoice marked as
  sent" — already-sent-externally is the common case), secondary **Mark as paid** (→ Paid); ⋯ Send
  invoice + Edit + Duplicate + Delete. (`origin` threaded list/dashboard → App → page.)
- **Awaiting / Overdue / PartiallyPaid** → **primary Mark as paid**, **secondary Resend
  invoice**; ⋯ Edit invoice (Awaiting/Overdue) + Duplicate invoice + Void invoice (Awaiting/
  Overdue). "Mark as paid" opens an amount sheet: `< total`→Partially Paid, `= total`→Paid,
  `> total`→Paid + **overpayment flagged for review**. Void → Void (credit note = DES-719, later).
- **Paid / Void** → read-only, Download PDF.
- **Send sub-flow**: **Delivery method is a full PAGE** (`SendInvoiceSheet`, slides in, ✕ top-left —
  create flow ✕ saves draft → list; detail-page resend ✕ → back; "Download" option = **"Preview as
  PDF"**). The page stays mounted (`z-40`) and **Email review / Share-link sheet / PDF preview all open
  INSTANTLY over it — no transition**. **`ShareLinkSheet`** CTA = **"Mark as sent"**, disabled until the
  link is copied/shared; copy-then-close stays a draft (only the CTA marks sent). **`ReviewEmail`**: cc
  checkbox = "Send me a copy" + "Add Recipients" helper text.
- **Receiving account** card shows critical fields (holder, account no.) with Bank / SWIFT /
  **payment reference** (issued only) under a "Show more" accordion. Statrys HK format:
  number `HK883-168888-168`, SWIFT `STYSHKHH` (SG account prefixed `SG…`); same data in
  `ReceivingAccountSheet.tsx` `RECEIVING_ACCOUNTS`.
- **Invoice number**: hidden on created drafts (assigned on issue, DES-715); shown for uploaded
  drafts (user/OCR value) and all issued. Format **`INV-YYYY-NNNNN`** (5-digit). NOTE: field-spec
  table says 6-digit `######`, DES-766/mockups say 5-digit — we use 5; reconcile w/ Beatrice.

## Decided behaviors (don't re-litigate)

- **Single-line toasts** (no subtext), keyed to action: "Saved as draft" / "Saved as awaiting
  payment" (issue/record-only) / "Invoice marked as sent" / "Draft deleted" / "Changes saved"
  (edit save) / "Payment recorded" / "Invoice voided" / "Invoice duplicated".
- **Edit (limited)** opens `AddInvoiceDetails` with `initial.limited`. **Editable**: customer,
  due date, items, receiving account, discount. **Locked/dimmed** (`Item disabled`): invoice
  number (shown), issue date, currency. Edit mode = title "Edit invoice", back arrow (not ✕),
  primary **Save** — both back & Save return to the detail page (Save → "Changes saved" toast).
  **No auto-resend on save** (ticket DES-715 AC4 wants resend-if-previously-sent — DEFERRED,
  pending Beatrice).
- Bottom-sheet open/close motion (book-page recede was **removed** from `AddInvoiceDetails` — sheets
  now just dim the full-size page with the `bg-black/25` scrim, no scale/round). `ButtonDock` labels
  are single-line and one size smaller (no wrap). **Currency sheet height = Add Services sheet** via
  shared `SERVICE_SHEET_HEIGHT` (`heightClass` prop on `BottomSheet`).
- **Customer + product cards** (create flow) share one trailing **chevron with a hover nudge**
  (`group-hover:translate-x-1`); whole card tappable. Add-services sheet CTA = **"Add item"**;
  delivery "Download" option = **"Preview as PDF"**. Customer selection: **Frequently used = 5 circular
  avatar shortcuts** (orange when selected) + **Others** as `Tile` rows.

## Built per ticket (Create 715 / Upload 716 / Send 718)

- **715**: create/fill draft, delete draft, issue→Awaiting (number locked + validation gate),
  limited edit, **Mark as paid** (amount sheet) → Paid/Partially/overpayment, Void.
- **716**: upload + type/size validation, OCR→Draft prefill. **Exact duplicate (number matches an
  existing DRAFT) → `DuplicateDecision` page** (summary + preview + **Edit Existing Draft** / **Create
  New Invoice**) BEFORE the editor. **OCR-missing case** → editor with a top **"N out of M extracted.
  Please review before creating"** card, customer/email inputs (email warning + "Cannot extract the
  information" + "Save &lt;name&gt; to my customer list" checkbox). **Any upload "Create Invoice" →
  invoice detail page (Awaiting Payment)** with a "Saved as awaiting payment" flash (not the list).
  Dropzone label "Select one file under 10 MB". (Old `ExtractionFailed.tsx` blank-form path still exists.)
- **718**: 3 send methods, email prefill/edit/multi-recipient/**"Send me a copy"**/save-default,
  **recipient validation**, structured email content + payment reference, delivery-failure/retry,
  shareable link (**"Mark as sent"** CTA — enabled only after copy/share; copy-then-close = draft),
  Preview as PDF / download.

## Out of scope / deferred / backend

Reconciliation auto-match banner (separate story), Overdue auto-transition + notification
(time/backend), sent marker (timestamp+channel — deferred), sequential number generation
(backend), credit-note flow (DES-719), real PDF file/filename. Open decision: edit→auto-resend.
DES-766 (list) and the 713 title/body mismatch (+ Invoice Settings = DES-764) still to reconcile.
**Invoice Settings (DES-764)**: dashboard gear exists but no screen / unwired. **Needs Attention
CTAs** (Confirm/Review/Remind) just open the detail — no in-place resolve; data is demo/static.
**Customer avatars** removed temporarily — restore after invoice-number layout is confirmed.
Invoice-number **6-vs-5 digit** conflict + the "provisional number on drafts" idea: pending Beatrice.
**Duplicate detection** is number-match only (prototype); real number+client+amount matching = backend.
The **in-editor duplicate warning** is dormant (the decision page handles it) — only resurfaces if a
duplicate number is typed manually. **File preview** is a demo document (we keep only name/size, no bytes).
**Removing create-anyway override** on exact duplicates diverges from DES-716 "warn, allow override".
