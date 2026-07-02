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
"send" | "invoiceDetail" | "needAttention" | "duplicateCheck" | "settings"`. App **lands on `dashboard`** (the
Accounting Hub was removed 2026-06-24). Dev-only **QuickNav** FAB (bottom-left) jumps between sections. Detail page tracks `detailReturn` (back **and** in-page actions return to wherever
it was opened — list / dashboard / needAttention) and `detailFlash` (one-off toast on arrival; back
clears it so it shows once). Invoice numbers use **`INV-YYYY-NNNNNN`** (6-digit, e.g. `INV-2026-000001`).
**`doc/sales-invoice-flows/context-sales-invoice.md` → "Session update (2026-06-24)" is the current
truth** for the upload/duplicate flow, dashboard hero, send sub-flow, and Needs Attention.

- **AccountingHub.tsx** / **FinanceBottomNav.tsx** — the finance-app Menu hub. Was removed as the landing
  2026-06-24; **re-added 2026-06-30 as a reachable Menu** (NOT the landing — Dashboard stays root). Opened
  from the Dashboard's **top-left grid icon** (`onMenu` → `hub` screen); has a back arrow → dashboard.
  Modelled on Qonto's invoicing section, grouped by money direction: **Sales** = Sales Invoices (→`list`),
  **Credit Notes** (→`creditNotes`, DES-763), **Customers** (→`customers`, DES-713/714 — built 2026-07-01,
  "Soon" flag removed); **Purchases** = Purchase Invoices (Soon).
- **Customer register is UNIFIED (fixed 2026-07-01):** App owns the single `customers` state (seeded from
  `CUSTOMERS`) and passes it to **`CustomerList`, `CreateSalesInvoice` (`customers` + `onCustomerAdded`), and
  `CustomerSheet` (via `AddInvoiceDetails`)** — so a client added anywhere appears everywhere. (Previously
  three disconnected sources: App state, `CreateSalesInvoice`'s own `useState`, and the `CUSTOMERS` constant.)
  **Invoice↔customer link is now by STABLE id** (`customerIdForInvoice` in `SalesInvoiceList` maps via the
  register's original names) — renaming a client no longer orphans their invoices on the detail. **FX rates
  now cover all 7 currencies used** (USD/SGD/HKD/EUR/GBP/AUD/JPY in `serviceLine.ts` `RATES` +
  `SUPPORTED_CURRENCIES`; `CurrencySheet` lists all 7) — before, EUR/GBP/etc. converted silently at 1:1.
- **CustomerList.tsx** (`customers` screen, **DES-713/714**) — the central Customers register under Sales
  (Qonto's Clients tab is a sibling of Sales Invoices/Credit Notes, confirmed against Qonto). Alphabetical
  rows = initials avatar + name + **email only** (decided — no amount-due/count), search, an **"+ ADD NEW"**
  outlined pill (toolbar, right of the count) → the **full-page** Add Client form (NOT a sheet). Source =
  shared **`CUSTOMERS`** register, now **owned by App** (`customers` state) so the full-page add appends to it;
  a one-off **success toast** ("<name> added", AC5) shows on return. Tap a row → **`CustomerDetailPage`**.
- **Two-tier Add Client form (DES-713, decided 2026-07-01):** the form has **two entry points → two
  surfaces**. ① **Client List** → **`AddCustomerPage.tsx`** (`addCustomer` screen), a **FULL PAGE** with the
  complete Client Field Spec and the **required set enforced: Company Name, Email, Address, City, Postal
  Code, Country** (First/Last, Reg No, Phone, Website, State, Currency optional; formats validated when
  filled; duplicate name/email → warn + "Save Anyway"). **Zip is hidden + not required for no-postal
  countries** (`NO_POSTAL_COUNTRIES` = ["Hong Kong"] — diverges from the ticket's literal "Zip Required";
  flagged to Beatrice). ② **In-invoice quick-add** (`CreateSalesInvoice`) = **`AddCustomerSheet` BottomSheet
  with the SAME FIELDS as `AddCustomerPage`** (changed 2026-07-02), but scoped as a fast add: **only Company
  Name + Email are required and shown up front**; the rest of the spec (First/Last, Reg No, Phone, Website,
  Address, Country, City/Zip, State, Currency) sits under an **"Add more details (optional)" accordion**.
  Includes **prefill-from-contact (AC2)** at the top (opens the accordion on select). Format validation,
  duplicate → "Save Anyway", nested Country/Currency/Contact pickers as sibling sheets — all in the sheet so
  the user never leaves the invoice. On save it auto-selects the new client into the invoice.
  `Customer` (`CreateSalesInvoice.tsx`) was **extended** with the full optional field set. The full page's
  **Save CTA is validity-gated** (disabled until required + formats valid; required-empty shows no inline
  error — the disabled CTA + required marker convey it; only format errors surface live). Success uses the
  **shared `SendSuccessToast`**.
- **AC2 — "Prefill from a payment contact" (DES-713, built 2026-07-01, FULL PAGE ONLY):** AC2 is a
  *population method*, not a navigation entry point — a control at the **top of `AddCustomerPage`** ("Prefill
  from a payment contact" → `ContactsOutlined` card, above an "or enter manually" divider) opens a **`BottomSheet`
  picker** (Search + `Tile` rows) over **`paymentContacts.ts`** (`PAYMENT_CONTACTS` — demo Statrys banking-side
  payees; real source/sync is backend per Beatrice). Selecting one **auto-fills every matching field, all still
  editable**. **Now also in the in-invoice quick-add sheet** (`AddCustomerSheet`, 2026-07-02) since that sheet
  adopted the full add-client form.
- **Client delete/archive is OUT OF SCOPE** (both DES-713 & DES-714 Notes). Don't hard-delete — invoices/CNs
  reference the client (referential integrity), audit/retention, and the record is **shared with the
  payment/contacts side**. If ever needed → **Archive (soft, guarded when the client has invoices)**, as its
  own story (confirm with Beatrice). **AC6 (save-failure recovery) still unbuilt.**
- **CustomerDetailPage.tsx** (`customerDetail`) — **Option B (chosen 2026-07-01): a fleshed-out detail page,
  which is BEYOND the tickets** (713/714 spec no client view page — 714 goes Client List → pre-filled Edit
  form; there's no "View Client" story like DES-721 for CNs). Shows an **identity row** (initials + name +
  city/country) then the **full DES-713 Client Field Spec as grouped `Section` cards — present fields only**
  (empty cards auto-hidden): **Contact** (email/phone/website), **Company** (contact person/reg no.),
  **Address** (address/city/state/postal/country), **Billing** (default currency) + the **Invoices** list
  (this customer's invoices, linked from the **exported `INVOICES`** by client name — some demo names don't
  match `CUSTOMERS`, so a few show an empty state; row → invoice detail, `detailReturn:"customerDetail"`).
  ⋯ **Edit customer** → **`onEdit`** opens the **full-page `AddCustomerPage` in edit mode** (DES-714, built).
  The record is **owned by App** now (edits flow back via props; the detail reads `customer` directly), and a
  **"Changes saved"** `SendSuccessToast` shows on return (`flash` prop). **TODO:** real per-customer invoice
  link (name-match is demo-only); propagation matrix / concurrent-edit = backend (out of scope).
- **DES-714 Edit Client (built 2026-07-01) — `AddCustomerPage` edit mode:** `mode="edit"` + `initial` (the
  record) seeds every field; title **"Edit Customer"**, CTA **"Save Changes"** (validity-gated **AND
  dirty-gated** — disabled until something changes), **id preserved** on save, prefill-from-contact hidden
  (add-only). **Unsaved-changes discard warning (AC1):** the header back is `requestBack` → if `dirty`, a
  **"Discard changes?"** `BottomSheet` (Discard / Keep Editing) instead of leaving. **Duplicate check excludes
  the edited record** (App passes `existing` filtered by id, so editing itself never warns). App screen
  **`editCustomer`** (reached only from the detail's ⋯, i.e. from the Client List — matches 714 "Edit from
  Client List only, not from within an invoice"). Save → `setCustomers(map id→updated)` + `setSelectedCustomer`
  + toast + back to detail. Out of scope (backend): propagation matrix (draft/future vs sent/paid), concurrent-
  edit conflict + audit (AC4/AC5).
- **CreditNotesList.tsx** (`creditNotes` screen, **DES-763 — starter**) — the central credit-notes register,
  a **separate view from the invoice list** (Qonto model). Cards: CN number + **status pill** + customer ·
  related invoice + original amount. **Status model = DES-763 CN Status Rules (finalised 2026-07-01):**
  cancellation CN → **Open → Partially Applied → Fully Applied** (+ Cancelled if voided); refund CN →
  **Pending Refund / Refunded**. `CreditNote` carries **`kind`** (`cancellation`|`refund`), **`applied`**
  (amount offset to date; Remaining = original − applied), + `sent` (a secondary send indicator, NOT the
  status). Filters = All / Open / Partially Applied / Fully Applied / Pending Refund / Refunded. Tap →
  **`CreditNoteDetailPage`** (DES-721), not the raw PDF. **CN summary row on the Sales Invoice List (AC6)**
  → same CN detail. Shared demo data in **`creditNotesData.ts`** (`CREDIT_NOTES`). **TODO:** real
  Apply-to-invoice from the LIST (register is static, so Apply is wired only from the invoice detail);
  invoice-nav from the list's CN detail (Related-invoice card is static there).
- **Dashboard.tsx** — Sales dashboard (Figma 484:4564), the landing screen. **Hero = two glassy sub-cards**: Collected
  (border + blur, green `#58c67f` %, gradient progress bar, peer note) and Outstanding (bg-white/10 +
  blur, overdue line, outlined **View All** → Outstanding list). **Top-left grid icon** (`onMenu`) opens the
  Accounting Hub menu; header bell **+ Settings gear** (`onSettings` → `settings` screen, **DES-764, built**).
  **Recent Invoices = 5 rows + a "View all invoices" button.**
  **NEEDS ATTENTION** preview stack; **"View All" only when > 2** → `needAttention`.
