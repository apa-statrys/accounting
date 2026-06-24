# Sales Invoice Flows — Working Context

Handoff notes for continuing the mobile invoicing prototype. Read this first, then the
ticket PDFs in `./tickets/` for the source requirements.

## What this is

A **mobile invoicing app prototype** ("Sales Invoice / Statrys"), built in React + TypeScript
to eventually port to **Figma Make**. Work proceeds **screen-by-screen**, implementing Figma
frames and matching Jira ticket requirements.

- Stack: **React 18 + TS, CSS Modules + Tailwind utilities, Vite 6, pnpm** (via `corepack enable`).
- Animation: **`motion`** (framer-motion v12) — import from `"motion/react"`.
- Icons: `@mui/icons-material/*` and `lucide-react`.
- Phone frame: fixed **375 × 812**, internal scroll with hidden scrollbar.
- Working dir: `/Users/ayepapamyo/Projects/Accounting/`. Components in `src/app/components/`.

## How to run / verify locally

- Dev server: Vite on **http://localhost:5173/** (`pnpm dev`, started via corepack).
- Transform-check a file:
  `curl -s -o /tmp/m.out -w "HTTP %{http_code}" "http://localhost:5173/src/app/components/X.tsx"`
  then grep `/tmp/m.out` for `Failed to resolve|Transform failed|SyntaxError`.
- **This check is transform-only** — it does NOT catch runtime ReferenceErrors from missing
  imports. After using a new component/symbol, always grep that the import exists.

## Workflow rules (from the user)

- **Build everything locally in Claude first**; finish all flows on localhost before porting
  to Figma Make. Skip per-change "re-paste this file" notes; consolidate the Figma Make file
  list at the very end.
- Implement only what's asked / only the changed parts of a Figma frame.

## Reading ticket PDFs

`pdftotext`/poppler and the Read tool's PDF render are NOT available. Extract text with:
`python3 -m pip install --quiet --user pypdf` then a small pypdf script. Tickets live in
`./tickets/` (DES-713, 714, 716, 718, 719, 720, 721). **DES-715 (Create Sale Invoice) is NOT
in the repo** — reconcile the manual-create flow when the user provides it.

## App structure & navigation

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

## Key components

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
  app 2026-06-24** (no longer the landing screen; the files remain on disk but are unused). The
  **Dashboard is now the root** screen, with **no back arrow**.
- **InvoiceDetailPage.tsx** — status-aware invoice detail for the full lifecycle (Draft /
  Awaiting / Overdue / Partially Paid / Paid / Void), opened by tapping a list card. Per-status
  actions: Draft→Issue/Edit/Delete; Awaiting/Overdue→Send/Edit/Download/Cancel-with-credit-note;
  Paid/Void→Download (read-only). **Optional send lives here** (reuses SendInvoiceSheet/
  ReviewEmail/ShareLinkSheet/InvoicePreviewPage). **Edit prefills the form** via an
  `InvoiceEditSeed` (customer + invoice no + line items) passed up through `onEdit` into
  `AddInvoiceDetails`'s `initial` prop. In edit mode (`initial` set, Qonto-style) the form
  retitles to **"Edit invoice"**, swaps the ✕ for a **back arrow**, and shows a single **"Save"**
  CTA — back arrow and Save both **return to the invoice detail page** (not the list).
  Cancel-with-credit-note is a stubbed entry point (DES-719 flow not built; just flips to Void).
- **Draft detail is origin-aware** (`origin: "created" | "uploaded"`, threaded list→App→page):
  **created** draft → primary **Send invoice** (picking any method in the send sheet issues it
  → Awaiting + sent; no separate record-only option); **uploaded** draft → primary
  **Save Invoice** (record-only → Awaiting, DES-716 AC4 default) **+ "Send invoice (optional)"
  under ⋯**. Both: secondary **Edit**; created ⋯ = Duplicate + Delete, uploaded ⋯ = Send +
  Duplicate + Delete. Primary gated on `requiredComplete`. Post-issue sending for either also
  lives on the Awaiting detail (its primary is Send invoice). Demo: list INV-003 = created
  draft, INV-002 (Otto Reyes) = uploaded draft.
