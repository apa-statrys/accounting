import styles from "./index.module.css";

/**
 * PageHeader — design-system page header (Figma "[APP] Design System" →
 * PageHeader, node 2558-13623). Four types:
 *   "left"           back/search button row with a big 32px title below
 *                    (Figma "Left align"); children replace the title slot
 *   "left-on-scroll" 48px compact row, 22px left-aligned title — the scrolled
 *                    state of "left" (Figma default)
 *   "center"         48px row, 18px centered title between the buttons
 *   "search"         48px row, back button + frosted search pill (input + mic)
 * Buttons and pill are frosted glass (White/40, 12px backdrop blur,
 * Shadow/MenuPageHeader) — made to float over page content while it scrolls
 * underneath. Styling in index.module.css.
 */

export type PageHeaderType = "left" | "left-on-scroll" | "center" | "search";

interface PageHeaderProps {
  type?: PageHeaderType;
  title?: string;
  /** Secondary line under the title (Figma showText). */
  text?: string;
  /** Hide the back button (Figma showLeftButton). */
  showBack?: boolean;
  onBack?: () => void;
  /** Hide the right-side button (Figma showRightButton) — an invisible 36px
   *  spacer keeps the "center" title optically centered. */
  showSearch?: boolean;
  /** Tap on the right-side search button (all types except "search"). */
  onSearchClick?: () => void;
  /** Code slot: swap the right-side search icon for another action (e.g. a
   *  settings gear) — the DS frosted-glass button styling is kept. */
  rightIcon?: React.ReactNode;
  rightLabel?: string;
  onRightClick?: () => void;
  /** Code slot: replace the right-side button entirely with custom content
   *  (e.g. an autosave "✓ Saved" chip) — no glass-button styling applied. */
  right?: React.ReactNode;
  /** type="search" only — the pill's controlled input + mic action. */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  onMicClick?: () => void;
  /** type="left" only — custom content replacing the big-title slot. */
  children?: React.ReactNode;
}

function ChevronLeftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Same magnifier path as ui/Search — the glass button uses a heavier stroke than the pill. */
function SearchIcon({ strokeWidth }: { strokeWidth: number }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M17.4999 17.5001L13.8833 13.8835M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 15.8333V18.3333M4.16667 8.33333V10C4.16667 11.5471 4.78125 13.0308 5.87521 14.1248C6.96917 15.2188 8.4529 15.8333 10 15.8333C11.5471 15.8333 13.0308 15.2188 14.1248 14.1248C15.2188 13.0308 15.8333 11.5471 15.8333 10V8.33333M10 1.66667C11.3807 1.66667 12.5 2.78595 12.5 4.16667V10C12.5 11.3807 11.3807 12.5 10 12.5C8.61929 12.5 7.5 11.3807 7.5 10V4.16667C7.5 2.78595 8.61929 1.66667 10 1.66667Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GlassButton({ onClick, "aria-label": ariaLabel, children }: { onClick?: () => void; "aria-label": string; children: React.ReactNode }) {
  return (
    <button type="button" className={styles.glassButton} onClick={onClick} aria-label={ariaLabel}>
      {children}
    </button>
  );
}

export function PageHeader({
  type = "left-on-scroll",
  title,
  text,
  showBack = true,
  onBack,
  showSearch = true,
  onSearchClick,
  rightIcon,
  rightLabel,
  onRightClick,
  right,
  searchValue = "",
  onSearchChange,
  searchPlaceholder,
  onMicClick,
  children,
}: PageHeaderProps) {
  const back = showBack && (
    <GlassButton aria-label="Back" onClick={onBack}>
      <ChevronLeftIcon />
    </GlassButton>
  );
  const searchButton = right ? (
    right
  ) : !showSearch ? (
    <span className={styles.spacer} aria-hidden />
  ) : rightIcon ? (
    <GlassButton aria-label={rightLabel ?? "Action"} onClick={onRightClick}>
      {rightIcon}
    </GlassButton>
  ) : (
    <GlassButton aria-label="Search" onClick={onSearchClick}>
      <SearchIcon strokeWidth={1.66667} />
    </GlassButton>
  );

  if (type === "left") {
    return (
      <header className={`${styles.header} ${styles.left}`}>
        <div className={styles.buttonRow}>
          {back || <span />}
          {searchButton}
        </div>
        <div className={styles.slot}>
          {children ?? (
            <>
              <p className={styles.title2xl}>{title}</p>
              {text && <p className={styles.text}>{text}</p>}
            </>
          )}
        </div>
      </header>
    );
  }

  if (type === "search") {
    return (
      <header className={`${styles.header} ${styles.row}`}>
        {back}
        <div className={styles.searchPill}>
          <span className={styles.pillIcon}>
            <SearchIcon strokeWidth={1.25} />
          </span>
          <input
            className={styles.pillInput}
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label="Search"
          />
          <button type="button" className={styles.pillMic} aria-label="Voice search" onClick={onMicClick}>
            <MicIcon />
          </button>
        </div>
      </header>
    );
  }

  // "left-on-scroll" and "center" share the compact row layout
  return (
    <header className={`${styles.header} ${styles.row}`}>
      {back}
      <div className={`${styles.titleBlock} ${type === "center" ? styles.centered : ""}`}>
        {title && <p className={type === "center" ? styles.titleMd : styles.titleLg}>{title}</p>}
        {text && <p className={styles.text}>{text}</p>}
      </div>
      {searchButton}
    </header>
  );
}

export default PageHeader;
