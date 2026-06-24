# Components

> Headless component pattern, icon rules, accessibility standards,
> responsive design, layout rules, and anti-patterns.

---

## Headless-First Pattern

Every component must split concerns across exactly two files:

| File | Responsibility |
|---|---|
| `index.tsx` | Structure, accessibility, logic, TypeScript types, `forwardRef`, `displayName` |
| `index.module.css` | All visual styles, 100% token-based, zero hardcoded values |

### Component Template

```tsx
// ComponentName/index.tsx
import React from 'react';
import styles from './index.module.css';

export type ComponentVariant = 'primary' | 'secondary';

export interface ComponentNameProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: ComponentVariant;
  className?: string;
  children?: React.ReactNode;
}

export const ComponentName = React.forwardRef<HTMLDivElement, ComponentNameProps>(
  ({ variant = 'primary', className = '', children, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={[styles.root, styles[variant], className].filter(Boolean).join(' ')}
        data-variant={variant}
        {...rest}
      >
        {children}
      </div>
    );
  }
);
ComponentName.displayName = 'ComponentName';
```

```css
/* ComponentName/index.module.css */

.root {
  padding: var(--space-8);
  border-radius: var(--radius-md);
  background-color: var(--bg-neutral-primary);
  color: var(--text-primary);
  transition: background-color var(--transition-base);
}

.primary { }
.secondary { }

.root:hover:not(:disabled) { }
.root:active:not(:disabled) { }
.root:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  pointer-events: none;
}
.root:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 3px;
}
```

### Required Props for Every Component

```typescript
interface AnyComponentProps {
  className?: string;       // always — enables composition
  children?: React.ReactNode;
}
```

### Variant Props

Always use discriminated union types:

```typescript
type ButtonVariant = 'primary' | 'secondary';
type InputSize = 'sm' | 'md' | 'lg';
type AlertIntent = 'success' | 'error' | 'warning' | 'info';
```

---

## Adding New Components — Checklist

```
[ ] Check components/ — does this component already exist?
[ ] Check components/ui/ — is there a shadcn primitive to build on?
[ ] Create ComponentName/index.tsx — headless logic only
[ ] Create ComponentName/index.module.css — token-based styles only
[ ] Export named + default from index.tsx
[ ] Set Component.displayName
[ ] forwardRef if the component wraps a DOM element
[ ] Accept className, children, and relevant HTML attributes via spread
[ ] Use data-variant and data-state for state-based CSS hooks
[ ] Handle disabled, loading, and error states
[ ] Verify focus-visible outline is present
[ ] Map all colors, spacing, and type to tokens — no hardcoded values
[ ] Typography via utility classes in JSX — no font properties in CSS module
[ ] Validate visually against Figma screenshot
```

---

## Icon Rules

### Priority Order

```
1. MUI (@mui/icons-material) — ALWAYS check here first
2. Custom icons in /src/imports/icons/ — check barrel export index.ts
3. Figma-imported SVG paths in /src/imports/ — check for existing svg-* files
4. Create new icon in /src/imports/icons/ — ONLY if none of the above exist
```

### MUI Icon Usage

```tsx
import HomeIcon from '@mui/icons-material/Home';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// Style via CSS module — NEVER inline props
<HomeIcon className={styles.icon} />
```

```css
.icon {
  color: inherit;           /* inherit from parent */
  font-weight: 200;         /* light weight */
}
```

### Icon Rules

```
- Style icons with CSS classes, NEVER with inline sx/style props
- Icons should use font-weight: 200
- Icons should inherit color from parent elements
- NEVER create inline SVG when an MUI or existing custom icon exists
- NEVER install new icon packages (like lucide-react, heroicons, etc.)
- When replacing an icon, fully remove the old import AND JSX usage
```

### Custom Icon Placement

If an icon is NOT available in MUI:
- Place in `/src/imports/icons/`
- Export from `/src/imports/icons/index.ts`
- PascalCase naming: `ArrowNorthEastIcon.tsx`

---

## CSS Module Pattern

