import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, ChevronRight } from "lucide-react";
import { QuickNavSidebar, type SidebarGroup } from "./components/QuickNavSidebar";
import { Dashboard } from "./pages/Dashboard";
import { AccountingHub } from "./pages/AccountingHub";
import { CreditNotesList } from "./pages/CreditNotesList";
import { CustomerList } from "./pages/CustomerList";
import { CustomerDetailPage } from "./pages/CustomerDetailPage";
import { AddCustomerPage } from "./pages/AddCustomerPage";
import { CREDIT_NOTES } from "./data/creditNotes";
import { INVOICES } from "./data/invoices";
import { FONT } from "./lib/theme";
import { InvoiceDetailPage } from "./pages/invoice-detail/InvoiceDetailPage";
import { CreditNoteForm } from "./pages/credit-note-form/CreditNoteForm";
import { CreateSalesInvoice } from "./pages/CreateSalesInvoice";
import { RecurringSeriesDetail } from "./pages/RecurringSeriesDetail";
import { AddInvoiceDetails } from "./pages/add-invoice-details/AddInvoiceDetails";
import { SalesInvoiceList } from "./pages/sales-invoice-list/SalesInvoiceList";
import { NeedAttention } from "./pages/NeedAttention";
import { DuplicateDecision } from "./pages/DuplicateDecision";
import { UploadInvoice } from "./pages/UploadInvoice";
import { InvoiceSettings } from "./pages/InvoiceSettings";
import { GeneratingInvoice } from "./pages/GeneratingInvoice";
import { DEMO_EXTRACTION, DEMO_EXTRACTION_MATCHED, DEMO_EXTRACTION_NO_CUSTOMER, BLANK_EXTRACTION, EXISTING_INVOICES } from "./data/extraction";
import { CUSTOMERS } from "./data/customers";
import { DEFAULT_SETTINGS } from "./data/settings";
import { HERO_SCENARIOS } from "./data/heroScenarios";
import type { Screen, Customer, DetailStatus, InvoiceEditSeed, InvoiceLine, CompanySettings, ExtractedInvoice, ExistingInvoice, ServiceLine } from "./types";

/** OCR steps shown while an uploaded invoice is being read. */
const OCR_STEPS = [
  "Uploading your document…",
  "Reading the invoice…",
  "Extracting line items…",
  "Almost done…",
];

/** Top-level navigation, grouped by product area. */
const NAV_GROUPS: { heading: string; items: { id: Screen; label: string }[] }[] = [
  {
    heading: "Sales Invoice",
    items: [
      { id: "hub", label: "Menu (Hub)" },
      { id: "dashboard", label: "Dashboard" },
      { id: "list", label: "Invoice List" },
      { id: "customers", label: "Customers List" },
      { id: "send", label: "Send Sheet" },
      { id: "duplicateCheck", label: "Duplicate Found (Awaiting)" },
    ],
  },
  {
    heading: "Sales Credit Notes",
    items: [
      { id: "creditNotes", label: "Credit Notes List" },
      { id: "creditNote", label: "Sales Credit Note" },
      { id: "refundCreditNote", label: "Sales Refund Credit Notes" },
    ],
  },
];

/** Demo line items used when editing the recurring series (DES-782) — one monthly retainer line. */
const RECURRING_SERIES_ITEMS: ServiceLine[] = [
  { id: "rs-1", name: "Monthly retainer", currency: "USD", unit: "Month", quantity: 1, unitPrice: 6450 },
];

/** Demo line items + invoice context for previewing the standalone Credit Note form. */
const CREDIT_NOTE_ITEMS: InvoiceLine[] = [
  { name: "Brand identity design", qty: 1, unit: "service", unitPrice: 4200, amount: 4200 },
  { name: "Landing page build", qty: 1, unit: "service", unitPrice: 1800, amount: 1800 },
  { name: "Consulting", qty: 6, unit: "hours", unitPrice: 75, amount: 450 },
];
const CREDIT_NOTE_TOTAL = 6450;

/** Demo customer + line items for previewing the Send (Delivery method) sheet directly. */
const DEMO_CUSTOMER: Customer = { id: "marlow", name: "Marlow & Finch Studio", email: "finch@studio.com" };

/** Map a screen to its top-level nav section (customer + details = the create flow). */
function navFor(screen: Screen): Screen {
  return screen === "details" ? "customer" : screen;
}

/** Screens shown in QuickNav on prod (any build). Localhost (import.meta.env.DEV) shows all. */
const QUICKNAV_PROD_SCREENS: Screen[] = ["hub", "dashboard", "list", "creditNotes"];

/** Floating menu (bottom-left) that jumps between sections. Full list on localhost; a curated subset
 *  (Menu Hub / Dashboard / Invoice List / Credit Notes List) on prod. */
