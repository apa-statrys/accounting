import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import StatusBar from "./StatusBar";
import { SheetHeader, HeaderIconButton } from "./SheetHeader";
import { ButtonDock } from "./ButtonDock";
import { STATRYS_LOGO_WHITE } from "./statrysLogo";

const FONT = { fontFamily: "GT Walsheim LC, sans-serif" } as const;

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
  /** Sender (the client's own business). */
  fromName?: string;
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


/** Full-screen invoice preview before downloading a PDF (DES-718 Download method). */
export function InvoicePreviewPage(props: InvoicePreviewPageProps) {
  const { invoiceNo, customerName, customerEmail, issueDateLabel, dueDateLabel, currency, items, subtotal, discount, total, bank, fromName, onBack, onDownloaded } = props;

  // Prototype: skip the actual file save — just confirm + mark sent.
  const download = () => onDownloaded?.();

  const Lbl = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[11px] tracking-[0.08em] uppercase text-[#808080]" style={FONT}>{children}</p>
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

      <div className="flex-1 overflow-y-auto thin-scrollbar bg-[#f2f2f2] px-4 py-5">
        {/* Paper */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[rgba(0,0,0,0.05)]">
          {/* Brand header */}
          <div className="bg-[#1b1b1b] px-5 py-4 flex items-center justify-between">
            <img src={STATRYS_LOGO_WHITE} alt="Statrys" className="h-[20px] w-auto" />
            <span className="text-[15px] font-bold tracking-[0.12em] text-white" style={FONT}>INVOICE</span>
          </div>

          <div className="px-5 py-5 flex flex-col gap-5">
            {/* Meta */}
            <div className="flex gap-6">
              <div><Lbl>Invoice No.</Lbl><p className="text-[13px] font-semibold mt-0.5" style={FONT}>{invoiceNo}</p></div>
              <div><Lbl>Issue</Lbl><p className="text-[13px] font-semibold mt-0.5" style={FONT}>{issueDateLabel}</p></div>
              <div><Lbl>Due</Lbl><p className="text-[13px] font-semibold mt-0.5 text-[#E8540A]" style={FONT}>{dueDateLabel}</p></div>
            </div>

            {/* Parties */}
            <div className="flex gap-6">
              <div className="flex-1"><Lbl>From</Lbl><p className="text-[14px] font-semibold mt-1" style={FONT}>{fromName ?? "Your Company"}</p></div>
              <div className="flex-1">
                <Lbl>Bill To</Lbl>
                <p className="text-[14px] font-semibold mt-1" style={FONT}>{customerName}</p>
                <p className="text-[12px] text-[#808080]" style={FONT}>{customerEmail}</p>
              </div>
            </div>

            {/* Line items */}
            <div>
              <div className="flex items-center pb-2 border-b border-[#eee]">
                <span className="flex-1 text-[11px] tracking-[0.08em] uppercase text-[#808080]" style={FONT}>Description</span>
                <span className="w-[68px] text-right text-[11px] tracking-[0.08em] uppercase text-[#808080]" style={FONT}>Amount</span>
              </div>
              {items.length === 0 ? (
                <p className="py-4 text-[13px] text-[#a0a0a0]" style={FONT}>No line items</p>
              ) : (
                items.map((i, idx) => (
                  <div key={idx} className="flex items-start py-3 border-b border-[#f2f2f2]">
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-[#101828]" style={FONT}>{i.name}</p>
                      <p className="text-[12px] text-[#808080]" style={FONT}>{i.qty} {i.unit} × {money(i.unitPrice, currency)}</p>
                    </div>
                    <span className="w-[88px] text-right text-[14px] text-[#101828]" style={FONT}>{money(i.amount, currency)}</span>
                  </div>
                ))
              )}
            </div>

            {/* Totals */}
            <div className="ml-auto w-[200px] flex flex-col">
              <div className="flex justify-between py-1 text-[13px]" style={FONT}>
                <span className="text-[#808080]">Subtotal</span><span>{money(subtotal, currency)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between py-1 text-[13px]" style={FONT}>
                  <span className="text-[#808080]">Discount</span><span>- {money(discount, currency)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 mt-1 border-t-2 border-[#1b1b1b] text-[16px] font-bold" style={FONT}>
                <span>Total Due</span><span>{money(total, currency)}</span>
              </div>
            </div>

            {/* Payment */}
            <div className="bg-[#faf9f4] border border-[#eee] rounded-xl px-4 py-3.5 flex flex-col gap-3">
              <p className="text-[13px] font-bold text-[#1b1b1b]" style={FONT}>How to pay</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <div><Lbl>Account Name</Lbl><p className="text-[13px] font-semibold mt-0.5" style={FONT}>{bank.holder}</p></div>
                <div><Lbl>Bank</Lbl><p className="text-[13px] font-semibold mt-0.5" style={FONT}>{bank.bankName}</p></div>
                <div><Lbl>{accountNumberLabel(bank.number)}</Lbl><p className="text-[13px] font-semibold mt-0.5 break-words" style={FONT}>{bank.number}</p></div>
                <div><Lbl>SWIFT / BIC</Lbl><p className="text-[13px] font-semibold mt-0.5" style={FONT}>{bank.swift}</p></div>
                <div><Lbl>Currency</Lbl><p className="text-[13px] font-semibold mt-0.5" style={FONT}>{bank.currency}</p></div>
                <div><Lbl>Payment Reference</Lbl><p className="text-[13px] font-semibold mt-0.5" style={FONT}>{invoiceNo}</p></div>
              </div>
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
