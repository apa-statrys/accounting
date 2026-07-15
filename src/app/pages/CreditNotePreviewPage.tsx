import { useLayoutEffect, useRef, useState } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import StatusBar from "../components/StatusBar";
import { SheetHeader, HeaderIconButton } from "../components/SheetHeader";
import { ButtonDock } from "../components/ButtonDock";

import { FONT } from "../lib/theme";

/** Inline brand mark — orange monogram tile from the company initial (matches the invoice preview). */
function LogoMark({ letter = "L", size = 28 }: { letter?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden role="img">
      <rect width="40" height="40" rx="11" fill="#FF4A15" />
      <text
        x="20" y="20" textAnchor="middle" dominantBaseline="central"
        fontFamily="GT Walsheim LC, sans-serif" fontSize="24" fontWeight="700" fill="#ffffff"
      >
        {letter}
      </text>
    </svg>
  );
}

export interface CreditNoteLine {
  name: string;
  amount: number;
}

interface CreditNotePreviewPageProps {
  creditNoteNo: string;
  /** The invoice this credit note credits — shown as the reference. */
  invoiceNo: string;
  customerName: string;
  customerEmail: string;
  issueDateLabel: string;
  currency: string;
  lines: CreditNoteLine[];
  /** Total credited (a positive number; rendered as a negative on the document). */
  total: number;
  /** Reason for the credit (required field) + optional free-text note — shown on the document. */
  reason?: string;
  reasonNote?: string;
  /** "preview" = the PDF preview inside the send flow (Download PDF dock). "view" = the read-only
   *  View Credit Note screen (DES-721): status + type chips, a Related-invoice action, and Send. */
  variant?: "preview" | "view";
  /** DES-721 — the credit note's own status (e.g. "Pending Refund" / "Refunded" / "Applied"). */
  status?: string;
  /** DES-721 — cancellation (unpaid invoice) vs refund (paid invoice) credit note. */
  kind?: "cancellation" | "refund";
  onBack?: () => void;
  onDownloaded?: () => void;
  /** DES-721 AC3 — open the linked invoice's view screen. */
  onViewInvoice?: () => void;
  /** DES-721 AC4 — send the credit note (reuses the Story-5 send flow). */
  onSend?: () => void;
}

// Status chip palette (DES-721). Refunded = indigo, Pending Refund = amber, Applied/other = green.
const STATUS_CHIP: Record<string, { bg: string; border: string; text: string }> = {
  "Refunded": { bg: "#eef2ff", border: "#c7d2fe", text: "#4338ca" },
  "Pending Refund": { bg: "#fff7e6", border: "#fde68a", text: "#b45309" },
  "Applied": { bg: "#ecfdf3", border: "#abefc6", text: "#067647" },
};