- **InvoiceSettings.tsx** (`settings`, DES-764) — account-level invoice settings, opened from the dashboard
  gear. See the "Invoice Settings (DES-764)" section below.
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
  invoice-number layout confirmation). **Partially Paid tab (added 2026-07-01 — EXTENDS DES-766):** the
  list `Status` type + `STATUS_PILL` + a **"Partially Paid"** filter chip (amber pill) were added, plus a
  demo **INV-2026-000014 (Verde Coffee Roasters, PartiallyPaid — $4,000 of $6,450, $2,450 due)** → tapping
  opens the detail as PartiallyPaid (⋯ Create Credit Note available, #3). **NB: DES-766 does NOT list
  Partially Paid** (its status filters are Draft/Awaiting Payment/Paid/Cancelled; Overdue is a summary tile,
  not a filter — we added both the Overdue and Partially Paid chips ourselves). `CustomerDetailPage.STATUS_PILL`
  also got the PartiallyPaid key (Verde is a registered client).

## Invoice detail page (`InvoiceDetailPage.tsx`) — status-aware, follows the FigJam user flow

All info in **dashed `InfoCard`s**. Statuses: Draft / Awaiting / Overdue / PartiallyPaid /
Paid / **Cancelled** (was "Void" — renamed per DES-719). Actions per state (from
`Sales Invoices Details User Flows.pdf`):

- **Created draft** → primary **Send invoice**, secondary **Mark as paid**; ⋯ Edit + Duplicate + Delete.
- **Uploaded draft** → primary **Mark as paid** (→ amount sheet), secondary **Mark as sent**
  (→ Awaiting via `onIssued`, toast "Invoice marked as sent"); ⋯ Send invoice + Edit + Duplicate +
  Delete. (`origin` threaded list/dashboard → App → page. Rationale: an uploaded invoice was already
  sent elsewhere, so recording payment is the likely next step — primary/secondary swapped vs created.)
- **Awaiting / Overdue / PartiallyPaid** → **primary Mark as paid**, **secondary Resend invoice**
  (created) / **Send invoice** (uploaded — never sent by the app, so "Resend" is wrong) — but once a
  **credit note has been raised** the secondary instead **sends the credit note** ("Send Credit Note" /
  "Resend Credit Note" by `cnSent`); ⋯ Edit
  invoice (Awaiting/Overdue) + Duplicate invoice + **Cancel with Credit Note** (Awaiting/
  Overdue, while outstanding > 0). "Mark as paid" opens an amount sheet: `< total`→Partially Paid,
  `= total`→Paid, `> total`→Paid + **overpayment flagged for review**.
- **Cancel with Credit Note (DES-719, built)** → opens `CreditNoteForm` (full-page) pre-filled from the
  invoice: linked invoice no. (stored as link), editable client + line items, locked currency, own
  number **`CN-2026-NNNNNN` (6-digit, matches invoices)**, and a **required Reason** ("Reason for credit"
  dropdown `CREDIT_REASONS`: Return / Defect / Pricing error / Goodwill / Dispute / **Others** — "Others"
  reveals a required free-text field **inside the picker sheet**, confirmed by a "Done" button). Reason +
  note threaded through `onCreate` and stored on the credit note.
  - **CORRECTED INVOICE MODEL (decided — NOT the accounting "lines = credit" model):** the "Corrected
    Invoice" editor is a stack of **per-line cards** ("N. Name" + "Original amount" reference + labeled
    Quantity/Unit price + a red **"Credited −$X"** row shown only when lowered). The client **lowers a line
    to its corrected value**, and the system **auto-derives the credit = Original Total − Edited Total**
    (`credited`, capped at outstanding); the user never types a credit. Summary = **Invoice Total / Credit
    Amount (−derived) / Amount Due (= Edited Total)**. The customer-facing **credit-note document**
    (`onCreate` `lines`, the CN preview) lists only the **per-line credits that changed** (original −
    corrected, >0) — each CN is its own document referencing the same invoice. `draftLines` (corrected
    invoice) + `origAmount` per line are stored so edits restore exactly.
  - **Multi-CN cumulative pre-fill:** a NEW credit note opens on the invoice's **current corrected state**
    (`correctedItems` = each ITEM minus credits already applied to it by name), with the base = current
    outstanding. So a 2nd note shows Brand = 3,000 after CN-001 credited it (can't re-credit), and the
    summary's first line relabels **"Invoice Total" → "Current balance"** once `alreadyCredited > 0`. **Full** credit →
  status **Cancelled**; **partial** → stays Awaiting/Overdue, outstanding reduced (banner + "Credit notes"
  InfoCard list). **Multiple cumulative** partials allowed, **capped at COMMITTED amount vs the creditable
  base (#2 + #3 fixes 2026-07-01):** the add-credit gate (`cancellable`) and the credit-form cap use
  **`creditRoom = creditBase − Σ note.amount`** (face value of every note, incl. unapplied/Open — NOT just
  `applied`), so you can't create Open notes that together exceed the base / strand credit. **#3 — PartiallyPaid
  is now credit-noteable:** `cancellable` includes **PartiallyPaid**, and **`creditBase = TOTAL − paidSoFar`**
  (the UNPAID remainder; `paidSoFar = paidAmount` only when status is PartiallyPaid — note `PAID_PARTIAL=4000`
  seeds `paidAmount` on EVERY invoice, so it must be status-gated). Fully crediting the remainder →
  **PartiallyPaid becomes Paid** (paid + credited = total), Awaiting/Overdue → **Cancelled**. `applyCnToInvoice`
  + `saveCreditNote` (edit re-apply) both use `creditBase`. **Open notes are never
  sendable (#4 fix):** where Apply isn't wired (e.g. Sales Invoice List CN preview) an Open note is
  **Preview-only** — an unapplied credit must be Applied before it's sent (removed the old `listOpenDock`
  Preview+Send branch). **After "Create Credit Note"
  the user returns to the invoice detail with a "Credit note created" toast — no auto send-flow.** Sending
  is then a deliberate step: the detail's **secondary CTA becomes "Send Credit Note"** whenever a credit
  note exists (Awaiting/Overdue → "Mark as paid" primary + "Send Credit Note" / "Resend Credit Note" by
  the latest note's sent state; Cancelled → single "Send/Resend Credit Note"). That reuses the Story-5 send
  flow (`sendContext` switches the overlays to the CN no./amount; completion toasts "Credit note sent").
  **Sent-state is now per credit note** (`sent` + `sentDate` on each CN, not a single global flag): each
  ledger row shows **"Not sent yet"** (amber) or **"Sent on <date>"** (muted); sending stamps the latest
  CN. (The send flow still targets the latest CN — editing+re-sending an *older* note of several is the
  remaining edge.)
- **Edit Credit Note (DES-719 AC4, built)** — per the ticket, **a SENT credit note is still editable**
  (sent only triggers the re-send prompt; editing is blocked by status Fully Applied/Refunded/Cancelled →
  in the prototype: invoice Paid/Cancelled). So while the invoice is **unpaid (Awaiting/Overdue)**, each
  **"Credit notes" ledger row is tappable** → reopens `CreditNoteForm` in **edit mode** (title "Edit Credit
  Note", CTA "Save changes", no demo create-failure), prior state **restored exactly** (the CN stores
  `draftLines` + `issueDate`; edits preserve the note's `sent`/`sentDate`). Cap = outstanding + that note's
  own amount. **Edit re-applies for an APPLIED note (fixed 2026-07-01):** an **Open** note edit keeps CTA
  **"Save changes"** and stays unapplied (Apply is separate); a **Partially Applied** note edit shows CTA
  **"Apply to Invoice"** and, on save, **re-derives `applied` = the new amount** (capped at `TOTAL − Σ other
  applied`) so **edit-up AND edit-down both move Amount Due** (was `Math.min(oldApplied, newAmount)`, which
  silently ignored edit-up — the CN and invoice could disagree). Full coverage → Cancelled. **Fully Applied
  notes are NOT editable** (no Edit in dock or ⋯). If the note was already sent, a **re-send prompt** sheet
  ("Send updated credit note?" → Send Update / Not Now) offers to send the updated version. Rows are **not** tappable once Paid/Cancelled (editing blocked). **Demo:** list → **INV-2026-000010 (Harbor & Co.)** is
  Awaiting with a partial CN **CN-2026-000003 (−$2,000, sent)** — seeded coherently (single "Credited amount"
  line + `draftLines`/`issueDate`/reason) so it opens and edits cleanly. Out of scope per ticket: refund
  (DES-720), View Credit Note (DES-721), journal posting, DES-763 Credit Notes Settings + combined list.
- **Refund with Credit Note (DES-720, Phase 1 + 2 built)** — a **Paid** invoice keeps **Download PDF** as its
  dock action; **"Refund with Credit Note" lives in the ⋯ menu** (secondary, matching Stripe/Square/Whop —
  the paid record stays primary, refund is a deliberate secondary action). The Paid ⋯ menu is shown via
  `showMenu` (Paid is `terminal` for content but still exposes the menu). It opens `CreditNoteForm` in **`refund` mode**
  (title "Refund with Credit Note", cap = amount paid, summary shows **"Amount paid" + a prominent
  "Refund amount −$X"** instead of Credit Amount/Amount Due). Creating it → invoice **`PendingRefund`**
  (`applyRefundCreditNote`), toast "Refund credit note created". New statuses **`PendingRefund`** /
  **`Refunded`** added to `DetailStatus`+`STATUS_META`; status path **Paid → Pending Refund → Refunded**.
  - **Refund-method flow (Phase 2, built) — `RefundCreditNoteFlow.tsx`:** a **full PAGE** (not a sheet —
    `absolute inset-0 z-50 ... 375×812`), opened from the detail page's **"Refund Credit Note"** dock CTA on a
    refund-context invoice (`refundFlowOpen` in `InvoiceDetailPage`). Steps (`Step = "method" | "account" |
    "confirm" | "manual"`): **method** (✕ closes flow; 2 `Tile`s = *Statrys Business Account* / *Mark as
    already refunded*) → either **account** (title "Choose Account"; `RECEIVING_ACCOUNTS` as `Tile`s) → **confirm**
    (title "Confirm refund transfer"; From row = account name + full number, Currency, To, Amount, Reference;
    CTA "Confirm transfer" → `onConfirmBA`, the **BA payment itself is out of scope** — this just hands off a
    pre-filled draft/stub), OR **manual** (title "Record refund"; **amount is READ-ONLY**, locked to the pending payout amount;
    Refund date input; Method `Tile`s = Bank transfer / Card / Cash; optional **"+ Attach proof"**; CTA "Record
    refund" gated on `mDate && mMethod` → `onMarkRefunded({date,method,amount})`). Later steps show a back arrow
    (not ✕). The payout amount = **`refundPending`** (the committed-but-unpaid remainder), not the cumulative
    total. Completing either branch calls **`settleRefund`** → `refundedOut` catches up to `credited`: **cumulative
    refunded = invoice total → `Refunded`** (toast "Invoice Fully refunded" / "Marked as refunded"); **else
    "Partially Refunded"** (toast "Invoice partially refunded"). Both call **`onRefunded?.(invoiceNo, "full" |
    "partial")`**. **Both paths persist a refund record** (`RefundProof` = date / method / amount +
    optional file) onto the note(s) settled by that payout: the **manual "mark as already refunded"** path
    stores the captured date/method + optional **attachment**; the **BA transfer** path records
    `Statrys · <account> · <date>` (no file — the transfer flow owns execution). Rendered on the Credits
    Applied row as a **green "Refunded" chip + method·date**, with the manual attachment as a **tappable
    file row** → `FilePreviewOverlay` (DES-720 evidence requirement). Reference: Brex/Wise/Monzo (receipt =
    thumbnail/row + status chip, not inline text).
    - **View a locked credit note (read-only):** every Credits Applied row is tappable — unpaid/unsent →
      edit (AC4); **settled/sent (locked) → opens `CreditNotePreviewPage` read-only** (`viewingCnIndex`) so
      the client can still review the document.
- **View Credit Note (DES-721, built) — `CreditNoteDetailPage.tsx`** is the structured **detail page**
  (NOT the raw PDF) that every credit-note entry point now lands on (Stripe/Temu pattern — detail + actions
  in the dock; the PDF is a secondary "Preview PDF"). Mirrors the invoice detail: dashed cream cards, a
  **type chip** + **status chip**, CN total, **Related invoice → View** card
  (AC3), Credit-to + reason, items credited, and the DES-720 **refund record + proof attachment** block.
  Dock = **"Send Credit Note"/"Resend"** (AC4). It hosts **its own send sub-flow** (`SendInvoiceSheet` +
  `ReviewEmail` + `ShareLinkSheet` + the PDF `CreditNotePreviewPage`), so Send works standalone at any entry
  point; `onSent` reports up so the caller persists the sent state. ⋯ menu = Preview PDF + View invoice +
  **Cancel credit note** (voids an UNSENT note; hidden once sent — `onCancel` → `voidCreditNote`). **Cancel now
  KEEPS the note as a `Cancelled` RECORD (Figma 729:4954, changed 2026-07-01)** instead of deleting it:
  `voidCreditNote` sets **`cancelled: true`** (+ `applied: 0`) and STAYS on the CN detail, now showing the
  **Cancelled** state — grey chip, **"Cancelled on <date>"**, Summary = **Invoice Total / Credit Amount (−) +
  "(Not Applied Yet)" / Amount Due = the FULL invoice total** (the credit was never applied), dock = **Preview
  as PDF**, no ⋯. The row stays in the Credits Applied ledger with a grey **"Cancelled"** hint. Cancelled notes
  **reserve NO credit room** (`creditNoteTotal` excludes them) and aren't editable/cancellable again; a cancelled
  **refund** note reverts the invoice **PendingRefund → Paid**.
  - **Status model = INVOICE-CENTRIC (decided 2026-07-01, supersedes the CN-centric DES-763 table read):**
    a **cancellation** CN's Applied status measures **how much of the INVOICE is covered by credit**, NOT how
    much of the individual note is applied. Created **Open** (does NOT touch the invoice); **Apply to invoice**
    → **Partially Applied** while cumulative credit < invoice total (an applied note on a still-outstanding
    invoice), → **Fully Applied** only once cumulative credit = invoice total (invoice then Cancelled). So a
    $4,200 note applied to a $6,450 invoice reads **Partially Applied** (not Fully Applied), matching DES-719's
    cumulative-tracking rule and avoiding the "Fully Applied above Remaining Balance $2,250" contradiction.
    Derived from `credited >= TOTAL` (invoice detail) / `applied >= invoiceTotal` (register), NOT `>= cn.amount`.
    Type badge **"Credit note"**. A **refund** CN uses **Pending Refund / Partially Refunded / Refunded**; type
    badge **"Refund credit note"**. The `sent`/"Not sent" indicator was **removed** (status carries the meaning;
    `sent` only flips Send↔Resend).
  - **Detail dock is status-aware (updated 2026-07-01):** **Open** → dock **Apply to invoice** (primary) +
    **Edit** (secondary); ⋯ **Cancel credit note** + **Preview as PDF**. **Partially Applied** → dock
    **Send/Resend Credit Note** (primary) + **Edit Credit Note** (secondary); ⋯ **Preview as PDF**. **Fully
    Applied** → dock **Send/Resend Credit Note** only (single CTA, **no Edit** — a fully-absorbed note can't be
    edited); ⋯ **Preview as PDF**. **Refund CN detail (DES-720, rebuilt 2026-07-01):** creating a refund CN
    from a **Paid** invoice now **lands on the CN detail** (`applyRefundCreditNote` sets `viewingCnIndex`) as
    **Pending Refund** — shown with **two chips (Open + Pending Refund)**, **"Refund to"**, **"Refund items"**
    (per-line `$amount of $original`), and a refund **Summary = Invoice Total / Refund Amount (−) / Net Paid**.
    While Pending Refund (not yet transferred) the dock is **EDIT** and ⋯ = **Cancel refund** only (Send +
    Preview removed per design); `onEdit`+`onCancel` are wired from the invoice entry (`cnStatus==="Pending
    Refund"`), and **Cancel refund** (`voidCreditNote`) reverts the invoice **PendingRefund → Paid**. **Settled
    refund variant (Figma 731:4752, built 2026-07-01) — `Partially Refunded` / `Refunded`:** once transferred,
    the CN reads **Partially Refunded** (refund < invoice total) or **Refunded** (= invoice total) — **blue**
    "Partially Refunded" chip, **past-tense** labels (**Refunded on <date> / Refunded to / Refunded items**),
    same Invoice Total / Refund Amount / Net Paid summary, dock = **Send Credit Note**, and **NO ⋯ menu**
    (`hasMenu` false for settled refund). **Both entry points** produce it: invoice `cnStatus` = `through >
    refundedOut ? Pending Refund : refundedOut >= TOTAL ? Refunded : Partially Refunded`; the Credit Notes list
    `effStatus` maps `refundState==="partial" → "Partially Refunded"` (added to `CNStatus` + list pill + filter).
    (The actual money-out still runs from the invoice detail's Refund-Credit-Note flow; the CN-list entry stays
    view/send — edit-from-list for refund not wired.) Gated on callbacks
    (`canApply = Open && onApply`) so from the LIST (no Apply wired) an Open note falls back to a
    **Preview as PDF (primary) + Send (secondary)** dock (`listOpenDock`). Creating a CN lands here as **Open**;
    Edit is allowed at Open / Partially Applied (applied is clamped to the new amount on save). **After Apply,
    the page stays on the CN detail** with the status re-derived (Partially/Fully Applied); **editing a CN also
    returns to the CN detail** (`setViewingCnIndex` in `saveCreditNote` + the edit form's `onBack`). The
    **sent/not-sent indicator was removed** from both the CN-detail subline and the invoice's Credits-Applied
    row (status now carries the meaning; `sent` still only flips the Send↔Resend label).
  - **Header + body content (Figma 729:4672 etc.):** `SheetHeader` title = the **CN number**. Subline is
    **state/tense-aware**: Open → "Credit note · Created/Updated <date>"; **Applied (Partially/Fully) →
    "Applied on <date>"**; refund pending → "Created on <date>"; refund settled → "Refunded on <date>".
    **Credited/Refunded items now show per-line `$amount of $original`** (both cancellation and refund; still
    hidden for register/list entries that pass no lines). **Summary** (cancellation, needs `invoiceTotal`):
    **Invoice Total / Credit Amount (−) / Remaining Balance** for **Open** (sublabel "(after applying)"), and
    **Invoice Total / Credit Amount (−) / Amount Due** (highlighted cream row) for **Applied** — a Fully Applied
    full-invoice credit shows **Amount Due $0.00**. Refund → Invoice Total / Refund Amount (−) / **Net Paid**.
    Refund settled with no invoiceTotal → "Total credited". **No GST/tax row** (ticket uses VAT, HK demo has
    none). `invoiceTotal` threaded from all entries (invoice `TOTAL`; list `inv.amount`; register `invoiceTotal`).
    NB the Fully-Applied Figma header shows the *invoice* number (likely a mockup quirk — we keep the CN number
    for consistency with the other CN-detail frames).
  - **Invoice-side model (`InvoiceDetailPage`):** each CN carries **`applied`**; cancellation `credited` =
    Σ applied (Open notes don't reduce the invoice) — `refundCtx` invoices still use Σ amount. `applyCreditNote`
    creates Open + lands on the detail; **`applyCnToInvoice`** offsets the invoice (→ Cancelled when fully
    covered); a seeded CN opens pre-applied (`applied = amount`). Every Credits Applied row → the detail
    (actions live there); rows show the Open/Partially/Fully Applied hint.
  - **Three entry points wired to it (2026-07-01):** ① invoice detail **Credits Applied** locked row
    (`viewingCnIndex`, full data + `onViewInvoice` = back to this invoice); ② **Sales Invoice List** "View ›"
    (`cnPreview`, `onViewInvoice` navigates via `onOpenInvoice`); ③ **Credit Notes List** (`preview`, no
    invoice nav → Related-invoice card is a static row). `kind`/`status` derived from the register status (or
    `refundState`). The old `CreditNotePreviewPage` **`variant`** prop is retained but the "view" variant is
    now superseded by `CreditNoteDetailPage`; `CreditNotePreviewPage` is used only as the **PDF preview**.
  - **Decisions:** kept the section name **"Credits Applied"** (not "Related documents"); kept row-tap
    routing — editable (unsent+unpaid) → Edit, locked → the new detail page. Entry point is the linked
    invoice / the credit-note list (DES-763); no standalone story-1 list here.
  - **Cumulative refunds + AC6 send (rebuilt 2026-07-01) — the refund lifecycle is money-based, not a one-shot
    boolean.** `InvoiceDetailPage` tracks **`refundedOut`** (a number = money actually paid out) vs **`credited`**
    (total committed to refund CNs); **`refundPending = credited − refundedOut`** is a refund awaiting payout.
    `refundedOut` **seeds** from the list-sync tag (a demo invoice opening "Partially Refunded"/"Refunded" starts
    *settled*, `refundedOut = credited`, so there's no phantom pending payout). Derived: **`fullyRefunded`** =
    `refundedOut ≥ TOTAL`; **`effectiveRefundTag`** = Refunded / Partially Refunded (by `refundedOut`) / else the
    list-sync `refundTag`; **`refundDone`** = `refundPending ≤ 0` (replaces the old `refundInitiated` boolean).
    This lets an invoice **cycle** Pending Refund → Partially Refunded → *(raise another note)* → Pending Refund →
    … → Refunded:
    - **AC6 / Figma 696:5495 (relabelled 2026-07-01):** the refund-context dock while `refundPending > 0` is
      **secondary "Send invoice"** (`setSendSheetOpen` — the invoice document; the refund CN is sent from its
      OWN detail page) + **primary "Continue Refund"** (`setRefundFlowOpen` — money-out). Once `refundDone` it
      collapses to a single **"Send/Resend Credit Note"**. The refund-pending header = suppressed Paid chip +
      **"Refund Pending"** tag, headline **"Amount to refund"** + `$total · Paid full on <date>` (green), the
      **Credits Applied** row shows **"Reason: <reason>"** (no sent-status line for refund), and the Summary is
      **Subtotal / Discount / Total / Refunded (−) / Net Paid**. The pending refund CN is **editable** via its
      row → CN detail → EDIT.
    - **Per-note send + picker (built 2026-07-01, refund AND unpaid/cancellation):** each credit note is its
      own document with its own `sent`/`sentDate`, so the send flow is parameterised by **`sendCnIndex`** (not
      always the latest). Label = **"Send"** if any note is unsent (`anyUnsent`), else **"Resend"**. Tapping it
      → **`openSendCreditNote()`**: **2+ unsent notes** → **"Send credit note" picker `BottomSheet`** (`Tile`
      selection cards, recent-first, **default = latest**, sent notes show a "SENT" badge) → pick → send flow;
      **0–1 unsent** → straight to the send flow (the single unsent note, else latest = resend). `completeSend`
      stamps **`sendCnIndex`** sent; edit→re-send (AC4) points `sendCnIndex` at the edited note. Fixes the
      "CN1 paid-but-unsent gets stranded when CN2 is created" case.
    - **Add another refund note (cumulative):** the **"+ Add refund credit note"** button in the Credits Applied
      card shows whenever **`isRefundContext && !fullyRefunded && outstanding > 0`** — *including after* an earlier
      refund has settled. It reopens the refund form (cap = `outstanding`, corrected pre-fill); creating a note
      raises `credited` above `refundedOut`, so `refundPending > 0` and the **"Refund Credit Note" CTA reappears**.
      The next payout settles only that pending portion.
    - **Headline:** `refundPending > 0` → "Amount to refund" (the pending amount); else "Amount refunded" (the
      cumulative `refundedOut`).
    - **CN row editability (DES-720):** a refund CN is editable only while **unsent AND unpaid** (its cumulative
      position `creditedThrough(idx) > refundedOut`) — settled notes lock (corrections → a new note); the newly
      added pending note stays editable.
  - **Cross-screen refund sync (runtime, in-session only):** App holds **`refundState: Record<invoiceNo,
    "partial"|"full">`**; `onRefunded` writes to it. Passed to `InvoiceDetailPage` (derives `refundTag`, prefers
    `refundState[number]`), `SalesInvoiceList` (card pill + `refundStateOf`/`matchesRefund` filter), and
    `CreditNotesList` (`effStatus` flips a refunded CN's pill to "Refunded"). **A full page reload resets it** —
    expected prototype limit (no backend persistence). Note the architecture tension: refund invoices open from
    the list as **status `Paid` + a derived `refundTag`** (never literal `PendingRefund`); the detail page uses the
    local **`refundedOut`** + `effectiveRefundTag` to flip the display to Refunded/Partially Refunded.
  - **List card (refund/CN, `SalesInvoiceList.tsx`):** every invoice with a credit note shows **invoice total**
    on top + status pill, then a divider + a tappable **credit-note summary row** (doc icon + "N Credit Note(s)"
    + amount + "View ›" → `onOpenCN`). Amount label = **"Refund amount"** for refund CNs (pending/partial/refunded),
    else **"Credited amount"**. Pills: Refunded = indigo, Partially Refunded / Refund Pending = amber. The old
    small "Credit Note ›" badge was removed. **Refund Status filter** (multi-select checkbox rows, gated to All /
    Paid view): Refund Pending / Partially refunded / Refunded. Customer filter = **sticky header** with count +
    inline search-icon toggle (collapses on scroll/blur; clear-X inside the `Search` input).
  - **Demo invoices (all Paid, open as refund-context):** **INV-2026-000011 Cobalt** (CN-2026-000004 −$1,200,
    partial of $6,450), **INV-2026-000013 Meridian** (CN-2026-000006 −$3,200), **INV-2026-000015 Solstice**
    (CN-2026-000007 −$6,450, full). Their CNs seeded `Pending Refund` in `creditNotesData.ts`.
  - **TODO Phase 3:** "awaiting refund" list filter polish + richer Pending Refund/Refunded detail rendering;
    persist refund state (backend). BA transfer execution stays out of scope (stub/handoff only).
- **Paid** → read-only, **Download PDF** dock; **⋯ → "Refund with Credit Note"** (DES-720). **Cancelled** → read-only, Download PDF.
- **Send sub-flow**: **Delivery method is a full PAGE** (`SendInvoiceSheet`, slides in, ✕ top-left —
  create flow ✕ saves draft → list; detail-page resend ✕ → back; "Download" option = **"Preview as
  PDF"**). The page stays mounted (`z-40`) and **Email review / Share-link sheet / PDF preview all open
  INSTANTLY over it — no transition**. **`ShareLinkSheet`** CTA = **"Mark as sent"**, **always enabled**
  (changed 2026-07-02 — was gated on copy/share; the user often copies the link elsewhere then returns, so
  the gate blocked them); copy/share/close alone never marks sent — only the explicit CTA does.
  **`ReviewEmail`**: cc checkbox = "Send me a copy"; editing Subject/Message auto-checks "Save the content
  as default".
- **Receiving account** card shows critical fields (holder, account no.) with Bank / SWIFT /
  **payment reference** (issued only) under a "Show more" accordion. Statrys HK format:
  number `HK883-168888-168`, SWIFT `STYSHKHH` (SG account prefixed `SG…`); same data in
  `ReceivingAccountSheet.tsx` `RECEIVING_ACCOUNTS`.
- **Invoice number**: hidden on created drafts (assigned on issue, DES-715); shown for uploaded
  drafts (user/OCR value) and all issued. Format **`INV-YYYY-NNNNNN`** (6-digit, from `000001`) —
  resolved per DES-764 (updated 27/Jun/26): the field-spec table's 6-digit `######` wins over the
  earlier 5-digit. **Credit-note numbers are also 6-digit** (`CN-YYYY-NNNNNN`, per DES-719 update 28/Jun).
- **Detail page headers = the document number (2026-07-01):** every detail page shows its NUMBER as the
  `SheetHeader` title (not a generic word). Invoice detail → the **INV number** when issued; a **draft** has
  no INV yet, so it shows a separate **DF number** (`DF-YYYY-NNNNNN`, `headerTitle` derives it by swapping the
  `INV` prefix — real separate draft sequence = backend). Credit-note detail → the **CN number**; its **type
  badge was removed** (type now reads as a muted subline "Credit note / Refund credit note · Issued …").

## Decided behaviors (don't re-litigate)

- **Single-line toasts** (no subtext), keyed to action: "Saved as draft" / "Saved as awaiting
  payment" (issue/record-only) / **"Invoice created successfully"** (upload-flow Create Invoice) /
  "Invoice marked as sent" / "Draft deleted" / "Changes saved" (edit save) / "Payment recorded" /
  "Invoice voided" / "Invoice duplicated".
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

## Built per ticket (Create 715 / Upload 716 / Send 718 / Credit Note 719)

- **715**: create/fill draft, delete draft, issue→Awaiting (number locked + validation gate),
  limited edit, **Mark as paid** (amount sheet) → Paid/Partially/overpayment, Cancel w/ Credit Note.
- **716**: upload + type/size validation, OCR→Draft prefill. **Exact duplicate (number matches an
  existing DRAFT) → `DuplicateDecision` page** (summary + preview + **Edit Existing Draft** / **Create
  New Invoice**) BEFORE the editor. **OCR-missing case** → editor with a top **"N out of M extracted.
  Please review before creating"** card, customer/email inputs (email warning + "Cannot extract the
  information" + "Save &lt;name&gt; to my customer list" checkbox). **Any upload "Create Invoice" →
  invoice detail page (Awaiting Payment)** with an "Invoice created successfully" flash (not the list).
  **`UploadInvoice` ("Add Existing Invoice") opens straight into the 3 source rows** (no dropzone /
  no sub-sheet): **Take Photo / Choose from Photos / Browse Files**, with a centered **"PDF, JPG,
  PNG · up to 10 MB"** caption. **Take Photo → `ScanDocument` camera+scan demo** → adds a photo;
  picking any source → file shown with remove + **Continue**.
  (Old `ExtractionFailed.tsx` blank-form path still exists.)
- **718**: 3 send methods, email prefill/edit/multi-recipient/**"Send me a copy"**/save-default,
  **recipient validation**, structured email content + payment reference, delivery-failure/retry,
  shareable link (**"Mark as sent"** CTA — always enabled; copy/share/close alone never marks sent),
  Preview as PDF / download.

## Invoice Settings (DES-764) — `InvoiceSettings.tsx` (`settings` screen, built)

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
  invoice's **`ReceivingAccountSheet`** (same `RECEIVING_ACCOUNTS` source of truth) — `paymentMethod` stores
  the account **id**, default **`personal`** (Personal Saving, the PRIMARY account). Card value =
  `formatAccount(...)` e.g. "Personal Saving (..168)". **Wired into the invoice:** `AddInvoiceDetails` takes a
  `defaultAccountId` prop (App passes `settings.paymentMethod`) seeding the invoice's Receiving Account row.
- **Automated chaser (DES-764 AC5, #1):** account default lives in Settings → **Notifications → Automatic
  reminders** sub-page (master `Toggle` `chaserEnabled` + 2-reminder preset picker, see above). The
  **per-invoice toggle** is in `AddInvoiceDetails` as an **"Automatic reminders" card styled like the
  Discounts card** (white dashed card + brand `Toggle`; title = "Automatic reminders" / subtitle = "Email
  until invoice is paid"), placed **between Discounts and Summary** (gated on `services.length > 0`),
  `defaultChaser` prop seeded from `settings.chaserEnabled`, shown across all creation flows (create / upload
  / edit). Both this card's and the Discount card's titles use **`card-title-2xs`** (matching the customer
  card), not the older 18px bold. Auto-deactivation once
  Paid = backend (out of scope). Brand-orange switch = shared **`Toggle.tsx`** (the Radix `ui/switch` was
  avoided — its `bg-primary`/`bg-switch-background` tokens are undefined in this theme).
- **Logo** = inline **`LogoMark`** (orange monogram tile from the company initial — CSP-safe, no external
  asset; swap for the real SVG/PNG later). Upload control = centered dashed dropzone ("Upload company logo" /
  "JPG or PNG • Up to 10 MB"); rules JPG/PNG ≤10 MB. Demo company = **Lumen Studio** (`DEFAULT_SETTINGS`, HK).
- **Per-section editing** — each section opens **ONE** bottom sheet (not one per field). **"Save changes"**
  CTA is **dirty-gated** (disabled until something changes) **and** validity-gated (required fields filled,
  email valid). Inputs have meaningful **placeholders, no helper text**.
- **Business Address** — **Country first (dropdown)**, drives **City** (dropdown when the country has preset
  cities, else free text) and **State** (dropdown, shown **only** if the country has states). Changing country
  resets city/state (+ zip). **Zip hidden for Hong Kong** (`NO_POSTAL_COUNTRIES`, not required there).
  **Address is last.** Country/city/state pickers reuse the **`Tile`** selection style (customer-selection
  card: dashed default / gradient selected); country options show a **flag**; the long country list has a
  **search** (`>8` options). Address sheet + picker share **`h-[72%]`** height.
- **Currency is FIXED + seed precedence (DES-764 + DES-713):** `AddInvoiceDetails` takes a `defaultCurrency`
  prop; the invoice currency is **seeded read-only** — **never chosen per invoice** (the `CurrencySheet`
  selector was removed; line items may still carry their own currency and convert into the invoice
  currency). **Seed precedence (highest first):** OCR (`extracted.currency`) → edit-seed (`initial.currency`)
  → **customer default (`customer.currency`, DES-713 per-client)** → account **Settings** (`settings.currency`).
  Implemented as `extracted?.currency || initial?.currency || defaultCurrency`, with App passing
  `defaultCurrency={customer?.currency ?? settings.currency}` (demo: Meridian=EUR, Halcyon=GBP). Seeding is
  **one-directional** — the invoice currency **never writes back** to the customer record or Settings. The
  **customer/invoice currency = what you BILL in; NOT the functional currency** (the accounting/reporting
  base — accountant-only, out of scope). They connect only via FX at the ledger. Accountant-only fields
  (functional-currency amount, COA per line) out of scope; customer info comes from the client record.

## Out of scope / deferred / backend

Reconciliation auto-match banner (separate story), Overdue auto-transition + notification
(time/backend), sent marker (timestamp+channel — deferred), sequential number generation
(backend), real PDF file/filename. **Credit-note flow (DES-719) is now BUILT** (see the detail-page
section) — credited amounts / CN list are local demo state (no backend). The CN PDF is a **dedicated
credit-note document** (`CreditNotePreviewPage` — title "CREDIT NOTE", linked-invoice "For invoice" ref,
"Credit to" client, credited lines as **negatives**, "Total credited" −amount, no "how to pay"); the CN
email/share still reuse the invoice send overlays (CN number/amount/client threaded). **Refund (DES-720) +
Credit Notes List (DES-763) IN PROGRESS in parallel.** **DECISION (adopt the 763/credit-note model, pending
Beatrice — diverges from 720's invoice statuses): the refund lifecycle lives on the CREDIT NOTE, not the
invoice.** CN status **Pending Refund → Refunded**; **"Awaiting refund" = a Pending Refund credit note**
(same thing, one term). Invoice should stay **Paid** + a derived refund tag + CN badge (the invoice-level
`PendingRefund`/`Refunded` statuses from 720 Phase 1 are to be **demoted to a derived tag** — not yet done).
720 Phase 2 (refund-method screen) will flip the **CN** status. **View Credit Note (DES-721) is now BUILT**
(see the detail-page section). **Journal
posting** remains out of scope.
Open decision: edit→auto-resend. **OPEN (pending Beatrice): lock a credit note once SENT?** Today (per
DES-719 AC4) a sent credit note stays editable + re-send prompt. Proposed stricter model — editable only
while **unsent**; once sent it's read-only and further corrections go via a **new** credit note (audit-clean,
and we have "+ Add credit note" + cumulative pre-fill to support it). Diverges from AC4, so confirm before
changing.
DES-766 (list) and the 713 title/body mismatch still to reconcile. **Invoice Settings (DES-764)** is
**built** (see its section above) — **default currency, payment method (→ receiving account), and the
automated-chaser default** are all wired into the create flow; the remaining company fields (name, logo,
address, etc.) are demo-only (no backend persistence / not rendered on a real PDF; no template preview).
**Needs Attention
CTAs** (Confirm/Review/Remind) just open the detail — no in-place resolve; data is demo/static.
**Customer avatars** removed temporarily — restore after invoice-number layout is confirmed.
Invoice-number digit count **resolved → 6-digit** (DES-764, 27/Jun/26). The "provisional number on
drafts" idea: still pending Beatrice. **Automated chaser + Payment-method default (updated DES-764) are
now BUILT** (see the Invoice Settings section). The Payment-method default references the real
`RECEIVING_ACCOUNTS` (reuses `ReceivingAccountSheet`, default = `personal`/Primary) and **is wired** to seed
the invoice's Receiving Account via `defaultAccountId`. Chaser auto-deactivation on Paid = backend.
**Duplicate detection** is number-match only (prototype); real number+client+amount matching = backend.
**Scan / "Take photo"**: `ScanDocument.tsx` is a prototype stand-in. Native plan = **Option A (decided
2026-06-24): the OS document scanner** (iOS VisionKit `VNDocumentCameraViewController` / Android ML Kit
Document Scanner) draws its own camera UI; only the capture result flows into the sheet → `ScanDocument`
is **replaced** in the real build (not branded/custom = rejected Option B). Bridge both platforms with one
cross-platform plugin; plain-camera fallback where ML Kit is unavailable.
The **in-editor duplicate warning** is dormant (the decision page handles it) — only resurfaces if a
duplicate number is typed manually. **File preview** is a demo document (we keep only name/size, no bytes).
**Removing create-anyway override** on exact duplicates diverges from DES-716 "warn, allow override".

## Repo / deploy

Private GitHub **`apa-statrys/accounting`** over SSH (`git@github.com:apa-statrys/accounting.git`).
**User runs commits/pushes themselves — only stage (`git add`).** `.gitignore` covers node_modules / dist /
`*.zip` / `.DS_Store` / env. **Vercel** uses `pnpm install --frozen-lockfile`: keep `package.json` and
`pnpm-lock.yaml` in sync (we removed a stray `pnpm.overrides` to fix `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`);
the `pnpm-workspace.yaml` `allowBuilds:` placeholder may need converting to `onlyBuiltDependencies`.
