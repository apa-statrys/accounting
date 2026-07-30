import { forwardRef } from "react";
import styles from "./index.module.css";

/**
 * BottomsheetsEnd — the sheet's footer area (Figma "[APP] Design System" →
 * BottomsheetsEnd, node 4127-7752). That frame's own variant matrix (Button
 * Type: Primary/+Outline/+Ghost/+Secondary+Tertiary × Stack: Vertical/
 * Horizontal × IOS controls: None/App status bar/Keyboard) is already fully
 * covered by components/ButtonDock (Figma "StickyButton", node 4141-2746) —
 * pass one as `children`, don't re-implement the buttons here.
 *
 * This component owns only the wrapper behavior a sheet footer needs, which
 * ButtonDock alone doesn't know about:
 *   in-flow  default — sits below the scrollable content in its own flex
 *            space (nothing scrolls underneath, so a plain white bg is fine)
 *   overlap  the parent sheet measured that content already overflows
 *            without the footer's own space — floats over the scrolled
 *            content instead (position: absolute, transparent) so the
 *            dock's own gradient + blur (its .frost layer) actually frosts
 *            something, instead of sitting on an opaque backing (see
 *            components/BottomSheet's `footerOverlap` measurement)
 * No dock at all (Figma "Padding Bottom", node 4038-3023): renders the plain
 * 32px bottom spacer instead.
 */

interface BottomsheetsEndProps {
  /** The dock — almost always a <ButtonDock>. Omit for the plain 32px spacer. */
  children?: React.ReactNode;
  /** True once the parent sheet measures its content overflows without the footer's own flex space. */
  overlap?: boolean;
  /** Compact sheets skip the spacer — their own tighter content padding covers the gap instead. */
  skipSpacer?: boolean;
}

export const BottomsheetsEnd = forwardRef<HTMLDivElement, BottomsheetsEndProps>(function BottomsheetsEnd(
  { children, overlap = false, skipSpacer = false },
  ref
) {
  if (!children) {
    return skipSpacer ? null : <div className={styles.bottomPad} />;
  }
  return (
    <div ref={ref} className={[styles.footer, overlap ? styles.footerOverlap : ""].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
});

export default BottomsheetsEnd;
