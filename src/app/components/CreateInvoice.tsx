import { useState } from "react";
import { X, Plus } from "lucide-react";
import { Search } from "./Search";
import { Button } from "./Buttons";
import { RadioGroup } from "./RadioCard";

const CLIENTS = [
  { id: "mf", name: "Marlow & Finch Studio", email: "finch@studio.com" },
  { id: "bh", name: "Bright Harbor Co.", email: "billing@brightharbor.com" },
  { id: "or", name: "Otto Reyes", email: "otto@eyedesign.co" },
];

interface CreateInvoiceProps {
  onClose?: () => void;
}

export function CreateInvoice({ onClose }: CreateInvoiceProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = CLIENTS.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.email.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      className="relative bg-[#F9F5EA] rounded-[48px] overflow-hidden shadow-2xl flex flex-col"
      style={{ width: 375, height: 812 }}
    >
      {/* Status bar */}
      <div className="flex items-center justify-between px-8 pt-4 pb-1">
        <span className="text-[17px] font-semibold tracking-tight" style={{ fontFamily: "GT Walsheim LC, sans-serif" }}>09:41</span>
        <div className="absolute left-1/2 -translate-x-1/2 top-2 w-28 h-7 bg-black rounded-full" />
        <div className="flex items-center gap-1.5">
          <svg width="20" height="12" viewBox="0 0 19.97 12" fill="none">
            <rect x="0" y="4" width="3" height="8" rx="0.5" fill="black" />
            <rect x="4.5" y="2.5" width="3" height="9.5" rx="0.5" fill="black" />
            <rect x="9" y="0.5" width="3" height="11.5" rx="0.5" fill="black" />
            <rect x="13.5" y="0" width="3" height="12" rx="0.5" fill="black" fillOpacity="0.3" />
          </svg>
          <svg width="17" height="13" viewBox="0 0 17 12.5" fill="none">
            <path d="M8.5 2.5C10.7 2.5 12.7 3.4 14.1 4.9L15.5 3.4C13.7 1.5 11.2 0.3 8.5 0.3C5.8 0.3 3.3 1.5 1.5 3.4L2.9 4.9C4.3 3.4 6.3 2.5 8.5 2.5Z" fill="black" />
            <path d="M8.5 5.5C9.9 5.5 11.1 6.1 12 7L13.4 5.5C12.1 4.2 10.4 3.4 8.5 3.4C6.6 3.4 4.9 4.2 3.6 5.5L5 7C5.9 6.1 7.1 5.5 8.5 5.5Z" fill="black" />
            <circle cx="8.5" cy="10.5" r="1.5" fill="black" />
          </svg>
          <svg width="27" height="13" viewBox="0 0 27.33 13" fill="none">
            <rect x="0.5" y="0.5" width="21" height="12" rx="3.5" stroke="black" strokeOpacity="0.35" />
            <rect x="2" y="2" width="18" height="9" rx="2" fill="black" />
            <path d="M23 4.5V8.5C23.8 8.1 24.5 7.1 24.5 6C24.5 4.9 23.8 3.9 23 4.5Z" fill="black" fillOpacity="0.4" />
          </svg>
        </div>
      </div>

      {/* Sheet header */}
      <div
        className="flex items-center justify-between px-4 pt-3 pb-3 bg-[#F9F5EA]"
        style={{ borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: "rgba(208,208,208,0.4)" }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="w-[30px] h-[30px] rounded-full bg-white flex items-center justify-center"
          aria-label="Close"
        >
          <X size={14} strokeWidth={1.5} className="text-[#1B1B1B]" />
        </button>

        {/* Title */}
        <p
          className="flex-1 text-center text-[16px] tracking-[-0.8px]"
          style={{ fontFamily: "GT Walsheim LC, sans-serif", fontWeight: 700, color: "#1B1B1B" }}
        >
          New Invoice
        </p>

        {/* Spacer to balance close btn */}
        <div className="w-[30px]" />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pt-5 pb-36">
        {/* Section header */}
        <div className="flex items-center justify-between mb-4">
          <p
            className="text-[18px]"
            style={{ fontFamily: "GT Walsheim LC, sans-serif", fontWeight: 700, color: "#1B1B1B" }}
          >
            Add a customer
          </p>
          <button
            className="w-[30px] h-[30px] rounded-full bg-[#1B1B1B] flex items-center justify-center"
            aria-label="New customer"
          >
            <Plus size={14} strokeWidth={1.5} className="text-[#F9F5EA]" />
          </button>
        </div>

        {/* Search */}
        <div className="mb-4">
          <Search
            placeholder="Search"
            size="sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Client list */}
        <RadioGroup
          name="client"
          value={selected ?? ""}
          onChange={setSelected}
          alignment="horizontal"
          size="sm"
          showIcon={false}
          showText={true}
          className="w-full"
          options={filtered.map((c) => ({
            value: c.id,
            label: c.name,
            description: c.email,
          }))}
        />
      </div>

      {/* Button dock */}
      <div className="absolute bottom-0 left-0 right-0 bg-white pt-4">
        <div className="flex gap-3 px-4">
          <Button
            variant="secondary"
            size="md"
            className="flex-1"
            disabled={!selected}
          >
            Send Later
          </Button>
          <Button
            variant="primary"
            size="md"
            className="flex-1"
            disabled={!selected}
          >
            Send Invoice
          </Button>
        </div>
        {/* Home indicator */}
        <div className="flex justify-center py-3">
          <div className="w-[120px] h-[5px] bg-black rounded-full opacity-20" />
        </div>
      </div>
    </div>
  );
}
