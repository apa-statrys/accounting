# Figma Import Guidelines

> Rules for handling files imported from Figma — ensuring no duplicates,
> clean file organization, and consistency with the design system.

---

## 1. Pre-Import Audit — ALWAYS Do This First

Before processing any Figma import, scan the project:

```
[ ] List all files in /src/app/components/ — know what components exist
[ ] List all files in /src/imports/icons/ — know what custom icons exist
[ ] List all files in /src/imports/assets/ — know what assets exist
[ ] Check /src/imports/ root — know what SVG path files exist
[ ] Check /src/app/components/ui/ — know what shadcn primitives are available
```

**Why:** This prevents creating duplicates. If a component, icon, or asset already exists, you MUST reuse it.

---

## 2. Rename Imported Files Immediately

After importing from Figma, rename ALL files to match their actual purpose.

### Rules

- Use **PascalCase** for component files and icon files
- Use **kebab-case** for SVG path files
- Names must describe the content, not the Figma frame

### Examples

```
frame1.tsx                  → HeroBanner.tsx
design-export.tsx           → ProductCard.tsx
svg-wg56ef214f.ts           → svg-hero-illustration.ts
Component1.tsx              → PricingCard.tsx
```

---

## 3. Component Deduplication — Reuse Before Creating

### Priority Order (strict)

```
1. USE existing component as-is
2. EXTEND existing component with new props/variants
3. CREATE new component ONLY if nothing similar exists
```

### Decision Tree

```
Does an identical component exist?
  YES → Import and use it. Done.
  NO  → Does a similar component exist?
    YES → Can it be extended with a new variant/prop?
      YES → Add the variant. Done.
      NO  → Create new component. Document why.
    NO  → Create new component following headless pattern.
```

### Where to Check

| What | Where to Look |
|---|---|
| Page-level components | `/src/app/components/` |
| UI primitives | `/src/app/components/ui/` (shadcn/radix) |
| Buttons | `/src/app/components/Button/` — has 7 variants already |
| Dropdowns | `/src/app/components/Dropdown/` |
| Navigation | `/src/app/components/NavBar/`, `NavMenu/`, `MobileNavMenu/` |

---

## 4. Icon Deduplication

### Priority Order (strict)

```
1. @mui/icons-material — ALWAYS check MUI first
2. /src/imports/icons/ — check custom icon barrel export (index.ts)
3. Figma-imported SVG — reuse if already imported
4. Create new in /src/imports/icons/ — ONLY if none of the above exist
```

### MUI Icon Usage

```tsx
import HomeIcon from '@mui/icons-material/Home';

// Style via CSS — NEVER inline props
<HomeIcon className={styles.icon} />
```

```css
.icon {
  color: inherit;
  font-weight: 200;
}
```

### Custom Icon Rules

- Place in `/src/imports/icons/`
- Export from `/src/imports/icons/index.ts`
- PascalCase naming: `ArrowNorthEastIcon.tsx`
- NEVER create duplicate icons — check index.ts first

### Currently Available Custom Icons

```
ArrowNorthEastIcon       — diagonal arrow for CTAs
FaqSectionIcons          — chevron up/down for FAQ accordion
FooterSocialIconPaths    — LinkedIn, X, YouTube SVG paths for footer
TopBarIconPaths          — icons used in top bar
NavMenuFeaturePaths      — feature card icons in nav menu
```

---

## 5. Asset Deduplication

### Shared Assets → `/src/imports/assets/`

Static files used across multiple components:

```
Currently available:
  StatrysLogoBlack.tsx       — black logo variant
  StatrysLogoInverse.tsx     — inverse (light) logo variant
  AppStoreBadge.tsx           — App Store download badge
  GooglePlayBadge.tsx         — Google Play download badge
```

Always check `/src/imports/assets/index.ts` before creating new assets.

### SVG Path Files → `/src/imports/`

Figma-imported SVG data lives at the root of `/src/imports/`:

```
Currently available:
  PreFooterSvgPaths.ts       — arrow + decorative gradient for pre-footer
```

