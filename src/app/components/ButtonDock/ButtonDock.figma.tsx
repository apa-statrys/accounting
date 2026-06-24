import figma from '@figma/code-connect';
import { ButtonDock } from './index';

/**
 * Code Connect mapping for the design-system "ButtonDock" component.
 *
 * Figma node: 2545-7545  (-lib- Design System)
 *
 * Figma axes: type (Single/Double) × accessory × homeIndicator × overflow × display.
 * `display` only ships the "Narrow" value, so it has no code prop.
 */
figma.connect(
  ButtonDock,
  'https://www.figma.com/design/abElBYcwuc5skfPX1c7FlP/-lib--Design-System?node-id=2545-7545',
  {
    props: {
      type: figma.enum('type', { Single: 'single', Double: 'double' }),
      accessory: figma.boolean('accessory'),
      homeIndicator: figma.boolean('homeIndicator'),
      overflow: figma.boolean('overflow'),
    },
    example: ({ type, accessory, homeIndicator, overflow }) => (
      <ButtonDock
        type={type}
        accessory={accessory}
        homeIndicator={homeIndicator}
        overflow={overflow}
        primaryLabel="Send Invoice"
        secondaryLabel="Send Later"
      />
    ),
  },
);
