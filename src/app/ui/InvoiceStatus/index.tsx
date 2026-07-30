import type { BadgeColor } from "../Badge";
import styles from "./index.module.css";

/**
 * InvoiceStatus — design-system status + date row (Figma "[APP] Design System" →
 * InvoiceStatus, node 4250-477). A colored, unpadded status label on the left and a
 * muted caption (usually a date) on the right, space-between across the full width.
 *
 * Figma models `status` as a fixed 8-value enum with a baked-in color/label/caption
 * per value — this app's real usage needs more labels than that (e.g. "Pending Refund",
 * a CN-driven "Refunded" in info-blue not success-green — see InvoiceCard.tsx's
 * `rowStatus()`), so this takes a free `label` + `color` (the shared Badge palette)
 * instead, same convention as InvoiceRow's existing status props.
 */

const COLOR_CLASS: Record<BadgeColor, string> = {
  neutral: styles.neutral,
  success: styles.success,
  warning: styles.warning,
  error: styles.error,
  info: styles.info,
  custom: styles.custom,
};

interface InvoiceStatusProps {
  label: string;
  color?: BadgeColor;
  /** Usually a date, e.g. "12 Jun 2026" or "Due 30 Jun 2026" — hidden when omitted. */
  caption?: string;
  className?: string;
}

export function InvoiceStatus({ label, color = "success", caption, className }: InvoiceStatusProps) {
  return (
    <div className={[styles.row, className].filter(Boolean).join(" ")}>
      <span className={[styles.label, COLOR_CLASS[color]].join(" ")}>{label}</span>
      {caption && <span className={styles.caption}>{caption}</span>}
    </div>
  );
}

export default InvoiceStatus;
