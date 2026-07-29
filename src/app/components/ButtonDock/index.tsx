import React from 'react';
import styles from './index.module.css';
import { Button } from '../../ui/Button';
import { Checkbox } from '../../ui/Checkbox';
import { Keyboard } from '../Keyboard';

/**
 * Matches the DS StickyButton set (Figma "[APP] Design System" node 4141-2746).
 * Figma axes → props:
 *   Button Type: Primary → 'single' · Primary + Outline → 'double' ·
 *                Primary + Ghost → 'ghost' · Primary + Secondary + Tertiary → 'triple'
 *   Stack:       Vertical (default) | Horizontal — Figma defines Horizontal only
 *                for the Primary + Ghost pair (ghost left, primary right, 50/50),
 *                so `stack` is only assignable when `type: 'ghost'` (a type
 *                error otherwise, not a silently-ignored prop — see the
 *                ButtonDockVerticalProps/ButtonDockGhostProps union below).
 *   showCheckbox → accessory · IOS controls: "App status bar" → homeIndicator ·
 *                  "Keyboard" → keyboard (renders components/Keyboard below the
 *                  actions instead of the plain home-indicator bar — Keyboard
 *                  supplies its own). The two are mutually exclusive, same as
 *                  the Figma axis; `keyboard` wins if both are set.
 * (Figma's "Slot" type is a design-reference frame — slotted content isn't
 * rendered by this component.)
 */

export type ButtonDockType = 'single' | 'double' | 'ghost' | 'triple';
export type ButtonDockStack = 'vertical' | 'horizontal';

interface ButtonDockCommonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Show the checkbox accessory row above the actions. */
  accessory?: boolean;
  /** Show the iOS home indicator at the bottom. */
  homeIndicator?: boolean;
  /** Show the on-screen keyboard below the actions instead of the plain home
   *  indicator (Figma "IOS controls" = Keyboard) — e.g. a dock sitting above a
   *  focused search/text field. Wins over `homeIndicator` if both are set. */
  keyboard?: boolean;
  /** Float the dock over the page's scroll area (absolute, bottom of the
   *  phone frame) so content frosts through the backdrop blur as it scrolls
   *  underneath. Page docks pass this; sheet footers stay in-flow. The page's
   *  scroll container needs bottom padding ≥ the dock height (~110px single,
   *  ~170px double, ~220px triple) so the last element can scroll clear. */
  sticky?: boolean;
  primaryLabel?: string;
  /** Trailing icon on the primary action (e.g. a chevron-right for a "Continue"-style
   *  forward-navigation step — Figma sets this per-instance, not as a StickyButton axis). */
  primaryIconRight?: React.ReactNode;
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
  /** Loading state (ui/Button's `loading` — 3-dot bounce) for a pending action;
   *  ignores clicks on that button while true. */
  primaryLoading?: boolean;
  secondaryLoading?: boolean;
  tertiaryLoading?: boolean;
  /** Accessory checkbox state. */
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  accessoryLabel?: string;
  className?: string;
}

/** 'single' = primary only; 'double' = primary + outline; 'triple' = primary +
 *  outline + ghost. Figma has no Stack=Horizontal variant for any of these —
 *  always vertical, so `stack` isn't offered at all (not just ignored at
 *  runtime; passing it is a type error). */
interface ButtonDockVerticalProps {
  type?: 'single' | 'double' | 'triple';
  stack?: never;
}

/** 'ghost' = primary + ghost (text) action — the only type Figma pairs with
 *  Stack=Horizontal (a Close/Confirm equal-weight pair, ghost left/primary
 *  right). It can still stack vertically too (stack defaults to 'vertical'). */
interface ButtonDockGhostProps {
  type: 'ghost';
  stack?: ButtonDockStack;
}

export type ButtonDockProps = ButtonDockCommonProps & (ButtonDockVerticalProps | ButtonDockGhostProps);

// A plain function component, not React.forwardRef — deliberately: no caller in this codebase
// passes a ref to ButtonDock, and forwardRef's JSX typing doesn't enforce a discriminated union
// prop type the way a plain component's does (verified: forwardRef silently accepts
// `type="double" stack="horizontal"` in JSX even though the ButtonDockProps union forbids it;
// a plain function component correctly rejects it). Add ref support back only if a real caller
// needs it, and re-verify the union still holds if you do.
export function ButtonDock({
  type = 'double',
  stack = 'vertical',
  accessory = false,
  homeIndicator = false,
  keyboard = false,
  sticky = false,
  primaryLabel = 'Confirm',
  primaryIconRight,
  secondaryLabel = 'Cancel',
  tertiaryLabel = 'Close',
  onPrimary,
  onSecondary,
  onTertiary,
  primaryDisabled,
  secondaryDisabled,
  tertiaryDisabled,
  primaryLoading,
  secondaryLoading,
  tertiaryLoading,
  checked,
  onCheckedChange,
  accessoryLabel = 'Remember me',
  className = '',
  ...rest
}: ButtonDockProps) {
  const horizontal = stack === 'horizontal' && type === 'ghost';

  const primaryButton = (
    <Button
      hierarchy="primary"
      className={styles.fullButton}
      disabled={primaryDisabled}
      loading={primaryLoading}
      onClick={onPrimary}
      label={primaryLabel}
      iconRight={primaryIconRight}
    />
  );

  // Second action: outlined for 'double'/'triple', ghost text for 'ghost'.
  const secondaryButton = type !== 'single' && (
    <Button
      hierarchy={type === 'ghost' ? 'tertiary' : 'secondary'}
      className={styles.fullButton}
      disabled={secondaryDisabled}
      loading={secondaryLoading}
      onClick={onSecondary}
      label={secondaryLabel}
    />
  );

  return (
    <div
      className={[
        styles.root,
        sticky ? styles.sticky : '',
        keyboard ? styles.withKeyboard : homeIndicator ? styles.withHomeIndicator : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-type={type}
      {...rest}
    >
      <div className={styles.frost} aria-hidden />
      {accessory && (
        <div className={styles.accessory}>
          <Checkbox checked={!!checked} onChange={(c) => onCheckedChange?.(c)} label={accessoryLabel} />
        </div>
      )}

      <div
        className={[styles.actions, horizontal ? styles.horizontal : '', keyboard ? styles.actionsKeyboardGap : '']
          .filter(Boolean)
          .join(' ')}
      >
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
                loading={tertiaryLoading}
                onClick={onTertiary}
                label={tertiaryLabel}
              />
            )}
          </>
        )}
      </div>

      {keyboard ? (
        <Keyboard />
      ) : (
        homeIndicator && (
          <div className={styles.homeIndicator}>
            <span className={styles.homeBar} />
          </div>
        )
      )}
    </div>
  );
}

export default ButtonDock;
