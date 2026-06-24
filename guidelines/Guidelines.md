# Design System Rules — CLAUDE.md

> AI coding agent rules for implementing Figma designs and building components
> consistent with this project's design foundation.
> Generated from: `design-foundation v1.0` · Stack: React + TypeScript + CSS Modules

---

## IMPORTANT: Read ALL Guidelines Files

This is the **index file**. The full design system rules are split across multiple focused files.
**You MUST read every file in `/guidelines/` before making any changes.**

| File | What It Covers |
|---|---|
| **Guidelines.md** | This file — overview, golden rules, file structure, QA checklist |
| **design-tokens.md** | Token architecture, all color/spacing/radius/effect/motion/z-index tokens, surface pairing, hex-to-semantic lookup |
| **typography.md** | Font families, weights, sizes, utility classes, the critical "no font properties in CSS modules" rule |
| **components.md** | Headless component pattern, icon rules, accessibility, responsive design, anti-patterns |
| **ImportGuide.md** | Figma import flow, file organization, cleanup rules, deduplication, Figma MCP translation |

---

## Project Overview

This project uses a **custom design system** built on:
- **GT Walsheim LC** (primary font) + **Sweet Sucker Punch** (highlight/accent font)
- **CSS custom properties** as the single source of truth for all visual values
- **Headless-first React components** — structure/logic in `.tsx`, all visuals in `.module.css` via tokens

---

## GOLDEN RULES — Non-Negotiable

```
1. ALWAYS use semantic tokens — NEVER hardcode values
2. ALWAYS check if a component/icon/asset exists before creating
3. ALWAYS use typography utility classes (.h1, .body-md) — NEVER define font properties in CSS modules
4. ALWAYS clean up — delete unused files, imports, and dead code after every change
5. ALWAYS use CSS modules for component styling — NEVER inline styles
6. NEVER duplicate — components, icons, assets, or tokens
7. NEVER override typography utility classes — they are complete and self-contained
8. Icons: MUI first, then /src/imports/icons/ for custom — NEVER create inline SVGs
```

---

## File Structure

```
project-root/
├── guidelines/
│   ├── Guidelines.md              ← THIS FILE — index + golden rules
│   ├── design-tokens.md           ← Token architecture + all token references
│   ├── typography.md              ← Typography tokens + utility classes
│   ├── components.md              ← Component patterns + icon rules + a11y
│   └── ImportGuide.md             ← Figma import + file org + cleanup
├── src/styles/
│   ├── index.css                  ← Main entry (imports all style files)
│   ├── fonts.css                  ← Font imports, typography tokens, utility classes
│   ├── theme.css                  ← Semantic color tokens (bg, text, icon, button, link, focus, gradients)
│   ├── reset.css                  ← CSS reset
│   └── tokens/
│       ├── colors.css             ← Primitive color scales (beige, neutral, brand, pink, semantic)
│       ├── spacing.css            ← Spacing scale (--space-*)
│       ├── radius.css             ← Border radius & border widths
│       ├── effect.css             ← Shadows, noise filter, blur
│       ├── motion.css             ← Duration, easing, transitions
│       ├── z-index.css            ← Z-index layers
│       └── breakpoint.css         ← Breakpoint documentation (values not usable in @media)
├── src/app/components/
│   ├── Button/                    ← Example headless component
│   │   ├── index.tsx              ← Component logic, a11y, TypeScript types
│   │   └── index.module.css       ← Token-based styles only
│   ├── NavBar/
│   ├── Footer/
│   ├── ui/                        ← Shared shadcn/radix primitives (do NOT duplicate)
│   └── figma/                     ← Protected Figma helpers (DO NOT EDIT)
├── src/imports/
│   ├── assets/                    ← Shared static assets (logos, badges, illustrations)
│   │   ├── index.ts               ← Barrel export for all assets
│   │   └── ...
│   ├── icons/                     ← Custom SVG icons NOT from MUI
│   │   ├── index.ts               ← Barrel export for all custom icons
│   │   └── ...
│   └── *.ts / *.tsx               ← Figma-imported SVG paths and components
└── package.json
```

---

## QA Before Merging

```
[ ] Desktop layout verified
[ ] Tablet layout verified
[ ] Mobile layout verified
[ ] No horizontal scroll at any viewport
[ ] All interactions remain accessible
[ ] All colors use SEMANTIC tokens (--text-*, --bg-*, --icon-*, --border-*, --btn-*, --link-*)
[ ] NO primitive tokens used directly (--neutral-*, --brand-*, --beige-*)
[ ] All spacing uses --space-* tokens
[ ] All typography via utility classes (.h1, .body-md, etc.) — NO font properties in CSS modules
[ ] No unused imports, files, or CSS classes
[ ] No duplicate components, icons, or assets
[ ] All icon imports from @mui/icons-material or /src/imports/icons/
[ ] Barrel exports (/imports/icons/index.ts, /imports/assets/index.ts) are up to date
```

---

## Quick Reference

```
Token Files:
/src/styles/tokens/colors.css      → primitive color scales (NEVER use directly)
/src/styles/theme.css              → semantic tokens (ALWAYS use these)
/src/styles/fonts.css              → typography tokens + utility classes
/src/styles/tokens/spacing.css     → spacing scale
/src/styles/tokens/radius.css      → border radius + widths
/src/styles/tokens/effect.css      → shadows, noise, blur
/src/styles/tokens/motion.css      → duration, easing, transitions
/src/styles/tokens/z-index.css     → z-index layers

Asset Locations:
/src/imports/icons/                → custom SVG icons (barrel: index.ts)
/src/imports/assets/               → logos, badges, illustrations (barrel: index.ts)
/src/app/components/               → headless React components
/src/app/components/ui/            → shadcn/radix primitives

Icon Priority:
1. @mui/icons-material    → import HomeIcon from '@mui/icons-material/Home'
2. /src/imports/icons/     → import { ArrowNorthEastIcon } from '../../imports/icons'
3. Create new only if none exist → place in /src/imports/icons/ + update index.ts
```