- Shared: **BottomSheet**, **SheetHeader**, **ButtonDock**, **TextInput** (has `highlight`
  prop for OCR-missing yellow), **SendSuccessToast**.

## Behaviors decided in earlier sessions (don't re-litigate)

> **Several items below were revised on 2026-06-23 — see "Session update (2026-06-23)" near the
> end for the current truth** (invoice-number format, detail-page action labels/toasts, customer
> avatars removed, delivery method = full page, recede removed, Needs Attention, etc.).

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
    `recent` is set fresh on each issue/save and cleared elsewhere; both the dev "send" and
    the real "details" screens wire it.
- **Send method → marked as sent** via toast for all of email/link/PDF. Shareable link marks
  sent on copy/share (Qonto/Qonto-aligned option B), single copy affordance.
- **Invoice number** (upload): user-entered/editable, NOT system-generated; duplicate →
  "Similar invoice found" amber card with "View invoice ›" detail sheet + "Create Invoice"
  override (scrolls back to the section first time).
- **Invoice currency** seeds from Settings default but a per-invoice override must NOT write
  back to Settings.
- **Detail-page actions follow `Sales Invoices Details User Flows.pdf` (FigJam):**
  - **Created draft** → primary **Send invoice**, secondary **Edit**; ⋯ Duplicate + Delete.
  - **Uploaded draft** → primary **Record Invoice**, secondary **Edit**; ⋯ Send invoice + Duplicate + Delete.
  - **Awaiting / Overdue / Partially Paid** → **primary = Record Payment**, **secondary = Resend
    invoice**; ⋯ = **Edit invoice** (Awaiting/Overdue only) + **Duplicate invoice** + **Void invoice**
    (Awaiting/Overdue only). **Record Payment** opens an amount sheet: full → **Paid**, less →
    **Partially Paid** (updates `paidAmount`/`status` in place). Void → Void (credit note = DES-719, later).
  - Edit opens `AddInvoiceDetails` **limited mode** (`initial.limited`): editable = customer, due
    date, items, receiving account, discount; locked/dimmed = invoice number (shown), issue date,
    currency.
  - **OPEN questions from the flow** (pending Beatrice): which fields are editable in Awaiting
    (line items/amount/customer vs admin-only); and whether saving an edit auto-resends or asks.
    Current build: edit Save just returns (no auto-resend).
- **Payment reference** (DES-718) shows under the receiving-account **accordion** only on
  **issued** invoices (= the invoice number); not shown on any draft.
- **Invoice number visibility on the detail page**: a **created draft shows NO invoice number**
  (system-generated only on issue — DES-715 AC2); an **uploaded draft shows the user-entered /
  OCR-extracted number** (DES-716); issued invoices always show it. Gated on
  `issued || uploadedDraft` in `InvoiceDetailPage`.
- **Toasts are single-line** (one message, no subtext), keyed to the action: **"Saved as
  draft"** (✕/save), **"Saved as awaiting payment"** (issue / Send Later / upload Create —
  record-only), **"Invoice marked as sent"** (any send channel), **"Draft deleted"**. Don't
  reintroduce two-tier title+subtext toasts.

## Sales Invoice List — Sort/Filter IA + Overdue model (DES-766 area, FINALISED)

