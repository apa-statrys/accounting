import figma from '@figma/code-connect';
import { EditCard } from './index';

/**
 * Code Connect mapping for the design-system "EditCard" component.
 *
 * Figma node: 2580-21212  (-lib- Design System, "EditCard/True")
 *
 * Figma exposes `title` and `descriptions` text props and a built-in "Change"
 * button. In code the trailing action is a slot that defaults to the Change
 * button (wired via onChange).
 */
figma.connect(
  EditCard,
  'https://www.figma.com/design/abElBYcwuc5skfPX1c7FlP/-lib--Design-System?node-id=2580-21212',
  {
    props: {
      title: figma.string('title'),
      description: figma.string('descriptions'),
    },
    example: ({ title, description }) => (
      <EditCard title={title} description={description} onChange={() => {}} />
    ),
  },
);
