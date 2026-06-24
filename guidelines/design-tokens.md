# Design Tokens

> Complete token reference — architecture, all color/spacing/radius/effect/motion/z-index tokens,
> surface pairing rules, and hex-to-semantic lookup.

---

## Token Architecture — How the System Works

### The Token Hierarchy

The design system has **three layers**. Understanding this prevents misuse:

```
Layer 1: PRIMITIVES (colors.css)     → Raw values: --neutral-8, --brand-5, --beige-3
    ↓ referenced by
Layer 2: SEMANTICS (theme.css)       → Meaningful names: --text-primary, --bg-brand-primary
    ↓ used in
Layer 3: COMPONENTS (*.module.css)   → Component styles: color: var(--text-primary)
```

**RULE: Components ONLY reference Layer 2 (semantic tokens). NEVER Layer 1 (primitives).**

### Semantic Token Naming Convention

All semantic tokens follow a consistent pattern:

```
--{category}-{surface}-{role}[-{state}]

category:  bg | text | icon | border | btn | link
surface:   neutral | neutral-inverse | beige | brand | success | warning | error | info
role:      primary | secondary | tertiary | on-color | disabled | placeholder | subtle | bold
state:     hover | active (optional)
```

### IMPORTANT: Token Rules

- **NEVER hardcode** colors, spacing, font sizes, weights, radii, shadows, or z-index values
- **ALWAYS** reference a CSS custom property: `var(--token-name)`
- All tokens are defined in `/src/styles/tokens/` and `/src/styles/theme.css` and `/src/styles/fonts.css`
- Tokens are imported via `/src/styles/index.css` at the app entry point

---

## How to Pick the Right Token

### Background Tokens

| Context | Token | When to Use |
|---|---|---|
| White surface | `--bg-neutral-primary` | Default page/card backgrounds |
| Light gray surface | `--bg-neutral-secondary` | Subtle section differentiation |
| Warm beige surface | `--bg-beige-primary` | Brand-warm sections, feature cards |
| Warm beige secondary | `--bg-beige-secondary` | Nested element on beige background |
| Dark surface | `--bg-neutral-inverse-primary` | Dark sections, footers, hero overlays |
| Dark secondary | `--bg-neutral-inverse-secondary` | Nested elements on dark backgrounds |
| Brand accent surface | `--bg-brand-primary` | CTAs, promo banners, brand highlights |
| Status: success | `--bg-success-subtle` / `--bg-success-bold` | Alerts, badges |
| Status: error | `--bg-error-subtle` / `--bg-error-bold` | Error states |
| Status: warning | `--bg-warning-subtle` / `--bg-warning-bold` | Warning banners |
| Status: info | `--bg-info-subtle` / `--bg-info-bold` | Info callouts |

### Text Tokens

| Context | Token | When to Use |
|---|---|---|
| Primary text (headings, body) | `--text-primary` | Default readable text on light backgrounds |
| Supporting/secondary text | `--text-secondary` | Subtitles, descriptions, metadata |
| Muted/tertiary text | `--text-tertiary` | Labels, timestamps, hints |
| Placeholder text | `--text-placeholder` | Input placeholders |
| Disabled text | `--text-disabled` | Disabled interactive elements |
| Text on dark bg | `--text-neutral-inverse-primary` | White/beige text on dark sections |
| Text on dark bg (secondary) | `--text-neutral-inverse-secondary` | Lighter text on dark sections |
| Text on colored bg | `--text-on-color` | White text on brand/status bold backgrounds |
| Brand-colored text | `--text-brand` | Accent text, links, highlights |
| Status text | `--text-success-primary` / `--text-error-primary` | Inline status messages |

### Icon Tokens

| Context | Token | When to Use |
|---|---|---|
| Default icons on light bg | `--icon-primary` | Navigation, action icons |
| Secondary icons | `--icon-secondary` | Supporting icons, less prominent |
| Muted icons | `--icon-tertiary` | Decorative, low emphasis |
| Icons on dark bg | `--icon-neutral-inverse-primary` | Icons in dark sections |
| Brand-colored icons | `--icon-brand` | Accent icons, feature highlights |
| Icons on colored bg | `--icon-on-color` | Icons on brand/status bold backgrounds |
| Status icons | `--icon-success-primary` / `--icon-error-primary` | Status indicators |

