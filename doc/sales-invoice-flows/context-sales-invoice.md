# Sales Invoice Flows — Current Handoff

Read this first when continuing sales-invoice work. **Keep this file under ~150 lines:** it holds
only the CURRENT state and next steps — overwrite/trim it each session. Dated narratives go to
`./history/session-log.md`; the full invoice-detail/credit-note/refund spec is
`./invoice-detail-behavior.md`; repo map + conventions + run/verify commands are **CLAUDE.md**.

## Locked Period (DES-751) + PhoneInput + Today issue-date — committed 2026-07-22 (`215ac49`, on main + develop)

**PhoneInput** — new `components/PhoneInput.tsx`: country-code selector (flag + dial code + chevron)
opening a searchable `DialCodeSheet` (DS `Tile` rows, `DIAL_COUNTRIES`). Stores dial + national as one
combined `phone` string via `value`/`onChange`. Replaced the static `🇺🇸 +1` prefix in **AddCustomerPage**
+ **InvoiceSettings**.

**Today issue-date descriptor** — a fresh Create-Invoice Issue Date row now reads **"Today (15 Jun 2026)"**
(mirrors Due Date's "Next 30 days (…)"); the prefix drops once a date is picked. `AddInvoiceDetails`:
`issueChanged` state + `showIssueToday` (create flow only — not extracted/editing/recurring/seeded/placeholder).
The default date itself is still the hard-coded 15 Jun 2026, NOT wired to a real "today".

**Locked Period (DES-751)** — how a closed accounting period surfaces on the *client* app (locks are set
on the admin app, read-only here). New `pages/locked-period/`: `LockedPeriodBanner` (amber inline notice),
`LockedPeriodDialog` (bottom-sheet blocking dialog, `dsHeader`+`hideClose`, single **OK**; default copy =
CN-edit), `InformationBanner` (Dashboard + `noticeBanner` prop, all inert via `pointer-events:none`).

**Interception mechanisms** (all key off a `lockedPeriod` prop unless noted):
- `AddInvoiceDetails` — Create uses `lockActions` (Back + primary CTA inert) AND `lockExceptIssueDate`
  (2026-07-22 rename of the old `highlightIssueDate`): a capture-phase click guard on the scroll container
  swallows every click outside the Issue Date row (scrolling untouched) and locks Back; the CTA is gated
  separately by `lockActions`. Upload passes `lockExceptIssueDate` but NOT `lockActions`, so its
  **Create Invoice CTA stays live** (`onSend` → list + "Invoice created successfully") for re-issue after a
  valid date is picked. Also `seedIssueDate`/`issueMinDate`/`issueSheetHelper`/`issuePlaceholder`/`topBanner`.
  `onIssueSheetToggle` lifts the calendar open/close state to App. `Item` has `error`=red + `warning`=amber
  row states (the unset Issue Date reads amber; guardIssueDate scrolls+flags on the Upload CTA).
- `InvoiceDetailPage.lockedPeriod` → `lockedAction` routes Send / Edit / Add-credit-note / Refund / **Mark as
  paid** (`openMarkPaid`, 2026-07-22 — blocks Record Payment) to `LockedPeriodDialog`. Its CN-detail overlay
  passes `lockedPeriod` to `CreditNoteDetailPage`, locks the overlay Back arrow, and routes overlay draft-CN
  **Apply + Edit** to `lockedCnAction` (edit|apply) dialog. Cancel refund / Cancel credit note → dialog.
- `CreditNotesList.lockedPeriod` → Back arrow inert; Draft-CN **Apply + Edit** → `lockedNotice` (edit|apply)
  dialog; forwards `lockedPeriod` to `CreditNoteDetailPage`.
- Dialog copy pattern (all): "…can't be [edited/applied/added/cancelled/recorded] because its date
  ([DD/MM/YYYY]) falls in a closed accounting period. Contact your accountant for assistance." Titles:
  "Editing isn't available", "Credit note can't be applied", "Credit note can't be added", "Refund can't be
  added", "Unable to send invoice", "Payment can't be recorded", "Refund can't be cancelled", "Credit note
  can't be cancelled".
- **Beside-frame annotation boxes** (`App.tsx`, `hidden lg:block` right of the frame, same card style as the
  Void "Scenario" note): Create-locked shows a "Click Issue Date" straight arrow → swaps to the locked-dates
  explanation once the calendar opens; Upload-locked shows the re-pick-issue-date note; Refund-CN-Draft shows
  the Apply-vs-Edit note (complete draft leads with Apply, incomplete → Edit only).
- **Back-arrow lock scope (2026-07-22):** Awaiting-, Paid-, all CN- and both Refund-CN locked screens have an
  inert Back arrow; other locked screens still return to dashboard.

**QuickNav layout** (final): the standalone "Locked Period" group was REMOVED; each demo now sits under its
real counterpart. Sales Invoice → `Create (Locked Period)` (after Create Invoice), `Upload (Locked Period)`
(after Upload Invoice); Invoice-Detail section → `Awaiting (Locked Period)`, `Paid (Locked Period)`. Credit
Note → Unpaid Invoice → `CN-Draft (Locked Period)`, `CN-Applied (Locked Period)`; Paid Invoices →
`Refund-Draft (Locked Period)`, `Refund CN — Applied (Locked Period)`. Screen ids: `lockedPeriodDialog`
(Create), `lockedPeriodUpload`, `lockedPeriodEditInvoice` (Awaiting), `lockedPeriodPaid`,
`lockedPeriodEditCn` (CN-Draft), `lockedPeriodCnApplied`, `lockedPeriodRefundDraft`, `lockedPeriodRefundApplied`.
`lockedPeriodBanner` + `lockedPeriodInvoiceDraft` screens still exist but are unreachable (nav entries removed).
CN/refund locked demos reuse the register data (CN-…005 draft, CN-…003 applied, CN-…007 refund on INV-…015).
All verified headless; build clean. **Copy still uses literal `DD/MM/YYYY`/`DD/MM/YY` placeholders** (swap for
real dates before Figma-Make port). Invoice-Detail section also split **Draft** into `Draft (Created)` +
`Draft (Uploaded)` (same INV-…003, distinguished by `openInvoice.origin`), each with a beside-frame note
(Created: Send shown only when all fields complete, else Edit is primary; Uploaded: Mark-as-Sent/Paid offered
since it may already be sent outside Statrys). Related-Invoice row arrow now wired on the locked-period CN
screens too (`openCnRelatedInvoice` helper; Back returns to the locked preview).

## Session 2026-07-22 — invoice/CN detail refinements (committed, `215ac49`)

Non-locked-period tweaks shipped alongside the locking work:
- **Back nav:** every QuickNav-opened invoice detail returns to the FULL invoice list (`jumpDetail` now
  clears `listPreset`).
- **Dashboard recent invoices** mirror the list `InvoiceCard`: amount = shared demo total `money(TOTAL)`
  ($6,450 every row), the credit strip shows the CN NUMBER (empty `creditedLabel`), refund state reads
  **"Pending Refund"** with no date caption.
- **Invoice detail:** invoice number shows in the page header ONLY — the "Invoice number" row was removed
  from the Invoice Details card (was on Awaiting/Overdue).
- **CN detail sublines** (`CreditNoteDetailPage` hero): refund **Applied** → "Applied on …"; **Awaiting
  refund** → NO subline (payout date unknown); Pending Refund → "Created on …"; settled → "Refunded on …".
- **Refund CN draft can Apply:** `canApply` now includes complete refund drafts (`isRefundDraft`), so a
  complete refund draft leads with **Apply to invoice** + Edit; incomplete → Edit only. (Shared component —
  applies to any complete refund draft, not just the demo.)

## Current state (2026-07-02)

All Block-1 sales-invoice stories are **built and working** on the dev server:

| Ticket | Story | State |
|---|---|---|
| DES-713 | Add Client (full page + in-invoice quick-add sheet, prefill-from-contact) | Built |
| DES-714 | Edit Client (edit mode of AddCustomerPage, dirty-gated, discard warning) | Built |
| DES-715 | Create Sale Invoice (draft → issue → limited edit → mark as paid) | Built |
| DES-716 | Upload Invoice (OCR demo, duplicate decision page, review card) | Built |
| DES-718 | Send Invoice (email / share link / PDF, validation, failure-retry) | Built |
| DES-719 | Create Credit Note (corrected-invoice model, cumulative, edit + re-send) | Built |
| DES-720 | Refund with Credit Note (money-based lifecycle, BA/manual payout, proof) | Built |
| DES-721 | View Credit Note (CreditNoteDetailPage, status-aware dock) | Built |
| DES-763 | Credit Notes List + Apply model (invoice-centric statuses) | Starter built |
| DES-764 | Invoice Settings (currency/payment-method/reminders wired into create) | Built |
| DES-766 | Manage Invoice List | Partially read — reconciliation with 713 pending |

**2026-07-02: repo refactored for maintainability (no behavior change), all flows re-verified**
(browser click-through + full typecheck). Structure and rules now live in CLAUDE.md — types in
`src/app/types.ts`, demo data in `src/app/data/`, helpers in `src/app/lib/`, the four big screens
in `src/app/components/{sales-invoice-list, add-invoice-details, credit-note-form, invoice-detail}/`.

**2026-07-14: design-system rebuild phase started** (low-fi prototype done; re-skinning from the
Figma "[APP] Design System", file `Lt9QLcfsxzo9gdTV8hbWgs`). Screens moved to `src/app/pages/`,
shared widgets stay in `src/app/components/`, DS components in `src/app/ui/` (folder per component,
tsx + module.css, tokens.css) with a review gallery at `/#showcase` (top bar + sidebar + per-component
Overview/Variants pages). Built so far: Toggle, Button, FAB, TabsBase, HorizontalTabs, Badge — all
screenshot-compared against Figma. Rolled out into the app: Toggle, Button (incl. inside
ButtonDock/EditCard; old `components/Buttons/` deleted), FAB (both create-invoice FABs). Not rolled
out yet: tabs (app has no tab UI), Badge (would replace the hand-rolled status-pill palettes —
awaiting the designer's call).

**2026-07-15: DS build continued** — added Tooltip, TextField (7 types + "Fields" wrapper),
Search, Loading, PageHeader, Tile, BottomSheet (presentational container; scrim/motion stays in
`components/BottomSheet.tsx` until flows migrate), OutstandingCard (dashboard hero, data-driven)
and InvoiceRow (composes ui/Badge) — each with a Showcase page. `components/ButtonDock` restyled
to the DS StickyButton (frosted gradient + blur, vertical stack: primary on top, full-width
outlined secondary below; all flows now stack). Later same day the frost was made real (user
decision): the old `overflow` prop became `sticky` — page docks now float absolutely over the
page's scroll area so content blurs through the backdrop-filter as it scrolls underneath; every
sticky page's scroll container gained bottom padding (pb-28 single / pb-44 double docks). Sheet
footers (BottomSheet `footer=`) stay in-flow and never pass `sticky`. CustomerDetail + AddCustomer
main docks became sticky in the same pass (they were page docks missing the old overflow flag). OutstandingCard rolled out into
Dashboard (hand-rolled hero deleted; new optional `onCollectedClick` prop keeps the Collected box →
Paid-list tap; peer note now hidden at 0% collected and no link when fully collected, per Figma;
verified in-browser across all 5 hero scenarios). Not rolled out yet:
Tooltip/TextField/Search/Loading/PageHeader
(showcase-only). Full component→Figma-node map + rollout state: memory `ds-rebuild-status`.
PageHeader first rollout: Add/Edit Customer now uses `PageHeader type="center"` (new
`showSearch={false}` option — hides the right button, 36px spacer keeps the title centered;
Showcase variant added) and the whole screen bg is Bg/Beige/primary (`--ds-bg-beige-primary`),
replacing the old SheetHeader + white bg. New FORM RULE (user, same day): form CTAs are always
enabled — clicking with missing required fields scrolls to the first invalid field and shows its
inline error (no disabled-CTA validity gating; edit-mode dirty-gating stays). Applied to Add/Edit
Customer first; other forms convert as they're touched. CountrySheet + CurrencySheet moved to the
DS sheet recipe (dsHeader grabber header, search-icon toggle reveals the DS Search field, DS Tile
rows with 26px flag + trailing check). Add/Edit Customer's "Discard changes?" confirm reworked
after UX review: dsHeader (no ✕ — the two buttons are the only answers), button hierarchy swapped
so the safe action is the filled primary (Keep Editing) and destructive Discard is the outline
secondary; both paths verified in-browser. Pattern then rolled out to every confirm sheet
(BottomSheet gained `compact` — tight body padding — and dsHeader sheets align content to the DS
16px side padding; confirm bodies are 16px text): Delete credit note? (CreditNoteDetailPage),
Delete this draft? (InvoiceDetailPage — dock also moved from body to footer + homeIndicator),
Delete Draft Invoice? (SalesInvoiceList), Cancel this schedule? (RecurringSeriesDetail, hierarchy
was already safe-primary), Send updated credit note? + Customer already exists (styling only —
their primaries are the intended actions, not destructive, so hierarchy kept). Nav fix: Menu
(hub) → "Sales Invoices" was still wired to the invoice LIST (pre-Dashboard leftover) — now opens
the Sales Invoices Dashboard, matching the IA (Dashboard = section landing, list hangs off it via
"View all"; list back → Dashboard; Dashboard back → Menu). CreateInvoiceSheet (the FAB's
create/upload chooser, shared by Dashboard + SalesInvoiceList) rebuilt on the shared BottomSheet
with dsHeader + DS Tile icon rows, replacing its hand-rolled sheet markup; per user, tiles are
title-only — "Build an invoice step by step" (+ icon) / "Scan and upload existing invoice"
(upload icon). ui/Tile gained `reserveTrailing={false}` (skips the reserved 30px trailing slot
when trailing="none", for action lists with long titles — keep the default in mixed lists) +
Showcase variant. CreateSalesInvoice (select-customer step) rebuilt to the user's Figma ref:
DS PageHeader type="center", title-only "Select Customer" (recurring flow keeps "New Recurring
Invoice" as the secondary line; back chevron closes). Body sits on the beige page bg —
"Frequently used" section (full DS Tile avatar rows now, the old avatar-chip strip is gone),
then "All customers" heading with the DS secondary "Add" button (UserPlus icon) on the right,
DS Search below the heading, then the rest of the list. Rows everywhere are ui/Tile
(initials avatar + name/email, onLayer="beige", brand border + check when selected). Old
components/Search + components/Tile no longer used here. ui/Tile also gained `avatarColor`
(pastel avatar tint, defaults to beige; Showcase "Avatar tints" variant added) — the picker
assigns one of 4 tints deterministically from the customer id so colors stay stable while
filtering. AddInvoiceDetails (invoice editor): SheetHeader → DS PageHeader type="center" (back
chevron keeps the old ✕/back semantics — create flows still save a draft on exit; the autosave
"Saving…/✓ Saved" chip moved into PageHeader's new `right` code slot — Showcase variant added),
body now sits on the beige page bg, and the customer card is a DS Tile (name/email,
onLayer="beige"; chevron + tap→picker when changeable, plain when locked in edit mode). ui/Tile
is imported there as DsTile (legacy components/Tile still drives the recurrence-frequency
sheet). Same pass: the empty "Add your services" row is a DS Tile (text + chevron → add-service
sheet); DueDateSheet got dsHeader + title "Select Due Date" with DS text Tiles (check on
selected; Custom Date field + calendar sheet unchanged, calendar sheet also dsHeader);
ReceivingAccountSheet got dsHeader + default title "Select Receiving Account" with DS country
Tiles (26px flag, account number as second line, bold "Primary" Badge on the primary account,
check on selected). ui/Tile gained a `badge` slot (inline after the title) and a `cornerBadge`
slot (badge pinned to the tile's top-right corner, radii reshaped to hug the card — the Figma
primary-account tile; Showcase variants added for both). ReceivingAccountSheet uses the corner
badge (Badge bold/custom gradient "Primary") on the primary account, keeps the separator line
after the Statrys list, and the old dashed "Use External Bank Account" button is now a DS Tile
"Use Other Bank Accounts" with chevron. The invoice editor no longer passes `hideExternal`, so
that entry shows there too; the refund flow can still pass `hideExternal`. The entry opens
components/BankInfoSheet — a "Bank Information" BOTTOM SHEET (card number, expiry+CVV row,
cardholder name; form-cta-validation pattern, CTA "Confirm"; components/BottomSheet's dsHeader
gained an optional `onBack` frosted back-chevron for nested sheets). Back returns to the
account sheet; Confirm lands on the editor with the Receiving Account row showing
"Visa (..last4)" from the entered card (editor state `externalCardLast4`; a Statrys pick clears
it; resets on reload — nothing stored). Corner-badge fix: pinned at 0/0 (inside the border-box)
with top-right + bottom-left radii = Radius/2xl so it hugs the card corner without gaps.
BEHAVIOR CHANGE (user, 15/Jul): ✕ on the Delivery method page now just closes the sheet back to
the (still pre-filled) editor — it no longer saves-draft-and-exits to the list with the "Saved
as draft" toast (autosave already holds the work). QuickNav: "Create Invoice" now jumps to the
pre-filled editor — DEMO_CUSTOMER + DEMO_EXTRACTION items seeded via App's dev-only
`devSeedItems` flag (cleared by the real picker flow so a genuine create still starts empty) —
instead of the customer picker, and "Sales Invoice List" clears any pending toast before
jumping. AddServicesSheet rebuilt to the Figma "Add Item" sheet: dsHeader (title "Add Item" /
"Edit Item"), Unit Price shows flag + currency prefix (from CURRENCIES), Quantity has the Unit
picker INLINE in the field ("Unit ⌄" opens the unit sheet — the separate Unit field is gone),
CTA always enabled per form-cta-validation (failed click → scroll to first invalid + inline
error). All 5 line fields still required (DES-817); sheet keeps SERVICE_SHEET_HEIGHT. UnitSheet matched
to the Figma ref: dsHeader with centered "Select Unit" title + back chevron (returns to Add
Item), DS text Tiles with check on the selection. UploadInvoice's "Add Existing Invoice" sheet
got dsHeader + DS Tile icon rows for the three sources (Take Photo / Choose from Photos /
Browse Files; error banner, file-rule rows, attached-file cards unchanged), and the read-only
ExistingInvoiceSheet (duplicate summary) got dsHeader too. Upload-review polish on the beige
editor bg: TextInput `highlight` (OCR-missing) no longer fills soft yellow (it blended into the
beige) — normal field bg, amber #f59e0b warning border only; UploadedFileCard (the
"invoice.pdf / Preview" chip) is white instead of #faf9f4; SummaryCard's Total row is white
(beige fill blended into the page). DiscountCard now uses the DS ui/Toggle (hand-rolled blue
switch deleted); DiscountModeSheet got dsHeader + DS Tiles (title + description, check on
selection). SalesInvoiceList converted to the DS: SheetHeader → PageHeader type="center"
(back chevron, `showSearch={false}`), the hand-rolled status chip row → DS HorizontalTabs
variant="button" (labels "Label (count)"; the keep-active-tab-scrolled-into-view effect now
queries `[role="tab"][aria-selected="true"]` inside a `tabsWrapRef` wrapper, and the thin
2px scrollbar CSS targets the DS scroller via `.tabs-wrap > div`); the "Delete Draft
Invoice?" confirm moved to the confirm-dialog pattern (dsHeader + compact, Cancel = filled
primary on top, Delete = outline secondary, 16px body). Verified headless (Playwright):
tabs filter correctly (Draft → 3 cards), swipe-reveal Delete → confirm sheet renders per
pattern, Cancel keeps the draft; no console errors beyond the pre-existing external-font
CDN failures.
Filters sheet: the **Partially refunded** refund-status chip was removed (user, 15/Jul) —
REFUND_FILTERS now lists only Pending Refund + Refunded; the `"partial"` value stays valid
in RefundFilter/refundState (still used by refundStateOf + detail rendering), just not
offered as a filter. InvoiceSettings redesigned to the Figma ref (user, 15/Jul) using
existing DS components: SheetHeader → PageHeader type="left" (big 32px "Invoice Settings"
title + subtitle "These settings apply to all new sales invoices", back chevron,
`showSearch={false}`); page bg is beige and the grouped cards are now solid white (was dashed
beige). The first card's avatar/name/email identity row is replaced by a plain "Company
Details" row (subtitle "Registration, phone, website and logo") — name/email are still edited
inside the Company Details sheet, which is unchanged. Payment Method row shows a two-line
trailing value (account name bold + full number below, via getAccount). Currency + Automatic
reminders rows unchanged. Removed now-unused imports (SheetHeader, ChevronLeft, formatAccount)
and the dead `errs` local. Company Details bottom sheet then reworked to its Figma ref (user,
15/Jul): now uses `dsHeader` (grabber + 28px "Company Details" title, no ✕); the logo section's
dashed upload box / uploaded-file card + Trash remove is replaced by a realistic demo logo
(new inline-SVG `DemoLogo`, CSP-safe — a teal-gradient rounded tile with a white double-chevron
studio mark; iterated per user from an initials monogram → sunburst → this chevron mark) next
to a camera **Change Logo** button (taps the same mock pickLogo). Fields (name, email,
registration, phone, website) + Save-changes dock unchanged. Dropped the old LogoMark helper +
UploadCloud/Trash2 imports. Send-email "Send me a copy" wiring (user, 15/Jul): the ReviewEmail
preview's Cc line now shows the **company email from Invoice Settings** instead of the old
hardcoded `apa@gmail.com` (MY_EMAIL const removed). ReviewEmail gained a `companyEmail` prop
(default "hello@lumenstudio.co" = DEFAULT_SETTINGS.email); threaded from App's `settings.email`
through AddInvoiceDetails, InvoiceDetailPage, and CreditNotesList → CreditNoteDetailPage so every
send flow's copy reflects the current settings email. SalesInvoiceList cards → DS InvoiceRow
(user, 15/Jul): sales-invoice-list/InvoiceCard was rewritten to render `ui/InvoiceRow` (size md)
instead of the hand-rolled dashed card + separate status pill. Per the user's reference the rows
render as a FLAT LIST directly on the white page (no card wrapper / no shadow / no per-row gaps —
first attempt wrapped them in a white DS card, corrected same day); rows draw their own dividers,
`lastItem` drops the final one. Status → Badge text-variant colour
map (rowStatus): Paid=success, Awaiting=warning, Overdue=error, PartiallyPaid=warning,
Draft/Void=neutral, refund states (Refunded=info, Pending/Partially Refunded=warning); the date
phrase is the Badge caption (leading "Paid "/"Void " stripped to avoid duplicating the chip). The
credit-note strip is InvoiceRow's `creditedAmount` slot (refund CNs pass creditedLabel="Refund
amount"). Draft swipe-to-delete + recent-arrival highlight preserved via a local DraftSwipeRow
wrapper + a highlight-bg wrapper. DS change: InvoiceRow gained `creditedLabel` (default "Credited
amount"; Showcase "Custom credited label (refund)" variant added). Verified headless across All /
Paid / Draft tabs incl. swipe-reveal Delete. The old lib/status STATUS_PILL is no longer used by
the list (still used elsewhere — left in place).
DS change: PageHeader type="left" now renders the optional `text` subtitle under the title (the
prop already existed; Showcase "Left align + text" variant added). Verified headless.
Status tabs trimmed (user, 15/Jul): the standalone **Overdue** and **Partially Paid** tabs
are removed — the set is now All Invoices / Draft / Awaiting / Paid / Void (back to the
DES-713 filter set). Overdue rows fold under **Awaiting** (an overdue invoice is Awaiting
past its due date — `matchStatus("Awaiting")` already covered this); Partially Paid rows fold
under **Paid** (user's call: any payment received belongs in Paid — `matchStatus("Paid")` now
also returns PartiallyPaid). Each card still shows its own status chip (Overdue / Partially
Paid), so the distinction is visible within the tab. Only `filters.ts` changed (FILTERS array +
matchStatus); counts, sort-key gating and due/refund-filter visibility all key off the same
FILTERS/matchStatus and adjusted automatically. Verified headless: 5 tabs, Awaiting shows the
Overdue chip + no partial, Paid leads with the partially-paid Verde Coffee row. This also
closes the DES-766 known gap below (the extra chips we'd added beyond the ticket).
ActionsMenu (invoice detail ⋯): "Add credit note" (Awaiting/Overdue) AND "Refund with Credit
Note" (Paid) recoloured from red to DS blue (`--ds-text-info-primary` #0051e8, icon + label);
only Delete draft keeps red. CreditNoteForm polish (user, 15/Jul): main
CTA (Apply to Invoice / Create Credit Note) is now ALWAYS enabled per form-cta-validation — a
failed click sets `attempted`, scrolls to the first invalid field (reason above items) and shows
its inline error (red border + message on the reason row; "credit can't be zero" note in the
items section; the exceeds-cap banner is unchanged). ReasonSheet converted to the DS sheet recipe
(dsHeader grabber + "Reason for credit" title, DS ui/Tile rows with trailing check); its Done CTA
stays disabled until a reason (+ description for "Other") is chosen (user reverted the always-on). The numeric keypad's "Full credit" /
"50%" quick-action chips were removed (accessory dropped → Done spans full width; the now-unused
applyLineShortcut/round2 helpers deleted). Verified headless.
Refund items now carry a Quantity control (user, 15/Jul): the Refund-with-Credit-Note page's
per-item card previously had only a free-text "Refund amount" input — it now uses the SAME
Quantity stepper + Unit price pair as credit mode, with the per-line Refund derived = qty × unit
price (capped at the line original). Model unified: refund lines seed at the FULL invoiced qty +
real per-unit price (so a line opens showing the full refundable amount — reduce qty/price for a
partial; user chose this over the initial qty-0 default, which read as "qty 0 / full price"),
`lineCredit` (refund) = min(qty×unitPrice, original); the old setLineRefund
helper + keypad refund-cap were removed (setUnitPrice/keypadPress now drive both modes). The
derived line reads "Refund" vs "Credited" by mode. Verified headless (stepping qty computes the
refund). CTA label: the refund form's primary now reads "Apply to Invoice" too (was "Create
Credit Note") — both create modes share the label; edit mode keeps Save changes / submitLabel.
Refund CN now has the same autosave/draft lifecycle as the cancellation CN (user, 15/Jul —
chose "Draft → Applied, keep payout"): the refund form shows the autosave Saving/✓ Saved chip
(`!isEdit` gate, was `!isEdit && !refund`); backing out saves a **Draft** refund CN
(`saveRefundDraft`, toast "Saved as draft"), and "Apply to Invoice" commits it → CN chip reads
**Applied** while the INVOICE moves to **Pending Refund**, with the payout step → Refunded left
intact. Implementation: `resumeDraft` routes Paid/refund-context drafts back to the refund form;
`applyRefundCreditNote` + `applyDraft` (Paid branch) clear the draft flag and set PendingRefund;
the refund-CN status derivation shows "Applied" (was "Pending Refund") for the committed-but-
unpaid state (CN detail + CreditsAppliedSection row chip). Disambiguation: on a Paid invoice all
draft CNs are refund drafts (cancellation drafts only exist on unpaid invoices). Verified headless
(form CTA + resume-then-apply both land Applied + Pending Refund). Refund per-line derived label
reads "Refund amount" (was "Refund"); the items badge reads "Full/Partial Refund" in refund mode
(was "…Credit"); refund lines default to the FULL invoiced qty (see above). RefundCreditNoteFlow
"Mark as Refunded" → Bank account used now lists the **Statrys accounts** (RECEIVING_ACCOUNTS,
flag + number, under a "Statrys accounts" heading) as well as the external accounts (under "Other
accounts") — previously external-only. Method step (user, 15/Jul): header renamed "Refund credit
note" → "Choose Refund Method"; the two options use DS ui/Tile; "Mark as Refunded" description →
"You refunded already". Record-refund step: "Bank account used" is a dropdown FIELD that opens a
BottomSheet ("Select Account", dsHeader) of DS ui/Tile rows grouped Statrys / Other accounts
(flag or 🏦, trailing check), defaulting to the primary Statrys account (Personal Saving); "What is a reference number?" became an inline accordion (rotating chevron,
explainer on a light panel) replacing the old dark auto-dismiss toast. Verified headless.

## Reading tickets

Preferred: the **Jira (Atlassian) connector** — fetch the issue directly ("fetch DES-XXX and save
it as markdown in ./tickets/"). If the connector isn't authenticated this session, ask the user to
run `/mcp` → "claude.ai Atlassian Rovo". Fallback: the ticket PDFs in `./tickets/` via `pypdf`
(`python3 -m pip install --quiet --user pypdf`; poppler and the Read tool's PDF render are
unavailable). FigJam exports in `./tickets/`: `Sales Invoices Details User Flows.pdf`
(authoritative for detail-page actions) and `Upload sales invoice flow.pdf`.

## Workflow rules (from the user)

- Build everything locally on the Vite dev server first; port to Figma Make at the very end
  (consolidate the file list then — skip per-change re-paste notes).
- Implement only what's asked / only the changed parts of a Figma frame.
- Stage changes only (`git add`) — the user commits/pushes themselves.

## Known gaps / next steps

- ~~**DES-766 reconciliation** with the DES-713 list spec: we'd added Overdue + Partially Paid
  chips beyond its filter set.~~ RESOLVED 15/Jul — both tabs removed; Overdue folds into
  Awaiting, Partially Paid into Paid (see session log). Tab set matches DES-713 again.
- **Per-invoice line items/emails are shared demo defaults** — every invoice detail opens with the
  same `ITEMS` (`invoice-detail/demoInvoice.ts`) and email regardless of which card opened it.
- **Needs Attention CTAs** (Confirm/Review/Remind) just open the invoice detail — no in-place
  resolve; `ATTENTION_TASKS` is static demo data.
- **Customer avatars** removed app-wide (temporary — restore once the invoice-number layout is
  confirmed).
- **Refund Phase 3 polish:** "awaiting refund" list filter, richer Pending/Refunded detail
  rendering; BA transfer execution stays a stub.
- **AC6 (DES-713) save-failure recovery** unbuilt.
- Real per-customer invoice link (list ↔ customer detail is name-match, demo-only).
- Final step before Figma Make port: consolidate the file list (`index.html`, `src/main.tsx` are
  local-only scaffolding, not needed in Make).

## Open decisions (pending Beatrice) — details in `./open-questions.md`

- Lock a credit note once SENT? (today: editable + re-send prompt per DES-719 AC4; refund side
  already locks after payout — confirm whether to unify).
- Edit an issued invoice → auto-resend or ask? (today: Save just returns, no resend).
- Provisional number on drafts (today: DF-… display number only). For CREDIT NOTES this is decided
  (user, 15/Jul): NO number while creating a CN and none on a Draft CN's detail — the form header
  reads "New Credit Note"/"Refund with Credit Note" and draft details read "Credit Note"/"Refund
  Credit Note"; the CN-… number appears once the note is applied.
- Zip required for no-postal countries (we hide it for Hong Kong, diverging from the ticket).
- Invoice-number format resolved → **6-digit** (DES-764, 27/Jun); 5-vs-6 conflict closed.

## Design tokens

INK `#1b1b1b`, secondary `#808080`, brand orange `#ff4a15`, beige `#f9f5ea`/`#faf9f4`,
success green `#006a1d`/`#ebfcef`/`#a3e9b6`, AI violet `#7c3aed`/`#f6f1ff`, amber attention
`#fffbeb`/`#fde68a`/`#b45309`. `FONT`/`INK`/`MUTED` come from `src/app/lib/theme.ts` — never
re-declare them per file.

## Hard-won gotchas (keep)

- **Flex cards vanishing:** a flex item with `overflow:hidden` gets `min-height:0` — in scrollable
  `flex flex-col` lists cards can shrink to 0 height. Fix: `shrink-0` on every card. Check this
  FIRST if cards vanish/overlap.
- **Tailwind class concatenation:** a missing space once produced `py-4flex`, silently dropping
  padding — eyeball concatenated className strings.
- Framer `drag` renders blank inside `overflow-hidden` wrappers — swipe gestures use plain pointer
  events + CSS `translateX` instead.
- The curl transform-check is transform-only — it does NOT catch runtime ReferenceErrors; grep
  that new imports exist, and click through the flow.
- `pnpm build` fails locally (pnpm v11 build-scripts gate) — use `./node_modules/.bin/vite build`.
