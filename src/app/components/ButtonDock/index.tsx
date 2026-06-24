import React from 'react';
import styles from './index.module.css';
import { Button } from '../Buttons';
import { Checkbox } from '../ui/checkbox';

export type ButtonDockType = 'single' | 'double';

export interface ButtonDockProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 'single' = one full-width primary action; 'double' = secondary + primary. */
  type?: ButtonDockType;
  /** Show the checkbox accessory row above the actions. */
  accessory?: boolean;
  /** Show the iOS home indicator at the bottom. */
  homeIndicator?: boolean;
  /** Cast an upward shadow to signal content scrolling beneath the dock. */
  overflow?: boolean;
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
  primaryDisabled?: boolean;
  secondaryDisabled?: boolean;
  /** Accessory checkbox state. */
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  accessoryLabel?: React.ReactNode;
  className?: string;
}

export const ButtonDock = React.forwardRef<HTMLDivElement, ButtonDockProps>(
  (
    {
      type = 'double',
      accessory = false,
      homeIndicator = false,
      overflow = false,
      primaryLabel = 'Send Invoice',
      secondaryLabel = 'Send Later',
      onPrimary,
      onSecondary,
      primaryDisabled,
      secondaryDisabled,
      checked,
      onCheckedChange,
      accessoryLabel = 'I agree to the terms & conditions',
      className = '',
      ...rest
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={[
          styles.root,
          overflow ? styles.overflow : '',
          homeIndicator ? styles.withHomeIndicator : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        data-type={type}
        {...rest}
      >
        {accessory && (
          <label className={styles.accessory}>
            <Checkbox
              checked={checked}
              onCheckedChange={(c) => onCheckedChange?.(c === true)}
            />
            <span className={`${styles.accessoryLabel} body-md`}>{accessoryLabel}</span>
          </label>
        )}

        <div className={styles.actions}>
          {type === 'double' && (
            <Button
              variant="secondary"
              size="md"
              className={styles.equalButton}
              disabled={secondaryDisabled}
              onClick={onSecondary}
            >
              {secondaryLabel}
            </Button>
          )}
          <Button
            variant="primary"
            size="md"
            className={type === 'double' ? styles.equalButton : styles.fullButton}
            disabled={primaryDisabled}
            onClick={onPrimary}
          >
            {primaryLabel}
          </Button>
        </div>

        {homeIndicator && (
          <div className={styles.homeIndicator}>
            <span className={styles.homeBar} />
          </div>
        )}
      </div>
    );
  }
);

ButtonDock.displayName = 'ButtonDock';

export default ButtonDock;
