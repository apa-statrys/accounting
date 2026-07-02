import { useLayoutEffect, useRef, useState } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import StatusBar from "./StatusBar";
import { SheetHeader, HeaderIconButton } from "./SheetHeader";
import { ButtonDock } from "./ButtonDock";

const FONT = { fontFamily: "GT Walsheim LC, sans-serif" } as const;

/** Inline brand mark — orange monogram tile from the company initial (CSP-safe; matches the settings preview). */
function LogoMark({ letter = "Y", size = 28 }: { letter?: string; size?: number }) {
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

export interface InvoiceLine {
  name: string;
  description?: string;
  qty: number;
  unit: string;
  unitPrice: number;
  amount: number;
}

export interface InvoiceBank {
  holder: string;
  bankName: string;
  number: string;
  swift: string;
  currency: string;
}

interface InvoicePreviewPageProps {
  invoiceNo: string;
  customerName: string;
  customerEmail: string;
  issueDateLabel: string;
  dueDateLabel: string;
  currency: string;
  items: InvoiceLine[];
  subtotal: number;
  discount: number;
  total: number;
  /** Full bank-transfer details for the "How to pay" block. */
  bank: InvoiceBank;
  /** Sender (the client's own business) — the company name shown top-right. */
  fromName?: string;
  companyName?: string;
  /** Optional status chip (Issue/Due/Status meta block). */
  status?: { label: string; bg: string; border: string; text: string };
  onBack?: () => void;
  /** Fired after the PDF download is triggered. */
  onDownloaded?: () => void;
}

/** A true IBAN (2 letters + 2 check digits, 15+ chars) is labelled IBAN; a country-prefixed
 *  local account number (e.g. "HK883-…", "SG6601-…") is just an Account Number. */
const accountNumberLabel = (num: string) => {
  const s = num.replace(/[^A-Za-z0-9]/g, "");
  return /^[A-Za-z]{2}\d{2}/.test(s) && s.length >= 15 ? "IBAN" : "Account Number";
};

const money = (n: number, currency: string) =>
  `${currency} ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Sender identity — the user's company (Lumen Studio demo, from invoice settings). */
const FROM_COMPANY = {
  name: "Lumen Studio",
  initial: "L",
  addressLines: ["10/F, Tower 1, Admiralty Centre", "Hong Kong"],
  email: "hello@lumenstudio.co",
  phone: "+852 1234 5678",
};


/** A4 page @96dpi — the natural document width/height; the page is scaled to fit the phone. */
const PAGE_W = 794;
const PAGE_MIN_H = 1123;

/** Full-screen invoice preview before downloading a PDF (DES-718 Download method). */
export function InvoicePreviewPage(props: InvoicePreviewPageProps) {
  const { invoiceNo, customerName, customerEmail, issueDateLabel, dueDateLabel, currency, items, subtotal, discount, total, bank, fromName, companyName, status, onBack, onDownloaded } = props;

  // Prototype: skip the actual file save — just confirm + mark sent.
  const download = () => onDownloaded?.();

  const senderName = companyName || fromName || FROM_COMPANY.name;
  const senderInitial = (senderName.trim()[0] ?? "L").toUpperCase();

  // Render the document at its natural A4 width, then scale-to-fit the phone so it reads like a real PDF
  // page (not a reflowed mobile layout). The wrapper reserves the SCALED height so the sheet scrolls right.
  const areaRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.43);
  const [wrapH, setWrapH] = useState(PAGE_MIN_H * 0.43);

  useLayoutEffect(() => {
    const measure = () => {
      const area = areaRef.current;
      if (!area) return;
      const avail = area.clientWidth - 24; // p-3 gutters (12px each side)
      const s = avail / PAGE_W;
      setScale(s);
      if (pageRef.current) setWrapH(pageRef.current.offsetHeight * s);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [items, discount, status]);

  const Lbl = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[11px] tracking-[0.1em] uppercase text-[#98a2b3]" style={FONT}>{children}</p>
  );
  const Val = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[14px] font-semibold mt-1 text-[#1b1b1b] break-words" style={FONT}>{children}</p>
  );

  return (
    <div className="absolute inset-0 flex flex-col bg-white rounded-[48px] overflow-hidden">
      <StatusBar />

      <SheetHeader
        title="Invoice Preview"
        type="inside-page"
        state="fixed"
        leading={
          <HeaderIconButton aria-label="Back" onClick={onBack}>
            <ChevronLeftIcon />
          </HeaderIconButton>
        }
        trailing={<span className="w-[30px] h-[30px] block" aria-hidden />}
      />

      <div ref={areaRef} className="flex-1 min-h-0 overflow-y-auto thin-scrollbar bg-[#525659] p-3">
        {/* Scaled A4 page — the wrapper reserves the scaled footprint; the page itself is full size. */}
        <div style={{ height: wrapH }}>
          <div
            ref={pageRef}
            className="bg-white shadow-[0_2px_12px_rgba(0,0,0,0.35)]"
            style={{ width: PAGE_W, minHeight: PAGE_MIN_H, transform: `scale(${scale})`, transformOrigin: "top left", padding: 56 }}
          >
            <div className="flex flex-col gap-9">
              {/* Header — INVOICE + number (left) · company identity (right) */}
              <div className="flex items-start justify-between gap-8">
                <div className="min-w-0">
                  <p className="text-[46px] font-black leading-none tracking-[-2px] text-[#1b1b1b]" style={FONT}>INVOICE</p>
                  <p className="text-[18px] font-semibold mt-3 text-[#FF4A15]" style={FONT}>{invoiceNo}</p>
                </div>
                <div className="flex flex-col items-end shrink-0 text-right">
                  <div className="flex items-center gap-3">
                    <p className="text-[22px] font-bold leading-[1.15] text-[#1b1b1b]" style={FONT}>{senderName}</p>
                    <LogoMark letter={senderInitial} size={40} />
                  </div>
                  {FROM_COMPANY.addressLines.map((l) => (
                    <p key={l} className="text-[13px] leading-[1.6] text-[#667085]" style={FONT}>{l}</p>
                  ))}
                  <p className="text-[13px] leading-[1.6] text-[#667085]" style={FONT}>{FROM_COMPANY.email}</p>
                </div>
              </div>

              <div className="h-px bg-[#eaecf0]" />

              {/* Bill to (left) · Issue / Due / Status (right) */}
              <div className="flex items-start justify-between gap-8">
                <div className="min-w-0">
                  <Lbl>Bill To</Lbl>
                  <p className="text-[17px] font-bold mt-1.5 text-[#1b1b1b]" style={FONT}>{customerName || "—"}</p>
                  {customerEmail && <p className="text-[13px] leading-[1.6] text-[#667085]" style={FONT}>{customerEmail}</p>}
                </div>
                <div className="flex flex-col items-end gap-3 shrink-0 text-right">
                  <div>
                    <Lbl>Issue Date</Lbl>
                    <p className="text-[14px] font-semibold mt-0.5 text-[#1b1b1b]" style={FONT}>{issueDateLabel}</p>
                  </div>
                  <div>
                    <Lbl>Due Date</Lbl>
                    <p className="text-[14px] font-semibold mt-0.5 text-[#1b1b1b]" style={FONT}>{dueDateLabel}</p>
                  </div>
                  {status && (
                    <div>
                      <Lbl>Status</Lbl>
                      <span
                        className="inline-flex items-center mt-1 px-3 py-1 rounded-full border text-[12px] font-bold uppercase tracking-wide"
                        style={{ ...FONT, background: status.bg, borderColor: status.border, color: status.text }}
                      >
                        {status.label}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Items table — Description / Qty / Rate / Amount */}
              <div className="flex flex-col">
                <div className="flex items-center gap-4 bg-[#1b1b1b] px-5 py-3.5">
                  <span className="flex-1 min-w-0 text-[12px] font-bold uppercase tracking-[0.06em] text-white" style={FONT}>Description</span>
                  <span className="w-16 text-right text-[12px] font-bold uppercase tracking-[0.06em] text-white" style={FONT}>Qty</span>
                  <span className="w-32 text-right text-[12px] font-bold uppercase tracking-[0.06em] text-white" style={FONT}>Rate</span>
                  <span className="w-36 text-right text-[12px] font-bold uppercase tracking-[0.06em] text-white" style={FONT}>Amount</span>
                </div>
                {items.length === 0 ? (
                  <p className="px-5 py-6 text-[14px] text-[#a0a0a0]" style={FONT}>No line items</p>
                ) : (
                  items.map((i, idx) => (
                    <div key={idx} className="flex items-start gap-4 px-5 py-4 border-b border-[#eaecf0]">
                      <span className="flex-1 min-w-0 flex flex-col gap-1">
                        <span className="text-[14px] leading-[1.35] text-[#101828]" style={FONT}>{i.name}</span>
                        {i.description && <span className="text-[12px] leading-[1.35] text-[#98a2b3]" style={FONT}>{i.description}</span>}
                      </span>
                      <span className="w-16 text-right text-[14px] text-[#475467]" style={FONT}>{i.qty}</span>
                      <span className="w-32 text-right text-[14px] text-[#475467] whitespace-nowrap" style={FONT}>{money(i.unitPrice, currency)}</span>
                      <span className="w-36 text-right text-[14px] font-semibold text-[#101828] whitespace-nowrap" style={FONT}>{money(i.amount, currency)}</span>
                    </div>
                  ))
                )}

                {/* Totals — right-aligned column */}
                <div className="mt-6 ml-auto w-[46%] flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] text-[#667085]" style={FONT}>Subtotal</span>
                    <span className="text-[14px] text-[#475467]" style={FONT}>{money(subtotal, currency)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] text-[#667085]" style={FONT}>Tax (0%)</span>
                    <span className="text-[14px] text-[#475467]" style={FONT}>{money(0, currency)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] text-[#667085]" style={FONT}>Discount</span>
                      <span className="text-[14px] text-[#475467]" style={FONT}>- {money(discount, currency)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t-2 border-[#1b1b1b] mt-2 pt-3">
                    <span className="text-[17px] font-bold text-[#1b1b1b]" style={FONT}>Total Due</span>
                    <span className="text-[26px] font-black text-[#1b1b1b]" style={FONT}>{money(total, currency)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Details · Notes */}
              <div className="grid grid-cols-2 gap-8 pt-2">
                <div className="flex flex-col gap-3">
                  <Lbl>Payment Details</Lbl>
                  <div className="flex flex-col gap-3">
                    <div><Lbl>Account Name</Lbl><Val>{bank.holder}</Val></div>
                    <div><Lbl>Bank</Lbl><Val>{bank.bankName}</Val></div>
                    <div><Lbl>{accountNumberLabel(bank.number)}</Lbl><Val>{bank.number}</Val></div>
                    <div><Lbl>SWIFT / BIC</Lbl><Val>{bank.swift}</Val></div>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <Lbl>Notes</Lbl>
                  <p className="text-[13px] leading-[1.7] text-[#667085]" style={FONT}>
                    Payment due by {dueDateLabel}. Please use <span className="font-semibold text-[#1b1b1b]">{invoiceNo}</span> as the payment reference. All amounts are in {currency}.
                  </p>
                </div>
              </div>

              <div className="h-px bg-[#eaecf0] mt-4" />

              {/* Footer */}
              <p className="text-center text-[15px] font-medium text-[#1b1b1b]" style={FONT}>Thank you for your business!</p>
            </div>
          </div>
        </div>
      </div>

      <ButtonDock
        type="single"
        overflow
        primaryLabel="Download PDF"
        onPrimary={download}
        homeIndicator
      />
    </div>
  );
}

export default InvoicePreviewPage;
