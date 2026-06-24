import figma from '@figma/code-connect';
import { RadioGroup } from './index';

/**
 * Code Connect mapping for the design-system "RadioCard" component set.
 *
 * Figma node: 1166-8369  (-lib- Design System)
 *
 * The Figma component models a SINGLE card with variant props
 * (size / alignment / state / showIcon / showText / title / text).
 * In code this is rendered by <RadioGroup> with one option, since the
 * group owns selection + disabled state. The example below maps a single
 * Figma card onto a one-option group so Dev Mode shows real, runnable code.
 */
figma.connect(
  RadioGroup,
  'https://www.figma.com/design/abElBYcwuc5skfPX1c7FlP/-lib--Design-System?node-id=1166-8369',
  {
    props: {
      title: figma.string('title'),
      text: figma.string('text'),
      showIcon: figma.boolean('showIcon'),
      showText: figma.boolean('showText'),
      size: figma.enum('size', {
        lg: 'lg',
        sm: 'sm',
      }),
      alignment: figma.enum('alignment', {
        'Vertical center align': 'vertical',
        'Horizontal left align': 'horizontal',
      }),
      // Drives selection + disabled in the code component.
      state: figma.enum('state', {
        Default: 'Default',
        Hover: 'Hover',
        Selected: 'Selected',
        Disabled: 'Disabled',
      }),
    },
    example: ({ title, text, showIcon, showText, size, alignment, state }) => (
      <RadioGroup
        name="example"
        size={size}
        alignment={alignment}
        showIcon={showIcon}
        showText={showText}
        value={state === 'Selected' ? 'option' : ''}
        onChange={() => {}}
        options={[
          {
            value: 'option',
            label: title,
            description: text,
            disabled: state === 'Disabled',
          },
        ]}
      />
    ),
  },
);
