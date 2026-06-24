const FONT = { fontFamily: "GT Walsheim LC, sans-serif" } as const;
const MUTED = "#8b9382";
const INK = "#1b1b1b";

/** Smooth rainbow gradient across the whole track. */
const GRAD =
  "linear-gradient(90deg, #FF7E6E 0%, #FFA557 22%, #FFD23B 44%, #A7DD5F 64%, #5FC6E6 84%, #82E39C 100%)";

/** Organic wavy notch marking the current value. */
function Notch({ left }: { left: number }) {
  return (
    <div className="absolute top-0 h-full -translate-x-1/2 pointer-events-none" style={{ left: `${left}%`, width: 8 }}>
      <svg width="8" height="24" viewBox="0 0 8 24" className="block">
        <path
          d="M4 1.5 C 1.5 5, 6.5 8.5, 4 12 C 1.5 15.5, 6.5 19, 4 22.5"
          fill="none"
          stroke="rgba(255,255,255,0.85)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

interface ScoreBarProps {
  /** Current value along the track, 0–100. */
  score: number;
  /** Boundary labels spread evenly across the bar. */
  labels?: string[];
  className?: string;
}

/**
 * Credit-score-style progress bar: full-width pill, smooth gradient with a soft
 * glow, an organic notch + black triangle at the configurable score, and evenly
 * spread labels (the one nearest the score is emphasised).
 */
export function ScoreBar({ score, labels = ["0", "20%", "40%", "60%", "80%", "100%"], className = "" }: ScoreBarProps) {
  const s = Math.max(0, Math.min(100, score));
  const step = 100 / (labels.length - 1);
  const activeIndex = Math.round(s / step);

  return (
    <div className={`w-full ${className}`}>
      {/* Triangle indicator */}
      <div className="relative w-full" style={{ height: 10 }}>
        <div className="absolute -translate-x-1/2" style={{ left: `${s}%`, bottom: 2 }}>
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "8px solid #141414",
            }}
          />
        </div>
      </div>

      {/* Track */}
      <div
        className="relative w-full rounded-full"
        style={{ height: 24, background: GRAD, boxShadow: "0 0 14px rgba(255,255,255,0.55)" }}
      >
        <Notch left={s} />
      </div>

      {/* Labels */}
      <div className="flex items-center justify-between w-full mt-2">
        {labels.map((l, i) => (
          <span
            key={i}
            className="text-[12px] leading-[1.3]"
            style={{ ...FONT, color: i === activeIndex ? INK : MUTED, fontWeight: i === activeIndex ? 700 : 400 }}
          >
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

export default ScoreBar;
