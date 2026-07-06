# Sales invoice flows — session log (archive)

> Moved out of `context-sales-invoice.md` on 2026-07-02. This is the append-only session diary —
> read it only when you need the history behind a decision. **Later entries supersede earlier ones,
> and CLAUDE.md + `../invoice-detail-behavior.md` supersede everything here.** Known stale claims
> inside: invoice numbers are now **6-digit** (not 5), credit-note flows (DES-719/720/721/763) are
> **built**, the Accounting Hub is back as a reachable Menu, and file paths predate the 2026-07-02
> repo refactor (types → `src/app/types.ts`, data → `src/app/data/`, helpers → `src/app/lib/`,
> big screens → `src/app/components/<feature>/`).

## App structure & navigation (as of ~2026-06-24)

`src/app/App.tsx` is the screen router. `type Screen = "dashboard" | "list" | "customer" | "details" |
"upload" | "extracting" | "send" | "invoiceDetail" | "needAttention" | "duplicateCheck"`.
The app **lands on `dashboard`** (the Accounting Hub was removed 2026-06-24). A dev-only **QuickNav** FAB
(bottom-left) jumps between sections. Key shared state in App: `customer`, `extracted`, `pendingExtraction`,
`toast`, and `recent` (the just-created/saved card to highlight on the list).

Screen flow:
- **dashboard** (`Dashboard.tsx`) → list / create / upload.
- **customer** (`CreateSalesInvoice.tsx`) — select customer (15 demo customers, search shown
  only at ≥5).
- **details** (`AddInvoiceDetails.tsx`) — the central screen, used for BOTH manual create
  AND upload review.
- **upload** (`UploadInvoice.tsx`) → **extracting** (`GeneratingInvoice.tsx`, OCR steps) →
  details.
- **list** (`SalesInvoiceList.tsx`).
- **send** — dev preview that opens AddInvoiceDetails straight to the Delivery-method sheet.

## Key components (as of ~2026-06-24)

- **AddInvoiceDetails.tsx** — central invoice screen. `isExtracted = !!extracted` switches
  between manual and upload-review modes. Handles: customer match/no-match, editable invoice
  number with duplicate warn+override, line items, discount, autosave indicator
  ("Saving…"/"Saved"), and the send sub-flows.
- **extractInvoice.ts** — `ExtractedInvoice` type + `DEMO_EXTRACTION` (no-match Daniel Smith,
  missing email, new number) and `DEMO_EXTRACTION_MATCHED` (Marlow & Finch, duplicate number
  INV-2026-0042). `EXISTING_INVOICES` backs the duplicate-number warning.
- **SalesInvoiceList.tsx** — grouped list, scrollable status chips with dynamic counts,
  per-chip Sort/Filter sheets (see "Sort/Filter IA" below). `STATUS_PILL` styles per status
  (Awaiting/Overdue/Draft/Paid/Void); **Overdue is derived** (Awaiting + past due).
- Send sub-flows: **SendInvoiceSheet** (Delivery method) → **ReviewEmail** / **ShareLinkSheet**
  (+ **DemoShareSheet** visual iOS sheet) / **InvoicePreviewPage** (real invoice PDF with full
  "How to pay" bank details). **AddCustomerSheet** (quick-add + optional expander, DES-713).
- **AccountingHub.tsx** / **FinanceBottomNav.tsx** — the finance-app **Menu** hub. **Removed from the
  app 2026-06-24** (later re-added 2026-06-30 as a reachable Menu).
- **InvoiceDetailPage.tsx** — status-aware invoice detail for the full lifecycle (Draft /
  Awaiting / Overdue / Partially Paid / Paid / Void), opened by tapping a list card. Per-status
  actions: Draft→Issue/Edit/Delete; Awaiting/Overdue→Send/Edit/Download/Cancel-with-credit-note;
  Paid/Void→Download (read-only). **Optional send lives here** (reuses SendInvoiceSheet/
  ReviewEmail/ShareLinkSheet/InvoicePreviewPage). **Edit prefills the form** via an
  `InvoiceEditSeed` (customer + invoice no + line items) passed up through `onEdit` into
  `AddInvoiceDetails`'s `initial` prop. In edit mode (`initial` set, Qonto-style) the form
  retitles to **"Edit invoice"**, swaps the ✕ for a **back arrow**, and shows a single **"Save"**
  CTA — back arrow and Save both **return to the invoice detail page** (not the list).