### Border Tokens

| Context | Token | When to Use |
|---|---|---|
| Subtle border on light bg | `--border-neutral-primary` | Cards, dividers (40% opacity) |
| Visible border on light bg | `--border-neutral-secondary` | More defined separators |
| Border on beige bg | `--border-beige-primary` | Elements on beige surfaces |
| Border on dark bg | `--border-neutral-inverse-primary` | Separators in dark sections |
| Brand border | `--border-brand-primary` | Accent borders, selected states |
| Status borders | `--border-success-subtle` / `--border-error-bold` | Status-specific borders |

### Button Tokens

| Context | Token | When to Use |
|---|---|---|
| Primary button bg | `--btn-primary` | Default CTA button fill |
| Primary hover | `--btn-primary-hover` | Hover state (brand orange) |
| Primary active | `--btn-primary-active` | Active/pressed state |
| Disabled | `--btn-disabled` | Any disabled button |
| Inverse button (on dark) | `--btn-inverse` | Buttons on dark backgrounds |
| Inverse hover | `--btn-inverse-hover` | Hover on dark backgrounds |

### Link Tokens

| Context | Token | When to Use |
|---|---|---|
| Default link | `--link-primary` | Links on light backgrounds |
| Link hover | `--link-primary-hover` | Hover (brand orange) |
| Inverse link (on dark) | `--link-inverse` | Links on dark backgrounds |
| Disabled link | `--link-primary-disabled` | Non-interactive links |

---

## Surface Pairing Rules

When building a section, pick tokens from the **same surface family**:

```css
/* Light section (beige surface) */
.section {
  background-color: var(--bg-beige-primary);
  color: var(--text-primary);                    /* dark text on light bg */
  border-color: var(--border-beige-primary);     /* border matches surface */
}

/* Dark section (neutral inverse surface) */
.section {
  background-color: var(--bg-neutral-inverse-primary);
  color: var(--text-neutral-inverse-primary);    /* light text on dark bg */
  border-color: var(--border-neutral-inverse-primary);
}

/* Brand section */
.section {
  background-color: var(--bg-brand-primary);
  color: var(--text-on-color);                   /* white text on brand bg */
  border-color: var(--border-brand-primary);
}

/* Status section (e.g. error alert) */
.alert {
  background-color: var(--bg-error-subtle);
  color: var(--text-error-primary);
  border-color: var(--border-error-subtle);
}
```

## Interactive State Pattern

For any interactive element, follow the **base → hover → active** pattern:

```css
.card {
  background-color: var(--bg-beige-primary);           /* base */
}
.card:hover {
  background-color: var(--bg-beige-primary-hover);     /* hover */
}
.card:active {
  background-color: var(--bg-beige-primary-active);    /* active */
}
```

---

## Color Usage Quick Reference

```
ON LIGHT BACKGROUNDS:
  Text:       --text-primary / --text-secondary / --text-tertiary
  Icons:      --icon-primary / --icon-secondary / --icon-tertiary
  Borders:    --border-neutral-primary / --border-beige-primary
  Buttons:    --btn-primary / --btn-secondary

ON DARK BACKGROUNDS:
  Text:       --text-neutral-inverse-primary / -secondary / -tertiary
  Icons:      --icon-neutral-inverse-primary / -secondary / -tertiary
  Borders:    --border-neutral-inverse-primary / -secondary / -tertiary
  Buttons:    --btn-inverse / --btn-inverse-hover

ON BRAND BACKGROUNDS:
  Text:       --text-on-color
  Icons:      --icon-on-color
  Borders:    --border-brand-secondary

ACCENT / HIGHLIGHT:
  Text:       --text-brand
  Icons:      --icon-brand
  Background: --bg-brand-primary (use sparingly — CTAs, one per section)
  Border:     --border-brand-primary

STATUS:
  Success:    --bg-success-subtle + --text-success-primary + --border-success-subtle
  Error:      --bg-error-subtle + --text-error-primary + --border-error-subtle
  Warning:    --bg-warning-subtle + --text-warning-primary + --border-warning-subtle
  Info:       --bg-info-subtle + --text-info-primary + --border-info-subtle
```

