import { useState } from "react";
import { FONT, INK, MUTED } from "../lib/theme";
import { Toggle } from "./Toggle";
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
import StatusBar from "../components/StatusBar";
import { Tile, type TileTrailing } from "./Tile";
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
      { id: "tile", label: "Tile" },
      { id: "chips", label: "Chips" },
      { id: "checkbox-base", label: "Checkbox Base" },
      { id: "checkbox", label: "Checkbox" },
    ],
  },
  {
    category: "Feedback & Status",
    items: [
      { id: "badge", label: "Badge" },
      { id: "noti-badge", label: "Noti Badge" },
      { id: "loading", label: "Loading" },
      { id: "tooltip", label: "Tooltip" },
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
   *  to the beige page color for onLayer="beige". Defaults to the standard light gray. */
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
function ComponentPage({
  title,
  description,
  overview,
  variants,
}: {
  title: string;
  description: string;
  /** The interactive demo panel — the page's hero, like the reference docs site. */
  overview: React.ReactNode;
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
      <Section id="overview" title="Overview">{overview}</Section>
      {variants && <Section id="variants" title="Variants">{variants}</Section>}
    </div>
  );
}

const HIERARCHIES = ["primary", "secondary", "tertiary"] as const;

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
    key: "active",
    label: "State",
    options: [
      { value: "off", label: "Default" },
      { value: "on", label: "Active" },
    ],
  },
];

function ChipsOverview() {
  const [selected, setSelected] = useState("newest");
  return (
    <div className="flex flex-col gap-6">
      <InteractiveDemo
        groups={CHIPS_CONTROL_GROUPS}
        defaultValues={{ active: "off" }}
        render={(v) => <Chips label="Label" active={v.active === "on"} />}
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
      defaultValues={{ hierarchy: "primary", size: "md", shape: "rec", icon: "none", state: "default", surface: "light" }}
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
          <p className="mb-2 text-[12px]" style={{ ...FONT, color: MUTED }}>HorizontalTabs · button style</p>
          <HorizontalTabs tabs={labels} activeIndex={buttonTab} onChange={setButtonTab} />
        </div>
        <div>
          <p className="mb-2 text-[12px]" style={{ ...FONT, color: MUTED }}>HorizontalTabs · underline style</p>
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
        <p className="text-[12px]" style={{ ...FONT, color: MUTED }}>Sub-part — SegmentedControlBase, standalone:</p>
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
      className="mobile-mode relative flex flex-col overflow-hidden rounded-[48px] bg-[#f9f5ea] shadow-2xl"
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
    <div className="mobile-mode relative w-full max-w-[375px] overflow-hidden rounded-[12px] bg-[#f9f5ea]">
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
        Full-bleed scrim behind a modal or bottom sheet — dims the page, no recede/scale:
      </p>
      <div
        className="mobile-mode relative flex flex-col overflow-hidden rounded-[48px] bg-[#f9f5ea] shadow-2xl"
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
      className="mobile-mode relative flex flex-col overflow-hidden rounded-[48px] bg-[#f9f5ea] shadow-2xl"
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
    <div className="mobile-mode relative w-full max-w-[375px] overflow-hidden rounded-[12px] bg-[#f9f5ea]">
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
          <strong style={{ color: INK }}>Horizontal</strong> — exactly 2 equal actions side by side (Ghost
          only). Use for a neutral pair with no "safer" option, e.g. Close/Confirm.
        </p>
      </div>
      <InteractiveDemo
        groups={BUTTONDOCK_CONTROL_GROUPS}
        defaultValues={{ type: "double", stack: "vertical", accessory: "off", slot: "off", bottom: "none" }}
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
                primaryLabel="Confirm"
                secondaryLabel={v.type === "ghost" ? "Close" : "Cancel"}
                tertiaryLabel="Close"
                keyboard={v.bottom === "keyboard"}
              />
            </DockStage>
          );
        }}
      />
      <div className="flex flex-col items-start gap-3 rounded-[10px] border border-[#ececec] bg-[#f4f4f2] px-4 py-5">
        <p className="text-[12px]" style={{ ...FONT, color: MUTED }}>
          The frosted dock floating over page content via the sticky prop — the gradient fades in and content blurs underneath (page docks pass sticky; sheet footers stay in-flow):
        </p>
        <PhoneDockStage>
          <ButtonDock type="double" sticky primaryLabel="Send Invoice" secondaryLabel="Send Later" />
        </PhoneDockStage>
      </div>
    </div>
  );
}

