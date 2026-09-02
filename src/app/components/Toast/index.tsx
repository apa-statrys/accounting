import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ToastMessage, type ToastVariant } from "../../ui/ToastMessage";
import styles from "./index.module.css";

interface ToastProps {
  open: boolean;
  /** Short, scannable title (e.g. "Invoice sent"). */
  message?: string;
  /** Optional second line (e.g. "Marked as sent"). */
  subtext?: string;
  onDone?: () => void;
  duration?: number;
  variant?: ToastVariant;
  /** Optional "View Details"-style trailing link (Figma) — `icon`/`iconPosition` override the
   *  default trailing arrow (e.g. a leading retry arrow for "Try Again"). */
  action?: { label: string; onClick: () => void; icon?: React.ReactNode; iconPosition?: "leading" | "trailing" };
  /** Distance (px) from the page's true bottom edge. Default 96 clears a single-button
   *  ButtonDock or a FAB with a little breathing room. Pass ~150 on a page whose dock is
   *  "double"/"triple" at the moment the toast fires, or ~16 (Figma spec, "16px above the
   *  bottom toolbar") on a page with no bottom chrome at all (e.g. CustomerList). */
  bottomOffset?: number;
}

/** Bottom toast (Figma "[APP] Design System" → ToastMessage, node 4603-6683) — auto-hides
 *  after `duration`, or dismiss immediately via its own close button. Anchored above the
 *  page's bottom chrome (see `bottomOffset`) so it never covers a dock/FAB. */
export function Toast({
  open,
  message = "Invoice sent",
  subtext,
  onDone,
  duration = 3000,
  variant = "success",
  action,
  bottomOffset = 96,
}: ToastProps) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => onDone?.(), duration);
    return () => clearTimeout(t);
  }, [open, duration, onDone]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.toast}
          style={{ bottom: bottomOffset }}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        >
          <ToastMessage variant={variant} title={message} subtitle={subtext} action={action} onClose={() => onDone?.()} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Toast;