- **Draft detail is origin-aware** (`origin: "created" | "uploaded"`, threaded list→App→page):
  **created** draft → primary **Send invoice** (validation-gated), secondary **Mark as paid**;
  **uploaded** draft → primary **Mark as paid**, secondary **Mark as sent** (record-only → Awaiting,
  DES-716 AC4 default). Demo: list INV-003 = created draft, INV-002 (Otto Reyes) = uploaded draft.
- Shared: **BottomSheet**, **SheetHeader**, **ButtonDock**, **TextInput** (has `highlight`
  prop for OCR-missing yellow), **SendSuccessToast**.

## Behaviors decided in earlier sessions

> Several items below were revised on 2026-06-23 — see "Session update (2026-06-23)" for the then-current
> truth (invoice-number format, detail-page action labels/toasts, customer avatars removed, delivery
> method = full page, recede removed, Needs Attention, etc.).

- **Save as draft = tapping ✕ (close)** on the invoice screen, in BOTH flows. Routes through
  `onSaveDraft`, shows "Saved as draft" toast, returns to list. The "Save as draft" secondary
  button was removed from the upload flow.
- **Recent-card highlight on the list**: after save-draft OR create/send, the list prepends a
  single card (`id: "recent-new"`) at the top with an **orange border + soft ring glow that
  fades after 2.6s**. Only that one card glows (gated on `id === "recent-new"`); cards use
  `initial={false}` so they don't flash on list mount.
  - The recent card carries a **meta line**: drafts → `INV-… · Created <issue date>`;
    created/sent → `INV-… · Due <due date>`. Status pill: Draft vs Awaiting Payment.
  - Plumbing: AddInvoiceDetails builds the summary and passes it via `onSaveDraft(draft)` and
    `onSend(toast, recent)`; App stores it in `recent` and passes to `SalesInvoiceList recent`.
- **Send method → marked as sent** via toast for all of email/link/PDF.
- **Invoice number** (upload): user-entered/editable, NOT system-generated; duplicate →
  "Similar invoice found" amber card with "View invoice ›" detail sheet + "Create Invoice"
  override (scrolls back to the section first time).
- **Invoice currency** seeds from Settings default but a per-invoice override must NOT write
  back to Settings.
- **Payment reference** (DES-718) shows under the receiving-account **accordion** only on
  **issued** invoices (= the invoice number); not shown on any draft.
- **Invoice number visibility on the detail page**: a **created draft shows NO invoice number**;
  an **uploaded draft shows the user-entered / OCR-extracted number**; issued invoices always show it.
- **Toasts are single-line** (one message, no subtext), keyed to the action. Don't reintroduce
  two-tier title+subtext toasts.

## Sales Invoice List — Sort/Filter IA + Overdue model (DES-766 area, FINALISED)

