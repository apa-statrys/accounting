import { useState } from "react";
import { FONT, INK, MUTED } from "../lib/theme";
import { Toggle } from "./Toggle";
import { Button } from "./Button";
import { FAB } from "./FAB";
import { TabsBase } from "./TabsBase";
import { HorizontalTabs } from "./HorizontalTabs";
import { Badge } from "./Badge";
import { Tooltip, TooltipArrow } from "./Tooltip";
import { TextField, TextFieldType } from "./TextField";
import { Search } from "./Search";
import { Loading, LoadingSize } from "./Loading";
import { PageHeader } from "./PageHeader";
import { ButtonDock } from "../components/ButtonDock";
import { Tile } from "./Tile";
import { USFlag } from "./TextField/USFlag";
import { BottomSheet } from "./BottomSheet";
import { OutstandingCard } from "./OutstandingCard";
import { InvoiceRow } from "./InvoiceRow";

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
function CircleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/** Stand-in gear for the PageHeader custom-right-action demo (app uses lucide Settings). */
function SettingsGearIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/** Sidebar entries — add every new component here (id must match its ComponentPage branch). */
const NAV = [
  { id: "badge", label: "Badge" },
  { id: "bottom-sheet", label: "Bottom Sheet" },
  { id: "button", label: "Button" },
  { id: "button-dock", label: "Button Dock" },
  { id: "fab", label: "FAB" },
  { id: "invoice-row", label: "Invoice Row" },
  { id: "loading", label: "Loading" },
  { id: "outstanding-card", label: "Outstanding Card" },
  { id: "page-header", label: "Page Header" },
  { id: "search", label: "Search" },
  { id: "tabs-base", label: "Tabs Base" },
  { id: "text-field", label: "Text Field" },
  { id: "tile", label: "Tile" },
  { id: "toggle", label: "Toggle" },
  { id: "tooltip", label: "Tooltip" },
];

/** Sidebar/topbar chrome accents (match the reference docs-site style; not DS tokens). */
const NAV_ACCENT = "#2c46d4";
const SECTION_GREEN = "#0e8345";
const SECTION_GREEN_BG = "#e3f2e9";

const TABS = ["Foundation", "Components", "Patterns"] as const;
type Tab = (typeof TABS)[number];

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "variants", label: "Variants" },
];

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

