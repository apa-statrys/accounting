import styles from "./index.module.css";

/**
 * TextArea — design-system multi-line input (Figma "[APP] Design System" →
 * TextAreaFields, node 4338-1074 / TextArea, node 4338-1075). States:
 * Default / Focus (real :focus-within) / Filled (has a value) / Error /
 * Disabled. Optional label/caption/mandatory props add the labeled wrapper
 * (node 4338-1075): 14px regular label above, 14px caption below — caption
 * turns red on error, the label never does (matches ui/TextField's label
 * convention exactly). Styling in index.module.css.
 */

interface TextAreaProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
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
      aria-label={ariaLabel}
    />
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
      {caption && <p className={`${styles.caption} ${error ? styles.captionError : ""}`}>{caption}</p>}
    </div>
  );
}

export default TextArea;
