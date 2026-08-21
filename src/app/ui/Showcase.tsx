import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Download } from "lucide-react";
import { FONT, INK, MUTED } from "../lib/theme";
import { Toggle } from "./Toggle";
import { NumberStepper } from "./NumberStepper";
import { Button, type Hierarchy } from "./Button";
import { FAB } from "./FAB";
import { TabsBase } from "./TabsBase";
import { HorizontalTabs } from "./HorizontalTabs";
import { SegmentedControlBase } from "./SegmentedControlBase";
import { SegmentedControls } from "./SegmentedControls";
import { Badge, type BadgeColor } from "./Badge";
import { NotiBadge } from "./NotiBadge";
import { Tooltip, TooltipArrow } from "./Tooltip";
import { TextField, TextFieldType } from "./TextField";
import { TextArea } from "./TextArea";
import { Search } from "./Search";
import { Loading, LoadingSize } from "./Loading";
import { PageHeader, type PageHeaderType } from "./PageHeader";
import { ButtonDock, type ButtonDockType, type ButtonDockStack } from "../components/ButtonDock";
import { SummaryCard } from "../components/SummaryCard";
import { SummaryDock } from "../components/SummaryDock";
import StatusBar from "../components/StatusBar";
import { Tile, type TileTrailing } from "./Tile";
import { Banner, type BannerColor } from "./Banner";
import { XClose, type XCloseSize } from "./XClose";
import { ToastMessage, type ToastVariant } from "./ToastMessage";
import { Chips } from "./Chips";
import { CheckboxBase } from "./CheckboxBase";
import { Checkbox } from "./Checkbox";
import { Avatar, type AvatarSize } from "./Avatar";
import { USFlag } from "./TextField/USFlag";
import { BottomSheet } from "./BottomSheet";
import { Overlay } from "./Overlay";
import { OutstandingCard } from "./OutstandingCard";
import { InvoiceRow } from "./InvoiceRow";
import { InvoiceStatus } from "./InvoiceStatus";
import { ActionRequired } from "./ActionRequired";
import { ListRow } from "./ListRow";
import { ListCard } from "./ListCard";
import { ListText } from "./ListText";
import { SwipeActions } from "./SwipeActions";
import { NotificationItem } from "./NotificationItem";
import { FileItemBase, type FileItemState, type FileItemAction } from "./FileItemBase";

/**
 * Showcase — standalone gallery of the design-system components in `ui/`,
 * for the designer to review rebuilt components before/while they're used in the app.
 * Opens at /#showcase (dev: http://localhost:5173/#showcase); the main app is untouched.
 * Layout mirrors a docs site: top bar (Foundation/Components/Patterns), left sidebar
 * listing components (one shown at a time), and per-component sections
 * (Overview / Test me / Variants) with a right-hand section nav.
 * To add a component: add it to NAV + a <ComponentPage> branch below.
 */

/** 16/20px placeholder circle, standing in for Figma's icon-swap slot (inherits label color). */
/** Generic placeholder icon used across every demo's icon slot — 1px stroke by
 *  default, matching the DS-wide convention every real icon in this file now
 *  follows (a named default, not a literal baked into the markup, same as `size`). */
function CircleIcon({ size = 16, strokeWidth = 1 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth={strokeWidth} />
    </svg>
  );
}

/** Stand-in X for the PageHeader custom-back-icon demo (app uses MUI CloseIcon on sheet-style pages). */
function CloseGlyphIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Stand-in gear for the PageHeader custom-right-action demo (app uses lucide Settings). */
function SettingsGearIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/** Sidebar entries, grouped by function like a docs-site component index — add every
    new component to the matching group (id must match its ComponentPage branch). */
const NAV_GROUPS = [
  {
    category: "Actions",
    items: [
      { id: "button", label: "Button" },
      { id: "button-dock", label: "Button Dock" },
      { id: "summary-dock", label: "Summary Dock" },
      { id: "fab", label: "FAB" },
    ],
  },
  {
    category: "Inputs & Selection",
    items: [
      { id: "text-field", label: "Text Field" },
      { id: "text-area", label: "Text Area" },
      { id: "search", label: "Search" },
      { id: "toggle", label: "Toggle" },
      { id: "number-stepper", label: "Number Stepper" },
      { id: "tile", label: "Tile" },
      { id: "chips", label: "Chips" },
      { id: "checkbox-base", label: "Checkbox Base" },
      { id: "checkbox", label: "Checkbox" },
    ],
  },
  {
    category: "Feedback & Status",
    items: [
      { id: "toast-message", label: "Toast Message" },
      { id: "banner", label: "Banner" },
      { id: "badge", label: "Badge" },
      { id: "noti-badge", label: "Noti Badge" },
      { id: "loading", label: "Loading" },
      { id: "tooltip", label: "Tooltip" },
      { id: "x-close", label: "X Close" },
    ],
  },
  {
    category: "Navigation",
    items: [
      { id: "tabs-base", label: "Tabs Base" },
      { id: "segmented-controls", label: "Segmented Controls" },
      { id: "page-header", label: "Page Header" },
    ],
  },
  {
    category: "Data Display",
    items: [
      { id: "avatar", label: "Avatar" },
      { id: "invoice-status", label: "Invoice Status" },
      { id: "invoice-row", label: "Invoice Row" },
      { id: "outstanding-card", label: "Outstanding Card" },
      { id: "action-required", label: "Action Required" },
      { id: "list-row", label: "List Row" },
      { id: "list-card", label: "List Card" },
      { id: "notification-item", label: "Notification Item" },
      { id: "file-item-base", label: "File Item Base" },
    ],
  },
  {
    category: "Surfaces",
    items: [
      { id: "bottom-sheet", label: "Bottom Sheet" },
      { id: "overlay", label: "Overlay" },
    ],
  },
];

/** Flat lookup — nav order, active-item search, etc. all still work off one list. */
const NAV = NAV_GROUPS.flatMap((g) => g.items);

/** Sidebar/topbar chrome accents (match the reference docs-site style; not DS tokens). */
const NAV_ACCENT = "#2c46d4";
const SECTION_GREEN = "#0e8345";
const SECTION_GREEN_BG = "#e3f2e9";

const TABS = ["Foundation", "Components", "Patterns"] as const;
type Tab = (typeof TABS)[number];

function SwatchCell({ label, dark = false, children }: { label: string; dark?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="flex h-[76px] w-full items-center justify-center rounded-[10px] border"
        style={{
          pointerEvents: "none",
          background: dark ? "#222222" : "#fafafa",
          borderColor: dark ? "#3a3a3a" : "#ececec",
        }}
      >
        {children}
      </div>
      <p className="text-[12px]" style={{ ...FONT, color: MUTED }}>{label}</p>
    </div>
  );
}

/* ============================================================
   FOUNDATION — Colors/Typography/Spacing/Radius/Effects, the tab was a "nothing
   here yet" placeholder even though the tokens themselves have long existed
   (styles/tokens/*.css, theme.css, fonts.css). Every swatch/sample below reads
   its value via var(--token)/a real typography class rather than a copied
   hex/px — so this page can't drift from the actual token files; only the
   *labels* (px numbers, grouping) are hand-maintained. */

const MONO = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" };

const FOUNDATION_NAV_GROUPS = [
  {
    category: "Foundations",
    items: [
      { id: "colors", label: "Colors" },
      { id: "typography", label: "Typography" },
      { id: "spacing", label: "Spacing" },
      { id: "radius", label: "Radius" },
      { id: "effects", label: "Effects" },
    ],
  },
];
const FOUNDATION_NAV = FOUNDATION_NAV_GROUPS.flatMap((g) => g.items);

function FoundationPage({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="w-full">
      <span
        className="inline-block rounded-full px-3 py-1 text-[12px] font-medium"
        style={{ ...FONT, color: SECTION_GREEN, background: SECTION_GREEN_BG }}
      >
        Ready
      </span>
      <h1 className="mt-3 text-[32px] font-semibold" style={{ ...FONT, color: INK }}>{title}</h1>
      <p className="mt-2 max-w-[720px] text-[16px] leading-snug" style={{ ...FONT, color: MUTED }}>{description}</p>
      <div className="mt-8 flex flex-col gap-10">{children}</div>
    </div>
  );
}

