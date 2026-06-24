import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X } from "lucide-react";
import { Dashboard, HERO_SCENARIOS } from "./components/Dashboard";
import { InvoiceDetailPage, type DetailStatus, type InvoiceEditSeed } from "./components/InvoiceDetailPage";
import { CreateSalesInvoice, CUSTOMERS, type Customer } from "./components/CreateSalesInvoice";
import { AddInvoiceDetails } from "./components/AddInvoiceDetails";
import { SalesInvoiceList } from "./components/SalesInvoiceList";
import { NeedAttention } from "./components/NeedAttention";
import { DuplicateDecision } from "./components/DuplicateDecision";
import { UploadInvoice } from "./components/UploadInvoice";
import { GeneratingInvoice } from "./components/GeneratingInvoice";
import { DEMO_EXTRACTION, DEMO_EXTRACTION_MATCHED, BLANK_EXTRACTION, EXISTING_INVOICES, type ExtractedInvoice, type ExistingInvoice } from "./components/extractInvoice";

type Screen = "dashboard" | "list" | "customer" | "details" | "upload" | "extracting" | "send" | "invoiceDetail" | "needAttention" | "duplicateCheck";

/** OCR steps shown while an uploaded invoice is being read. */
const OCR_STEPS = [
  "Uploading your document…",
  "Reading the invoice…",
  "Extracting line items…",
  "Almost done…",
];