Diverges from DES-766 in two **confirmed product calls** (flag to Beatrice; don't re-litigate):
the date filter is **due-based**, not issue-date; and the **summary tiles live on the Dashboard
hero**, not on the list.

- **Overdue is a *derived* status (Qonto-style), not stored.** `effectiveStatus(inv)` promotes
  an **Awaiting + past-due** invoice to **"Overdue"** (red pill `#d92d20`). Used everywhere —
  pill, chip counts, filtering. `TODAY` is pinned to **2026-06-22** for deterministic demos.
- **Status chips** (order): **All · Draft · Awaiting · Overdue · Paid · Void**.
  - **Awaiting** chip = *all unpaid* (on-time **+** overdue) = "Outstanding". **Overdue** chip =
    the past-due subset (overlaps Awaiting count by design). Void has one demo row (INV-008).
- **Sort options are per-chip** (`sortKeysFor`) with per-chip **defaults** (`defaultSortFor`):
  - **Draft** → Issue Date Newest*/Oldest only.
  - **Paid / Void** → Issue Date Newest*/Oldest + Amount High/Low (no due-date sorts).
  - **All / Awaiting / Overdue** → all six (Issue ×2, Due ×2, Amount ×2).
  - Defaults (*): **All/Paid/Draft/Void → Issue Date: Newest**; **Awaiting/Overdue → Due Date:
    Earliest**. Sort labels: **Issue Date: Newest/Oldest**, **Due Date: Earliest/Oldest**,
    **Amount: High to Low / Low to High** (in that order).
  - **Switching a chip resets sort to that chip's default** (`selectChip`) — so you never land
    on a sort the chip doesn't offer. The active status chip auto-**scrolls into view** on mount
    (`activeChipRef.scrollIntoView`) so a pre-filtered open (from the hero) shows it selected.
- **Filter sheet facets** (in order): **Due date** (Due This Week / Due This Month — *upcoming*
  only; Overdue is NOT here, it's the chip) · **Issue date** (Start/End date as input
  *placeholders*, the native `dd/mm/yyyy` hidden) · **Customer** (label is "Customer", search
  placeholder "Search by Customer name", multi-select, shown only at **≥5** clients). Active-filter
  **count badge** on the Filters button; chips are single-select with tap-to-deselect.
  - **Due date section shows only on All + Awaiting**; hidden on Overdue/Paid/Draft/Void
    (`showDueFilter`), and the due filter resets to "all" when switching to a chip that hides it.
  - **Footer (Reset + "Show N invoices") only renders once a filter is active** — no button dock
    when nothing is selected (`footer={filterCount === 0 ? undefined : …}`).
- **No animation on status-tab switch** — `layout` was removed from the cards; the filtered list
  re-renders instantly.

## Invoice list card (`InvoiceCard` in SalesInvoiceList.tsx)

- **Layout:** customer name (truncates) · **status-aware meta line** · amount + status pill.
  (The leading initials **avatar was removed 2026-06-23** — see Session update; `initials()` deleted.)
- **Meta line is status-derived** (`metaLine`): Awaiting → "Due in N days" (relative); Overdue →
  red "Overdue by N days"; Paid → "Paid <date>"; Void → "Voided <date>"; Draft keeps Created/
  Uploaded. The meta is **`whitespace-nowrap`, never truncated** (number + status phrase always
  show); only the customer *name* truncates. **Paid/Void are NOT dimmed** (tried it, reverted —
  looked disabled).
- **Swipe-to-delete on Draft cards only.** Implemented with **plain pointer events + CSS
  `translateX`** (NOT framer `drag` — that rendered blank inside the `overflow-hidden` wrapper).
  Reveals a rounded red **Delete** tile (Mobbin-style, icon + label); a drag is swallowed so it
  doesn't also open the detail page. Delete → confirm sheet **"Delete Draft Invoice?"** (no ✕ via
  `hideClose`, `ButtonDock` Cancel/Delete). Removal is local (`deletedIds`).
- **⚠️ CRITICAL flexbox gotcha (cost a whole session):** a flex item with `overflow: hidden` gets
  `min-height: 0`, so in the scrollable `flex flex-col` list the draft cards (whose swipe wrapper
  is `overflow-hidden`) **shrank to ~0 height → invisible**, and wrapping every card made them all
  overlap. **Fix: `shrink-0` on every card** (both the `motion.button` and the draft wrapper). If
  cards ever vanish/overlap/space unevenly again, check `shrink-0` first.

## Dashboard hero card (`Dashboard.tsx`, Figma 484:4524)

- Dark gradient card: "Expected this month" HKD amount · **linear progress bar** (orange→pink)
  with **"X% collected" / "Y% outstanding"** labels above it · two amount columns below — **Collected**
  (left, tappable → Paid list) and **Outstanding** (right, tappable → Awaiting list) · divider ·
  fixed peer note **"You're ahead of 71% of similar businesses this month"** (`PEER_NOTE`, all states).
  Drill-downs wired via `App` `listPreset` → `SalesInvoiceList initialStatus`. (The earlier circular
  ring + the 2 separate summary tiles were both tried and removed.)
