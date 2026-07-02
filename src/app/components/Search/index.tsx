import React from 'react';
import { Search as SearchIcon, X as ClearIcon } from 'lucide-react';
import styles from './index.module.css';

export interface SearchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  helperText?: string;
  error?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Optional explicit clear handler; defaults to firing onChange with an empty value. */
  onClear?: () => void;
}

export const Search = React.forwardRef<HTMLInputElement, SearchProps>(
  ({ label, helperText, error, className = '', size = 'md', onClear, ...rest }, ref) => {
    const sizeClass = size === 'sm' ? styles.searchSm : size === 'lg' ? styles.searchLg : styles.searchMd;
    const iconSizeClass = size === 'sm' ? styles.iconSm : size === 'lg' ? styles.iconLg : styles.iconMd;
    const hasValue = rest.value != null && String(rest.value).length > 0;
    const handleClear = () => {
      if (onClear) onClear();
      else rest.onChange?.({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>);
    };

    return (
      <div className={`${styles.container} ${className}`.trim()}>
        {label && (
          <label className={`body-sm ${styles.label}`} htmlFor={rest.id}>
            {label}
          </label>
        )}
        <div className={`${styles.searchWrapper} ${sizeClass} ${error ? styles.error : ''}`.trim()}>
          <SearchIcon className={`${styles.searchIcon} ${iconSizeClass}`} />
          <input
            ref={ref}
            type="text"
            className={`body-md ${styles.search}`}
            aria-invalid={!!error}
            aria-describedby={error ? `${rest.id}-error` : helperText ? `${rest.id}-helper` : undefined}
            {...rest}
          />
          {hasValue && (
            <button type="button" className={styles.clearBtn} onMouseDown={(e) => e.preventDefault()} onClick={handleClear} aria-label="Clear search">
              <ClearIcon className={iconSizeClass} />
            </button>
          )}
        </div>
        {helperText && !error && (
          <span className={`body-sm ${styles.helperText}`} id={`${rest.id}-helper`}>
            {helperText}
          </span>
        )}
        {error && (
          <span className={`body-sm ${styles.errorText}`} id={`${rest.id}-error`} role="alert">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Search.displayName = 'Search';