/** Interactive preview panel with a light/dark segmented switch (dark shows Inverse variants). */
function TryPanel({ render }: { render: (dark: boolean) => React.ReactNode }) {
  const [dark, setDark] = useState(false);
  return (
    <div
      className="relative rounded-[10px] border px-4 pb-8 pt-16"
      style={{ background: dark ? "#222222" : "#f4f4f2", borderColor: dark ? "#3a3a3a" : "#ececec" }}
    >
      <div
        className="absolute right-3 top-3 flex gap-[2px] rounded-[8px] p-[2px]"
        style={{ background: dark ? "#2f2f2f" : "#ececec" }}
      >
        <button
          type="button"
          aria-label="Light preview"
          onClick={() => setDark(false)}
          className="flex size-[28px] items-center justify-center rounded-[6px]"
          style={{ background: dark ? "transparent" : "#ffffff", color: dark ? "#9c9c9c" : INK, cursor: "pointer" }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="8" cy="8" r="3" />
            <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M12.6 3.4l-1 1M4.4 11.6l-1 1" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Dark preview"
          onClick={() => setDark(true)}
          className="flex size-[28px] items-center justify-center rounded-[6px]"
          style={{ background: dark ? "#454545" : "transparent", color: dark ? "#ffffff" : MUTED, cursor: "pointer" }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16">
            <path d="M13.5 9.8A6 6 0 0 1 6.2 2.5a6 6 0 1 0 7.3 7.3z" fill="currentColor" />
          </svg>
        </button>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4">{render(dark)}</div>
      <p className="mt-5 text-center text-[13px]" style={{ ...FONT, color: dark ? "#8a8a8a" : MUTED }}>
        Press and hold to see the Active state
      </p>
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
  variants: React.ReactNode;
}) {
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const jump = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <div className="flex items-start gap-8">
      <div className="min-w-0 flex-1 rounded-[16px] border border-[#e5e5e5] bg-white p-8">
        <span
          className="inline-block rounded-full px-3 py-1 text-[12px] font-medium"
          style={{ ...FONT, color: SECTION_GREEN, background: SECTION_GREEN_BG }}
        >
          Ready
        </span>
        <h1 className="mt-3 text-[32px] font-semibold" style={{ ...FONT, color: INK }}>{title}</h1>
        <p className="mt-2 text-[16px] leading-snug" style={{ ...FONT, color: MUTED }}>{description}</p>
        <Section id="overview" title="Overview">{overview}</Section>
        <Section id="variants" title="Variants">{variants}</Section>
      </div>
      {/* On-this-page nav, like the reference docs site (wide screens only). */}
      <nav className="sticky top-[88px] hidden w-[150px] shrink-0 flex-col gap-1 xl:flex">
        {SECTIONS.map((s) => {
          const active = activeSection === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => jump(s.id)}
              className="rounded-full px-3 py-1.5 text-left text-[14px]"
              style={{
                ...FONT,
                color: active ? SECTION_GREEN : INK,
                background: active ? SECTION_GREEN_BG : "transparent",
                fontWeight: active ? 600 : 400,
                cursor: "pointer",
              }}
            >
              {s.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

const HIERARCHIES = ["primary", "secondary", "tertiary"] as const;
const BADGE_COLORS = ["neutral", "success", "warning", "error", "info"] as const;

function BadgeOverview() {
  return (
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
  );
}

function BadgeVariants() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-[13px] font-medium" style={{ ...FONT, color: INK }}>Subtle (white pill, colored text)</p>
        <div className="grid grid-cols-5 gap-4">
          {BADGE_COLORS.map((c) => (
            <SwatchCell key={c} label={c}><Badge label="Text" color={c} /></SwatchCell>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-[13px] font-medium" style={{ ...FONT, color: INK }}>Bold (filled)</p>
        <div className="grid grid-cols-6 gap-4">
          {BADGE_COLORS.map((c) => (
            <SwatchCell key={c} label={c}><Badge label="Text" color={c} variant="bold" /></SwatchCell>
          ))}
          <SwatchCell label="custom"><Badge label="Text" color="custom" variant="bold" /></SwatchCell>
        </div>
      </div>
      <div>
        <p className="mb-2 text-[13px] font-medium" style={{ ...FONT, color: INK }}>Text only (bold type, no pill)</p>
        <div className="grid grid-cols-6 gap-4">
          {BADGE_COLORS.map((c) => (
            <SwatchCell key={c} label={c}><Badge label="Text" color={c} variant="text" /></SwatchCell>
          ))}
          <SwatchCell label="custom"><Badge label="Text" color="custom" variant="text" /></SwatchCell>
        </div>
      </div>
      <div>
        <p className="mb-2 text-[13px] font-medium" style={{ ...FONT, color: INK }}>Sizes & icon</p>
        <div className="grid grid-cols-4 gap-4">
          <SwatchCell label="sm (16px)"><Badge label="Text" size="sm" color="success" /></SwatchCell>
          <SwatchCell label="md (18px)"><Badge label="Text" color="success" /></SwatchCell>
          <SwatchCell label="lg (20px)"><Badge label="Text" size="lg" color="success" /></SwatchCell>
          <SwatchCell label="With icon"><Badge label="Text" color="info" icon={<CircleIcon size={12} />} /></SwatchCell>
        </div>
      </div>
    </div>
  );
}

function ButtonVariants() {
  return (
    <div className="flex flex-col gap-5">
      {HIERARCHIES.map((h) => (
        <div key={h}>
          <p className="mb-2 text-[13px] font-medium capitalize" style={{ ...FONT, color: INK }}>{h} · md</p>
          <div className="grid grid-cols-3 gap-4">
            <SwatchCell label="Default"><Button hierarchy={h} label="Button" /></SwatchCell>
            <SwatchCell label="Active (pressed)"><Button hierarchy={h} label="Button" forceActive /></SwatchCell>
            <SwatchCell label="Disabled"><Button hierarchy={h} label="Button" disabled /></SwatchCell>
          </div>
        </div>
      ))}
      <div>
        <p className="mb-2 text-[13px] font-medium" style={{ ...FONT, color: INK }}>Small (sm, 30px)</p>
        <div className="grid grid-cols-3 gap-4">
          <SwatchCell label="Primary sm"><Button size="sm" label="Button" /></SwatchCell>
          <SwatchCell label="Secondary sm"><Button size="sm" hierarchy="secondary" label="Button" /></SwatchCell>
          <SwatchCell label="Tertiary sm"><Button size="sm" hierarchy="tertiary" label="Button" /></SwatchCell>
        </div>
      </div>
      <div>
        <p className="mb-2 text-[13px] font-medium" style={{ ...FONT, color: INK }}>Icons & square</p>
        <div className="grid grid-cols-4 gap-4">
          <SwatchCell label="Icon left"><Button label="Button" iconLeft={<CircleIcon />} /></SwatchCell>
          <SwatchCell label="Icon right"><Button hierarchy="secondary" label="Button" iconRight={<CircleIcon />} /></SwatchCell>
          <SwatchCell label="Square md"><Button square icon={<CircleIcon />} aria-label="Square button" /></SwatchCell>
          <SwatchCell label="Square sm"><Button square size="sm" hierarchy="secondary" icon={<CircleIcon />} aria-label="Square button" /></SwatchCell>
        </div>
      </div>
      <div>
        <p className="mb-2 text-[13px] font-medium" style={{ ...FONT, color: INK }}>Inverse (dark surface) · md</p>
        <div className="flex flex-col gap-4">
          {HIERARCHIES.map((h) => (
            <div key={h} className="grid grid-cols-3 gap-4">
              <SwatchCell dark label={`${h} · Default`}><Button inverse hierarchy={h} label="Button" /></SwatchCell>
              <SwatchCell dark label={`${h} · Active`}><Button inverse hierarchy={h} label="Button" forceActive /></SwatchCell>
              <SwatchCell dark label={`${h} · Disabled`}><Button inverse hierarchy={h} label="Button" disabled /></SwatchCell>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FabVariants() {
  return (
    <div className="flex flex-col gap-5">
      {HIERARCHIES.map((h) => (
        <div key={h}>
          <p className="mb-2 text-[13px] font-medium capitalize" style={{ ...FONT, color: INK }}>{h} · rounded</p>
          <div className="grid grid-cols-3 gap-4">
            <SwatchCell label="Default"><FAB hierarchy={h} label="Button" /></SwatchCell>
            <SwatchCell label="Active (pressed)"><FAB hierarchy={h} label="Button" forceActive /></SwatchCell>
            <SwatchCell label="Disabled"><FAB hierarchy={h} label="Button" disabled /></SwatchCell>
          </div>
        </div>
      ))}
      <div>
        <p className="mb-2 text-[13px] font-medium" style={{ ...FONT, color: INK }}>Circle (icon-only, 46px)</p>
        <div className="grid grid-cols-3 gap-4">
          <SwatchCell label="Primary"><FAB circle icon={<CircleIcon size={20} />} aria-label="Circle FAB" /></SwatchCell>
          <SwatchCell label="Secondary"><FAB circle hierarchy="secondary" icon={<CircleIcon size={20} />} aria-label="Circle FAB" /></SwatchCell>
          <SwatchCell label="Tertiary"><FAB circle hierarchy="tertiary" icon={<CircleIcon size={20} />} aria-label="Circle FAB" /></SwatchCell>
        </div>
      </div>
      <div>
        <p className="mb-2 text-[13px] font-medium" style={{ ...FONT, color: INK }}>Inverse (dark surface)</p>
        <div className="flex flex-col gap-4">
          {HIERARCHIES.map((h) => (
            <div key={h} className="grid grid-cols-3 gap-4">
              <SwatchCell dark label={`${h} · Default`}><FAB inverse hierarchy={h} label="Button" /></SwatchCell>
              <SwatchCell dark label={`${h} · Active`}><FAB inverse hierarchy={h} label="Button" forceActive /></SwatchCell>
              <SwatchCell dark label={`${h} · Circle`}><FAB inverse circle hierarchy={h} icon={<CircleIcon size={20} />} aria-label="Circle FAB" /></SwatchCell>
            </div>
          ))}
        </div>
      </div>
      <FabCollapseDemo />
    </div>
  );
}

/** Pill ↔ circle morph via the `collapsed` prop (used by the Dashboard's
    scroll interaction) — click to toggle. */
function FabCollapseDemo() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div>
      <p className="mb-2 text-[13px] font-medium" style={{ ...FONT, color: INK }}>Pill ↔ circle morph (collapsed prop — click it)</p>
      <div className="grid grid-cols-3 gap-4">
        <SwatchCell label={collapsed ? "collapsed" : "default"}>
          <FAB
            collapsed={collapsed}
            iconLeft={<CircleIcon size={20} />}
            label="Button"
            aria-label="Toggle collapse"
            onClick={() => setCollapsed((c) => !c)}
          />
        </SwatchCell>
      </div>
    </div>
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

function TooltipOverview() {
  return (
    <div className="flex flex-col gap-4 rounded-[10px] border border-[#ececec] bg-[#f4f4f2] px-4 py-6">
      <p className="text-[12px]" style={{ ...FONT, color: MUTED }}>
        As it'd appear explaining a field (inverse = dark bubble for light surfaces):
      </p>
      <div className="flex flex-wrap items-center gap-6">
        <Tooltip inverse arrow="bottom" title="This is a tooltip" />
        <Tooltip
          inverse
          arrow="bottom-left"
          title="Due date"
          description="The date by which your customer should pay this invoice. Overdue chasers start the day after."
        />
      </div>
    </div>
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

function TooltipVariants() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-[13px] font-medium" style={{ ...FONT, color: INK }}>
          Default (beige, for dark surfaces) — arrow positions
        </p>
        <div className="grid grid-cols-4 gap-4">
          {TOOLTIP_ARROWS.map(({ arrow, label }) => (
            <AutoCell key={arrow} dark label={label}>
              <Tooltip arrow={arrow} title="This is a tooltip" />
            </AutoCell>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-[13px] font-medium" style={{ ...FONT, color: INK }}>
          Inverse (dark, for light surfaces) — arrow positions
        </p>
        <div className="grid grid-cols-4 gap-4">
          {TOOLTIP_ARROWS.map(({ arrow, label }) => (
            <AutoCell key={arrow} label={label}>
              <Tooltip inverse arrow={arrow} title="This is a tooltip" />
            </AutoCell>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-[13px] font-medium" style={{ ...FONT, color: INK }}>
          With supporting text (320px max width)
        </p>
        <div className="grid grid-cols-2 gap-4">
          <AutoCell dark label="Default · Bottom center">
            <Tooltip arrow="bottom" title="This is a tooltip" description={TOOLTIP_DESCRIPTION} />
          </AutoCell>
          <AutoCell label="Inverse · Bottom center">
            <Tooltip inverse arrow="bottom" title="This is a tooltip" description={TOOLTIP_DESCRIPTION} />
          </AutoCell>
          <AutoCell dark label="Default · Left">
            <Tooltip arrow="left" title="This is a tooltip" description={TOOLTIP_DESCRIPTION} />
          </AutoCell>
          <AutoCell label="Inverse · Right">
            <Tooltip inverse arrow="right" title="This is a tooltip" description={TOOLTIP_DESCRIPTION} />
          </AutoCell>
        </div>
      </div>
    </div>
  );
}

function TabsTestMe() {
  const [buttonTab, setButtonTab] = useState(0);
  const [underlineTab, setUnderlineTab] = useState(0);
  // enough tabs to overflow the panel — drag/scroll the row to see the overflow behavior
  const labels = ["Invoices", "Credit notes", "Drafts", "Recurring", "Customers", "Reports"];
  return (
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
  );
}

function TabsVariants() {
  return (
    <div className="flex flex-col gap-5">
      {(["button", "underline"] as const).map((v) => (
        <div key={v}>
          <p className="mb-2 text-[13px] font-medium capitalize" style={{ ...FONT, color: INK }}>{v} style</p>
          <div className="grid grid-cols-4 gap-4">
            <SwatchCell label="md · Active"><TabsBase variant={v} label="Text" active /></SwatchCell>
            <SwatchCell label="md · Default"><TabsBase variant={v} label="Text" /></SwatchCell>
            <SwatchCell label="lg · Active"><TabsBase variant={v} size="lg" label="Text" active /></SwatchCell>
            <SwatchCell label="lg · Default"><TabsBase variant={v} size="lg" label="Text" /></SwatchCell>
          </div>
        </div>
      ))}
      <div>
        <p className="mb-2 text-[13px] font-medium" style={{ ...FONT, color: INK }}>With icon</p>
        <div className="grid grid-cols-4 gap-4">
          <SwatchCell label="Button md"><TabsBase label="Text" active icon={<CircleIcon />} /></SwatchCell>
          <SwatchCell label="Button lg"><TabsBase size="lg" label="Text" icon={<CircleIcon size={20} />} /></SwatchCell>
          <SwatchCell label="Underline md"><TabsBase variant="underline" label="Text" active icon={<CircleIcon />} /></SwatchCell>
          <SwatchCell label="Underline lg"><TabsBase variant="underline" size="lg" label="Text" icon={<CircleIcon size={20} />} /></SwatchCell>
        </div>
      </div>
      <div>
        <p className="mb-2 text-[13px] font-medium" style={{ ...FONT, color: INK }}>HorizontalTabs (row of Tabs Base)</p>
        <div className="grid grid-cols-1 gap-4">
          <SwatchCell label="Button · md">
            <div className="w-full px-4"><HorizontalTabs tabs={["Text", "Text", "Text", "Text"]} activeIndex={0} onChange={() => {}} /></div>
          </SwatchCell>
          <SwatchCell label="Underline · md">
            <div className="w-full px-4"><HorizontalTabs variant="underline" tabs={["Text", "Text", "Text", "Text"]} activeIndex={0} onChange={() => {}} /></div>
          </SwatchCell>
          <SwatchCell label="Button · lg">
            <div className="w-full px-4"><HorizontalTabs size="lg" tabs={["Text", "Text", "Text", "Text"]} activeIndex={0} onChange={() => {}} /></div>
          </SwatchCell>
          <SwatchCell label="Underline · lg">
            <div className="w-full px-4"><HorizontalTabs size="lg" variant="underline" tabs={["Text", "Text", "Text", "Text"]} activeIndex={0} onChange={() => {}} /></div>
          </SwatchCell>
        </div>
      </div>
    </div>
  );
}

function LoadingOverview() {
  return (
    <div className="flex flex-col items-start gap-3 rounded-[10px] border border-[#ececec] bg-[#f4f4f2] px-4 py-6">
      <p className="text-[12px]" style={{ ...FONT, color: MUTED }}>
        As it'd appear while an invoice is being generated (lg, spins continuously):
      </p>
      <div className="flex w-full justify-center py-4">
        <Loading />
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

function LoadingVariants() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {LOADING_SIZES.map(({ size, label }) => (
        <AutoCell key={size} label={label}>
          <Loading size={size} />
        </AutoCell>
      ))}
    </div>
  );
}

/** 375px stage with page content dimmed behind a bottom sheet, matching the
    app's bg-black/25 scrim rule. */
function SheetStage({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full max-w-[375px] overflow-hidden rounded-[12px] bg-[#f9f5ea]">
      <div className="flex flex-col gap-2 p-4 pb-20">
        <div className="h-3 w-3/4 rounded bg-[#d8cfb6]" />
        <div className="h-12 w-full rounded bg-[#efe7d2]" />
        <div className="h-3 w-1/2 rounded bg-[#e3dcc5]" />
        <div className="h-12 w-full rounded bg-[#efe7d2]" />
      </div>
      <div className="absolute inset-0 bg-black/25" />
      <div className="absolute inset-x-0 bottom-0">{children}</div>
    </div>
  );
}

function BottomSheetOverview() {
  const [picked, setPicked] = useState("us");
  return (
    <div className="flex flex-col items-start gap-3 rounded-[10px] border border-[#ececec] bg-[#f4f4f2] px-4 py-5">
      <p className="text-[12px]" style={{ ...FONT, color: MUTED }}>
        As a currency picker sheet (Tiles inside, frosted search action):
      </p>
      <SheetStage>
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
      </SheetStage>
    </div>
  );
}

function BottomSheetVariants() {
  const filler = (
    <div className="flex flex-col gap-2 px-4">
      <div className="h-10 w-full rounded-[8px] bg-[#f4f4f2]" />
      <div className="h-10 w-full rounded-[8px] bg-[#f4f4f2]" />
    </div>
  );
  return (
    <div className="grid grid-cols-2 gap-4">
      <AutoCell label="Header + action button">
        <SheetStage>
          <BottomSheet title="Title" action={<CircleIcon size={20} />}>{filler}</BottomSheet>
        </SheetStage>
      </AutoCell>
      <AutoCell label="Header, no action">
        <SheetStage>
          <BottomSheet title="Title">{filler}</BottomSheet>
        </SheetStage>
      </AutoCell>
      <AutoCell label="No header (grabber hidden too)">
        <SheetStage>
          <BottomSheet showHeader={false}>{filler}</BottomSheet>
        </SheetStage>
      </AutoCell>
      <AutoCell label="With sticky button dock (composed)">
        <SheetStage>
          <BottomSheet title="Title">
            {filler}
            <div className="mt-3">
              <ButtonDock type="double" primaryLabel="Confirm" secondaryLabel="Cancel" />
            </div>
          </BottomSheet>
        </SheetStage>
      </AutoCell>
    </div>
  );
}

/** 375px stage with busy content behind a `sticky` dock (the dock positions
    itself), so the frosted gradient + blur reads like it does over a
    scrolling page. */
function DockStage({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full max-w-[375px] overflow-hidden rounded-[12px] bg-[#f9f5ea]">
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

function ButtonDockOverview() {
  return (
    <div className="flex flex-col items-start gap-3 rounded-[10px] border border-[#ececec] bg-[#f4f4f2] px-4 py-5">
      <p className="text-[12px]" style={{ ...FONT, color: MUTED }}>
        The frosted dock floating over page content via the sticky prop — the gradient fades in and content blurs underneath (page docks pass sticky; sheet footers stay in-flow):
      </p>
      <DockStage>
        <ButtonDock type="double" sticky primaryLabel="Send Invoice" secondaryLabel="Send Later" homeIndicator />
      </DockStage>
    </div>
  );
}

function ButtonDockVariants() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <AutoCell label="Primary only">
        <DockStage><ButtonDock type="single" sticky primaryLabel="Confirm" /></DockStage>
      </AutoCell>
      <AutoCell label="Primary + outline (stacked)">
        <DockStage><ButtonDock type="double" sticky primaryLabel="Confirm" secondaryLabel="Cancel" /></DockStage>
      </AutoCell>
      <AutoCell label="Primary + ghost (stacked)">
        <DockStage><ButtonDock type="ghost" sticky primaryLabel="Confirm" secondaryLabel="Close" /></DockStage>
      </AutoCell>
      <AutoCell label="Primary + ghost (horizontal)">
        <DockStage><ButtonDock type="ghost" stack="horizontal" sticky primaryLabel="Confirm" secondaryLabel="Close" /></DockStage>
      </AutoCell>
      <AutoCell label="Primary + secondary + tertiary">
        <DockStage><ButtonDock type="triple" sticky primaryLabel="Confirm" secondaryLabel="Cancel" tertiaryLabel="Close" /></DockStage>
      </AutoCell>
      <AutoCell label="With checkbox accessory">
        <DockStage><ButtonDock type="double" sticky accessory checked accessoryLabel="Remember me" primaryLabel="Send Invoice" secondaryLabel="Send Later" /></DockStage>
      </AutoCell>
      <AutoCell label="With home indicator">
        <DockStage><ButtonDock type="single" sticky primaryLabel="Confirm" homeIndicator /></DockStage>
      </AutoCell>
    </div>
  );
}

/** 375px phone-bg strip so the frosted-glass buttons/pill read like in the app. */
function HeaderStrip({ children }: { children: React.ReactNode }) {
  return <div className="w-full max-w-[375px] rounded-[12px] bg-[#f9f5ea] py-2">{children}</div>;
}

function InvoiceRowOverview() {
  return (
    <div className="flex flex-col items-start gap-3 rounded-[10px] border border-[#ececec] bg-[#f4f4f2] px-4 py-5">
      <p className="text-[12px]" style={{ ...FONT, color: MUTED }}>As a list — statuses use the Badge palette:</p>
      <div className="w-full max-w-[343px] rounded-[12px] bg-white px-4">
        <InvoiceRow
          title="Marlow & Finch Studio"
          invoiceNo="INV-2026-000004"
          recurring
          status="Paid"
          statusColor="success"
          statusCaption="on 12 Jun 2026"
          amount="USD 6,430.05"
          creditedAmount="USD 2,000.00"
          onCreditedClick={() => {}}
          onClick={() => {}}
        />
        <InvoiceRow
          title="Nordwind Trading"
          invoiceNo="INV-2026-000005"
          status="Awaiting payment"
          statusColor="info"
          statusCaption="due 30 Jun 2026"
          amount="USD 1,180.00"
          onClick={() => {}}
        />
        <InvoiceRow
          title="Kappa Logistics"
          invoiceNo="INV-2026-000006"
          status="Overdue"
          statusColor="error"
          statusCaption="since 2 Jun 2026"
          amount="USD 920.50"
          lastItem
          onClick={() => {}}
        />
      </div>
    </div>
  );
}

function InvoiceRowVariants() {
  const base = {
    title: "Marlow & Finch Studio",
    invoiceNo: "INV-2026-000004",
    status: "Paid",
    statusColor: "success" as const,
    statusCaption: "on 12 Jun 2026",
    amount: "USD 6,430.05",
    lastItem: true,
  };
  const cell = (label: string, node: React.ReactNode) => (
    <AutoCell label={label}>
      <div className="w-full max-w-[343px] rounded-[12px] bg-white px-4">{node}</div>
    </AutoCell>
  );
  return (
    <div className="grid grid-cols-2 gap-4">
      {cell("sm (list density)", <InvoiceRow {...base} recurring />)}
      {cell("md", <InvoiceRow {...base} recurring size="md" />)}
      {cell("With credited amount", <InvoiceRow {...base} recurring creditedAmount="USD 2,000.00" />)}
      {cell("Custom credited label (refund)", <InvoiceRow {...base} creditedAmount="USD 2,000.00" creditedLabel="Refund amount" />)}
      {cell("No recurring chip", <InvoiceRow {...base} />)}
      {cell("No invoice number", <InvoiceRow {...base} invoiceNo={undefined} />)}
      {cell(
        "Divider between rows (lastItem on final only)",
        <>
          <InvoiceRow {...base} lastItem={false} />
          <InvoiceRow {...base} title="Nordwind Trading" />
        </>
      )}
    </div>
  );
}

const AHEAD_LINE = "You're ahead of 71% of similar businesses this month";

function OutstandingCardOverview() {
  return (
    <div className="flex flex-col items-start gap-3 rounded-[10px] border border-[#ececec] bg-[#f4f4f2] px-4 py-5">
      <p className="text-[12px]" style={{ ...FONT, color: MUTED }}>
        Half collected, one invoice overdue — as it'd sit on the dashboard (Collected box + invoices link both tappable):
      </p>
      <div className="w-full max-w-[343px]">
        <OutstandingCard
          expected="20,000.00"
          collected="15,000.00"
          outstanding="5,000.00"
          percent={50}
          encouragement={AHEAD_LINE}
          linkLabel="1 overdue out of 2 invoices"
          onLinkClick={() => {}}
          onCollectedClick={() => {}}
        />
      </div>
    </div>
  );
}

function OutstandingCardVariants() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <AutoCell label="0% collected">
        <div className="w-full max-w-[343px]">
          <OutstandingCard expected="20,000.00" collected="0.00" outstanding="20,000.00" percent={0} outstandingSuffix="to collect" linkLabel="2 invoices" />
        </div>
      </AutoCell>
      <AutoCell label="50% · none overdue">
        <div className="w-full max-w-[343px]">
          <OutstandingCard expected="20,000.00" collected="15,000.00" outstanding="5,000.00" percent={50} encouragement={AHEAD_LINE} linkLabel="2 invoices" />
        </div>
      </AutoCell>
      <AutoCell label="50% · partially overdue">
        <div className="w-full max-w-[343px]">
          <OutstandingCard expected="20,000.00" collected="15,000.00" outstanding="5,000.00" percent={50} encouragement={AHEAD_LINE} linkLabel="1 overdue out of 2 invoices" />
        </div>
      </AutoCell>
      <AutoCell label="50% · all overdue">
        <div className="w-full max-w-[343px]">
          <OutstandingCard expected="20,000.00" collected="15,000.00" outstanding="0.00" percent={50} encouragement={AHEAD_LINE} linkLabel="2 overdue" />
        </div>
      </AutoCell>
      <AutoCell label="100% collected (green bar, no link)">
        <div className="w-full max-w-[343px]">
          <OutstandingCard expected="20,000.00" collected="20,000.00" outstanding="0.00" percent={100} encouragement={AHEAD_LINE} />
        </div>
      </AutoCell>
    </div>
  );
}

function PageHeaderTestMe() {
  const [query, setQuery] = useState("");
  return (
    <div className="flex flex-col items-start gap-3 rounded-[10px] border border-[#ececec] bg-[#f4f4f2] px-4 py-5">
      <p className="text-[12px]" style={{ ...FONT, color: MUTED }}>
        The big header and its scrolled-down compact state, plus the search header (try typing):
      </p>
      <HeaderStrip>
        <PageHeader type="left" title="Invoices" />
      </HeaderStrip>
      <HeaderStrip>
        <PageHeader type="left-on-scroll" title="Invoices" />
      </HeaderStrip>
      <HeaderStrip>
        <PageHeader type="search" searchPlaceholder="Search invoices" searchValue={query} onSearchChange={setQuery} />
      </HeaderStrip>
    </div>
  );
}

function PageHeaderVariants() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-[13px] font-medium" style={{ ...FONT, color: INK }}>Types</p>
        <div className="grid grid-cols-2 gap-4">
          <AutoCell label="Left align (32px title, slot below buttons)">
            <HeaderStrip><PageHeader type="left" title="Title" /></HeaderStrip>
          </AutoCell>
          <AutoCell label="Left align on scroll (22px title)">
            <HeaderStrip><PageHeader type="left-on-scroll" title="Title" /></HeaderStrip>
          </AutoCell>
          <AutoCell label="Center align (18px title)">
            <HeaderStrip><PageHeader type="center" title="Title" /></HeaderStrip>
          </AutoCell>
          <AutoCell label="Search">
            <HeaderStrip><PageHeader type="search" searchPlaceholder="Input text" /></HeaderStrip>
          </AutoCell>
        </div>
      </div>
      <div>
        <p className="mb-2 text-[13px] font-medium" style={{ ...FONT, color: INK }}>Options</p>
        <div className="grid grid-cols-2 gap-4">
          <AutoCell label="With text line">
            <HeaderStrip><PageHeader type="left-on-scroll" title="Title" text="Text" /></HeaderStrip>
          </AutoCell>
          <AutoCell label="Left align + text (32px title + subtitle)">
            <HeaderStrip><PageHeader type="left" title="Title" text="Text" /></HeaderStrip>
          </AutoCell>
          <AutoCell label="Center + text">
            <HeaderStrip><PageHeader type="center" title="Title" text="Text" /></HeaderStrip>
          </AutoCell>
          <AutoCell label="Without back button">
            <HeaderStrip><PageHeader type="left-on-scroll" title="Title" showBack={false} /></HeaderStrip>
          </AutoCell>
          <AutoCell label="Center, no search button (form pages)">
            <HeaderStrip><PageHeader type="center" title="Title" showSearch={false} /></HeaderStrip>
          </AutoCell>
          <AutoCell label="Left align, custom slot">
            <HeaderStrip>
              <PageHeader type="left">
                <div className="flex items-baseline gap-2">
                  <p className="text-[32px] font-medium tracking-[-1.6px]" style={{ ...FONT, color: INK, lineHeight: 0.9 }}>$12,450</p>
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
        </div>
      </div>
    </div>
  );
}

function SearchTestMe() {
  const [query, setQuery] = useState("");
  return (
    <div className="flex flex-col items-start gap-3 rounded-[10px] border border-[#ececec] bg-[#f4f4f2] px-4 py-5">
      <p className="text-[12px]" style={{ ...FONT, color: MUTED }}>
        Try typing — focusing swaps the mic for an X that clears the field:
      </p>
      <div className="w-full max-w-[327px]">
        <Search placeholder="Search invoices" value={query} onChange={setQuery} aria-label="Search demo" />
      </div>
    </div>
  );
}

function SearchVariants() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-[13px] font-medium" style={{ ...FONT, color: INK }}>States</p>
        <div className="grid grid-cols-3 gap-4">
          <SwatchCell label="Default"><div className="w-full px-3"><Search placeholder="Input text" aria-label="Search default" /></div></SwatchCell>
          <SwatchCell label="Focused (X clears)"><div className="w-full px-3"><Search placeholder="Input text" value="Input text" forceFocus aria-label="Search focused" /></div></SwatchCell>
          <SwatchCell label="Filled"><div className="w-full px-3"><Search value="Input text" aria-label="Search filled" /></div></SwatchCell>
          <SwatchCell label="Error"><div className="w-full px-3"><Search value="Input text" error aria-label="Search error" /></div></SwatchCell>
          <SwatchCell label="Disabled"><div className="w-full px-3"><Search placeholder="Input text" disabled aria-label="Search disabled" /></div></SwatchCell>
        </div>
      </div>
      <div>
        <p className="mb-2 text-[13px] font-medium" style={{ ...FONT, color: INK }}>Without the mic action</p>
        <div className="grid grid-cols-3 gap-4">
          <SwatchCell label="Default"><div className="w-full px-3"><Search placeholder="Input text" showAction={false} aria-label="Search no action" /></div></SwatchCell>
          <SwatchCell label="Filled"><div className="w-full px-3"><Search value="Input text" showAction={false} aria-label="Search no action filled" /></div></SwatchCell>
        </div>
      </div>
    </div>
  );
}

function TileTestMe() {
  const [picked, setPicked] = useState("us");
  const countries = [
    { id: "us", title: "United States", text: "USD" },
    { id: "hk", title: "Hong Kong", text: "HKD" },
  ];
  return (
    <div className="flex flex-col items-start gap-3 rounded-[10px] border border-[#ececec] bg-[#f4f4f2] px-4 py-5">
      <p className="text-[12px]" style={{ ...FONT, color: MUTED }}>Tap to pick — as a country picker would use it:</p>
      <div className="flex w-full max-w-[343px] flex-col gap-2">
        {countries.map((c) => (
          <Tile
            key={c.id}
            title={c.title}
            text={c.text}
            flag={<USFlag size={30} />}
            selected={picked === c.id}
            trailing={picked === c.id ? "check" : "none"}
            onClick={() => setPicked(c.id)}
          />
        ))}
      </div>
    </div>
  );
}

function TileVariants() {
  const states = (props: { icon?: React.ReactNode; flag?: React.ReactNode; avatar?: string }) => (
    <div className="grid grid-cols-2 gap-4">
      <AutoCell label="Default"><div className="w-full max-w-[343px]"><Tile title="Title" text="Text" {...props} /></div></AutoCell>
      <AutoCell label="Chevron"><div className="w-full max-w-[343px]"><Tile title="Title" text="Text" trailing="chevron" {...props} /></div></AutoCell>
      <AutoCell label="Selected + check"><div className="w-full max-w-[343px]"><Tile title="Title" text="Text" selected trailing="check" {...props} /></div></AutoCell>
      <AutoCell label="Disabled"><div className="w-full max-w-[343px]"><Tile title="Title" text="Text" disabled {...props} /></div></AutoCell>
      <AutoCell label="No trailing slot (long title)"><div className="w-full max-w-[343px]"><Tile title="A long action title that needs the full row" reserveTrailing={false} {...props} /></div></AutoCell>
    </div>
  );
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-[13px] font-medium" style={{ ...FONT, color: INK }}>Text only</p>
        {states({})}
      </div>
      <div>
        <p className="mb-2 text-[13px] font-medium" style={{ ...FONT, color: INK }}>With icon (24px slot)</p>
        {states({ icon: <CircleIcon size={24} /> })}
      </div>
      <div>
        <p className="mb-2 text-[13px] font-medium" style={{ ...FONT, color: INK }}>Country (30px flag)</p>
        {states({ flag: <USFlag size={30} /> })}
      </div>
      <div>
        <p className="mb-2 text-[13px] font-medium" style={{ ...FONT, color: INK }}>Avatar (40px initials)</p>
        {states({ avatar: "OR" })}
      </div>
      <div>
        <p className="mb-2 text-[13px] font-medium" style={{ ...FONT, color: INK }}>Inline badge (badge slot)</p>
        <div className="grid grid-cols-2 gap-4">
          <AutoCell label="Inline badge"><div className="w-full max-w-[343px]"><Tile title="Title" text="Text" flag={<USFlag size={30} />} badge={<Badge label="Primary" size="sm" variant="bold" />} /></div></AutoCell>
          <AutoCell label="Corner badge (primary account)"><div className="w-full max-w-[343px]"><Tile title="Title" text="Text" flag={<USFlag size={30} />} cornerBadge={<Badge label="Primary" size="md" variant="bold" color="custom" />} /></div></AutoCell>
          <AutoCell label="Corner badge + selected"><div className="w-full max-w-[343px]"><Tile title="Title" text="Text" flag={<USFlag size={30} />} cornerBadge={<Badge label="Primary" size="md" variant="bold" color="custom" />} selected trailing="check" /></div></AutoCell>
        </div>
      </div>
      <div>
        <p className="mb-2 text-[13px] font-medium" style={{ ...FONT, color: INK }}>Avatar tints (avatarColor)</p>
        <div className="grid grid-cols-2 gap-4">
          <AutoCell label="Grey"><div className="w-full max-w-[343px]"><Tile title="Title" text="Text" avatar="OR" avatarColor="#efeff0" /></div></AutoCell>
          <AutoCell label="Blue"><div className="w-full max-w-[343px]"><Tile title="Title" text="Text" avatar="OR" avatarColor="#d8e8f2" /></div></AutoCell>
          <AutoCell label="Beige (default)"><div className="w-full max-w-[343px]"><Tile title="Title" text="Text" avatar="OR" /></div></AutoCell>
          <AutoCell label="Sand"><div className="w-full max-w-[343px]"><Tile title="Title" text="Text" avatar="OR" avatarColor="#e7dfc9" /></div></AutoCell>
        </div>
      </div>
      <div>
        <p className="mb-2 text-[13px] font-medium" style={{ ...FONT, color: INK }}>
          On beige layer (borderless) & single line
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center gap-3">
            <div className="flex w-full items-center justify-center rounded-[10px] border border-[#ececec] bg-[#f9f5ea] px-4 py-6" style={{ pointerEvents: "none" }}>
              <div className="w-full max-w-[343px]"><Tile title="Title" text="Text" onLayer="beige" trailing="chevron" /></div>
            </div>
            <p className="text-[12px]" style={{ ...FONT, color: MUTED }}>Beige layer</p>
          </div>
          <AutoCell label="No second line">
            <div className="w-full max-w-[343px]"><Tile title="Title" trailing="chevron" /></div>
          </AutoCell>
        </div>
      </div>
    </div>
  );
}

function TextFieldTestMe() {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  return (
    <div className="flex flex-col items-start gap-3 rounded-[10px] border border-[#ececec] bg-[#f4f4f2] px-4 py-5">
      <p className="text-[12px]" style={{ ...FONT, color: MUTED }}>Try typing — as they'd appear on Add customer:</p>
      <div className="flex w-full max-w-[327px] flex-col gap-3">
        <TextField placeholder="Customer name" value={name} onChange={setName} aria-label="Customer name" />
        <TextField type="mobile" placeholder="Mobile number" inputMode="tel" value={phone} onChange={setPhone} aria-label="Mobile number" />
        <TextField type="currency" placeholder="0.00" inputMode="decimal" value={amount} onChange={setAmount} aria-label="Amount" />
        <TextField type="date-picker" placeholder="Due date" aria-label="Due date" onClick={() => {}} />
      </div>
    </div>
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

function TextFieldVariants() {
  return (
    <div className="flex flex-col gap-5">
      {TEXT_FIELD_TYPES.map(({ type, label }) => {
        const common = {
          type,
          placeholder: "Input text",
          "aria-label": `${label} example`,
          icon: type === "left-icon" ? <CircleIcon size={20} /> : undefined,
        };
        return (
          <div key={type}>
            <p className="mb-2 text-[13px] font-medium" style={{ ...FONT, color: INK }}>{label}</p>
            <div className="grid grid-cols-3 gap-4">
              <SwatchCell label="Default"><div className="w-full px-3"><TextField {...common} /></div></SwatchCell>
              <SwatchCell label="Focused"><div className="w-full px-3"><TextField {...common} forceFocus /></div></SwatchCell>
              <SwatchCell label="Filled"><div className="w-full px-3"><TextField {...common} value="Input text" /></div></SwatchCell>
              <SwatchCell label="Error"><div className="w-full px-3"><TextField {...common} value="Input text" error /></div></SwatchCell>
              <SwatchCell label="Disabled"><div className="w-full px-3"><TextField {...common} disabled /></div></SwatchCell>
            </div>
          </div>
        );
      })}
      <div>
        <p className="mb-2 text-[13px] font-medium" style={{ ...FONT, color: INK }}>
          With label & caption (label keeps text-primary in every state; caption turns red on error)
        </p>
        <div className="grid grid-cols-3 gap-4">
          <AutoCell label="Default">
            <TextField label="Input Label" mandatory caption="Caption" placeholder="Input text" aria-label="Labeled default" />
          </AutoCell>
          <AutoCell label="Focused">
            <TextField label="Input Label" mandatory caption="Caption" placeholder="Input text" forceFocus aria-label="Labeled focused" />
          </AutoCell>
          <AutoCell label="Filled">
            <TextField label="Input Label" mandatory caption="Caption" value="Input text" aria-label="Labeled filled" />
          </AutoCell>
          <AutoCell label="Error">
            <TextField label="Input Label" mandatory caption="Caption" value="Input text" error aria-label="Labeled error" />
          </AutoCell>
          <AutoCell label="Disabled">
            <TextField label="Input Label" mandatory caption="Caption" placeholder="Input text" disabled aria-label="Labeled disabled" />
          </AutoCell>
        </div>
      </div>
    </div>
  );
}

function ToggleTestMe() {
  const [on, setOn] = useState(true);
  return (
    <div className="flex items-center gap-3 rounded-[10px] border border-[#ececec] bg-[#f4f4f2] px-4 py-4">
      <Toggle checked={on} onChange={setOn} aria-label="Live toggle demo" />
      <p className="text-[13px]" style={{ ...FONT, color: INK }}>Try it — currently {on ? "on" : "off"}</p>
    </div>
  );
}

function ToggleVariants() {
  return (
    <div className="grid grid-cols-4 gap-4">
      <SwatchCell label="On · Default"><Toggle checked onChange={() => {}} /></SwatchCell>
      <SwatchCell label="Off · Default"><Toggle checked={false} onChange={() => {}} /></SwatchCell>
      <SwatchCell label="On · Disabled"><Toggle checked disabled onChange={() => {}} /></SwatchCell>
      <SwatchCell label="Off · Disabled"><Toggle checked={false} disabled onChange={() => {}} /></SwatchCell>
    </div>
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
    <div className={`min-h-screen bg-[#f2f2f0] px-6 pb-10 pt-[104px] ${showSidebar ? "lg:pl-[280px]" : ""}`}>
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
                  {NAV.map((item) => {
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
          <div className="mx-auto w-full max-w-[980px]">
            {activeNav === "badge" && (
              <ComponentPage
                title="Badge"
                description="A small status label — subtle, bold, or text-only, in the five status colors plus the brand gradient."
                overview={<BadgeOverview />}
                variants={<BadgeVariants />}
              />
            )}
            {activeNav === "bottom-sheet" && (
              <ComponentPage
                title="Bottom Sheet"
                description="The modal sheet container — grabber, sticky 28px-title header with an optional frosted action button, content slot and 32px bottom pad."
                overview={<BottomSheetOverview />}
                variants={<BottomSheetVariants />}
              />
            )}
            {activeNav === "button" && (
              <ComponentPage
                title="Button"
                description="Buttons are clickable items used to perform a direct action."
                overview={
                  <TryPanel
                    render={(dark) => (
                      <>
                        <Button inverse={dark} label="Try me" onClick={() => {}} />
                        <Button inverse={dark} hierarchy="secondary" label="Try me" onClick={() => {}} />
                        <Button inverse={dark} hierarchy="tertiary" label="Try me" onClick={() => {}} />
                      </>
                    )}
                  />
                }
                variants={<ButtonVariants />}
              />
            )}
            {activeNav === "fab" && (
              <ComponentPage
                title="FAB"
                description="Floating action button — a prominent, elevated shortcut that floats above the page content."
                overview={
                  <TryPanel
                    render={(dark) => (
                      <>
                        <FAB inverse={dark} label="Try me" onClick={() => {}} />
                        <FAB inverse={dark} hierarchy="secondary" label="Try me" onClick={() => {}} />
                        <FAB inverse={dark} circle icon={<CircleIcon size={20} />} aria-label="Circle FAB" onClick={() => {}} />
                      </>
                    )}
                  />
                }
                variants={<FabVariants />}
              />
            )}
            {activeNav === "tabs-base" && (
              <ComponentPage
                title="Tabs Base"
                description="A single tab item in button or underline style — compose several into a row to switch between views."
                overview={<TabsTestMe />}
                variants={<TabsVariants />}
              />
            )}
            {activeNav === "button-dock" && (
              <ComponentPage
                title="Button Dock"
                description="The bottom action dock in the frosted StickyButton style — vertically stacked full-width buttons over a transparent-to-white gradient with backdrop blur."
                overview={<ButtonDockOverview />}
                variants={<ButtonDockVariants />}
              />
            )}
            {activeNav === "outstanding-card" && (
              <ComponentPage
                title="Outstanding Card"
                description="The dark dashboard hero card — expected amount, collected progress with a gradient bar (green at 100%), and the outstanding balance with an invoices link."
                overview={<OutstandingCardOverview />}
                variants={<OutstandingCardVariants />}
              />
            )}
            {activeNav === "page-header" && (
              <ComponentPage
                title="Page Header"
                description="Floating page header with frosted-glass buttons — big left title, compact scrolled state, centered title, or a search pill."
                overview={<PageHeaderTestMe />}
                variants={<PageHeaderVariants />}
              />
            )}
            {activeNav === "invoice-row" && (
              <ComponentPage
                title="Invoice Row"
                description="An invoice list row — title, number with optional Recurring chip, Badge-colored status line, amount, and an optional credited-amount strip."
                overview={<InvoiceRowOverview />}
                variants={<InvoiceRowVariants />}
              />
            )}
            {activeNav === "loading" && (
              <ComponentPage
                title="Loading"
                description="A spinner with the Statrys mark at its center — the gradient arc rotates around a grey track; smaller sizes drop the logo."
                overview={<LoadingOverview />}
                variants={<LoadingVariants />}
              />
            )}
            {activeNav === "search" && (
              <ComponentPage
                title="Search"
                description="A compact search input with a leading search icon and a mic action that swaps to a clear button while focused."
                overview={<SearchTestMe />}
                variants={<SearchVariants />}
              />
            )}
            {activeNav === "text-field" && (
              <ComponentPage
                title="Text Field"
                description="A single-line input field — plain, with a leading icon, dropdown, date picker, or with a country-code, currency or unit selector."
                overview={<TextFieldTestMe />}
                variants={<TextFieldVariants />}
              />
            )}
            {activeNav === "tile" && (
              <ComponentPage
                title="Tile"
                description="A tappable list row — plain, with an icon, country flag or initials avatar, plus chevron/check trailing states for pickers."
                overview={<TileTestMe />}
                variants={<TileVariants />}
              />
            )}
            {activeNav === "tooltip" && (
              <ComponentPage
                title="Tooltip"
                description="Tooltips describe or identify an element — a short label, optionally with supporting text, with the arrow on any side."
                overview={<TooltipOverview />}
                variants={<TooltipVariants />}
              />
            )}
            {activeNav === "toggle" && (
              <ComponentPage
                title="Toggle"
                description="A switch to change between two states, on and off — used as an alternative to the checkbox."
                overview={<ToggleTestMe />}
                variants={<ToggleVariants />}
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
