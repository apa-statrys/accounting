import React from 'react';
import styles from './index.module.css';

export type SheetHeaderType = 'inside-page' | 'main';
export type SheetHeaderState = 'fixed' | 'collapsed';

export interface SheetHeaderProps extends React.HTMLAttributes<HTMLElement> {
  title: string;
  /** 'inside-page' = centered small title; 'main' = large left-aligned title. */
  type?: SheetHeaderType;
  /** 'collapsed' shows the large title below the button row (large-title pattern). */
  state?: SheetHeaderState;
  /** Leading circular icon button (e.g. back / close). */
  leading?: React.ReactNode;
  /** Up to two trailing circular icon buttons (e.g. share / add). */
  trailing?: React.ReactNode;
  className?: string;
}

export const SheetHeader = React.forwardRef<HTMLElement, SheetHeaderProps>(
  ({ title, type = 'inside-page', state = 'fixed', leading, trailing, className = '', ...rest }, ref) => {
    const base = [styles.root, className].filter(Boolean).join(' ');

    // InsidePage · Fixed → leading | centered H6 title | trailing
    if (type === 'inside-page' && state === 'fixed') {
      return (
        <header ref={ref} className={base} data-type={type} data-state={state} {...rest}>
          <div className={styles.side}>{leading}</div>
          <p className={`${styles.titleCenter} h6`}>{title}</p>
          <div className={styles.trailing}>{trailing}</div>
        </header>
      );
    }

    // Collapsed → button row, then a large H4 title underneath
    if (state === 'collapsed') {
      return (
        <header
          ref={ref}
          className={[base, styles.column].join(' ')}
          data-type={type}
          data-state={state}
          {...rest}
        >
          <div className={styles.topRow}>
            <div className={styles.side}>{leading}</div>
            <div className={styles.trailing}>{trailing}</div>
          </div>
          <p className={`${styles.titleLarge} h4`}>{title}</p>
        </header>
      );
    }

    // Main · Fixed → large H4 title on the left, trailing buttons on the right
    return (
      <header ref={ref} className={base} data-type={type} data-state={state} {...rest}>
        {leading && <div className={styles.side}>{leading}</div>}
        <p className={`${styles.titleLarge} h4`}>{title}</p>
        <div className={styles.trailing}>{trailing}</div>
      </header>
    );
  }
);

SheetHeader.displayName = 'SheetHeader';

export interface HeaderIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

/** White circular icon button used for the header's leading/trailing actions. */
export const HeaderIconButton = React.forwardRef<HTMLButtonElement, HeaderIconButtonProps>(
  ({ children, className = '', type = 'button', ...rest }, ref) => (
    <button
      ref={ref}
      type={type}
      className={[styles.iconBtn, className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </button>
  )
);

HeaderIconButton.displayName = 'HeaderIconButton';

export default SheetHeader;
