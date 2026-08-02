import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
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
 *   showCheckbox → accessory · IOS controls: "Keyboard" → keyboard (renders
 *                  components/Keyboard below the actions — Keyboard supplies
 *                  its own home indicator). "App status bar" (the plain
 *                  home-indicator bar at rest) was dropped from the dock itself
 *                  (2026-07-29, user feedback) — the dock just reserves its
 *                  normal bottom padding instead.
 *   Slot → `slot` — arbitrary content above the actions (e.g. the price summary
 *          on Create Invoice, Figma node 1419-52781); caller decides what/when
 *          to render, this just reserves the position + side padding. A dock
 *          with a slot renders opaque (solid white + drop shadow, no frost/blur)
 *          since real content needs a legible surface — see .opaque in the CSS.
 */

export type ButtonDockType = 'single' | 'double' | 'ghost' | 'triple';
export type ButtonDockStack = 'vertical' | 'horizontal';

interface ButtonDockCommonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Arbitrary content rendered above the actions (Figma "Slot", e.g. a price summary) —
   *  shares the actions row's 16px side padding; omit for docks with no slot content. */
  slot?: React.ReactNode;
  /** Show the checkbox accessory row above the actions. */
  accessory?: boolean;
  /** Show the on-screen keyboard below the actions (Figma "IOS controls" =
   *  Keyboard) — e.g. a dock sitting above a focused search/text field. */
  keyboard?: boolean;
  /** Float the dock over the page's scroll area (absolute, bottom of the
   *  phone frame) so content frosts through the backdrop blur as it scrolls
   *  underneath. Page docks pass this; sheet footers stay in-flow. The page's
   *  scroll container needs bottom padding ≥ the dock height (~110px single,
   *  ~170px double, ~220px triple) so the last element can scroll clear. */
  sticky?: boolean;
  primaryLabel?: string;
  /** Leading icon on the primary action (e.g. a checkmark confirming a just-completed action). */
  primaryIconLeft?: React.ReactNode;
  /** Trailing icon on the primary action (e.g. a chevron-right for a "Continue"-style
   *  forward-navigation step — Figma sets this per-instance, not as a StickyButton axis). */
  primaryIconRight?: React.ReactNode;
  /** Red instead of the default filled black — the primary action is irreversible
   *  (e.g. "Delete Draft" leading as the recommended-looking CTA). */
  primaryDestructive?: boolean;
  /** Second action: outline for 'double'/'triple', ghost text for 'ghost'. */
  secondaryLabel?: string;
  /** Marks the secondary action as irreversible (e.g. "Delete Draft") rather than just the
   *  non-recommended choice — stays neutral (not red); red is reserved for `primaryDestructive`,
   *  the filled/leading action. See ui/Button's `destructive` prop. */
  secondaryDestructive?: boolean;
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
  slot,
  accessory = false,
  keyboard = false,
  sticky = false,
  primaryLabel = 'Confirm',
  primaryIconLeft,
  primaryIconRight,
  primaryDestructive = false,
  secondaryLabel = 'Cancel',
  secondaryDestructive = false,
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
      destructive={primaryDestructive}
      onClick={onPrimary}
      label={primaryLabel}
      iconLeft={primaryIconLeft}
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
      destructive={secondaryDestructive}
      onClick={onSecondary}
      label={secondaryLabel}
    />
  );

  return (
    <div
      className={[
        styles.root,
        slot ? styles.opaque : '',
        sticky ? styles.sticky : '',
        keyboard ? styles.withKeyboard : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-type={type}
      {...rest}
    >
      {!slot && <div className={styles.frost} aria-hidden />}
      <AnimatePresence initial={false}>
        {slot && (
          <motion.div
            key="dock-slot"
            className={styles.slot}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            {slot}
          </motion.div>
        )}
      </AnimatePresence>
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

      <AnimatePresence initial={false}>
        {keyboard && (
          <motion.div
            key="keyboard"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <Keyboard />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ButtonDock;