- Outstanding sub-line: "N invoices" / "X overdue out of N" / (all overdue) "N overdue invoices".
- **Five demo states** (`HERO_SCENARIOS`), switched from the **QuickNav dev FAB** ("Hero state"):
  - **Happy path** (no overdue) · **Some overdue** · **All overdue** · **Fully collected** (green
    bar + green amount, no outstanding side, only "100% collected") · **Nothing collected** (0% bar,
    no collected column, outstanding shown left as "HKD 20,000.00 to collect", only "100% outstanding").

## Form & detail tweaks (earlier session)

- **Select Customer** (`CreateSalesInvoice`): tapping a tile only **selects** it; a single
  **"Continue"** `ButtonDock` (disabled until one is picked) advances. Seeds from `selectedId`.
- **Add Services/Products** (`AddServicesSheet`): **Currency + Unit Price combined** — currency is
  a **quiet tappable pill** (muted grey, default = invoice currency) inside the Unit Price field's
  left adornment, opening `CurrencySheet`. `CurrencySheet`/`UnitSheet` size to content (no `tall`).
- **Service item preview** shows the unit: "3 Hours x $10.00" (pluralised). `ServiceItemCard`
  swipe-to-delete uses the same Mobbin red tile + drag-click guard as the list.
- **Draft detail page** (`InvoiceDetailPage`): secondary button is **"Mark as paid"** (opens
  Record Payment at total → Paid); **Edit moved into the ⋯ menu** ("Edit invoice").
- **ReviewEmail**: "Save the content as default" (customer name removed); demo "simulate failed
  send" toggle removed (failure/retry scaffolding kept, untriggered).