/** Top-level navigation sections (the create flow lives under "Create Sales Invoice"). */
const NAV: { id: Screen; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "list", label: "Invoice List" },
  { id: "customer", label: "Create Sales Invoice" },
  { id: "send", label: "Send Sheet" },
];

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
      {/* Expanding page list */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            style={{ transformOrigin: "0% 100%" }}
            className="flex flex-col gap-1 bg-white rounded-2xl p-2 shadow-xl border border-black/5 max-h-[70vh] overflow-y-auto"
          >
            {NAV.map((page) => (
              <div key={page.id} className="flex flex-col gap-1">
                <button
                  onClick={() => {
                    // Dashboard always defaults back to Happy path; its hero variants are nested below.
                    if (page.id === "dashboard") onScenario(0);
                    onChange(page.id);
                    setOpen(false);
                  }}
                  className={`px-4 py-2.5 rounded-xl text-left text-[13px] font-medium whitespace-nowrap transition-colors ${
                    active === page.id ? "bg-[#1B1B1B] text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                  }`}
                >
                  {page.label}
                </button>

                {/* Dashboard hero demo states — nested under Dashboard */}
                {page.id === "dashboard" &&
                  HERO_SCENARIOS.map((s, i) => (
                    <button
                      key={s.label}
                      onClick={() => {
                        onScenario(i);
                        onChange("dashboard");
                        setOpen(false);
                      }}
                      className={`ml-3 pl-4 py-2 rounded-xl text-left text-[12px] font-medium whitespace-nowrap border-l border-gray-200 transition-colors ${
                        active === "dashboard" && scenario === i
                          ? "text-[#ff4a15]"
                          : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
              </div>
            ))}
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
  const [openInvoice, setOpenInvoice] = useState<{ number: string; client: string; status: DetailStatus; origin: "created" | "uploaded" }>({
    number: "INV-2026-00042",
    client: "Marlow & Finch Studio",
    status: "Awaiting",
    origin: "created",
  });
  // Prefill payload when editing an existing invoice (null = fresh create flow).
  const [editInitial, setEditInitial] = useState<InvoiceEditSeed | null>(null);
  // The file picked in the upload flow — shown as an attachment on the review screen.
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null);
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
            setDetailReturn("dashboard");
            setScreen("invoiceDetail");
          }}
          onCreate={() => {
            setExtracted(null);
            setScreen("customer");
          }}
          onUpload={() => {
            setUploadReturn("dashboard");
            setScreen("upload");
          }}
        />
      )}

      {screen === "needAttention" && (
        <NeedAttention
          onBack={() => setScreen("dashboard")}
          onOpenInvoice={(inv) => {
            setOpenInvoice(inv);
            setDetailFlash(null);
            setDetailReturn("needAttention");
            setScreen("invoiceDetail");
          }}
        />
      )}

      {screen === "list" && (
        <SalesInvoiceList
          showSuccess={!!toast}
          successMessage={toast?.title}
          successSubtext={toast?.subtext}
          onSuccessDone={() => setToast(null)}
          recent={recent}
          initialStatus={listPreset?.status}
          onBack={() => setScreen("dashboard")}
          onOpenInvoice={(inv) => {
            setOpenInvoice(inv);
            setDetailFlash(null);
            setDetailReturn("list");
            setScreen("invoiceDetail");
          }}
          onManual={() => {
            setExtracted(null);
            setScreen("customer");
          }}
          onUpload={() => {
            setUploadReturn("list");
            setScreen("upload");
          }}
        />
      )}

      {screen === "invoiceDetail" && (
        <InvoiceDetailPage
          initialStatus={openInvoice.status}
          origin={openInvoice.origin}
          invoiceNo={openInvoice.number}
          customerName={openInvoice.client}
          flashToast={detailFlash ?? undefined}
          onBack={() => { setDetailFlash(null); setScreen(detailReturn); }}
          onEdit={(seed) => {
            setExtracted(null);
            setCustomer(seed.customer);
            setEditInitial(seed);
            setNumberRecommended(false);
            setEditFromDuplicate(false);
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
          onBack={() => setScreen(uploadReturn)}
          onContinue={(files) => {
            // Demo: a "blank/unreadable" file extracts nothing; an image scan resolves to a
            // known client (auto-matched); a PDF resolves to a new customer (no match → add new).
            if (files.some((f) => /blank|unreadable/i.test(f.name))) {
              setPendingExtraction(null);
            } else {
              const matched = files.some((f) => f.type.startsWith("image"));
              setPendingExtraction(matched ? DEMO_EXTRACTION_MATCHED : DEMO_EXTRACTION);
            }
            // Remember the uploaded file so the review can show it.
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
            // Exact-duplicate check: a matching existing DRAFT → show the decision page first.
            const dup = ex.invoiceNumber.trim()
              ? EXISTING_INVOICES.find(
                  (i) => i.number.toLowerCase() === ex.invoiceNumber.trim().toLowerCase() && i.status === "Draft"
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
          onBack={() => setScreen(uploadReturn)}
          onEditExisting={() => {
            // Open the existing draft's editor and keep editing it (existing draft unchanged otherwise).
            const inv = dupExisting;
            const cust = CUSTOMERS.find((c) => c.name === inv.customer) ?? { id: "existing", name: inv.customer, email: "" };
            setExtracted(null);
            setUploadedFile(null);
            setNumberRecommended(false);
            setEditFromDuplicate(true);
            setCustomer(cust);
            setEditInitial({ customer: cust, invoiceNo: inv.number, currency: inv.currency, services: [], limited: false });
            setOpenInvoice({ number: inv.number, client: inv.customer, status: "Draft", origin: "uploaded" });
            setDetailReturn("list");
            setScreen("details");
          }}
          onCreateNew={() => {
            // New draft from the OCR data, with a freshly generated (unique) invoice number.
            const nums = EXISTING_INVOICES.map((i) => parseInt(i.number.split("-").pop() || "0", 10)).filter((n) => !Number.isNaN(n));
            const next = (nums.length ? Math.max(...nums) : 0) + 1;
            const newNo = `INV-2026-${String(next).padStart(5, "0")}`;
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
          extracted={extracted}
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
              : inv.status === "Void" ? "Void"
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
          extracted={null}
          autoOpenSend
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

      <QuickNav current={screen} onChange={setScreen} scenario={heroScenario} onScenario={setHeroScenario} />
    </div>
  );
}
