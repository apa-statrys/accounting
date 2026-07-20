import React from 'react';
import styles from './index.module.css';
import { Button } from '../../ui/Button';
import { Checkbox } from '../ui/checkbox';

/**
 * Matches the DS StickyButton set (Figma "[APP] Design System" node 4141-2746).
 * Figma axes → props:
 *   Button Type: Primary → 'single' · Primary + Outline → 'double' ·
 *                Primary + Ghost → 'ghost' · Primary + Secondary + Tertiary → 'triple'
 *   Stack:       Vertical (default) | Horizontal — Figma defines Horizontal for
 *                the Primary + Ghost pair (ghost left, primary right, 50/50).
 *   showCheckbox → accessory · IOS controls "App status bar" → homeIndicator.
 * (Figma's "Keyboard" iOS-controls variant and "Slot" type are design-reference
 * frames — the OS keyboard / slotted content aren't rendered by this component.)
 */

export type ButtonDockType = 'single' | 'double' | 'ghost' | 'triple';
export type ButtonDockStack = 'vertical' | 'horizontal';

export interface ButtonDockProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 'single' = primary only; 'double' = primary + outline; 'ghost' = primary
   *  + ghost (text) action; 'triple' = primary + outline + ghost. */
  type?: ButtonDockType;
  /** 'horizontal' puts the two actions side by side, equal width (flex-1),
   *  for a Close/Confirm pair. Figma only defines this for 'ghost' (ghost
   *  left, primary right) — not 'double'/'triple'; ignored for those. */
  stack?: ButtonDockStack;
  /** Show the checkbox accessory row above the actions. */
  accessory?: boolean;
  /** Show the iOS home indicator at the bottom. */
  homeIndicator?: boolean;
  /** Float the dock over the page's scroll area (absolute, bottom of the
   *  phone frame) so content frosts through the backdrop blur as it scrolls
   *  underneath. Page docks pass this; sheet footers stay in-flow. The page's
   *  scroll container needs bottom padding ≥ the dock height (~110px single,
   *  ~170px double, ~220px triple) so the last element can scroll clear. */
  sticky?: boolean;
  primaryLabel?: string;
  /** Second action: outline for 'double'/'triple', ghost text for 'ghost'. */
  secondaryLabel?: string;
  /** Third (ghost) action — 'triple' only. */
  tertiaryLabel?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
  onTertiary?: () => void;
  primaryDisabled?: boolean;
  secondaryDisabled?: boolean;
  tertiaryDisabled?: boolean;
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
      stack = 'vertical',
      accessory = false,
      homeIndicator = false,
      sticky = false,
      primaryLabel = 'Confirm',
      secondaryLabel = 'Cancel',
      tertiaryLabel = 'Close',
      onPrimary,
      onSecondary,
      onTertiary,
      primaryDisabled,
      secondaryDisabled,
      tertiaryDisabled,
      checked,
      onCheckedChange,
      accessoryLabel = 'Remember me',
      className = '',
      ...rest
    },
    ref
  ) => {
    const horizontal = stack === 'horizontal' && type === 'ghost';

    const primaryButton = (
      <Button
        hierarchy="primary"
        className={styles.fullButton}
        disabled={primaryDisabled}
        onClick={onPrimary}
        label={primaryLabel}
      />
    );

    // Second action: outlined for 'double'/'triple', ghost text for 'ghost'.
    const secondaryButton = type !== 'single' && (
      <Button
        hierarchy={type === 'ghost' ? 'tertiary' : 'secondary'}
        className={styles.fullButton}
        disabled={secondaryDisabled}
        onClick={onSecondary}
        label={secondaryLabel}
      />
    );

    return (
      <div
        ref={ref}
        className={[
          styles.root,
          sticky ? styles.sticky : '',
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
            <span className={styles.accessoryLabel}>{accessoryLabel}</span>
          </label>
        )}

        <div className={[styles.actions, horizontal ? styles.horizontal : ''].filter(Boolean).join(' ')}>
          {horizontal ? (
            <>
              {secondaryButton}
              {primaryButton}
            </>
          ) : (
            <>
              {primaryButton}
              {secondaryButton}
              {type === 'triple' && (
                <Button
                  hierarchy="tertiary"
                  className={styles.fullButton}
                  disabled={tertiaryDisabled}
                  onClick={onTertiary}
                  label={tertiaryLabel}
                />
              )}
            </>
          )}
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