- **Demo data** is now **9 invoices** (was 5): added INV-005/006/007 to reach ≥5 unique customers
  (so the Customer search renders) + INV-008 Void (so the Void chip isn't 0).

## Session update (2026-06-23)

Latest decisions/changes. Where these conflict with older sections above, **this wins.**

### Invoice number format — 5-digit (FINALISED; flag the spec conflict)
- All invoice numbers now use **`INV-YYYY-NNNNN`** (5-digit, zero-padded, e.g. `INV-2026-00001`).
  Updated everywhere: SalesInvoiceList rows (both `id` used for nav **and** `meta`; the duplicate
  display-number pair keeps `…00001a` / `…00001b` ids so the `replace(/[a-z]$/,"")` nav still works),
  Dashboard rows, NeedAttentionStack/NeedAttention, `extractInvoice` (`EXISTING_INVOICES` + demos — the
  duplicate-warning demo still collides on `INV-2026-00042`), `AddInvoiceDetails` default+placeholder,
  `InvoiceDetailPage` default, `InvoicePreview`.
- **Spec conflict to reconcile with Beatrice:** the DES-715/716 *field-spec table* says **6 digits
  `INV-YYYY-######` (start 000001)**; **DES-766 list-view rules + the FigJam mockups say 5 digits
  `INV-YYYY-#####` (`INV-2026-00001`)**. We chose **5-digit** (matches DES-766 + mockups). One-line
  change if they standardise on 6.
- **Draft numbering** (Qonto-checked): Qonto assigns the sequential number **at finalize/issue**, not
  at draft creation (so deleting a draft leaves no gap). Created drafts keep **no visible number** until
  issue. Design team floated showing a *provisional* number on drafts — not implemented.

### Invoice detail — action labels & navigation (supersedes the old bullets)
- **Uploaded draft**: primary **"Mark as sent"** (→ Awaiting payment via `onIssued`, toast
  **"Invoice marked as sent"**); secondary **"Mark as paid"** (opens Record Payment → Paid). Rationale:
  the common case for an uploaded invoice is "already sent externally, just track it" (Qonto imported-
  receivables model — outstanding by default, Mark-as-paid is the explicit secondary). ⋯ still has
  "Send invoice". **Replaces the old "Record Invoice" primary.**
- **Awaiting / Overdue / Partially Paid**: primary relabeled **"Record Payment" → "Mark as paid"**
  (secondary still "Resend invoice"). Same amount sheet underneath (partial/overpayment unchanged).
- **Back AND in-page actions return to origin.** `onIssued/onDeleted/onSent` now `setScreen(detailReturn)`
  (was hardcoded `"list"`); the back arrow already used `detailReturn`. Drafts open only from the list →
  return to list; dashboard / Needs-Attention origins return there. **Caveat:** the success toast is
  rendered by `SalesInvoiceList`, not the dashboard — a dashboard-origin action won't show its toast.

### Customer avatars removed (temporary — pending invoice-number confirmation)
- Removed from: SalesInvoiceList rows (and deleted the now-unused `initials()` helper), InvoiceDetailPage
  customer card, AddInvoiceDetails (selected-customer `EditCard hideAvatar` + the upload "matched client"
  card), CustomerBottomSheet picker rows. Marked with `// Avatar removed for now (pending invoice-number
  confirmation)`. Restore later (e.g. re-add `hideAvatar`-off / the circle markup).

### Invoice list meta weights
- `InvoiceCard` meta line: **invoice number = medium (500)**, **due/paid date = regular (400)**; Overdue
  stays **600** red. (Line is `font-normal`; per-span weights override.)

### Create flow — customer & product cards share one arrow (with hover)
- **Customer card** (`AddInvoiceDetails`): "CHANGE" button replaced by a **chevron arrow**; whole card
  tappable (opens customer picker).
- **"Add your services" (product) card**: package icon removed (`hideAvatar`); whole card tappable
  (opens Add services).
- **Both use the same arrow** — plain 16px `var(--icon-primary)` chevron with a **hover nudge**
  (`group` on the card + `group-hover:translate-x-1` + transition). Matches the Issue Date/Currency rows.
- **Filled service-line** (`ServiceItemCard`) icon also removed (`hideAvatar`); it shows the amount, no
  arrow.

### Customer selection grouped (`CreateSalesInvoice`)
- Flat list → two groups using the **same `Tile`**: **FREQUENTLY USED (3)** (`FREQUENT_IDS =
  marlow/bright/otto`) + **OTHERS (rest)**. Typing collapses to a single **RESULTS (n)** list (groups
  hidden) + a "No customers found" empty state. New customers land in Others. No caption under the
  Frequently-used header (removed per request).

### Sheets / labels
- **Add Services sheet** CTA: **"Add into Invoice" → "Add item"** (edit mode still "Save").
- **Delivery method** "Download" → **"Preview as PDF"** (description hidden via `showDescription={false}`).
- **Currency sheet height = Add Services sheet height**: shared **`SERVICE_SHEET_HEIGHT = "h-[68%]"`** via
  a new `heightClass` prop on `BottomSheet`; both sheets pass it. (`tall` = min-h-78% was taller and is
  still used by CountrySheet — left intact.) **Supersedes the old "CurrencySheet sizes to content".**

### Bottom-sheet backdrop — book-page recede REMOVED
- In `AddInvoiceDetails` the page no longer scales / shifts / re-rounds when a sheet opens; the dark
  status-bar strip and `anySheetOpen` flag were removed. Open sheets just dim the full-size page with the
  `BottomSheet` `bg-black/25` scrim. **Supersedes the recede described earlier.** (Other screens'
  BottomSheet usage unchanged.)

### Delivery method is now a full PAGE (not a bottom sheet)
- `SendInvoiceSheet` rewritten as a full-screen page: **slides in from the right, close ✕ top-left**,
  inside-page header, white body, same 3 `Tile` options. API unchanged (`open/onClose/onConfirm`).
- **✕ behavior**: create flow → **saves as draft** (`saveDraft()` → "Saved as draft" toast → invoice
  list), since the invoice isn't issued/sent at that step; detail-page resend → back to the detail page.
  (`onSendLater` is now unused in AddInvoiceDetails.)
- **No transition between Delivery method ⇄ Email review.** The delivery page stays mounted and the email
  review renders **instantly** on top (plain conditional `div`, no slide); Back closes it instantly.
  Applied in both `AddInvoiceDetails` and `InvoiceDetailPage`. For **email** `onConfirm` no longer closes
  the delivery page; **link/PDF** still close it first.

### Dashboard — Settings icon
- Added a **Settings (gear) button** to the right of the notification bell (`onSettings` prop). **Not
  wired** to a screen yet (no Invoice Settings screen — that's DES-764).

### Needs Attention (new feature)
- Renamed **"Needs Attention"** everywhere (dashboard header `NEEDS ATTENTION (N)`, screen title,
  QuickNav label).
- New dedicated screen **`NeedAttention.tsx`** (App screen `"needAttention"`): full inside-page, back
  arrow, helper text **"N items require action. Open an item to resolve it."**, scrollable card list.
- **Cards = invoice-card cream** (`#faf9f4` + dashed `rgba(160,160,160,0.2)`) with a **black CTA pill**
  (white uppercase). The **dashboard preview stack (`NeedAttentionStack`) stays dark/black.**
- **`ATTENTION_TASKS`** (exported from `NeedAttention.tsx`) is the **single source of truth** — the
  dashboard count *and* the stack preview derive from it. 5 demo task **types**: `payment-match`,
  `extracted`, `overdue`, `duplicate`, `overpayment`; each carries the invoice it opens.
- **Tapping a card or its CTA opens that invoice's detail** (`detailReturn = "needAttention"` → back
  returns here). CTAs currently all just open the invoice (no in-place resolve yet).
- **View-all gating**: the dashboard shows **"View All" + the dedicated list only when `> 2` items**
  (`SectionHead` hides View All when no `onViewAll`). At **≤2**: no View All, no list page — the stack
  shows the ≤2 cards inline.

## Session update (2026-06-24)

Latest decisions/changes. Where these conflict with anything above, **this wins.**

### New screens / components / App state
- **`DuplicateDecision.tsx`** — App screen `"duplicateCheck"`. The duplicate **decision page** (below).
- **`NeedAttention.tsx`** — App screen `"needAttention"` (from the 2026-06-23 work; data source `ATTENTION_TASKS`).
- **`UploadedFile.tsx`** — shared **`UploadedFileCard`** (file chip + Preview button) and **`FilePreviewOverlay`**
  (full-screen original-file viewer; render at PAGE ROOT, not inside a scroll container, or it clips).
  Used by both the upload review (`AddInvoiceDetails`) and the decision page.
- **App `Screen`** now includes `"needAttention"` and `"duplicateCheck"`. New App state: `uploadedFile`
  (`{name,size}`), `dupExisting` (matched `ExistingInvoice`), `numberRecommended`, `editFromDuplicate`.

### Upload → duplicate flow (Case 1, exact duplicate) — REDESIGNED
- After OCR (`GeneratingInvoice` `onDone`), App checks the extracted number against `EXISTING_INVOICES`.
  **If it matches an existing DRAFT → route to the `duplicateCheck` decision page** (not the editor).
  Otherwise → straight to the editor (`details`). Blank/OCR-missing → editor with the review card (below).
- **`DuplicateDecision` page** (decision page, NOT an editor): headline "Duplicate invoice found" +
  description *"This invoice already exists. You can continue editing the existing draft or create a new
  invoice from this upload."*; a **match summary card** (Client / Invoice number / Issue date / Amount /
  Status pill); the **uploaded-file card + Preview**; and a standard **`ButtonDock`** —
  - **Primary "Edit Existing Draft"** → opens the existing draft's **editor**, prefilled; existing draft
    otherwise unchanged. (Non-draft match → label "Open existing invoice" → its detail page instead.)
  - **Secondary "Create New Invoice"** → new draft from the OCR data with a **freshly generated unique
    number** (`INV-2026-000NN`, next after `EXISTING_INVOICES`) → editor. Existing draft untouched.
