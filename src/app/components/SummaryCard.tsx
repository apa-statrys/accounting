import { FONT } from "../lib/theme";

/** Summary money format, e.g. "USD 80.00". */
function fmt(currency: string, amount: number): string {
  return `${currency} ${amount.toFixed(2)}`;
}

function Row({
  label,
  value,
  beige = false,
  boldLabel = false,
  boldValue = false,
  brand = false,
}: {
  label: string;
  value: string;
  beige?: boolean;
  boldLabel?: boolean;
  boldValue?: boolean;
  brand?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between px-4 pt-4 pb-[17px] border-b border-[rgba(160,160,160,0.2)] ${
        beige ? "bg-[#f9f5ea]" : "bg-white"
      }`}
    >
      <span
        className={`leading-[1.3] text-[14px] ${boldLabel ? "font-bold text-[#1b1b1b]" : "text-[#808080]"}`}
        style={FONT}
      >
        {label}
      </span>
      <span
        className={`leading-[1.3] ${
          boldValue
            ? "text-[16px] font-bold text-[#101828]"
            : brand
            ? "text-[14px] font-medium text-[#ff4a15]"
            : "text-[14px] font-medium text-[#101828]"
        }`}
        style={FONT}
      >
        {value}
      </span>
    </div>
  );
}

interface SummaryCardProps {
  currency: string;
  subtotal: number;
  /** Discount amount in the invoice currency (the Discount row always shows, 0.00 when none). */
  discount: number;
  total: number;
}

export function SummaryCard({ currency, subtotal, discount, total }: SummaryCardProps) {
  return (
    <div
      className="w-full bg-white border border-dashed border-[rgba(160,160,160,0.2)] rounded-xl overflow-hidden"
      style={{ boxShadow: "var(--shadow-card-soft)" }}
    >
      <Row label="Subtotal" value={fmt(currency, subtotal)} />
      {/* Always shown — 0.00 when there's no discount. */}
      <Row label="Discount" value={discount > 0 ? `- ${fmt(currency, discount)}` : fmt(currency, 0)} brand={discount > 0} />
      {/* White like the other rows — the old beige fill blended into the beige page bg. */}
      <Row label="Total" value={fmt(currency, total)} boldLabel boldValue />
    </div>
  );
}

export default SummaryCard;
