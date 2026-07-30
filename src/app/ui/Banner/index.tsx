import { CircleCheck, TriangleAlert, OctagonAlert, Info, X } from "lucide-react";
import styles from "./index.module.css";

/**
 * Banner — design-system inline status message (Figma "[APP] Design System" →
 * Banner, node 4631-372). A subtle-tinted row: 16px status icon + text, in one
 * of four colors. `title` switches on Figma's "Title + Text" layout — a
 * medium-weight title (body-sm, 14px) + a caption-sized (12px) detail line
 * below it; omit `title` for the plain "Text only" layout, which keeps the
 * single line at body-sm (14px). Optional trailing "View Details" text link
 * (shown when `onLinkClick` is passed — no icon, plain text) and an optional
 * dismiss × (shown when `onClose` is passed). Text/title/link are always ink
 * (--text-primary/--link-primary) across every color — only the icon (and
 * the bg/border wash) carries the status color. Non-interactive otherwise.
 * Styling in index.module.css.
 */

export type BannerColor = "info" | "success" | "warning" | "error";

const ICONS: Record<BannerColor, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  success: CircleCheck,
  warning: TriangleAlert,
  error: OctagonAlert,
  info: Info,
};

interface BannerProps {
  color: BannerColor;
  text: string;
  /** Bold headline above `text` (Figma "Title + Text") — omit for "Text only". */
  title?: string;
  /** Trailing "View Details" text link — shown when `onLinkClick` is provided. */
  linkLabel?: string;
  onLinkClick?: () => void;
  /** Dismiss (×) button — shown when provided. */
  onClose?: () => void;
  className?: string;
}

export function Banner({ color, text, title, linkLabel = "View Details", onLinkClick, onClose, className }: BannerProps) {
  const Icon = ICONS[color];
  return (
    <div className={`${styles.banner} ${styles[color]} ${className || ""}`}>
      <span className={styles.icon}>
        <Icon size={16} strokeWidth={1.67} />
      </span>
      <div className={styles.body}>
        <div className={styles.textGroup}>
          {title && <p className={styles.title}>{title}</p>}
          <p className={title ? styles.textCaption : styles.text}>{text}</p>
        </div>
        {onLinkClick && (
          <button type="button" className={styles.link} onClick={onLinkClick}>
            {linkLabel}
          </button>
        )}
      </div>
      {onClose && (
        <button type="button" className={styles.close} aria-label="Dismiss" onClick={onClose}>
          <X size={20} strokeWidth={1.67} />
        </button>
      )}
    </div>
  );
}

export default Banner;