Diverges from DES-766 in two **confirmed product calls** (flag to Beatrice; don't re-litigate):
the date filter is **due-based**, not issue-date; and the **summary tiles live on the Dashboard
hero**, not on the list.

- **Overdue is a *derived* status (Qonto-style), not stored.** `effectiveStatus(inv)` promotes
  an **Awaiting + past-due** invoice to **"Overdue"** (red pill `#d92d20`). Used everywhere —
  pill, chip counts, filtering. `TODAY` is pinned to **2026-06-22** for deterministic demos.
- **Status chips** (order): **All · Draft · Awaiting · Overdue · Paid · Void** (later + Partially Paid;
  Void renamed Cancelled).
  - **Awaiting** chip = *all unpaid* (on-time **+** overdue) = "Outstanding". **Overdue** chip =
    the past-due subset (overlaps Awaiting count by design).
- **Sort options are per-chip** (`sortKeysFor`) with per-chip **defaults** (`defaultSortFor`):
  - **Draft** → Issue Date Newest*/Oldest only.
  - **Paid / Void** → Issue Date Newest*/Oldest + Amount High/Low (no due-date sorts).
  - **All / Awaiting / Overdue** → all six (Issue ×2, Due ×2, Amount ×2).
  - Defaults (*): **All/Paid/Draft/Void → Issue Date: Newest**; **Awaiting/Overdue → Due Date:
    Earliest**.
  - **Switching a chip resets sort to that chip's default** (`selectChip`). The active status chip
    auto-**scrolls into view** on mount so a pre-filtered open (from the hero) shows it selected.
- **Filter sheet facets** (in order): **Due date** (Due This Week / Due This Month — *upcoming*
  only; Overdue is NOT here, it's the chip) · **Issue date** (Start/End date) · **Customer**
  (multi-select, search at ≥5 clients). Active-filter **count badge** on the Filters button.
  - **Due date section shows only on All + Awaiting**; the due filter resets when switching to a
    chip that hides it.
  - **Footer (Reset + "Show N invoices") only renders once a filter is active**.
- **No animation on status-tab switch** — `layout` was removed from the cards.

## Invoice list card

- **Layout:** customer name (truncates) · **status-aware meta line** · amount + status pill.
- **Meta line is status-derived** (`metaLine`): Awaiting → "Due in N days"; Overdue → red
  "Overdue by N days"; Paid → "Paid <date>"; Draft keeps Created/Uploaded. The meta is
  **never truncated**; only the customer *name* truncates. **Paid/Void are NOT dimmed**
  (tried it, reverted — looked disabled).
- **Swipe-to-delete on Draft cards only.** Implemented with **plain pointer events + CSS
  `translateX`** (NOT framer `drag` — that rendered blank inside the `overflow-hidden` wrapper).
  Delete → confirm sheet "Delete Draft Invoice?". Removal is local (`deletedIds`).
- **⚠️ CRITICAL flexbox gotcha (cost a whole session):** a flex item with `overflow: hidden` gets
  `min-height: 0`, so in the scrollable `flex flex-col` list the draft cards **shrank to ~0 height
  → invisible**. **Fix: `shrink-0` on every card.** If cards ever vanish/overlap again, check
  `shrink-0` first.

## Dashboard hero card (Figma 484:4524, later redesigned 484:4564)

- Dark gradient card: "Expected this month" HKD amount · **linear progress bar** (orange→pink)
  with % labels · **Collected** / **Outstanding** columns (tappable → Paid / Awaiting list via
  `listPreset` → `SalesInvoiceList initialStatus`) · fixed peer note (`PEER_NOTE`, all states).
- **Five demo states** (`HERO_SCENARIOS`), switched from the **QuickNav dev FAB**: Happy path ·
  Some overdue · All overdue · Fully collected · Nothing collected.

## Form & detail tweaks (earlier session)

- **Select Customer**: tapping a tile only **selects**; a single **"Continue"** dock advances.
- **Add Services/Products**: **Currency + Unit Price combined** — currency is a quiet tappable pill
  inside the Unit Price field, opening `CurrencySheet`.
- **Service item preview** shows the unit: "3 Hours x $10.00" (pluralised); swipe-to-delete matches
  the list's red tile.
- **ReviewEmail**: "Save the content as default"; demo "simulate failed send" toggle removed
  (failure/retry scaffolding kept, untriggered).
- **Demo data** grew from 5 to 9 invoices (≥5 unique customers so Customer search renders; INV-008
  Void so that chip isn't 0). Later 15.

## Session update (2026-06-23)

### Invoice number format — 5-digit (later superseded: 6-digit per DES-764 27/Jun)
- All invoice numbers moved to `INV-YYYY-NNNNN` (5-digit) everywhere. **Spec conflict:** the
  DES-715/716 field-spec table says 6 digits; DES-766 + FigJam mockups said 5. Chose 5 at the time;
  **resolved to 6-digit later (DES-764 update 27/Jun/26)**.
- **Draft numbering** (Qonto-checked): the sequential number is assigned **at finalize/issue**, not
  at draft creation. Design floated a *provisional* number on drafts — not implemented.

### Invoice detail — action labels & navigation
- **Uploaded draft**: primary "Mark as sent" (→ Awaiting), secondary "Mark as paid"
  (later swapped 2026-06-24: primary Mark as paid / secondary Mark as sent).
- **Awaiting / Overdue / Partially Paid**: primary relabeled "Record Payment" → **"Mark as paid"**.
- **Back AND in-page actions return to origin** (`detailReturn`), not hardcoded to the list.

### Misc 06-23
- **Customer avatars removed** app-wide (temporary, pending invoice-number layout confirmation).
- List meta weights: invoice number 500, date 400, Overdue 600 red.
- Customer + product cards share one trailing **chevron with hover nudge**; whole card tappable.
- Customer selection grouped: FREQUENTLY USED + OTHERS; typing collapses to RESULTS.
- Add Services CTA "Add into Invoice" → **"Add item"**; Delivery "Download" → **"Preview as PDF"**;
  Currency sheet height = Add Services sheet (`SERVICE_SHEET_HEIGHT`, `heightClass` prop).
- **Book-page recede REMOVED** — sheets just dim the page with the `bg-black/25` scrim.
- **Delivery method became a full PAGE** (slides in, ✕ top-left; create-flow ✕ saves draft).
  No transition between Delivery ⇄ Email review (instant overlay).
- Dashboard got the **Settings gear** (unwired then; DES-764 later).
- **Needs Attention**: dedicated screen + `ATTENTION_TASKS` single source of truth; dashboard
  stack preview; **"View All" only when > 2**.

## Session update (2026-06-24)

### Upload → duplicate flow (Case 1, exact duplicate) — REDESIGNED
- After OCR, App checks the number against `EXISTING_INVOICES`. **Match on a DRAFT → the
  `duplicateCheck` decision page** (not the editor). `DuplicateDecision.tsx`: headline + match
  summary card + uploaded-file card + dock —
  - **Back** → reopens the Upload sheet with the file still attached (`uploadedFiles` kept).
  - **Primary "Edit Existing Draft"** → the existing draft's editor, items seeded from the OCR.
  - **Secondary "Create New Invoice"** → new draft with a freshly generated unique number
    (`numberRecommended` → green "Recommended" chip in the editor).
- **Edit-existing editor** (`editExitToList`/`editFromDuplicate`): ✕ saves as draft → list; Save
  always enabled; Save → "Changes saved" → detail; back from that detail → "Saved as draft" → list.
- The old **in-editor duplicate warning is dormant** — only resurfaces if a duplicate number is
  typed manually.

### Upload sources + scanner demo
- **`UploadInvoice` opens straight into 3 source rows** (Take Photo / Choose from Photos / Browse
  Files) + file rules; validation errors inline. File names encode the demo OCR case:
  photo → 9/9 complete; photos → duplicate; files → email missing; "Simulate an unreadable scan" →
  blank editor + amber failure banner.
- **Take Photo → `ScanDocument.tsx`** camera demo (corner brackets → shutter → scan sweep).
  **Native plan = Option A: the OS document scanner** (iOS VisionKit / Android ML Kit);
  `ScanDocument` is replaced in the real build.
- **Any upload "Create Invoice" → the new invoice's DETAIL page (Awaiting Payment)** with an
  "Invoice created successfully" flash — not the list. Back clears `detailFlash`.

### Upload review + send sub-flow polish
- "N out of M extracted" purple card only when a field is missing; uploaded-file card at top;
  no-match case = name/email inputs + "Save <name> to my customer list" checkbox; **no auto-scroll
  on arrival**.
- **`ShareLinkSheet`**: CTA "Mark as sent", disabled until copied/shared (later changed 2026-07-02:
  always enabled). **`ReviewEmail`**: "Send me a copy" checkbox.
- Dashboard hero → **two glassy sub-cards** (Collected + Outstanding); Recent Invoices = 5 rows +
  "View all invoices"; ⚠️ watch Tailwind class concatenation (a missing space once produced
  `py-4flex`, silently dropping padding).
- **Frequently used = 5 circular initial avatars** on the customer page.
- Repo pushed to GitHub over SSH; `.gitignore` added; Vercel `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`
  fixed by removing a stray `pnpm.overrides`.

## Session update (2026-06-25) — Invoice Settings (DES-764) first build

- `InvoiceSettings.tsx`, screen `settings`, opened from the dashboard gear. No Save button — edits
  apply live; back persists via `onExit(settings)`. Bottom CTA "Preview invoice template" (later
  REMOVED 2026-06-29 — no template preview).
- Identity-first layout → later regrouped Revolut-style (see `invoice-settings-DES-764.md`).
- One sheet per section; "Save changes" dirty- + validity-gated. Business Address country → city →
  state dependency chain; zip hidden for Hong Kong.
- `AddInvoiceDetails` gained `defaultCurrency` (App passes `settings.currency`).

## Session update (2026-06-30) — Refund method + gated edit, list refund display, nav

- Refund-pending dock primary **"Refund Credit Note"** → refund-method picker (Statrys BA / Mark as
  already refunded). BA → stub toast; manual → Refunded. (Both later rebuilt as the full-page
  `RefundCreditNoteFlow` with proof capture — see `../invoice-detail-behavior.md`.)
- Refund headline leads with the amount to refund; Paid badge suppressed; Credits Applied moved
  ABOVE the customer/details cards.
- **Gated edit of a refund CN:** editable only while unsent AND unpaid (audit-clean); corrections
  after that go via a NEW note.
- **CN number collision fix:** new notes continue past the register max (`CN_SEQ_MAX`).
- List refund display: invoice stays Paid, right pill shows the refund state; secondary amber
  "Refunding −$X" line; CN badge "Credit note ›" (later became the full CN summary row).
- **Menu is the parent:** Dashboard title has a back chevron → Accounting Hub Menu; the Menu has
  no back arrow.

## Session update (2026-07-01) — Refund AC6 + cumulative notes + per-note send

- Replaced one-shot refund booleans with **money-based lifecycle**: `refundedOut` vs `credited`,
  `refundPending = credited − refundedOut`; `settleRefund` shared by BA + manual paths; invoice can
  cycle Pending → Partially Refunded → (new note) → Pending → … → Refunded.
- **AC6:** two-action dock while pending (Refund Credit Note + Send/Resend CN), collapsing to
  Send/Resend when done.
- **Per-note send:** each CN has its own `sent`/`sentDate`; `sendCnIndex` + a picker sheet when 2+
  unsent; `completeSend` stamps the selected note.
- **Refund proof** (`RefundProof`) persisted by both paths; green "Refunded" chip + method·date +
  tappable attachment on the ledger row.

## Session update (2026-07-01) — View Credit Note (DES-721) = a detail page, not the PDF

- **`CreditNoteDetailPage.tsx`** is the structured landing for every CN entry point (invoice ledger
  row, Sales-Invoice-List "View ›", Credit Notes List). Hosts its own send sub-flow. The PDF
  (`CreditNotePreviewPage`) is only the "Preview PDF" screen.
- **CN status model corrected — then corrected again:**
  1. First pass: split by type — cancellation CN = Not sent / Sent; refund CN = Pending
     Refund / Partially Refunded / Refunded. Register + list realigned to that.
  2. **Superseded same day:** re-read DES-763 — it DOES define the reconciliation lifecycle.
     **Adopted the Apply model:** cancellation CN = create → **Open** (doesn't touch the invoice)
     → **Apply to invoice** → Partially/Fully Applied (invoice-centric: Fully Applied only when the
     INVOICE is fully covered). Register/list reverted to application statuses + `applied`.
- Cancel/void keeps the note as a **Cancelled record** (Figma 729:4954), reserving no credit room.
- Cumulative refund notes: "+ Add refund credit note" while not fully refunded; headline switches
  "Amount to refund" (pending) / "Amount refunded" (settled).
- Open items captured that day: lock-CN-once-sent unification (pending Beatrice); per-invoice
  emails/items still shared demo defaults; BA refund execution out of scope.
