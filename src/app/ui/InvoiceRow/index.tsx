import styles from "./index.module.css";
import { Badge, BadgeColor } from "../Badge";

/**
 * InvoiceRow — design-system invoice list row (Figma "[APP] Design System" →
 * InvoiceRow, node 4250-544). Title + invoice number (with optional Recurring
 * chip), a status line (DS Badge text variant + caption), the amount on the
 * right, and an optional "Credited amount" strip. size sm = 14px title/amount
 * (list density), md = 16px. Rows draw their own bottom divider — set
 * lastItem on the final row to drop it. Styling in index.module.css.
 */

interface InvoiceRowProps {
  title: string;
  /** Hidden when omitted (Figma showInvoiceNo). */
  invoiceNo?: string;
  /** Adds the blue "Recurring" chip after the invoice number. */
  recurring?: boolean;
  /** Status chip label, e.g. "Paid" — colored via the Badge palette. */
  status?: string;
  statusColor?: BadgeColor;
  /** Plain text after the status chip, e.g. "on 12 Jun 2026". */
  statusCaption?: string;
  /** Preformatted, e.g. "USD 6,430.05". */
  amount: string;
  /** Preformatted credited total — shows the credited strip when set. */
  creditedAmount?: string;
  /** Leading label on the credited strip (Figma "Credited amount"); e.g. "Refund amount". Pass an
   *  empty string to show `creditedAmount` alone with no "label:" prefix (e.g. a credit-note number). */
  creditedLabel?: string;
  onCreditedClick?: () => void;
  size?: "sm" | "md";
  /** Last row of the list — no bottom divider. */
  lastItem?: boolean;
  /** Tap on the row itself. */
  onClick?: () => void;
}

function RepeatIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M8.5 5L10.5 3L8.5 1M10.5 3H3.5C2.96957 3 2.46086 3.21071 2.08579 3.58579C1.71071 3.96086 1.5 4.46957 1.5 5V5.5M3.5 7L1.5 9L3.5 11M1.5 9H8.5C9.03043 9 9.53914 8.78929 9.91421 8.41421C10.2893 8.03914 10.5 7.53043 10.5 7V6.5"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
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
  size = "sm",
  lastItem = false,
  onClick,
}: InvoiceRowProps) {
  const classes = [styles.row, size === "md" ? styles.md : "", lastItem ? styles.lastItem : "", onClick ? styles.clickable : ""]
    .filter(Boolean)
    .join(" ");
  const credited = creditedAmount && (
    <>
      <span className={styles.fileIcon}>
        <FileTextIcon />
      </span>
      {/* "<label>: <value>" normally; when creditedLabel is empty the strip shows the value alone
          (e.g. a credit-note number like "CN-2026-000006"). */}
      <span className={styles.creditedText}>{creditedLabel ? `${creditedLabel}: ${creditedAmount}` : creditedAmount}</span>
      <span className={styles.chevron}>
        <ChevronRightIcon />
      </span>
    </>
  );
  return (
    <div className={classes} onClick={onClick}>
      <div className={styles.main}>
        <div className={styles.info}>
          <p className={styles.title}>{title}</p>
          {invoiceNo && (
            <div className={styles.metaLine}>
              <span className={styles.invoiceNo}>{invoiceNo}</span>
              {recurring && (
                <>
                  <span className={styles.dot}>•</span>
                  <Badge label="Recurring" color="info" variant="text" size="sm" icon={<RepeatIcon />} />
                </>
              )}
            </div>
          )}
          {status && (
            <div className={styles.statusLine}>
              <Badge label={status} color={statusColor} variant="text" size="sm" />
              {statusCaption && <span className={styles.statusCaption}>{statusCaption}</span>}
            </div>
          )}
        </div>
        <p className={styles.amount}>{amount}</p>
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
