import figma from '@figma/code-connect';
import { SheetHeader, HeaderIconButton } from './index';

/**
 * Code Connect mapping for the design-system "SheetHeader" component.
 *
 * Figma node: 2558-13623  (-lib- Design System)
 *
 * Figma models leading/trailing as booleans (leadingButton, trailingButton1,
 * trailingButton2); in code these are `leading`/`trailing` slots, so the example
 * composes HeaderIconButton instances to reflect the toggled buttons. Swap in the
 * real MUI icons (ChevronLeft / IosShare / Add) at the call site.
 */
figma.connect(
  SheetHeader,
  'https://www.figma.com/design/abElBYcwuc5skfPX1c7FlP/-lib--Design-System?node-id=2558-13623',
  {
    props: {
      title: figma.string('text'),
      type: figma.enum('type', { InsidePage: 'inside-page', Main: 'main' }),
      state: figma.enum('state', { Fixed: 'fixed', Collapsed: 'collapsed' }),
      leadingButton: figma.boolean('leadingButton'),
      trailingButton1: figma.boolean('trailingButton1'),
      trailingButton2: figma.boolean('trailingButton2'),
    },
    example: ({ title, type, state, leadingButton, trailingButton1, trailingButton2 }) => (
      <SheetHeader
        title={title}
        type={type}
        state={state}
        leading={leadingButton ? <HeaderIconButton aria-label="Back">{/* <ChevronLeftIcon /> */}</HeaderIconButton> : undefined}
        trailing={
          <>
            {trailingButton1 && <HeaderIconButton aria-label="Share">{/* <IosShareIcon /> */}</HeaderIconButton>}
            {trailingButton2 && <HeaderIconButton aria-label="Add">{/* <AddIcon /> */}</HeaderIconButton>}
          </>
        }
      />
    ),
  },
);
