import { ChevronLeft, Calendar, Share2, Pencil } from "lucide-react";
import { Button } from "./Buttons";

const STATUS_BADGE = "AWAITING PAYMENT";

const LINE_ITEMS = [
  { name: "Brand identity system", qty: 1, price: 4200 },
  { name: "Landing page design", qty: 12, price: 145 },
];

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

const total = LINE_ITEMS.reduce((sum, i) => sum + i.qty * i.price, 0);

export function InvoicePreview({ onSend }: { onSend?: () => void }) {
  return (
    <div
      className="relative bg-[#F9F5EA] rounded-[48px] overflow-hidden shadow-2xl flex flex-col"
      style={{ width: 375, height: 812 }}
    >
      {/* Status bar */}
      <div className="flex items-center justify-between px-6 pt-4 pb-1">
        <span className="text-[15px] font-semibold tracking-tight">9:41</span>
        <div className="absolute left-1/2 -translate-x-1/2 top-2 w-28 h-7 bg-black rounded-full" />
        <div className="flex items-center gap-1.5">
          <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
            <rect x="0" y="4" width="3" height="8" rx="0.5" fill="black" />
            <rect x="4.5" y="2.5" width="3" height="9.5" rx="0.5" fill="black" />
            <rect x="9" y="0.5" width="3" height="11.5" rx="0.5" fill="black" />
            <rect x="13.5" y="0" width="3" height="12" rx="0.5" fill="black" fillOpacity="0.3" />
          </svg>
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
            <path d="M8 2.5C10.2 2.5 12.2 3.4 13.6 4.9L15 3.4C13.2 1.5 10.7 0.3 8 0.3C5.3 0.3 2.8 1.5 1 3.4L2.4 4.9C3.8 3.4 5.8 2.5 8 2.5Z" fill="black" />
            <path d="M8 5.5C9.4 5.5 10.6 6.1 11.5 7L12.9 5.5C11.6 4.2 9.9 3.4 8 3.4C6.1 3.4 4.4 4.2 3.1 5.5L4.5 7C5.4 6.1 6.6 5.5 8 5.5Z" fill="black" />
            <circle cx="8" cy="10" r="1.5" fill="black" />
          </svg>
          <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
            <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="black" strokeOpacity="0.35" />
            <rect x="2" y="2" width="18" height="8" rx="2" fill="black" />
            <path d="M23 4V8C23.8 7.6 24.5 6.9 24.5 6C24.5 5.1 23.8 4.4 23 4Z" fill="black" fillOpacity="0.4" />
          </svg>
        </div>
      </div>

      {/* Nav bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <button className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 bg-white">
          <ChevronLeft size={17} strokeWidth={2} />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[17px] font-semibold">New Invoice</span>
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded tracking-wide"
            style={{ background: "#FFF3E0", color: "#E65100" }}
          >
            {STATUS_BADGE}
          </span>
        </div>
        <button className="w-8 h-8 flex items-center justify-center text-gray-600">
          <Share2 size={18} />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-32">

        {/* Amount due hero card */}
        <div className="mx-4 mt-5 bg-[#1B1B1B] rounded-2xl p-5">
          <p className="text-[11px] font-semibold text-gray-400 tracking-widest mb-2">AMOUNT DUE</p>
          <p className="text-[40px] font-black text-[#F9F5EA] leading-none tracking-tight mb-4">
            {formatCurrency(total)}
          </p>
          <div className="flex items-center gap-3">
            <span className="bg-[#FF4A15] text-white text-[12px] font-semibold px-3 py-1 rounded-full">
              INV-2026-00042
            </span>
            <span className="text-[13px] text-gray-400">Due Jun 25, 2026</span>
          </div>
        </div>

        {/* Invoice header card */}
        <div className="mx-4 mt-3 bg-white rounded-2xl p-5">
          <div>
            <p className="text-[11px] text-gray-400 mb-0.5">BILL TO</p>
            <p className="text-[13px] font-semibold text-gray-900">Marlow & Finch Studio</p>
            <p className="text-[12px] text-gray-400">ap@marlowfinch.co</p>
          </div>
        </div>

        {/* Dates */}
        <div className="mx-4 mt-3 bg-white rounded-2xl divide-y divide-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-[14px] text-gray-400">Issue date</span>
            <div className="flex items-center gap-1.5">
              <Calendar size={13} className="text-gray-400" />
              <span className="text-[14px] text-gray-900">Jun 11, 2026</span>
            </div>
          </div>
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-[14px] text-gray-400">Due date</span>
            <div className="flex items-center gap-1.5">
              <Calendar size={13} className="text-[#E8540A]" />
              <span className="text-[14px] font-medium text-[#E8540A]">Jun 25, 2026</span>
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="mx-4 mt-3">
          <p className="text-[11px] font-semibold text-gray-400 tracking-widest mb-2 px-1">LINE ITEMS</p>
          <div className="bg-white rounded-2xl overflow-hidden divide-y divide-gray-100">
            {LINE_ITEMS.map((item) => (
              <div key={item.name} className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <p className="text-[15px] text-gray-900">{item.name}</p>
                  <p className="text-[15px] text-gray-900">{formatCurrency(item.qty * item.price)}</p>
                </div>
                <p className="text-[12px] text-gray-400 mt-0.5">{item.qty} unit × {formatCurrency(item.price)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Receiving account */}
        <div className="mx-4 mt-3 bg-white rounded-2xl px-4 py-4">
          <p className="text-[11px] font-semibold text-gray-400 tracking-widest mb-2">RECEIVING ACCOUNT</p>
          <p className="text-[15px] text-gray-900">SG 829302029</p>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[28px] px-4 pt-4 pb-10 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="flex gap-3">
          <button className="border border-gray-200 rounded-2xl px-4 py-3.5 flex items-center justify-center">
            <Pencil size={18} className="text-gray-700" />
          </button>
          <Button variant="primary" className="flex-1" onClick={onSend}>
            SEND INVOICE
          </Button>
        </div>
      </div>
    </div>
  );
}
