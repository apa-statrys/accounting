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
  /** Explicit override for whether the mobile/currency/unit selector shows its chevron —
   *  defaults to auto (shown only when `onSelectorClick` is set, so a read-only selector
   *  doesn't imply it's tappable). Pass `true`/`false` to show/hide it regardless. */
  selectorChevron?: boolean;
  /** Tap on a dropdown / date-picker field. */
  onClick?: () => void;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>["inputMode"];
  /** Native input type (text/left-icon/mobile/currency/unit only) — defaults to "text". */
  inputType?: "text" | "email" | "password" | "tel" | "number";
  pattern?: string;
  id?: string;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  "aria-label"?: string;
  /** Label above the field (Figma "Fields" wrapper). */
  label?: string;
  /** Appends " *" to the label. */
  mandatory?: boolean;
  /** Helper text below the field; red when `error` is set, yellow when `highlight` is set
   *  (error wins if both are set). */
  caption?: string;
  /** Trailing icon/button after the input (e.g. a unit picker or a status badge) — not a Figma
   *  axis, just a slot for the caller's own trailing control. Mutually exclusive in practice with
   *  the mobile/currency/unit selector types. */
  iconRight?: React.ReactNode;
  /** Soft warning border (e.g. an OCR-missing value to complete) — not a Figma state, just this
   *  token swapped in for the field's normal border. */
  highlight?: boolean;
  /** Extra class on the outermost element (e.g. a flex-basis override for a side-by-side row). */
  className?: string;
}

/** The DS's own thin-stroke chevron (used for the mobile/currency/unit selector and the
 *  dropdown/date-picker types below) — exported so other trailing "value + chevron" buttons
 *  (e.g. DiscountCard's %/amount picker, AddServicesSheet's Unit picker) can reuse the exact
 *  same glyph instead of reaching for a bolder/differently-weighted icon library. */
export function Chevron({ size }: { size: 16 | 24 }) {
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

export function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M6.66667 1.66667V5M13.3333 1.66667V5M2.5 8.33333H17.5M4.16667 3.33333H15.8333C16.7538 3.33333 17.5 4.07953 17.5 5V16.6667C17.5 17.5871 16.7538 18.3333 15.8333 18.3333H4.16667C3.24619 18.3333 2.5 17.5871 2.5 16.6667V5C2.5 4.07953 3.24619 3.33333 4.16667 3.33333Z"
        stroke="currentColor"
        strokeWidth="1"
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
  selectorChevron,
  onClick,
  inputMode,
  inputType = "text",
  pattern,
  id,
  onFocus,
  onBlur,
  onKeyDown,
  "aria-label": ariaLabel,
  label,
  mandatory = false,
  caption,
  iconRight,
  highlight = false,
  className,
}: TextFieldProps) {
  const hasSelector = type === "mobile" || type === "currency" || type === "unit";
  const classes = [
    styles.field,
    hasSelector ? styles.withSelector : "",
    disabled ? styles.disabled : "",
    error ? styles.error : "",
    forceFocus ? styles.forceFocus : "",
    highlight ? styles.highlight : "",
    label || caption ? "" : className || "",
  ]
    .filter(Boolean)
    .join(" ");

  // No onSelectorClick → nothing to tap (e.g. a currency fixed per invoice, shown read-only) —
  // render plain text rather than a button that implies it's interactive. The chevron itself is
  // a separate, explicit choice (`selectorChevron`) defaulting to that same auto rule, so a
  // caller can still show it without wiring a click (or hide it on a tappable selector).
  const showChevron = selectorChevron ?? !!onSelectorClick;
  const selectorContent = (
    <>
      {type !== "unit" && <span className={styles.flag}>{selectorIcon ?? <USFlag />}</span>}
      <span>{selectorLabel ?? SELECTOR_DEFAULTS[type]}</span>
      {showChevron && (
        <span className={styles.chevronSm}>
          <Chevron size={16} />
        </span>
      )}
    </>
  );
  const selector = hasSelector && (
    onSelectorClick ? (
      <button type="button" className={styles.selector} onClick={onSelectorClick} disabled={disabled}>
        {selectorContent}
      </button>
    ) : (
      <span className={styles.selector}>{selectorContent}</span>
    )
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
          id={id}
          className={styles.input}
          type={inputType}
          pattern={pattern}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          inputMode={inputMode}
          aria-label={ariaLabel}
        />
        {type === "unit" && selector}
        {iconRight && <span className={styles.rightIcon}>{iconRight}</span>}
      </div>
    );

  if (!label && !caption) return field;
  return (
    <div className={[styles.labeled, className || ""].filter(Boolean).join(" ")}>
      {label && (
        <p className={styles.label}>
          {label}
          {mandatory && <span className={styles.asterisk}>*</span>}
        </p>
      )}
      {field}
      {caption && (
        <p className={`${styles.caption} ${error ? styles.captionError : highlight ? styles.captionHighlight : ""}`}>
          {caption}
        </p>
      )}
    </div>
  );
}

export default TextField;
