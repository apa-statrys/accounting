import { motion } from "motion/react";
import styles from "./index.module.css";

/**
 * Overlay — Figma "[APP] Design System" → Overlay (Sales Invoice · List frame,
 * node 1345-40950). The full-bleed scrim behind a modal/bottom sheet. Color
 * from styles/theme.css (--overlay: rgba(27, 27, 27, 0.6)).
 *
 * Ships its own fade-in/out variants — nest it inside a parent `AnimatePresence`
 * + `motion.div` that drives `initial`/`animate`/`exit` (see components/BottomSheet,
 * the app's single modal shell) rather than re-declaring the same opacity tween
 * per caller.
 */
export const overlayVariants = {
  closed: { opacity: 0 },
  open: { opacity: 1 },
};

interface OverlayProps {
  onClick?: () => void;
  className?: string;
}

export function Overlay({ onClick, className }: OverlayProps) {
  return (
    <motion.div
      className={[styles.overlay, className].filter(Boolean).join(" ")}
      variants={overlayVariants}
      transition={{ duration: 0.35 }}
      onClick={onClick}
      aria-hidden
    />
  );
}

export default Overlay;