- **Edit-existing editor exit (`editExitToList`)**: the leading icon is an **✕ (not back)**; tapping it
  **saves as draft → "Saved as draft" → invoice list**. (Normal edit-from-detail keeps the back arrow →
  detail page.) Scoped via `editFromDuplicate`, set only on this path.
- **Create-New editor**: shows a green **"Recommended"** chip inside the Invoice Number input
  (`numberRecommended`, set only on this path). The uploaded-file preview is **not** shown again here
  (already previewed on the decision page — `uploadedFile` cleared).
- The old **in-editor duplicate warning** (yellow card + "Continue/Open existing" dock) is now **dormant**
  — the decision page intercepts before the editor. It only resurfaces if a duplicate number is typed
  manually in the editor (`existingInvoice && existingMatchesCustomer`).

### Upload create routing — lands on the invoice detail page
- **Any upload "Create Invoice"** (OCR-missing, create-new, etc. — i.e. `extracted` is set) now navigates
  to the **new invoice's detail page in Awaiting Payment** (origin `uploaded`) with a one-off
  **"Saved as awaiting payment"** flash, instead of the list. The **manual** send flow (no `extracted`)
  still returns to the list with its toast.
- The detail page's **back now clears `detailFlash`** so the flash shows once and never re-fires.

### Upload review (OCR-missing / partial-extraction case) — `AddInvoiceDetails`
- **"N out of M extracted. Please review before creating"** card at the **top** (purple AI style), shown
  **only when a field couldn't be read** (`fieldsNeedAttention > 0`); hidden for fully-extracted, matched,
  and blank cases. (`extractedFields` now counts 7 core fields incl. amount + line items → demo reads
  **8 out of 9**.)