---

## Complete Token Reference

### Colors — Primitives (`/src/styles/tokens/colors.css`)

**FOR REFERENCE ONLY — DO NOT USE DIRECTLY IN COMPONENTS**

```css
/* Beige — primary surfaces (1 = lightest, 9 = darkest) */
--beige-1 … --beige-9

/* Neutral — true grayscale (0 = white, 10 = black) */
--neutral-0 (#ffffff) … --neutral-10 (#000000)

/* Brand orange (1 = lightest, 9 = darkest) */
--brand-1 … --brand-9       /* --brand-5: #FF4A15 anchor */

/* Pink — secondary accent */
--pink-1 … --pink-9         /* --pink-5: #FF76A7 anchor */

/* Semantic status colors */
--green-1 … --green-9       /* success */
--red-1 … --red-9           /* error */
--yellow-1 … --yellow-9     /* warning */
--blue-1 … --blue-9         /* info */

/* Absolutes */
--black (#000000)  --white (#ffffff)
```

### Colors — Semantic Tokens (`/src/styles/theme.css`)

**ALWAYS USE THESE in components**

#### Backgrounds

```css
/* Neutral (white → light gray) */
--bg-neutral-primary / -secondary / -tertiary
--bg-neutral-{role}-hover / -active

/* Neutral inverse (dark) */
--bg-neutral-inverse-primary / -secondary / -tertiary
--bg-neutral-inverse-{role}-hover / -active

/* Beige (warm) */
--bg-beige-primary / -secondary / -tertiary
--bg-beige-{role}-hover / -active

/* Brand (orange accent) */
--bg-brand-primary / -secondary
--bg-brand-{role}-hover / -active

/* Status */
--bg-success-subtle / --bg-success-bold
--bg-warning-subtle / --bg-warning-bold
--bg-error-subtle / --bg-error-bold
--bg-info-subtle / --bg-info-bold
```

#### Text

```css
/* On light backgrounds */
--text-primary / --text-secondary / --text-tertiary
--text-placeholder / --text-disabled / --text-on-color / --text-brand

/* On dark backgrounds */
--text-neutral-inverse-primary / -secondary / -tertiary / -disabled

/* Status */
--text-success-primary / -inverse
--text-warning-primary / -inverse
--text-error-primary / -inverse
--text-info-primary / -inverse
```

#### Icons

```css
/* On light backgrounds */
--icon-primary / --icon-secondary / --icon-tertiary
--icon-placeholder / --icon-disabled / --icon-on-color / --icon-brand

/* On dark backgrounds */
--icon-neutral-inverse-primary / -secondary / -tertiary / -disabled

/* Status */
--icon-success-primary / -inverse  (same pattern for warning, error, info)
```

#### Borders

```css
/* Beige surface */
--border-beige-primary / -secondary / -tertiary  (each with -hover / -active)

/* Neutral surface */
--border-neutral-primary / -secondary / -tertiary  (each with -hover / -active)

/* Dark surface */
--border-neutral-inverse-primary / -secondary / -tertiary  (each with -hover / -active)

/* Brand */
--border-brand-primary / -secondary  (each with -hover / -active)

/* Status */
--border-{status}-subtle / --border-{status}-bold
```

#### Buttons

```css
--btn-primary / -hover / -active        /* dark filled */
--btn-secondary / -hover / -active      /* dark outline */
--btn-inverse / -hover / -active        /* light on dark bg */
--btn-disabled / --btn-inverse-disabled
```

#### Links

```css
--link-primary / -hover / -active / -disabled
--link-inverse / -hover / -active / -disabled
```

#### Focus & Gradients

```css
--focus                /* brand orange — focus rings on light bg */
--focus-inverse        /* white — focus rings on dark bg */

--gradient-strong / --gradient-default / --gradient-soft
--gradient-direction-top-left / -top-right / -bottom-left / -bottom-right
--gradient-black-cta
```

