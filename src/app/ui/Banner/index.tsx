import { CircleCheck, TriangleAlert, OctagonAlert, Info } from "lucide-react";
import styles from "./index.module.css";

/**
 * Banner — design-system inline status message (Figma "[APP] Design System" →
 * Banner, node 4631-372). A subtle-tinted row: 16px status icon + one line of
 * text, in one of four colors. Non-interactive. Styling in index.module.css.
 */

export type BannerColor = "info" | "success" | "warning" | "error";

const ICONS: Record<BannerColor, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  success: CircleCheck,
  warning: TriangleAlert,
  error: OctagonAlert,
  info: Info,
};

interface BannerProps {
  color: BannerColor;
  text: string;
}

export function Banner({ color, text }: BannerProps) {
  const Icon = ICONS[color];
  return (
    <div className={`${styles.banner} ${styles[color]}`}>
      <span className={styles.icon}>
        <Icon size={16} strokeWidth={1.67} />
      </span>
      <p className={styles.text}>{text}</p>
    </div>
  );
}

export default Banner;
