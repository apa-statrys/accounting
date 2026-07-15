import styles from "./index.module.css";
import { USFlag } from "./USFlag";

/**
 * TextField — design-system input field (Figma "[APP] Design System" → Text Fields,
 * node 4047-3480). Type(text | left-icon | dropdown | date-picker | mobile |
 * currency | unit) × State(Default/Focused/Filled come from the input itself;
 * Error/Disabled via props). text/left-icon/mobile/currency/unit render a real
 * <input>; dropdown/date-picker render a button — they open pickers, and wiring
 * those up is the caller's job. Optional label/caption/mandatory props add the
 * Figma "Fields" wrapper (node 4047-3379): label above, caption below, caption
 * turns red on error. Styling in index.module.css.
 */

export type TextFieldType = "text" | "left-icon" | "dropdown" | "date-picker" | "mobile" | "currency" | "unit";

interface TextFieldProps {
  type?: TextFieldType;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  /** Paints the focused border without real focus — Showcase-only. */
  forceFocus?: boolean;
  /** 20px leading icon for type="left-icon" (inherits the state color). */
  icon?: React.ReactNode;
  /** Selector label — defaults per type: "+1" (mobile), "USD" (currency), "Unit" (unit). */
  selectorLabel?: string;
  /** Selector flag for mobile/currency (Figma icon-swap slot; defaults to the US flag). */
  selectorIcon?: React.ReactNode;
  /** Tap on the country-code / currency / unit selector. */
  onSelectorClick?: () => void;
  /** Tap on a dropdown / date-picker field. */
  onClick?: () => void;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>["inputMode"];
  "aria-label"?: string;
  /** Label above the field (Figma "Fields" wrapper). */
  label?: string;
  /** Appends " *" to the label. */
  mandatory?: boolean;
  /** Helper text below the field; red when `error` is set. */
  caption?: string;
}

function Chevron({ size }: { size: 16 | 24 }) {
  return size === 16 ? (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 9L12 15L18 9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M6.66667 1.66667V5M13.3333 1.66667V5M2.5 8.33333H17.5M4.16667 3.33333H15.8333C16.7538 3.33333 17.5 4.07953 17.5 5V16.6667C17.5 17.5871 16.7538 18.3333 15.8333 18.3333H4.16667C3.24619 18.3333 2.5 17.5871 2.5 16.6667V5C2.5 4.07953 3.24619 3.33333 4.16667 3.33333Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const SELECTOR_DEFAULTS: Partial<Record<TextFieldType, string>> = {
  mobile: "+1",
  currency: "USD",
  unit: "Unit",
};

export function TextField({
  type = "text",
  value = "",
  onChange,
  placeholder,
  disabled = false,
  error = false,
  forceFocus = false,
  icon,
  selectorLabel,
  selectorIcon,
  onSelectorClick,
  onClick,
  inputMode,
  "aria-label": ariaLabel,
  label,
  mandatory = false,
  caption,
}: TextFieldProps) {
  const hasSelector = type === "mobile" || type === "currency" || type === "unit";
  const classes = [
    styles.field,
    hasSelector ? styles.withSelector : "",
    disabled ? styles.disabled : "",
    error ? styles.error : "",
    forceFocus ? styles.forceFocus : "",
  ]
    .filter(Boolean)
    .join(" ");

  const selector = hasSelector && (
    <button type="button" className={styles.selector} onClick={onSelectorClick} disabled={disabled}>
      {type !== "unit" && <span className={styles.flag}>{selectorIcon ?? <USFlag />}</span>}
      <span>{selectorLabel ?? SELECTOR_DEFAULTS[type]}</span>
      <span className={styles.chevronSm}>
        <Chevron size={16} />
      </span>
    </button>
  );

  const field =
    type === "dropdown" || type === "date-picker" ? (
      <div className={classes}>
        <button type="button" className={styles.picker} onClick={onClick} disabled={disabled} aria-label={ariaLabel}>
          <span className={`${styles.pickerText} ${value ? "" : styles.placeholderText}`}>{value || placeholder}</span>
          <span className={type === "dropdown" ? styles.chevronLg : styles.calendar}>
            {type === "dropdown" ? <Chevron size={24} /> : <CalendarIcon />}
          </span>
        </button>
      </div>
    ) : (
      <div className={classes}>
        {type === "left-icon" && icon && <span className={styles.leftIcon}>{icon}</span>}
        {type !== "unit" && selector}
        <input
          className={styles.input}
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          inputMode={inputMode}
          aria-label={ariaLabel}
        />
        {type === "unit" && selector}
      </div>
    );

  if (!label && !caption) return field;
  return (
    <div className={styles.labeled}>
      {label && <p className={styles.label}>{mandatory ? `${label} *` : label}</p>}
      {field}
      {caption && <p className={`${styles.caption} ${error ? styles.captionError : ""}`}>{caption}</p>}
    </div>
  );
}

export default TextField;