### Spacing (`/src/styles/tokens/spacing.css`)

```css
--space-0 (0px)   --space-1 (2px)   --space-2 (4px)   --space-3 (6px)
--space-4 (8px)   --space-5 (10px)  --space-6 (12px)  --space-8 (16px)
--space-10 (20px) --space-12 (24px) --space-16 (32px) --space-20 (40px)
--space-24 (48px) --space-28 (56px) --space-32 (64px) --space-36 (72px)
--space-40 (80px) --space-44 (88px) --space-48 (96px) --space-52 (104px)
```

### Border Radius (`/src/styles/tokens/radius.css`)

```css
--radius-none (0px)  --radius-sm (2px)   --radius-md (4px)   --radius-lg (6px)
--radius-xl (8px)    --radius-2xl (12px) --radius-3xl (16px) --radius-4xl (24px)
--radius-5xl (32px)  --radius-full (9999px)

/* Border widths */
--border-width (1px)  --border-width-md (1.5px)  --border-width-lg (2px)
```

### Effects (`/src/styles/tokens/effect.css`)

```css
--shadow-sm    /* 0 4px 4px 0 rgba(0,0,0,0.06) */
--shadow-md    /* 0 4px 14px 0 rgba(0,0,0,0.10) */
--shadow-lg    /* 0 10px 30px 0 rgba(0,0,0,0.07) */
--noise        /* SVG noise filter */
--blur         /* blur(12px) */
```

### Motion (`/src/styles/tokens/motion.css`)

```css
--duration-fast (100ms)  --duration-base (150ms)  --duration-slow (250ms)  --duration-slower (400ms)
--ease-default (ease)  --ease-in  --ease-out  --ease-in-out
--transition-base      /* var(--duration-base) var(--ease-default) */
```

### Z-Index (`/src/styles/tokens/z-index.css`)

```css
--z-base (1)  --z-dropdown (100)  --z-sticky (200)  --z-overlay (300)
--z-modal (400)  --z-toast (500)  --z-tooltip (600)
```

---

## Hex-to-Semantic Quick Lookup

Use this when translating Figma designs or hardcoded values:

```
#ffffff / white       → --bg-neutral-primary (bg) / --text-on-color (text)
#f5f4f1               → --bg-neutral-secondary
#f9f5ea / warm beige  → --bg-beige-primary (bg) / --text-neutral-inverse-primary (text on dark)
#f3ecda               → --bg-beige-secondary
#1b1b1b / near-black  → --text-primary (text) / --bg-neutral-inverse-primary (bg)
#3d3d3d               → --text-secondary (text) / --bg-neutral-inverse-tertiary (bg)
#808080               → --text-tertiary
#a0a0a0               → --text-placeholder / --icon-placeholder
#ff4a15 / orange      → --text-brand (text) / --bg-brand-primary (bg) / --icon-brand (icon)
#ff76a7 / pink        → decorative only, no semantic token yet
#dc2626 / red         → --text-error-primary (text) / --bg-error-bold (bg)
#006a1d / green       → --text-success-primary (text) / --bg-success-bold (bg)
#d08700 / yellow      → --text-warning-primary (text) / --bg-warning-bold (bg)
#0051e8 / blue        → --text-info-primary (text) / --bg-info-bold (bg)
```

### WCAG Contrast — Approved Pairings

| Foreground | Background | Ratio | Level |
|---|---|---|---|
| `--text-primary` | `--bg-beige-primary` | 15.5:1 | AAA |
| `--text-neutral-inverse-primary` | `--bg-neutral-inverse-primary` | 15.5:1 | AAA |
| `--text-primary` | `--bg-neutral-primary` | 21:1 | AAA |
| `--text-success-primary` | `--bg-success-subtle` | AA | AA |
| `--text-error-primary` | `--bg-error-subtle` | AA | AA |
| `--text-warning-primary` | `--bg-warning-subtle` | AA | AA (use -6 not -5 for yellow) |