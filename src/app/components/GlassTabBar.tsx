import { LayoutGrid, Search, Receipt } from "lucide-react";

type TabId = "dashboard" | "invoices" | "search";

interface GlassTabBarProps {
  active: TabId;
  onOpenDashboard?: () => void;
  onOpenInvoices?: () => void;
  onOpenSearch?: () => void;
}

const FONT = { fontFamily: "GT Walsheim LC, sans-serif" } as const;
const BRAND = "#ff4a15";
const GREY = "#a0a0a0";

/** Liquid-glass material shared by the pill bar and the search circle. */
const GLASS: React.CSSProperties = {
  background: "rgba(255,255,255,0.2)",
  backdropFilter: "blur(16px) saturate(180%)",
  WebkitBackdropFilter: "blur(16px) saturate(180%)",
  boxShadow: "0 2px 20px rgba(0,0,0,0.1)",
};

/** Beige translucent gradient behind the active tab. */
const ACTIVE_PILL: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(180deg, rgba(240,240,240,0.2) 0%, rgba(249,245,234,0.2) 78.846%, rgba(255,255,255,0.08) 97.596%), linear-gradient(90deg, rgba(249,245,234,0.7) 0%, rgba(249,245,234,0.7) 100%)",
};

/**
 * Floating liquid-glass tab bar (Figma 346:4513): a glass pill with
 * Overview / Invoice List, plus a separate glass search circle on the right.
 */
export function GlassTabBar({
  active,
  onOpenDashboard,
  onOpenInvoices,
  onOpenSearch,
}: GlassTabBarProps) {
  const tabs = [
    { id: "dashboard" as const, label: "Overview", Icon: LayoutGrid, onClick: onOpenDashboard },
    { id: "invoices" as const, label: "Invoice List", Icon: Receipt, onClick: onOpenInvoices },
  ];

  return (
    <div className="absolute bottom-7 inset-x-0 z-20 flex items-center justify-between px-5">
      {/* Tab pills */}
      <div className="flex items-center p-1 rounded-full w-[252px]" style={GLASS}>
        {tabs.map(({ id, label, Icon, onClick }) => {
          const isActive = active === id;
          const color = isActive ? BRAND : GREY;
          return (
            <button
              key={id}
              onClick={onClick}
              aria-label={label}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 p-2 rounded-[100px] overflow-hidden min-w-[102px] max-w-[126px] transition-colors duration-200"
              style={isActive ? ACTIVE_PILL : undefined}
            >
              <Icon size={20} strokeWidth={2} style={{ color }} />
              <span
                className="text-[12px] leading-[1.3] text-center whitespace-nowrap"
                style={{ ...FONT, color, fontWeight: 500 }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Separate search circle */}
      <button
        onClick={onOpenSearch}
        aria-label="Search"
        className="flex items-center justify-center rounded-full size-[60px] shrink-0 transition-colors duration-200"
        style={GLASS}
      >
        <Search size={20} strokeWidth={2} style={{ color: active === "search" ? BRAND : GREY }} />
      </button>
    </div>
  );
}

export default GlassTabBar;
