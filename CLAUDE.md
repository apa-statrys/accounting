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
                     #   (NAV entry + Overview demo) in the same pass. Overview demo = an
                     #   InteractiveDemo (single live preview + a Controls sidebar of radio
                     #   groups, one per prop — see Badge/NotiBadge/TabsBase, added 2026-07-24)
                     #   — one instance you flip through beats a static grid of every
                     #   combination. Skip a separate Variants grid when the Overview is
                     #   already an InteractiveDemo; it's redundant.
  components/        # shared widgets only — sheets, cards, nav, inputs (no screens). Same
                     #   folder-per-component shape as ui/ now (index.tsx + index.module.css,
                     #   e.g. SearchField/, SelectionCard/, BottomSheet/ — SearchField/
                     #   SelectionCard renamed from Search/Tile 2026-07-16 to stop colliding
                     #   with ui/'s same-named DS components (genuinely different, not dupes).
                     #   ButtonDock + EditCard render ui/Button inside. The legacy
                     #   components/ui/ (radix checkbox + cn() utils) was deleted 2026-07-29 once
                     #   its last callers (SendInvoiceSheet, ButtonDock) migrated to the real DS
                     #   ui/Checkbox — always use ui/Checkbox for a new checkbox, never re-add
                     #   a components/ui/ shim.
  pages/             # screens. A screen that owns sub-pages/parts lives in a folder
                     # holding the main page + its private pieces (folder-per-screen
                     # reorg 2026-07-17); standalone single-file screens stay flat.
    sales-invoice-list/   # SalesInvoiceList (page) + filters.ts (pure) + InvoiceCard
    add-invoice-details/  # AddInvoiceDetails (page) + derive.ts + Banners + ExistingInvoiceSheet
    credit-note-form/     # CreditNoteForm (page) + lineMath.ts + ReasonSheet + ClientEditSheet
    invoice-detail/       # InvoiceDetailPage (page) + demoInvoice.ts + creditNoteTypes.ts +
                          # CreditsAppliedSection + ActionsMenu + RecordPaymentSheet +
                          # RefundCreditNoteFlow (DES-720, private to this page)
    credit-note-list/     # CreditNotesList (page) + CreditNoteDetailPage + CreditNotePreviewPage
                          # (the CN detail/preview are also opened from invoice-detail & the list)
    shared/               # pages rendered inside >1 screen's flow: InvoicePreviewPage
                          # (invoice-detail + add-invoice-details). Flat single-file screens
                          # (Dashboard, AccountingHub, InvoiceSettings, NeedAttention,
                          # CustomerList, CustomerDetailPage, AddCustomerPage, CreateSalesInvoice,
                          # GeneratingInvoice, DuplicateDecision, UploadQueue) stay directly under
                          # pages/ — upload is native scan/picker now (no in-app upload screen), so
                          # ScanDocument (native-scanner stand-in) + UploadErrorDialog live in
                          # components/ instead, not a pages/upload-invoice/ folder.
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
- **Pages stay Tailwind, not CSS-module** (decided 2026-07-17) — pages are one-off composed screens
  with heavy dynamic/motion/scroll inline styling that can't live in a single CSS module; CSS
  modules are the pattern for `ui/` + `components/` only. Tailwind's spacing/radius scale already
  equals the tokens (`px-4` = `--space-8` = 16px, `rounded-[12px]` = `--radius-2xl`) — don't
  rewrite Tailwind utilities to `p-[var(--space-8)]` for the sake of it.

## Screens (`Screen` union in types.ts → rendered by App.tsx)

All screen components live in `pages/`:

