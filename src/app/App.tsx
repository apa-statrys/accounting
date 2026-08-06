import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, ChevronRight } from "lucide-react";
import { QuickNavSidebar, type SidebarGroup } from "./components/QuickNavSidebar";
import { DevInspector } from "./components/DevInspector";
import { Dashboard } from "./pages/Dashboard";
import { AccountingHub } from "./pages/AccountingHub";
import { CreditNotesList } from "./pages/credit-note-list/CreditNotesList";
import { CustomerList } from "./pages/CustomerList";
import { CustomerDetailPage } from "./pages/CustomerDetailPage";
import { AddCustomerPage } from "./pages/AddCustomerPage";
import { CREDIT_NOTES } from "./data/creditNotes";
import { INVOICES } from "./data/invoices";
import { fmtDate } from "./lib/format";
import { FONT } from "./lib/theme";
import { pathForScreen, screenForPath } from "./lib/routes";
import { InvoiceDetailPage } from "./pages/invoice-detail/InvoiceDetailPage";
import { CreditNoteForm } from "./pages/credit-note-form/CreditNoteForm";
import { CreateSalesInvoice } from "./pages/CreateSalesInvoice";
import { AddInvoiceDetails } from "./pages/add-invoice-details/AddInvoiceDetails";
import { LockedPeriodBanner } from "./pages/locked-period/LockedPeriodBanner";
import { SalesInvoiceList } from "./pages/sales-invoice-list/SalesInvoiceList";
import type { ToastVariant } from "./ui/ToastMessage";
import type { StatusMatch } from "./pages/sales-invoice-list/filters";
import { TODAY_ISO } from "./pages/sales-invoice-list/filters";
import { NeedAttention } from "./pages/NeedAttention";
import { DuplicateDecision } from "./pages/DuplicateDecision";
import { InvoiceSettings } from "./pages/InvoiceSettings";
import { GeneratingInvoice } from "./pages/GeneratingInvoice";
import { ScanDocument } from "./components/ScanDocument";
import { UploadErrorDialog } from "./components/UploadErrorDialog";
import { DEMO_EXTRACTION, DEMO_EXTRACTION_MATCHED, DEMO_EXTRACTION_NO_CUSTOMER, BLANK_EXTRACTION, EXISTING_INVOICES } from "./data/extraction";
import { CUSTOMERS } from "./data/customers";
import { DEFAULT_SETTINGS } from "./data/settings";
import { HERO_SCENARIOS } from "./data/heroScenarios";
import type { Screen, Customer, DetailStatus, InvoiceEditSeed, InvoiceLine, CompanySettings, ExtractedInvoice, ExistingInvoice, CNStatus, EntityKind, NewFlag } from "./types";

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

/** Demo line items + invoice context for previewing the standalone Credit Note form. */
const CREDIT_NOTE_ITEMS: InvoiceLine[] = [
  { name: "Brand identity design", qty: 1, unit: "service", unitPrice: 4200, amount: 4200 },
  { name: "Landing page build", qty: 1, unit: "service", unitPrice: 1800, amount: 1800 },
  { name: "Consulting", qty: 6, unit: "hours", unitPrice: 75, amount: 450 },
];
const CREDIT_NOTE_TOTAL = 6450;

/** Demo customer + line items for previewing the Send (Delivery method) sheet directly. */
const DEMO_CUSTOMER: Customer = { id: "marlow", name: "Marlow & Finch Studio", email: "finch@studio.com" };

const SLIDE_TRANSITION = { type: "tween" as const, duration: 0.32, ease: [0.4, 0, 0.2, 1] as const };

/**
 * Push/pop screen-transition slide (direction-aware — see `navDirection`/`navDepth` in App).
 * Only the screen "on top" of the stack moves; the one underneath sits still and just gets
 * covered/revealed — a real stacked push/pop (like iOS), not two screens sliding past each other.
 * `zIndex` (set per-screen from the visited-screen stack depth, not from these variants) is what
 * keeps the right one on top: forward pushes a higher zIndex in on top of the current one, back
 * pops down to a screen whose zIndex was already lower than the one sliding away.
 *  - forward (push): the incoming (higher-zIndex) screen slides in from the right over a static
 *    outgoing screen underneath, which holds still until it's fully covered, then unmounts.
 *  - back (pop): the outgoing (higher-zIndex) screen — the one being left — slides out to the
 *    right, uncovering a static screen underneath that was there the whole time (no slide-in).
 */