function FoundationSection({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[17px] font-semibold" style={{ ...FONT, color: INK }}>{title}</p>
      {note && <p className="mt-1 max-w-[640px] text-[13px]" style={{ ...FONT, color: MUTED }}>{note}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

/** Reads its color via var(--token) — never a copied hex — so it always matches
 *  colors.css/theme.css, even after those files change. */
function ColorSwatch({ name }: { name: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="h-[56px] w-full rounded-[10px] border border-[#ececec]" style={{ background: `var(${name})` }} />
      <p className="text-[11px] leading-tight" style={{ ...MONO, color: INK }}>{name}</p>
    </div>
  );
}

function ColorGroup({ group, names }: { group: string; names: string[] }) {
  return (
    <div className="mb-6 last:mb-0">
      <p className="mb-3 text-[13px] font-medium" style={{ ...FONT, color: MUTED }}>{group}</p>
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-5 md:grid-cols-6">
        {names.map((n) => <ColorSwatch key={n} name={n} />)}
      </div>
    </div>
  );
}

const PRIMITIVE_COLOR_GROUPS = [
  { group: "Brand", names: ["--brand-1", "--brand-2", "--brand-3", "--brand-4", "--brand-5", "--brand-6", "--brand-7", "--brand-8", "--brand-9"] },
  { group: "Neutral", names: ["--neutral-0", "--neutral-1", "--neutral-2", "--neutral-3", "--neutral-4", "--neutral-5", "--neutral-6", "--neutral-7", "--neutral-8", "--neutral-9", "--neutral-10"] },
  { group: "Beige", names: ["--beige-1", "--beige-2", "--beige-3", "--beige-4", "--beige-5", "--beige-6", "--beige-7", "--beige-8", "--beige-9"] },
  { group: "Green", names: ["--green-1", "--green-2", "--green-3", "--green-4", "--green-5", "--green-6", "--green-7", "--green-8", "--green-9"] },
  { group: "Red", names: ["--red-1", "--red-2", "--red-3", "--red-4", "--red-5", "--red-6", "--red-7", "--red-8", "--red-9"] },
  { group: "Yellow", names: ["--yellow-1", "--yellow-2", "--yellow-3", "--yellow-4", "--yellow-5", "--yellow-6", "--yellow-7", "--yellow-8", "--yellow-9"] },
  { group: "Blue", names: ["--blue-1", "--blue-2", "--blue-3", "--blue-4", "--blue-5", "--blue-6", "--blue-7", "--blue-8", "--blue-9"] },
];

const SEMANTIC_COLOR_GROUPS = [
  {
    group: "Backgrounds",
    names: [
      "--bg-neutral-primary", "--bg-neutral-secondary", "--bg-neutral-tertiary", "--bg-neutral-disabled",
      "--bg-neutral-inverse-primary", "--bg-neutral-inverse-secondary", "--bg-neutral-inverse-tertiary", "--bg-neutral-inverse-disabled",
      "--bg-beige-primary", "--bg-beige-secondary", "--bg-beige-tertiary",
      "--bg-brand-primary", "--bg-brand-secondary",
      "--bg-success-subtle", "--bg-success-bold", "--bg-warning-subtle", "--bg-warning-bold",
      "--bg-error-subtle", "--bg-error-bold", "--bg-info-subtle", "--bg-info-bold",
    ],
  },
  {
    group: "Text",
    names: [
      "--text-primary", "--text-secondary", "--text-placeholder", "--text-disabled", "--text-on-color", "--text-brand",
      "--text-neutral-inverse-primary", "--text-neutral-inverse-secondary", "--text-neutral-inverse-disabled",
      "--text-success-primary", "--text-success-inverse", "--text-warning-primary", "--text-warning-inverse",
      "--text-error-primary", "--text-error-inverse", "--text-info-primary", "--text-info-inverse",
    ],
  },
  {
    group: "Icon",
    names: [
      "--icon-primary", "--icon-secondary", "--icon-placeholder", "--icon-disabled", "--icon-on-color", "--icon-brand",
      "--icon-neutral-inverse-primary", "--icon-neutral-inverse-secondary", "--icon-neutral-inverse-disabled",
      "--icon-success-primary", "--icon-success-inverse", "--icon-warning-primary", "--icon-warning-inverse",
      "--icon-error-primary", "--icon-error-inverse", "--icon-info-primary", "--icon-info-inverse",
    ],
  },
  {
    group: "Border",
    names: [
      "--border-beige-primary", "--border-beige-secondary", "--border-beige-tertiary",
      "--border-neutral-primary", "--border-neutral-secondary", "--border-neutral-tertiary",
      "--border-neutral-inverse-primary", "--border-neutral-inverse-secondary", "--border-neutral-inverse-tertiary",
      "--border-brand-primary", "--border-brand-secondary",
      "--border-success-subtle", "--border-success-bold", "--border-warning-subtle", "--border-warning-bold",
      "--border-error-subtle", "--border-error-bold", "--border-info-subtle", "--border-info-bold",
    ],
  },
];

function ColorsFoundationPage() {
  return (
    <FoundationPage
      title="Colors"
      description="The full palette lives in styles/tokens/colors.css (+ alpha.css) — raw scales, for reference only. Every component binds the semantic layer below (styles/theme.css) instead, so re-theming only ever touches that one file."
    >
      <FoundationSection title="Primitives" note="Raw scales (colors.css) — never bind a component directly to these, use the semantic tokens below instead.">
        {PRIMITIVE_COLOR_GROUPS.map((g) => <ColorGroup key={g.group} group={g.group} names={g.names} />)}
      </FoundationSection>
      <FoundationSection title="Semantic tokens" note="Resting-state values only — most backgrounds/borders also have -hover/-active variants for interactive surfaces (see theme.css).">
        {SEMANTIC_COLOR_GROUPS.map((g) => <ColorGroup key={g.group} group={g.group} names={g.names} />)}
      </FoundationSection>
    </FoundationPage>
  );
}

const HEADING_CLASSES = ["h0", "h1", "h2", "h3", "h4", "h5", "h6"];
const HIGHLIGHT_HEADING_CLASSES = ["h0-hl", "h1-hl", "h2-hl", "h3-hl", "h4-hl", "h5-hl", "h6-hl"];
const BODY_CLASSES = ["body-xl", "body-lg", "body-md", "body-md-bold", "body-sm", "body-sm-medium", "body-sm-bold"];
const CAPTION_CLASSES = ["caption", "caption-medium", "caption-sm"];
const CARD_TITLE_CLASSES = ["card-title-2xl", "card-title-xl", "card-title-lg", "card-title-md", "card-title-sm"];
const LINK_CLASSES = ["link-upper-lg", "link-upper-md", "link-upper-sm", "link-sentence-lg", "link-sentence-md", "link-sentence-sm"];

function TypeSample({ cls, sample }: { cls: string; sample: string }) {
  return (
    <div className="flex items-baseline gap-4 border-b border-[#f0f0f0] py-3 last:border-0">
      <p className={cls} style={{ color: INK, margin: 0, flex: "1 1 auto" }}>{sample}</p>
      <p className="shrink-0 text-[11px]" style={{ ...MONO, color: MUTED }}>.{cls}</p>
    </div>
  );
}

/** `sample` names the class's own role (e.g. "Heading", "Link text") rather than a
 *  fixed pangram/placeholder — generic enough for any size and self-explanatory. */
function TypeClassGroup({ classes, sample }: { classes: string[]; sample: string }) {
  return <div>{classes.map((c) => <TypeSample key={c} cls={c} sample={sample} />)}</div>;
}

function TypographyFoundationPage() {
  return (
    <FoundationPage
      title="Typography"
      description="GT Walsheim LC. Use the utility classes below (styles/fonts.css) instead of hand-rolling font-size/weight/line-height — they already fold in the mobile-mode responsive overrides for headings/card titles."
    >
      <FoundationSection title="Headings">
        <TypeClassGroup classes={HEADING_CLASSES} sample="Heading" />
      </FoundationSection>
      <FoundationSection title="Highlight headings" note="Same size scale as Headings, GT Walsheim's display cut.">
        <TypeClassGroup classes={HIGHLIGHT_HEADING_CLASSES} sample="Heading" />
      </FoundationSection>
      <FoundationSection title="Body">
        <TypeClassGroup classes={BODY_CLASSES} sample="Body text" />
      </FoundationSection>
      <FoundationSection title="Caption">
        <TypeClassGroup classes={CAPTION_CLASSES} sample="Caption text" />
      </FoundationSection>
      <FoundationSection title="Card titles" note="Desktop sizes shown — a separate, smaller tablet/mobile scale applies inside .mobile-mode.">
        <TypeClassGroup classes={CARD_TITLE_CLASSES} sample="Card title" />
      </FoundationSection>
      <FoundationSection title="Links">
        <TypeClassGroup classes={LINK_CLASSES} sample="Link text" />
      </FoundationSection>
    </FoundationPage>
  );
}

const SPACE_SCALE = [
  { name: "--space-0", px: 0 }, { name: "--space-1", px: 2 }, { name: "--space-2", px: 4 }, { name: "--space-3", px: 6 },
  { name: "--space-4", px: 8 }, { name: "--space-5", px: 10 }, { name: "--space-6", px: 12 }, { name: "--space-7", px: 14 },
  { name: "--space-8", px: 16 }, { name: "--space-9", px: 18 }, { name: "--space-10", px: 20 }, { name: "--space-12", px: 24 },
  { name: "--space-16", px: 32 }, { name: "--space-20", px: 40 }, { name: "--space-24", px: 48 }, { name: "--space-28", px: 56 },
  { name: "--space-32", px: 64 }, { name: "--space-36", px: 72 }, { name: "--space-40", px: 80 }, { name: "--space-44", px: 88 },
  { name: "--space-48", px: 96 }, { name: "--space-52", px: 104 },
];

function SpaceRow({ name, px }: { name: string; px: number }) {
  return (
    <div className="flex items-center gap-4 border-b border-[#f0f0f0] py-2.5 last:border-0">
      <p className="w-[100px] shrink-0 text-[13px]" style={{ ...MONO, color: INK }}>{name}</p>
      <p className="w-[40px] shrink-0 text-[12px]" style={{ ...FONT, color: MUTED }}>{px}px</p>
      <div className="h-[14px] rounded-[3px]" style={{ width: `var(${name})`, background: NAV_ACCENT }} />
    </div>
  );
}

function SpacingFoundationPage() {
  return (
    <FoundationPage
      title="Spacing"
      description="An 8px-based scale (styles/tokens/spacing.css) for padding, margin and gap. Bars are sized via var(--space-N) — always exactly what the token resolves to, not a redrawn copy."
    >
      <FoundationSection title="Scale">
        {SPACE_SCALE.map((s) => <SpaceRow key={s.name} {...s} />)}
      </FoundationSection>
    </FoundationPage>
  );
}

const RADIUS_SCALE = [
  { name: "--radius-none", px: 0 }, { name: "--radius-sm", px: 2 }, { name: "--radius-md", px: 4 },
  { name: "--radius-lg", px: 6 }, { name: "--radius-xl", px: 8 }, { name: "--radius-2xl", px: 12 },
  { name: "--radius-3xl", px: 16 }, { name: "--radius-4xl", px: 24 }, { name: "--radius-5xl", px: 32 },
  { name: "--radius-full", px: 9999 },
];
const BORDER_WIDTH_SCALE = [
  { name: "--border-width-sm", px: 1 }, { name: "--border-width-md", px: 1.5 }, { name: "--border-width-lg", px: 2 },
];

function RadiusSwatch({ name, px }: { name: string; px: number }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="h-[64px] w-[64px]" style={{ borderRadius: `var(${name})`, border: `2px solid ${NAV_ACCENT}`, background: "#f5f4f1" }} />
      <p className="text-[11px]" style={{ ...MONO, color: INK }}>{name}</p>
      <p className="text-[11px]" style={{ ...FONT, color: MUTED }}>{px === 9999 ? "full" : `${px}px`}</p>
    </div>
  );
}

function BorderWidthRow({ name, px }: { name: string; px: number }) {
  return (
    <div className="flex items-center gap-4 border-b border-[#f0f0f0] py-2.5 last:border-0">
      <p className="w-[140px] shrink-0 text-[13px]" style={{ ...MONO, color: INK }}>{name}</p>
      <p className="w-[40px] shrink-0 text-[12px]" style={{ ...FONT, color: MUTED }}>{px}px</p>
      <div className="w-[120px]" style={{ borderBottomWidth: `var(${name})`, borderBottomStyle: "solid", borderBottomColor: INK }} />
    </div>
  );
}

function RadiusFoundationPage() {
  return (
    <FoundationPage
      title="Radius"
      description="Corner rounding (styles/tokens/radius.css), plus the border-width scale used alongside it."
    >
      <FoundationSection title="Scale">
        <div className="grid grid-cols-3 gap-6 sm:grid-cols-5">
          {RADIUS_SCALE.map((r) => <RadiusSwatch key={r.name} {...r} />)}
        </div>
      </FoundationSection>
      <FoundationSection title="Border width">
        {BORDER_WIDTH_SCALE.map((b) => <BorderWidthRow key={b.name} {...b} />)}
      </FoundationSection>
    </FoundationPage>
  );
}

const SHADOW_SCALE = ["--shadow-sm", "--shadow-md", "--shadow-lg", "--shadow-dock-top", "--shadow-card-soft", "--shadow-card", "--shadow-bottomsheets"];

function ShadowSwatch({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="h-[88px] w-full rounded-[12px] bg-white" style={{ boxShadow: `var(${name})` }} />
      <p className="text-[11px]" style={{ ...MONO, color: INK }}>{name}</p>
    </div>
  );
}

function EffectsFoundationPage() {
  return (
    <FoundationPage
      title="Effects"
      description="Box-shadow tokens (styles/tokens/effect.css), shown on a beige canvas so the softer shadows stay visible. --shadow-tooltip is a filter: drop-shadow() (for a shape with a protruding arrow) rather than a box-shadow, so it isn't shown here as a box."
    >
      <FoundationSection title="Shadows">
        <div className="grid grid-cols-2 gap-6 rounded-[16px] p-6 sm:grid-cols-3" style={{ background: "#f3ecda" }}>
          {SHADOW_SCALE.map((s) => <ShadowSwatch key={s} name={s} />)}
        </div>
      </FoundationSection>
    </FoundationPage>
  );
}

/** One radio-style choice within a ControlGroup — every control is a labeled set of
 *  string options (booleans model as a 2-option Yes/No or On/Off group) so ControlsPanel
 *  only ever has to render one kind of input. */
interface ControlOption {
  value: string;
  label: string;
}
interface ControlGroup {
  key: string;
  label: string;
  options: ControlOption[];
}

/** Sidebar of radio-button groups — one label + option list per prop being demoed. Note
 *  it renders as a bare column (no own border/background): InteractiveDemo owns the single
 *  shared card the preview + controls both sit inside. Not meant to be used directly. */
function ControlsPanel({
  groups,
  values,
  onChange,
}: {
  groups: ControlGroup[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="w-[220px] shrink-0 border-l border-[#ececec] bg-white p-4">
      <p className="text-[13px] font-semibold" style={{ ...FONT, color: INK }}>Controls</p>
      <div className="mt-3 flex flex-col gap-4">
        {groups.map((g) => (
          <div key={g.key}>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide" style={{ ...FONT, color: MUTED }}>{g.label}</p>
            <div className="flex flex-col gap-1.5">
              {g.options.map((o) => (
                <label
                  key={o.value}
                  className="flex items-center gap-2 text-[13px]"
                  style={{ ...FONT, color: INK, cursor: "pointer" }}
                >
                  <input
                    type="radio"
                    name={g.key}
                    checked={values[g.key] === o.value}
                    onChange={() => onChange(g.key, o.value)}
                    style={{ accentColor: NAV_ACCENT, width: 14, height: 14, cursor: "pointer" }}
                  />
                  {o.label}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Live single-instance preview + a ControlsPanel to drive its props, both inside one
 *  shared card — replaces a static grid of every combination with one instance you flip
 *  through, in less space. This IS the component page's `overview` slot; nothing else
 *  needed alongside it (skip the `variants` prop on ComponentPage for these). */
function InteractiveDemo({
  groups,
  defaultValues,
  render,
  canvasBg,
}: {
  groups: ControlGroup[];
  defaultValues: Record<string, string>;
  render: (values: Record<string, string>) => React.ReactNode;
  /** Canvas background as a function of the current values — e.g. flip to a dark
   *  swatch when an "Inverse"/"Surface" control is on a dark-surface variant, or
   *  to the app's gray page color for onLayer="gray". Defaults to the standard light gray. */
  canvasBg?: (values: Record<string, string>) => string;
}) {
  const [values, setValues] = useState(defaultValues);
  return (
    <div className="flex items-stretch overflow-hidden rounded-[12px] border border-[#ececec]">
      <div className="flex min-h-[220px] flex-1 items-center justify-center p-8" style={{ background: canvasBg ? canvasBg(values) : "#f4f4f2" }}>
        {render(values)}
      </div>
      <ControlsPanel groups={groups} values={values} onChange={(key, value) => setValues((prev) => ({ ...prev, [key]: value }))} />
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-10" style={{ scrollMarginTop: 88 }}>
      <h2 className="text-[22px] font-semibold" style={{ ...FONT, color: INK }}>{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** One component's doc page: header + Overview / Test me / Variants + right section nav. */
/** One component's doc page — plain flowing content on the page background (no card/border),
 *  like a document rather than a boxed panel. */
/** One column of a UsageGuidance card — "positive" (green label, When to use) or
 *  "negative" (red label, When not to use — always points at the sibling component
 *  to use instead, never just "don't use this"). */
function UsageList({ title, items, tone }: { title: string; items: string[]; tone: "positive" | "negative" }) {
  const color = tone === "positive" ? SECTION_GREEN : "#b3261e";
  return (
    <div className="min-w-[240px] flex-1">
      <p className="text-[12px] font-semibold uppercase tracking-wide" style={{ ...FONT, color }}>{title}</p>
      <ul className="mt-2 flex flex-col gap-1.5 pl-4" style={{ listStyleType: "disc" }}>
        {items.map((item, i) => (
          <li key={i} className="text-[14px] leading-snug" style={{ ...FONT, color: INK }}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

/** The "what is it" line (description) says what a component IS; this says WHEN to
 *  reach for it — every design system doc site (Ant Design's "When To Use", Atlassian's
 *  When to use/When not to use cards) separates the two because "what" alone doesn't
 *  tell a reader which of several similar-looking components is the right pick. */
function UsageGuidance({ whenToUse, whenNotToUse }: { whenToUse: string[]; whenNotToUse?: string[] }) {
  return (
    <div className="mt-5 flex max-w-[720px] flex-col gap-5 rounded-[12px] border border-[#e5e5e5] bg-[#fafafa] p-5 sm:flex-row">
      <UsageList title="When to use" items={whenToUse} tone="positive" />
      {whenNotToUse && whenNotToUse.length > 0 && (
        <UsageList title="When not to use" items={whenNotToUse} tone="negative" />
      )}
    </div>
  );
}

/** One "rule" in a component's Interaction Patterns list — a short bold lead (the rule)
 *  plus one sentence of body (why / how it's implemented). Distinct from UsageGuidance,
 *  which answers "should I reach for this component at all" — this answers "how do I use
 *  it correctly once I have", e.g. Bottom Sheet's sub-level/search/sizing conventions. */
function PatternList({ items }: { items: { title: string; body: string }[] }) {
  return (
    <ul className="flex max-w-[720px] flex-col gap-3">
      {items.map((item, i) => (
        <li key={i} className="text-[14px] leading-snug" style={{ ...FONT, color: INK }}>
          <span className="font-semibold">{item.title}.</span> <span style={{ color: MUTED }}>{item.body}</span>
        </li>
      ))}
    </ul>
  );
}

function ComponentPage({
  title,
  description,
  whenToUse,
  whenNotToUse,
  overview,
  patterns,
  variants,
}: {
  title: string;
  description: string;
  /** 2-4 short, concrete situations this component is the right fit for — not a
   *  restatement of `description`, e.g. "Confirming a one-off action just completed". */
  whenToUse: string[];
  /** Only set when there's a specific sibling component to redirect to instead
   *  (e.g. Text Field → "Multi-line text — use Text Area instead"); omit otherwise. */
  whenNotToUse?: string[];
  /** The interactive demo panel — the page's hero, like the reference docs site. */
  overview: React.ReactNode;
  /** Standing "how it behaves" rules — decided conventions a builder should reuse rather
   *  than re-derive (e.g. Bottom Sheet's sub-level/search/keyboard behavior). This page is
   *  read by non-developers too (PO, stakeholders) — write each title/body in plain,
   *  everyday language describing what someone SEES happen, never prop names, code terms,
   *  or library names (no "heightClass", "Framer Motion", "object-literal", etc.). Omit
   *  for components with no such conventions beyond their variant props. */
  patterns?: { title: string; body: string }[];
  /** The exhaustive variant grid — omit for components whose Overview is an
   *  InteractiveDemo (controls + live preview already cover every combination). */
  variants?: React.ReactNode;
}) {
  return (
    <div className="w-full">
      <span
        className="inline-block rounded-full px-3 py-1 text-[12px] font-medium"
        style={{ ...FONT, color: SECTION_GREEN, background: SECTION_GREEN_BG }}
      >
        Ready
      </span>
      <h1 className="mt-3 text-[32px] font-semibold" style={{ ...FONT, color: INK }}>{title}</h1>
      <p className="mt-2 max-w-[720px] text-[16px] leading-snug" style={{ ...FONT, color: MUTED }}>{description}</p>
      <UsageGuidance whenToUse={whenToUse} whenNotToUse={whenNotToUse} />
      <Section id="overview" title="Overview">{overview}</Section>
      {patterns && patterns.length > 0 && (
        <Section id="patterns" title="How It Behaves">
          <PatternList items={patterns} />
        </Section>
      )}
      {variants && <Section id="variants" title="Variants">{variants}</Section>}
    </div>
  );
}

const HIERARCHIES = ["primary", "secondary", "tertiary"] as const;

const XCLOSE_CONTROL_GROUPS: ControlGroup[] = [
  {
    key: "size",
    label: "Size",
    options: [
      { value: "sm", label: "Small (20px) — default, e.g. inside a Toast" },
      { value: "md", label: "Medium (30px) — a standalone dismiss, e.g. a sheet header" },
    ],
  },
  {
    key: "inverse",
    label: "Surface",
    options: [
      { value: "off", label: "Normal — light surfaces" },
      { value: "on", label: "Inverse — dark surfaces, e.g. Toast Message" },
    ],
  },
];

function XCloseOverview() {
  return (
    <InteractiveDemo
      groups={XCLOSE_CONTROL_GROUPS}
      defaultValues={{ size: "sm", inverse: "off" }}
      canvasBg={(v) => (v.inverse === "on" ? "#1b1b1b" : "#f4f4f2")}
      render={(v) => <XClose size={v.size as XCloseSize} inverse={v.inverse === "on"} onClick={() => {}} />}
    />
  );
}

const TOAST_MESSAGE_CONTROL_GROUPS: ControlGroup[] = [
  {
    key: "variant",
    label: "Variant",
    options: [
      { value: "default", label: "Default — no icon, e.g. a generic confirmation" },
      { value: "success", label: "Success — e.g. \"Invoice sent\"" },
      { value: "error", label: "Error — e.g. a failed send" },
      { value: "warning", label: "Warning — e.g. a partial success" },
    ],
  },
  {
    key: "subtitle",
    label: "Subtitle",
    options: [
      { value: "on", label: "Shown" },
      { value: "off", label: "Hidden" },
    ],
  },
  {
    key: "action",
    label: "Action link",
    options: [
      { value: "off", label: "Hidden" },
      { value: "on", label: "Shown — e.g. \"View Details\" opens the sent invoice" },
    ],
  },
];

function ToastMessageOverview() {
  return (
    <InteractiveDemo
      groups={TOAST_MESSAGE_CONTROL_GROUPS}
      defaultValues={{ variant: "success", subtitle: "on", action: "on" }}
      canvasBg={() => "#f4f4f2"}
      render={(v) => (
        <div className="w-[356px]">
          <ToastMessage
            variant={v.variant as ToastVariant}
            title="Invoice sent"
            subtitle={v.subtitle === "on" ? "Marked as sent to the customer" : undefined}
            action={v.action === "on" ? { label: "View Details", onClick: () => {} } : undefined}
            onClose={() => {}}
          />
        </div>
      )}
    />
  );
}

const BANNER_CONTROL_GROUPS: ControlGroup[] = [
  {
    key: "color",
    label: "Color",
    options: [
      { value: "success", label: "Success — e.g. a confirmed action" },
      { value: "warning", label: "Warning — e.g. a soft attention-needed notice" },
      { value: "error", label: "Error — e.g. a failed validation" },
      { value: "info", label: "Info — e.g. a neutral heads-up" },
    ],
  },
  {
    key: "layout",
    label: "Layout",
    options: [
      { value: "text", label: "Text only — use for a single-line status message" },
      { value: "title", label: "Title + Text — use when the status needs its own bold headline above the detail" },
    ],
  },
  {
    key: "link",
    label: "Link",
    options: [
      { value: "off", label: "Hidden" },
      { value: "on", label: "Shown — use when there's somewhere to send the user for more detail (e.g. a linked record)" },
    ],
  },
  {
    key: "dismiss",
    label: "Dismiss",
    options: [
      { value: "off", label: "Hidden — use for a persistent status that isn't the user's to clear" },
      { value: "on", label: "Shown — use when the user can acknowledge/close the banner themselves" },
    ],
  },
];

function BannerOverview() {
  return (
    <InteractiveDemo
      groups={BANNER_CONTROL_GROUPS}
      defaultValues={{ color: "success", layout: "title", link: "on", dismiss: "on" }}
      render={(v) => (
        <div className="w-[320px]">
          <Banner
            color={v.color as BannerColor}
            title={v.layout === "title" ? "Title" : undefined}
            text="Your information is secure and encrypted"
            onLinkClick={v.link === "on" ? () => {} : undefined}
            onClose={v.dismiss === "on" ? () => {} : undefined}
          />
        </div>
      )}
    />
  );
}

const BADGE_CONTROL_GROUPS: ControlGroup[] = [
  {
    key: "variant",
    label: "Style",
    options: [
      { value: "subtle", label: "Subtle" },
      { value: "bold", label: "Bold" },
      { value: "text", label: "Text" },
    ],
  },
  {
    key: "color",
    label: "Color",
    options: [
      { value: "neutral", label: "Neutral" },
      { value: "success", label: "Success" },
      { value: "warning", label: "Warning" },
      { value: "error", label: "Error" },
      { value: "info", label: "Info" },
      { value: "custom", label: "Custom" },
    ],
  },
  {
    key: "size",
    label: "Size",
    options: [
      { value: "sm", label: "Small" },
      { value: "md", label: "Medium" },
      { value: "lg", label: "Large" },
    ],
  },
  {
    key: "icon",
    label: "Icon",
    options: [
      { value: "off", label: "None" },
      { value: "on", label: "Leading icon" },
    ],
  },
];

function BadgeOverview() {
  return (
    <div className="flex flex-col gap-6">
      <InteractiveDemo
        groups={BADGE_CONTROL_GROUPS}
        defaultValues={{ variant: "subtle", color: "success", size: "md", icon: "off" }}
        render={(v) => (
          <Badge
            label="Text"
            variant={v.variant as "subtle" | "bold" | "text"}
            color={v.color as BadgeColor}
            size={v.size as "sm" | "md" | "lg"}
            icon={v.icon === "on" ? <CircleIcon size={v.size === "lg" ? 16 : 12} /> : undefined}
          />
        )}
      />
      <div className="flex flex-col gap-3 rounded-[10px] border border-[#ececec] bg-[#f4f4f2] px-4 py-5">
        <p className="text-[12px]" style={{ ...FONT, color: MUTED }}>As they'd appear on invoices:</p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge label="Paid" color="success" />
          <Badge label="Awaiting payment" color="info" />
          <Badge label="Partially paid" color="warning" />
          <Badge label="Overdue" color="error" variant="bold" />
          <Badge label="Draft" />
          <Badge label="New" color="custom" variant="bold" />
        </div>
      </div>
    </div>
  );
}

const CHIPS_CONTROL_GROUPS: ControlGroup[] = [
  {
    key: "type",
    label: "Type",
    options: [
      { value: "filter", label: "Filter" },
      { value: "input", label: "Input" },
    ],
  },
  {
    key: "active",
    label: "State (Filter only)",
    options: [
      { value: "off", label: "Default" },
      { value: "on", label: "Active" },
    ],
  },
];

function ChipsOverview() {
  const [selected, setSelected] = useState("newest");
  const [demoTags, setDemoTags] = useState(["ada@example.com", "sam@example.com"]);
  return (
    <div className="flex flex-col gap-6">
      <InteractiveDemo
        groups={CHIPS_CONTROL_GROUPS}
        defaultValues={{ type: "filter", active: "off" }}
        render={(v) =>
          v.type === "input" ? (
            <Chips type="input" label="name@example.com" onDismiss={() => {}} />
          ) : (
            <Chips label="Label" active={v.active === "on"} />
          )
        }
      />
      <div className="flex flex-col gap-3 rounded-[10px] border border-[#ececec] bg-[#f4f4f2] px-4 py-5">
        <p className="text-[12px]" style={{ ...FONT, color: MUTED }}>As a filter row — one selected at a time:</p>
        <div className="flex flex-wrap gap-2">
          {["Newest", "Oldest", "Amount: High to low", "Amount: Low to high"].map((label) => {
            const key = label.toLowerCase();
            return (
              <Chips key={key} label={label} active={selected === key} onClick={() => setSelected(key)} />
            );
          })}
        </div>
      </div>
      <div className="flex flex-col gap-3 rounded-[10px] border border-[#ececec] bg-[#f4f4f2] px-4 py-5">
        <p className="text-[12px]" style={{ ...FONT, color: MUTED }}>
          As removable value pills (e.g. Send Invoice's Add Recipients) — press and hold one to see
          its Pressed surface; tap the "x" to remove it, animated in/out via AnimatePresence:
        </p>
        <div className="flex flex-wrap gap-2">
          <AnimatePresence initial={false}>
            {demoTags.map((tag) => (
              <motion.div
                key={tag}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
              >
                <Chips type="input" label={tag} onDismiss={() => setDemoTags((prev) => prev.filter((t) => t !== tag))} />
              </motion.div>
            ))}
          </AnimatePresence>
          {demoTags.length === 0 && (
            <button
              type="button"
              className="text-[12px] underline"
              style={{ ...FONT, color: MUTED }}
              onClick={() => setDemoTags(["ada@example.com", "sam@example.com"])}
            >
              Reset demo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const CHECKBOXBASE_CONTROL_GROUPS: ControlGroup[] = [
  {
    key: "state",
    label: "State",
    options: [
      { value: "unchecked", label: "Unchecked" },
      { value: "checked", label: "Checked" },
      { value: "indeterminate", label: "Indeterminate" },
    ],
  },
  {
    key: "size",
    label: "Size",
    options: [
      { value: "sm", label: "Small" },
      { value: "md", label: "Medium" },
    ],
  },
  {
    key: "disabled",
    label: "Disabled",
    options: [
      { value: "off", label: "No" },
      { value: "on", label: "Yes" },
    ],
  },
];

function CheckboxBaseOverview() {
  const [live, setLive] = useState(false);
  return (
    <div className="flex flex-col gap-6">
      <InteractiveDemo
        groups={CHECKBOXBASE_CONTROL_GROUPS}
        defaultValues={{ state: "checked", size: "sm", disabled: "off" }}
        render={(v) => (
          <CheckboxBase
            checked={v.state !== "unchecked"}
            indeterminate={v.state === "indeterminate"}
            size={v.size as "sm" | "md"}
            disabled={v.disabled === "on"}
            aria-label="Example checkbox"
          />
        )}
      />
      <div className="flex items-center gap-3 rounded-[10px] border border-[#ececec] bg-[#f4f4f2] px-4 py-5">
        <p className="text-[12px]" style={{ ...FONT, color: MUTED }}>Standalone + interactive:</p>
        <CheckboxBase checked={live} onChange={setLive} aria-label="Toggle example" />
      </div>
    </div>
  );
}

const CHECKBOX_CONTROL_GROUPS: ControlGroup[] = [
  {
    key: "description",
    label: "Description",
    options: [
      { value: "on", label: "Shown" },
      { value: "off", label: "Hidden" },
    ],
  },
  {
    key: "disabled",
    label: "Disabled",
    options: [
      { value: "off", label: "No" },
      { value: "on", label: "Yes" },
    ],
  },
];

function CheckboxOverview() {
  const [checked, setChecked] = useState(true);
  return (
    <div className="flex flex-col gap-6">
      <InteractiveDemo
        groups={CHECKBOX_CONTROL_GROUPS}
        defaultValues={{ description: "on", disabled: "off" }}
        render={(v) => (
          <Checkbox
            checked={checked}
            onChange={setChecked}
            label="Remember me"
            description={v.description === "on" ? "Save my login details for next time" : undefined}
            disabled={v.disabled === "on"}
          />
        )}
      />
    </div>
  );
}

const NOTIBADGE_CONTROL_GROUPS: ControlGroup[] = [
  {
    key: "style",
    label: "Style",
    options: [
      { value: "solid", label: "Solid" },
      { value: "inverse", label: "Inverse" },
    ],
  },
  {
    key: "count",
    label: "Count",
    options: [
      { value: "3", label: "1 digit (3)" },
      { value: "12", label: "2 digits (12)" },
      { value: "99+", label: "Capped (99+)" },
    ],
  },
];

function NotiBadgeOverview() {
  return (
    <div className="flex flex-col gap-6">
      <InteractiveDemo
        groups={NOTIBADGE_CONTROL_GROUPS}
        defaultValues={{ style: "solid", count: "99+" }}
        render={(v) => <NotiBadge count={v.count} inverse={v.style === "inverse"} />}
      />
      <div className="flex flex-col gap-3 rounded-[10px] border border-[#ececec] bg-[#f4f4f2] px-4 py-5">
        <p className="text-[12px]" style={{ ...FONT, color: MUTED }}>Overlaid on a tab (see Tabs Base):</p>
        <div className="flex flex-wrap items-center gap-6">
          <TabsBase label="Text" unread="99+" />
          <TabsBase label="Text" active unread="99+" />
        </div>
      </div>
    </div>
  );
}

const BUTTON_CONTROL_GROUPS: ControlGroup[] = [
  {
    key: "hierarchy",
    label: "Hierarchy",
    options: HIERARCHIES.map((h) => ({ value: h, label: h[0].toUpperCase() + h.slice(1) })),
  },
  {
    key: "size",
    label: "Size",
    options: [
      { value: "md", label: "Medium" },
      { value: "sm", label: "Small" },
    ],
  },
  {
    key: "shape",
    label: "Shape",
    options: [
      { value: "rec", label: "Rectangle" },
      { value: "square", label: "Square (icon-only)" },
    ],
  },
  {
    key: "icon",
    label: "Icon",
    options: [
      { value: "none", label: "None" },
      { value: "left", label: "Leading" },
      { value: "right", label: "Trailing" },
    ],
  },
  {
    key: "state",
    label: "State",
    options: [
      { value: "default", label: "Default" },
      { value: "active", label: "Active (pressed)" },
      { value: "loading", label: "Loading" },
      { value: "disabled", label: "Disabled" },
    ],
  },
  {
    key: "color",
    label: "Color",
    options: [
      { value: "default", label: "Default — use for the standard, non-recommended-but-safe choice" },
      { value: "destructive", label: "Destructive — use when this action is irreversible (e.g. a \"Delete Draft\" button); only the filled primary hierarchy turns red" },
      { value: "success", label: "Success — use for a just-completed confirmation (e.g. \"Invoice Sent\"); only the filled primary hierarchy turns green" },
    ],
  },
  {
    key: "surface",
    label: "Surface",
    options: [
      { value: "light", label: "Light" },
      { value: "dark", label: "Dark (inverse)" },
    ],
  },
];

function ButtonOverview() {
  return (
    <InteractiveDemo
      groups={BUTTON_CONTROL_GROUPS}
      defaultValues={{ hierarchy: "secondary", size: "md", shape: "rec", icon: "none", state: "default", color: "default", surface: "light" }}
      canvasBg={(v) => (v.surface === "dark" ? "#222222" : "#f4f4f2")}
      render={(v) => (
        <Button
          hierarchy={v.hierarchy as Hierarchy}
          size={v.size as "md" | "sm"}
          square={v.shape === "square"}
          label={v.shape === "square" ? undefined : "Button"}
          icon={v.shape === "square" ? <CircleIcon /> : undefined}
          iconLeft={v.shape === "rec" && v.icon === "left" ? <CircleIcon /> : undefined}
          iconRight={v.shape === "rec" && v.icon === "right" ? <CircleIcon /> : undefined}
          disabled={v.state === "disabled"}
          loading={v.state === "loading"}
          forceActive={v.state === "active"}
          destructive={v.color === "destructive"}
          success={v.color === "success"}
          inverse={v.surface === "dark"}
          aria-label={v.shape === "square" ? "Square button" : undefined}
        />
      )}
    />
  );
}

const FAB_CONTROL_GROUPS: ControlGroup[] = [
  {
    key: "hierarchy",
    label: "Hierarchy",
    options: HIERARCHIES.map((h) => ({ value: h, label: h[0].toUpperCase() + h.slice(1) })),
  },
  {
    key: "shape",
    label: "Shape",
    options: [
      { value: "pill", label: "Rounded pill" },
      { value: "circle", label: "Circle (icon-only)" },
    ],
  },
  {
    key: "collapsed",
    label: "Collapsed (pill only)",
    options: [
      { value: "no", label: "Expanded" },
      { value: "yes", label: "Collapsed" },
    ],
  },
  {
    key: "state",
    label: "State",
    options: [
      { value: "default", label: "Default" },
      { value: "active", label: "Active (pressed)" },
      { value: "disabled", label: "Disabled" },
    ],
  },
  {
    key: "surface",
    label: "Surface",
    options: [
      { value: "light", label: "Light" },
      { value: "dark", label: "Dark (inverse)" },
    ],
  },
];

function FabOverview() {
  return (
    <InteractiveDemo
      groups={FAB_CONTROL_GROUPS}
      defaultValues={{ hierarchy: "primary", shape: "pill", collapsed: "no", state: "default", surface: "light" }}
      canvasBg={(v) => (v.surface === "dark" ? "#222222" : "#f4f4f2")}
      render={(v) => (
        <FAB
          hierarchy={v.hierarchy as Hierarchy}
          circle={v.shape === "circle"}
          collapsed={v.shape === "pill" && v.collapsed === "yes"}
          label={v.shape === "pill" ? "Button" : undefined}
          icon={v.shape === "circle" ? <CircleIcon size={20} /> : undefined}
          iconLeft={v.shape === "pill" ? <CircleIcon size={20} /> : undefined}
          disabled={v.state === "disabled"}
          forceActive={v.state === "active"}
          inverse={v.surface === "dark"}
          aria-label={v.shape === "circle" ? "Circle FAB" : undefined}
        />
      )}
    />
  );
}

const TOOLTIP_ARROWS: { arrow: TooltipArrow; label: string }[] = [
  { arrow: "none", label: "None" },
  { arrow: "top", label: "Top center" },
  { arrow: "bottom", label: "Bottom center" },
  { arrow: "bottom-left", label: "Bottom left" },
  { arrow: "bottom-right", label: "Bottom right" },
  { arrow: "left", label: "Left" },
  { arrow: "right", label: "Right" },
];

const TOOLTIP_DESCRIPTION =
  "Tooltips are used to describe or identify an element. In most scenarios, tooltips help the user understand the meaning, function or alt-text of an element.";

const TOOLTIP_CONTROL_GROUPS: ControlGroup[] = [
  {
    key: "style",
    label: "Style",
    options: [
      { value: "default", label: "Default (beige, for dark surfaces)" },
      { value: "inverse", label: "Inverse (dark, for light surfaces)" },
    ],
  },
  {
    key: "arrow",
    label: "Arrow",
    options: TOOLTIP_ARROWS.map(({ arrow, label }) => ({ value: arrow, label })),
  },
  {
    key: "description",
    label: "Supporting text",
    options: [
      { value: "off", label: "None" },
      { value: "on", label: "Shown (320px max width)" },
    ],
  },
];

function TooltipOverview() {
  return (
    <InteractiveDemo
      groups={TOOLTIP_CONTROL_GROUPS}
      defaultValues={{ style: "inverse", arrow: "bottom-left", description: "on" }}
      canvasBg={(v) => (v.style === "default" ? "#222222" : "#f4f4f2")}
      render={(v) => (
        <Tooltip
          inverse={v.style === "inverse"}
          arrow={v.arrow as TooltipArrow}
          title={v.description === "on" ? "Due date" : "This is a tooltip"}
          description={v.description === "on" ? TOOLTIP_DESCRIPTION : undefined}
        />
      )}
    />
  );
}

/** Auto-height swatch (SwatchCell is fixed-height; tall content like supporting-text
    tooltips or labeled text fields needs this instead). */
function AutoCell({ label, dark = false, children }: { label: string; dark?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="flex w-full items-center justify-center rounded-[10px] border px-4 py-6"
        style={{
          pointerEvents: "none",
          background: dark ? "#222222" : "#fafafa",
          borderColor: dark ? "#3a3a3a" : "#ececec",
        }}
      >
        {children}
      </div>
      <p className="text-[12px]" style={{ ...FONT, color: MUTED }}>{label}</p>
    </div>
  );
}

const TABSBASE_CONTROL_GROUPS: ControlGroup[] = [
  {
    key: "variant",
    label: "Style",
    options: [
      { value: "button", label: "Button" },
      { value: "underline", label: "Underline" },
    ],
  },
  {
    key: "state",
    label: "State",
    options: [
      { value: "active", label: "Active" },
      { value: "default", label: "Default" },
    ],
  },
  {
    key: "icon",
    label: "Icon",
    options: [
      { value: "off", label: "None" },
      { value: "on", label: "Leading icon" },
    ],
  },
  {
    key: "unread",
    label: "Unread badge",
    options: [
      { value: "off", label: "None" },
      { value: "on", label: "99+" },
    ],
  },
];

function TabsTestMe() {
  const [buttonTab, setButtonTab] = useState(0);
  const [underlineTab, setUnderlineTab] = useState(0);
  // enough tabs to overflow the panel — drag/scroll the row to see the overflow behavior
  const labels = ["Invoices", "Credit notes", "Drafts", "Recurring", "Customers", "Reports"];
  return (
    <div className="flex flex-col gap-6">
      <InteractiveDemo
        groups={TABSBASE_CONTROL_GROUPS}
        defaultValues={{ variant: "button", state: "active", icon: "off", unread: "off" }}
        render={(v) => (
          <TabsBase
            label="Text"
            variant={v.variant as "button" | "underline"}
            active={v.state === "active"}
            icon={v.icon === "on" ? <CircleIcon size={12} /> : undefined}
            unread={v.unread === "on" ? "99+" : undefined}
          />
        )}
      />
      <div className="flex flex-col gap-4 rounded-[10px] border border-[#ececec] bg-[#f4f4f2] px-4 py-5">
        <div>
          <p className="mb-2 text-[12px]" style={{ ...FONT, color: MUTED }}>A full row of tabs — button style</p>
          <HorizontalTabs tabs={labels} activeIndex={buttonTab} onChange={setButtonTab} />
        </div>
        <div>
          <p className="mb-2 text-[12px]" style={{ ...FONT, color: MUTED }}>A full row of tabs — underline style</p>
          <HorizontalTabs tabs={labels} variant="underline" activeIndex={underlineTab} onChange={setUnderlineTab} />
        </div>
      </div>
    </div>
  );
}

const SEGMENTEDCONTROLS_CONTROL_GROUPS: ControlGroup[] = [
  {
    key: "count",
    label: "Segments",
    options: [
      { value: "2", label: "2" },
      { value: "3", label: "3" },
      { value: "4", label: "4" },
    ],
  },
];

function SegmentedControlsTestMe() {
  const [active2, setActive2] = useState(0);
  const [active3, setActive3] = useState(0);
  const [active4, setActive4] = useState(0);
  const demos: Record<string, { segments: string[]; active: number; onChange: (i: number) => void }> = {
    "2": { segments: ["Label", "Label"], active: active2, onChange: setActive2 },
    "3": { segments: ["Label", "Label", "Label"], active: active3, onChange: setActive3 },
    "4": { segments: ["Label", "Label", "Label", "Label"], active: active4, onChange: setActive4 },
  };
  return (
    <div className="flex flex-col gap-6">
      <InteractiveDemo
        groups={SEGMENTEDCONTROLS_CONTROL_GROUPS}
        defaultValues={{ count: "2" }}
        render={(v) => {
          const demo = demos[v.count];
          return (
            <div className="w-[343px]">
              <SegmentedControls segments={demo.segments} activeIndex={demo.active} onChange={demo.onChange} />
            </div>
          );
        }}
      />
      <div className="flex flex-col gap-3 rounded-[10px] border border-[#ececec] bg-[#f4f4f2] px-4 py-5">
        <p className="text-[12px]" style={{ ...FONT, color: MUTED }}>A single segment on its own, outside a full row:</p>
        <div className="flex flex-wrap items-center gap-4">
          <SegmentedControlBase label="Label" active />
          <SegmentedControlBase label="Label" />
        </div>
      </div>
    </div>
  );
}

const LOADING_SIZES: { size: LoadingSize; label: string }[] = [
  { size: "lg", label: "lg (116px, with logo)" },
  { size: "md", label: "md (64px, with logo)" },
  { size: "sm", label: "sm (32px, with logo)" },
  { size: "xs", label: "xs (24px)" },
  { size: "2xs", label: "2xs (16px)" },
];

const LOADING_CONTROL_GROUPS: ControlGroup[] = [
  {
    key: "size",
    label: "Size",
    options: LOADING_SIZES.map(({ size, label }) => ({ value: size, label })),
  },
];

function LoadingOverview() {
  return (
    <InteractiveDemo
      groups={LOADING_CONTROL_GROUPS}
      defaultValues={{ size: "lg" }}
      render={(v) => <Loading size={v.size as LoadingSize} />}
    />
  );
}

/** Real 375×812 phone frame (matches every app screen's device size, same
    recipe as `PhoneDockStage`) with a `StatusBar`, page content dimmed behind
    a bottom sheet via the shared `Overlay` component. Used once, for the
    Overview demo — compact `SheetStage` below covers the Variants grid. */
function PhoneSheetStage({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mobile-mode relative flex flex-col overflow-hidden rounded-[48px] bg-[var(--bg-neutral-tertiary)] shadow-2xl"
      style={{ width: 375, height: 812 }}
    >
      <StatusBar />
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
        <div className="h-3 w-3/4 rounded bg-[#d8cfb6]" />
        <div className="h-12 w-full rounded bg-[#efe7d2]" />
        <div className="h-3 w-1/2 rounded bg-[#e3dcc5]" />
        <div className="h-12 w-full rounded bg-[#efe7d2]" />
      </div>
      <div className="absolute inset-0" style={{ background: "var(--overlay)" }} />
      <div className="absolute inset-x-0 bottom-0">{children}</div>
    </div>
  );
}

/** Compact 375px-wide stage for the Variants grid — page content dimmed
    behind a bottom sheet, no full device chrome (that's what
    `PhoneSheetStage` is for). Keeps a page with many variants scannable. */
function SheetStage({ children }: { children: React.ReactNode }) {
  return (
    <div className="mobile-mode relative w-full max-w-[375px] overflow-hidden rounded-[12px] bg-[var(--bg-neutral-tertiary)]">
      <div className="flex flex-col gap-2 p-4 pb-20">
        <div className="h-3 w-3/4 rounded bg-[#d8cfb6]" />
        <div className="h-12 w-full rounded bg-[#efe7d2]" />
        <div className="h-3 w-1/2 rounded bg-[#e3dcc5]" />
        <div className="h-12 w-full rounded bg-[#efe7d2]" />
      </div>
      <div className="absolute inset-0" style={{ background: "var(--overlay)" }} />
      <div className="absolute inset-x-0 bottom-0">{children}</div>
    </div>
  );
}

const BOTTOMSHEET_CONTROL_GROUPS: ControlGroup[] = [
  {
    key: "header",
    label: "Header",
    options: [
      { value: "action", label: "Title + action button" },
      { value: "title", label: "Title only" },
      { value: "none", label: "Hidden (grabber too)" },
    ],
  },
  {
    key: "footer",
    label: "Footer",
    options: [
      { value: "none", label: "None (plain bottom pad)" },
      { value: "dock", label: "ButtonDock (Confirm/Cancel)" },
    ],
  },
];

function BottomSheetOverview() {
  const filler = (
    <div className="flex flex-col gap-2 px-4">
      <div className="h-10 w-full rounded-[8px] bg-[#f4f4f2]" />
      <div className="h-10 w-full rounded-[8px] bg-[#f4f4f2]" />
    </div>
  );
  const [picked, setPicked] = useState("us");
  return (
    <div className="flex flex-col gap-6">
      <InteractiveDemo
        groups={BOTTOMSHEET_CONTROL_GROUPS}
        defaultValues={{ header: "action", footer: "none" }}
        render={(v) => (
          <SheetStage>
            <BottomSheet
              title={v.header === "none" ? undefined : "Title"}
              action={v.header === "action" ? <CircleIcon size={20} /> : undefined}
              showHeader={v.header !== "none"}
              footer={v.footer === "dock" ? <ButtonDock type="double" primaryLabel="Confirm" secondaryLabel="Cancel" /> : undefined}
            >
              {filler}
            </BottomSheet>
          </SheetStage>
        )}
      />
      <div className="flex flex-col items-start gap-3 rounded-[10px] border border-[#ececec] bg-[#f4f4f2] px-4 py-5">
        <p className="text-[12px]" style={{ ...FONT, color: MUTED }}>
          As a currency picker sheet (Tiles inside, frosted search action):
        </p>
        <PhoneSheetStage>
          <BottomSheet title="Currency" action={<CircleIcon size={20} />} actionLabel="Search currencies">
            <div className="flex flex-col gap-2 px-4">
              <Tile
                title="United States"
                text="USD"
                flag={<USFlag size={30} />}
                selected={picked === "us"}
                trailing={picked === "us" ? "check" : "none"}
                onClick={() => setPicked("us")}
              />
              <Tile
                title="Hong Kong"
                text="HKD"
                flag={<USFlag size={30} />}
                selected={picked === "hk"}
                trailing={picked === "hk" ? "check" : "none"}
                onClick={() => setPicked("hk")}
              />
            </div>
          </BottomSheet>
        </PhoneSheetStage>
      </div>
    </div>
  );
}

function OverlayOverview() {
  return (
    <div className="flex flex-col items-start gap-3 rounded-[10px] border border-[#ececec] bg-[#f4f4f2] px-4 py-5">
      <p className="text-[12px]" style={{ ...FONT, color: MUTED }}>
        Dims the page behind a sheet or pop-up — the page itself stays put, it doesn't shrink or shift:
      </p>
      <div
        className="mobile-mode relative flex flex-col overflow-hidden rounded-[48px] bg-[var(--bg-neutral-tertiary)] shadow-2xl"
        style={{ width: 375, height: 812 }}
      >
        <StatusBar />
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
          <div className="h-3 w-3/4 rounded bg-[#d8cfb6]" />
          <div className="h-12 w-full rounded bg-[#efe7d2]" />
          <div className="h-3 w-1/2 rounded bg-[#e3dcc5]" />
          <div className="h-12 w-full rounded bg-[#efe7d2]" />
        </div>
        <Overlay />
      </div>
    </div>
  );
}

/** Real 375×812 phone frame (matches every app screen's device size) with a
    default-iOS `StatusBar` (SF Pro, not the GT Walsheim brand font) and busy
    placeholder content behind a `sticky` dock, so the frosted gradient +
    blur reads like it does over a scrolling page. Used once, for the Overview
    demo — the full-device chrome is too tall to repeat across the Variants
    grid (see compact `DockStage` below for that). */
function PhoneDockStage({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mobile-mode relative flex flex-col overflow-hidden rounded-[48px] bg-[var(--bg-neutral-tertiary)] shadow-2xl"
      style={{ width: 375, height: 812 }}
    >
      <StatusBar />
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4" style={{ paddingBottom: 220 }}>
        <div className="h-3 w-3/4 rounded bg-[#d8cfb6]" />
        <div className="h-3 w-1/2 rounded bg-[#e3dcc5]" />
        <div className="h-12 w-full rounded bg-[#efe7d2]" />
        <div className="h-3 w-2/3 rounded bg-[#d8cfb6]" />
        <div className="h-12 w-full rounded bg-[#efe7d2]" />
        <div className="h-3 w-3/5 rounded bg-[#e3dcc5]" />
        <div className="h-12 w-full rounded bg-[#efe7d2]" />
      </div>
      {children}
    </div>
  );
}

/** Compact 375px-wide stage for the Variants grid — just the dock itself over
    a short strip of placeholder content, no full device chrome (that's what
    `PhoneDockStage` is for). Keeps a page with many variants scannable. */
function DockStage({ children }: { children: React.ReactNode }) {
  return (
    <div className="mobile-mode relative w-full max-w-[375px] overflow-hidden rounded-[12px] bg-[var(--bg-neutral-tertiary)]">
      <div className="flex flex-col gap-2 p-4">
        <div className="h-3 w-3/4 rounded bg-[#d8cfb6]" />
        <div className="h-3 w-1/2 rounded bg-[#e3dcc5]" />
        <div className="h-12 w-full rounded bg-[#efe7d2]" />
        <div className="h-3 w-2/3 rounded bg-[#d8cfb6]" />
        <div className="h-12 w-full rounded bg-[#efe7d2]" />
        <div className="h-3 w-3/5 rounded bg-[#e3dcc5]" />
        <div className="h-12 w-full rounded bg-[#efe7d2]" />
      </div>
      {children}
    </div>
  );
}

const BUTTONDOCK_CONTROL_GROUPS: ControlGroup[] = [
  {
    key: "type",
    label: "Type",
    options: [
      { value: "single", label: "Primary only" },
      { value: "double", label: "Primary + outline" },
      { value: "ghost", label: "Primary + ghost" },
      { value: "triple", label: "Primary + secondary + tertiary" },
    ],
  },
  {
    key: "stack",
    label: "Layout (ghost only)",
    options: [
      { value: "vertical", label: "Vertical" },
      { value: "horizontal", label: "Horizontal" },
    ],
  },
  {
    key: "accessory",
    label: "Checkbox accessory",
    options: [
      { value: "off", label: "Hidden" },
      { value: "on", label: "Shown" },
    ],
  },
  {
    key: "slot",
    label: "Slot (e.g. a price summary)",
    options: [
      { value: "off", label: "Hidden" },
      { value: "on", label: "Shown — e.g. Create Invoice's price summary" },
    ],
  },
  {
    key: "bottom",
    label: "iOS controls",
    options: [
      { value: "none", label: "None — use for most docks (the plain home-indicator bar was dropped)" },
      { value: "keyboard", label: "Keyboard — use when the dock sits above a focused text field" },
    ],
  },
  {
    key: "primaryColor",
    label: "Primary color",
    options: [
      { value: "default", label: "Default — a plain safe pair (e.g. Confirm / Cancel)" },
      { value: "destructive", label: "Destructive — an irreversible decision (e.g. Delete Draft) → primary fills red; secondary uses the destructive outline (renders plain/neutral — red is reserved for the primary)" },
      { value: "success", label: "Success — a just-completed confirmation (e.g. Invoice Sent) → primary fills green" },
    ],
  },
];

function ButtonDockOverview() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5 rounded-[10px] border border-[#ececec] bg-[#f4f4f2] px-4 py-3.5">
        <p className="text-[12px] leading-snug" style={{ ...FONT, color: MUTED }}>
          <strong style={{ color: INK }}>Vertical</strong> — up to 3 actions, stacked full width. Use when
          one action is the recommended one (e.g. Cancel/Delete) or there are 3 actions.
        </p>
        <p className="text-[12px] leading-snug" style={{ ...FONT, color: MUTED }}>
          <strong style={{ color: INK }}>Horizontal</strong> — exactly 2 equal actions side by side, both
          plain outlined buttons. Use for a neutral pair with no "safer" option, e.g. Close/Confirm.
        </p>
      </div>
      <InteractiveDemo
        groups={BUTTONDOCK_CONTROL_GROUPS}
        defaultValues={{ type: "double", stack: "vertical", accessory: "off", slot: "off", bottom: "none", primaryColor: "default" }}
        render={(v) => {
          const typeStack =
            v.type === "ghost"
              ? { type: "ghost" as const, stack: v.stack as ButtonDockStack }
              : { type: v.type as "single" | "double" | "triple" };
          return (
            <DockStage>
              <ButtonDock
                {...typeStack}
                sticky
                slot={v.slot === "on" ? <SummaryCard bare currency="USD" subtotal={110} discount={80} total={30} /> : undefined}
                accessory={v.accessory === "on"}
                checked
                primaryLabel={v.primaryColor === "destructive" ? "Delete Draft" : v.primaryColor === "success" ? "Invoice Sent" : "Confirm"}
                primaryDestructive={v.primaryColor === "destructive"}
                primarySuccess={v.primaryColor === "success"}
                secondaryLabel={v.type === "ghost" ? "Close" : v.primaryColor === "destructive" ? "Keep Draft" : "Cancel"}
                secondaryDestructive={v.primaryColor === "destructive"}
                tertiaryLabel="Close"
                keyboard={v.bottom === "keyboard"}
              />
            </DockStage>
          );
        }}
      />
      <div className="flex flex-col items-start gap-3 rounded-[10px] border border-[#ececec] bg-[#f4f4f2] px-4 py-5">
        <p className="text-[12px]" style={{ ...FONT, color: MUTED }}>
          The frosted dock floating over page content as it scrolls underneath — used for a page's own action buttons pinned to the bottom (a sheet's footer buttons stay fixed in place with the sheet instead):
        </p>
        <PhoneDockStage>
          <ButtonDock type="double" sticky primaryLabel="Send Invoice" secondaryLabel="Send Later" />
        </PhoneDockStage>
      </div>
    </div>
  );
}

const SUMMARYDOCK_CONTROL_GROUPS: ControlGroup[] = [
  {
    key: "bottom",
    label: "iOS controls",
    options: [
      { value: "none", label: "None — default state" },
      { value: "keyboard", label: "Keyboard — use when the dock sits above a focused text field" },
    ],
  },
];

function SummaryDockOverview() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5 rounded-[10px] border border-[#ececec] bg-[#f4f4f2] px-4 py-3.5">
        <p className="text-[12px] leading-snug" style={{ ...FONT, color: MUTED }}>
          Tap <strong style={{ color: INK }}>View details</strong> below to expand the Subtotal/Discount/Total
          breakdown in place — a self-contained tap interaction, not driven by a prop.
        </p>
      </div>
      <InteractiveDemo
        groups={SUMMARYDOCK_CONTROL_GROUPS}
        defaultValues={{ bottom: "none" }}
        render={(v) => (
          <DockStage>
            <SummaryDock
              currency="USD"
              subtotal={110}
              discount={80}
              total={30}
              primaryLabel="Create Invoice"
              keyboard={v.bottom === "keyboard"}
            />
          </DockStage>
        )}
      />
      <div className="flex flex-col items-start gap-3 rounded-[10px] border border-[#ececec] bg-[#f4f4f2] px-4 py-5">
        <p className="text-[12px]" style={{ ...FONT, color: MUTED }}>
          Pinned to the bottom of the phone frame, in the manual Create Invoice flow:
        </p>
        <PhoneDockStage>
          <SummaryDock currency="USD" subtotal={2200} discount={0} total={2200} primaryLabel="Create Invoice" />
        </PhoneDockStage>
      </div>
    </div>
  );
}

/** 375px phone-bg strip so the frosted-glass buttons/pill read like in the app. */
function HeaderStrip({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div
      className="mobile-mode w-full max-w-[375px] rounded-[12px] py-2"
      style={{ background: dark ? "#525659" : "var(--bg-neutral-tertiary)" }}
    >
      {children}
    </div>
  );
}

const INVOICESTATUS_PRESETS: Record<string, { label: string; color: BadgeColor; caption: string }> = {
  paid: { label: "Paid", color: "success", caption: "12 Jun 2026" },
  awaiting: { label: "Awaiting Payment", color: "warning", caption: "Due 12 Jun 2026" },
  partial: { label: "Partially Paid", color: "warning", caption: "USD 2,400.00 due" },
  refundPending: { label: "Refund Pending", color: "warning", caption: "12 Jun 2026" },
  refunded: { label: "Refunded", color: "success", caption: "12 Jun 2026" },
  overdue: { label: "Overdue", color: "error", caption: "Due 12 Jun 2026" },
  void: { label: "Void", color: "neutral", caption: "12 Jun 2026" },
  draft: { label: "Draft", color: "neutral", caption: "12 Jun 2026" },
};

const INVOICESTATUS_CONTROL_GROUPS: ControlGroup[] = [
  {
    key: "preset",
    label: "Status",
    options: [
      { value: "paid", label: "Paid" },
      { value: "awaiting", label: "Awaiting Payment" },
      { value: "partial", label: "Partially Paid" },
      { value: "refundPending", label: "Refund Pending" },
      { value: "refunded", label: "Refunded" },
      { value: "overdue", label: "Overdue" },
      { value: "void", label: "Void" },
      { value: "draft", label: "Draft" },
    ],
  },
];

function InvoiceStatusOverview() {
  return (
    <InteractiveDemo
      groups={INVOICESTATUS_CONTROL_GROUPS}
      defaultValues={{ preset: "paid" }}
      render={(v) => (
        <div className="w-[280px]">
          <InvoiceStatus {...INVOICESTATUS_PRESETS[v.preset]} />
        </div>
      )}
    />
  );
}

const INVOICE_ROW_STATUSES: Record<string, { status: string; statusColor: BadgeColor; statusCaption: string }> = {
  paid: { status: "Paid", statusColor: "success", statusCaption: "12 Jun 2026" },
  awaiting: { status: "Awaiting payment", statusColor: "info", statusCaption: "due 30 Jun 2026" },
  overdue: { status: "Overdue", statusColor: "error", statusCaption: "since 2 Jun 2026" },
};

const INVOICEROW_CONTROL_GROUPS: ControlGroup[] = [
  {
    key: "status",
    label: "Status",
    options: [
      { value: "paid", label: "Paid" },
      { value: "awaiting", label: "Awaiting payment" },
      { value: "overdue", label: "Overdue" },
    ],
  },
  {
    key: "credited",
    label: "Credited amount",
    options: [
      { value: "none", label: "None" },
      { value: "credited", label: '"Credited amount"' },
      { value: "refund", label: '"Refund amount"' },
      { value: "cn", label: "CN number only (no label) — use when linking to the credit note itself" },
    ],
  },
  {
    key: "invoiceNo",
    label: "Invoice number",
    options: [
      { value: "on", label: "Shown" },
      { value: "off", label: "Hidden" },
    ],
  },
  {
    key: "titleBadge",
    label: "Title badge",
    options: [
      { value: "off", label: "Hidden" },
      { value: "new", label: 'ui/Badge "New" — use when the row is a just-created record (see Sales Invoice List / Credit Note List)' },
    ],
  },
];

function InvoiceRowOverview() {
  return (
    <InteractiveDemo
      groups={INVOICEROW_CONTROL_GROUPS}
      defaultValues={{ status: "paid", credited: "none", invoiceNo: "on", titleBadge: "off" }}
      render={(v) => (
        <div className="w-[320px] rounded-[12px] bg-white px-4">
          <InvoiceRow
            title="Marlow & Finch Studio"
            invoiceNo={v.invoiceNo === "on" ? "INV-2026-000004" : undefined}
            titleBadge={v.titleBadge === "new" ? <Badge label="New" color="custom" variant="bold" size="sm" /> : undefined}
            {...INVOICE_ROW_STATUSES[v.status]}
            amount="USD 6,430.05"
            creditedAmount={v.credited === "none" ? undefined : v.credited === "cn" ? "CN-2026-000006" : "USD 2,000.00"}
            creditedLabel={v.credited === "refund" ? "Refund amount" : v.credited === "cn" ? "" : undefined}
            onCreditedClick={() => {}}
            lastItem
            onClick={() => {}}
          />
        </div>
      )}
    />
  );
}

const AHEAD_LINE = "You're ahead of 71% of similar businesses this month";

const OUTSTANDING_SCENARIOS: Record<string, { collected: string; outstanding: string; percent: number; encouragement?: string; linkLabel?: string; outstandingSuffix?: string }> = {
  "0": { collected: "0.00", outstanding: "20,000.00", percent: 0, outstandingSuffix: "to collect", linkLabel: "2 invoices" },
  "50-none": { collected: "15,000.00", outstanding: "5,000.00", percent: 50, encouragement: AHEAD_LINE, linkLabel: "2 invoices" },
  "50-partial": { collected: "15,000.00", outstanding: "5,000.00", percent: 50, encouragement: AHEAD_LINE, linkLabel: "1 overdue out of 2 invoices" },
  "50-all": { collected: "15,000.00", outstanding: "0.00", percent: 50, encouragement: AHEAD_LINE, linkLabel: "2 overdue" },
  "100": { collected: "20,000.00", outstanding: "0.00", percent: 100, encouragement: AHEAD_LINE },
};

const OUTSTANDINGCARD_CONTROL_GROUPS: ControlGroup[] = [
  {
    key: "scenario",
    label: "Scenario",
    options: [
      { value: "0", label: "0% collected" },
      { value: "50-none", label: "50% · none overdue" },
      { value: "50-partial", label: "50% · partially overdue" },
      { value: "50-all", label: "50% · all overdue" },
      { value: "100", label: "100% collected (green bar)" },
    ],
  },
];

function OutstandingCardOverview() {
  return (
    <InteractiveDemo
      groups={OUTSTANDINGCARD_CONTROL_GROUPS}
      defaultValues={{ scenario: "50-partial" }}
      render={(v) => (
        <div className="w-[320px]">
          <OutstandingCard expected="20,000.00" {...OUTSTANDING_SCENARIOS[v.scenario]} onLinkClick={() => {}} onCollectedClick={() => {}} />
        </div>
      )}
    />
  );
}

const ACTION_REQUIRED_CONTENT: Record<string, { title: string; description?: string }> = {
  short: { title: "Invoice extracted", description: "Uploaded PDF invoice from Terra..." },
  titleOnly: { title: "Invoice extracted" },
  long: {
    title: "Overpayment received on invoice awaiting review",
    description: "INV-2026-000005 · paid USD 250.00 over the invoice total amount due",
  },
};

const ACTIONREQUIRED_CONTROL_GROUPS: ControlGroup[] = [
  {
    key: "content",
    label: "Content",
    options: [
      { value: "titleOnly", label: "Title only" },
      { value: "short", label: "Title + description" },
      { value: "long", label: "Long (truncates)" },
    ],
  },
  {
    key: "actionLabel",
    label: "Action label",
    options: [
      { value: "Proceed", label: "Proceed (default)" },
      { value: "Confirm", label: "Confirm" },
    ],
  },
];

function ActionRequiredOverview() {
  return (
    <InteractiveDemo
      groups={ACTIONREQUIRED_CONTROL_GROUPS}
      defaultValues={{ content: "short", actionLabel: "Proceed" }}
      render={(v) => (
        <div className="w-[320px]">
          <ActionRequired {...ACTION_REQUIRED_CONTENT[v.content]} actionLabel={v.actionLabel} onAction={() => {}} />
        </div>
      )}
    />
  );
}

const NOTIFICATIONITEM_CONTROL_GROUPS: ControlGroup[] = [
  {
    key: "read",
    label: "Read state",
    options: [
      { value: "unread", label: "Unread" },
      { value: "read", label: "Read" },
    ],
  },
  {
    key: "amount",
    label: "Amount",
    options: [
      { value: "on", label: "Shown" },
      { value: "off", label: "Hidden" },
    ],
  },
  {
    key: "action",
    label: "Action button",
    options: [
      { value: "on", label: "Shown" },
      { value: "off", label: "Hidden" },
    ],
  },
];

function NotificationItemOverview() {
  return (
    <InteractiveDemo
      groups={NOTIFICATIONITEM_CONTROL_GROUPS}
      defaultValues={{ read: "unread", amount: "on", action: "on" }}
      render={(v) => (
        <div className="w-[320px] rounded-[10px] bg-white px-4">
          <NotificationItem
            title="Payment received from Stripe Inc."
            text="API payout · Wire transfer · DBS HK"
            time="3 hours ago"
            amount="HKD 6,430.05"
            showAmount={v.amount === "on"}
            actionLabel="Complete setup"
            onAction={() => {}}
            showAction={v.action === "on"}
            read={v.read === "read"}
            lastItem
          />
        </div>
      )}
    />
  );
}

const FILEITEMBASE_CONTROL_GROUPS: ControlGroup[] = [
  {
    key: "state",
    label: "State",
    options: [
      { value: "completed", label: "Completed — 100%, ready" },
      { value: "loading", label: "Loading — mid-upload, progress fill behind the row" },
      { value: "error", label: "Error — upload failed, Try Again link" },
    ],
  },
  {
    key: "action",
    label: "Trailing action (completed/error only — loading always shows delete)",
    options: [
      { value: "delete", label: "Delete — trash icon; use when the row can be removed (cancel/drop an attachment)" },
      { value: "replace", label: "Re-upload — text button; use when the file can be re-scanned/swapped for a new upload" },
      { value: "download", label: "Download — download icon; use when the row is a read-only completed file the user can save (e.g. Send Invoice's Share/Download tab)" },
      { value: "none", label: "None — no trailing control; use for a read-only context with nothing to change (e.g. a past decision/summary screen)" },
    ],
  },
  {
    key: "downloading",
    label: "Download state (download action only)",
    options: [
      { value: "idle", label: "Idle — download icon, tappable" },
      { value: "downloading", label: "Downloading — icon swaps to ui/Loading, row ignores taps" },
    ],
  },
];

function FileItemBaseOverview() {
  return (
    <InteractiveDemo
      groups={FILEITEMBASE_CONTROL_GROUPS}
      defaultValues={{ state: "completed", action: "delete", downloading: "idle" }}
      render={(v) => (
        <div className="w-[320px]">
          <FileItemBase
            name="Tech design requirements.pdf"
            size="200 KB"
            state={v.state as FileItemState}
            action={v.action as FileItemAction}
            downloading={v.downloading === "downloading"}
            progress={40}
            onDelete={() => {}}
            onReplace={() => {}}
            onDownload={() => {}}
            onRetry={() => {}}
          />
        </div>
      )}
    />
  );
}

const LISTROW_CONTROL_GROUPS: ControlGroup[] = [
  {
    key: "content",
    label: "Content",
    options: [
      { value: "simple", label: "Label only" },
      { value: "description", label: "With description" },
      { value: "caption", label: "Description + caption" },
    ],
  },
  {
    key: "trailing",
    label: "Trailing",
    options: [
      { value: "none", label: "None" },
      { value: "chevron", label: "Chevron" },
      { value: "value", label: "Value + chevron" },
      { value: "valueDescription", label: "Value + description" },
      { value: "valueFlag", label: "Value + flag (currency)" },
      { value: "toggle", label: "Toggle" },
      { value: "swipedFull", label: "Swiped — more + delete" },
      { value: "swipedDelete", label: "Swiped — delete only" },
    ],
  },
];

function ListRowTestMe() {
  return (
    <div className="flex flex-col gap-6">
      <InteractiveDemo
        groups={LISTROW_CONTROL_GROUPS}
        defaultValues={{ content: "description", trailing: "value" }}
        canvasBg={() => "var(--bg-neutral-tertiary)"}
        render={(v) => (
          <div className="w-[320px]">
            <ListCard onLayer="gray">
              <ListRow
                label="Label"
                description={v.content !== "simple" ? "This is description text" : undefined}
                caption={v.content === "caption" ? "This is caption text" : undefined}
                trailing={v.trailing === "toggle" ? "toggle" : v.trailing.startsWith("swiped") ? "none" : v.trailing === "none" ? "none" : "chevron"}
                value={v.trailing === "value" ? "Next 30 days" : v.trailing === "valueDescription" ? "Personal Saving" : v.trailing === "valueFlag" ? "USD" : undefined}
                valueDescription={v.trailing === "valueDescription" ? "HK883-168888-168" : undefined}
                valueFlag={v.trailing === "valueFlag" ? <USFlag size={16} /> : undefined}
                checked={v.trailing === "toggle"}
                swiped={v.trailing === "swipedFull" || v.trailing === "swipedDelete"}
                showMoreAction={v.trailing === "swipedFull"}
                onMore={() => {}}
                onDelete={() => {}}
                onClick={v.trailing === "chevron" || v.trailing === "value" || v.trailing === "valueDescription" || v.trailing === "valueFlag" ? () => {} : undefined}
                last
              />
            </ListCard>
          </div>
        )}
      />
      <div>
        <p className="mb-2 text-[13px] font-medium" style={{ ...FONT, color: INK }}>Sub-parts</p>
        <div className="grid grid-cols-4 gap-4">
          <SwatchCell label="Trailing text · plain"><ListText text="Next 30 days" /></SwatchCell>
          <SwatchCell label="Trailing text · with a description"><ListText text="Personal Saving" description="HK883-168888-168" /></SwatchCell>
          <SwatchCell label="Trailing text · currency"><ListText text="USD" flag={<USFlag size={16} />} /></SwatchCell>
          <SwatchCell label="Swipe-to-reveal actions"><SwipeActions /></SwatchCell>
        </div>
      </div>
    </div>
  );
}

const LISTCARD_CONTROL_GROUPS: ControlGroup[] = [
  {
    key: "surface",
    label: "Surface",
    options: [
      { value: "gray", label: "Gray page (borderless)" },
      { value: "neutral", label: "White page (bordered)" },
    ],
  },
];

function ListCardTestMe() {
  return (
    <InteractiveDemo
      groups={LISTCARD_CONTROL_GROUPS}
      defaultValues={{ surface: "gray" }}
      canvasBg={(v) => (v.surface === "gray" ? "var(--bg-neutral-tertiary)" : "#f4f4f2")}
      render={(v) => (
        <div className="w-[320px]">
          <ListCard onLayer={v.surface as "neutral" | "gray"}>
            <ListRow label="Label" description="This is description text" trailing="chevron" value="Next 30 days" onClick={() => {}} />
            <ListRow label="Label" description="This is description text" trailing="chevron" value="Next 30 days" onClick={() => {}} last />
          </ListCard>
        </div>
      )}
    />
  );
}

const PAGEHEADER_CONTROL_GROUPS: ControlGroup[] = [
  {
    key: "type",
    label: "Type",
    options: [
      { value: "left", label: "Left align (bigger title)" },
      { value: "left-on-scroll", label: "Left align on scroll" },
      { value: "center", label: "Center align" },
      { value: "search", label: "Search" },
    ],
  },
  {
    key: "text",
    label: "Text line",
    options: [
      { value: "off", label: "None" },
      { value: "on", label: "Shown" },
    ],
  },
  {
    key: "back",
    label: "Back button",
    options: [
      { value: "on", label: "Shown" },
      { value: "off", label: "Hidden" },
    ],
  },
  {
    key: "searchState",
    label: "Search state (search only)",
    options: [
      { value: "default", label: "Default" },
      { value: "filled", label: "Filled" },
      { value: "error", label: "Error" },
      { value: "disabled", label: "Disabled" },
    ],
  },
  {
    key: "onColor",
    label: "On-color (dark backdrop)",
    options: [
      { value: "off", label: "Off — light page content (default)" },
      { value: "on", label: "On — use when the header sits over a dark/colored backdrop at rest, e.g. a PDF-preview page" },
    ],
  },
];

function PageHeaderTestMe() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex flex-col gap-6">
      <InteractiveDemo
        groups={PAGEHEADER_CONTROL_GROUPS}
        defaultValues={{ type: "left-on-scroll", text: "off", back: "on", searchState: "default", onColor: "off" }}
        render={(v) => (
          <HeaderStrip dark={v.onColor === "on"}>
            <PageHeader
              type={v.type as PageHeaderType}
              title="Title"
              text={v.text === "on" ? "Text" : undefined}
              showBack={v.back === "on"}
              searchPlaceholder="Input text"
              searchValue={v.searchState === "filled" || v.searchState === "error" ? "Input text" : ""}
              error={v.searchState === "error"}
              disabled={v.searchState === "disabled"}
              onColor={v.onColor === "on"}
            />
          </HeaderStrip>
        )}
      />
      <div className="flex flex-col items-start gap-3 rounded-[10px] border border-[#ececec] bg-[#f4f4f2] px-4 py-5">
        <p className="text-[12px]" style={{ ...FONT, color: MUTED }}>
          The "Left" style animates smoothly too — toggle this to see the title slide up next to
          the back button, the same way it would as someone scrolls down the page:
        </p>
        <div className="flex items-center gap-2">
          <Toggle checked={collapsed} onChange={setCollapsed} aria-label="Toggle collapsed" />
          <span className="text-[12px]" style={{ ...FONT, color: INK }}>{collapsed ? "Collapsed" : "Expanded"}</span>
        </div>
        <HeaderStrip>
          <PageHeader type="left" title="Invoices" text="last 5 invoices" collapsed={collapsed} />
        </HeaderStrip>
      </div>
      <div>
        <p className="mb-2 text-[13px] font-medium" style={{ ...FONT, color: INK }}>Custom content examples</p>
        <div className="grid grid-cols-2 gap-4">
          <AutoCell label="Left align, with custom content instead of a title">
            <HeaderStrip>
              <PageHeader type="left">
                <div className="flex items-baseline gap-2">
                  <p className="text-[22px] font-medium tracking-[-1.1px]" style={{ ...FONT, color: INK, lineHeight: 0.9 }}>USD 12,450</p>
                  <p className="text-[14px]" style={{ ...FONT, color: MUTED }}>outstanding</p>
                </div>
              </PageHeader>
            </HeaderStrip>
          </AutoCell>
          <AutoCell label="Custom right action — a settings icon instead of the default">
            <HeaderStrip>
              <PageHeader type="left" title="Title" rightIcon={<SettingsGearIcon />} rightLabel="Settings" />
            </HeaderStrip>
          </AutoCell>
          <AutoCell label="Custom back icon — a close (×) instead of a back arrow">
            <HeaderStrip>
              <PageHeader type="center" title="Title" backIcon={<CloseGlyphIcon />} backLabel="Close" showSearch={false} />
            </HeaderStrip>
          </AutoCell>
          <AutoCell label="Custom right content — a 'Saved' confirmation">
            <HeaderStrip>
              <PageHeader
                type="center"
                title="Title"
                right={
                  <span className="flex items-center gap-1 text-[12px]" style={{ ...FONT, color: MUTED }}>
                    <span style={{ color: "#006a1d" }}>✓</span> Saved
                  </span>
                }
              />
            </HeaderStrip>
          </AutoCell>
          <AutoCell label="A frosted pill on the right that can hold any custom content">
            <HeaderStrip>
              <PageHeader
                type="center"
                title="Title"
                showSearch={false}
                rightSlot={
                  <span className="body-sm flex items-center gap-2" style={{ color: INK }}>
                    <CircleIcon size={20} /> Slot
                  </span>
                }
              />
            </HeaderStrip>
          </AutoCell>
          <AutoCell label="More actions — a secondary icon button plus a solid primary button">
            <HeaderStrip>
              <PageHeader
                type="left-on-scroll"
                title="Title"
                rightIcon={<CircleIcon size={20} />}
                rightLabel="More"
                primaryIcon={<CircleIcon size={20} />}
                primaryLabel="Add"
              />
            </HeaderStrip>
          </AutoCell>
        </div>
      </div>
    </div>
  );
}

const SEARCH_CONTROL_GROUPS: ControlGroup[] = [
  {
    key: "state",
    label: "State",
    options: [
      { value: "default", label: "Default" },
      { value: "focused", label: "Focused (X clears)" },
      { value: "filled", label: "Filled" },
      { value: "error", label: "Error" },
      { value: "disabled", label: "Disabled" },
    ],
  },
  {
    key: "mic",
    label: "Mic action",
    options: [
      { value: "on", label: "Shown" },
      { value: "off", label: "Hidden" },
    ],
  },
];

function SearchTestMe() {
  return (
    <InteractiveDemo
      groups={SEARCH_CONTROL_GROUPS}
      defaultValues={{ state: "default", mic: "on" }}
      render={(v) => (
        <div className="w-[280px]">
          <Search
            placeholder="Search invoices"
            value={v.state === "filled" || v.state === "error" ? "Input text" : ""}
            forceFocus={v.state === "focused"}
            error={v.state === "error"}
            disabled={v.state === "disabled"}
            showAction={v.mic === "on"}
            aria-label="Search demo"
          />
        </div>
      )}
    />
  );
}

const TILE_CONTROL_GROUPS: ControlGroup[] = [
  {
    key: "size",
    label: "Size",
    options: [
      { value: "md", label: "Medium (65px) — default" },
      { value: "sm", label: "Small (54px) — denser lists" },
    ],
  },
  {
    key: "leading",
    label: "Leading visual",
    options: [
      { value: "none", label: "None" },
      { value: "icon", label: "Icon (24px)" },
      { value: "flag", label: "Country flag (30px)" },
      { value: "avatar", label: "Avatar (40px) — Figma doesn't shrink this at size=\"sm\", so it overflows a bit there" },
    ],
  },
  {
    key: "trailing",
    label: "Trailing",
    options: [
      { value: "none", label: "None" },
      { value: "chevron", label: "Chevron" },
      { value: "check", label: "Check (selected)" },
      { value: "download", label: "Custom icon — for any one-off icon a row needs (e.g. an external-link icon, a status icon); a file/download row should use File Item Base instead" },
    ],
  },
  {
    key: "text",
    label: "Second line",
    options: [
      { value: "on", label: "Shown" },
      { value: "off", label: "Hidden" },
    ],
  },
  {
    key: "badge",
    label: "Badge",
    options: [
      { value: "off", label: "Hidden" },
      { value: "on", label: "Shown — e.g. \"Primary\" on a receiving account, \"Sent\" on a credit note" },
    ],
  },
  {
    key: "titleBadge",
    label: "Title badge",
    options: [
      { value: "off", label: "Hidden" },
      { value: "new", label: "ui/Badge \"New\" — use when the row is a just-created record (see Customer List)" },
    ],
  },
  {
    key: "state",
    label: "State",
    options: [
      { value: "default", label: "Default" },
      { value: "disabled", label: "Disabled" },
      { value: "error", label: "Error — a required Tile left empty on submit" },
    ],
  },
  {
    key: "surface",
    label: "Surface",
    options: [
      { value: "neutral", label: "White page" },
      { value: "gray", label: "Gray page" },
    ],
  },
];

function TileTestMe() {
  return (
    <InteractiveDemo
      groups={TILE_CONTROL_GROUPS}
      defaultValues={{ size: "md", leading: "flag", trailing: "chevron", text: "on", badge: "off", titleBadge: "off", state: "default", surface: "neutral" }}
      canvasBg={(v) => (v.surface === "gray" ? "var(--bg-neutral-tertiary)" : "#f4f4f2")}
      render={(v) => (
        <div className="w-[320px]">
          <Tile
            title="Title"
            size={v.size as "md" | "sm"}
            text={v.text === "on" ? "Text" : undefined}
            badgeLabel={v.badge === "on" ? "Primary" : undefined}
            titleBadge={v.titleBadge === "new" ? <Badge label="New" color="custom" variant="bold" size="sm" /> : undefined}
            icon={v.leading === "icon" ? <CircleIcon size={24} /> : undefined}
            flag={v.leading === "flag" ? <USFlag size={30} /> : undefined}
            avatar={v.leading === "avatar" ? "OR" : undefined}
            trailing={v.trailing === "download" ? "none" : (v.trailing as TileTrailing)}
            trailingIcon={v.trailing === "download" ? <Download size={20} strokeWidth={1} /> : undefined}
            selected={v.trailing === "check"}
            disabled={v.state === "disabled"}
            error={v.state === "error"}
            onLayer={v.surface as "neutral" | "gray"}
            // Interactive (onClick given) so the momentary Pressed state (Figma node
            // 4222-8331) is demoable — press and hold on a plain, non-selected tile.
            onClick={() => {}}
          />
        </div>
      )}
    />
  );
}


const AVATAR_SIZES = ["xs", "sm", "md", "lg", "xl", "2xl", "3xl"] as const;

const AVATAR_COLORS: Record<string, { color?: string; textColor?: string }> = {
  beige: {},
  grey: { color: "#efeff0" },
  blue: { color: "#d8e8f2" },
  sand: { color: "#e7dfc9" },
  disabled: { color: "var(--bg-neutral-disabled)", textColor: "var(--text-neutral-inverse-disabled)" },
};

const AVATAR_CONTROL_GROUPS: ControlGroup[] = [
  {
    key: "style",
    label: "Style",
    options: [
      { value: "square", label: "Square (initials)" },
      { value: "photo", label: "Photo (circular)" },
    ],
  },
  {
    key: "size",
    label: "Size",
    options: AVATAR_SIZES.map((s) => ({ value: s, label: s })),
  },
  {
    key: "color",
    label: "Tint (square only)",
    options: [
      { value: "beige", label: "Beige (default)" },
      { value: "grey", label: "Grey" },
      { value: "blue", label: "Blue" },
      { value: "sand", label: "Sand" },
      { value: "disabled", label: "Disabled" },
    ],
  },
];

function AvatarOverview() {
  return (
    <InteractiveDemo
      groups={AVATAR_CONTROL_GROUPS}
      defaultValues={{ style: "square", size: "lg", color: "beige" }}
      render={(v) =>
        v.style === "photo" ? (
          <Avatar size={v.size as AvatarSize} style="photo" src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=128&h=128&fit=crop" alt="" />
        ) : (
          <Avatar size={v.size as AvatarSize} initials="OR" {...AVATAR_COLORS[v.color]} />
        )
      }
    />
  );
}

const TEXT_FIELD_TYPES: { type: TextFieldType; label: string }[] = [
  { type: "text", label: "Text" },
  { type: "left-icon", label: "Left icon" },
  { type: "dropdown", label: "Dropdown" },
  { type: "date-picker", label: "Date picker" },
  { type: "mobile", label: "Mobile number" },
  { type: "currency", label: "Currency" },
  { type: "unit", label: "Unit" },
];

const TEXTFIELD_CONTROL_GROUPS: ControlGroup[] = [
  { key: "type", label: "Type", options: TEXT_FIELD_TYPES.map(({ type, label }) => ({ value: type, label })) },
  {
    key: "state",
    label: "State",
    options: [
      { value: "default", label: "Default" },
      { value: "focused", label: "Focused" },
      { value: "filled", label: "Filled" },
      { value: "error", label: "Error" },
      { value: "disabled", label: "Disabled" },
      { value: "highlight", label: "Highlight" },
    ],
  },
  {
    key: "label",
    label: "Label & caption",
    options: [
      { value: "off", label: "None" },
      { value: "on", label: "Shown (mandatory)" },
    ],
  },
  {
    key: "trailing",
    label: "Trailing icon",
    options: [
      { value: "off", label: "None" },
      { value: "on", label: "Shown (e.g. a unit picker or status badge)" },
    ],
  },
  {
    key: "selectorChevron",
    label: "Selector chevron (mobile/currency/unit only)",
    options: [
      { value: "auto", label: "Auto — shown only when tappable (has a click handler)" },
      { value: "on", label: "On — always show, even read-only" },
      { value: "off", label: "Off — always hide, even when tappable" },
    ],
  },
];

function TextFieldTestMe() {
  return (
    <InteractiveDemo
      groups={TEXTFIELD_CONTROL_GROUPS}
      defaultValues={{ type: "text", state: "default", label: "off", trailing: "off", selectorChevron: "auto" }}
      render={(v) => (
        <div className="w-[280px]">
          <TextField
            type={v.type as TextFieldType}
            placeholder="Input text"
            value={v.state === "filled" || v.state === "error" ? "Input text" : ""}
            forceFocus={v.state === "focused"}
            error={v.state === "error"}
            disabled={v.state === "disabled"}
            highlight={v.state === "highlight"}
            icon={v.type === "left-icon" || v.type === "dropdown" ? <CircleIcon size={20} /> : undefined}
            iconRight={v.trailing === "on" ? <CircleIcon size={20} /> : undefined}
            label={v.label === "on" ? "Input Label" : undefined}
            mandatory={v.label === "on"}
            caption={v.label === "on" ? "Caption" : undefined}
            onSelectorClick={["mobile", "currency", "unit"].includes(v.type) ? () => {} : undefined}
            selectorChevron={v.selectorChevron === "auto" ? undefined : v.selectorChevron === "on"}
            aria-label="Text field demo"
          />
        </div>
      )}
    />
  );
}

const TEXTAREA_CONTROL_GROUPS: ControlGroup[] = [
  {
    key: "state",
    label: "State",
    options: [
      { value: "default", label: "Default" },
      { value: "focused", label: "Focused" },
      { value: "filled", label: "Filled" },
      { value: "error", label: "Error" },
      { value: "disabled", label: "Disabled" },
    ],
  },
  {
    key: "label",
    label: "Label & caption",
    options: [
      { value: "off", label: "None" },
      { value: "on", label: "Shown (mandatory)" },
    ],
  },
];

function TextAreaTestMe() {
  return (
    <InteractiveDemo
      groups={TEXTAREA_CONTROL_GROUPS}
      defaultValues={{ state: "default", label: "off" }}
      render={(v) => (
        <div className="w-[280px]">
          <TextArea
            placeholder="Input text"
            value={v.state === "filled" || v.state === "error" ? "Input text" : ""}
            onChange={() => {}}
            forceFocus={v.state === "focused"}
            error={v.state === "error"}
            disabled={v.state === "disabled"}
            label={v.label === "on" ? "Input Label" : undefined}
            mandatory={v.label === "on"}
            caption={v.label === "on" ? "Caption" : undefined}
            aria-label="Text area demo"
          />
        </div>
      )}
    />
  );
}

const TOGGLE_CONTROL_GROUPS: ControlGroup[] = [
  {
    key: "checked",
    label: "Checked",
    options: [
      { value: "on", label: "On" },
      { value: "off", label: "Off" },
    ],
  },
  {
    key: "disabled",
    label: "State",
    options: [
      { value: "no", label: "Default" },
      { value: "yes", label: "Disabled" },
    ],
  },
];

function ToggleTestMe() {
  return (
    <InteractiveDemo
      groups={TOGGLE_CONTROL_GROUPS}
      defaultValues={{ checked: "on", disabled: "no" }}
      render={(v) => (
        <Toggle checked={v.checked === "on"} onChange={() => {}} disabled={v.disabled === "yes"} aria-label="Toggle demo" />
      )}
    />
  );
}

const NUMBER_STEPPER_CONTROL_GROUPS: ControlGroup[] = [
  {
    key: "disabled",
    label: "State",
    options: [
      { value: "no", label: "Default" },
      { value: "yes", label: "Disabled" },
    ],
  },
];

/** Holds the live counter itself — InteractiveDemo's `render` only carries the control
 *  values, so a genuinely steppable demo needs its own bit of state, same as a real caller. */
function NumberStepperDemo({ disabled }: { disabled: boolean }) {
  const [qty, setQty] = useState(3);
  return <NumberStepper value={qty} onChange={setQty} min={0} max={10} disabled={disabled} label="quantity" />;
}

function NumberStepperTestMe() {
  return (
    <InteractiveDemo
      groups={NUMBER_STEPPER_CONTROL_GROUPS}
      defaultValues={{ disabled: "no" }}
      render={(v) => <NumberStepperDemo disabled={v.disabled === "yes"} />}
    />
  );
}

export function Showcase() {
  const [activeNav, setActiveNav] = useState(NAV[0].id);
  const [activeFoundationNav, setActiveFoundationNav] = useState(FOUNDATION_NAV[0].id);
  const [navOpen, setNavOpen] = useState(true); // whole sidebar shown/collapsed
  const [listOpen, setListOpen] = useState(true); // sidebar section list expanded
  const [activeTab, setActiveTab] = useState<Tab>("Components");
  // Foundation and Components share the same sidebar shell, each with its own nav state
  // (so switching tabs doesn't lose your place in the other one).
  const isFoundation = activeTab === "Foundation";
  const sidebarTitle = isFoundation ? "Foundation" : "Components";
  const sidebarGroups = isFoundation ? FOUNDATION_NAV_GROUPS : NAV_GROUPS;
  const currentNavId = isFoundation ? activeFoundationNav : activeNav;
  // Sidebar selection shows ONE component/page at a time (a filter, not an anchor jump).
  const jumpTo = (id: string) => {
    (isFoundation ? setActiveFoundationNav : setActiveNav)(id);
    window.scrollTo({ top: 0 });
  };
  const showSidebar = (activeTab === "Components" || isFoundation) && navOpen;
  return (
    <div className={`min-h-screen bg-white px-6 pb-10 pt-[104px] ${showSidebar ? "lg:pl-[280px]" : ""}`}>
      {/* Top bar — Statrys logo left, doc-site sections right (Patterns has no content yet). */}
      <header className="fixed inset-x-0 top-0 z-10 flex h-[64px] items-center justify-between bg-black px-6">
        <div className="flex items-center gap-3">
          <svg width="28" height="28" viewBox="0 0 40 40">
            <rect width="40" height="40" rx="11" fill="#FF4A15" />
            <text x="20" y="27" textAnchor="middle" fontSize="22" fontWeight="600" fill="white" fontFamily="GT Walsheim LC, sans-serif">S</text>
          </svg>
          <p className="text-[18px] font-medium text-white" style={FONT}>Statrys</p>
        </div>
        <nav className="flex items-center gap-8">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className="text-[15px] transition-colors"
              style={{
                ...FONT,
                color: activeTab === tab ? "#ffffff" : "#9c9c9c",
                fontWeight: activeTab === tab ? 600 : 400,
                cursor: "pointer",
              }}
            >
              {tab}
            </button>
          ))}
        </nav>
      </header>
      {activeTab === "Patterns" ? (
        <div className="mx-auto mt-20 w-full max-w-[480px] rounded-[16px] border border-[#e5e5e5] bg-white p-8 text-center">
          <p className="text-[18px] font-semibold" style={{ ...FONT, color: INK }}>{activeTab}</p>
          <p className="mt-2 text-[14px]" style={{ ...FONT, color: MUTED }}>
            Nothing here yet — we're building Components first. {activeTab} will get content later.
          </p>
        </div>
      ) : (
        <>
          {/* Quick-nav sidebar (desktop only) — full-height docs-style panel. */}
          {navOpen ? (
            <nav className="fixed bottom-0 left-0 top-[64px] hidden w-[256px] flex-col border-r border-[#e5e5e5] bg-white lg:flex">
              <div className="flex items-center justify-between py-4 pl-5 pr-4">
                <p className="text-[17px] font-medium" style={{ ...FONT, color: INK }}>{sidebarTitle}</p>
                <button
                  type="button"
                  aria-label={listOpen ? "Collapse list" : "Expand list"}
                  onClick={() => setListOpen(!listOpen)}
                  className="flex size-[28px] items-center justify-center"
                  style={{ cursor: "pointer" }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    fill="none"
                    style={{ transform: listOpen ? "none" : "rotate(180deg)", transition: "transform 0.15s" }}
                  >
                    <path d="M3 10l5-5 5 5" stroke={NAV_ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              {listOpen && (
                <div className="flex flex-1 flex-col gap-1 overflow-y-auto pb-4">
                  {sidebarGroups.map((group) => (
                    <div key={group.category} className="mb-2">
                      <p
                        className="px-3 pb-1 pl-4 pt-3 text-[12px] uppercase tracking-wide"
                        style={{ ...FONT, color: MUTED, fontWeight: 600 }}
                      >
                        {group.category}
                      </p>
                      {group.items.map((item) => {
                        const active = currentNavId === item.id;
                        return (
                          <div key={item.id} className="relative w-full px-3">
                            {active && (
                              <span className="absolute bottom-1 left-0 top-1 w-[3px] rounded-r" style={{ background: NAV_ACCENT }} />
                            )}
                            <button
                              type="button"
                              onClick={() => jumpTo(item.id)}
                              className="w-full rounded-[8px] py-[11px] pl-4 text-left text-[15px] transition-colors"
                              style={{
                                ...FONT,
                                color: INK,
                                fontWeight: active ? 600 : 400,
                                background: active ? "#f0f0f0" : "transparent",
                                cursor: "pointer",
                              }}
                            >
                              {item.label}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-auto flex justify-end border-t border-[#e5e5e5] px-4 py-3">
                <button
                  type="button"
                  aria-label="Collapse sidebar"
                  onClick={() => setNavOpen(false)}
                  className="flex size-[32px] items-center justify-center"
                  style={{ cursor: "pointer" }}
                >
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                    <path d="M11 5l-5 5 5 5M16 5l-5 5 5 5" stroke={NAV_ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </nav>
          ) : (
            <button
              type="button"
              aria-label="Open sidebar"
              onClick={() => setNavOpen(true)}
              className="fixed bottom-4 left-4 hidden size-[40px] items-center justify-center rounded-[8px] border border-[#e5e5e5] bg-white lg:flex"
              style={{ cursor: "pointer" }}
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M9 5l5 5-5 5M4 5l5 5-5 5" stroke={NAV_ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          <div className="w-full">
            {isFoundation && activeFoundationNav === "colors" && <ColorsFoundationPage />}
            {isFoundation && activeFoundationNav === "typography" && <TypographyFoundationPage />}
            {isFoundation && activeFoundationNav === "spacing" && <SpacingFoundationPage />}
            {isFoundation && activeFoundationNav === "radius" && <RadiusFoundationPage />}
            {isFoundation && activeFoundationNav === "effects" && <EffectsFoundationPage />}
            {!isFoundation && activeNav === "toast-message" && (
              <ComponentPage
                title="Toast Message"
                description="A confirmation card that appears near the bottom of the screen and hides itself after a few seconds — a dark card with an optional status icon, title, subtitle, and an optional 'View Details' link. Use for one-off action confirmations (e.g. 'Invoice sent'). Every screen already knows how to show one of these; this page is just the visual reference for its variants."
                whenToUse={[
                  "Confirming a one-off action just completed (e.g. \"Invoice sent\", \"Draft deleted\")",
                  "The message doesn't need to stay on screen or be re-read later",
                ]}
                whenNotToUse={[
                  "An ongoing status the user should be able to check back on — use Banner inline on the page instead",
                ]}
                overview={<ToastMessageOverview />}
              />
            )}
            {!isFoundation && activeNav === "banner" && (
              <ComponentPage
                title="Banner"
                description="An inline status message — a softly tinted row with an icon and text, in success/warning/error/info tones. It can be just one line of text, or a bolder title with a smaller detail line underneath. It can also include a 'View Details' link and a dismiss (×) button. Only the icon carries the color — the text itself always stays the normal ink color."
                whenToUse={[
                  "Surfacing a status inline within a page or sheet that should stay visible (e.g. a locked-period warning)",
                  "The user may need to re-read or act on it later, not just glance at it once",
                ]}
                whenNotToUse={[
                  "A one-off action confirmation that can disappear on its own — use Toast Message instead",
                ]}
                overview={<BannerOverview />}
              />
            )}
            {!isFoundation && activeNav === "badge" && (
              <ComponentPage
                title="Badge"
                description="A small status label — subtle, bold, or text-only, in the five status colors plus the brand gradient."
                whenToUse={[
                  "Labeling a status value inline with other text or content (e.g. \"Partially Paid\" next to an amount)",
                  "A quiet, non-interactive marker in one of the five semantic colors is enough",
                ]}
                whenNotToUse={[
                  "An unread/pending count overlaid on a tab or icon's corner — use Noti Badge instead",
                ]}
                overview={<BadgeOverview />}
              />
            )}
            {!isFoundation && activeNav === "noti-badge" && (
              <ComponentPage
                title="Noti Badge"
                description="A small unread-count pill that sits on the corner of another element, like a tab. It can also flip to a white pill with a brand-colored border and text, for use on top of brand-colored backgrounds."
                whenToUse={[
                  "Showing an unread or pending count overlaid on the corner of another element (a tab, an icon)",
                ]}
                whenNotToUse={[
                  "A textual status label sitting inline with content — use Badge instead",
                ]}
                overview={<NotiBadgeOverview />}
              />
            )}
            {!isFoundation && activeNav === "bottom-sheet" && (
              <ComponentPage
                title="Bottom Sheet"
                description="The sliding panel that pops up from the bottom of the screen for a focused task — a grab handle, a title with an optional action button, and space underneath for whatever content or buttons the moment needs."
                whenToUse={[
                  "A focused task or choice that should dim/interrupt the page below it (pickers, forms, confirmations)",
                  "Content that benefits from being dismissed by swipe-down or tap-outside, not just an explicit button",
                ]}
                whenNotToUse={[
                  "A full page-level destination the user should be able to navigate back from — push a real screen instead",
                ]}
                overview={<BottomSheetOverview />}
                patterns={[
                  {
                    title: "Deeper steps stay in the same sheet",
                    body: "When a sheet needs to open something more specific — like a date picker inside a Filters sheet — that next step slides in as part of the same sheet, instead of opening a whole new sheet on top of it.",
                  },
                  {
                    title: "Search takes over the title bar",
                    body: "When a sheet includes a search box, the title turns into the search field right where it is, rather than adding a separate search bar underneath the title.",
                  },
                  {
                    title: "Moving between steps always slides smoothly",
                    body: "Switching from one step to the next inside a sheet is a smooth slide, never an abrupt jump or flash.",
                  },
                  {
                    title: "The sheet only takes the space it needs",
                    body: "A sheet sizes itself to fit its content, and can grow close to full-screen when there's a lot to show — so people don't have to scroll more than necessary. It only locks to one fixed size when it needs to line up exactly with a sheet it's replacing.",
                  },
                  {
                    title: "Room is made for the keyboard",
                    body: "When someone is typing and the on-screen keyboard appears, the sheet grows to use the extra space instead of feeling cramped.",
                  },
                  {
                    title: "Sheets without buttons stay plain at the bottom",
                    body: "There's no fade effect at the bottom of a sheet that doesn't have action buttons — only the sticky area at the top gets that frosted-glass look.",
                  },
                  {
                    title: "Long lists use a more compact row size",
                    body: "Once a list inside a sheet reaches 4 or more items, each row becomes a little smaller so more fits on screen at once.",
                  },
                ]}
              />
            )}
            {!isFoundation && activeNav === "overlay" && (
              <ComponentPage
                title="Overlay"
                description="The dark, semi-see-through backdrop that dims the page behind a sheet or pop-up. One plain tint, nothing to configure — every Bottom Sheet in the app shows it automatically."
                whenToUse={[
                  "Always paired with Bottom Sheet (or any other pop-up) to dim the page behind it — never used on its own",
                ]}
                overview={<OverlayOverview />}
              />
            )}
            {!isFoundation && activeNav === "button" && (
              <ComponentPage
                title="Button"
                description="Buttons are clickable items used to perform a direct action."
                whenToUse={[
                  "A tappable action with a visible text label (e.g. \"Save\", \"Continue\")",
                  "Hierarchy (Primary/Secondary/Tertiary) should match how much visual weight the action needs on its page",
                ]}
                whenNotToUse={[
                  "A prominent, floating shortcut that stays reachable while the page scrolls — use FAB instead",
                ]}
                overview={<ButtonOverview />}
              />
            )}
            {!isFoundation && activeNav === "fab" && (
              <ComponentPage
                title="FAB"
                description="Floating action button — a prominent, elevated shortcut that floats above the page content."
                whenToUse={[
                  "A single, prominent shortcut that should stay reachable while the page scrolls (e.g. Create Invoice)",
                ]}
                whenNotToUse={[
                  "An inline action inside a form, row, or dock — use Button instead",
                ]}
                overview={<FabOverview />}
              />
            )}
            {!isFoundation && activeNav === "tabs-base" && (
              <ComponentPage
                title="Tabs Base"
                description="A single tab in button or underline style — put several in a row to switch between views. It can optionally show an unread-count badge in the corner (button style) or inline (underline style)."
                whenToUse={[
                  "Switching between sibling views of the same content (e.g. Overview / Test me / Variants)",
                  "A tab needs to show an unread-count badge",
                ]}
                whenNotToUse={[
                  "A small, fixed set of mutually-exclusive options all visible at once — use Segmented Controls instead",
                ]}
                overview={<TabsTestMe />}
              />
            )}
            {!isFoundation && activeNav === "segmented-controls" && (
              <ComponentPage
                title="Segmented Controls"
                description="A set of two to four segments dividing different views — the active segment is a white pill with a soft shadow, the rest sit flat on the beige track. A hairline separator appears between two adjacent inactive segments."
                whenToUse={[
                  "A small (2–4) set of mutually exclusive filters or views, where every option should stay visible at once",
                ]}
                whenNotToUse={[
                  "More options than comfortably fit without scrolling — use Tabs Base instead",
                ]}
                overview={<SegmentedControlsTestMe />}
              />
            )}
            {!isFoundation && activeNav === "button-dock" && (
              <ComponentPage
                title="Button Dock"
                description="The row of action buttons pinned to the bottom of the screen — it has a soft frosted-glass look, fading from see-through to white as content scrolls underneath it."
                whenToUse={[
                  "A screen's primary (and optional secondary) action needs to stay reachable at the bottom while the page scrolls",
                ]}
                overview={<ButtonDockOverview />}
              />
            )}
            {!isFoundation && activeNav === "summary-dock" && (
              <ComponentPage
                title="Summary Dock"
                description="A persistent total + 'View details' row beside an inline primary button, pinned to the bottom of the screen — tapping 'View details' expands it in place into a Subtotal/Discount/Total breakdown with its own 'Summary' header and close button."
                whenToUse={[
                  "A form builds up a running total (e.g. Create Invoice's line items) and the primary action should sit right beside that total, not stacked full-width below it",
                ]}
                whenNotToUse={[
                  "The primary action doesn't need a total/breakdown alongside it — use Button Dock instead",
                ]}
                overview={<SummaryDockOverview />}
              />
            )}
            {!isFoundation && activeNav === "outstanding-card" && (
              <ComponentPage
                title="Outstanding Card"
                description="The dark dashboard hero card — expected amount, collected progress with a gradient bar (green at 100%), and the outstanding balance with an invoices link."
                whenToUse={[
                  "The dashboard's hero summary of expected vs. collected amounts — a fixed, single-purpose card, not a general stat tile",
                ]}
                overview={<OutstandingCardOverview />}
              />
            )}
            {!isFoundation && activeNav === "action-required" && (
              <ComponentPage
                title="Action Required"
                description="A single actionable row — a title, optional description, and a 'Proceed' button. Stack several together for the dashboard's Action Required preview."
                whenToUse={[
                  "Surfacing one specific thing the user needs to act on, with a single clear next step (e.g. \"Confirm\", \"Review\")",
                ]}
                overview={<ActionRequiredOverview />}
              />
            )}
            {!isFoundation && activeNav === "list-row" && (
              <ComponentPage
                title="List Row"
                description="A settings-style list row — a label with an optional description and small caption line, plus a trailing value, arrow, or switch. This page also covers its two building blocks: the trailing value/text display, and the swipe-to-reveal actions."
                whenToUse={[
                  "A settings-style row: a label, optional description/caption, and a trailing value, chevron, or toggle",
                ]}
                whenNotToUse={[
                  "A tappable picker row that needs a leading icon, flag, or avatar — use Tile instead",
                ]}
                overview={<ListRowTestMe />}
              />
            )}
            {!isFoundation && activeNav === "list-card" && (
              <ComponentPage
                title="List Card"
                description="The rounded card that groups a set of List Row items together. It adds a thin border when sitting on a white background, and removes it when sitting on the app's gray background, so the card's edge stays visible either way."
                whenToUse={[
                  "Grouping several List Row items into one rounded card that adapts to whatever background it's sitting on",
                ]}
                overview={<ListCardTestMe />}
              />
            )}
            {!isFoundation && activeNav === "notification-item" && (
              <ComponentPage
                title="Notification Item"
                description="A single row in a notification list — an unread dot, title, description, a clock icon with a relative time (like '2h ago'), an optional green amount, and an optional action button. The last row in a list drops its divider line automatically."
                whenToUse={[
                  "A single row in a notification or activity list — unread dot, relative time, optional amount or action button",
                ]}
                overview={<NotificationItemOverview />}
              />
            )}
            {!isFoundation && activeNav === "file-item-base" && (
              <ComponentPage
                title="File Item Base"
                description="A file-attachment row — an icon with a colored file-type tag, name, and size, in one of three states: Completed (just the size), Loading (a progress fill behind the row plus an upload percentage), or Error (red border, 'Upload failed', and a Try Again link). The trailing button can be Delete, Re-upload, Download, or none at all — Loading always shows Delete."
                whenToUse={[
                  "Representing one uploaded or attached file and its current state — uploading, completed, or failed",
                ]}
                overview={<FileItemBaseOverview />}
              />
            )}
            {!isFoundation && activeNav === "page-header" && (
              <ComponentPage
                title="Page Header"
                description="Floating page header with frosted-glass buttons — big left title, compact scrolled state, centered title, or a search pill."
                whenToUse={[
                  "Every screen's top bar — it already handles the floating, frosted, and collapsing-on-scroll behavior, so build new screens on it rather than a custom-made header",
                ]}
                overview={<PageHeaderTestMe />}
              />
            )}
            {!isFoundation && activeNav === "avatar" && (
              <ComponentPage
                title="Avatar"
                description="A leading identity chip — a rounded-square initials avatar (the only style used today) or a circular photo, across seven sizes."
                whenToUse={[
                  "A leading identity chip for a person or company — initials by default, or a photo when one exists",
                ]}
                overview={<AvatarOverview />}
              />
            )}
            {!isFoundation && activeNav === "invoice-status" && (
              <ComponentPage
                title="Invoice Status"
                description="A colored status label + date caption, space-between across the full width — the top row of InvoiceRow."
                whenToUse={[
                  "The status + date row at the top of an Invoice Row — not intended to be used standalone elsewhere",
                ]}
                overview={<InvoiceStatusOverview />}
              />
            )}
            {!isFoundation && activeNav === "invoice-row" && (
              <ComponentPage
                title="Invoice Row"
                description="An invoice list row — a full-width InvoiceStatus row, title + number, amount, and an optional credited-amount strip."
                whenToUse={[
                  "A row in an invoice list — status, title/number, amount, with an optional credited-amount indicator",
                ]}
                overview={<InvoiceRowOverview />}
              />
            )}
            {!isFoundation && activeNav === "loading" && (
              <ComponentPage
                title="Loading"
                description="A spinner with the Statrys mark at its center — the gradient arc rotates around a grey track; smaller sizes drop the logo."
                whenToUse={[
                  "A blocking or inline spinner while content loads — pick a size, smaller ones drop the logo automatically",
                ]}
                overview={<LoadingOverview />}
              />
            )}
            {!isFoundation && activeNav === "search" && (
              <ComponentPage
                title="Search"
                description="A compact search input with a leading search icon and a mic action that swaps to a clear button while focused."
                whenToUse={[
                  "A compact, single-purpose search input (e.g. filtering a list) with a mic action",
                ]}
                whenNotToUse={[
                  "A general-purpose text input — use Text Field instead",
                ]}
                overview={<SearchTestMe />}
              />
            )}
            {!isFoundation && activeNav === "text-field" && (
              <ComponentPage
                title="Text Field"
                description="A single-line input field — plain, with a leading icon, dropdown, date picker, or with a country-code, currency or unit selector."
                whenToUse={[
                  "Any single-line input: plain text, a leading icon, a dropdown/date-picker trigger, or a country-code/currency/unit selector",
                  "The value needs a label, mandatory marker, or helper caption above/below it",
                ]}
                whenNotToUse={[
                  "Free text that needs more than one line — use Text Area instead",
                  "A dedicated search box — use Search instead",
                ]}
                overview={<TextFieldTestMe />}
              />
            )}
            {!isFoundation && activeNav === "text-area" && (
              <ComponentPage
                title="Text Area"
                description="A multi-line input field for longer free text (e.g. an email body) — same styling as Text Field, just taller, and its height can be set to fit the content."
                whenToUse={[
                  "Longer free text that needs more than one line (e.g. an email body, a note) — its height can be set to fit",
                ]}
                whenNotToUse={[
                  "A single-line value — use Text Field instead",
                ]}
                overview={<TextAreaTestMe />}
              />
            )}
            {!isFoundation && activeNav === "tile" && (
              <ComponentPage
                title="Tile"
                description="A tappable list row — plain, with an icon, country flag or initials avatar, plus chevron/check trailing states for pickers. Press and hold a plain (non-selected) tile to see the momentary Pressed surface."
                whenToUse={[
                  "A tappable row in a picker or list where each row needs a leading icon, country flag, or initials avatar (e.g. a currency or customer picker)",
                ]}
                whenNotToUse={[
                  "A settings-style row with no leading visual — use List Row instead",
                ]}
                overview={<TileTestMe />}
              />
            )}
            {!isFoundation && activeNav === "chips" && (
              <ComponentPage
                title="Chips"
                description="Two types: a single-line filter toggle (transparent background, only the border switches from neutral to black when active), and a removable value pill (white background + a trailing dismiss 'x', with a momentary Pressed surface while held)."
                whenToUse={[
                  "type=\"filter\" — a single-line filter toggle where only the border needs to communicate active/inactive, not a filled background",
                  "type=\"input\" — a removable value the user added themselves (e.g. an email recipient) that needs its own dismiss control, distinct from a Badge (which is never removable) or a Tile row (which is a full list row, not an inline pill)",
                ]}
                overview={<ChipsOverview />}
              />
            )}
            {!isFoundation && activeNav === "checkbox-base" && (
              <ComponentPage
                title="Checkbox Base"
                description="The checkbox shape on its own — unchecked, checked, or a partial (indeterminate) state, in two sizes, with a disabled look too. The tappable area is always a little bigger than the visible square, so it's easy to hit. On its own it can be tapped directly; inside a labeled row (see Checkbox) it's just for display, and the row itself handles the tap."
                whenToUse={[
                  "Building your own custom row where you only need the checkbox shape itself, not a full labeled row",
                ]}
                whenNotToUse={[
                  "A standard labeled checkbox row — use Checkbox instead, it already wraps this",
                ]}
                overview={<CheckboxBaseOverview />}
              />
            )}
            {!isFoundation && activeNav === "checkbox" && (
              <ComponentPage
                title="Checkbox"
                description="A labeled checkbox row — a title with an optional description, where the whole row can be tapped (not just the checkbox itself) to turn it on or off."
                whenToUse={[
                  "A labeled option someone can turn on/off, where the whole row (not just the checkbox) should respond to a tap",
                ]}
                overview={<CheckboxOverview />}
              />
            )}
            {!isFoundation && activeNav === "tooltip" && (
              <ComponentPage
                title="Tooltip"
                description="Tooltips describe or identify an element — a short label, optionally with supporting text, with the arrow on any side."
                whenToUse={[
                  "A short label or hint that only needs to appear on hover/press, identifying an element without a permanent visible label",
                ]}
                overview={<TooltipOverview />}
              />
            )}
            {!isFoundation && activeNav === "x-close" && (
              <ComponentPage
                title="X Close"
                description="A square dismiss (×) button with a brief highlight on hover — a smaller size for compact spots like Toast Message, and a larger one as a standalone close button on a sheet or dialog. It also has a light-colored version for use on dark backgrounds."
                whenToUse={[
                  "Dismissing a Toast, sheet, or dialog — the small size for a compact spot, the larger size as a standalone dismiss button",
                  "The background underneath is dark — use the light-colored version instead",
                ]}
                overview={<XCloseOverview />}
              />
            )}
            {!isFoundation && activeNav === "toggle" && (
              <ComponentPage
                title="Toggle"
                description="A switch to change between two states, on and off — used as an alternative to the checkbox."
                whenToUse={[
                  "An on/off setting that takes effect immediately, with no separate save step (e.g. a settings switch)",
                ]}
                whenNotToUse={[
                  "A choice that needs an inline label describing what's being selected — use Checkbox instead",
                ]}
                overview={<ToggleTestMe />}
              />
            )}
            {!isFoundation && activeNav === "number-stepper" && (
              <ComponentPage
                title="Number Stepper"
                description="A bordered −/+ control for adjusting a small integer in place — tap to increment or decrement without opening a keyboard. Not a Figma DS component yet (no matching frame); built to TextField's own field tokens so it reads as part of the same family."
                whenToUse={[
                  "A small bounded count the user adjusts a few units at a time — e.g. a credited/refunded line's quantity",
                ]}
                whenNotToUse={[
                  "A number typed directly or with no small fixed bound — use TextField with inputMode=\"numeric\" instead",
                ]}
                overview={<NumberStepperTestMe />}
              />
            )}
            <p className="mt-8 text-[12px]" style={{ ...FONT, color: MUTED }}>
              Button and FAB are showcase-only for now — say the word and they roll out to the app screens.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default Showcase;
