import styles from "./index.module.css";

/**
 * Avatar — design-system avatar (Figma "[APP] Design System" → Avatar, node
 * 1942-6704). Two styles: "square" (a rounded-square initials chip — the only
 * style used across the app today, since customers/companies have no photo
 * data) and "photo" (a circular image, for the rare case a real picture is
 * available). Seven sizes (xs 16px → 3xl 64px), each with its own radius/font
 * pairing per Figma. Styling in index.module.css.
 */

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
export type AvatarStyle = "square" | "photo";

interface AvatarProps {
  size?: AvatarSize;
  style?: AvatarStyle;
  /** style="square" only — the initials shown, e.g. "OR". */
  initials?: string;
  /** style="photo" only — the image source. */
  src?: string;
  /** style="photo" only — alt text for the image. */
  alt?: string;
  /** Background tint (style="square" only) — defaults to Bg/Beige/primary. */
  color?: string;
  /** Initials text color (style="square" only) — defaults to Text/text-primary. */
  textColor?: string;
  className?: string;
}

const SIZE_CLASS: Record<AvatarSize, string> = {
  xs: "xs",
  sm: "sm",
  md: "md",
  lg: "lg",
  xl: "xl",
  "2xl": "twoXl",
  "3xl": "threeXl",
} as const;

export function Avatar({
  size = "md",
  style = "square",
  initials,
  src,
  alt = "",
  color,
  textColor,
  className,
}: AvatarProps) {
  const classes = [styles.root, styles[SIZE_CLASS[size]], style === "photo" ? styles.photo : styles.square, className]
    .filter(Boolean)
    .join(" ");
  return (
    <div
      className={classes}
      style={style === "square" && color ? { background: color } : undefined}
    >
      {style === "photo" ? (
        <img className={styles.image} src={src} alt={alt} />
      ) : (
        <span className={styles.initials} style={textColor ? { color: textColor } : undefined}>
          {initials}
        </span>
      )}
    </div>
  );
}

export default Avatar;
