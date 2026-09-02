import { ArrowUpRight } from "lucide-react";
import { XClose } from "../XClose";
import styles from "./index.module.css";

/**
 * ToastMessage — design-system toast card (Figma "[APP] Design System" → ToastMessage,
 * node 4603-6683). Dark inverse surface, an optional leading status icon (none for
 * "default"), title + optional subtitle, an optional "View Details"-style action link,
 * and a close button (ui/XClose, inverse). Purely presentational — no positioning,
 * timer, or animation; see components/Toast for the app's actual toast
 * delivery (bottom-anchored, clears the page's ButtonDock, auto-hide timer).
 */

export type ToastVariant = "default" | "success" | "error" | "warning";

/** Filled status glyphs (Figma's icons are a solid colored disc/triangle + white mark —
 *  NOT an outline icon like lucide's CircleCheck/OctagonAlert/TriangleAlert, so these are
 *  hand-drawn to match exactly). Fill color comes from the wrapping .icon span's `color`
 *  via currentColor; the inner mark is always white regardless of variant. */
function SuccessIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="10" fill="currentColor" />
      <path d="M5.8 10.3L8.4 12.9L14.2 7.1" stroke="white" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ErrorIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="10" fill="currentColor" />
      <rect x="9.2" y="5" width="1.6" height="6.5" rx="0.8" fill="white" />
      <circle cx="10" cy="14" r="1" fill="white" />
    </svg>
  );
}
function WarningIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 2.3L18 17H2L10 2.3Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <rect x="9.2" y="7.5" width="1.6" height="5" rx="0.8" fill="white" />
      <circle cx="10" cy="14.3" r="1" fill="white" />
    </svg>
  );
}

const ICONS: Record<Exclude<ToastVariant, "default">, React.ComponentType> = {
  success: SuccessIcon,
  error: ErrorIcon,
  warning: WarningIcon,
};

interface ToastMessageProps {
  variant?: ToastVariant;
  title: string;
  subtitle?: string;
  /** Optional trailing link (Figma "View Details") — omit for a plain toast. `icon` defaults to
   *  the "View Details" arrow; override it for an action that isn't navigation (e.g. a retry
   *  arrow for "Try Again"). `iconPosition` defaults to "trailing" (the arrow reads as "go to");
   *  a retry-style icon reads more naturally "leading" (icon, then label). */
  action?: { label: string; onClick: () => void; icon?: React.ReactNode; iconPosition?: "leading" | "trailing" };
  onClose: () => void;
}

export function ToastMessage({ variant = "default", title, subtitle, action, onClose }: ToastMessageProps) {
  const Icon = variant === "default" ? null : ICONS[variant];
  return (
    <div className={styles.toast}>
      {Icon && (
        <span className={`${styles.icon} ${styles[variant]}`}>
          <Icon />
        </span>
      )}
      <div className={styles.content}>
        <div className={styles.textBlock}>
          <p className={styles.title}>{title}</p>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        {action && (() => {
          const icon = action.icon ?? <ArrowUpRight size={16} strokeWidth={1.67} />;
          return (
            <button type="button" onClick={action.onClick} className={styles.link}>
              {action.iconPosition === "leading" && icon}
              {action.label}
              {action.iconPosition !== "leading" && icon}
            </button>
          );
        })()}
      </div>
      <XClose size="sm" inverse onClick={onClose} aria-label="Dismiss" />
    </div>
  );
}

export default ToastMessage;
