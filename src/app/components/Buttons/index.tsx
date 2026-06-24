import React from 'react';
import styles from './index.module.css';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'inverse-primary'
  | 'inverse-secondary'
  | 'brand'
  | 'brand-outline'
  | 'brand-inverse';

export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonShape = 'rec' | 'rounded' | 'square' | 'circle';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  className?: string;
  children?: React.ReactNode;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      shape = 'rec',
      className = '',
      children,
      disabled,
      iconLeft,
      iconRight,
      loading = false,
      ...rest
    },
    ref
  ) => {
    const sizeClass = size === 'sm' ? styles.sizeSm : size === 'lg' ? styles.sizeLg : styles.sizeMd;
    const labelClass = size === 'sm' ? 'link-upper-sm' : size === 'lg' ? 'link-upper-lg' : 'link-upper-md';
    const shapeClass =
      shape === 'rounded' ? styles.shapeRounded :
      shape === 'square'  ? styles.shapeSquare  :
      shape === 'circle'  ? styles.shapeCircle  : '';

    // Square & Circle are icon-only — render a single centered icon, no label.
    const isIconOnly = shape === 'square' || shape === 'circle';

    const classes = [
      styles.root,
      styles[variant],
      sizeClass,
      shapeClass,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        data-variant={variant}
        {...rest}
      >
        {loading ? (
          <span className={styles.loader} />
        ) : isIconOnly ? (
          <span className={styles.icon}>{iconLeft ?? iconRight ?? children}</span>
        ) : (
          <>
            {iconLeft && (
              <span className={`${styles.icon} ${styles.iconLeft}`}>{iconLeft}</span>
            )}
            <span className={`${labelClass} ${styles.label}`}>
              {children}
            </span>
            {iconRight && (
              <span className={`${styles.icon} ${styles.iconRight}`}>{iconRight}</span>
            )}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';