| screen | component | | screen | component |
|---|---|---|---|---|
| dashboard (landing) | Dashboard | | invoiceDetail | invoice-detail/InvoiceDetailPage |
| hub (Menu) | AccountingHub | | creditNote / refundCreditNote | credit-note-form/CreditNoteForm |
| list | sales-invoice-list/SalesInvoiceList | | creditNotes | credit-note-list/CreditNotesList |
| customer (pick) | CreateSalesInvoice | | customers | CustomerList |
| details (editor) | add-invoice-details/AddInvoiceDetails | | customerDetail | CustomerDetailPage |
| extracting | GeneratingInvoice | | addCustomer / editCustomer | AddCustomerPage |
| uploadQueue | UploadQueue | | duplicateCheck | DuplicateDecision |
| needAttention | NeedAttention | | | |
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
  "Changes saved" / "Payment recorded" / "Invoice voided" / "Invoice duplicated" / "N invoices
  created" (multi-file upload, below).
- **Multi-file upload → Review Invoices queue** (added 2026-08-19, DES-894 feedback): the native
  picker/scanner can return several files in one pick — QuickNav's "Upload — Multiple Files" (Sales
  Invoice → Create Invoice — Upload) simulates this with `DEMO_UPLOAD_QUEUE` (data/extraction.ts).
  One batch OCR pass (`extracting` screen, plural copy) lands on `uploadQueue`
  (pages/UploadQueue.tsx) listing each file with a Reviewed/Needs Review badge; tapping a row opens
  the SAME single-file `details` (AddInvoiceDetails) review screen, which returns to the queue
  (`uploadQueueActiveIndex` in App.tsx) instead of the list until every file is done, then shows the
  one summary toast and returns to the list. Leaving the queue early just abandons the remaining
  files — no partial invoices are created, same "reload resets state" limit as the rest of the app.
- **Customer-edit concurrent conflict** (added 2026-08-19, DES-894 feedback): no real backend to
  race against in this prototype, so it's demo-only — Edit Customer's own "Page States" panel has a
  "Concurrent edit conflict" toggle (`simulateConflict` prop, AddCustomerPage.tsx) that makes Save
  show a "This customer was updated by someone else" sheet instead of saving straight through.
  "Review Changes" steps (same sheet instance, not a stacked second sheet) to a Phone
  Number/Address your-version-vs-their-version compare; "Keep My Changes" commits this session's
  edits as normal, "Use Their Changes" discards them and keeps the fixed demo "other user" values
  instead.
- **Edit for issued invoices (Awaiting/Overdue)** (updated story): **every field is editable** —
  issue date, due date, currency, receiving account, items, discount — **except** the auto-generated
  invoice number and the client identity (Company Info / client name, address, email). The client
  tile is read-only in any edit; the number isn't on the form. Paid isn't editable at all (no Edit
  action). No auto-resend on save (deferred).
- **Invoice currency is fixed per invoice** — seeded OCR → edit-seed → customer default → Settings
  default; never chosen per invoice, never written back to the customer/Settings.
- **Never show a "$" glyph for money** — always the currency code, e.g. "USD 6,450.00", "HKD 30.00",
  "EUR 30.00" (ambiguous across currencies otherwise). `lib/format.ts`'s `money()`/`formatMoney()`
  take a `currency` argument and format this way; don't hardcode "$" in new code.
- Credit-note lifecycle, refund lifecycle, corrected-invoice model, per-note send state, status
  chips: the source of truth is the code itself (`invoice-detail/`, `credit-note-form/`,
  `credit-note-list/`) plus the live Jira tickets (DES-719/720/721) — read those before changing it.
- **A credit note's own document is only ever sent/resent from the CN's own detail page** (decided
  2026-08-13) — the invoice detail page never duplicates that action. This already held for the
  refund-pending dock ("the refund CN is sent from its own detail page"); the refund-done/submitted
  dock used to break it with its own "Send/Resend Credit Note" primary CTA — removed, since sending
  the invoice or logging the refund are the only INVOICE-level actions.
