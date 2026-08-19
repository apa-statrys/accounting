import { useEffect, useState } from "react";
import { ChevronRight, ChevronsLeft, ChevronsRight, ExternalLink } from "lucide-react";
import styles from "./index.module.css";

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
  /** Small trailing pill (e.g. "WIP") — flags a jump whose flow isn't finished/final yet. */
  tag?: string;
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
  // Which sub-section accordion is open (one at a time, same as groups above) — start with the
  // section holding the active screen, if any. Section headings are unique enough within a single
  // open group that a flat (non-per-group) key works fine — only one group is ever open anyway.
  const [openSection, setOpenSection] = useState<string | null>(() => {
    for (const g of groups) {
      const activeSection = (g.sections ?? []).find((s) => s.items.some((it) => it.active));
      if (activeSection) return activeSection.heading;
    }
    return null;
  });

  useEffect(() => {
    localStorage.setItem(COLLAPSED_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  // Accordion behaviour: opening a group collapses the others (one open at a time).
  const toggleGroup = (title: string) =>
    setOpen((prev) => (prev.includes(title) ? [] : [title]));

  const toggleSection = (heading: string) =>
    setOpenSection((prev) => (prev === heading ? null : heading));

  if (collapsed) {
    return (
      <aside className={styles.collapsedRoot}>
        <button
          onClick={() => setCollapsed(false)}
          aria-label="Expand quick nav"
          title="Expand quick nav"
          className={styles.iconButton}
        >
          <ChevronsRight size={18} />
        </button>
      </aside>
    );
  }

  return (
    <aside className={styles.root}>
      {/* Header — hairline below separates it from the first group */}
      <div className={styles.header}>
        <div>
          <p className={styles.title}>Quick Nav</p>
          <p className={styles.subtitle}>For internal testing</p>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          aria-label="Collapse quick nav"
          title="Collapse quick nav"
          className={styles.iconButton}
        >
          <ChevronsLeft size={18} />
        </button>
      </div>

      {/* Accordion groups */}
      <nav className={styles.nav}>
        {groups.map((g) => {
          const isOpen = open.includes(g.title);
          const groupActive = allItems(g).some((it) => it.active);
          const renderItem = (item: SidebarItem, indent = false) => (
            <button
              key={item.label}
              onClick={item.onSelect}
              className={[
                styles.item,
                indent ? styles.itemIndent : "",
                item.active ? styles.itemActive : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {item.label}
              {item.tag && <span className={styles.itemTag}>{item.tag}</span>}
            </button>
          );
          return (
            <div key={g.title} className={styles.group}>
              <button onClick={() => toggleGroup(g.title)} className={styles.groupHeader}>
                <span
                  className={[styles.groupTitle, groupActive ? styles.groupTitleActive : ""]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {g.title}
                </span>
                <ChevronRight
                  size={14}
                  className={[styles.chevron, isOpen ? styles.chevronOpen : ""]
                    .filter(Boolean)
                    .join(" ")}
                />
              </button>
              {isOpen && (
                <div className={styles.groupBody}>
                  {(g.items ?? []).map((item) => renderItem(item))}
                  {(g.sections ?? []).map((section) => {
                    const sectionOpen = openSection === section.heading;
                    const sectionActive = section.items.some((it) => it.active);
                    return (
                      <div key={section.heading} className={styles.group}>
                        <button
                          onClick={() => toggleSection(section.heading)}
                          className={styles.sectionHeader}
                        >
                          <span
                            className={[
                              styles.sectionHeading,
                              sectionActive ? styles.sectionHeadingActive : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                          >
                            {section.heading}
                          </span>
                          <ChevronRight
                            size={12}
                            className={[
                              styles.sectionChevron,
                              sectionOpen ? styles.sectionChevronOpen : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                          />
                        </button>
                        {sectionOpen && (
                          <div className={styles.sectionBody}>
                            {section.items.map((item) => renderItem(item, true))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Persistent footer link — opens the design-system component gallery (/#showcase) in a
          new tab, for handoff (dev team can look up any component's states/props there). */}
      <a href="#showcase" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>
        <span>Component Library</span>
        <ExternalLink size={14} />
      </a>
    </aside>
  );
}

export default QuickNavSidebar;
