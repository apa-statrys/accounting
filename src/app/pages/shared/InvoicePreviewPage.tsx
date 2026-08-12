import { useLayoutEffect, useRef, useState } from "react";
import { PageAppHeader } from "../../components/PageAppHeader";
import { PageHeader } from "../../ui/PageHeader";
import { ButtonDock } from "../../components/ButtonDock";
import { Badge, type BadgeColor } from "../../ui/Badge";
import type { InvoiceLine } from "../../types";

import { FONT } from "../../lib/theme";

/** Inline brand mark — orange monogram tile from the company initial (CSP-safe; matches the settings preview). */
function LogoMark({ letter = "Y", size = 28 }: { letter?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden role="img">
      <rect width="40" height="40" rx="11" fill="var(--icon-brand)" />
      <text
        x="20" y="20" textAnchor="middle" dominantBaseline="central"
        fontFamily="GT Walsheim LC, sans-serif" fontSize="24" fontWeight="700" fill="var(--icon-on-color)"
      >
        {letter}
      </text>
    </svg>
  );
}

export interface InvoiceBank {
  holder: string;
  bankName: string;
  number: string;
  swift: string;
  currency: string;
}

export interface InvoiceDocumentPreviewProps {
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
  /** Optional status chip (Issue/Due/Status meta block) — same ui/Badge every other status label
   *  in the app renders through, not a hand-rolled pill (DETAIL_STATUS_META carries `color`). */
  status?: { label: string; color: BadgeColor };
  /** Wrapper padding — callers size this to their own container (full page vs. an embedded
   *  preview inside a smaller sheet). Defaults to the full-page page's own gutters. */
  className?: string;
}

interface InvoicePreviewPageProps extends InvoiceDocumentPreviewProps {
  onBack?: () => void;
  /** Fired after the PDF download is triggered. */
  onDownloaded?: () => void;
  /** Skip the "Download PDF" dock — the download already fired before this page opened (e.g.
   *  tapping the Send sheet's own Download file row). A plain "Preview as PDF" entry still shows
   *  the button since nothing has downloaded yet. */
  hideDownload?: boolean;
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


/** A4 page @96dpi — the natural document width/height; the page is scaled to fit whatever
 *  container it's placed in (the full-screen preview, or a narrower embedded preview). */
const PAGE_W = 794;
const PAGE_MIN_H = 1123;

/** The actual scaled document — self-measures its own container width to scale-to-fit, so it
 *  drops into the full-screen InvoicePreviewPage OR a narrower embedded spot (e.g. the Send
 *  sheet's PDF-segment preview) unchanged. This IS the real invoice document, not a stand-in. */
export function InvoiceDocumentPreview(props: InvoiceDocumentPreviewProps) {
  const { invoiceNo, customerName, customerEmail, issueDateLabel, dueDateLabel, currency, items, subtotal, discount, total, bank, fromName, companyName, status, className } = props;

  const senderName = companyName || fromName || FROM_COMPANY.name;
  const senderInitial = (senderName.trim()[0] ?? "L").toUpperCase();

  // Render the document at its natural A4 width, then scale-to-fit its container so it reads like
  // a real PDF page (not a reflowed mobile layout). The wrapper reserves the SCALED height so
  // whatever scrolls around it does so correctly.
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
    <p className="text-[14px] font-semibold mt-1 text-[var(--text-primary)] break-words" style={FONT}>{children}</p>
  );