function QuickNav({ current, onChange, scenario, onScenario }: { current: Screen; onChange: (s: Screen) => void; scenario: number; onScenario: (i: number) => void }) {
  const [open, setOpen] = useState(false);
  const active = navFor(current);
  // On prod, filter each group to the allowed screens and drop groups left empty.
  const groups = NAV_GROUPS
    .map((g) => ({ ...g, items: g.items.filter((it) => import.meta.env.DEV || QUICKNAV_PROD_SCREENS.includes(it.id)) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-3">
      {/* Expanding navigation panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            style={{ transformOrigin: "0% 100%" }}
            className="w-[300px] bg-white rounded-3xl shadow-2xl border border-black/5 max-h-[72vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="px-4 pt-4 pb-3 border-b border-gray-100 sticky top-0 bg-white z-10">
              <p className="text-[18px] font-bold tracking-[-0.3px] text-[#1b1b1b]">Quick Navigation</p>
              <p className="text-[13px] text-gray-500 mt-0.5">For internal testing</p>
            </div>

            <div className="p-2 flex flex-col gap-3">
              {groups.map((group) => (
                <div key={group.heading} className="flex flex-col gap-1.5">
                  <p className="px-2 pt-1 text-[11px] font-bold uppercase tracking-wide text-gray-400">{group.heading}</p>
                  {group.items.map((page) => {
                    const isActive = active === page.id;
                    return (
                      <div key={page.id} className="flex flex-col gap-1.5">
                        <button
                          onClick={() => {
                            if (page.id === "dashboard") onScenario(0);
                            onChange(page.id);
                            setOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors border ${
                            isActive
                              ? "bg-gradient-to-r from-[#f24e63] to-[#ff6a1a] border-transparent text-white shadow-sm"
                              : "bg-[#faf9f4] border-black/[0.06] hover:bg-gray-100"
                          }`}
                        >
                          <span className="flex-1 min-w-0">
                            <span className={`block text-[14px] font-bold leading-tight ${isActive ? "text-white" : "text-[#1b1b1b]"}`}>{page.label}</span>
                          </span>
                          <ChevronRight size={18} className={isActive ? "text-white shrink-0" : "text-gray-400 shrink-0"} />
                        </button>

                        {/* Dashboard hero demo states — nested under Dashboard (dev/localhost only). */}
                        {import.meta.env.DEV && page.id === "dashboard" && (
                          <div className="ml-4 flex flex-col gap-0.5 border-l border-gray-200 pl-2">
                            {HERO_SCENARIOS.map((s, i) => (
                              <button
                                key={s.label}
                                onClick={() => { onScenario(i); onChange("dashboard"); setOpen(false); }}
                                className={`pl-3 py-1.5 rounded-lg text-left text-[12px] font-medium transition-colors ${
                                  active === "dashboard" && scenario === i
                                    ? "text-[#ff4a15]"
                                    : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                                }`}
                              >
                                {s.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menu FAB */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close navigation" : "Open navigation"}
        className="w-12 h-12 rounded-full bg-[#1B1B1B] text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
      >
        <motion.span animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.2 }}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </motion.span>
      </button>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [extracted, setExtracted] = useState<ExtractedInvoice | null>(null);
  // Dev-only: QuickNav "Create Invoice" seeds demo items so the editor lands fully pre-filled.
  const [devSeedItems, setDevSeedItems] = useState(false);
  // Extraction queued while the OCR screen plays (chosen from the upload source).
  // null = OCR found nothing usable (routes to the extract-failed screen).
  const [pendingExtraction, setPendingExtraction] = useState<ExtractedInvoice | null>(DEMO_EXTRACTION);
  // Toast shown on the list after returning from the create flow.
  const [toast, setToast] = useState<{ title: string; subtext?: string } | null>(null);
  // Freshly created/saved invoice to surface + highlight at the top of the list.
  const [recent, setRecent] = useState<{ client: string; amount: string; status: "Awaiting" | "Draft" | "Paid"; meta: string; recurring?: boolean } | null>(null);
  // The invoice opened into the detail page (status drives the lifecycle UI).
  const [openInvoice, setOpenInvoice] = useState<{ number: string; client: string; status: DetailStatus; origin: "created" | "uploaded"; cnNo?: string; cnAmount?: number; cnSent?: boolean; cnDraft?: boolean; cnAwaiting?: boolean; recurring?: boolean; viewCn?: boolean }>({
    number: "INV-2026-000042",
    client: "Marlow & Finch Studio",
    status: "Awaiting",
    origin: "created",
  });
  // Refund outcomes recorded in-session (DES-720), keyed by invoice number → "partial" | "full". Lets the
  // detail page's refund sync to the invoice list (Partially Refunded / Refunded) and the credit-note list.
  // Seeded so a fully-Refunded invoice card shows under Paid on load (INV-…013 Meridian, full refund CN
  // CN-…006). refundState is in-session; a reload resets it to just this seed (expected prototype limit).
  const [refundState, setRefundState] = useState<Record<string, "partial" | "full">>({ "INV-2026-000013": "full" });
  // The client register (DES-713) — owned here so the full-page Add Client form can append to it.
  const [customers, setCustomers] = useState<Customer[]>(CUSTOMERS);
  // One-off success confirmation shown on the Customers list after a client is added (AC5).
  const [customerFlash, setCustomerFlash] = useState<string | null>(null);
  // The customer whose detail page (DES-714) is open, reached from the Customers list.
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  // Prefill payload when editing an existing invoice (null = fresh create flow).
  const [editInitial, setEditInitial] = useState<InvoiceEditSeed | null>(null);
  // The file picked in the upload flow — shown as an attachment on the review screen.
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null);
  // The actual File objects picked in the upload sheet — kept so Back from a later step can
  // re-open the upload sheet with the user's file still attached.
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  // Account-level invoice settings (DES-764) — default currency seeds the create flow.
  const [settings, setSettings] = useState<CompanySettings>(DEFAULT_SETTINGS);
  // The existing draft an upload matched — drives the duplicate decision page.
  const [dupExisting, setDupExisting] = useState<ExistingInvoice | null>(null);
  // True only on the duplicate-flow "Create new" path → the editor shows a "Recommended" number hint.
  const [numberRecommended, setNumberRecommended] = useState(false);
  // True only on the duplicate-flow "Edit existing draft" path → editor ✕ saves draft → list.
  const [editFromDuplicate, setEditFromDuplicate] = useState(false);
  // One-off toast to flash on the detail page (e.g. after an edit-save).
  const [detailFlash, setDetailFlash] = useState<string | null>(null);
  // Where the detail page's back button returns (the screen it was opened from).
  const [detailReturn, setDetailReturn] = useState<Screen>("list");
  // The screen the upload sheet is presented over (shown dimmed behind it).
  const [uploadReturn, setUploadReturn] = useState<"dashboard" | "list">("list");
  // Recurring-series create flow (DES-782) — reuses the customer → details flow with a schedule.
  const [recurring, setRecurring] = useState(false);
  // Series status for the opened recurring invoice — shared by the invoice detail card + series page.
  const [seriesStatus, setSeriesStatus] = useState<"Active" | "Paused" | "Cancelled">("Active");
  // Which demo log the series detail shows — set when the series is opened. "draft" = a fresh series,
  // nothing sent yet (>3 rows → accordion); "midrun" = one paid, one awaiting, one still scheduled.
  const [seriesScenario, setSeriesScenario] = useState<"draft" | "midrun" | "completed">("midrun");
  const seriesInvoices = seriesScenario === "draft"
    ? [
        { number: "series-1", label: "Next Invoice", date: "01 Jul 2026", status: "Draft" as DetailStatus, kind: "scheduled" as const },
        { number: "series-2", label: "Invoice #2", date: "01 Aug 2026", status: "Draft" as DetailStatus, kind: "scheduled" as const },
        { number: "series-3", label: "Invoice #3", date: "01 Sep 2026", status: "Draft" as DetailStatus, kind: "scheduled" as const },
        { number: "series-4", label: "Invoice #4", date: "01 Oct 2026", status: "Draft" as DetailStatus, kind: "scheduled" as const },
        { number: "series-5", label: "Invoice #5", date: "01 Nov 2026", status: "Draft" as DetailStatus, kind: "scheduled" as const },
      ]
    : seriesScenario === "completed"
    ? [
        // A finished series (end condition reached) — every scheduled date generated, nothing pending.
        { number: "INV-2026-000021", label: "INV-2026-000021", date: "01 Mar 2026", status: "Paid" as DetailStatus, kind: "paid" as const },
        { number: "INV-2026-000022", label: "INV-2026-000022", date: "01 Apr 2026", status: "Paid" as DetailStatus, kind: "paid" as const },
        { number: "INV-2026-000023", label: "INV-2026-000023", date: "01 May 2026", status: "Paid" as DetailStatus, kind: "paid" as const },
      ]
    : [
        { number: "INV-2026-000001", label: "INV-2026-000001", date: "01 Jul 2026", status: "Paid" as DetailStatus, kind: "paid" as const },
        { number: "INV-2026-000002", label: "INV-2026-000002", date: "01 Aug 2026", status: "Awaiting" as DetailStatus, kind: "await" as const },
        { number: "series-3", label: "Next Invoice", date: "01 Sep 2026", status: "Draft" as DetailStatus, kind: "scheduled" as const },
        { number: "series-4", label: "Invoice #4", date: "01 Oct 2026", status: "Draft" as DetailStatus, kind: "scheduled" as const },
        { number: "series-5", label: "Invoice #5", date: "01 Nov 2026", status: "Draft" as DetailStatus, kind: "scheduled" as const },
      ];
  // Editing an existing series (DES-782 AC4) — reuses the recurring form with a "Save changes" CTA.
  const [editingSeries, setEditingSeries] = useState(false);
  // Where the full-page Add Customer returns: the Customers list, or the invoice customer picker.
  const [addCustomerReturn, setAddCustomerReturn] = useState<"customers" | "customer">("customers");
  // Preset filter to apply when the list is opened from a dashboard hero stat.
  const [listPreset, setListPreset] = useState<{ status?: "Paid" | "Awaiting" } | null>(null);
  // Dev: which hero demo state the dashboard renders (switched from QuickNav).
  const [heroScenario, setHeroScenario] = useState(0);
  // Dev sidebar deep link: CN detail to open when jumping to the Credit Notes list (null = plain list).
  const [cnPreview, setCnPreview] = useState<string | null>(null);
  // Bumped on every sidebar detail jump so the detail page remounts (fresh state) even when
  // the invoice number/status don't change. In-page actions never bump it.
  const [detailNavNonce, setDetailNavNonce] = useState(0);

  // Sidebar deep link: open the invoice detail seeded with a register demo invoice.
  const jumpDetail = (
    inv: { number: string; client: string; status: DetailStatus; cnNo?: string; cnAmount?: number; cnSent?: boolean; cnDraft?: boolean; cnAwaiting?: boolean },
    viewCn = false
  ) => {
    setOpenInvoice({ origin: "created", ...inv, viewCn });
    setDetailFlash(null);
    setEditFromDuplicate(false);
    setDetailReturn("list");
    setDetailNavNonce((n) => n + 1);
    setScreen("invoiceDetail");
  };

  // Dev-only QuickNav sidebar groups (stakeholder demos) — labels + jump wiring per the 2026-07-15 spec.
  const sidebarGroups: SidebarGroup[] = [
    {
      title: "Dashboard",
      items: HERO_SCENARIOS.map((s, i) => ({
        label: s.label,
        active: screen === "dashboard" && heroScenario === i,
        onSelect: () => { setHeroScenario(i); setScreen("dashboard"); },
      })),
    },
    {
      title: "Customer",
      items: [
        { label: "Customer List", active: screen === "customers", onSelect: () => setScreen("customers") },
        { label: "Add New Customer", active: screen === "addCustomer", onSelect: () => { setAddCustomerReturn("customers"); setScreen("addCustomer"); } },
        { label: "Customer Details", active: screen === "customerDetail", onSelect: () => { setSelectedCustomer(customers[0]); setCustomerFlash(null); setScreen("customerDetail"); } },
      ],
    },
    {
      title: "Sales Invoice Settings",
      items: [
        { label: "Manage Settings", active: screen === "settings", onSelect: () => setScreen("settings") },
      ],
    },
    {
      title: "Sales Invoice",
      items: [
        // Clear any pending toast so the dev jump never lands with a stale "Saved as draft" flash.
        { label: "Sales Invoice List", active: screen === "list", onSelect: () => { setToast(null); setListPreset(null); setScreen("list"); } },
        // Dev jump lands on the pre-filled editor (demo customer + demo items), not the picker (user, 15/Jul).
        { label: "Create Invoice", active: screen === "customer" || screen === "details", onSelect: () => { setRecurring(false); setEditingSeries(false); setExtracted(null); setCustomer(DEMO_CUSTOMER); setDevSeedItems(true); setEditInitial(null); setNumberRecommended(false); setEditFromDuplicate(false); setScreen("details"); } },
        { label: "Send Invoice", active: screen === "send", onSelect: () => setScreen("send") },
        { label: "Upload Invoice", active: screen === "upload" || screen === "extracting", onSelect: () => { setUploadedFiles([]); setUploadedFile(null); setUploadReturn("list"); setScreen("upload"); } },
      ],
      sections: [
        {
          // One entry per detail-page status — each opens a matching register demo invoice.
          heading: "Invoice Detail",
          items: [
            { label: "Draft", active: screen === "invoiceDetail" && openInvoice.number === "INV-2026-000003", onSelect: () => jumpDetail({ number: "INV-2026-000003", client: "Bright Harbor Co.", status: "Draft" }) },
            { label: "Awaiting Payment", active: screen === "invoiceDetail" && openInvoice.number === "INV-2026-000004", onSelect: () => jumpDetail({ number: "INV-2026-000004", client: "Marlow & Finch Studio", status: "Awaiting" }) },
            { label: "Overdue + 1 Applied CN", active: screen === "invoiceDetail" && openInvoice.number === "INV-2026-000010", onSelect: () => jumpDetail({ number: "INV-2026-000010", client: "Harbor & Co.", status: "Overdue", cnNo: "CN-2026-000003", cnAmount: 2000, cnSent: true }) },
            { label: "Partially Paid", active: screen === "invoiceDetail" && openInvoice.number === "INV-2026-000014", onSelect: () => jumpDetail({ number: "INV-2026-000014", client: "Verde Coffee Roasters", status: "PartiallyPaid" }) },
            { label: "Paid", active: screen === "invoiceDetail" && openInvoice.number === "INV-2026-000005", onSelect: () => jumpDetail({ number: "INV-2026-000005", client: "Atlas Logistics", status: "Paid" }) },
            { label: "Refund Pending + 1 Applied CN", active: screen === "invoiceDetail" && openInvoice.number === "INV-2026-000011", onSelect: () => jumpDetail({ number: "INV-2026-000011", client: "Cobalt Systems", status: "Paid", cnNo: "CN-2026-000004", cnAmount: 1200, cnSent: false }) },
            // Fully-refunded invoice — its refund CN is paid out (refundState=full), so the detail reads "Refunded".
            { label: "Refunded", active: screen === "invoiceDetail" && openInvoice.number === "INV-2026-000015" && refundState["INV-2026-000015"] === "full", onSelect: () => { setRefundState((s) => ({ ...s, "INV-2026-000015": "full" })); jumpDetail({ number: "INV-2026-000015", client: "Solstice Media", status: "Paid", cnNo: "CN-2026-000007", cnAmount: 6450, cnSent: false }); } },
            // Voided invoice (terminal) — voided with a credit note (CN-…001).
            { label: "Void", active: screen === "invoiceDetail" && openInvoice.number === "INV-2026-000008", onSelect: () => jumpDetail({ number: "INV-2026-000008", client: "Bright Harbor Co.", status: "Cancelled", cnNo: "CN-2026-000001", cnSent: true }) },
          ],
        },
      ],
    },
    {
      title: "Credit Note",
      items: [
        // Opens the Credit Notes register with no preview overlaid (null clears any prior deep link).
        { label: "Credit Note List", active: screen === "creditNotes" && cnPreview === null, onSelect: () => { setCnPreview(null); setScreen("creditNotes"); } },
      ],
      sections: [
        {
          heading: "Unpaid Invoice",
          items: [
            { label: "Create Credit Note", active: screen === "creditNote", onSelect: () => setScreen("creditNote") },
            { label: "CN Detail — Draft", active: screen === "creditNotes" && cnPreview === "CN-2026-000005", onSelect: () => { setCnPreview("CN-2026-000005"); setScreen("creditNotes"); } },
            { label: "CN Detail — Applied", active: screen === "creditNotes" && cnPreview === "CN-2026-000003", onSelect: () => { setCnPreview("CN-2026-000003"); setScreen("creditNotes"); } },
            { label: "CN Detail — Cancelled", active: screen === "creditNotes" && cnPreview === "CN-2026-000009", onSelect: () => { setCnPreview("CN-2026-000009"); setScreen("creditNotes"); } },
          ],
        },
        {
          // The refund lifecycle lives on the invoice-detail side (DES-720/721) — these two open the
          // full-refund demo invoice (INV-…015, CN = the $6,450 detail total) with its CN detail overlaid.
          heading: "Paid Invoices",
          items: [
            { label: "Create Refund Credit Note", active: screen === "refundCreditNote", onSelect: () => setScreen("refundCreditNote") },
            {
              label: "Refund CN — Draft",
              active: screen === "invoiceDetail" && openInvoice.number === "INV-2026-000015" && !!openInvoice.cnDraft,
              onSelect: () => {
                setRefundState(({ ["INV-2026-000015"]: _drop, ...rest }) => rest);
                jumpDetail({ number: "INV-2026-000015", client: "Solstice Media", status: "Paid", cnNo: "CN-2026-000007", cnAmount: 6450, cnSent: false, cnDraft: true }, true);
              },
            },
            {
              label: "Refund CN — Applied",
              active: screen === "invoiceDetail" && openInvoice.number === "INV-2026-000015" && !openInvoice.cnDraft && !openInvoice.cnAwaiting && !refundState["INV-2026-000015"],
              onSelect: () => {
                setRefundState(({ ["INV-2026-000015"]: _drop, ...rest }) => rest);
                jumpDetail({ number: "INV-2026-000015", client: "Solstice Media", status: "Paid", cnNo: "CN-2026-000007", cnAmount: 6450, cnSent: false }, true);
              },
            },
            {
              label: "Refund CN — Awaiting refund",
              active: screen === "invoiceDetail" && openInvoice.number === "INV-2026-000015" && !!openInvoice.cnAwaiting,
              onSelect: () => {
                setRefundState(({ ["INV-2026-000015"]: _drop, ...rest }) => rest);
                jumpDetail({ number: "INV-2026-000015", client: "Solstice Media", status: "Paid", cnNo: "CN-2026-000007", cnAmount: 6450, cnSent: false, cnAwaiting: true }, true);
              },
            },
          ],
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#EDEDED] flex flex-col items-center justify-center gap-4 p-4">
      {screen === "dashboard" && (
        <Dashboard
          tab="dashboard"
          scenario={heroScenario}
          onMenu={() => setScreen("hub")}
          onSettings={() => setScreen("settings")}
          onOpenNeedAttention={() => setScreen("needAttention")}
          onOpenInvoices={() => {
            setListPreset(null);
            setScreen("list");
          }}
          onOpenPaid={() => {
            setListPreset({ status: "Paid" });
            setScreen("list");
          }}
          onOpenOutstanding={() => {
            setListPreset({ status: "Awaiting" });
            setScreen("list");
          }}
          onOpenInvoice={(inv) => {
            setOpenInvoice(inv);
            setDetailFlash(null);
            setEditFromDuplicate(false);
            setDetailReturn("dashboard");
            setScreen("invoiceDetail");
          }}
          onCreate={() => {
            setExtracted(null);
            setRecurring(false);
            setEditingSeries(false);
            setScreen("customer");
          }}
          onUpload={() => {
            setUploadReturn("dashboard");
            setRecurring(false);
            setEditingSeries(false);
            setCustomer(null); // customer comes from OCR — don't carry a previously-selected one in
            setScreen("upload");
          }}
          onRecurring={() => {
            setExtracted(null);
            setEditInitial(null);
            setRecurring(true);
            setEditingSeries(false);
            setScreen("customer");
          }}
        />
      )}

      {/* Accounting Hub — reachable Menu (DES-763 nav). Sales: Invoices + Credit Notes. */}
      {screen === "hub" && (
        <AccountingHub
          onBack={() => setScreen("dashboard")}
          onOpenSalesInvoices={() => setScreen("dashboard")}
          onOpenCreditNotes={() => { setCnPreview(null); setScreen("creditNotes"); }}
          onOpenCustomers={() => setScreen("customers")}
        />
      )}

      {screen === "creditNotes" && (
        <CreditNotesList
          key={cnPreview ?? "cn-list"}
          initialPreviewNo={cnPreview}
          companyEmail={settings.email}
          refundState={refundState}
          onBack={() => setScreen("hub")}
          onOpenInvoice={(no) => {
            // Open the CN's related invoice; look it up in the register (ids may carry an a/b suffix).
            const inv = INVOICES.find((i) => i.id === no || i.id.startsWith(no));
            if (!inv) return;
            setOpenInvoice({
              number: no,
              client: inv.client,
              status: inv.status as DetailStatus,
              origin: (inv.origin as "created" | "uploaded") ?? "created",
              cnNo: inv.cnNo, cnAmount: inv.cnAmount, cnSent: inv.cnSent, recurring: inv.recurring,
            });
            setDetailFlash(null);
            setEditFromDuplicate(false);
            setDetailReturn("creditNotes"); // back from the invoice returns to the Credit Notes List
            setScreen("invoiceDetail");
          }}
        />
      )}

      {screen === "customers" && (
        <CustomerList
          customers={customers}
          flash={customerFlash}
          onFlashDone={() => setCustomerFlash(null)}
          onBack={() => setScreen("hub")}
          onOpenCustomer={(c) => { setSelectedCustomer(c); setScreen("customerDetail"); }}
          onAddCustomer={() => { setAddCustomerReturn("customers"); setScreen("addCustomer"); }}
        />
      )}

      {/* Add Client — full page (DES-713). Entry from the Customers list OR the invoice customer picker.
          Post-save it appends, then: picker entry returns to the picker with the new customer selected;
          list entry opens the new customer's DETAIL page (user, 15/Jul) — back from there lands on the list. */}
      {screen === "addCustomer" && (
        <AddCustomerPage
          existing={customers}
          defaultCurrency={settings.currency}
          onBack={() => setScreen(addCustomerReturn)}
          onAdd={(cust) => {
            setCustomers((prev) => [...prev, cust]);
            if (addCustomerReturn === "customer") {
              // In-invoice add → return to the picker with the new customer selected.
              setCustomer(cust);
              setScreen("customer");
            } else {
              setSelectedCustomer(cust);
              setCustomerFlash(`${cust.name} added`);
              setScreen("customerDetail");
            }
          }}
        />
      )}

      {screen === "customerDetail" && selectedCustomer && (
        <CustomerDetailPage
          customer={selectedCustomer}
          flash={customerFlash}
          onFlashDone={() => setCustomerFlash(null)}
          onBack={() => setScreen("customers")}
          onEdit={() => setScreen("editCustomer")}
        />
      )}

      {/* Edit Client — full page (DES-714). Save updates the register + the open record, then returns. */}
      {screen === "editCustomer" && selectedCustomer && (
        <AddCustomerPage
          mode="edit"
          initial={selectedCustomer}
          existing={customers.filter((c) => c.id !== selectedCustomer.id)}
          onBack={() => setScreen("customerDetail")}
          onAdd={(updated) => {
            setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
            setSelectedCustomer(updated);
            setCustomerFlash("Changes saved");
            setScreen("customerDetail");
          }}
        />
      )}

      {screen === "needAttention" && (
        <NeedAttention
          onBack={() => setScreen("dashboard")}
          onOpenInvoice={(inv) => {
            setOpenInvoice(inv);
            setDetailFlash(null);
            setEditFromDuplicate(false);
            setDetailReturn("needAttention");
            setScreen("invoiceDetail");
          }}
        />
      )}

      {screen === "settings" && (
        <InvoiceSettings
          initial={settings}
          onExit={(next) => {
            // Leaving persists the live edits; the default currency seeds new invoices.
            setSettings(next);
            setScreen("dashboard");
          }}
        />
      )}

      {/* Standalone Credit Note form (dev nav: Sales Credit Notes) — wrapped in a phone frame */}
      {screen === "creditNote" && (
        <div className="relative rounded-[48px] overflow-hidden shadow-2xl" style={{ width: 375, height: 812 }}>
          <CreditNoteForm
            creditNoteNo="CN-2026-000001"
            invoiceNo="INV-2026-000007"
            customerName="Northwind Traders"
            customerEmail="apa@marlowfinch.co"
            currency="USD"
            items={CREDIT_NOTE_ITEMS}
            invoiceTotal={CREDIT_NOTE_TOTAL}
            alreadyCredited={0}
            outstanding={CREDIT_NOTE_TOTAL}
            // Back while creating → save progress as a Draft (DES-719) and open the invoice's detail.
            onBack={() => jumpDetail({ number: "INV-2026-000007", client: "Northwind Traders", status: "Awaiting" })}
            onSaveDraft={(p) => {
              jumpDetail({ number: "INV-2026-000007", client: "Northwind Traders", status: "Awaiting", cnNo: "CN-2026-000001", cnAmount: p.amount, cnSent: false, cnDraft: true });
              setDetailFlash("Saved as draft");
            }}
            // Apply → open the related invoice's detail with the new credit note applied (full → Void).
            onCreate={(p) => {
              const full = p.amount >= CREDIT_NOTE_TOTAL - 0.001;
              jumpDetail({ number: "INV-2026-000007", client: "Northwind Traders", status: full ? "Cancelled" : "Awaiting", cnNo: "CN-2026-000001", cnAmount: p.amount, cnSent: false });
              setDetailFlash(full ? "Invoice voided with a credit note" : "Credit note applied");
            }}
          />
        </div>
      )}

      {/* Standalone Refund Credit Note form (dev nav: Paid Invoices → Create Refund Credit Note) —
          the same DES-720 refund-mode form the Paid invoice detail opens, seeded with the plain-Paid
          demo invoice (INV-2026-000005 Atlas). */}
      {screen === "refundCreditNote" && (
        <div className="relative rounded-[48px] overflow-hidden shadow-2xl" style={{ width: 375, height: 812 }}>
          <CreditNoteForm
            refund
            creditNoteNo="CN-2026-000010"
            invoiceNo="INV-2026-000005"
            customerName="Atlas Logistics"
            customerEmail="billing@atlaslogistics.com"
            currency="USD"
            items={CREDIT_NOTE_ITEMS}
            invoiceTotal={CREDIT_NOTE_TOTAL}
            alreadyCredited={0}
            outstanding={CREDIT_NOTE_TOTAL}
            // Back while creating → save progress as a Draft refund CN and open the invoice's detail.
            onBack={() => jumpDetail({ number: "INV-2026-000005", client: "Atlas Logistics", status: "Paid" })}
            onSaveDraft={(p) => {
              jumpDetail({ number: "INV-2026-000005", client: "Atlas Logistics", status: "Paid", cnNo: "CN-2026-000010", cnAmount: p.amount, cnSent: false, cnDraft: true });
              setDetailFlash("Saved as draft");
            }}
            // Apply → open the related invoice's detail with the refund credit note applied (Pending Refund).
            onCreate={(p) => {
              jumpDetail({ number: "INV-2026-000005", client: "Atlas Logistics", status: "PendingRefund", cnNo: "CN-2026-000010", cnAmount: p.amount, cnSent: false });
              setDetailFlash("Refund credit note applied");
            }}
          />
        </div>
      )}

      {screen === "list" && (
        <SalesInvoiceList
          showSuccess={!!toast}
          successMessage={toast?.title}
          successSubtext={toast?.subtext}
          onSuccessDone={() => setToast(null)}
          recent={recent}
          initialStatus={listPreset?.status}
          refundState={refundState}
          onBack={() => setScreen("dashboard")}
          onOpenInvoice={(inv) => {
            setOpenInvoice(inv);
            setDetailFlash(null);
            setEditFromDuplicate(false);
            setDetailReturn("list");
            setScreen("invoiceDetail");
          }}
          onManual={() => {
            setExtracted(null);
            setRecurring(false);
            setEditingSeries(false);
            setScreen("customer");
          }}
          onUpload={() => {
            setUploadReturn("list");
            setRecurring(false);
            setEditingSeries(false);
            setCustomer(null); // customer comes from OCR — don't carry a previously-selected one in
            setScreen("upload");
          }}
          onRecurring={() => {
            setExtracted(null);
            setEditInitial(null);
            setRecurring(true);
            setEditingSeries(false);
            setScreen("customer");
          }}
        />
      )}

      {screen === "invoiceDetail" && (
        <InvoiceDetailPage
          key={`${openInvoice.number}:${openInvoice.status}:${detailNavNonce}`}
          initialViewCn={!!openInvoice.viewCn}
          initialStatus={openInvoice.status}
          origin={openInvoice.origin}
          recurring={openInvoice.recurring}
          seriesStatus={openInvoice.status === "Paid" ? "Completed" : seriesStatus}
          onOpenSeries={() => { setSeriesScenario(openInvoice.status === "Draft" ? "draft" : openInvoice.status === "Paid" ? "completed" : "midrun"); setScreen("recurringSeries"); }}
          invoiceNo={openInvoice.number}
          customerName={openInvoice.client}
          customerEmail={CREDIT_NOTES.find((c) => c.no === openInvoice.cnNo)?.email}
          companyEmail={settings.email}
          initialCreditNote={openInvoice.cnNo ? { no: openInvoice.cnNo, amount: openInvoice.cnAmount, sent: !!openInvoice.cnSent, draft: openInvoice.cnDraft, awaiting: openInvoice.cnAwaiting } : undefined}
          refundTag={(() => {
            // A refund completed in-session this run wins (Partially Refunded / Refunded).
            const done = refundState[openInvoice.number];
            if (done) return done === "full" ? "Refunded" : "Partially Refunded";
            // Otherwise the derived tag: a Paid invoice whose linked CN is a refund reads as pending until
            // an in-session refund settles it (the register no longer carries refund lifecycle states).
            const cn = CREDIT_NOTES.find((c) => c.no === openInvoice.cnNo);
            return cn?.kind === "refund" ? "Refund pending" : undefined;
          })()}
          onRefunded={(no, result) => setRefundState((s) => ({ ...s, [no]: result }))}
          flashToast={detailFlash ?? undefined}
          onBack={() => {
            setDetailFlash(null);
            // Back from the edit-existing-draft flow leaves it as a draft → confirm with a toast.
            if (editFromDuplicate) {
              setToast({ title: "Saved as draft" });
              setEditFromDuplicate(false);
            }
            setScreen(detailReturn);
          }}
          onEdit={(seed) => {
            setExtracted(null);
            setCustomer(seed.customer);
            setEditInitial(seed);
            setNumberRecommended(false);
            setEditFromDuplicate(false);
            // Invoice "Edit" = a one-off content edit of this occurrence — never the schedule (that's on
            // the series). The combined content+schedule editor is reached via Series → Edit recurring.
            setRecurring(false);
            setEditingSeries(false);
            setScreen("details");
          }}
          onIssued={() => {
            setToast({ title: "Invoice marked as sent" });
            setRecent(null);
            setScreen(detailReturn);
          }}
          onDeleted={() => {
            setToast({ title: "Draft deleted" });
            setRecent(null);
            setScreen(detailReturn);
          }}
          onSent={() => {
            setToast({ title: "Invoice marked as sent" });
            setRecent(null);
            setScreen(detailReturn);
          }}
        />
      )}

      {screen === "upload" && (
        <div className="relative overflow-hidden rounded-[48px]" style={{ width: 375, height: 812 }}>
          {/* The originating screen, shown dimmed behind the sheet. */}
          <div className="absolute inset-0 pointer-events-none">
            {uploadReturn === "dashboard" ? (
              <Dashboard tab="dashboard" />
            ) : (
              <SalesInvoiceList />
            )}
          </div>

          <UploadInvoice
          initialFiles={uploadedFiles}
          onBack={() => {
            // Dismissing the sheet saves nothing — drop the attachment and return to where it opened.
            setUploadedFiles([]);
            setUploadedFile(null);
            setScreen(uploadReturn);
          }}
          onContinue={(files) => {
            // Demo: each source maps to a distinct OCR case (file names encode the case).
            //  • Choose from Photos (invoice-scan.png) → duplicate (matches an existing draft)
            //  • Browse Files (invoice.pdf)      → customer name + email NOT read (manual input + save-to-list)
            //  • Simulate unreadable             → nothing read (blank form)
            // (Take Photo returns an oversized file → rejected before reaching here.)
            const name = files[0]?.name ?? "";
            if (/blank|unreadable/i.test(name)) {
              setPendingExtraction(null);
            } else if (/scan/i.test(name)) {
              setPendingExtraction(DEMO_EXTRACTION_MATCHED);
            } else {
              setPendingExtraction(DEMO_EXTRACTION_NO_CUSTOMER);
            }
            // Remember the uploaded file so the review can show it (and so Back can restore it).
            setUploadedFiles(files);
            setUploadedFile(files[0] ? { name: files[0].name, size: files[0].size } : null);
            setScreen("extracting");
          }}
          />
        </div>
      )}

      {/* OCR / extraction step after an upload */}
      {screen === "extracting" && (
        <GeneratingInvoice
          title="Reading your invoice"
          steps={OCR_STEPS}
          durationMs={1400}
          onDone={() => {
            // Nothing extracted → drop into the upload form blank (banner + manual fill, DES-716).
            const ex = pendingExtraction === null ? BLANK_EXTRACTION : pendingExtraction;
            setExtracted(ex);
            setEditInitial(null);
            setNumberRecommended(false);
            setEditFromDuplicate(false);
            // Exact-duplicate check: a matching existing invoice (any status) → decision page first.
            // Draft → Edit Existing Draft; Awaiting/Paid → View Invoice (status-aware CTAs on that page).
            const dup = ex.invoiceNumber.trim()
              ? EXISTING_INVOICES.find(
                  (i) => i.number.toLowerCase() === ex.invoiceNumber.trim().toLowerCase()
                )
              : undefined;
            if (dup) {
              setDupExisting(dup);
              setScreen("duplicateCheck");
            } else {
              setScreen("details");
            }
          }}
        />
      )}

      {/* Duplicate decision page — shown after OCR when the upload matches an existing draft */}
      {screen === "duplicateCheck" && dupExisting && (
        <DuplicateDecision
          existing={dupExisting}
          file={uploadedFile}
          onBack={() => setScreen("upload")}
          onEditExisting={() => {
            // Open the existing draft's editor and keep editing it (existing draft unchanged otherwise).
            const inv = dupExisting;
            const cust = CUSTOMERS.find((c) => c.name === inv.customer) ?? { id: "existing", name: inv.customer, email: "" };
            setExtracted(null);
            setUploadedFile(null);
            setNumberRecommended(false);
            setEditFromDuplicate(true);
            setCustomer(cust);
            // This came from an upload — the OCR'd line items are already filled, so seed the
            // editor with them (the existing draft itself stores only a total).
            const dupItems = (pendingExtraction ?? DEMO_EXTRACTION).services;
            setEditInitial({ customer: cust, invoiceNo: inv.number, currency: inv.currency, services: dupItems, limited: false });
            setOpenInvoice({ number: inv.number, client: inv.customer, status: "Draft", origin: "uploaded" });
            setDetailReturn("list");
            setScreen("details");
          }}
          onViewInvoice={() => {
            // Issued match (Awaiting/Paid) → open the existing invoice's detail page (read/act there).
            const inv = dupExisting;
            const status: DetailStatus = inv.status === "Paid" ? "Paid" : inv.status === "Draft" ? "Draft" : "Awaiting";
            setOpenInvoice({ number: inv.number, client: inv.customer, status, origin: "uploaded" });
            setDetailFlash(null);
            setEditFromDuplicate(false);
            setDetailReturn("list");
            setScreen("invoiceDetail");
          }}
          onCreateNew={() => {
            // New draft from the OCR data, with a freshly generated (unique) invoice number.
            // Uploaded invoices use the UPL-YYYY-NNNNNN register (never our INV-YYYY-NNNNNN format);
            // this is the "system recommended" number the user can still overwrite.
            const nums = EXISTING_INVOICES.map((i) => parseInt(i.number.split("-").pop() || "0", 10)).filter((n) => !Number.isNaN(n));
            const next = (nums.length ? Math.max(...nums) : 0) + 1;
            const newNo = `UPL-2026-${String(next).padStart(6, "0")}`;
            const base = pendingExtraction ?? DEMO_EXTRACTION;
            setExtracted({ ...base, invoiceNumber: newNo });
            setEditInitial(null);
            // Keep the uploaded file so its "Preview invoice.pdf" card shows above the customer on the review screen.
            setNumberRecommended(true); // the generated number is system-recommended
            setEditFromDuplicate(false);
            setScreen("details");
          }}
        />
      )}

      {/* Create Sales Invoice flow */}
      {screen === "customer" && (
        <CreateSalesInvoice
          selectedId={customer?.id ?? ""}
          customers={customers}
          recurring={recurring}
          onAddCustomer={() => { setAddCustomerReturn("customer"); setScreen("addCustomer"); }}
          onClose={() => setScreen("list")}
          onSelectCustomer={(c) => {
            setCustomer(c);
            setDevSeedItems(false); // real create flow starts with an empty item list
            setEditInitial(null);
            setNumberRecommended(false);
            setEditFromDuplicate(false);
            setScreen("details");
          }}
        />
      )}

      {screen === "details" && (
        <AddInvoiceDetails
          customer={customer}
          customers={customers}
          recurring={recurring}
          editingSeries={editingSeries}
          key={devSeedItems ? "dev-prefilled" : "editor"}
          seedServices={editingSeries ? RECURRING_SERIES_ITEMS : devSeedItems ? DEMO_EXTRACTION.services : undefined}
          companyName={settings.companyName}
          companyEmail={settings.email}
          extracted={extracted}
          // Invoice-currency seed precedence (DES-713): OCR (extracted) → edit-seed → CUSTOMER default →
          // account Settings default. AddInvoiceDetails applies OCR/edit above this; currency is read-only
          // (no per-invoice override), so nothing writes back to the customer record or Settings.
          defaultCurrency={customer?.currency ?? settings.currency}
          defaultChaser={settings.chaserEnabled}
          defaultAccountId={settings.paymentMethod}
          extractionFailed={extracted === BLANK_EXTRACTION}
          onReupload={() => setScreen("upload")}
          uploadedFile={uploadedFile}
          numberRecommended={numberRecommended}
          editExitToList={editFromDuplicate}
          onOpenExisting={(inv) => {
            // Case 1 (exact duplicate): abandon the upload and continue the existing invoice.
            const cust = CUSTOMERS.find((c) => c.name === inv.customer) ?? { id: "existing", name: inv.customer, email: "" };
            const status: DetailStatus =
              inv.status === "Awaiting Payment" ? "Awaiting"
              : inv.status === "Paid" ? "Paid"
              : inv.status === "Cancelled" ? "Cancelled"
              : "Draft";
            setExtracted(null);
            setUploadedFile(null);
            setCustomer(cust);
            setOpenInvoice({ number: inv.number, client: inv.customer, status, origin: "uploaded" });
            setDetailReturn("list");
            // "Open existing invoice" always opens the existing invoice's detail page.
            setDetailFlash(null);
            setScreen("invoiceDetail");
          }}
          initial={editInitial}
          onEditBack={() => { setDetailFlash(null); setScreen("invoiceDetail"); }}
          onEditSave={() => { setDetailFlash("Changes saved"); setScreen("invoiceDetail"); }}
          onClose={() => setScreen("list")}
          onChangeCustomer={() => setScreen("customer")}
          onSend={(t, r) => {
            setRecent(r ?? null);
            setEditingSeries(false);
            if (extracted) {
              // Any upload create (OCR-missing, create-new, etc.) → land on the new invoice's
              // detail page in Awaiting Payment, not the list.
              const num = r?.meta?.split(" · ")[0] ?? extracted.invoiceNumber;
              setOpenInvoice({ number: num, client: r?.client ?? extracted.customerName, status: "Awaiting", origin: "uploaded" });
              setDetailReturn("list");
              setDetailFlash(t?.title ?? "Saved as awaiting payment");
              setNumberRecommended(false);
              setScreen("invoiceDetail");
            } else {
              // Manual send flow: action-specific toast, return to the list.
              setToast(t ?? { title: "Invoice marked as sent" });
              setScreen("list");
            }
          }}
          onSendLater={() => setScreen("list")}
          onSaveDraft={(draft) => {
            setToast({ title: "Saved as draft" });
            setRecent(draft ? { ...draft, status: "Draft" } : null);
            setScreen("list");
          }}
        />
      )}

      {/* Dev preview — jump straight to the Send (Delivery method) sheet */}
      {screen === "send" && (
        <AddInvoiceDetails
          customer={DEMO_CUSTOMER}
          customers={customers}
          companyName={settings.companyName}
          companyEmail={settings.email}
          extracted={null}
          autoOpenSend
          defaultChaser={settings.chaserEnabled}
          defaultAccountId={settings.paymentMethod}
          seedServices={DEMO_EXTRACTION.services}
          onClose={() => setScreen("list")}
          onChangeCustomer={() => setScreen("customer")}
          onSend={(t, r) => {
            setToast(t ?? { title: "Invoice marked as sent" });
            setRecent(r ?? null);
            setScreen("list");
          }}
          onSendLater={() => setScreen("list")}
          onSaveDraft={(draft) => {
            setToast({ title: "Saved as draft" });
            setRecent(draft ? { ...draft, status: "Draft" } : null);
            setScreen("list");
          }}
        />
      )}

      {/* Recurring series detail (DES-782) — Pause / Resume / Cancel the series */}
      {screen === "recurringSeries" && (
        <RecurringSeriesDetail
          status={seriesScenario === "completed" ? "Completed" : seriesStatus}
          customerName={openInvoice.client}
          amountLabel="$6,450.00"
          frequency="Monthly"
          startDate="01 Jul 2026"
          nextDate="01 Sep 2026"
          ends="01 Dec 2026 (5 invoices)"
          autoSend={true}
          onBack={() => setScreen("invoiceDetail")}
          onEdit={() => {
            // Edit the series (DES-782 AC4) — reuse the recurring form, seeded with the series' customer
            // + line items. Customer/currency/start-date locking is a follow-up.
            const cust = customers.find((c) => c.name === openInvoice.client) ?? { id: "series", name: openInvoice.client, email: "" };
            setCustomer(cust);
            setExtracted(null);
            setEditInitial(null);
            setNumberRecommended(false);
            setEditFromDuplicate(false);
            setRecurring(true);
            setEditingSeries(true);
            setScreen("details");
          }}
          onPause={() => { setSeriesStatus("Paused"); setScreen("invoiceDetail"); }}
          onResume={() => { setSeriesStatus("Active"); setScreen("invoiceDetail"); }}
          onCancel={() => { setSeriesStatus("Cancelled"); setScreen("invoiceDetail"); }}
          invoices={seriesInvoices}
          onOpenInvoice={(inv) => {
            // AC5 — open a generated invoice from the log; back returns here to the series.
            setOpenInvoice({ number: inv.number, client: openInvoice.client, status: inv.status, origin: "created", recurring: true });
            setDetailReturn("recurringSeries");
            setDetailFlash(null);
            setScreen("invoiceDetail");
          }}
        />
      )}

      {/* Scenario annotation — shown in the white space to the right of the phone frame, only on the
          voided demo invoice (INV-…008), explaining how it reached the Void state. */}
      {screen === "invoiceDetail" && openInvoice.number === "INV-2026-000008" && (
        <div
          className="hidden lg:block fixed top-1/2 -translate-y-1/2 left-[calc(50%+230px)] w-[320px]"
          style={FONT}
        >
          <div className="rounded-2xl bg-white shadow-[0_8px_30px_rgba(16,24,40,0.10)] border border-black/5 p-6">
            <p className="text-[12px] font-bold uppercase tracking-wide text-[#a0a0a0] mb-4">Scenario</p>
            <p className="text-[15px] leading-[1.55] text-[#1b1b1b] mb-4">
              A user sent an invoice for a website design project.
            </p>
            <p className="text-[15px] leading-[1.55] text-[#1b1b1b] mb-4">
              Before payment is made, their customer decides to cancel the entire project.
            </p>
            <p className="text-[15px] leading-[1.55] text-[#1b1b1b]">
              The user creates a full credit note, and the invoice status changes to{" "}
              <span className="font-semibold">Voided</span>.
            </p>
          </div>
        </div>
      )}

      {/* Screen jumper — the collapsible QuickNav sidebar (stakeholder demos), shown in
          every build for now so the Vercel demo matches localhost. */}
      <QuickNavSidebar groups={sidebarGroups} />
    </div>
  );
}
