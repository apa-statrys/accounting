# Invoice detail page — full behavior spec (DES-715/716/718/719/720/721)

> Moved out of CLAUDE.md on 2026-07-02 (repo refactor). Behavior described here is CURRENT and
> decided — don't re-litigate. Component paths were updated for the refactored layout: the page
> lives in `src/app/components/invoice-detail/InvoiceDetailPage.tsx` with its pieces as siblings
> (`CreditsAppliedSection`, `ActionsMenu`, `RecordPaymentSheet`, `SendCnSheets`, `demoInvoice.ts`,
> `creditNoteTypes.ts`, `InfoBits.tsx`).

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
  **`Refunded`** added to `DetailStatus`+`DETAIL_STATUS_META`; status path **Paid → Pending Refund → Refunded**.
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
  - **List card (refund/CN, `sales-invoice-list/`):** every invoice with a credit note shows **invoice total**
    on top + status pill, then a divider + a tappable **credit-note summary row** (doc icon + "N Credit Note(s)"
    + amount + "View ›" → `onOpenCN`). Amount label = **"Refund amount"** for refund CNs (pending/partial/refunded),
    else **"Credited amount"**. Pills: Refunded = indigo, Partially Refunded / Refund Pending = amber. The old
    small "Credit Note ›" badge was removed. **Refund Status filter** (multi-select checkbox rows, gated to All /
    Paid view): Refund Pending / Partially refunded / Refunded. Customer filter = **sticky header** with count +
    inline search-icon toggle (collapses on scroll/blur; clear-X inside the `Search` input).
  - **Demo invoices (all Paid, open as refund-context):** **INV-2026-000011 Cobalt** (CN-2026-000004 −$1,200,
    partial of $6,450), **INV-2026-000013 Meridian** (CN-2026-000006 −$3,200), **INV-2026-000015 Solstice**
    (CN-2026-000007 −$6,450, full). Their CNs seeded `Pending Refund` in `src/app/data/creditNotes.ts`.
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
  `src/app/data/receivingAccounts.ts` `RECEIVING_ACCOUNTS`.
- **Invoice number**: hidden on created drafts (assigned on issue, DES-715); shown for uploaded
  drafts (user/OCR value) and all issued. Format **`INV-YYYY-NNNNNN`** (6-digit, from `000001`) —
  resolved per DES-764 (updated 27/Jun/26): the field-spec table's 6-digit `######` wins over the
  earlier 5-digit. **Credit-note numbers are also 6-digit** (`CN-YYYY-NNNNNN`, per DES-719 update 28/Jun).
- **Detail page headers = the document number (2026-07-01):** every detail page shows its NUMBER as the
  `SheetHeader` title (not a generic word). Invoice detail → the **INV number** when issued; a **draft** has
  no INV yet, so it shows a separate **DF number** (`DF-YYYY-NNNNNN`, `headerTitle` derives it by swapping the
  `INV` prefix — real separate draft sequence = backend). Credit-note detail → the **CN number**; its **type
  badge was removed** (type now reads as a muted subline "Credit note / Refund credit note · Issued …").
