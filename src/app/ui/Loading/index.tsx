import { useId } from "react";
import styles from "./index.module.css";

/**
 * Loading — design-system spinner (Figma "[APP] Design System" → Loading,
 * node 1684-6170). Sizes 2xs(16) xs(24) sm(32) md(64) lg(116); sm and up show
 * the Statrys logo in the center. Drawn as one parametric SVG (grey track +
 * quarter arc in Gradient/Strong) instead of Figma's per-size images, so it
 * can spin — CSS animation on the ring, logo stays still. Geometry and the
 * gradient endpoints are lifted from the Figma assets. Styling in
 * index.module.css.
 */

export type LoadingSize = "2xs" | "xs" | "sm" | "md" | "lg";

interface LoadingProps {
  size?: LoadingSize;
  "aria-label"?: string;
}

/* Per-size geometry from the Figma assets: box, track radius + stroke width,
   whether the centered logo shows. The arc reuses r/stroke (same annulus). */
const SIZES: Record<LoadingSize, { box: number; r: number; stroke: number; logo: boolean }> = {
  "2xs": { box: 16, r: 7.2, stroke: 1.6, logo: false },
  xs: { box: 24, r: 10.8, stroke: 2.4, logo: false },
  sm: { box: 32, r: 14.7, stroke: 2.6, logo: true },
  md: { box: 64, r: 29.5, stroke: 5, logo: true },
  lg: { box: 116, r: 55, stroke: 6, logo: true },
};

/* Statrys "S" mark (Figma StatrysLogo, node 537-2699) — the two main plates;
   scaled to 37.4% of the box height like the Figma component. */
function StatrysMark({ height }: { height: number }) {
  const width = height * (30.4896 / 43.3753);
  return (
    <svg className={styles.logo} width={width} height={height} viewBox="0 0 30.4896 43.3753" fill="none" aria-hidden="true">
      <path
        d="M19.4316 12.0674L9.12695 15.709L9.0332 15.7422L9.01172 15.8389L7.11133 24.4277H7.11035L7.10938 24.4385L7.1084 24.4443L7.08203 24.6094L7.24512 24.6455L10.1162 25.2822L10.5771 25.3838L11.7646 25.6465L10.6582 30.6533L10.5967 30.9307L0.901367 31.3145L0.859375 30.2314L0.180664 13.0977L18.9658 0.327148L19.4316 12.0674Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.35637"
      />
      <path
        d="M30.3033 30.1591L30.2867 30.1601L30.2906 30.2802L11.5025 43.0468L11.0376 31.2822L11.0728 31.2705L21.1031 27.7236L21.2349 27.7529L21.273 27.579L23.1763 18.9873L23.2144 18.8134L23.0406 18.7753L20.2593 18.1591L19.9 18.079L18.5054 17.7705L19.6968 12.4003L29.5845 12.0078L30.3033 30.1591Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.35637"
      />
    </svg>
  );
}

export function Loading({ size = "lg", "aria-label": ariaLabel = "Loading" }: LoadingProps) {
  const { box, r, stroke, logo } = SIZES[size];
  const gradId = useId();
  const c = box / 2;
  const circumference = 2 * Math.PI * r;
  return (
    <div className={styles.root} style={{ width: box, height: box }} role="status" aria-label={ariaLabel}>
      <svg className={styles.ring} viewBox={`0 0 ${box} ${box}`} fill="none" aria-hidden="true">
        <circle cx={c} cy={c} r={r} stroke="#a0a0a0" strokeOpacity="0.2" strokeWidth={stroke} />
        {/* quarter arc, 12 → 3 o'clock (dash offset starts at 3 o'clock, so rotate -90) */}
        <circle
          cx={c}
          cy={c}
          r={r}
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          strokeDasharray={`${circumference / 4} ${circumference}`}
          transform={`rotate(-90 ${c} ${c})`}
        />
        <defs>
          {/* Gradient/Strong — endpoints as box fractions, from the Figma assets */}
          <linearGradient
            id={gradId}
            x1={-0.0548 * box}
            y1={1.2498 * box}
            x2={1.5516 * box}
            y2={-0.5186 * box}
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FF4A15" />
            <stop offset="0.350962" stopColor="#FF553A" />
            <stop offset="1" stopColor="#FF7FC4" />
          </linearGradient>
        </defs>
      </svg>
      {logo && <StatrysMark height={box * 0.374} />}
    </div>
  );
}

export default Loading;
