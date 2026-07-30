import styles from "./index.module.css";

/**
 * ListCard — design-system grouped-rows container (Figma "[APP] Design System" →
 * ListCard, node 4295-7988): a 12px-radius card that hosts a stack of ui/ListRow
 * children (pass `last` on the final row so its divider disappears). `onLayer`
 * matches the surface the card sits on, same convention as ui/Tile: "neutral"
 * (default, matches Figma) adds a hairline border for a white page background;
 * "beige" drops it — the app's pages sit on the beige background, so most real
 * usage passes `onLayer="beige"` explicitly.
 */

interface ListCardProps {
  children: React.ReactNode;
  onLayer?: "neutral" | "beige";
  className?: string;
}

export function ListCard({ children, onLayer = "neutral", className = "" }: ListCardProps) {
  const classes = [styles.card, onLayer === "beige" ? styles.beige : "", className].filter(Boolean).join(" ");
  return <div className={classes}>{children}</div>;
}

export default ListCard;
