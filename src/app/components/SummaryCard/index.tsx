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
  negative = false,
  last = false,
}: {
  label: string;
  value: string;
  beige?: boolean;
  boldLabel?: boolean;
  boldValue?: boolean;
  /** Red/error value text — the row is actually subtracting from the total (e.g. an applied
   *  discount), matching every other subtracted-amount value elsewhere in the app. */
  negative?: boolean;
  /** Hides the row's bottom divider — pass on the final row (Figma "Create Invoice", node 1826-15914). */
  last?: boolean;
}) {
  const isTotal = boldLabel && boldValue;
  return (
    <div className={`${styles.row} ${isTotal ? styles.rowTotal : ''} ${beige ? styles.rowBeige : ''} ${last ? styles.noBorder : ''}`}>
      <span className={boldLabel ? styles.labelBold : styles.label}>{label}</span>
      <span className={boldValue ? styles.valueBold : negative ? styles.valueError : styles.valueMedium}>{value}</span>
    </div>
  );
}

interface SummaryCardProps {
  currency: string;
  subtotal: number;
  /** Discount amount in the invoice currency (the Discount row always shows, 0.00 when none). */
  discount: number;
  total: number;
  /** Skip the white card chrome and just render the rows — for reuse inside another surface
   *  that already provides its own background (e.g. the sticky dock's price-summary slot,
   *  Figma "Create Invoice" node 1419-52781). */
  bare?: boolean;
}

export function SummaryCard({ currency, subtotal, discount, total, bare = false }: SummaryCardProps) {
  const rows = (
    <>
      {/* Figma (node 1826-15916): the divider sits below Discount, not below Subtotal. */}
      <Row label="Subtotal" value={fmt(currency, subtotal)} last />
      {/* Always shown — 0.00 when there's no discount. */}
      <Row label="Discount" value={discount > 0 ? `−${fmt(currency, discount)}` : fmt(currency, 0)} negative={discount > 0} />
      <Row label="Total" value={fmt(currency, total)} boldLabel boldValue last />
    </>
  );
  return bare ? rows : <div className={styles.card}>{rows}</div>;
}

export default SummaryCard;