- **Uploaded-file card moved to the top** (`UploadedFileCard` + **Preview** → `FilePreviewOverlay`, a
  demo document viewer — we only keep name/size, no real bytes).
- No-match (Case B): **Customer name + Email** inputs; email gets the warning highlight **+ caption
  "Cannot extract the information"**; **"Save &lt;FirstName&gt; to my customer list"** checkbox, default checked.
- **No auto-scroll on arrival** — both the services-section scroll (now only fires when items GROW, robust
  to StrictMode double-invoke) and the missing-field `flaggedRef` scroll were removed, so the review page
  opens at the **top** (so the duplicate / review card up top is visible).

### Send sub-flow — no transitions
- The **Delivery method** page stays mounted; **Email review, Share-link sheet, and PDF preview all open
  INSTANTLY over it (no slide)**. Delivery page is `z-40`; email/PDF overlays are `z-50`; the share sheet
  (`BottomSheet`, z-40, later in DOM) stacks above it. Back from any of them just closes the overlay.
- **`ShareLinkSheet`**: CTA is **"Mark as sent"**, **disabled until the link is copied or shared**
  (persistent `distributed` flag). Copying then closing (✕) does **NOT** mark sent → stays draft. Only
  the explicit CTA marks sent. (Supersedes the old "marked sent on copy/share = option B".)
