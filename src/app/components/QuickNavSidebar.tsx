import { useEffect, useState } from "react";
import { ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

/**
 * QuickNavSidebar — dev-only screen jumper for stakeholder demos (replaces the
 * QuickNav FAB on localhost; prod builds keep the curated FAB). A fixed left
 * sidebar with accordion groups: each title row's chevron opens its items.
 * Monochrome dark theme (white on ink #1b1b1b, no icons — user decisions
 * 2026-07-15). Collapses to a slim handle; collapsed state persists in localStorage.
 * Purely presentational — App.tsx builds the groups (labels + jump closures).
 */

export interface SidebarItem {
  label: string;
  active?: boolean;
  onSelect: () => void;
}

export interface SidebarSection {
  /** Small sub-header rendered above this section's items (e.g. "Unpaid Invoice"). */
  heading: string;
  items: SidebarItem[];
}

export interface SidebarGroup {
  title: string;
  /** Flat items (groups without sub-sections). */
  items?: SidebarItem[];
  /** Sub-sections with their own headings — rendered after `items` if both given. */
  sections?: SidebarSection[];
}

const COLLAPSED_KEY = "quicknav-sidebar-collapsed";

/** Every item in a group, whether flat or inside sub-sections. */
function allItems(g: SidebarGroup): SidebarItem[] {
  return [...(g.items ?? []), ...(g.sections ?? []).flatMap((s) => s.items)];
}

export function QuickNavSidebar({ groups }: { groups: SidebarGroup[] }) {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSED_KEY) === "1");
  // Which group accordions are open — start with the group holding the active screen.
  const [open, setOpen] = useState<string[]>(() => {
    const activeGroup = groups.find((g) => allItems(g).some((it) => it.active));
    return activeGroup ? [activeGroup.title] : [];
  });

  useEffect(() => {
    localStorage.setItem(COLLAPSED_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  // Accordion behaviour: opening a group collapses the others (one open at a time).
  const toggleGroup = (title: string) =>
    setOpen((prev) => (prev.includes(title) ? [] : [title]));

  if (collapsed) {
    return (
      <aside className="fixed left-0 top-0 bottom-0 z-50 w-[40px] bg-[#1b1b1b] border-r border-white/10 flex flex-col items-center py-3">
        <button
          onClick={() => setCollapsed(false)}
          aria-label="Expand quick nav"
          title="Expand quick nav"
          className="flex items-center justify-center size-8 rounded-lg text-white hover:bg-white/10 transition-colors"
        >
          <ChevronsRight size={18} />
        </button>
      </aside>
    );
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-50 w-[248px] bg-[#1b1b1b] border-r border-white/10 flex flex-col">
      {/* Header — hairline below separates it from the first group */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/10 mb-2">
        <div>
          <p className="text-[15px] font-bold tracking-[-0.2px] text-white">Quick Nav</p>
          <p className="text-[13px] text-white/50">For internal testing</p>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          aria-label="Collapse quick nav"
          title="Collapse quick nav"
          className="flex items-center justify-center size-8 rounded-lg text-white hover:bg-white/10 transition-colors"
        >
          <ChevronsLeft size={18} />
        </button>
      </div>

      {/* Accordion groups */}
      <nav className="flex-1 overflow-y-auto px-2 pb-4 flex flex-col gap-0.5">
        {groups.map((g) => {
          const isOpen = open.includes(g.title);
          const groupActive = allItems(g).some((it) => it.active);
          const renderItem = (item: SidebarItem, indent = false) => (
            <button
              key={item.label}
              onClick={item.onSelect}
              className={`w-full rounded-lg py-[7px] ${indent ? "pl-9" : "pl-6"} pr-2 text-left text-[13.5px] leading-tight transition-colors ${
                item.active
                  ? "font-bold text-white bg-white/15"
                  : "font-medium text-white/70 hover:bg-white/5"
              }`}
            >
              {item.label}
            </button>
          );
          return (
            <div key={g.title} className="flex flex-col">
              <button
                onClick={() => toggleGroup(g.title)}
                className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-white/5 transition-colors"
              >
                <span className={`flex-1 text-[12px] font-bold uppercase tracking-wide ${groupActive ? "text-white" : "text-white/50"}`}>
                  {g.title}
                </span>
                <ChevronRight
                  size={14}
                  className={`text-white/70 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
                />
              </button>
              {isOpen && (
                <div className="flex flex-col pb-1">
                  {(g.items ?? []).map((item) => renderItem(item))}
                  {(g.sections ?? []).map((section) => (
                    <div key={section.heading} className="flex flex-col">
                      <p className="pl-6 pr-2 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-white/40">
                        {section.heading}
                      </p>
                      {section.items.map((item) => renderItem(item, true))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

export default QuickNavSidebar;
