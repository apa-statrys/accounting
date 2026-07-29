import styles from './index.module.css';

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
  last = false,
}: {
  label: string;
  value: string;
  beige?: boolean;
  boldLabel?: boolean;
  boldValue?: boolean;
  brand?: boolean;
  /** Hides the row's bottom divider — pass on the final row (Figma "Create Invoice", node 1826-15914). */
  last?: boolean;
}) {
  const isTotal = boldLabel && boldValue;
  return (
    <div className={`${styles.row} ${isTotal ? styles.rowTotal : ''} ${beige ? styles.rowBeige : ''} ${last ? styles.noBorder : ''}`}>
      <span className={boldLabel ? styles.labelBold : styles.label}>{label}</span>
      <span
        className={
          boldValue
            ? styles.valueBold
            : brand
            ? styles.valueBrandMedium
            : styles.valueMedium
        }
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
    <div className={styles.card}>
      {/* Figma (node 1826-15916): the divider sits below Discount, not below Subtotal. */}
      <Row label="Subtotal" value={fmt(currency, subtotal)} last />
      {/* Always shown — 0.00 when there's no discount. */}
      <Row label="Discount" value={discount > 0 ? `- ${fmt(currency, discount)}` : fmt(currency, 0)} brand={discount > 0} />
      <Row label="Total" value={fmt(currency, total)} boldLabel boldValue last />
    </div>
  );
}

export default SummaryCard;
