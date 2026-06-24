# Typography

> Font families, weights, sizes, utility classes, and the critical rule:
> NEVER define font properties in component CSS modules.

---

## Font Families

```css
--font-primary    /* "GT Walsheim LC", "Helvetica Neue", Helvetica, Arial, sans-serif */
--font-highlight  /* "Sweet Sucker Punch", cursive — use sparingly */
```

## Font Weights

```css
--fw-regular  /* 400 */
--fw-medium   /* 500 */
--fw-bold     /* 700 */
--fw-black    /* 800 */
```

## Font Size Tokens

**NEVER use `--text-*` tokens directly in components.**
**ALWAYS use `--fs-*` semantic tokens (or better yet, utility classes).**

```css
/* Headings (responsive — auto-scales on tablet/mobile) */
--fs-h1       /* 64px desktop → 56px tablet → 40px mobile */
--fs-h2       /* 40px desktop → 32px tablet → 32px mobile */
--fs-h3       /* 24px */
--fs-h4       /* 20px */
--fs-h5       /* 18px */
--fs-h6       /* 16px */

/* Highlight headings (responsive) */
--fs-h1-hl … --fs-h6-hl    /* Same scale, for Sweet Sucker Punch font */

/* Body text */
--fs-body-xl  /* 20px */
--fs-body-lg  /* 18px */
--fs-body-md  /* 16px — default */
--fs-body-sm  /* 14px */
--fs-caption  /* 12px */

/* Card titles (responsive — auto-scales on tablet/mobile) */
--fs-card-lg  /* 48px desktop → 40px tablet → 32px mobile */
--fs-card-md  /* 32px desktop → 28px tablet → 24px mobile */
--fs-card-sm  /* 28px desktop → 24px tablet → 20px mobile */
--fs-card-xs  /* 20px desktop → 18px tablet → 18px mobile */
```

---

## Typography Utility Classes

Apply via `className` directly on elements. These are **global** classes defined in `/src/styles/fonts.css`.

```tsx
// Headings — GT Walsheim LC, Black 800, tight tracking
<h1 className="h1">Heading One</h1>
<h2 className="h2">Heading Two</h2>
<h3 className="h3">Heading Three</h3>
<h4 className="h4">Heading Four</h4>
<h5 className="h5">Heading Five</h5>
<h6 className="h6">Heading Six</h6>

// Highlight — Sweet Sucker Punch font, for display/accent text
// IMPORTANT: Use sparingly — one highlight per visual block
<span className="h1-hl">Bold Move</span>
<span className="h2-hl">Wow.</span>
<span className="h3-hl">Nice!</span>

// Body — GT Walsheim LC, Regular 400
<p className="body-xl">Extra large body text</p>
<p className="body-lg">Large body text</p>
<p className="body-md">Default body text</p>
<p className="body-sm">Small body text</p>
<p className="caption">Caption text</p>

// Card titles — GT Walsheim LC, Medium 500
<div className="card-title-lg">Large Card Title</div>
<div className="card-title-md">Medium Card Title</div>
<div className="card-title-sm">Small Card Title</div>
<div className="card-title-xs">Extra Small Card Title</div>

// Links — GT Walsheim LC, Medium 500, uppercase
<a className="link-md">View More</a>
<a className="link-sm">Learn More</a>
```

---

## CRITICAL RULE: No Font Properties in Component CSS

**Typography utility classes (.h1, .h2, .body-md, etc.) are COMPLETE and SELF-CONTAINED.**

They handle ALL typography properties:
- `font-size` (with responsive scaling built-in)
- `font-weight`
- `font-family`
- `letter-spacing`
- `line-height`

### WRONG — Never do this

```css
/* In a component's index.module.css */
.title {
  font-size: var(--fs-h2);        /* NEVER */
  font-weight: var(--fw-black);   /* NEVER */
  font-family: var(--font-primary); /* NEVER */
  letter-spacing: -0.02em;         /* NEVER */
  line-height: 1.2;                /* NEVER */
}

@media (max-width: 768px) {
  .title {
    font-size: var(--fs-h3);  /* NEVER — utility classes are already responsive */
  }
}
```

### CORRECT — Do this instead

```tsx
// JSX — utility class handles ALL typography
<h2 className={`h2 ${styles.title}`}>My Heading</h2>
```

```css
/* Component CSS — ONLY non-typography properties */
.title {
  color: var(--text-primary);           /* OK */
  margin-bottom: var(--space-8);        /* OK */
  text-align: center;                   /* OK */
  /* NO font-size, font-weight, font-family, letter-spacing, line-height */
}
```

### Summary

```
DO:    Apply utility classes (.h1, .body-md, etc.) via className
DO:    Style color, spacing, alignment in component CSS
NEVER: Define font-size, font-weight, font-family, letter-spacing, or line-height in component CSS
NEVER: Add responsive font-size media queries in component CSS
```
