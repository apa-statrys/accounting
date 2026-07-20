import type { ReactNode } from "react";
import { StatusBar } from "../StatusBar";
import styles from "./index.module.css";

/**
 * PageAppHeader — sticky frosted app-header shell (Figma "Sales Invoice —
 * Client" PageAppHeader: default node 1323-15979, on-scroll node 1332-17938).
 * Composes the phone StatusBar above a DS PageHeader (passed as children) in a
 * `position: sticky` container.
 *
 * Two states, driven by `scrolled` (the page owns the scroll listener + the
 * boolean — pass the same value to the child PageHeader's `collapsed` prop to
 * morph the title in sync):
 *   at rest    fully transparent, so the page shows through unchanged
 *   scrolled   frosted glass — a White/40→transparent tint over a backdrop
 *              blur, whose bottom edge eases off via a mask so content
 *              dissolves through instead of hitting a hard cut line
 *
 * The frost + its bottom-fade mask live on a separate layer BEHIND the content
 * (.frost), so the mask never washes out the buttons/title sitting on top —
 * those keep the crisp DS MenuPageHeader glass-button styling at all times.
 *
 * Styling lives in index.module.css — reuse this instead of re-deriving the
 * frost/blur/mask inline so every scrolling screen stays consistent.
 */

interface PageAppHeaderProps {
  /** True once the page has scrolled past the header — flips to frosted glass. */
  scrolled?: boolean;
  /** The DS PageHeader (or other header content) rendered under the status bar. */
  children: ReactNode;
}

export function PageAppHeader({ scrolled = false, children }: PageAppHeaderProps) {
  return (
    <div className={`${styles.root} ${scrolled ? styles.scrolled : ""}`}>
      <div className={styles.frost} aria-hidden />
      <StatusBar />
      {children}
    </div>
  );
}

export default PageAppHeader;