- **Preview as PDF is always menu-only, never a sticky dock CTA** (decided 2026-08-13, same session
  as the rule above — a Paid invoice with an applied cancellation CN had briefly duplicated it as
  both, and the refund-done/submitted case above needed *some* replacement for the CTA it lost).
  `showPreviewPdf` in InvoiceDetailPage.tsx is the single source of truth (Paid, with or without a
  CN; or a refund that's done/already submitted) — feeds both `hasMenuActions` and ActionsMenu's
  own `showPreviewPdf` prop, so the ⋯ button and its Preview-PDF row never disagree.
- Client delete/archive is out of scope (referential integrity; record shared with payments side).
- Sheet motion: sheets dim the page with the shared `ui/Overlay` component (`--overlay`,
  `rgba(27, 27, 27, 0.6)` — Figma dev-mode spec; no page recede/scale). `ButtonDock` labels
  single-line. **Bottom sheet height: use the available space** (decided 2026-07-28) — default to
  no `heightClass` at all so the sheet auto-sizes to its content up to `BottomSheet`'s own 88%
  `max-height` cap, instead of pinning to a smaller fixed height that leaves room unused or forces
  scrolling sooner than necessary. Only pass a fixed `heightClass`/`tall` when a sheet must match a
  sibling sheet's height exactly (e.g. stepping between a form and its nested picker). When a sheet
  needs to show as much as possible without scrolling, `fullPage` (taller than any percent
  `heightClass`) plus `compact` (reclaims the empty no-footer spacer) is the strongest combo —
  verify the actual fit with a headless-browser screenshot, don't just eyeball the CSS. CurrencySheet
  no longer pins to Add-Services' `SERVICE_SHEET_HEIGHT` — it's `fullPage compact` so all 11
  currencies show with zero scrolling. **Sheet titles are action-oriented** (decided 2026-07-28) —
  lead with a verb ("Select Currency", "Select Due Date", "Select Country"), not a bare noun
  ("Currency", "Due Date"); doesn't apply to purely informational sheets (e.g. "Bank Information",
  "Email Preview") that aren't a choice/action.

## UI & interaction conventions (decided — general rules, apply proactively without being asked)

**Styling**
- Bind everything to design tokens, never raw hex/px: colors/spacing/radii/effects → CSS vars from
  `styles/tokens/*.css` + `styles/theme.css`; typography → the classes in `styles/fonts.css`
  (`.h0`–`.h6`, `.body-*`, `.caption`, `.card-title-*`, `.link-*`) instead of hand-rolled
  font-size/line-height/letter-spacing. `Alpha/<Color>/<N>` tokens are the same base hex at N%
  opacity (fixed 10%-step suffix table), not independently-sourced colors per step.
- Icons: `lucide-react`, `strokeWidth={1}` or `{1.67}` (not lucide's default of 2, which reads too
  heavy), never `@mui/icons-material` in new/touched code. `ui/`'s own hand-drawn SVGs are
  pixel-matched to Figma — don't convert those to lucide.
- Never use emoji anywhere in the UI — icons, flags, decoration in copy. Flags go through
  `components/CountryFlag`; any other pictograph need is a lucide/hand-drawn SVG icon.
- Before building any UI primitive, check `ui/` and `components/` first and import the existing
  one — never hand-roll a duplicate (this app was built screen-by-screen before the DS rollout, so
  un-migrated local copies still turn up — migrate + delete them when found).
- Red is reserved for destructive/irreversible actions, not for "touches a credit note" or any
  other feature-area grouping — check whether the action cancels/deletes/reverses (→ red,
  `--text-error-primary`/`--icon-error-primary`) vs. starts/creates something new (→ default ink).
  `ButtonDock`'s `secondaryDestructive` only belongs on a secondary paired with a **destructive
  primary** (e.g. Delete Draft/Keep Draft) — not just because the secondary's own action happens to
  be irreversible (e.g. a plain "Discard" next to a neutral primary stays undecorated).
