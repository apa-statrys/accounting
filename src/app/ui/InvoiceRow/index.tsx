import styles from "./index.module.css";
import { Badge, BadgeColor } from "../Badge";
import { InvoiceStatus } from "../InvoiceStatus";

/**
 * InvoiceRow — design-system invoice list row (Figma "[APP] Design System" →
 * InvoiceRow, node 4250-544 — restructured 2026-07-24: status moved to its own
 * full-width InvoiceStatus row at the top (2px gap to the title/amount row,
 * re-synced same day — was 8px, title was briefly Bold; both corrected to
 * match a Figma update: 4px outer gap, title back to Medium); the Recurring
 * chip moved from beside the invoice number to under the amount, switched
 * from Badge's info/text style to neutral/subtle with no icon; the credited-
 * amount strip has no trailing chevron per Figma, even when tappable, and
 * hugs its content — Figma "CreditedAmount", node 4250-486 — rather than
 * stretching the row's full width).
 * Title + invoice number, the amount and an optional Recurring chip on the
 * right, and an optional "Credited amount" strip. One size only (12px
 * vertical padding, 14px title/amount) — the earlier sm/md size variant was
 * removed from the Figma component. Rows draw their own bottom divider — set
 * lastItem on the final row to drop it. Styling in index.module.css.
 */

interface InvoiceRowProps {
  title: string;
  /** Hidden when omitted (Figma showInvoiceNo). */
  invoiceNo?: string;
  /** Adds the "Recurring" chip under the amount. */
  recurring?: boolean;
  /** Status label, e.g. "Paid" — colored via the Badge palette (InvoiceStatus). */
  status?: string;
  statusColor?: BadgeColor;
  /** Plain text after the status label, e.g. "on 12 Jun 2026". */
  statusCaption?: string;
  /** Preformatted, e.g. "USD 6,430.05". */
  amount: string;
  /** Preformatted credited total — shows the credited strip when set. */
  creditedAmount?: string;
  /** Leading label on the credited strip (Figma "Credited amount"); e.g. "Refund amount". */
  creditedLabel?: string;
  onCreditedClick?: () => void;
  /** Last row of the list — no bottom divider. */
  lastItem?: boolean;
  /** Tap on the row itself. */
  onClick?: () => void;
}

function FileTextIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M9.33333 1.33334H4C3.64638 1.33334 3.30724 1.47381 3.05719 1.72386C2.80714 1.97391 2.66667 2.31305 2.66667 2.66667V13.3333C2.66667 13.687 2.80714 14.0261 3.05719 14.2761C3.30724 14.5262 3.64638 14.6667 4 14.6667H12C12.3536 14.6667 12.6928 14.5262 12.9428 14.2761C13.1929 14.0261 13.3333 13.687 13.3333 13.3333V5.33334M9.33333 1.33334C9.54437 1.33299 9.75339 1.3744 9.94835 1.45518C10.1433 1.53596 10.3204 1.65451 10.4693 1.804L12.8613 4.196C13.0112 4.34501 13.1301 4.52223 13.2111 4.71744C13.2921 4.91265 13.3337 5.12198 13.3333 5.33334M9.33333 1.33334V4.66667C9.33333 4.84348 9.40357 5.01305 9.5286 5.13807C9.65362 5.2631 9.82319 5.33333 10 5.33333L13.3333 5.33334M6.66667 6H5.33333M10.6667 8.66667H5.33333M10.6667 11.3333H5.33333"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function InvoiceRow({
  title,
  invoiceNo,
  recurring = false,
  status,
  statusColor = "success",
  statusCaption,
  amount,
  creditedAmount,
  creditedLabel = "Credited amount",
  onCreditedClick,
  lastItem = false,
  onClick,
}: InvoiceRowProps) {
  const classes = [styles.row, lastItem ? styles.lastItem : "", onClick ? styles.clickable : ""]
    .filter(Boolean)
    .join(" ");
  const credited = creditedAmount && (
    <>
      <span className={styles.fileIcon}>
        <FileTextIcon />
      </span>
      <span className={styles.creditedText}>{creditedLabel}: {creditedAmount}</span>
    </>
  );
  return (
    <div className={classes} onClick={onClick}>
      <div className={styles.topGroup}>
        {status && <InvoiceStatus label={status} color={statusColor} caption={statusCaption} />}
        <div className={styles.main}>
          <div className={styles.info}>
            <p className={styles.title}>{title}</p>
            {invoiceNo && <p className={styles.invoiceNo}>{invoiceNo}</p>}
          </div>
          <div className={styles.amountCol}>
            <p className={styles.amount}>{amount}</p>
            {recurring && <Badge label="Recurring" color="neutral" variant="subtle" size="sm" />}
          </div>
        </div>
      </div>
      {creditedAmount &&
        (onCreditedClick ? (
          <button
            type="button"
            className={styles.credited}
            onClick={(e) => {
              e.stopPropagation();
              onCreditedClick();
            }}
          >
            {credited}
          </button>
        ) : (
          <div className={styles.credited}>{credited}</div>
        ))}
    </div>
  );
}

export default InvoiceRow;
