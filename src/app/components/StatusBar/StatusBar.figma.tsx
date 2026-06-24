import figma from '@figma/code-connect';
import { StatusBar } from './index';

/**
 * Code Connect mapping for the design-system "StatusBar" component.
 *
 * Figma node: 587-12471  (-lib- Design System)
 *
 * The Figma component exposes a single `darkMode` boolean that swaps the
 * glyph/text color for use over dark backgrounds. `time` is fixed to the
 * conventional 09:41 in the design but is a real prop in code.
 */
figma.connect(
  StatusBar,
  'https://www.figma.com/design/abElBYcwuc5skfPX1c7FlP/-lib--Design-System?node-id=587-12471',
  {
    props: {
      darkMode: figma.boolean('darkMode'),
    },
    example: ({ darkMode }) => <StatusBar darkMode={darkMode} time="09:41" />,
  },
);
