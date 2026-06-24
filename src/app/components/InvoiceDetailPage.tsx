import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import BlockIcon from "@mui/icons-material/Block";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import StatusBar from "./StatusBar";
import { SheetHeader, HeaderIconButton } from "./SheetHeader";
import { ButtonDock } from "./ButtonDock";
import { BottomSheet } from "./BottomSheet";
import { SendInvoiceSheet } from "./SendInvoiceSheet";
import { ReviewEmail } from "./ReviewEmail";
import { ShareLinkSheet } from "./ShareLinkSheet";
import { InvoicePreviewPage, type InvoiceLine } from "./InvoicePreviewPage";
import { SendSuccessToast } from "./SendSuccessToast";
import type { Customer } from "./CreateSalesInvoice";
import type { ServiceLine } from "./serviceLine";

/** What Edit carries up so the form opens prefilled with this invoice. */
export interface InvoiceEditSeed {
  customer: Customer;
  invoiceNo: string;
  currency: string;
  services: ServiceLine[];
  /** Issued invoice = limited edit (lock customer / dates / currency on the form). */
  limited?: boolean;
}

const FONT = { fontFamily: "GT Walsheim LC, sans-serif" } as const;
const INK = "#1b1b1b";
const MUTED = "#808080";

/** The full invoice lifecycle (DES-715 / DES-716 status matrix). */
export type DetailStatus = "Draft" | "Awaiting" | "Overdue" | "PartiallyPaid" | "Paid" | "Void";

const STATUS_META: Record<DetailStatus, { label: string; bg: string; border: string; text: string }> = {
  Draft: { label: "Draft", bg: "#faf9f4", border: "rgba(160,160,160,0.35)", text: "#808080" },
  Awaiting: { label: "Awaiting Payment", bg: "#f9f5ea", border: "#ff4a15", text: "#ff4a15" },
  Overdue: { label: "Overdue", bg: "#fef2f2", border: "#f5c6c0", text: "#b42318" },
  PartiallyPaid: { label: "Partially Paid", bg: "#fff7e6", border: "#fde68a", text: "#b45309" },
  Paid: { label: "Paid", bg: "#ebfcef", border: "#a3e9b6", text: "#006a1d" },
  Void: { label: "Void", bg: "#f3f3f3", border: "rgba(160,160,160,0.35)", text: "#808080" },
};

/** Demo line items — shared across every status preview. */
const ITEMS: InvoiceLine[] = [
  { name: "Brand identity design", qty: 1, unit: "service", unitPrice: 4200, amount: 4200 },
  { name: "Landing page build", qty: 1, unit: "service", unitPrice: 1800, amount: 1800 },
  { name: "Consulting", qty: 6, unit: "hours", unitPrice: 75, amount: 450 },
];
const SUBTOTAL = 6450;
const DISCOUNT = 0;
const TOTAL = SUBTOTAL - DISCOUNT;
const PAID_PARTIAL = 4000;

const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface InvoiceDetailPageProps {
  initialStatus?: DetailStatus;
  /** Where a Draft came from — sets the default emphasis (DES-715 vs DES-716 AC4). */
  origin?: "created" | "uploaded";
  invoiceNo?: string;
  customerName?: string;
  customerEmail?: string;
  issueDateLabel?: string;
  dueDateLabel?: string;
  currency?: string;
  onBack?: () => void;
  /** Open the create/edit form prefilled with this invoice (Draft = full edit, issued = limited). */
  onEdit?: (seed: InvoiceEditSeed) => void;
  /** Draft issued → Awaiting Payment; parent shows the toast and returns to list. */
  onIssued?: () => void;
  /** Draft deleted (Draft-only); parent shows the toast and returns to list. */
  onDeleted?: () => void;
  /** Optional send completed (email / link / download); parent toast + list. */
  onSent?: () => void;
  /** Toast to flash once on mount (e.g. "Changes saved" after returning from an edit). */
  flashToast?: string;
}

function MetaRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-3 ${last ? "" : "border-b border-[rgba(160,160,160,0.18)]"}`}>
      <span className="text-[14px] leading-[1.3]" style={{ ...FONT, color: MUTED }}>{label}</span>
      <span className="text-[14px] font-medium leading-[1.3] text-right" style={{ ...FONT, color: INK }}>{value}</span>
    </div>
  );
}

/** Dashed-border info card (matches the dashboard list cards). */
function InfoCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      {title && (
        <p className="px-1 text-[12px] font-bold uppercase tracking-wide" style={{ ...FONT, color: "#a0a0a0" }}>{title}</p>
      )}
      <div className="bg-[#faf9f4] border border-dashed border-[rgba(160,160,160,0.3)] rounded-xl px-4">
        {children}
      </div>
    </div>
  );
}

/** Status-aware sales-invoice detail (DES-715 / DES-716). */
export function InvoiceDetailPage({
  initialStatus = "Awaiting",
  origin = "created",
  invoiceNo = "INV-2026-00042",
  customerName = "Marlow & Finch Studio",
  customerEmail = "apa@marlowfinch.co",
  issueDateLabel = "10 Jun 2026",
  dueDateLabel = "10 Jul 2026",
  currency = "USD",
  onBack,
  onEdit,
  onIssued,
  onDeleted,
  onSent,
  flashToast,
}: InvoiceDetailPageProps) {
  const [status, setStatus] = useState<DetailStatus>(initialStatus);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [bankExpanded, setBankExpanded] = useState(false);
  const [confirmVoid, setConfirmVoid] = useState(false);
  const [recordPayOpen, setRecordPayOpen] = useState(false);
  const [recordAmount, setRecordAmount] = useState("");
  const [paidAmount, setPaidAmount] = useState(PAID_PARTIAL);
  // Amount received beyond the total (DES-715/716 AC6 — flagged for review).
  const [overpayment, setOverpayment] = useState(0);
  const [localToast, setLocalToast] = useState<string | null>(null);

  // Flash a one-off toast on arrival (e.g. "Changes saved" after an edit).
  useEffect(() => {
    if (flashToast) setLocalToast(flashToast);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Optional-send sub-flow state (reused from the create flow).
  const [sendSheetOpen, setSendSheetOpen] = useState(false);
  const [emailReviewOpen, setEmailReviewOpen] = useState(false);
  const [shareLinkOpen, setShareLinkOpen] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);

  const meta = STATUS_META[status];
  const issued = status !== "Draft";
  // Uploaded drafts default to "Mark as sent" (already issued externally → Awaiting payment);
  // "Mark as paid" is the secondary path for invoices already settled. Created drafts default to sending.
  const uploaded = origin === "uploaded";
  const terminal = status === "Paid" || status === "Void";
  const sendable = status === "Awaiting" || status === "Overdue" || status === "PartiallyPaid";
  const remaining = TOTAL - paidAmount;
  const overdueDays = 15; // demo: due 5 Jun, "today" 20 Jun 2026

  // The one-line status explainer under the amount.
  const bannerText: Record<DetailStatus, string> = {
    Draft: "",
    Awaiting: "",
    Overdue: `Overdue by ${overdueDays} days · was due ${dueDateLabel}`,
    PartiallyPaid: `${money(paidAmount)} received · ${money(remaining)} still due`,
    Paid: overpayment > 0 ? `Paid · overpaid by ${money(overpayment)}, flagged for review` : "Paid in full",
    Void: "Voided with a credit note · no longer collectable",
  };

  const closeSendFlows = () => {
    setSendSheetOpen(false);
    setEmailReviewOpen(false);
    setShareLinkOpen(false);
    setPdfPreviewOpen(false);
  };

  const bank = {
    holder: "Your Company Ltd",
    bankName: "Statrys",
    // Statrys account number — prefixed with the account's country (HK / SG).
    number: "HK883-168888-168",
    swift: "STYSHKHH",
    currency,
  };

  // Prefill payload for the edit form — this invoice's customer, number, items.
  const editSeed: InvoiceEditSeed = {
    customer: { id: "edit", name: customerName, email: customerEmail },
    invoiceNo,
    currency,
    services: ITEMS.map((it, i) => ({
      id: `edit-${i}`,
      name: it.name,
      currency,
      unit: it.unit,
      quantity: it.qty,
      unitPrice: it.unitPrice,
    })),
    limited: issued,
  };
  const openEdit = () => { setActionsOpen(false); onEdit?.(editSeed); };

  // Required-field gate for issuing/sending a draft (DES-715 AC2 / DES-716 AC3).
  const requiredComplete = !!customerName && ITEMS.length > 0 && !!dueDateLabel;
  const duplicate = () => { setActionsOpen(false); setLocalToast("Invoice duplicated"); };

  return (
    <div className="relative bg-white rounded-[48px] overflow-hidden shadow-2xl flex flex-col" style={{ width: 375, height: 812 }}>
      <StatusBar />

      <SheetHeader
        title="Invoice"
        type="inside-page"
        state="fixed"
        leading={
          <HeaderIconButton aria-label="Back" onClick={onBack}>
            <ChevronLeftIcon />
          </HeaderIconButton>
        }
        trailing={
          terminal ? (
            <span className="w-[30px] h-[30px] block" aria-hidden />
          ) : (
            <HeaderIconButton aria-label="More actions" onClick={() => setActionsOpen(true)}>
              <MoreHorizIcon />
            </HeaderIconButton>
          )
        }
      />

      <div className="flex-1 overflow-y-auto thin-scrollbar bg-white px-4 pt-5 pb-28 flex flex-col gap-6">
        {/* Status + amount */}
        <InfoCard>
          <div className="py-3 flex flex-col gap-1.5">
            <span
              className="self-start px-2.5 py-0.5 rounded-full border text-[11px] font-bold leading-[16px]"
              style={{ ...FONT, background: meta.bg, borderColor: meta.border, color: meta.text }}
            >
              {meta.label}
            </span>
            <p className="text-[20px] font-black leading-none tracking-[-0.8px]" style={{ ...FONT, color: INK }}>
              {money(TOTAL)}
            </p>
            {bannerText[status] && (
              <p className="text-[13px] leading-[1.3]" style={{ ...FONT, color: status === "Overdue" ? "#b42318" : MUTED }}>
                {bannerText[status]}
              </p>
            )}
            {status === "PartiallyPaid" && (
              <div className="w-full mt-1 h-2 rounded-full bg-[#f0eee6] overflow-hidden">
                <div className="h-full rounded-full bg-[#b45309]" style={{ width: `${(paidAmount / TOTAL) * 100}%` }} />
              </div>
            )}
          </div>
        </InfoCard>

        {/* Customer — avatar removed for now (pending invoice-number confirmation) */}
        <InfoCard>
          <div className="py-3 flex items-center gap-3">
            <div className="min-w-0">
              <p className="text-[15px] font-medium leading-tight truncate" style={{ ...FONT, color: INK }}>{customerName}</p>
              <p className="text-[13px] leading-[1.4] mt-0.5 truncate" style={{ ...FONT, color: MUTED }}>{customerEmail}</p>
            </div>
          </div>
        </InfoCard>

        {/* Details */}
        <InfoCard>
          {/* Created draft: number is system-generated only on issue (DES-715), so none yet.
              Uploaded draft: show the user-entered / OCR-extracted number (DES-716). */}
          {(issued || uploaded) && <MetaRow label="Invoice number" value={invoiceNo} />}
          <MetaRow label="Issue date" value={issueDateLabel} />
          <MetaRow label="Due date" value={`Next 30 days · ${dueDateLabel}`} />
          <MetaRow label="Currency" value={currency} last />
        </InfoCard>

        {/* Line items */}
        <InfoCard title="Items">
          {ITEMS.map((it) => (
            <div key={it.name} className="flex items-start justify-between py-2.5 border-b border-[rgba(160,160,160,0.18)]">
              <div className="flex-1 min-w-0 pr-3">
                <p className="text-[14px] font-medium leading-tight" style={{ ...FONT, color: INK }}>{it.name}</p>
                <p className="text-[12px] leading-[1.3] mt-0.5" style={{ ...FONT, color: MUTED }}>
                  {it.qty} {it.unit} · {money(it.unitPrice)}
                </p>
              </div>
              <p className="text-[14px] font-medium" style={{ ...FONT, color: INK }}>{money(it.amount)}</p>
            </div>
          ))}
          <div className="flex items-center justify-between pt-3">
            <span className="text-[13px]" style={{ ...FONT, color: MUTED }}>Subtotal</span>
            <span className="text-[13px]" style={{ ...FONT, color: INK }}>{money(SUBTOTAL)}</span>
          </div>
          <div className="flex items-center justify-between py-3 mt-1 border-t border-[rgba(160,160,160,0.25)]">
            <span className="text-[15px] font-bold" style={{ ...FONT, color: INK }}>Total</span>
            <span className="text-[15px] font-bold" style={{ ...FONT, color: INK }}>{money(TOTAL)}</span>
          </div>
          {status === "PartiallyPaid" && (
            <div className="flex items-center justify-between pb-3">
              <span className="text-[13px]" style={{ ...FONT, color: "#b45309" }}>Remaining due</span>
              <span className="text-[13px] font-medium" style={{ ...FONT, color: "#b45309" }}>{money(remaining)}</span>
            </div>
          )}
        </InfoCard>

        {/* Receiving payment details — only the critical fields; rest behind an accordion */}
        {status !== "Void" && (
          <InfoCard title={status === "Paid" ? "Payment received to" : "Receiving account"}>
            <MetaRow label="Account holder" value={bank.holder} />
            <MetaRow label="Account number" value={bank.number} />
            <AnimatePresence initial={false}>
              {bankExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden"
                >
                  <MetaRow label="Bank" value={bank.bankName} />
                  <MetaRow label="SWIFT / BIC" value={bank.swift} />
                  {/* Payment reference only exists once issued (no number on a draft). */}
                  {issued && <MetaRow label="Payment reference" value={invoiceNo} />}
                </motion.div>
              )}
            </AnimatePresence>
            <button
              onClick={() => setBankExpanded((v) => !v)}
              className="w-full flex items-center justify-center gap-1 py-3"
            >
              <span className="text-[13px] font-medium" style={{ ...FONT, color: INK }}>
                {bankExpanded ? "Show less" : "Show more"}
              </span>
              <KeyboardArrowDownIcon
                style={{ fontSize: 18, color: INK, transform: bankExpanded ? "rotate(180deg)" : "none", transition: "transform .2s" }}
              />
            </button>
          </InfoCard>
        )}
      </div>

      {/* Primary action — per status */}
      {status === "Draft" ? (
        <ButtonDock
          type="double"
          overflow
          secondaryLabel="Mark as paid"
          primaryLabel={uploaded ? "Mark as sent" : "Send invoice"}
          primaryDisabled={!requiredComplete}
          onSecondary={() => { setRecordAmount(String(TOTAL)); setRecordPayOpen(true); }}
          onPrimary={
            uploaded
              ? onIssued
              : () => setSendSheetOpen(true)
          }
          homeIndicator
        />
      ) : sendable ? (
        <ButtonDock
          type="double"
          overflow
          secondaryLabel="Resend invoice"
          primaryLabel="Mark as paid"
          onSecondary={() => setSendSheetOpen(true)}
          onPrimary={() => { setRecordAmount(String(TOTAL)); setRecordPayOpen(true); }}
          homeIndicator
        />
      ) : (
        <ButtonDock type="single" overflow primaryLabel="Download PDF" onPrimary={() => setPdfPreviewOpen(true)} homeIndicator />
      )}

      {/* Secondary actions sheet */}
      <BottomSheet open={actionsOpen} title="Invoice actions" onClose={() => setActionsOpen(false)}>
        <div className="flex flex-col">
          {/* Uploaded drafts: sending stays optional (default is record-only) */}
          {status === "Draft" && uploaded && (
            <button
              onClick={() => { setActionsOpen(false); setSendSheetOpen(true); }}
              className="w-full flex items-center gap-3 py-3.5 text-left border-b border-[#f1f1f1]"
            >
              <SendOutlinedIcon style={{ fontSize: 20, color: INK }} />
              <span className="text-[15px]" style={{ ...FONT, color: INK }}>Send invoice</span>
            </button>
          )}

          {/* Edit — full for a draft, limited for an issued still-editable invoice */}
          {(status === "Draft" || status === "Awaiting" || status === "Overdue") && (
            <button
              onClick={openEdit}
              className="w-full flex items-center gap-3 py-3.5 text-left border-b border-[#f1f1f1]"
            >
              <EditOutlinedIcon style={{ fontSize: 20, color: INK }} />
              <span className="text-[15px]" style={{ ...FONT, color: INK }}>Edit invoice</span>
            </button>
          )}

          {!terminal && (
            <button
              onClick={duplicate}
              className="w-full flex items-center gap-3 py-3.5 text-left border-b border-[#f1f1f1]"
            >
              <ContentCopyIcon style={{ fontSize: 20, color: INK }} />
              <span className="text-[15px]" style={{ ...FONT, color: INK }}>Duplicate invoice</span>
            </button>
          )}

          {(status === "Awaiting" || status === "Overdue") && (
            <button
              onClick={() => { setActionsOpen(false); setConfirmVoid(true); }}
              className="w-full flex items-center gap-3 py-3.5 text-left border-b border-[#f1f1f1]"
            >
              <BlockIcon style={{ fontSize: 20, color: "#b42318" }} />
              <span className="text-[15px]" style={{ ...FONT, color: "#b42318" }}>Void invoice</span>
            </button>
          )}

          {status === "Draft" && (
            <button
              onClick={() => { setActionsOpen(false); setConfirmDelete(true); }}
              className="w-full flex items-center gap-3 py-3.5 text-left"
            >
              <DeleteOutlineIcon style={{ fontSize: 20, color: "#b42318" }} />
              <span className="text-[15px]" style={{ ...FONT, color: "#b42318" }}>Delete draft</span>
            </button>
          )}
        </div>
      </BottomSheet>

      {/* Delete confirm (Draft only) */}
      <BottomSheet open={confirmDelete} title="Delete this draft?" onClose={() => setConfirmDelete(false)}>
        <p className="text-[14px] leading-[1.45] pb-4" style={{ ...FONT, color: MUTED }}>
          This draft will be removed from the system. This can’t be undone.
        </p>
        <ButtonDock
          type="double"
          secondaryLabel="Keep draft"
          primaryLabel="Delete"
          onSecondary={() => setConfirmDelete(false)}
          onPrimary={() => { setConfirmDelete(false); onDeleted?.(); }}
        />
      </BottomSheet>

      {/* Void invoice (credit-note issuance is a later story, DES-719) */}
      <BottomSheet open={confirmVoid} title="Void this invoice?" onClose={() => setConfirmVoid(false)}>
        <p className="text-[14px] leading-[1.45] pb-4" style={{ ...FONT, color: MUTED }}>
          This cancels the invoice and moves it to Void. (Issuing a matching credit note comes
          with DES-719 — not built yet.)
        </p>
        <ButtonDock
          type="double"
          secondaryLabel="Not now"
          primaryLabel="Void invoice"
          onSecondary={() => setConfirmVoid(false)}
          onPrimary={() => { setConfirmVoid(false); setStatus("Void"); setLocalToast("Invoice voided"); }}
        />
      </BottomSheet>

      {/* Record payment — full marks Paid, less marks Partially Paid */}
      <BottomSheet open={recordPayOpen} title="Record payment" onClose={() => setRecordPayOpen(false)}>
        <div className="flex flex-col gap-3 pb-1">
          <p className="text-[13px] leading-[1.45]" style={{ ...FONT, color: MUTED }}>
            Record a payment received for this invoice. The full amount marks it Paid; less marks
            it Partially Paid.
          </p>
          <label className="text-[12px] font-bold uppercase tracking-wide" style={{ ...FONT, color: "#a0a0a0" }}>
            Amount received
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-[rgba(160,160,160,0.4)] px-3.5 h-12 bg-white">
            <span className="text-[15px]" style={{ ...FONT, color: MUTED }}>$</span>
            <input
              type="text"
              inputMode="decimal"
              value={recordAmount}
              onChange={(e) => setRecordAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              className="flex-1 outline-none text-[15px]"
              style={{ ...FONT, color: INK }}
            />
          </div>
          <p className="text-[12px]" style={{ ...FONT, color: MUTED }}>Invoice total: {money(TOTAL)}</p>
        </div>
        <ButtonDock
          type="double"
          secondaryLabel="Cancel"
          primaryLabel="Record payment"
          onSecondary={() => setRecordPayOpen(false)}
          onPrimary={() => {
            const amt = Math.max(0, Number(recordAmount) || 0);
            setRecordPayOpen(false);
            if (amt > TOTAL) {
              setOverpayment(amt - TOTAL);
              setStatus("Paid");
              setLocalToast("Payment recorded · overpayment flagged");
            } else if (amt === TOTAL) {
              setOverpayment(0);
              setStatus("Paid");
              setLocalToast("Payment recorded");
            } else if (amt > 0) {
              setPaidAmount(amt);
              setStatus("PartiallyPaid");
              setLocalToast("Partial payment recorded");
            }
          }}
        />
      </BottomSheet>

      {/* Optional send (reused sub-flows) */}
      <SendInvoiceSheet
        open={sendSheetOpen}
        customerName={customerName}
        customerEmail={customerEmail}
        onClose={() => setSendSheetOpen(false)}
        onConfirm={(method) => {
          // All methods keep the Delivery method page mounted underneath and open instantly
          // (no transition): email review / share-link sheet / PDF preview overlay it.
          if (method === "email") setEmailReviewOpen(true);
          else if (method === "link") setShareLinkOpen(true);
          else if (method === "pdf") setPdfPreviewOpen(true);
        }}
      />

      {/* Email review — shown instantly over the (still-mounted) Delivery method page; no transition. */}
      {emailReviewOpen && (
        <div className="absolute inset-0 z-50">
          <ReviewEmail
            customerName={customerName}
            customerEmail={customerEmail}
            invoiceNo={invoiceNo}
            amountLabel={`${currency} ${TOTAL.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            dueDateLabel={dueDateLabel}
            onBack={() => setEmailReviewOpen(false)}
            onSend={() => { closeSendFlows(); onSent?.(); }}
          />
        </div>
      )}

      <ShareLinkSheet
        open={shareLinkOpen}
        link={`https://pay.statrys.com/i/${invoiceNo.toLowerCase()}`}
        onSent={() => { closeSendFlows(); onSent?.(); }}
        onDismiss={() => setShareLinkOpen(false)}
      />

      {/* PDF preview — shown instantly over the (still-mounted) Delivery method page; no transition. */}
      {pdfPreviewOpen && (
        <div className="absolute inset-0 z-50">
          <InvoicePreviewPage
            invoiceNo={invoiceNo}
            customerName={customerName}
            customerEmail={customerEmail}
            issueDateLabel={issueDateLabel}
            dueDateLabel={dueDateLabel}
            currency={currency}
            items={ITEMS}
            subtotal={SUBTOTAL}
            discount={DISCOUNT}
            total={TOTAL}
            bank={bank}
            onBack={() => setPdfPreviewOpen(false)}
            onDownloaded={() => {
              // From a sendable invoice, download counts as a send channel;
              // for terminal/read-only invoices it's just a re-download.
              setPdfPreviewOpen(false);
              if (sendable) onSent?.();
              else setLocalToast("Invoice downloaded");
            }}
          />
        </div>
      )}

      {/* Local toast for in-page outcomes (void / re-download) */}
      <SendSuccessToast open={!!localToast} message={localToast ?? ""} onDone={() => setLocalToast(null)} />
    </div>
  );
}

export default InvoiceDetailPage;
