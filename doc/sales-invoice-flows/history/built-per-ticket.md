# Built per ticket — Create (DES-715) / Upload (DES-716) / Send (DES-718) + screen history

> Moved out of CLAUDE.md on 2026-07-02 (repo refactor). Behavior is current and decided.
> The credit-note stories (DES-719/720/721/763) are specced in `../invoice-detail-behavior.md`.

## Built per ticket

- **715**: create/fill draft, delete draft, issue→Awaiting (number locked + validation gate),
  limited edit, **Mark as paid** (amount sheet) → Paid/Partially/overpayment, Cancel w/ Credit Note.
- **716**: upload + type/size validation, OCR→Draft prefill. **Exact duplicate (number matches an
  existing DRAFT) → `DuplicateDecision` page** (summary + preview + **Edit Existing Draft** / **Create
  New Invoice**) BEFORE the editor. **OCR-missing case** → editor with a top **"N out of M extracted.
  Please review before creating"** card, customer/email inputs (email warning + "Cannot extract the
  information" + "Save <name> to my customer list" checkbox). **Any upload "Create Invoice" →
  invoice detail page (Awaiting Payment)** with an "Invoice created successfully" flash (not the list).
  **`UploadInvoice` ("Add Existing Invoice") opens straight into the 3 source rows** (no dropzone /
  no sub-sheet): **Take Photo / Choose from Photos / Browse Files**, with a centered **"PDF, JPG,
  PNG · up to 10 MB"** caption. **Take Photo → `ScanDocument` camera+scan demo** → adds a photo;
  picking any source → file shown with remove + **Continue**.
- **718**: 3 send methods, email prefill/edit/multi-recipient/**"Send me a copy"**/save-default,
  **recipient validation**, structured email content + payment reference, delivery-failure/retry,
  shareable link (**"Mark as sent"** CTA — always enabled; copy/share/close alone never marks sent),
  Preview as PDF / download.

## Screen history (app shell)

- **AccountingHub.tsx** / **FinanceBottomNav.tsx** — the finance-app Menu hub. Was removed as the landing
  2026-06-24; **re-added 2026-06-30 as a reachable Menu** (NOT the landing — Dashboard stays root). Opened
  from the Dashboard's **top-left grid icon** (`onMenu` → `hub` screen); has a back arrow → dashboard.
  Modelled on Qonto's invoicing section, grouped by money direction: **Sales** = Sales Invoices (→`list`),
  **Credit Notes** (→`creditNotes`, DES-763), **Customers** (→`customers`, DES-713/714); **Purchases** =
  Purchase Invoices (Soon).
- **CreditNotesList.tsx** (`creditNotes` screen, **DES-763 — starter**) — the central credit-notes register,
  a **separate view from the invoice list** (Qonto model). Cards: CN number + **status pill** + customer ·
  related invoice + original amount. **Status model = DES-763 CN Status Rules (finalised 2026-07-01):**
  cancellation CN → **Open → Partially Applied → Fully Applied** (+ Cancelled if voided); refund CN →
  **Pending Refund / Refunded**. `CreditNote` carries **`kind`**, **`applied`** (Remaining = original −
  applied), + `sent` (a secondary send indicator, NOT the status). Filters = All / Open / Partially Applied /
  Fully Applied / Pending Refund / Refunded. Tap → **`CreditNoteDetailPage`** (DES-721), not the raw PDF.
  **CN summary row on the Sales Invoice List (AC6)** → same CN detail. Shared demo data in
  **`src/app/data/creditNotes.ts`** (`CREDIT_NOTES`). **TODO:** real Apply-to-invoice from the LIST;
  invoice-nav from the list's CN detail (Related-invoice card is static there).
- **Dashboard.tsx** — Sales dashboard (Figma 484:4564), the landing screen. **Hero = two glassy sub-cards**:
  Collected (border + blur, green `#58c67f` %, gradient progress bar, peer note) and Outstanding (bg-white/10
  + blur, overdue line, outlined **View All** → Outstanding list). **Top-left grid icon** (`onMenu`) opens
  the Accounting Hub menu; header bell **+ Settings gear** (`onSettings` → `settings` screen, DES-764).
  **Recent Invoices = 5 rows + a "View all invoices" button.** **NEEDS ATTENTION** preview stack;
  **"View All" only when > 2** → `needAttention`.
- **NeedAttention.tsx** — dedicated "Needs Attention" screen. Cards = cream `#faf9f4` + **solid** border
  + **black CTA pill** (the dashboard stack matches). `ATTENTION_TASKS` (now `src/app/data/attentionTasks.ts`)
  is the single source of truth for the dashboard count + stack. Types: payment-match / extracted / overdue /
  duplicate / overpayment; tap a card/CTA → that invoice's detail. Helper text: "N items require action.
  Open an item to resolve it."
- **CreateSalesInvoice.tsx** customer page — **Frequently used = row of 5 circular initial avatars**
  (orange when selected); **OTHERS** below as `Tile` rows; search → one flat RESULTS list.
- **Sales Invoice List** (`src/app/components/sales-invoice-list/`) — list; cards tappable → detail; one
  demo draft is `origin:"uploaded"` (INV-2026-00002), INV-2026-00003 is a created draft. Card meta: invoice
  number medium-weight, due/paid date regular (overdue 600 red). **Customer avatars removed app-wide**
  (temporary, pending invoice-number layout confirmation). **Partially Paid tab (added 2026-07-01 — EXTENDS
  DES-766):** the `Status` type + `STATUS_PILL` + a **"Partially Paid"** filter chip (amber pill), plus a
  demo **INV-2026-000014 (Verde Coffee Roasters, PartiallyPaid — $4,000 of $6,450, $2,450 due)** → tapping
  opens the detail as PartiallyPaid. **NB: DES-766 does NOT list Partially Paid** (its status filters are
  Draft/Awaiting Payment/Paid/Cancelled; Overdue is a summary tile, not a filter — we added both the Overdue
  and Partially Paid chips ourselves). `CustomerDetailPage`'s local pill map also got the PartiallyPaid key.
