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
  discount = false,
  last = false,
}: {
  label: string;
  value: string;
  beige?: boolean;
  boldLabel?: boolean;
  boldValue?: boolean;
  /** Red value text — the row is an applied discount, same "subtracted amount" treatment credit
   *  notes and refunds use (decided 2026-08-11, supersedes the earlier brand-colored 2026-08-02
   *  decision). */
  discount?: boolean;
  /** Hides the row's bottom divider — pass on the final row (Figma "Create Invoice", node 1826-15914). */
  last?: boolean;
}) {
  const isTotal = boldLabel && boldValue;
  return (
    <div className={`${styles.row} ${isTotal ? styles.rowTotal : ''} ${beige ? styles.rowBeige : ''} ${last ? styles.noBorder : ''}`}>
      <span className={boldLabel ? styles.labelBold : styles.label}>{label}</span>
      <span className={boldValue ? styles.valueBold : discount ? styles.valueError : styles.valueMedium}>{value}</span>
    </div>
  );
}

interface SummaryCardProps {
  currency: string;
  subtotal: number;
  /** Discount amount in the invoice currency — the row only shows when this is > 0. */
  discount: number;
  total: number;
  /** Skip the white card chrome and just render the rows — for reuse inside another surface
   *  that already provides its own background (e.g. the sticky dock's price-summary slot,
   *  Figma "Create Invoice" node 1419-52781). */
  bare?: boolean;
}

export function SummaryCard({ currency, subtotal, discount, total, bare = false }: SummaryCardProps) {
  const hasDiscount = discount > 0;
  const rows = (
    <>
      {/* Figma (node 1826-15916): the divider sits below Discount, not below Subtotal — when
          there's no discount row to carry it, Subtotal takes over that divider instead. */}
      <Row label="Subtotal" value={fmt(currency, subtotal)} last={hasDiscount} />
      {hasDiscount && <Row label="Discount" value={`−${fmt(currency, discount)}`} discount />}
      <Row label="Total" value={fmt(currency, total)} boldLabel boldValue last />
    </>
  );
  return bare ? rows : <div className={styles.card}>{rows}</div>;
}

export default SummaryCard;