const SCREEN_SLIDE = {
  enter: (direction: "forward" | "back") => ({ x: direction === "back" ? 0 : "100%" }),
  center: { x: 0, transition: SLIDE_TRANSITION },
  exit: (direction: "forward" | "back") => ({
    // The covered screen (forward) is meant to just sit still while the incoming one slides over
    // it, staying mounted+visible for the full transition instead of disappearing right away — but
    // an exit target IDENTICAL to `center`'s x:0 has no value to animate, so Motion resolves it
    // (and unmounts the screen) on the very next tick regardless of `transition.duration`. A
    // fraction-of-a-pixel offset keeps it a real animation (and the screen mounted + visible) for
    // the intended duration, while staying visually indistinguishable from "not moving at all."
    x: direction === "back" ? "100%" : "-0.01%",
    transition: SLIDE_TRANSITION,
  }),
};

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
  // Initial screen comes from the URL path (shallow routing, see lib/routes.ts) so a shared/
  // refreshed link lands on the right screen — just not with the same invoice/customer open.
  const [screen, setScreen] = useState<Screen>(() => screenForPath(window.location.pathname));

  // Keeps the address bar in sync with `screen` — every one of the ~100 `setScreen` call sites
  // across this file stays untouched, since this observes the state instead of wrapping the
  // setter. Skips the very first run (the initial screen already came FROM the path above; no
  // need to push a redundant history entry for it).
  const isFirstPathSync = useRef(true);
  useEffect(() => {
    const path = pathForScreen(screen);
    if (isFirstPathSync.current) {
      isFirstPathSync.current = false;
      if (window.location.pathname !== path) window.history.replaceState(null, "", path);
      return;
    }
    if (window.location.pathname !== path) window.history.pushState(null, "", path);
  }, [screen]);

  // Browser back/forward buttons — reads the path popstate landed on and syncs `screen` to match.
  useEffect(() => {
    const onPopState = () => setScreen(screenForPath(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Slide-transition direction (native-app push/pop feel): forward navigation slides the new
  // screen in from the right, back navigation slides it in from the left. There's no single
  // `navigate`/`goBack` call site to read this off directly (every screen wires its own onSelect/
  // onBack straight to `setScreen`), so it's inferred from a simple visited-screen stack — if the
  // incoming screen is already in the stack, it's a "pop" back to that point; otherwise it's a
  // "push". Computed inline during render (not an effect) so the direction is known in time for
  // the very same transition it describes.
  const screenHistoryRef = useRef<Screen[]>(["dashboard"]);
  const prevScreenRef = useRef<Screen>("dashboard");
  const navDirectionRef = useRef<"forward" | "back">("forward");
  if (screen !== prevScreenRef.current) {
    const stack = screenHistoryRef.current;
    const idx = stack.lastIndexOf(screen);
    if (idx !== -1 && idx < stack.length - 1) {
      navDirectionRef.current = "back";
      screenHistoryRef.current = stack.slice(0, idx + 1);
    } else {
      navDirectionRef.current = "forward";
      screenHistoryRef.current = [...stack, screen];
    }
    prevScreenRef.current = screen;
  }
  const navDirection = navDirectionRef.current;
  // Stacking order for the slide: each screen's zIndex is its depth in the visited-screen stack
  // at the time it became current. A push always grows the stack (higher zIndex than whatever was
  // current before), so the newly-entering screen naturally lands above the one it's covering. A
  // pop truncates the stack back down to an earlier, already-lower zIndex, so the screen being left
  // (frozen at its own higher zIndex from when IT was current) stays on top while it slides away.
  const navDepth = screenHistoryRef.current.length;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [extracted, setExtracted] = useState<ExtractedInvoice | null>(null);
  // Dev-only: QuickNav "Create Invoice" seeds demo items so the editor lands fully pre-filled.
  const [devSeedItems, setDevSeedItems] = useState(false);
  // Extraction queued while the OCR screen plays (chosen from the upload source).
  // null = OCR found nothing usable (routes to the extract-failed screen).
  const [pendingExtraction, setPendingExtraction] = useState<ExtractedInvoice | null>(DEMO_EXTRACTION);
  // Toast shown on the list after returning from the create flow.
  const [toast, setToast] = useState<{ title: string; subtext?: string; variant?: ToastVariant } | null>(null);
  // Blocking notice for an upload that never reached OCR (file too large / unsupported type) —
  // a sheet (UploadErrorDialog) rather than a toast, so there's a clear "Choose Another File"
  // next step. `kind` disambiguates the two scenarios (their title copy is identical).
  const [uploadError, setUploadError] = useState<{ kind: "tooLarge" | "unsupportedType"; title: string; body: ReactNode } | null>(null);
  // Freshly created/saved invoice to surface at the top of the list (payload only — the pin/badge
  // lifecycle itself is driven entirely by `newFlag` below, not by this state).
  const [recent, setRecent] = useState<{ client: string; amount: string; status: "Awaiting" | "Draft" | "Paid"; meta: string; itemsCount?: number } | null>(null);
  // Freshly created/saved credit note (dev-flow only — Credit Notes List has no real backing array
  // to append into today, so this mirrors `recent`'s ephemeral-slot pattern for CreditNote).
  const [recentCn, setRecentCn] = useState<{ no: string; customer: string; amount: number; status: CNStatus; date: string } | null>(null);
  // Single app-wide "just created" flag — pins that one record to the top of its list and shows a
  // "New" badge for 5s, then both revert together in one step (one flag, one timer, never two
  // independent timeouts — see lib/pinNew.ts). Only one record is ever flagged app-wide at a time;
  // flagging a new one cancels the previous timer. `recent`/`recentCn` above keep the record showing
  // in the list at its natural sorted position long after the flag clears.
  const [newFlag, setNewFlag] = useState<NewFlag>(null);
  const newFlagTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flagNew = (kind: EntityKind, id: string) => {
    if (newFlagTimerRef.current) clearTimeout(newFlagTimerRef.current);
    setNewFlag({ kind, id });
    newFlagTimerRef.current = setTimeout(() => setNewFlag(null), 5000);
  };
  // The invoice opened into the detail page (status drives the lifecycle UI).
  const [openInvoice, setOpenInvoice] = useState<{ number: string; client: string; status: DetailStatus; origin: "created" | "uploaded"; cnNo?: string; cnAmount?: number; cnSent?: boolean; cnDraft?: boolean; cnAwaiting?: boolean; viewCn?: boolean; itemsCount?: number }>({
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
  // Where "Upload" was triggered from — real picker is native now, so this is only used to send
  // the user back to the right screen (DuplicateDecision's back arrow, "Upload a clearer file").
  const [uploadReturn, setUploadReturn] = useState<"dashboard" | "list">("list");
  // Kick off the upload/OCR simulation once a file's been "captured" — jumps straight to the
  // "reading" step with a demo file already returned by the scanner/picker. The Dashboard/List
  // "Upload Invoice" entry points reach this via CreateInvoiceSheet's own ScanDocument; every
  // in-flow "Re-upload"/"Replace" action (DuplicateDecision, AddInvoiceDetails) reaches it via
  // the standalone scanner below instead of skipping straight past it.
  const startUpload = () => {
    setCustomer(null); // customer comes from OCR — don't carry a previously-selected one in
    setPendingExtraction(DEMO_EXTRACTION);
    setUploadedFile({ name: "invoice.pdf", size: 419430 });
    setScreen("extracting");
  };
  // Standalone scanner overlay for in-flow "Re-upload"/"Replace" actions (DuplicateDecision,
  // AddInvoiceDetails) — unlike the FAB's Create-Invoice chooser, there's no sheet to host
  // ScanDocument here, so it's mounted once at the root and toggled directly.
  const [reuploadScanOpen, setReuploadScanOpen] = useState(false);
  const openReuploadScanner = () => setReuploadScanOpen(true);
  // Where the full-page Add Customer returns: the Customers list, or the invoice customer picker.
  const [addCustomerReturn, setAddCustomerReturn] = useState<"customers" | "customer">("customers");
  // Preset/remembered status tab for the Sales Invoice List — set by a dashboard hero stat, and kept
  // in sync as the user switches tabs so the tab is restored when returning (e.g. back from a detail).
  const [listPreset, setListPreset] = useState<{ status?: StatusMatch } | null>(null);
  // Create Locked-Period demo: whether the Issue Date calendar is open — swaps the beside-frame
  // annotation from the "Click Here" arrow (closed) to the locked-dates explanation (open).
  const [lockedIssueSheetOpen, setLockedIssueSheetOpen] = useState(false);
  // Dev: which hero demo state the dashboard renders (switched from QuickNav).
  const [heroScenario, setHeroScenario] = useState(0);
  // Dev: QuickNav "Send Invoice — Failed" — forces the Send Invoice sheet's send action to fail.
  const [sendFailScenario, setSendFailScenario] = useState(false);
  // Dev: QuickNav zero-data empty states (Figma "All Invoices"/"Customer List", nodes
  // 2070-19191/2071-19448) — no real flow ever empties either demo register.
  const [forceEmptyInvoices, setForceEmptyInvoices] = useState(false);
  const [forceEmptyCustomers, setForceEmptyCustomers] = useState(false);
  // Dev: QuickNav "Select Customer — No Frequently Used" — no real flow ever empties FREQUENT_IDS.
  const [forceNoFrequentCustomers, setForceNoFrequentCustomers] = useState(false);
  // Dev sidebar deep link: CN detail to open when jumping to the Credit Notes list (null = plain list).
  const [cnPreview, setCnPreview] = useState<string | null>(null);
  // Bumped on every sidebar detail jump so the detail page remounts (fresh state) even when
  // the invoice number/status don't change. In-page actions never bump it.
  const [detailNavNonce, setDetailNavNonce] = useState(0);

  // QuickNav jumps straight to a deep screen, skipping whatever it would normally take to get
  // there — so a screen's own Back button (hardcoded to a specific target elsewhere in this file)
  // can find its target missing from the visited-screen stack and misread a real "back" tap as a
  // "forward" push (slide-in instead of slide-out). Call this with the chain of screens between
  // dashboard (always safely on the stack already) and the jump target, in order, before setScreen
  // — e.g. seedHistory("hub", "customers") before jumping straight to "customerDetail", whose own
  // Back targets "customers", whose own Back targets "hub". Skip a link already safe on its own
  // (its target is "dashboard", the permanent stack root) — that's most of them.
  const seedHistory = (...path: Screen[]) => {
    let stack = screenHistoryRef.current;
    for (const s of path) {
      if (stack[stack.length - 1] !== s) stack = [...stack, s];
    }
    screenHistoryRef.current = stack;
  };

  // Sidebar deep link: open the invoice detail seeded with a register demo invoice.
  const jumpDetail = (
    inv: { number: string; client: string; status: DetailStatus; origin?: "created" | "uploaded"; cnNo?: string; cnAmount?: number; cnSent?: boolean; cnDraft?: boolean; cnAwaiting?: boolean },
    viewCn = false
  ) => {
    setOpenInvoice({ origin: "created", ...inv, viewCn });
    setDetailFlash(null);
    setEditFromDuplicate(false);
    // Back from any QuickNav-opened detail lands on the full (unfiltered) invoice list.
    setListPreset(null);
    setDetailReturn("list");
    // InvoiceDetailPage's own Back always targets "list", which itself targets "dashboard" (the
    // permanent stack root) — one link is enough here.
    seedHistory("list");
    setDetailNavNonce((n) => n + 1);
    setScreen("invoiceDetail");
  };

  // Open a credit note's related invoice from its detail (the Related Invoice row's arrow). `returnScreen`
  // is where Back lands — the CN screen it was opened from (regular list or a locked-period preview).
  const openCnRelatedInvoice = (no: string, returnScreen: Screen) => {
    const inv = INVOICES.find((i) => i.id === no || i.id.startsWith(no));
    if (!inv) return;
    setOpenInvoice({
      number: no,
      client: inv.client,
      status: inv.status as DetailStatus,
      origin: (inv.origin as "created" | "uploaded") ?? "created",
      cnNo: inv.cnNo, cnAmount: inv.cnAmount, cnSent: inv.cnSent,
    });
    setDetailFlash(null);
    setEditFromDuplicate(false);
    setDetailReturn(returnScreen);
    setScreen("invoiceDetail");
  };

  // Dev-only QuickNav sidebar groups (stakeholder demos) — labels + jump wiring per the 2026-07-15 spec.
  const sidebarGroups: SidebarGroup[] = [
    {
      title: "Dashboard",
      items: [
        ...HERO_SCENARIOS.map((s, i) => ({
          label: s.label,
          active: screen === "dashboard" && heroScenario === i,
          onSelect: () => { setHeroScenario(i); setScreen("dashboard"); },
        })),
      ],
    },
    {
      title: "Customer",
      items: [
        { label: "Customer List", active: screen === "customers" && !forceEmptyCustomers, onSelect: () => { setForceEmptyCustomers(false); seedHistory("hub"); setScreen("customers"); } },
        { label: "Customer List — Empty", active: screen === "customers" && forceEmptyCustomers, onSelect: () => { setForceEmptyCustomers(true); seedHistory("hub"); setScreen("customers"); } },
        { label: "Add New Customer", active: screen === "addCustomer", onSelect: () => { setAddCustomerReturn("customers"); seedHistory("hub", "customers"); setScreen("addCustomer"); } },
        { label: "Customer Details", active: screen === "customerDetail", onSelect: () => { setSelectedCustomer(customers[0]); setCustomerFlash(null); seedHistory("hub", "customers"); setScreen("customerDetail"); } },
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
      // Core flow only — the 4 primary happy-path actions stay flat (no expanding needed) so
      // they're the first thing a dev/PO sees; every edge case and status variant lives in its
      // own labeled, collapsible section below (2026-08-02 reorg — this group had grown to 20
      // flat-ish rows and was hard to scan for handoff).
      items: [
        // Clear any pending toast so the dev jump never lands with a stale "Saved as draft" flash.
        { label: "Sales Invoice List", active: screen === "list" && !forceEmptyInvoices, onSelect: () => { setToast(null); setListPreset(null); setForceEmptyInvoices(false); setScreen("list"); } },
        { label: "Sales Invoice List — Empty", active: screen === "list" && forceEmptyInvoices, onSelect: () => { setToast(null); setListPreset(null); setForceEmptyInvoices(true); setScreen("list"); } },
        // Select Customer is step 1 of Create Invoice (happens before the editor) — placed above it.
        { label: "Select Customer", active: screen === "customer" && !forceNoFrequentCustomers, onSelect: () => { setForceNoFrequentCustomers(false); seedHistory("list"); setScreen("customer"); } },
        { label: "Select Customer — No Frequently Used", active: screen === "customer" && forceNoFrequentCustomers, onSelect: () => { setForceNoFrequentCustomers(true); seedHistory("list"); setScreen("customer"); } },
        // Dev jump lands on the pre-filled editor (demo customer + demo items), not the picker (user, 15/Jul).
        { label: "Create Invoice", active: screen === "customer" || screen === "details", onSelect: () => { setExtracted(null); setCustomer(DEMO_CUSTOMER); setDevSeedItems(true); setEditInitial(null); setNumberRecommended(false); setEditFromDuplicate(false); setScreen("details"); } },
        { label: "Send Invoice", active: screen === "send" && !sendFailScenario, onSelect: () => { setSendFailScenario(false); setScreen("send"); } },
        { label: "Send Invoice — Failed", active: screen === "send" && sendFailScenario, onSelect: () => { setSendFailScenario(true); setScreen("send"); } },
        // Upload is native scan/picker now (no in-app sheet) — dev jump reproduces what a real
        // pick hands back: straight to the "reading your invoice" loading step.
        { label: "Upload Invoice", active: screen === "extracting", onSelect: () => { setUploadReturn("list"); startUpload(); } },
      ],
      sections: [
        {
          // Accounting-period-closed edge cases, grouped together rather than interleaved with
          // the create/upload happy paths above.
          heading: "Locked Period",
          items: [
            { label: "Create (Locked Period)", active: screen === "lockedPeriodDialog", onSelect: () => setScreen("lockedPeriodDialog") },
            { label: "Upload (Locked Period)", active: screen === "lockedPeriodUpload", onSelect: () => setScreen("lockedPeriodUpload") },
          ],
        },
        {
          // Upload scenario shortcuts (jump straight to each OCR outcome, skipping the native picker).
          heading: "Upload Scenarios",
          items: [
            { label: "Upload — Error (Too Large)", active: screen === "list" && uploadError?.kind === "tooLarge", onSelect: () => { setUploadError(null); setScreen("list"); setUploadError({ kind: "tooLarge", title: "Unsupported file format", body: <>This file can’t be uploaded. Please upload your invoice as a PDF, JPG, JPEG, or PNG file up to <strong>5 MB</strong>.</> }); } },
            { label: "Upload — Error (Unsupported Type)", active: screen === "list" && uploadError?.kind === "unsupportedType", onSelect: () => { setUploadError(null); setScreen("list"); setUploadError({ kind: "unsupportedType", title: "Unsupported file format", body: "This file can’t be uploaded. Please upload your invoice as a PDF, JPG, JPEG, or PNG." }); } },
            { label: "Upload — Duplicate", active: screen === "duplicateCheck", onSelect: () => { setPendingExtraction(DEMO_EXTRACTION_MATCHED); setExtracted(DEMO_EXTRACTION_MATCHED); setEditInitial(null); setNumberRecommended(false); setEditFromDuplicate(false); setUploadedFile({ name: "invoice-scan.png", size: 1258291 }); setDupExisting(EXISTING_INVOICES.find((i) => i.number === DEMO_EXTRACTION_MATCHED.invoiceNumber) ?? null); setScreen("duplicateCheck"); } },
            { label: "Upload — Manual Entry Needed", active: screen === "details" && extracted === DEMO_EXTRACTION_NO_CUSTOMER, onSelect: () => { setPendingExtraction(DEMO_EXTRACTION_NO_CUSTOMER); setExtracted(DEMO_EXTRACTION_NO_CUSTOMER); setEditInitial(null); setNumberRecommended(false); setEditFromDuplicate(false); setUploadedFile({ name: "invoice.pdf", size: 419430 }); setScreen("details"); } },
            { label: "Upload — Unreadable (Blank)", active: screen === "details" && extracted === BLANK_EXTRACTION, onSelect: () => { setPendingExtraction(null); setExtracted(BLANK_EXTRACTION); setEditInitial(null); setNumberRecommended(false); setEditFromDuplicate(false); setUploadedFile({ name: "invoice-unreadable.jpg", size: 3565158 }); setScreen("details"); } },
          ],
        },
        // Invoice Detail split by lifecycle stage (2026-08-02 reorg) rather than one flat 11-item
        // section — Draft → Unpaid (awaiting/overdue/partial) → Paid & Closed (paid, refund
        // lifecycle, void). Each opens a matching register demo invoice.
        {
          heading: "Invoice Detail — Draft",
          items: [
            { label: "Draft (Created)", active: screen === "invoiceDetail" && openInvoice.number === "INV-2026-000003" && openInvoice.origin === "created", onSelect: () => jumpDetail({ number: "INV-2026-000003", client: "Bright Harbor Co.", status: "Draft", origin: "created" }) },
            { label: "Draft (Uploaded)", active: screen === "invoiceDetail" && openInvoice.number === "INV-2026-000003" && openInvoice.origin === "uploaded", onSelect: () => jumpDetail({ number: "INV-2026-000003", client: "Bright Harbor Co.", status: "Draft", origin: "uploaded" }) },
          ],
        },
        {
          heading: "Invoice Detail — Unpaid",
          items: [
            { label: "Awaiting Payment", active: screen === "invoiceDetail" && openInvoice.number === "INV-2026-000004", onSelect: () => jumpDetail({ number: "INV-2026-000004", client: "Marlow & Finch Studio", status: "Awaiting" }) },
            { label: "Awaiting (Locked Period)", active: screen === "lockedPeriodEditInvoice", onSelect: () => setScreen("lockedPeriodEditInvoice") },
            { label: "Overdue + 1 Applied CN", active: screen === "invoiceDetail" && openInvoice.number === "INV-2026-000010", onSelect: () => jumpDetail({ number: "INV-2026-000010", client: "Harbor & Co.", status: "Overdue", cnNo: "CN-2026-000003", cnAmount: 2000, cnSent: true }) },
            { label: "Partially Paid", active: screen === "invoiceDetail" && openInvoice.number === "INV-2026-000014", onSelect: () => jumpDetail({ number: "INV-2026-000014", client: "Verde Coffee Roasters", status: "PartiallyPaid" }) },
          ],
        },
        {
          heading: "Invoice Detail — Paid & Closed",
          items: [
            { label: "Paid", active: screen === "invoiceDetail" && openInvoice.number === "INV-2026-000005", onSelect: () => jumpDetail({ number: "INV-2026-000005", client: "Atlas Logistics", status: "Paid" }) },
            { label: "Paid (Locked Period)", active: screen === "lockedPeriodPaid", onSelect: () => setScreen("lockedPeriodPaid") },
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
        { label: "Credit Note List", active: screen === "creditNotes" && cnPreview === null, onSelect: () => { setCnPreview(null); seedHistory("hub"); setScreen("creditNotes"); } },
      ],
      sections: [
        {
          heading: "Unpaid Invoice",
          items: [
            { label: "Create Credit Note", active: screen === "creditNote", onSelect: () => setScreen("creditNote") },
            { label: "CN Detail — Draft", active: screen === "creditNotes" && cnPreview === "CN-2026-000005", onSelect: () => { setCnPreview("CN-2026-000005"); seedHistory("hub"); setScreen("creditNotes"); } },
            { label: "CN Detail — Draft (Locked Period)", active: screen === "lockedPeriodEditCn", onSelect: () => { seedHistory("hub"); setScreen("lockedPeriodEditCn"); } },
            { label: "CN Detail — Applied", active: screen === "creditNotes" && cnPreview === "CN-2026-000003", onSelect: () => { setCnPreview("CN-2026-000003"); seedHistory("hub"); setScreen("creditNotes"); } },
            { label: "CN-Applied (Locked Period)", active: screen === "lockedPeriodCnApplied", onSelect: () => { seedHistory("hub"); setScreen("lockedPeriodCnApplied"); } },
            { label: "CN Detail — Cancelled", active: screen === "creditNotes" && cnPreview === "CN-2026-000009", onSelect: () => { setCnPreview("CN-2026-000009"); seedHistory("hub"); setScreen("creditNotes"); } },
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
            { label: "Refund CN — Draft (Locked Period)", active: screen === "lockedPeriodRefundDraft", onSelect: () => setScreen("lockedPeriodRefundDraft") },
            {
              label: "Refund CN — Applied",
              active: screen === "invoiceDetail" && openInvoice.number === "INV-2026-000015" && !openInvoice.cnDraft && !openInvoice.cnAwaiting && !refundState["INV-2026-000015"],
              onSelect: () => {
                setRefundState(({ ["INV-2026-000015"]: _drop, ...rest }) => rest);
                jumpDetail({ number: "INV-2026-000015", client: "Solstice Media", status: "Paid", cnNo: "CN-2026-000007", cnAmount: 6450, cnSent: false }, true);
              },
            },
            { label: "Refund CN — Applied (Locked Period)", active: screen === "lockedPeriodRefundApplied", onSelect: () => setScreen("lockedPeriodRefundApplied") },
            {
              label: "Refund CN — Awaiting refund",
              active: screen === "invoiceDetail" && openInvoice.number === "INV-2026-000015" && !!openInvoice.cnAwaiting,
              onSelect: () => {
                setRefundState(({ ["INV-2026-000015"]: _drop, ...rest }) => rest);
                jumpDetail({ number: "INV-2026-000015", client: "Solstice Media", status: "Paid", cnNo: "CN-2026-000007", cnAmount: 6450, cnSent: false, cnAwaiting: true }, true);
              },
            },
            {
              // Payout settled (refundState=full) — the CN detail reads "Refunded".
              label: "Refund CN — Refunded",
              active: screen === "invoiceDetail" && openInvoice.number === "INV-2026-000015" && refundState["INV-2026-000015"] === "full",
              onSelect: () => {
                setRefundState((s) => ({ ...s, "INV-2026-000015": "full" }));
                jumpDetail({ number: "INV-2026-000015", client: "Solstice Media", status: "Paid", cnNo: "CN-2026-000007", cnAmount: 6450, cnSent: false }, true);
              },
            },
          ],
        },
      ],
    },
  ];

  return (
    <div className="mobile-mode min-h-screen bg-[#EDEDED] flex flex-col items-center justify-center gap-4 p-4">
      {/* Phone-frame-sized clipping box for the push/pop slide — each screen below already renders
          its own 375x812 rounded frame, so this just gives AnimatePresence somewhere to stack the
          outgoing (covered/revealed) screen underneath the incoming (moving) one. */}
      <div className="relative overflow-hidden" style={{ width: 375, height: 812 }}>
        <AnimatePresence initial={false} custom={navDirection}>
          <motion.div
            key={screen}
            custom={navDirection}
            variants={SCREEN_SLIDE}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0"
            style={{ zIndex: navDepth }}
          >
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
            setScreen("customer");
          }}
          onUpload={() => { setUploadReturn("dashboard"); startUpload(); }}
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
          recentCn={recentCn}
          newFlag={newFlag}
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
              cnNo: inv.cnNo, cnAmount: inv.cnAmount, cnSent: inv.cnSent,
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
          forceEmpty={forceEmptyCustomers}
          flash={customerFlash}
          newFlag={newFlag}
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
            flagNew("customer", cust.id);
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
            // Back while creating → save progress as a Draft (DES-719) and open the credit note's detail.
            onBack={() => jumpDetail({ number: "INV-2026-000007", client: "Northwind Traders", status: "Awaiting" })}
            onSaveDraft={(p) => {
              jumpDetail({ number: "INV-2026-000007", client: "Northwind Traders", status: "Awaiting", cnNo: "CN-2026-000001", cnAmount: p.amount, cnSent: false, cnDraft: true }, true);
              setDetailFlash("Saved as draft");
              setRecentCn({ no: "CN-2026-000099", customer: "Northwind Traders", amount: p.amount, status: "Draft", date: fmtDate(TODAY_ISO) });
              flagNew("creditNote", "CN-2026-000099");
            }}
            // Apply → open the related invoice's detail with the new credit note applied (full → Void).
            onCreate={(p) => {
              const full = p.amount >= CREDIT_NOTE_TOTAL - 0.001;
              jumpDetail({ number: "INV-2026-000007", client: "Northwind Traders", status: full ? "Cancelled" : "Awaiting", cnNo: "CN-2026-000001", cnAmount: p.amount, cnSent: false });
              setDetailFlash(full ? "Invoice voided with a credit note" : "Credit note applied");
              setRecentCn({ no: "CN-2026-000099", customer: "Northwind Traders", amount: p.amount, status: "Applied", date: fmtDate(TODAY_ISO) });
              flagNew("creditNote", "CN-2026-000099");
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
            // Back while creating → save progress as a Draft refund CN and open the credit note's detail.
            onBack={() => jumpDetail({ number: "INV-2026-000005", client: "Atlas Logistics", status: "Paid" })}
            onSaveDraft={(p) => {
              jumpDetail({ number: "INV-2026-000005", client: "Atlas Logistics", status: "Paid", cnNo: "CN-2026-000010", cnAmount: p.amount, cnSent: false, cnDraft: true }, true);
              setDetailFlash("Saved as draft");
              setRecentCn({ no: "CN-2026-000099", customer: "Atlas Logistics", amount: p.amount, status: "Draft", date: fmtDate(TODAY_ISO) });
              flagNew("creditNote", "CN-2026-000099");
            }}
            // Apply → open the related invoice's detail with the refund credit note applied (Pending Refund).
            onCreate={(p) => {
              jumpDetail({ number: "INV-2026-000005", client: "Atlas Logistics", status: "PendingRefund", cnNo: "CN-2026-000010", cnAmount: p.amount, cnSent: false });
              setDetailFlash("Refund credit note applied");
              setRecentCn({ no: "CN-2026-000099", customer: "Atlas Logistics", amount: p.amount, status: "Awaiting refund", date: fmtDate(TODAY_ISO) });
              flagNew("creditNote", "CN-2026-000099");
            }}
          />
        </div>
      )}

      {screen === "list" && (
        <SalesInvoiceList
          forceEmpty={forceEmptyInvoices}
          showSuccess={!!toast}
          successVariant={toast?.variant}
          successMessage={toast?.title}
          successSubtext={toast?.subtext}
          onSuccessDone={() => setToast(null)}
          recent={recent}
          newFlag={newFlag}
          initialStatus={listPreset?.status}
          onActiveStatusChange={(s) => setListPreset({ status: s === "all" ? undefined : s })}
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
            setScreen("customer");
          }}
          onUpload={() => { setUploadReturn("list"); startUpload(); }}
        />
      )}

      {screen === "invoiceDetail" && (
        <InvoiceDetailPage
          key={`${openInvoice.number}:${openInvoice.status}:${detailNavNonce}`}
          initialViewCn={!!openInvoice.viewCn}
          initialStatus={openInvoice.status}
          origin={openInvoice.origin}
          invoiceNo={openInvoice.number}
          customerName={openInvoice.client}
          itemsCount={openInvoice.itemsCount}
          customerEmail={CREDIT_NOTES.find((c) => c.no === openInvoice.cnNo)?.email}
          companyEmail={settings.email}
          dueDateLabel={(() => { const inv = INVOICES.find((i) => i.id === openInvoice.number); return inv?.due ? fmtDate(inv.due) : undefined; })()}
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
          // A detour from the duplicate-check decision (not the normal "tap a row" path) needs a
          // real back chevron — X reads as "close this flow", not "return to where I was".
          backChevron={detailReturn === "duplicateCheck"}
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

      {/* OCR / extraction step after an upload — real entry points (Dashboard/List "Upload") skip
          straight here with a demo file, same as a real native picker would already have returned
          one; only QuickNav's per-scenario shortcuts skip this loading step entirely. */}
      {screen === "extracting" && (
        <GeneratingInvoice
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
          onBack={() => setScreen(uploadReturn)}
          onReupload={openReuploadScanner}
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
            // A detour from the duplicate check, not the normal list — back returns HERE, not to
            // the list (see the invoiceDetail render's backChevron prop for the header side of this).
            const inv = dupExisting;
            const status: DetailStatus = inv.status === "Paid" ? "Paid" : inv.status === "Draft" ? "Draft" : "Awaiting";
            setOpenInvoice({ number: inv.number, client: inv.customer, status, origin: "uploaded" });
            setDetailFlash(null);
            setEditFromDuplicate(false);
            setDetailReturn("duplicateCheck");
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
          newFlag={newFlag}
          forceNoFrequent={forceNoFrequentCustomers}
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
          key={devSeedItems ? "dev-prefilled" : extracted === DEMO_EXTRACTION_NO_CUSTOMER ? "upload-manual" : extracted === BLANK_EXTRACTION ? "upload-blank" : extracted === DEMO_EXTRACTION_MATCHED ? "upload-matched" : "editor"}
          seedServices={devSeedItems ? DEMO_EXTRACTION.services : undefined}
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
          onReupload={openReuploadScanner}
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
            if (r) flagNew("invoice", "recent-new");
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
            if (draft) flagNew("invoice", "recent-new");
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
          forceSendError={sendFailScenario}
          defaultChaser={settings.chaserEnabled}
          defaultAccountId={settings.paymentMethod}
          seedServices={DEMO_EXTRACTION.services}
          onClose={() => setScreen("list")}
          onChangeCustomer={() => setScreen("customer")}
          onSend={(t, r) => {
            setToast(t ?? { title: "Invoice marked as sent" });
            setRecent(r ?? null);
            if (r) flagNew("invoice", "recent-new");
            setScreen("list");
          }}
          onSendLater={() => setScreen("list")}
          onSaveDraft={(draft) => {
            setToast({ title: "Saved as draft" });
            setRecent(draft ? { ...draft, status: "Draft" } : null);
            if (draft) flagNew("invoice", "recent-new");
            setScreen("list");
          }}
        />
      )}


      {/* Locked Period — "closed accounting period" on the Create Invoice flow: the same top alert
          banner as the upload demo, the Issue Date defaults to the first open day (1 Jan 2027), and
          the calendar disables any date in the closed period (with a warning helper). */}
      {screen === "lockedPeriodDialog" && (
        <AddInvoiceDetails
          key="locked-period-demo"
          lockExceptIssueDate
          customer={DEMO_CUSTOMER}
          customers={customers}
          seedServices={DEMO_EXTRACTION.services}
          companyName={settings.companyName}
          companyEmail={settings.email}
          defaultCurrency="USD"
          defaultChaser={settings.chaserEnabled}
          defaultAccountId={settings.paymentMethod}
          seedIssueDate={new Date(2027, 0, 1)}
          issueMinDate={new Date(2027, 0, 1)}
          issueSheetHelperTitle="Accounting period closed"
          issueSheetHelper="Dates on or before 31 Dec 2026 aren't available."
          lockActions
          onIssueSheetToggle={setLockedIssueSheetOpen}
          onClose={() => setScreen("dashboard")}
          onChangeCustomer={() => {}}
        />
      )}

      {/* Locked Period — "closed accounting period" on the Upload Invoice flow: the review screen
          shows the amber alert at the top (in place of the OCR coverage banner) and the Issue Date
          reads a muted "Select issue date" placeholder because the extracted date (May 2025) falls
          in the closed period and must be re-picked from the locked calendar before proceeding. */}
      {screen === "lockedPeriodUpload" && (
        <AddInvoiceDetails
          key="locked-period-upload-demo"
          customer={DEMO_CUSTOMER}
          customers={customers}
          extracted={{ ...DEMO_EXTRACTION, customerEmail: "daniel.smith@example.com", emailNotFound: false, issueDate: new Date(2027, 0, 1) }}
          uploadedFile={uploadedFile}
          companyName={settings.companyName}
          companyEmail={settings.email}
          defaultCurrency="USD"
          defaultChaser={settings.chaserEnabled}
          defaultAccountId={settings.paymentMethod}
          headerTitle="Upload Invoice"
          topBanner={<LockedPeriodBanner body="Invoices dated on or before 31 Dec 2026 can’t be uploaded because this period has been closed." showContact={false} />}
          issuePlaceholder="Select issue date"
          issueMinDate={new Date(2027, 0, 1)}
          issueSheetHelperTitle="Accounting period closed"
          issueSheetHelper="Dates on or before 31 Dec 2026 aren't available."
          // Lock every interaction except the Issue Date row + the header Back; the Create Invoice CTA
          // stays live so the user can re-issue once a valid (unlocked) date is picked.
          lockExceptIssueDate
          onSend={(t, r) => {
            setToast(t ?? { title: "Invoice created successfully" });
            setRecent(r ?? null);
            if (r) flagNew("invoice", "recent-new");
            setScreen("list");
          }}
          onClose={() => setScreen("dashboard")}
          onChangeCustomer={() => {}}
        />
      )}

      {/* Locked Period — Draft credit note in a closed accounting period: the CN detail opens first
          (Draft CN preview); tapping "Edit" surfaces the locked-period dialog instead of the form. */}
      {screen === "lockedPeriodEditCn" && (
        <CreditNotesList
          key="locked-period-editcn-demo"
          initialPreviewNo="CN-2026-000005"
          companyEmail={settings.email}
          lockedPeriod
          onOpenInvoice={(no) => openCnRelatedInvoice(no, "lockedPeriodEditCn")}
          onBack={() => setScreen("dashboard")}
        />
      )}

      {/* Locked Period — Applied credit note in a closed accounting period: the CN detail opens first
          (Applied CN preview); "Cancel credit note" (⋯ menu) surfaces the locked-period dialog. */}
      {screen === "lockedPeriodCnApplied" && (
        <CreditNotesList
          key="locked-period-cnapplied-demo"
          initialPreviewNo="CN-2026-000003"
          companyEmail={settings.email}
          lockedPeriod
          onOpenInvoice={(no) => openCnRelatedInvoice(no, "lockedPeriodCnApplied")}
          onBack={() => setScreen("dashboard")}
        />
      )}

      {/* Locked Period — "Invoice Draft" in a closed accounting period: a normal Draft invoice detail
          where "Send invoice" (dock) and "Edit invoice" (⋯ menu) open the locked-period dialog. */}
      {/* Locked Period — "Edit Invoice" on an Awaiting Payment invoice in a closed accounting period:
          the normal detail page, but "Edit invoice" (⋯ menu) opens the locked-period dialog. */}
      {screen === "lockedPeriodEditInvoice" && (
        <InvoiceDetailPage
          key="locked-period-editinvoice-demo"
          initialStatus="Awaiting"
          invoiceNo="INV-2026-000004"
          customerName="Marlow & Finch Studio"
          companyEmail={settings.email}
          lockedPeriod
          // Back arrow is locked on this demo — the invoice is in a closed period, so no exit navigation.
          onBack={() => {}}
        />
      )}

      {/* Locked Period — a Paid invoice in a closed accounting period: "Refund with Credit Note"
          (⋯ menu) opens the locked-period dialog instead of the refund form. */}
      {screen === "lockedPeriodPaid" && (
        <InvoiceDetailPage
          key="locked-period-paid-demo"
          initialStatus="Paid"
          invoiceNo="INV-2026-000005"
          customerName="Atlas Logistics"
          companyEmail={settings.email}
          lockedPeriod
          // Back arrow is locked on this demo — the invoice is in a closed period, so no exit navigation.
          onBack={() => {}}
        />
      )}

      {/* Locked Period — a Draft refund credit note in a closed period: the refund CN detail opens
          first (overlaid on its Paid invoice); tapping "Edit" surfaces the locked-period dialog. */}
      {screen === "lockedPeriodRefundDraft" && (
        <InvoiceDetailPage
          key="locked-period-refunddraft-demo"
          initialStatus="Paid"
          invoiceNo="INV-2026-000015"
          customerName="Solstice Media"
          customerEmail={CREDIT_NOTES.find((c) => c.no === "CN-2026-000007")?.email}
          companyEmail={settings.email}
          initialCreditNote={{ no: "CN-2026-000007", amount: 6450, sent: false, draft: true }}
          initialViewCn
          refundTag="Refund pending"
          lockedPeriod
          onBack={() => setScreen("dashboard")}
        />
      )}

      {/* Locked Period — an Applied (pending-payout) refund credit note in a closed accounting period:
          the refund CN detail opens first; "Cancel refund" (⋯ menu) opens the locked-period dialog. */}
      {screen === "lockedPeriodRefundApplied" && (
        <InvoiceDetailPage
          key="locked-period-refundapplied-demo"
          initialStatus="Paid"
          invoiceNo="INV-2026-000015"
          customerName="Solstice Media"
          customerEmail={CREDIT_NOTES.find((c) => c.no === "CN-2026-000007")?.email}
          companyEmail={settings.email}
          initialCreditNote={{ no: "CN-2026-000007", amount: 6450, sent: false }}
          initialViewCn
          refundTag="Refund pending"
          lockedPeriod
          onBack={() => setScreen("dashboard")}
        />
      )}
          </motion.div>
        </AnimatePresence>

        {/* Standalone scanner for in-flow "Re-upload"/"Replace" (DuplicateDecision, AddInvoiceDetails)
            — same ScanDocument the FAB's Create-Invoice chooser uses, just without a sheet to host it
            in; mounted here so it overlays whatever screen triggered it. */}
        <ScanDocument
          open={reuploadScanOpen}
          onClose={() => setReuploadScanOpen(false)}
          onCapture={() => { setReuploadScanOpen(false); startUpload(); }}
          onImport={() => { setReuploadScanOpen(false); startUpload(); }}
        />

        {/* Blocking notice for an upload that never reached OCR (file too large / unsupported
            type) — mounted at the root, same as the standalone scanner above, so it overlays
            whichever screen triggered it (currently only the QuickNav dev scenarios). */}
        <UploadErrorDialog
          open={!!uploadError}
          title={uploadError?.title}
          body={uploadError?.body}
          onClose={() => setUploadError(null)}
          onReupload={() => { setUploadError(null); openReuploadScanner(); }}
        />
      </div>

      {/* Scenario annotation — shown in the white space to the right of the phone frame, only on the
          voided demo invoice (INV-…008), explaining how it reached the Void state. Deliberately
          OUTSIDE the sliding wrapper above: it's `fixed`-positioned relative to the viewport, and a
          `transform`'d ancestor (the slide animation) would re-anchor it and drag it along mid-slide. */}
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

      {/* Design-rationale annotation — shown in the white space to the right of the phone frame on the
          Refund CN — Draft screen (INV-…015), explaining the Apply-vs-Edit CTA gating. */}
      {screen === "invoiceDetail" && openInvoice.number === "INV-2026-000015" && openInvoice.cnDraft && openInvoice.viewCn && (
        <div
          className="hidden lg:block fixed top-1/2 -translate-y-1/2 left-[calc(50%+230px)] w-[320px]"
          style={FONT}
        >
          <div className="rounded-2xl bg-white shadow-[0_8px_30px_rgba(16,24,40,0.10)] border border-black/5 p-6">
            <p className="text-[12px] font-bold uppercase tracking-wide text-[#a0a0a0] mb-4">Note</p>
            <p className="text-[15px] leading-[1.55] text-[#1b1b1b] mb-4">
              This draft has all required information, so it leads with{" "}
              <span className="font-semibold">Apply to invoice</span> as the primary action.
            </p>
            <p className="text-[15px] leading-[1.55] text-[#1b1b1b]">
              If a credit-note draft is not completed with all required information, only the{" "}
              <span className="font-semibold">Edit</span> button is shown instead.
            </p>
          </div>
        </div>
      )}

      {/* Design-rationale annotation — shown in the white space to the right of the phone frame, only on
          the created Draft demo invoice (INV-…003), explaining the Send-Invoice gating on the detail page. */}
      {screen === "invoiceDetail" && openInvoice.number === "INV-2026-000003" && openInvoice.origin === "created" && (
        <div
          className="hidden lg:block fixed top-1/2 -translate-y-1/2 left-[calc(50%+230px)] w-[320px]"
          style={FONT}
        >
          <div className="rounded-2xl bg-white shadow-[0_8px_30px_rgba(16,24,40,0.10)] border border-black/5 p-6">
            <p className="text-[12px] font-bold uppercase tracking-wide text-[#a0a0a0] mb-4">Note</p>
            <p className="text-[15px] leading-[1.55] text-[#1b1b1b] mb-4">
              The <span className="font-semibold">Send Invoice</span> action is shown only when all required
              fields are completed. This prevents users from sending incomplete invoices and ensures the
              invoice is ready for delivery.
            </p>
            <p className="text-[15px] leading-[1.55] text-[#1b1b1b]">
              Otherwise, the <span className="font-semibold">Edit</span> button is shown as the primary button.
            </p>
          </div>
        </div>
      )}

      {/* Design-rationale annotation — shown in the white space to the right of the phone frame, only on
          the uploaded Draft demo invoice (INV-…003), explaining the Mark-as-Sent/Paid actions. */}
      {screen === "invoiceDetail" && openInvoice.number === "INV-2026-000003" && openInvoice.origin === "uploaded" && (
        <div
          className="hidden lg:block fixed top-1/2 -translate-y-1/2 left-[calc(50%+230px)] w-[320px]"
          style={FONT}
        >
          <div className="rounded-2xl bg-white shadow-[0_8px_30px_rgba(16,24,40,0.10)] border border-black/5 p-6">
            <p className="text-[12px] font-bold uppercase tracking-wide text-[#a0a0a0] mb-4">Note</p>
            <p className="text-[15px] leading-[1.55] text-[#1b1b1b] mb-4">
              Invoices imported through the <span className="font-semibold">Upload Invoice</span> flow may have
              already been sent to customers outside of Statrys.
            </p>
            <p className="text-[15px] leading-[1.55] text-[#1b1b1b]">
              Instead of requiring users to go through the Send Invoice flow again, we provide{" "}
              <span className="font-semibold">Mark as Sent</span> and{" "}
              <span className="font-semibold">Record Payment</span> actions directly.
            </p>
          </div>
        </div>
      )}

      {/* Beside-frame guidance for the Create (Locked Period) demo. Before the calendar opens, a
          "Click Here" arrow points at the Issue Date row (the only permitted interaction); once it's
          open, the arrow is replaced by the locked-dates explanation note. */}
      {screen === "lockedPeriodDialog" && !lockedIssueSheetOpen && (
        <div
          className="hidden lg:flex fixed top-[calc(50%-112px)] left-[calc(50%+196px)] items-center gap-3"
          style={FONT}
        >
          {/* Straight arrow pointing left, toward the Issue Date row inside the frame. */}
          <svg width="56" height="24" viewBox="0 0 56 24" fill="none" aria-hidden="true">
            <path d="M54 12 L4 12 M4 12 L14 5 M4 12 L14 19" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          <span className="text-[20px] font-bold tracking-[-0.2px] text-[#2563eb]">Click Issue Date</span>
        </div>
      )}
      {screen === "lockedPeriodDialog" && lockedIssueSheetOpen && (
        <div
          className="hidden lg:block fixed top-1/2 -translate-y-1/2 left-[calc(50%+230px)] w-[320px]"
          style={FONT}
        >
          <div className="rounded-2xl bg-white shadow-[0_8px_30px_rgba(16,24,40,0.10)] border border-black/5 p-6">
            <p className="text-[12px] font-bold uppercase tracking-wide text-[#a0a0a0] mb-4">Note</p>
            <p className="text-[15px] leading-[1.55] text-[#1b1b1b] mb-4">
              The Issue Date defaults to the first available (unlocked) date.
            </p>
            <p className="text-[15px] leading-[1.55] text-[#1b1b1b]">
              If the user goes back to a previous, already-closed month, those dates can't be selected —
              all dates within the locked accounting period are disabled. This prevents confusion and
              avoids creating invoices in a closed accounting period.
            </p>
          </div>
        </div>
      )}
      {/* Design-rationale annotation — shown in the white space to the right of the phone frame on the
          Upload (Locked Period) screen, explaining why the uploaded invoice's Issue Date must be re-picked. */}
      {screen === "lockedPeriodUpload" && (
        <div
          className="hidden lg:block fixed top-1/2 -translate-y-1/2 left-[calc(50%+230px)] w-[320px]"
          style={FONT}
        >
          <div className="rounded-2xl bg-white shadow-[0_8px_30px_rgba(16,24,40,0.10)] border border-black/5 p-6">
            <p className="text-[12px] font-bold uppercase tracking-wide text-[#a0a0a0] mb-4">Note</p>
            <p className="text-[15px] leading-[1.55] text-[#1b1b1b]">
              If the uploaded invoice has an Issue Date within a locked accounting period, that date can't
              be used. Users are prompted to select a new Issue Date outside the closed period before
              creating the invoice.
            </p>
          </div>
        </div>
      )}

      {/* Screen jumper — the collapsible QuickNav sidebar (stakeholder demos), shown in
          every build for now so the Vercel demo matches localhost. */}
      <QuickNavSidebar groups={sidebarGroups} />

      {/* Dev-mode-style hover inspector for handoff — toggle on (bottom-right), then hover
          any element to see its computed styling in the right-side gutter. Reads live
          computed styles, so it works on every screen already with no per-page wiring. */}
      <DevInspector />
    </div>
  );
}
