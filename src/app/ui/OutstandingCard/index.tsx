import styles from "./index.module.css";

/**
 * OutstandingCard — design-system dashboard hero card (Figma "[APP] Design
 * System" → OutstandingCard, node 4141-8627). Dark card: expected amount +
 * credit-card icon, a "Collected" box with a gradient progress bar (success
 * green at 100%) and optional rocket encouragement line, then the outstanding
 * amount with an optional invoices link. Data-driven — amounts arrive
 * preformatted (use lib/format money helpers); Figma's collected/overdue
 * variants are just different prop values. Styling in index.module.css.
 */

const creditCardIcon = new URL("./credit-card.svg", import.meta.url).href;

interface OutstandingCardProps {
  /** Card heading, e.g. "Expected this month". */
  label?: string;
  currency?: string;
  /** Preformatted amounts, e.g. "20,000.00". */
  expected: string;
  collected: string;
  outstanding: string;
  /** Collected percentage 0–100 — drives the bar; 100 turns it success green. */
  percent: number;
  /** Rocket line under the bar; omit to hide (Figma hides it at 0%). */
  encouragement?: string;
  /** Bottom-right link, e.g. "2 invoices" / "1 overdue out of 2 invoices". */
  linkLabel?: string;
  onLinkClick?: () => void;
  /** Makes the whole Collected box tappable (app: opens the Paid list). */
  onCollectedClick?: () => void;
  /** Caption after the outstanding amount, e.g. "to collect" (Figma 0% variant). */
  outstandingSuffix?: string;
}

function RocketIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M7 8.75V11.6667C7 11.6667 8.7675 11.3458 9.33333 10.5C9.96333 9.555 9.33333 7.58333 9.33333 7.58333M7 8.75C7.81475 8.43992 8.59642 8.04908 9.33333 7.58333M7 8.75L5.25 6.99986M5.25 6.99986C5.56042 6.19453 5.95129 5.42256 6.41667 4.69569C7.09636 3.60894 8.04278 2.71414 9.16592 2.09641C10.2891 1.47869 11.5516 1.15858 12.8333 1.16653C12.8333 2.75319 12.3783 5.54167 9.33333 7.58333M5.25 6.99986L2.33333 7.00005C2.33333 7.00005 2.65417 5.23255 3.5 4.66672C4.445 4.03672 6.41667 4.69569 6.41667 4.69569M2.625 9.6249C1.75 10.3599 1.45833 12.5416 1.45833 12.5416C1.45833 12.5416 3.64 12.2499 4.375 11.3749C4.78917 10.8849 4.78333 10.1324 4.3225 9.6774C4.09576 9.46099 3.79709 9.33594 3.4838 9.32625C3.17051 9.31656 2.86468 9.42292 2.625 9.6249Z"
        stroke="currentColor"
        strokeWidth="0.67"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function OutstandingCard({
  label = "Expected this month",
  currency = "HKD",
  expected,
  collected,
  outstanding,
  percent,
  encouragement,
  linkLabel,
  onLinkClick,
  onCollectedClick,
  outstandingSuffix,
}: OutstandingCardProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const CollectedBox = onCollectedClick ? "button" : "div";
  return (
    <div className={styles.card}>
      <div className={styles.headerRow}>
        <div className={styles.headerText}>
          <p className={styles.label}>{label}</p>
          <div className={styles.amountRow}>
            <span className={styles.currency}>{currency}</span>
            <span className={styles.expected}>{expected}</span>
          </div>
        </div>
        <img className={styles.cardIcon} src={creditCardIcon} alt="" />
      </div>

      <CollectedBox
        {...(onCollectedClick ? { type: "button" as const, onClick: onCollectedClick } : {})}
        className={onCollectedClick ? `${styles.collectedBox} ${styles.collectedBoxButton}` : styles.collectedBox}
      >
        <p className={styles.boxLabel}>Collected</p>
        <div className={styles.amountRow}>
          <span className={styles.currency}>{currency}</span>
          <span className={styles.collected}>{collected}</span>
        </div>
        <div className={styles.barRow}>
          <div className={styles.track}>
            {clamped > 0 && (
              <div className={clamped === 100 ? styles.fillFull : styles.fill} style={{ width: `${clamped}%` }} />
            )}
          </div>
          <span className={styles.percent}>{clamped}%</span>
        </div>
        {encouragement && (
          <div className={styles.encouragement}>
            <RocketIcon />
            <p className={styles.encouragementText}>{encouragement}</p>
          </div>
        )}
      </CollectedBox>

      <div className={styles.divider} />

      <div className={styles.footer}>
        <div className={styles.outstandingBlock}>
          <p className={styles.boxLabel}>Outstanding</p>
          <div className={styles.amountRow}>
            <span className={styles.currency}>{currency}</span>
            <span className={styles.outstanding}>{outstanding}</span>
            {outstandingSuffix && <span className={styles.suffix}>{outstandingSuffix}</span>}
          </div>
        </div>
        {linkLabel && (
          <button type="button" className={styles.link} onClick={onLinkClick}>
            {linkLabel}
            <ArrowIcon />
          </button>
        )}
      </div>
    </div>
  );
}

export default OutstandingCard;
