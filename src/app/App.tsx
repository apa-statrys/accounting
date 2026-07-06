import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, ChevronRight } from "lucide-react";
import { Dashboard } from "./components/Dashboard";
import { AccountingHub } from "./components/AccountingHub";
import { CreditNotesList } from "./components/CreditNotesList";
import { CustomerList } from "./components/CustomerList";
import { CustomerDetailPage } from "./components/CustomerDetailPage";
import { AddCustomerPage } from "./components/AddCustomerPage";
import { CREDIT_NOTES } from "./data/creditNotes";
import { InvoiceDetailPage } from "./components/invoice-detail/InvoiceDetailPage";
import { CreditNoteForm } from "./components/credit-note-form/CreditNoteForm";
import { CreateSalesInvoice } from "./components/CreateSalesInvoice";
import { RecurringSeriesDetail } from "./components/RecurringSeriesDetail";
import { AddInvoiceDetails } from "./components/add-invoice-details/AddInvoiceDetails";
import { SalesInvoiceList } from "./components/sales-invoice-list/SalesInvoiceList";
import { NeedAttention } from "./components/NeedAttention";
import { DuplicateDecision } from "./components/DuplicateDecision";
import { UploadInvoice } from "./components/UploadInvoice";
import { InvoiceSettings } from "./components/InvoiceSettings";
import { GeneratingInvoice } from "./components/GeneratingInvoice";
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

