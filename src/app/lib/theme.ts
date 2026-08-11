/** Shared visual constants — import these instead of re-declaring them per file. */
export const FONT = { fontFamily: "GT Walsheim LC, sans-serif" } as const;
export const INK = "#1b1b1b";
export const MUTED = "#808080";

/** Full-page push-in transition for a page that opens as an absolute overlay via local state
 *  (e.g. a Credit Note detail/form opened from a list or Invoice Detail) rather than through
 *  App.tsx's top-level screen router — same feel as that router's push/pop slide (SCREEN_SLIDE)
 *  so these don't pop in instantly while router-driven screens (Sales Invoice detail) slide. */
export const PAGE_PUSH_TRANSITION = { type: "tween" as const, duration: 0.32, ease: [0.4, 0, 0.2, 1] as const };

/** Pastel avatar tints (Figma Select Customer shows varied avatar colors); pick deterministically
 *  from a stable id/name so a tint never changes as a list filters/reorders. */
export const AVATAR_TINTS = ["#efeff0", "#d8e8f2", "#f3ecda", "#e7dfc9"];

export function avatarTint(id: string): string {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
  return AVATAR_TINTS[hash % AVATAR_TINTS.length];
}

/** Two-letter initials from a name (skips symbols like "&"), for a Tile's Avatar. */
export function initials(name: string): string {
  const words = name.split(/\s+/).filter((w) => /[a-z0-9]/i.test(w[0] ?? ""));
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase();
}