---

## 6. File Placement Rules

### Component-Specific Files

If a file is used ONLY by one component, it goes inside that component's directory:

```
ComponentName/
  index.tsx
  index.module.css
  ComponentNameIcons.ts    ← icons used only by this component
  helpers.ts               ← utilities used only by this component
```

### Shared Files

| Type | Location |
|---|---|
| Shared components | `/src/app/components/` |
| UI primitives | `/src/app/components/ui/` |
| Shared icons | `/src/imports/icons/` |
| Shared assets | `/src/imports/assets/` |
| SVG path data | `/src/imports/` |

---

## 7. Import Cleanup — After EVERY Change

### ⚠️ CRITICAL: Single Source of Truth

After every Figma import, you MUST:
1. **Delete all raw Figma-generated files** (e.g. `svg-*.ts`, `svg-*.tsx`, auto-named components) once their data has been merged into the canonical icon/asset file.
2. **Never keep two files for the same icon or asset.** There must be exactly ONE file per icon/asset — the one in `/src/imports/icons/` or `/src/imports/assets/`.
3. **Search the entire project** for references to the deleted files to ensure nothing is broken.

If a Figma import produces files like `svg-mqspointqd.ts` + `NorthEastStreamlineFreehand.tsx` and their path data has been merged into `ArrowNorthEastPaths.ts`, the raw import files must be deleted immediately.

### Mandatory Steps

```
[ ] Update all import paths after moving/renaming files
[ ] Remove all unused import statements
[ ] Remove unused files (components, icons, assets)
[ ] Update barrel exports (icons/index.ts, assets/index.ts)
[ ] Verify no broken references — every import resolves
[ ] Remove empty/dead CSS classes from module files
```

### How to Clean

```
1. Search for the old file name across the project
2. Update or remove every reference
3. Delete the old file
4. Run through imports in the changed files — remove any that are now unused
5. Check barrel exports — remove entries for deleted files
```

---

## 8. Token Translation — Figma Values to Design System

When Figma imports contain hardcoded values, translate them to tokens:

| Figma Value | Design System Token |
|---|---|
| `#1B1B1B` | `var(--text-primary)` or `var(--bg-neutral-inverse-primary)` |
| `#F9F5EA` | `var(--bg-beige-primary)` or `var(--text-neutral-inverse-primary)` |
| `#FF4A15` | `var(--text-brand)` or `var(--bg-brand-primary)` |
| `#FFFFFF` | `var(--bg-neutral-primary)` or `var(--text-on-color)` |
| `16px` (spacing) | `var(--space-8)` |
| `24px` (spacing) | `var(--space-12)` |
| `border-radius: 4px` | `var(--radius-md)` |
| `font-size: 16px` | Use `.body-md` utility class |
| `font-weight: 700` | Use appropriate utility class (`.h5`, `.h6`) |

**See design-tokens.md "Hex-to-Semantic Quick Lookup" for the complete mapping.**

---

## 9. Final Validation Checklist

Before completing ANY import:

```
[ ] All files renamed to match their purpose (PascalCase components, kebab-case SVGs)
[ ] Components follow headless pattern (index.tsx + index.module.css)
[ ] All styles use semantic tokens from theme.css — NO hardcoded values
[ ] All typography uses utility classes — NO font properties in CSS modules
[ ] Existing components reused where possible — NO duplicates
[ ] Icons follow priority order (MUI → custom → create new)
[ ] No duplicate files anywhere in the project
[ ] All imports are clean — no unused imports, no broken references
[ ] Barrel exports updated (icons/index.ts, assets/index.ts)
[ ] Unused files from previous imports deleted
```

---

## Summary

```
1. AUDIT first — know what exists before creating anything
2. RENAME immediately — descriptive PascalCase names
3. REUSE aggressively — components, icons, assets
4. PLACE correctly — shared vs component-specific
5. TRANSLATE all values — Figma hex/px → design system tokens
6. CLEAN UP always — remove unused files, imports, and CSS
7. VALIDATE against checklist before completing
```