const money = (n: number, currency: string) =>
  `${currency} ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const neg = (n: number, currency: string) => `− ${money(n, currency)}`;

/** Sender identity — the user's company (Lumen Studio demo, from invoice settings). */
const FROM_COMPANY = {
  name: "Lumen Studio",
  initial: "L",
  addressLines: ["10/F, Tower 1, Admiralty Centre", "Hong Kong"],
  email: "hello@lumenstudio.co",
  phone: "+852 1234 5678",
};

/** A4 page @96dpi — natural document size; scaled to fit the phone so it reads like a real PDF page. */
const PAGE_W = 794;
const PAGE_MIN_H = 1123;

/** Full-screen credit-note document preview before downloading a PDF (DES-719). */
export function CreditNotePreviewPage(props: CreditNotePreviewPageProps) {
  const { creditNoteNo, invoiceNo, customerName, customerEmail, issueDateLabel, currency, lines, total, reason, reasonNote,
    variant = "preview", status, kind, onBack, onDownloaded, onViewInvoice, onSend } = props;
  const isView = variant === "view";

  // Prototype: skip the actual file save — just confirm.
  const download = () => onDownloaded?.();
  const chip = status ? (STATUS_CHIP[status] ?? STATUS_CHIP["Applied"]) : null;

  // Render at natural A4 width, then scale-to-fit the phone (see the invoice preview for the same approach).
  const areaRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.43);
  const [wrapH, setWrapH] = useState(PAGE_MIN_H * 0.43);

  useLayoutEffect(() => {
    const measure = () => {
      const area = areaRef.current;
      if (!area) return;
      const avail = area.clientWidth - 24; // p-3 gutters
      const s = avail / PAGE_W;
      setScale(s);
      if (pageRef.current) setWrapH(pageRef.current.offsetHeight * s);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [lines, reason, reasonNote, status, kind, isView]);

  const Lbl = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[11px] tracking-[0.1em] uppercase text-[#98a2b3]" style={FONT}>{children}</p>
  );

  return (
    <div className="absolute inset-0 flex flex-col bg-white rounded-[48px] overflow-hidden">
      <StatusBar />

      <SheetHeader
        title={isView ? "Credit Note" : "Credit Note Preview"}
        type="inside-page"
        state="fixed"
        leading={
          <HeaderIconButton aria-label="Back" onClick={onBack}>
            <ChevronLeftIcon />
          </HeaderIconButton>
        }
        trailing={<span className="w-[30px] h-[30px] block" aria-hidden />}
      />

      <div ref={areaRef} className="flex-1 min-h-0 overflow-y-auto thin-scrollbar bg-[#525659] p-3 pb-28">
        {/* Scaled A4 page — the wrapper reserves the scaled footprint; the page itself is full size. */}
        <div style={{ height: wrapH }}>
          <div
            ref={pageRef}
            className="bg-white shadow-[0_2px_12px_rgba(0,0,0,0.35)]"
            style={{ width: PAGE_W, minHeight: PAGE_MIN_H, transform: `scale(${scale})`, transformOrigin: "top left", padding: 56 }}
          >
            <div className="flex flex-col gap-9">
              {/* Header — CREDIT NOTE + number (left) · company identity (right) */}
              <div className="flex items-start justify-between gap-8">
                <div className="min-w-0">
                  <p className="text-[40px] font-black leading-none tracking-[-1.5px] text-[#1b1b1b]" style={FONT}>CREDIT NOTE</p>
                  <p className="text-[18px] font-semibold mt-3 text-[#FF4A15]" style={FONT}>{creditNoteNo}</p>
                </div>
                <div className="flex flex-col items-end shrink-0 text-right">
                  <div className="flex items-center gap-3">
                    <p className="text-[22px] font-bold leading-[1.15] text-[#1b1b1b]" style={FONT}>{FROM_COMPANY.name}</p>
                    <LogoMark letter={FROM_COMPANY.initial} size={40} />
                  </div>
                  {FROM_COMPANY.addressLines.map((l) => (
                    <p key={l} className="text-[13px] leading-[1.6] text-[#667085]" style={FONT}>{l}</p>
                  ))}
                  <p className="text-[13px] leading-[1.6] text-[#667085]" style={FONT}>{FROM_COMPANY.email}</p>
                </div>
              </div>

              <div className="h-px bg-[#eaecf0]" />

              {/* Credit to (left) · Issue date / For invoice / Status (right) */}
              <div className="flex items-start justify-between gap-8">
                <div className="min-w-0">
                  <Lbl>Credit To</Lbl>
                  <p className="text-[17px] font-bold mt-1.5 text-[#1b1b1b]" style={FONT}>{customerName || "—"}</p>
                  {customerEmail && <p className="text-[13px] leading-[1.6] text-[#667085]" style={FONT}>{customerEmail}</p>}
                </div>
                <div className="flex flex-col items-end gap-3 shrink-0 text-right">
                  <div>
                    <Lbl>Issue Date</Lbl>
                    <p className="text-[14px] font-semibold mt-0.5 text-[#1b1b1b]" style={FONT}>{issueDateLabel}</p>
                  </div>
                  <div>
                    <Lbl>For Invoice</Lbl>
                    <p className="text-[14px] font-semibold mt-0.5 text-[#1b1b1b]" style={FONT}>{invoiceNo}</p>
                  </div>
                  {status && chip && (
                    <div>
                      <Lbl>Status</Lbl>
                      <span
                        className="inline-flex items-center mt-1 px-3 py-1 rounded-full border text-[12px] font-bold uppercase tracking-wide"
                        style={{ ...FONT, background: chip.bg, borderColor: chip.border, color: chip.text }}
                      >
                        {status}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Credited items — amounts shown as negatives */}
              <div className="flex flex-col">
                <div className="flex items-center gap-4 bg-[#1b1b1b] px-5 py-3.5">
                  <span className="flex-1 min-w-0 text-[12px] font-bold uppercase tracking-[0.06em] text-white" style={FONT}>Item Credited</span>
                  <span className="w-36 text-right text-[12px] font-bold uppercase tracking-[0.06em] text-white" style={FONT}>Amount</span>
                </div>
                {lines.length === 0 ? (
                  <p className="px-5 py-6 text-[14px] text-[#a0a0a0]" style={FONT}>No credited items</p>
                ) : (
                  lines.map((l, idx) => (
                    <div key={idx} className="flex items-start gap-4 px-5 py-4 border-b border-[#eaecf0]">
                      <span className="flex-1 min-w-0 text-[14px] leading-[1.35] text-[#101828]" style={FONT}>{l.name}</span>
                      <span className="w-36 text-right text-[14px] font-semibold text-[#b42318] whitespace-nowrap" style={FONT}>{neg(l.amount, currency)}</span>
                    </div>
                  ))
                )}

                {/* Total credited — right-aligned column */}
                <div className="mt-6 ml-auto w-[46%] flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] text-[#667085]" style={FONT}>Subtotal credited</span>
                    <span className="text-[14px] text-[#475467]" style={FONT}>{neg(total, currency)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] text-[#667085]" style={FONT}>Tax (0%)</span>
                    <span className="text-[14px] text-[#475467]" style={FONT}>{money(0, currency)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t-2 border-[#1b1b1b] mt-2 pt-3">
                    <span className="text-[17px] font-bold text-[#1b1b1b]" style={FONT}>Total Credited</span>
                    <span className="text-[26px] font-black text-[#b42318]" style={FONT}>{neg(total, currency)}</span>
                  </div>
                </div>
              </div>

              {/* Reason for credit (left) · Notes (right) */}
              <div className="grid grid-cols-2 gap-8 pt-2">
                <div className="flex flex-col gap-3">
                  <Lbl>Reason for Credit</Lbl>
                  {reason ? (
                    <div>
                      <p className="text-[14px] font-semibold text-[#1b1b1b]" style={FONT}>{reason === "Others" ? (reasonNote || "Other") : reason}</p>
                      {reason !== "Others" && reasonNote && (
                        <p className="text-[13px] leading-[1.6] text-[#667085] mt-1" style={FONT}>{reasonNote}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-[13px] text-[#98a2b3]" style={FONT}>—</p>
                  )}
                </div>
                <div className="flex flex-col gap-3">
                  <Lbl>Notes</Lbl>
                  <p className="text-[13px] leading-[1.7] text-[#667085]" style={FONT}>
                    This credit note is issued against invoice <span className="font-semibold text-[#1b1b1b]">{invoiceNo}</span> and reduces the amount due by {money(total, currency)}. No payment is required.
                  </p>
                </div>
              </div>

              <div className="h-px bg-[#eaecf0] mt-4" />

              {/* Footer */}
              <p className="text-center text-[15px] font-medium text-[#1b1b1b]" style={FONT}>Thank you for your business!</p>
            </div>
          </div>
        </div>

        {/* DES-721 AC3 — Related invoice action (view screen only). */}
        {isView && onViewInvoice && (
          <button
            onClick={onViewInvoice}
            className="group mt-3 w-full bg-white rounded-2xl border border-[rgba(0,0,0,0.06)] shadow-sm px-4 py-3.5 flex items-center justify-between gap-3 text-left"
          >
            <span className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-wide text-[#a0a0a0]" style={FONT}>Related invoice</span>
              <span className="block text-[14px] font-semibold text-[#1b1b1b] mt-0.5 truncate" style={FONT}>{invoiceNo}</span>
            </span>
            <span className="flex items-center gap-0.5 shrink-0 text-[13px] font-medium text-[#ff4a15]" style={FONT}>
              View
              <ChevronRightIcon className="transition-transform group-hover:translate-x-0.5" style={{ fontSize: 18 }} />
            </span>
          </button>
        )}
      </div>

      <ButtonDock
        type="single"
        sticky
        primaryLabel={isView ? "Send Credit Note" : "Download PDF"}
        onPrimary={isView ? (onSend ?? (() => {})) : download}
        homeIndicator
      />
    </div>
  );
}

export default CreditNotePreviewPage;