- **Every delete action confirms first** — never wire a trash icon/⋯ menu row/dock secondary
  straight to the delete handler, even for something as small as one invoice line. Same shape every
  time (Sales Invoice List's "Delete Draft Invoice?", InvoiceDetailPage's "Delete this draft?",
  CreditNoteDetailPage's "Delete credit note?", AddServicesSheet's "Delete this item?"): a `compact`
  `BottomSheet`, title "Delete this `<noun>`?", body "Are you sure you want to delete this `<noun>`?
  This action cannot be undone.", footer `ButtonDock` `type="double"` with `primaryLabel="Delete
  <Noun>"` `primaryDestructive`, `secondaryLabel="Keep <Noun>"` `secondaryDestructive`. This is
  separate from an edit flow's own "Unsaved changes?" confirm (that one guards losing in-progress
  edits; this one guards an irreversible delete) — a page can need both.
- Field label *text* never turns red, even on error — only the hint/caption below the field does.
  The mandatory `*` itself is the one exception (decided 2026-08-04): it turns `--text-error-primary`
  while that specific field currently fails validation, never merely for being mandatory — see
  `ui/TextField`'s `error`+`mandatory` props and the shared submit-time validation convention below
  (`lib/focusFirstInvalidField.ts` + each mandatory field's `data-req` key). Warning-toned components
  (banners, badges, callouts) tint only the icon amber (`--icon-warning-primary`) — title/body/link
  text always stays `--text-primary`.
- **Form validation: the primary CTA is never disabled for incompleteness** (decided 2026-08-04,
  applies to real fillable-field forms — AddCustomerPage, BankInfoSheet, AddServicesSheet,
  ClientEditSheet, CreditNoteForm, RecordPaymentSheet, AddInvoiceDetails' manual-create/upload-review
  paths). The CTA stays fully enabled; clicking it with mandatory fields empty validates the whole
  form at once (never stops at the first failure), highlights every offending field together (red
  border + pale `--bg-error-subtle` fill + a caption naming what's required), and calls
  `focusFirstInvalidField` with the first-in-visual-order key to scroll/focus it — never advances the
  step/closes the drawer on failure. A rule with no single field to blame (a cross-field total, e.g.
  CreditNoteForm's "credit at least one line") surfaces as an inline error under the relevant
  section's own heading instead (reversed 2026-08-13 — CreditNoteForm's "credit at least one line"
  used to be a toast; now `data-req="cn-items"` on the Items section wrapper scrolls to it like any
  other field, with the message shown inline under the "Items"/"Items to Refund" label). This does
  **not** apply to disabled-until-chosen single-select pickers (ReasonSheet,
  CreateSalesInvoice's customer picker, RefundCreditNoteFlow, InvoiceSettings' two edit sheets) —
  disabling until exactly one choice is made is the right pattern there, not a gap to fix. It also
  doesn't apply to **Save vs. Send/Create**, a different pair of actions than "submit this form":
  **Save (persisting a draft) is never blocked by incompleteness** (decided 2026-08-12 — reversed
  AddInvoiceDetails' edit-invoice dock, which used to hard-disable Save at 0 items; the header
  back chevron's "Unsaved changes?" confirm sheet already never validated, so the dock's own Save
  button was just an inconsistent extra gate on the exact same action) — a draft can always be left
  and resumed incomplete. Applies the same way to CreditNoteForm's edit-mode Save (editing an
  existing register note used to fall through to the validated `handleCreate`/`canCreate` — now
  always calls `onCreate` directly, matching the resumed-draft `onSaveDraft` path it already had).
  **Send/Create/Apply (issuing something real) still requires completeness**, and stays a
  disabled-until-complete or validate-on-click CTA rather than silently succeeding — InvoiceDetailPage's
  Send button is gated on `requiredComplete`. CreditNoteDetailPage's dock goes one step further
  (decided 2026-08-12, supersedes the earlier "Apply is always the primary CTA" rule): an
  incomplete Open/refund-draft note leads with **Edit Credit Note** as the primary CTA instead of
  Apply — fixing what's missing is one tap away rather than a toast explaining it after a failed
  Apply tap. Once `draftComplete` (reason + a credited amount), the primary CTA swaps to **Apply
  to invoice** (still toasts `applyBlockedReason` on a failed tap as a safety net, now rarely
  reachable) and Edit moves into the ⋯ menu instead — see `showEditPrimary`/`showApplyPrimary`/
  `canEditFromMenu` in CreditNoteDetailPage.tsx, which stay mutually exclusive by construction. A page
  whose Save is now always allowed shows what's still missing inline instead of hiding the
  incomplete section — InvoiceDetailPage's Items card, when empty, shows "No items added yet" /
  "Add at least one item to continue"; CreditNoteDetailPage's Credited/Refund items card does the
  same ("No items credited yet" / "Credit at least one item to continue"), gated on `total`
  rather than `lines.length` — kept as `total` even after `CreditNotesList`'s `saveFromList` was
  fixed (2026-08-12) to also persist `p.lines` on edit, since `total` is the more direct signal
  for "is this note creditless" either way.
- **Editing an existing record: one always-shown Save CTA, no Cancel** (decided 2026-08-20,
  supersedes the earlier hidden-until-dirty Save+Cancel pair) — AddCustomerPage (edit mode),
  AddInvoiceDetails' `editingIssuedInvoice`, InvoiceSettings' Company Details/Business Address,
  CreditNoteForm's edit mode, and AddServicesSheet's Edit Item all use a `type="single"` `ButtonDock`, always rendered, with
  `primaryLabel="Save"` and `primaryDisabled={!dirty}` — no `secondaryLabel`/`onSecondary`. The
  header back chevron is unchanged: it's still the way to leave without saving, still confirming via
  a separate "Unsaved changes?" `BottomSheet` (Save/Cancel, `type="double"`) when dirty — that
  modal confirm is a different concern (a one-time binary decision) from the page's own persistent
  dock, and keeps both buttons. Delete-confirmation dialogs and other modal confirms (duplicate-
  record warnings, etc.) are unaffected by this rule for the same reason.
- Every phone-frame screen must be inside `.mobile-mode` scope (already applied on App.tsx's root
  wrapper, so all in-app screens inherit it) so typography tokens resolve to mobile sizes — the
  responsive `@media` breakpoint keys off the real browser viewport, not the 375px frame, so any
  new phone frame mounted outside App.tsx (e.g. showcase) must add the class itself.

**Sheets & interaction**
- A deeper "level" inside a sheet (a sub-menu, a nested detail, RecordPaymentSheet's
  account/date sub-steps) swaps content in the SAME `BottomSheet` instance (a `step` state +
  slide transition + `onBack`) — never a second sheet stacked on top of the first.
- **`BottomSheet` shows a header ✕ close by default, no more grabber handle** (decided 2026-08-20 —
  the handle is gone everywhere; the ✕ is now the sheet's primary explicit dismiss affordance,
  replacing the old fullPage-only `showClose`). Two opt-outs, both via `hideClose`: (1) a modal
  CONFIRM dialog whose footer already poses the decision as an explicit button pair — delete
  confirmations ("Delete this draft?" etc.) and "Unsaved changes?" sheets keep their existing
  Cancel/Keep-X secondary and get no ✕, since a second, differently-meaning way to leave would only
  confuse which action actually happens; (2) any `footer` with 3 CTAs (`ButtonDock type="triple"`,
  e.g. AddInvoiceDetails'/CreditNoteForm's "Saved as draft" sheets, the customer-conflict sheet's
  notice step) — three explicit actions already on offer, a ✕ has no single clear meaning. Every
  OTHER sheet with a footer `secondaryLabel="Cancel"` had that button removed in the same pass
  (the ✕ replaces it) — e.g. AddCustomerPage's duplicate-warning sheet is now a single "Save/Create
  Anyway" CTA, RecordPaymentSheet's form step is now a single "Confirm" CTA. A sheet with NO Cancel
  to begin with (plain single-select pickers, the conflict sheet's "Keep Mine"/"Use Theirs" compare
  step) just gains the ✕ for free — nothing else changes. Two more `hideClose` categories added
  the same week: (3) a bare Tile-row action/navigation chooser with no other content — the ⋯
  actions menus (`ActionsMenu.tsx`, CreditNoteDetailPage's own) and the FAB's `CreateInvoiceSheet`
  — since tapping a row (or the scrim) is already how these dismiss, same spirit as excluding
  single-select pickers from the >3-field-is-a-page rule below; (4) SendInvoiceSheet's own Preview
  sheet (Email/PDF segmented control replaces the title) — no ✕ there either. `UploadErrorDialog`
  (file too large/unsupported) is `hideClose` too, but unlike the two categories above it needed a
  replacement: `type="double"` with `secondaryLabel="Cancel"` alongside "Choose Another File",
  since it's posing a real choice (retry vs. give up), not a plain chooser/preview.
- **A picker sheet's own search entry is a plain, non-sticky field below the title — tapping it
  still hands off to the SAME header search-pill mode every other search-in-sheet flow uses**
  (decided 2026-08-20, two-part iteration — CountryCodeSheet/CountrySheet used to hide search
  behind a small tap-to-reveal ICON that morphed the title into a frosted pill). First pass replaced
  the icon with an always-visible `ui/Search` field pinned in the sticky header via `headerExtra` —
  corrected once the user clarified: the field itself isn't sticky and doesn't stay a separate
  mechanism. Final shape: a real (but inert, not `autoFocus`) `ui/Search` row renders as normal
  scrollable CONTENT right below the title (so it scrolls away like any other row, not pinned) —
  tapping/focusing it sets `searchOpen` true, which switches the SAME `BottomSheet`
  `searchValue`/`onSearchChange`/`onBack` props the old icon used to drive, so the sticky header
  itself becomes the back-chevron + frosted search pill (with `autoFocusSearch`), same content-step
  slide (`stepSlide()`) as Filters' own customer-search step. The on-screen `Keyboard` mock footer
  only renders while `searchOpen`. `ui/Search` gained an `onBlur` prop along the way (it only had
  `onFocus` before) — no longer used by these two sheets in the final shape, but kept since other
  callers may still want focus/blur-driven `keyboardOpen` tracking. Doesn't apply to sheets that
  already open straight into search with no toggle at all (CustomerSheet, ReceivingAccountSheet,
  InvoiceSettings' pickers, Filters' customer-search step, CreateSalesInvoice) — ask before
  converting those too.
- **A form with more than 3 data-entry fields is a full pushed page, not a `BottomSheet` drawer**
  (decided 2026-08-11). "Field" means a TextField/TextArea/dropdown-TextField the user actually
  fills in — not a single-select list picker (CountrySheet, CurrencySheet, DueDateSheet,
  ReceivingAccountSheet, CustomerSheet, …), a toggle-only settings row, or an action/confirm
  dialog, all of which stay sheets regardless of row count. A sub-level *picker* opened from
  within a form doesn't count toward the outer form's own field count — it's what that form's
  trailing selector opens, not a field itself. Once the outer form is a page (not a sheet), that
  picker can no longer be an in-place step-swap of a sheet panel (pages have no panel to swap
  within, and a page-level step-swap reads like real navigation, not a picker — tried once on
  AddServicesSheet's Unit list, corrected 2026-08-11) — it's always a standalone `BottomSheet`
  (or an existing single-select sheet) stacked on top instead, nested inside the page's own JSX so
  it z-stacks above it: AddServicesSheet's own small Unit `BottomSheet`; InvoiceSettings' Company
  Details page opens the existing `CountryCodeSheet` for its phone country code (same as
  AddCustomerPage already did); its Business Address page opens its own small standalone
  country/city/state `BottomSheet` the same way. 3 or fewer fields (ClientEditSheet, ReasonSheet,
  RecordPaymentSheet's amount+account+date) can stay a sheet. Converted so far: Filters (below),
  AddServicesSheet, InvoiceSettings' Company Details + Business Address pages. BankInfoSheet
  (4 fields) was NOT converted — its "Use Other Bank Accounts" trigger is hardcoded hidden
  (`hideExternal`) at every `ReceivingAccountSheet` call site, so it's unreachable dead code;
  flagged separately for removal rather than converting an unreachable sheet to a page.
- **Filters is a full pushed page, not a bottom sheet** (decided 2026-08-11 — SalesInvoiceList and
  CreditNotesList's "Filter Invoices"/"Filter Credit Notes" were both a `fullPage` `BottomSheet`
  before this; converted together per the cross-page consistency rule). Same push/slide chrome as
  any other detail/edit page (`absolute inset-0 z-50` + `PAGE_PUSH_TRANSITION`, `PageHeader`
  center/search types for the base step vs. the Customer-search step) — the underlying list stays
  mounted behind it. The Customer-search step still swaps content within this SAME page (no second
  page stacked on top), and the Issue Date calendar still drops open inline below its fields rather
  than pushing a level — both unchanged from the sheet version, just re-shelled. The footer
  (Reset/Apply dock, or the search step's bare-Keyboard/ButtonDock+keyboard) is measured via a ref
  (`filterFooterHeight`) the same way `BottomSheet` measures its own footer internally, since the
  page shell doesn't get that measurement for free the way the sheet did.
- An "almost full page" drawer leaves exactly `calc(100% - 43px)` from the top of the screen — not
  a fixed pixel height or a plain percent (percents don't reliably land on 43px if the frame size
  changes).
- `BottomSheet`'s `keyboardOpen` must drop any fixed `heightClass` too (not just footer-overlap) so
  the panel can grow into the space instead of leaving dead space above it while the keyboard mock
  is open.
- Footerless sheets keep a plain, fully opaque bottom — no gradient/blur fade (tried once, reverted
  after review; only sticky headers/docks get a frost effect).
- A sheet's search-in-header trigger uses `BottomSheet`'s built-in `searchValue`/`onSearchChange`/
  `onBack` props (title morphs into a frosted search pill) — don't hand-roll a static title +
  toggled inline search row. Step-swap content between levels defaults to plain object-literal
  Framer Motion (`initial`/`animate`/`exit` on one wrapping `motion.div`); only reach for the shared
  `stepSlide()` string-variant helper when a step's content is a shared component with its own
  nested `sheetItem`-variant rows (object-literal breaks their variant propagation).
- Opening a new subpage or a modal/sheet always starts scrolled to top — never remember/restore a
  prior scroll position (exception: toggling an inline "searching" sub-view within the same scroll
  container only resets on entering search, not on exiting it).
- Search pages/sheets hide the "Result 1"/"Results N" count until the user has typed a non-empty
  query; zero matches show only the centered empty-state message, never "Results 0" alongside it.
- Any `BottomSheet` listing `Tile` rows uses `size="sm"` once it has 4 or more rows.
- Sticky headers reuse `components/PageAppHeader` rather than re-deriving frost/blur inline:
  transparent at rest, a White/40→transparent gradient + blur + bottom mask on scroll (the mask is
  required — background alpha alone can't soften the blur's hard bottom edge).
- Pages built with bold section-title grouping (e.g. AddCustomerPage's Details/Address/Invoice)
  collapse `PageHeader` to left-aligned + show the current section's name as a scroll-driven
  subtitle — apply to new sectioned pages by default.

**Consistency**
- A fix, restyle, or Figma re-sync applied to one page/component must be applied to every other
  page/component sharing that same style or structure in the same pass — even without shared code
  — not left to drift. Grep for similar class names, comments ("same style as X"), or duplicated
  JSX shapes before calling a visual fix done.
- Component/Showcase usage docs must pair each option with a concrete "use when ..." clause, not
  just describe its shape.

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

Private GitHub **`apa-statrys/accounting`** (SSH). **Claude commits and pushes directly to `main`**
(changed 2026-07-31 — no feature branch/PR, no holding changes for the user to commit themselves).
Vercel uses `pnpm install --frozen-lockfile`: keep `package.json` and `pnpm-lock.yaml` in sync; don't
add dependencies casually.
