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
}: {
  label: string;
  value: string;
  beige?: boolean;
  boldLabel?: boolean;
  boldValue?: boolean;
  brand?: boolean;
}) {
  return (
    <div className={`${styles.row} ${beige ? styles.rowBeige : ''}`}>
      <span className={boldLabel ? styles.labelBold : `body-sm ${styles.label}`}>{label}</span>
      <span
        className={
          boldValue
            ? styles.valueBold
            : brand
            ? `body-sm-medium ${styles.valueBrand}`
            : `body-sm-medium ${styles.value}`
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
      <Row label="Subtotal" value={fmt(currency, subtotal)} />
      {/* Always shown — 0.00 when there's no discount. */}
      <Row label="Discount" value={discount > 0 ? `- ${fmt(currency, discount)}` : fmt(currency, 0)} brand={discount > 0} />
      {/* White like the other rows — the old beige fill blended into the beige page bg. */}
      <Row label="Total" value={fmt(currency, total)} boldLabel boldValue />
    </div>
  );
}

export default SummaryCard;