- **`ReviewEmail`**: helper text under "Add Recipients" (*"Send a copy of this invoice to additional
  recipients."*) and the cc checkbox relabeled **"Send me a copy"**.
- Delivery-method "Download" option is labeled **"Preview as PDF"**.

### Dashboard (Figma 484:4564) — hero REDESIGNED + recent list
- Hero is now **two glassy sub-cards** on the dark gradient: **Collected** (`border-white/20` + blur:
  label + amount, green `#58c67f` **%** on the right, gradient progress bar, peer note inside) and
  **Outstanding** (`bg-white/10` + blur: label + amount + overdue line + outlined **View All** →
  Outstanding list). Header/expected-amount + `CreditCardDollar` on top; cards inset 16px. Scenario logic
  preserved (fullyCollected hides Outstanding + green bar; nothingCollected shows "to collect").
  Outstanding invoice-count line is 13px medium.
- **Settings gear** beside the notification bell (`onSettings`, unwired — DES-764).
- **Recent Invoices = 5 rows** + a secondary **"View all invoices"** button after the 5th → invoice list.
- **Needs Attention** (renamed): dashboard `NEEDS ATTENTION (N)` + dark preview stack; **"View All" only
  when > 2**. Cards (both the stack and the `NeedAttention` list screen) are **cream `#faf9f4` + solid
  border `rgba(160,160,160,0.25)` + black CTA pill**; the dashboard stack's peek cards are warm beige.
  Helper text on the screen: *"N items require action. Open an item to resolve it."*

### Create-invoice customer page (`CreateSalesInvoice`)
- **Frequently used = horizontal row of 5 circular initial avatars** (50px, white, light border; **orange
  `#ff4a15` fill + white initials when selected**) with truncated names below; header **"FREQUENTLY USED
  (5)"** (`FREQUENT_IDS` = marlow/bright/otto/northwind/lumen, capped at 5). **OTHERS** below stays `Tile`
  rows. Searching collapses to one flat **RESULTS** list.

### Misc
- **Accounting Hub removed** — app **lands on `dashboard`** (the root); Dashboard has **no back arrow**;
  `AccountingHub.tsx` / `FinanceBottomNav.tsx` remain on disk but unused. QuickNav no longer lists it
  (nor "Invoice Detail" / "Needs Attention" — reached by tapping through). **Hero states are nested
  under Dashboard in QuickNav** (Happy path is the default).
- File uploader dropzone label: **"Select one file under 10 MB"**.
- **Customer avatars removed** app-wide remains in effect (temporary, pending invoice-number confirmation).
- Numbers are **5-digit `INV-YYYY-NNNNN`** (from 2026-06-23).

## Design tokens

INK `#1b1b1b`, secondary `#808080`, brand orange `#ff4a15`, beige `#f9f5ea`/`#faf9f4`,
success green `#006a1d`/`#ebfcef`/`#a3e9b6`, AI violet `#7c3aed`/`#f6f1ff`, amber attention
`#fffbeb`/`#fde68a`/`#b45309`. `FONT = { fontFamily: "GT Walsheim LC, sans-serif" }`.

## Pending / deferred work

- **Invoice detail page** — built (`InvoiceDetailPage.tsx`, all 6 statuses, optional send,
  Draft delete/issue, **Edit prefills the form**). Still shallow: detail data is demo/static
  (line items are the same `ITEMS` regardless of which card opened it; email defaults);
  **limited-edit → regenerate+re-send** semantics (DES-715 AC4) not modelled (Edit just opens
  the populated form).
- **DES-715** now in repo — read. Gaps vs manual flow: issue is merged into Send (no explicit
  Issue→Awaiting step); editing an issued invoice not modelled (see above).
- DES-716 "nothing extracted" OCR-failure — **NO LONGER a dead-end screen**. On a total miss the
  extracting step now drops the user **straight into the upload form blank** (`BLANK_EXTRACTION`,
  upload mode) with an **amber "We couldn't read this file. Please enter the details below." banner**
  (dismissible, + "Upload a clearer file" link → re-upload). Required-fields gate still blocks
  save/issue until filled. `ExtractionFailed.tsx` is now unused (kept in repo). Demo trigger:
  UploadInvoice "Simulate an unreadable scan" (App routes `blank/unreadable` → `pendingExtraction =
  null` → `BLANK_EXTRACTION` + `extractionFailed`). UploadInvoice itself is now a **BottomSheet**
  over the originating screen (dashboard/list), with source pick (library/files) as an inline
  "Add a file" sub-sheet. OCR "Reading your invoice" step shortened (`durationMs={1400}`).
- DES-718 send hardening — **built**: ReviewEmail **validates every recipient address** before
  sending (inline error); the email **preview shows the structured content** (Open-invoice button
  + invoice number / amount due / due date / **payment reference**); and a **delivery-failure /
  retry state** (AC4) — on failure the form keeps all content, shows an error banner, and the
  primary becomes "Try again" (demo trigger: "Simulate a failed send" toggle at the bottom).
- DES-715/716 **overpayment** (AC6) — Record Payment > total → **Paid with the overpayment
  flagged for review** (shown in the Paid banner: "overpaid by $X, flagged for review").
- Credit-note flows (DES-719/720/721) not started — Cancel-with-credit-note on the detail page
  is a stub that just flips status to Void.
- **DES-766** (Create & Manage Sales Invoice List) — partially read for the invoice-number format
  (5-digit list rule). Full reconciliation with the 713 list spec still pending.
- **Invoice Settings (DES-764)** — dashboard now has a **Settings gear** beside the bell (`onSettings`)
  but **no Settings screen exists**; the button is unwired.
- **Invoice number 6-vs-5 digit** conflict (field-spec vs DES-766/mockups) — flag to Beatrice; currently
  5-digit. Plus the open "provisional number on drafts" idea.
- **Needs Attention CTAs** (Confirm/Review/Remind) currently all just **open the invoice detail** — no
  in-place resolve (e.g. one-tap reconcile/remind) yet. `ATTENTION_TASKS` data is demo/static.
- **Customer avatars** removed app-wide as a temporary call — restore once the invoice-number layout is
  confirmed.
- Final step: consolidate the Figma Make file list (local-only scaffolding `index.html`,
  `src/main.tsx` are NOT needed in Figma Make).
