import styles from "./index.module.css";

/**
 * TextArea — design-system multi-line input (Figma "[APP] Design System" →
 * TextAreaFields, node 4338-1074 / TextArea, node 4338-1075). States:
 * Default / Focus (real :focus-within) / Filled (has a value) / Error /
 * Disabled. Optional label/caption/mandatory props add the labeled wrapper
 * (node 4338-1075): 14px regular label above, 14px caption below — caption
 * turns red on error; the label text never does, but its mandatory `*`
 * turns red while this field currently fails validation (matches
 * ui/TextField's label convention exactly). Styling in index.module.css.
 */

interface TextAreaProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  /** Looks the same as `disabled` (muted surface) but stays focusable/clickable — native
   *  HTML `readOnly`, not `disabled`, so a tap still fires `onFocus`/`onClick` and the caller
   *  can flip it into an editable state on first interaction (e.g. Send Invoice's Message
   *  field: shown read-only until tapped, then editable). */
  readOnly?: boolean;
  error?: boolean;
  /** Paints the focused border without real focus — Showcase-only. */
  forceFocus?: boolean;
  id?: string;
  onFocus?: React.FocusEventHandler<HTMLTextAreaElement>;
  onBlur?: React.FocusEventHandler<HTMLTextAreaElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLTextAreaElement>;
  "aria-label"?: string;
  /** Label above the field (Figma "TextArea" wrapper). */
  label?: string;
  /** Appends " *" to the label. */
  mandatory?: boolean;
  /** Helper text below the field; red when `error` is set. */
  caption?: string;
  /** Extra class on the outermost element. */
  className?: string;
}

export function TextArea({
  value = "",
  onChange,
  placeholder,
  rows = 5,
  disabled = false,
  readOnly = false,
  error = false,
  forceFocus = false,
  id,
  onFocus,
  onBlur,
  onKeyDown,
  "aria-label": ariaLabel,
  label,
  mandatory = false,
  caption,
  className,
}: TextAreaProps) {
  const classes = [
    styles.field,
    disabled ? styles.disabled : "",
    readOnly ? styles.readOnly : "",
    error ? styles.error : "",
    forceFocus ? styles.forceFocus : "",
    label || caption ? "" : className || "",
  ]
    .filter(Boolean)
    .join(" ");

  const field = (
    <textarea
      id={id}
      className={classes}
      rows={rows}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      aria-label={ariaLabel}
    />
  );

  if (!label && !caption) return field;
  return (
    <div className={[styles.labeled, className || ""].filter(Boolean).join(" ")}>
      {label && (
        <p className={styles.label}>
          {label}
          {mandatory && <span className={`${styles.asterisk} ${error ? styles.asteriskError : ""}`}>*</span>}
        </p>
      )}
      {field}
      {caption && <p className={`${styles.caption} ${error ? styles.captionError : ""}`}>{caption}</p>}
    </div>
  );
}

export default TextArea;