  return (
    <div ref={areaRef} className={className ?? "p-3"}>
      {/* Scaled A4 page — the wrapper reserves the scaled footprint (width AND height, centered
          via margin auto) so the page sits centered in its container instead of flush left. */}
      <div style={{ height: wrapH, width: PAGE_W * scale, margin: "0 auto" }}>
        <div
          ref={pageRef}
          className="bg-white shadow-[0_2px_12px_rgba(0,0,0,0.35)]"
          style={{ width: PAGE_W, minHeight: PAGE_MIN_H, transform: `scale(${scale})`, transformOrigin: "top left", padding: 56 }}
        >
          <div className="flex flex-col gap-9">
            {/* Header — INVOICE + number (left) · company identity (right) */}
            <div className="flex items-start justify-between gap-8">
              <div className="min-w-0">
                <p className="text-[46px] font-black leading-none tracking-[-2px] text-[var(--text-primary)]" style={FONT}>INVOICE</p>
                <p className="text-[18px] font-semibold mt-3 text-[var(--text-brand)]" style={FONT}>{invoiceNo}</p>
              </div>
              <div className="flex flex-col items-end shrink-0 text-right">
                <div className="flex items-center gap-3">
                  <p className="text-[22px] font-bold leading-[1.15] text-[var(--text-primary)]" style={FONT}>{senderName}</p>
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
                <p className="text-[17px] font-bold mt-1.5 text-[var(--text-primary)]" style={FONT}>{customerName || "—"}</p>
                {customerEmail && <p className="text-[13px] leading-[1.6] text-[#667085]" style={FONT}>{customerEmail}</p>}
              </div>
              <div className="flex flex-col items-end gap-3 shrink-0 text-right">
                <div>
                  <Lbl>Issue Date</Lbl>
                  <p className="text-[14px] font-semibold mt-0.5 text-[var(--text-primary)]" style={FONT}>{issueDateLabel}</p>
                </div>
                <div>
                  <Lbl>Due Date</Lbl>
                  <p className="text-[14px] font-semibold mt-0.5 text-[var(--text-primary)]" style={FONT}>{dueDateLabel}</p>
                </div>
                {status && (
                  <div>
                    <Lbl>Status</Lbl>
                    <div className="mt-1">
                      <Badge label={status.label} color={status.color} variant="text" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Items table — Description / Qty / Rate / Amount */}
            <div className="flex flex-col">
              <div className="flex items-center gap-4 bg-[var(--bg-neutral-inverse-primary)] px-5 py-3.5">
                <span className="flex-1 min-w-0 text-[12px] font-bold uppercase tracking-[0.06em] text-white" style={FONT}>Description</span>
                <span className="w-16 text-right text-[12px] font-bold uppercase tracking-[0.06em] text-white" style={FONT}>Qty</span>
                <span className="w-32 text-right text-[12px] font-bold uppercase tracking-[0.06em] text-white" style={FONT}>Rate</span>
                <span className="w-36 text-right text-[12px] font-bold uppercase tracking-[0.06em] text-white" style={FONT}>Amount</span>
              </div>
              {items.length === 0 ? (
                <p className="px-5 py-6 text-[14px] text-[var(--text-placeholder)]" style={FONT}>No line items</p>
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
                    {/* Red — same "subtracted amount" treatment as credit notes/refunds (decided
                        2026-08-11, supersedes the earlier brand-colored 2026-08-02 decision). */}
                    <span className="text-[14px] text-[var(--text-error-primary)]" style={FONT}>−{money(discount, currency)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t-2 border-[#1b1b1b] mt-2 pt-3">
                  <span className="text-[17px] font-bold text-[var(--text-primary)]" style={FONT}>Total Due</span>
                  <span className="text-[26px] font-black text-[var(--text-primary)]" style={FONT}>{money(total, currency)}</span>
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
                  Payment due by {dueDateLabel}. Please use <span className="font-semibold text-[var(--text-primary)]">{invoiceNo}</span> as the payment reference. All amounts are in {currency}.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Full-screen invoice preview before downloading a PDF (DES-718 Download method). */
export function InvoicePreviewPage(props: InvoicePreviewPageProps) {
  const { onBack, onDownloaded, hideDownload, ...docProps } = props;

  // Prototype: skip the actual file save — just confirm + mark sent.
  const download = () => onDownloaded?.();

  const [scrolled, setScrolled] = useState(false);

  return (
    <div className="absolute inset-0 flex flex-col bg-white rounded-[48px] overflow-hidden">
      <div
        className="flex-1 min-h-0 overflow-y-auto thin-scrollbar bg-[#525659]"
        onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
      >
        <PageAppHeader scrolled={scrolled}>
          <PageHeader type="center" title="Invoice Preview" onBack={onBack} showSearch={false} onColor />
        </PageAppHeader>

        <InvoiceDocumentPreview {...docProps} className={hideDownload ? "p-3 pb-6" : "p-3 pb-28"} />
      </div>

      {!hideDownload && (
        <ButtonDock
          type="single"
          sticky
          primaryLabel="Download PDF"
          onPrimary={download}
        />
      )}
    </div>
  );
}

export default InvoicePreviewPage;