/** 375px phone-bg strip so the frosted-glass buttons/pill read like in the app. */
function HeaderStrip({ children }: { children: React.ReactNode }) {
  return <div className="mobile-mode w-full max-w-[375px] rounded-[12px] bg-[#f9f5ea] py-2">{children}</div>;
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
    key: "recurring",
    label: "Recurring chip",
    options: [
      { value: "off", label: "Hidden" },
      { value: "on", label: "Shown" },
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
];

function InvoiceRowOverview() {
  return (
    <InteractiveDemo
      groups={INVOICEROW_CONTROL_GROUPS}
      defaultValues={{ status: "paid", recurring: "off", credited: "none", invoiceNo: "on" }}
      render={(v) => (
        <div className="w-[320px] rounded-[12px] bg-white px-4">
          <InvoiceRow
            title="Marlow & Finch Studio"
            invoiceNo={v.invoiceNo === "on" ? "INV-2026-000004" : undefined}
            recurring={v.recurring === "on"}
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
        canvasBg={() => "#f9f5ea"}
        render={(v) => (
          <div className="w-[320px]">
            <ListCard onLayer="beige">
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
          <SwatchCell label="ListText · plain"><ListText text="Next 30 days" /></SwatchCell>
          <SwatchCell label="ListText · +description"><ListText text="Personal Saving" description="HK883-168888-168" /></SwatchCell>
          <SwatchCell label="ListText · currency"><ListText text="USD" flag={<USFlag size={16} />} /></SwatchCell>
          <SwatchCell label="SwipeActions"><SwipeActions /></SwatchCell>
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
      { value: "beige", label: "Beige page (borderless)" },
      { value: "neutral", label: "White page (bordered)" },
    ],
  },
];

function ListCardTestMe() {
  return (
    <InteractiveDemo
      groups={LISTCARD_CONTROL_GROUPS}
      defaultValues={{ surface: "beige" }}
      canvasBg={(v) => (v.surface === "beige" ? "#f9f5ea" : "#f4f4f2")}
      render={(v) => (
        <div className="w-[320px]">
          <ListCard onLayer={v.surface as "neutral" | "beige"}>
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
      { value: "left", label: "Left align (22px title)" },
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
];

function PageHeaderTestMe() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex flex-col gap-6">
      <InteractiveDemo
        groups={PAGEHEADER_CONTROL_GROUPS}
        defaultValues={{ type: "left-on-scroll", text: "off", back: "on", searchState: "default" }}
        render={(v) => (
          <HeaderStrip>
            <PageHeader
              type={v.type as PageHeaderType}
              title="Title"
              text={v.text === "on" ? "Text" : undefined}
              showBack={v.back === "on"}
              searchPlaceholder="Input text"
              searchValue={v.searchState === "filled" || v.searchState === "error" ? "Input text" : ""}
              error={v.searchState === "error"}
              disabled={v.searchState === "disabled"}
            />
          </HeaderStrip>
        )}
      />
      <div className="flex flex-col items-start gap-3 rounded-[10px] border border-[#ececec] bg-[#f4f4f2] px-4 py-5">
        <p className="text-[12px]" style={{ ...FONT, color: MUTED }}>
          "Left" also animates smoothly in place via the <code>collapsed</code> prop — toggle it
          to see the title slide up next to the back button (drive this from a scroll listener,
          same pattern as FAB's <code>collapsed</code>):
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
        <p className="mb-2 text-[13px] font-medium" style={{ ...FONT, color: INK }}>Code-slot patterns (custom ReactNode content, not plain props)</p>
        <div className="grid grid-cols-2 gap-4">
          <AutoCell label="Left align, custom slot">
            <HeaderStrip>
              <PageHeader type="left">
                <div className="flex items-baseline gap-2">
                  <p className="text-[22px] font-medium tracking-[-1.1px]" style={{ ...FONT, color: INK, lineHeight: 0.9 }}>USD 12,450</p>
                  <p className="text-[14px]" style={{ ...FONT, color: MUTED }}>outstanding</p>
                </div>
              </PageHeader>
            </HeaderStrip>
          </AutoCell>
          <AutoCell label="Custom right action (code slot — settings gear)">
            <HeaderStrip>
              <PageHeader type="left" title="Title" rightIcon={<SettingsGearIcon />} rightLabel="Settings" />
            </HeaderStrip>
          </AutoCell>
          <AutoCell label="Custom back icon (code slot — close instead of back)">
            <HeaderStrip>
              <PageHeader type="center" title="Title" backIcon={<CloseGlyphIcon />} backLabel="Close" showSearch={false} />
            </HeaderStrip>
          </AutoCell>
          <AutoCell label="Custom right content (code slot — autosave chip)">
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
          <AutoCell label="Right slot (Figma MenuPageHeader 'Slot' — frosted pill wraps custom content)">
            <HeaderStrip>
              <PageHeader
                type="center"
                title="Title"
                showSearch={false}
                rightSlot={
                  <span className="flex items-center gap-2 text-[16px]" style={{ ...FONT, color: INK }}>
                    <CircleIcon size={20} /> Slot
                  </span>
                }
              />
            </HeaderStrip>
          </AutoCell>
          <AutoCell label="More actions (Figma MenuPageHeader 'More actions' — glass button + solid primary button)">
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
      { value: "beige", label: "Beige page" },
    ],
  },
];

function TileTestMe() {
  return (
    <InteractiveDemo
      groups={TILE_CONTROL_GROUPS}
      defaultValues={{ size: "md", leading: "flag", trailing: "chevron", text: "on", badge: "off", state: "default", surface: "neutral" }}
      canvasBg={(v) => (v.surface === "beige" ? "#f9f5ea" : "#f4f4f2")}
      render={(v) => (
        <div className="w-[320px]">
          <Tile
            title="Title"
            size={v.size as "md" | "sm"}
            text={v.text === "on" ? "Text" : undefined}
            badgeLabel={v.badge === "on" ? "Primary" : undefined}
            icon={v.leading === "icon" ? <CircleIcon size={24} /> : undefined}
            flag={v.leading === "flag" ? <USFlag size={30} /> : undefined}
            avatar={v.leading === "avatar" ? "OR" : undefined}
            trailing={v.trailing as TileTrailing}
            selected={v.trailing === "check"}
            disabled={v.state === "disabled"}
            error={v.state === "error"}
            onLayer={v.surface as "neutral" | "beige"}
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
];

function TextFieldTestMe() {
  return (
    <InteractiveDemo
      groups={TEXTFIELD_CONTROL_GROUPS}
      defaultValues={{ type: "text", state: "default", label: "off", trailing: "off" }}
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
            icon={v.type === "left-icon" ? <CircleIcon size={20} /> : undefined}
            iconRight={v.trailing === "on" ? <CircleIcon size={20} /> : undefined}
            label={v.label === "on" ? "Input Label" : undefined}
            mandatory={v.label === "on"}
            caption={v.label === "on" ? "Caption" : undefined}
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

export function Showcase() {
  const [activeNav, setActiveNav] = useState(NAV[0].id);
  const [navOpen, setNavOpen] = useState(true); // whole sidebar shown/collapsed
  const [listOpen, setListOpen] = useState(true); // "Components" section expanded
  const [activeTab, setActiveTab] = useState<Tab>("Components");
  // Sidebar selection shows ONE component at a time (a filter, not an anchor jump).
  const jumpTo = (id: string) => {
    setActiveNav(id);
    window.scrollTo({ top: 0 });
  };
  const showSidebar = activeTab === "Components" && navOpen;
  return (
    <div className={`min-h-screen bg-white px-6 pb-10 pt-[104px] ${showSidebar ? "lg:pl-[280px]" : ""}`}>
      {/* Top bar — Statrys logo left, doc-site sections right (only Components has content). */}
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
      {activeTab !== "Components" ? (
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
                <p className="text-[17px] font-medium" style={{ ...FONT, color: INK }}>Components</p>
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
                  {NAV_GROUPS.map((group) => (
                    <div key={group.category} className="mb-2">
                      <p
                        className="px-3 pb-1 pl-4 pt-3 text-[12px] uppercase tracking-wide"
                        style={{ ...FONT, color: MUTED, fontWeight: 600 }}
                      >
                        {group.category}
                      </p>
                      {group.items.map((item) => {
                        const active = activeNav === item.id;
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
            {activeNav === "badge" && (
              <ComponentPage
                title="Badge"
                description="A small status label — subtle, bold, or text-only, in the five status colors plus the brand gradient."
                overview={<BadgeOverview />}
              />
            )}
            {activeNav === "noti-badge" && (
              <ComponentPage
                title="Noti Badge"
                description="A small unread-count pill that overlays the corner of another element (e.g. Tabs Base). `inverse` flips it to a white pill with a brand border/text for use on brand-colored surfaces."
                overview={<NotiBadgeOverview />}
              />
            )}
            {activeNav === "bottom-sheet" && (
              <ComponentPage
                title="Bottom Sheet"
                description="The modal sheet container — grabber, sticky 18px-title header with an optional frosted action button, content slot and 32px bottom pad."
                overview={<BottomSheetOverview />}
              />
            )}
            {activeNav === "overlay" && (
              <ComponentPage
                title="Overlay"
                description="The full-bleed scrim behind a modal or bottom sheet — a single flat color/opacity, no variants. Used by every BottomSheet in the app."
                overview={<OverlayOverview />}
              />
            )}
            {activeNav === "button" && (
              <ComponentPage
                title="Button"
                description="Buttons are clickable items used to perform a direct action."
                overview={<ButtonOverview />}
              />
            )}
            {activeNav === "fab" && (
              <ComponentPage
                title="FAB"
                description="Floating action button — a prominent, elevated shortcut that floats above the page content."
                overview={<FabOverview />}
              />
            )}
            {activeNav === "tabs-base" && (
              <ComponentPage
                title="Tabs Base"
                description="A single tab item in button or underline style — compose several into a row to switch between views. Optionally shows an unread NotiBadge in the corner (button style) or inline (underline style)."
                overview={<TabsTestMe />}
              />
            )}
            {activeNav === "segmented-controls" && (
              <ComponentPage
                title="Segmented Controls"
                description="A set of two to four segments dividing different views — the active segment is a white pill with a soft shadow, the rest sit flat on the beige track. A hairline separator appears between two adjacent inactive segments."
                overview={<SegmentedControlsTestMe />}
              />
            )}
            {activeNav === "button-dock" && (
              <ComponentPage
                title="Button Dock"
                description="The bottom action dock — frosted, floating over a transparent-to-white gradient with backdrop blur."
                overview={<ButtonDockOverview />}
              />
            )}
            {activeNav === "outstanding-card" && (
              <ComponentPage
                title="Outstanding Card"
                description="The dark dashboard hero card — expected amount, collected progress with a gradient bar (green at 100%), and the outstanding balance with an invoices link."
                overview={<OutstandingCardOverview />}
              />
            )}
            {activeNav === "action-required" && (
              <ComponentPage
                title="Action Required"
                description="A single actionable row — title, optional description, and a secondary 'Proceed' button. Stack it (see components/NeedAttentionStack) for the dashboard's Action Required preview."
                overview={<ActionRequiredOverview />}
              />
            )}
            {activeNav === "list-row" && (
              <ComponentPage
                title="List Row"
                description="A settings-style list row — label with an optional description, an optional caption line, and a trailing value (via ui/ListText)/chevron/toggle. Also covers ui/ListText and ui/SwipeActions, its sub-parts."
                overview={<ListRowTestMe />}
              />
            )}
            {activeNav === "list-card" && (
              <ComponentPage
                title="List Card"
                description="The rounded card that groups ui/ListRow children — onLayer=neutral adds a hairline border for a white page background, onLayer=beige drops it."
                overview={<ListCardTestMe />}
              />
            )}
            {activeNav === "notification-item" && (
              <ComponentPage
                title="Notification Item"
                description="A single row in a notification list — unread dot, title, description, a clock + relative time, an optional success-green amount, and an optional CTA button. `lastItem` drops the divider."
                overview={<NotificationItemOverview />}
              />
            )}
            {activeNav === "page-header" && (
              <ComponentPage
                title="Page Header"
                description="Floating page header with frosted-glass buttons — big left title, compact scrolled state, centered title, or a search pill."
                overview={<PageHeaderTestMe />}
              />
            )}
            {activeNav === "avatar" && (
              <ComponentPage
                title="Avatar"
                description="A leading identity chip — a rounded-square initials avatar (the only style used today) or a circular photo, across seven sizes."
                overview={<AvatarOverview />}
              />
            )}
            {activeNav === "invoice-status" && (
              <ComponentPage
                title="Invoice Status"
                description="A colored status label + date caption, space-between across the full width — the top row of InvoiceRow."
                overview={<InvoiceStatusOverview />}
              />
            )}
            {activeNav === "invoice-row" && (
              <ComponentPage
                title="Invoice Row"
                description="An invoice list row — a full-width InvoiceStatus row, title + number, amount with an optional Recurring chip, and an optional credited-amount strip."
                overview={<InvoiceRowOverview />}
              />
            )}
            {activeNav === "loading" && (
              <ComponentPage
                title="Loading"
                description="A spinner with the Statrys mark at its center — the gradient arc rotates around a grey track; smaller sizes drop the logo."
                overview={<LoadingOverview />}
              />
            )}
            {activeNav === "search" && (
              <ComponentPage
                title="Search"
                description="A compact search input with a leading search icon and a mic action that swaps to a clear button while focused."
                overview={<SearchTestMe />}
              />
            )}
            {activeNav === "text-field" && (
              <ComponentPage
                title="Text Field"
                description="A single-line input field — plain, with a leading icon, dropdown, date picker, or with a country-code, currency or unit selector."
                overview={<TextFieldTestMe />}
              />
            )}
            {activeNav === "text-area" && (
              <ComponentPage
                title="Text Area"
                description="A multi-line input field for longer free text (e.g. an email body) — same field styling as Text Field, height set by the caller via `rows`."
                overview={<TextAreaTestMe />}
              />
            )}
            {activeNav === "tile" && (
              <ComponentPage
                title="Tile"
                description="A tappable list row — plain, with an icon, country flag or initials avatar, plus chevron/check trailing states for pickers. Press and hold a plain (non-selected) tile to see the momentary Pressed surface."
                overview={<TileTestMe />}
              />
            )}
            {activeNav === "chips" && (
              <ComponentPage
                title="Chips"
                description="A single-line filter toggle — transparent background, black label in both states; only the border switches from neutral to black when active."
                overview={<ChipsOverview />}
              />
            )}
            {activeNav === "checkbox-base" && (
              <ComponentPage
                title="Checkbox Base"
                description="The bare checkbox glyph — unchecked, checked, or indeterminate, in sm/md, each with a disabled state. The hit target is always larger than the visible square. Standalone it's a real role=checkbox button; compose it non-interactively inside a labeled row (see Checkbox)."
                overview={<CheckboxBaseOverview />}
              />
            )}
            {activeNav === "checkbox" && (
              <ComponentPage
                title="Checkbox"
                description="A labeled checkbox row — title + optional description, the whole row clickable and keyboard-toggleable, not just the glyph."
                overview={<CheckboxOverview />}
              />
            )}
            {activeNav === "tooltip" && (
              <ComponentPage
                title="Tooltip"
                description="Tooltips describe or identify an element — a short label, optionally with supporting text, with the arrow on any side."
                overview={<TooltipOverview />}
              />
            )}
            {activeNav === "toggle" && (
              <ComponentPage
                title="Toggle"
                description="A switch to change between two states, on and off — used as an alternative to the checkbox."
                overview={<ToggleTestMe />}
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
