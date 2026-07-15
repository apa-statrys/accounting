import figma from '@figma/code-connect';
import { ButtonDock } from './index';

/**
 * Code Connect mapping for the design-system "StickyButton" component.
 *
 * Figma node: 4141-2746  ([APP] Design System)
 *
 * Figma axes: Button Type (Primary / Primary + Outline / Primary + Ghost /
 * Primary + Secondary + Tertiary) × Stack (Vertical/Horizontal) ×
 * IOS controls (None / App status bar / Keyboard) × showCheckbox × Type
 * (Default/Slot). "Keyboard" and "Slot" are design-reference variants with
 * no code counterpart; "App status bar" maps to the homeIndicator prop.
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
      homeIndicator: figma.enum('IOS controls', {
        'App status bar': true,
        None: false,
      }),
    },
    example: ({ type, stack, accessory, homeIndicator }) => (
      <ButtonDock
        type={type}
        stack={stack}
        accessory={accessory}
        homeIndicator={homeIndicator}
        primaryLabel="Confirm"
        secondaryLabel="Cancel"
        tertiaryLabel="Close"
      />
    ),
  },
);
