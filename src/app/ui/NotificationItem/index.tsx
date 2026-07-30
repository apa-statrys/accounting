import { Button } from "../Button";
import styles from "./index.module.css";

/**
 * NotificationItem — Figma "[APP] Design System" → NotificationItem (node 4465-409).
 * A single row in a notification list: unread dot, title, description, a small
 * clock + relative time, an optional amount (always success-green, never a "$"
 * glyph — see lib/format.ts), and an optional CTA button. Unread rows bold the
 * title/amount and show the brand-orange dot; read rows drop both. `lastItem`
 * removes the hairline divider (for the final row in a list).
 */

interface NotificationItemProps {
  title: string;
  text: string;
  time: string;
  amount?: string;
  showAmount?: boolean;
  showAction?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  read?: boolean;
  lastItem?: boolean;
  className?: string;
}

function ClockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1" />
      <path d="M6 3.25V6L7.75 7.25" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function NotificationItem({
  title,
  text,
  time,
  amount,
  showAmount = true,
  showAction = true,
  actionLabel,
  onAction,
  read = false,
  lastItem = false,
  className,
}: NotificationItemProps) {
  return (
    <div className={[styles.item, lastItem ? styles.last : "", className].filter(Boolean).join(" ")}>
      <div className={styles.row}>
        <div className={styles.iconCol}>{!read && <span className={styles.dot} aria-hidden />}</div>
        <div className={styles.textCol}>
          <div className={styles.headRow}>
            <div className={styles.titleStack}>
              <p className={`${styles.title} ${read ? "body-sm" : "body-sm-bold"}`}>{title}</p>
              <p className={`${styles.text} caption`}>{text}</p>
              <div className={styles.timeRow}>
                <span className={styles.timeIcon}>
                  <ClockIcon />
                </span>
                <p className={`${styles.time} caption`}>{time}</p>
              </div>
            </div>
            {showAmount && amount && (
              <div className={styles.amountCol}>
                <p className={`${styles.amount} ${read ? "body-sm" : "body-sm-bold"}`}>{amount}</p>
              </div>
            )}
          </div>
          {showAction && actionLabel && <Button hierarchy="primary" size="sm" label={actionLabel} onClick={onAction} />}
        </div>
      </div>
    </div>
  );
}

export default NotificationItem;