```css
/* ComponentName/index.module.css */

/* Base — shared across variants */
.root { }

/* Variants — named to match TypeScript union values */
.primary { }
.secondary { }

/* States */
.root:hover:not(:disabled) { }
.root:active:not(:disabled) { }
.root:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  pointer-events: none;
}
.root:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 3px;
}
```

---

## Accessibility Standards

Every component must meet these baselines:

```
- All interactive elements: keyboard accessible (Tab, Enter, Space, Escape)
- Focus ring: 2px solid var(--focus) with 3px offset — never remove outline
- aria-disabled on disabled interactive elements (not just HTML disabled)
- data-variant / data-state attributes for state-based styling
- forwardRef on all components for imperative control / focus management
- Color contrast: minimum WCAG AA (4.5:1 text, 3:1 large text / UI)
- Never convey meaning by color alone — pair with text or icon
```

---

## Responsive Design

### Breakpoints

- **Desktop:** 1025px and up
- **Tablet:** 769px - 1024px
- **Mobile:** 320px - 768px

**Note:** CSS custom properties cannot be used in `@media` queries. Always use exact pixel values.

### Responsive CSS Pattern

```css
/* Desktop default */
.component {
  display: flex;
  gap: var(--space-12);
}

/* Tablet (769px - 1024px) */
@media (min-width: 769px) and (max-width: 1024px) {
  .component {
    gap: var(--space-8);
  }
}

/* Mobile (<=768px) */
@media (max-width: 768px) {
  .component {
    flex-direction: column;
    gap: var(--space-6);
  }
}
```

### Additional Media Query Patterns

```css
@media (min-width: 1025px) { }        /* Desktop only */
@media (min-width: 769px) { }         /* Tablet and up */
@media (max-width: 1024px) { }        /* Mobile and tablet */
```

### Responsive Checklist

```
[ ] Component layout works on desktop (>1024px)
[ ] Component adapts to tablet (769px-1024px)
[ ] Component adapts to mobile (<=768px)
[ ] No horizontal overflow at any viewport size
[ ] Avoid fixed widths — prefer flex, grid, or max-width
[ ] DO NOT override font-size inside components (utility classes are already responsive)
[ ] Minimum touch target is 44px on mobile
[ ] Containers should use max-width rather than fixed width
```

---

## Layout Rules

```
- Prefer flexbox or grid for layout
- Avoid fixed widths unless required
- Use spacing tokens (var(--space-*)) instead of px values
- Components should default to "hug content" unless acting as containers
- Text should wrap naturally on smaller screens
- Containers should use max-width rather than fixed width
- NEVER use backdrop-filter or will-change: transform on positioned containers
  (these create new containing blocks that break fixed/absolute child positioning)
```

---

## Anti-Patterns — Never Do These

### CSS Anti-Patterns

```css
/* Hardcoded color */
color: #1B1B1B;
background: #FF4A15;

/* Primitive token instead of semantic */
color: var(--neutral-8);     /* Use var(--text-primary) */
background: var(--brand-5);  /* Use var(--bg-brand-primary) */

/* Hardcoded spacing */
padding: 12px 16px;
gap: 8px;

/* Font properties in component CSS */
font-size: 16px;
font-weight: 500;
font-size: var(--fs-h2);       /* Even tokens — NEVER in CSS modules */

/* Hardcoded radius / shadow / z-index */
border-radius: 4px;
box-shadow: 0 4px 12px rgba(0,0,0,0.08);
z-index: 100;
```

### React Anti-Patterns

```tsx
// Inline styles
<div style={{ color: '#1B1B1B', padding: '12px 16px' }} />

// Missing className prop
export const Card = ({ children }) => <div>{children}</div>

// Missing displayName
export const Card = React.forwardRef(...)  // no displayName

// Missing forwardRef on interactive element
export const Input = ({ ...props }) => <input {...props} />

// Variant as boolean instead of union
interface ButtonProps { isPrimary?: boolean; isSecondary?: boolean; }

// Creating duplicate component that already exists
// Always check /src/app/components/ and /src/app/components/ui/ first!

// Installing new icon packages
import { SomeIcon } from 'lucide-react';  // Use @mui/icons-material instead

// Inline SVG when icon already exists
<svg>...</svg>  // Check MUI and /src/imports/icons/ first
```