/** Dev-only floating menu (bottom-left) that opens a list of sections to jump to. */
function QuickNav({ current, onChange, scenario, onScenario }: { current: Screen; onChange: (s: Screen) => void; scenario: number; onScenario: (i: number) => void }) {
  const [open, setOpen] = useState(false);
  const active = navFor(current);

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
              {NAV_GROUPS.map((group) => (
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

                        {/* Dashboard hero demo states — nested under Dashboard */}
                        {page.id === "dashboard" && (
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
  // Extraction queued while the OCR screen plays (chosen from the upload source).
  // null = OCR found nothing usable (routes to the extract-failed screen).
  const [pendingExtraction, setPendingExtraction] = useState<ExtractedInvoice | null>(DEMO_EXTRACTION);
  // Toast shown on the list after returning from the create flow.
  const [toast, setToast] = useState<{ title: string; subtext?: string } | null>(null);
  // Freshly created/saved invoice to surface + highlight at the top of the list.
  const [recent, setRecent] = useState<{ client: string; amount: string; status: "Awaiting" | "Draft" | "Paid"; meta: string } | null>(null);
  // The invoice opened into the detail page (status drives the lifecycle UI).
  const [openInvoice, setOpenInvoice] = useState<{ number: string; client: string; status: DetailStatus; origin: "created" | "uploaded"; cnNo?: string; cnAmount?: number; cnSent?: boolean; recurring?: boolean }>({
    number: "INV-2026-000042",
    client: "Marlow & Finch Studio",
    status: "Awaiting",
    origin: "created",
  });
  // Refund outcomes recorded in-session (DES-720), keyed by invoice number → "partial" | "full". Lets the
  // detail page's refund sync to the invoice list (Partially Refunded / Refunded) and the credit-note list.
  const [refundState, setRefundState] = useState<Record<string, "partial" | "full">>({});
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
  // Editing an existing series (DES-782 AC4) — reuses the recurring form with a "Save changes" CTA.
  const [editingSeries, setEditingSeries] = useState(false);
  // Where the full-page Add Customer returns: the Customers list, or the invoice customer picker.
  const [addCustomerReturn, setAddCustomerReturn] = useState<"customers" | "customer">("customers");
  // Preset filter to apply when the list is opened from a dashboard hero stat.
  const [listPreset, setListPreset] = useState<{ status?: "Paid" | "Awaiting" } | null>(null);
  // Dev: which hero demo state the dashboard renders (switched from QuickNav).
  const [heroScenario, setHeroScenario] = useState(0);

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
          onOpenSalesInvoices={() => { setListPreset(null); setScreen("list"); }}
          onOpenCreditNotes={() => setScreen("creditNotes")}
          onOpenCustomers={() => setScreen("customers")}
        />
      )}

      {screen === "creditNotes" && (
        <CreditNotesList refundState={refundState} onBack={() => setScreen("hub")} />
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

      {/* Add Client — full page (DES-713). Entry from the Customers list OR the invoice customer picker;
          post-save it appends + returns to wherever it was opened (the picker pre-selects the new one). */}
      {screen === "addCustomer" && (
        <AddCustomerPage
          existing={customers.map((c) => ({ name: c.name, email: c.email }))}
          defaultCurrency={settings.currency}
          onBack={() => setScreen(addCustomerReturn)}
          onAdd={(cust) => {
            setCustomers((prev) => [...prev, cust]);
            if (addCustomerReturn === "customer") {
              // In-invoice add → return to the picker with the new customer selected.
              setCustomer(cust);
              setScreen("customer");
            } else {
              setCustomerFlash(`${cust.name} added`);
              setScreen("customers");
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
          existing={customers.filter((c) => c.id !== selectedCustomer.id).map((c) => ({ name: c.name, email: c.email }))}
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
            onBack={() => setScreen("dashboard")}
            onCreate={() => { setScreen("dashboard"); setToast({ title: "Credit note created" }); }}
          />
        </div>
      )}

      {/* Sales Refund Credit Notes (DES-720) — not built yet; placeholder for the dev nav */}
      {screen === "refundCreditNote" && (
        <div className="relative rounded-[48px] overflow-hidden shadow-2xl bg-white flex flex-col items-center justify-center text-center px-8" style={{ width: 375, height: 812 }}>
          <p className="text-[18px] font-bold text-[#1b1b1b]">Sales Refund Credit Notes</p>
          <p className="text-[14px] text-gray-500 mt-2 leading-[1.5]">
            Refund flow (DES-720) — for invoices already paid. Not built yet.
          </p>
          <button
            onClick={() => setScreen("dashboard")}
            className="mt-6 px-5 py-2.5 rounded-full bg-[#1b1b1b] text-white text-[14px] font-medium"
          >
            Back to Dashboard
          </button>
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
          initialStatus={openInvoice.status}
          origin={openInvoice.origin}
          recurring={openInvoice.recurring}
          seriesStatus={seriesStatus}
          onOpenSeries={() => setScreen("recurringSeries")}
          invoiceNo={openInvoice.number}
          customerName={openInvoice.client}
          customerEmail={CREDIT_NOTES.find((c) => c.no === openInvoice.cnNo)?.email}
          initialCreditNote={openInvoice.cnNo ? { no: openInvoice.cnNo, amount: openInvoice.cnAmount, sent: !!openInvoice.cnSent } : undefined}
          refundTag={(() => {
            // A refund completed in-session this run wins (Partially Refunded / Refunded).
            const done = refundState[openInvoice.number];
            if (done) return done === "full" ? "Refunded" : "Partially Refunded";
            // Otherwise the derived tag (763 model): a Paid invoice whose linked CN is a refund.
            const cn = CREDIT_NOTES.find((c) => c.no === openInvoice.cnNo);
            return cn?.status === "Refunded" ? "Refunded" : cn?.status === "Pending Refund" ? "Refund pending" : undefined;
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
            setUploadedFile(null); // already previewed on the decision page — don't show it again
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
          seedServices={editingSeries ? RECURRING_SERIES_ITEMS : undefined}
          companyName={settings.companyName}
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
            if (status === "Draft") {
              // Continue the existing draft in its editor, prefilled.
              setEditInitial({ customer: cust, invoiceNo: inv.number, currency: inv.currency, services: [], limited: false });
              setScreen("details");
            } else {
              // Issued/closed → open its detail page instead (can't "continue" a non-draft).
              setDetailFlash(null);
              setScreen("invoiceDetail");
            }
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
          status={seriesStatus}
          customerName={openInvoice.client}
          amountLabel="$6,450.00"
          frequency="Monthly"
          startDate="1 Jul 2026"
          nextDate="1 Aug 2026"
          ends="Never"
          autoSend={false}
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
        />
      )}

      <QuickNav
        current={screen}
        onChange={(s) => {
          // Jumping straight to the duplicate page needs a match seeded — use the Awaiting demo invoice.
          if (s === "duplicateCheck") {
            const awaiting = EXISTING_INVOICES.find((i) => i.status === "Awaiting") ?? EXISTING_INVOICES[0];
            setDupExisting(awaiting);
            setPendingExtraction(DEMO_EXTRACTION_MATCHED);
            setUploadedFile({ name: "invoice-scan.png", size: 248_000 });
          }
          setScreen(s);
        }}
        scenario={heroScenario}
        onScenario={setHeroScenario}
      />
    </div>
  );
}
