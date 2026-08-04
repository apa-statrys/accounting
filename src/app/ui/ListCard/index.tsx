import styles from "./index.module.css";

/**
 * ListCard — design-system grouped-rows container (Figma "[APP] Design System" →
 * ListCard, node 4295-7988): a 12px-radius card that hosts a stack of ui/ListRow
 * children (pass `last` on the final row so its divider disappears). `onLayer`
 * matches the surface the card sits on, same convention as ui/Tile: "neutral"
 * (default, matches Figma) adds a hairline border for a white page background;
 * "gray" drops it — the app's pages sit on the gray (Bg/Neutral/tertiary)
 * background, so most real usage passes `onLayer="gray"` explicitly (renamed
 * from "beige" 2026-08-04 once pages stopped using the beige background).
 */

interface ListCardProps {
  children: React.ReactNode;
  onLayer?: "neutral" | "gray";
  className?: string;
}

export function ListCard({ children, onLayer = "neutral", className = "" }: ListCardProps) {
  const classes = [styles.card, onLayer === "gray" ? styles.gray : "", className].filter(Boolean).join(" ");
  return <div className={classes}>{children}</div>;
}

export default ListCard;
