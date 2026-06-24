import figma from '@figma/code-connect';
import { Button } from './index';

/**
 * Code Connect mapping for the design-system "Button" component set.
 *
 * Figma node: 2551-8027  (-lib- Design System · Button spec page)
 *
 * The Figma component models Button across five variant axes:
 *   Inverse (True/False) × Size (sm/md/lg) × Hierarchy (Primary/Secondary/Tertiary)
 *   × State (Default/Hover/Active/Disable) × Shape (Rec/Rounded/Square/Circle)
 *
 * The code component flattens Inverse + Hierarchy into a single `variant` enum,
 * derives interaction states (hover/active) from CSS, and treats Square/Circle
 * as icon-only. The mapping below reconstructs `variant` from the two Figma axes.
 */
figma.connect(
  Button,
  'https://www.figma.com/design/abElBYcwuc5skfPX1c7FlP/-lib--Design-System?node-id=2551-8027',
  {
    props: {
      text: figma.string('text'),
      size: figma.enum('Size', { sm: 'sm', md: 'md', lg: 'lg' }),
      shape: figma.enum('Shape', {
        Rec: 'rec',
        Rounded: 'rounded',
        Square: 'square',
        Circle: 'circle',
      }),
      hierarchy: figma.enum('Hierarchy', {
        Primary: 'primary',
        Secondary: 'secondary',
        Tertiary: 'tertiary',
      }),
      inverse: figma.enum('Inverse', { True: true, False: false }),
      // Hover/Active are CSS-driven; only Disable maps to a code prop.
      disabled: figma.enum('State', {
        Default: false,
        Hover: false,
        Active: false,
        Disable: true,
      }),
      iconLeft: figma.boolean('iconLeft', {
        true: figma.instance('iconLeftSwap'),
        false: undefined,
      }),
      iconRight: figma.boolean('iconRight', {
        true: figma.instance('iconRightSwap'),
        false: undefined,
      }),
    },
    example: ({ text, size, shape, hierarchy, inverse, disabled, iconLeft, iconRight }) => {
      const variant = inverse
        ? hierarchy === 'primary'
          ? 'inverse-primary'
          : // NOTE: `inverse-tertiary` is not implemented in code yet, so
            // Inverse + Tertiary falls back to inverse-secondary.
            'inverse-secondary'
        : hierarchy;

      return (
        <Button
          variant={variant}
          size={size}
          shape={shape}
          disabled={disabled}
          iconLeft={iconLeft}
          iconRight={iconRight}
        >
          {text}
        </Button>
      );
    },
  },
);
