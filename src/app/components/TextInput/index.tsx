import React from 'react';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import styles from './index.module.css';

export type TextInputSize = 'sm' | 'md' | 'lg';

export interface TextInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  hintText?: string;
  showHint?: boolean;
  /** Error state — pass a string to show it as the hint, or `true` for styling only. */
  error?: string | boolean;
  size?: TextInputSize;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  /** Show the trailing help (?) icon. */
  tooltip?: boolean;
  onTooltipClick?: () => void;
  /** Soft yellow highlight on the field (e.g. an OCR-missing value to complete). */
  highlight?: boolean;
  className?: string;
}

/**
 * TextInput — labeled form field with hint, error, optional left icon and tooltip.
 * Hover / focus / filled are handled by CSS + native; `error` and `disabled` are props.
 */
export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      label,
      hintText,
      showHint = true,
      error,
      size = 'md',
      iconLeft,
      iconRight,
      tooltip = false,
      onTooltipClick,
      disabled,
      highlight = false,
      className = '',
      id,
      ...rest
    },
    ref
  ) => {
    const hasError = Boolean(error);
    const errorText = typeof error === 'string' ? error : undefined;
    const hint = errorText ?? hintText;
    const sizeClass = size === 'sm' ? styles.sizeSm : size === 'lg' ? styles.sizeLg : styles.sizeMd;

    return (
      <div className={[styles.root, className].filter(Boolean).join(' ')}>
        {/* Static label sits ABOVE the field (with a grey placeholder shown inside). */}
        {label && (
          <label
            htmlFor={id}
            className={[
              'body-md',
              styles.label,
              hasError ? styles.labelError : '',
              disabled ? styles.labelDisabled : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {label}
            {rest.required && <span className={styles.asterisk}>*</span>}
          </label>
        )}

        <div
          className={[
            styles.field,
            sizeClass,
            hasError ? styles.error : '',
            disabled ? styles.disabled : '',
          ]
            .filter(Boolean)
            .join(' ')}
          // Warning fields keep the field's normal background (the old soft-yellow fill blended
          // into the beige page) — only the border carries the warning color.
          style={highlight ? { borderColor: '#f59e0b' } : undefined}
        >
          {iconLeft && <span className={styles.icon}>{iconLeft}</span>}

          <input
            ref={ref}
            id={id}
            disabled={disabled}
            aria-invalid={hasError || undefined}
            className={`body-md ${styles.input}`}
            {...rest}
          />

          {iconRight && <span className={styles.icon}>{iconRight}</span>}

          {tooltip && (
            <button
              type="button"
              className={styles.tooltip}
              onClick={onTooltipClick}
              aria-label="Help"
              tabIndex={-1}
            >
              <HelpOutlineIcon className={styles.tooltipIcon} />
            </button>
          )}
        </div>

        {showHint && hint && (
          <p
            className={[
              'caption',
              styles.hint,
              hasError ? styles.hintError : '',
              disabled ? styles.hintDisabled : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {hint}
          </p>
        )}
      </div>
    );
  }
);

TextInput.displayName = 'TextInput';

export default TextInput;
