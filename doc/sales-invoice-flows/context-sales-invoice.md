# Sales Invoice Flows — Current Handoff

Read this first when continuing sales-invoice work. **Keep this file under ~150 lines:** it holds
only the CURRENT state and next steps — overwrite/trim it each session. Dated narratives go to
`./history/session-log.md`; the full invoice-detail/credit-note/refund spec is
`./invoice-detail-behavior.md`; repo map + conventions + run/verify commands are **CLAUDE.md**.

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

- **DES-766 reconciliation** with the DES-713 list spec still pending (we added Overdue +
  Partially Paid chips beyond its filter set — flag to Beatrice).
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
- Provisional number on drafts (today: DF-… display number only).
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
