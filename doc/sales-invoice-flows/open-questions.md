# Sales Invoice Flows — Open Questions & Session Status

_Compiled 2026-07-02. Companion to `CLAUDE.md` (which holds the built architecture/decisions).
This file = open questions for stakeholders + pending build items + session decisions._

---

## 🔴 Stakeholder decisions needed (blocking / diverges from ticket)

### Customers (DES-713 / 714)
1. **Zip/Postal Code** — ticket says **Required**; we hide it for **Hong Kong** (no postal). Follow ticket literally, or keep hidden-for-no-postal? (implemented: hidden for HK)
2. **Customer detail page** — 713/714 spec **no view page** (714 = Client List → pre-filled Edit form). We built a **detail page (Option B)** — keep it (needs its own story?), or go ticket-literal (tap → Edit)?
3. **In-invoice quick-add scope** — invoice-flow add = **Company + Email only** vs full form? (parked, pending confirm — currently the full sheet w/ optional expander)
4. **Delete/Archive client** — **out of scope** both tickets, no story. Recommend **Archive-not-delete** as a new story (referential integrity, shared payment-contacts record, retention). Confirm direction.
5. **Currency picker "prioritise held currencies"** — needs data source (client's BA account currencies?). Not built.

### Create Sale Invoices
6. **Customer info source / min-to-send** — confirm min fields to issue+send to a one-off external client (name+email, or address required on the doc?).
7. **Future issue dates** — allowed? cap? (currently no limit)
8. **Due date horizon** — max months ahead? (currently no cap)
9. **Supported currency list** 🔴 — no authoritative list in tickets. Picker supports **only USD/SGD/HKD**, but records/contacts reference EUR/GBP/AUD/JPY. **Need the finance/product list.** (We added FX rates for all 7 so demo math is correct.)
10. **External (non-Statrys) bank account** — supported? If saved → needs "Manage payment accounts" in Settings; if one-time → inline. (764 only specs Statrys accounts.)
11. **Default email content** — what's saved (recipients/cc/template) + **need approved email copy** (currently placeholder).
12. **Draft number** — confirm the **DF-YYYY-NNNNNN** on drafts + INV on issue (built).

### Credit Note
13. **CN client editable?** 🔴 conflict — **719 = editable** on CN; **763/721 = read-only** (edit on client record). We follow 719.
14. **CN status model** 🔴 conflict — **719 = auto-apply on create**; **763 = created Open, manual "Apply to invoice"**. We built **763 two-step + INVOICE-CENTRIC status** (Partially Applied while credit < invoice total; Fully Applied when = total). Confirm this supersedes 719.
15. **Lock CN once sent?** — 719 AC4 keeps a sent CN editable (+ re-send prompt). Proposed stricter: editable only while unsent. Open.
16. **BA transfer flow** — needs a **separate ticket** (Statrys BA transfer incl. fee → back to accounting). Currently stubbed/out of scope. Recommend: yes, new ticket.
17. **Partial refund definition** 🔴 — two dimensions: (a) credit < invoice (partial *credit*, supported via cumulative CNs), (b) payout < CN (partial *payout* of one CN, **NOT supported** — manual amount is read-only). Define which "partial refund" means.

### Upload / Scan — duplicate detection (DES-716)
18. **Match criteria** — number-only (current) vs number+client+amount; exact vs fuzzy.
19. **Match against non-drafts** — we only check drafts; what actions when the match is an issued/paid invoice (our decision page assumes a draft)?
20. **No-number case** — OCR often can't read a number → fall back to client+amount+date?
21. Confirm **"warn, allow override"** = our Edit Existing / Create New model.

### Cross-cutting (raised by us)
22. **Tax / VAT / GST** 🔴 — in scope? Tickets reference VAT; HK demo has none (764 shows no tax row). EU/UK need VAT lines.
23. **Gapless sequential numbering** 🔴 — legal in many jurisdictions. Does delete-draft / void leave gaps?
24. **Overpayment outcome** — `> total` flags "overpayment for review" — then refund/credit/ignore?
25. **Multiple partial payments** — only one "mark as paid" today. Payment history needed?
26. **FX rate source & as-of date** 🔴 — item→invoice→functional conversion: where do rates come from, locked at issue?
27. **Roles / permissions & approval** 🔴 — client (mobile) vs Operation Manager (web); issue-approval workflow? Confirm out of scope for mobile.
28. **Cancel an issued invoice without a credit note?** — every cancellation currently goes via a CN.
29. **Missing "View Client" story** (DES-721 exists for CNs, none for clients).
30. Hosted **payment link** (real page? expiry? auth?), channels beyond email/link/PDF, invoice attachments (PO/contract), refund-proof file constraints, phone masking on display.

---

## 🟡 Pending build items (this session, not yet done)

- **713 AC6** — save-failure recovery (dropped for now, per request).
- **Trim in-invoice quick-add** to company+email (parked, pending confirm).
- **Currency-dropdown prioritization** (needs supported-currency list).
- **DES-714 propagation matrix / concurrent-edit** — backend, out of scope.
- **Refund-done dock** — still "Send/Resend Credit Note"; by the "invoice detail = invoice actions" rule it should become **"Send invoice"** (like the pending refund dock). **Confirm.**
- **Sales Invoice list CN preview dock** — Open + Partially Applied show **Preview only** (no Apply/Edit wired) — the last cross-entry CN-detail inconsistency. Wire Apply/Edit there?
- **Register CN line items** — list/register CN details **synthesize** a single line ("$credit of $invoiceTotal") for the Credited-items card; real per-line names only on the invoice entry.
- **Seed currencies** — every demo client now has a currency (Marlow=SGD, Northwind/Halcyon/Quill=GBP, Meridian/Verde/Otto=EUR, Saffron=HKD, others USD). Trim if too noisy.
- **Dashboard restyle (Figma 757:10561)** — done: "ACTION REQUIRED" label. TODO: header bell-in-tile + red dot (drop settings gear), Outstanding "View All" = solid orange pill, confirm REVIEW black pills, "Expected this month HKD" big number.
- **Reminders schedule data** — `reminders`/`REMINDER_DEFS` left as dead code after simplifying to on/off toggle; strip fully if desired.

---

## ✅ Key decisions locked this session (also in CLAUDE.md)

- **Customers feature** built (DES-713/714): full-page Add Client (required Company/Email/Address/City/Zip/Country), AC2 prefill-from-payment-contact, edit mode + unsaved-changes discard warning, detail page (full record + invoices), **unified customer register** in App, **invoice-link by stable id** (rename-safe), Customers list restyled to the Select-Customer style (search + all-customers tiles, single "All Customers (N)" heading).
- **Customer currency → invoice currency** seed precedence: OCR → edit-seed → customer default → Settings.
- **CN detail states aligned to Figma** across all entry points: Open (721:4579), Partially Applied (722:4582), Fully Applied (729:4672), Cancelled (729:4954 — **kept as a record**, not deleted), Refund pending / Partially Refunded (731:4752). Uniform "&lt;verb&gt; on &lt;date&gt;" subline; Credited/Refund items with `$X of $original`; **Applied/Cancelled/settled-refund have NO ⋯ menu**; Open/Cancelled summary = "(Not Applied Yet)" + Amount Due = full invoice.
- **Edit an applied CN re-applies** (CTA "Apply to Invoice"); **#2 over-credit fix** (creditRoom = committed, not applied); **#3 PartiallyPaid credit-noteable**; **#4 Open notes never sendable**.
- **Invoice detail (Awaiting + CN, 696:4595)**: CN-row status as a **colored chip** + "Reason:", header "$X credited from $total" (once), dock **Send invoice + Mark as paid** (invoice actions only). **Open/not-applied credit does NOT show a summary line** (only the Credits Applied card) — decided the "(Not Applied Yet)" summary row was redundant/confusing.
- **Refund-pending invoice detail (696:5495)**: Refund Pending tag, dock **Send invoice + Continue Refund**.
- **Email preview** brand bar uses the **Settings company** (monogram + name), not Statrys.
- **Upload Browse-Files** demo → OCR can't read customer name+email → both fields warning-highlighted + "Cannot extract" + **Save-to-list checkbox shows only after both filled**.
- **Automatic reminders** = simple on/off toggle (removed the schedule sub-page).
- **Try-again failure state** dropped from create-credit-note.
- **Invoice terminal status label = "Void"** (decided 2026-07-03) 🔴 ticket conflict: **DES-715** status matrix uses **Void**; **DES-719** had briefly renamed it to **Cancelled**. Reverted the *displayed* label to **Void** across the invoice side (list pill, detail pill, filter chip, card subtitles, customer-detail invoice rows). **Internal status key stays `Cancelled`** (unchanged in code/data) and the **credit-note "Cancelled" status (DES-763) is untouched** — different concept. Confirm with Beatrice that Void is the canonical wording.

---

_All work builds clean (`vite build`, 2693 modules). No `tsc` in project — build is the verification._
