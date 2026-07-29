import figma from '@figma/code-connect';
import { ButtonDock, type ButtonDockProps } from './index';

/**
 * Code Connect mapping for the design-system "StickyButton" component.
 *
 * Figma node: 4141-2746  ([APP] Design System)
 *
 * Figma axes: Button Type (Primary / Primary + Outline / Primary + Ghost /
 * Primary + Secondary + Tertiary) × Stack (Vertical/Horizontal) ×
 * IOS controls (None / App status bar / Keyboard) × showCheckbox × Type
 * (Default/Slot). "Keyboard" maps to the keyboard prop (renders
 * components/Keyboard below the actions); "App status bar" (the plain
 * home-indicator bar at rest) has no code counterpart — dropped from the
 * dock itself 2026-07-29 (user feedback). "Slot" is a design-reference
 * variant with no code counterpart either.
 */
figma.connect(
  ButtonDock,
  'https://www.figma.com/design/Lt9QLcfsxzo9gdTV8hbWgs/-APP--Design-System?node-id=4141-2746',
  {
    props: {
      type: figma.enum('Button Type', {
        Primary: 'single',
        'Primary + Outline': 'double',
        'Primary + Ghost': 'ghost',
        'Primary + Secondary + Tertiary': 'triple',
      }),
      stack: figma.enum('Stack', {
        Vertical: 'vertical',
        Horizontal: 'horizontal',
      }),
      accessory: figma.boolean('showCheckbox'),
      keyboard: figma.enum('IOS controls', {
        Keyboard: true,
        'App status bar': false,
        None: false,
      }),
    },
    example: ({ type, stack, accessory, keyboard }) => {
      // `type` and `stack` are two independent Figma enums, but every real instance is
      // internally consistent (Stack=Horizontal is only ever set on a Primary+Ghost instance —
      // Figma has no such variant to author otherwise). ButtonDockProps' discriminated union
      // can't be proven from two separately-typed variables though, so cast once here rather
      // than force `type` to a specific literal (which would mis-generate the snippet for the
      // other three Button Type variants this same example covers).
      const props = { type, stack } as ButtonDockProps;
      return (
        <ButtonDock
          {...props}
          accessory={accessory}
          keyboard={keyboard}
          primaryLabel="Confirm"
          secondaryLabel="Cancel"
          tertiaryLabel="Close"
        />
      );
    },
  },
);
