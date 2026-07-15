import styles from "./index.module.css";

/**
 * Search — design-system search field (Figma "[APP] Design System" → Search,
 * node 4144-11313). A 36px input with a leading search icon and a trailing
 * action: mic by default (hidden via showAction={false}), swapped for an
 * X clear button while the field is focused — the swap is pure CSS on
 * :focus-within. Error/Disabled via props. Styling in index.module.css.
 */

interface SearchProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  /** Paints the focused border + clear button without real focus — Showcase-only. */
  forceFocus?: boolean;
  /** Trailing mic action (Figma showAction). */
  showAction?: boolean;
  onMicClick?: () => void;
  "aria-label"?: string;
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M17.4999 17.5001L13.8833 13.8835M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
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

export function Search({
  value = "",
  onChange,
  placeholder,
  disabled = false,
  error = false,
  forceFocus = false,
  showAction = true,
  onMicClick,
  "aria-label": ariaLabel,
}: SearchProps) {
  const classes = [
    styles.field,
    disabled ? styles.disabled : "",
    error ? styles.error : "",
    forceFocus ? styles.forceFocus : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={classes}>
      <span className={styles.searchIcon}>
        <SearchIcon />
      </span>
      <input
        className={styles.input}
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
      />
      {/* X replaces the mic while focused (CSS swap); mousedown-preventDefault keeps the input focused */}
      <button
        type="button"
        className={styles.clear}
        aria-label="Clear search"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onChange?.("")}
      >
        <XIcon />
      </button>
      {showAction && (
        <button type="button" className={styles.mic} aria-label="Voice search" onClick={onMicClick} disabled={disabled}>
          <MicIcon />
        </button>
      )}
    </div>
  );
}

export default Search;
