/** Shared visual constants — import these instead of re-declaring them per file. */
export const FONT = { fontFamily: "GT Walsheim LC, sans-serif" } as const;
export const INK = "#1b1b1b";
export const MUTED = "#808080";

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
