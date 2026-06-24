import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ATTENTION_TASKS } from "./NeedAttention";

const FONT = { fontFamily: "GT Walsheim LC, sans-serif" } as const;
const CARD_H = 62;

interface AttentionItem {
  title: string;
  sub: string;
  action: string;
}

/** Same source of truth as the Need Attention screen — preview the items here (dashboard). */
const CARDS: AttentionItem[] = ATTENTION_TASKS.map(({ title, sub, action }) => ({ title, sub, action }));

const SPRING = { type: "spring", stiffness: 420, damping: 36 } as const;

function AttentionCard({ title, sub, action, onAction }: AttentionItem & { onAction?: () => void }) {
  return (
    <div
      className="bg-[#faf9f4] border border-[rgba(160,160,160,0.25)] rounded-xl px-[17px] py-[13px] flex items-center gap-3"
      style={{ height: CARD_H, boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold leading-[1.3] text-[#1b1b1b] truncate" style={FONT}>{title}</p>
        <p className="text-[12px] leading-[1.3] text-[#808080] truncate" style={FONT}>{sub}</p>
      </div>
      <button
        onPointerDownCapture={(e) => e.stopPropagation()}
        onClick={onAction}
        className="shrink-0 h-[30px] px-3 rounded bg-[#1b1b1b] flex items-center justify-center"
      >
        <span className="text-[14px] font-medium uppercase leading-none text-white" style={FONT}>{action}</span>
      </button>
    </div>
  );
}

/** Shows 2 cards by default; swipe the front card up/down to move through all 4. */
export function NeedAttentionStack() {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const last = CARDS.length - 2; // keep two cards visible

  const advance = () => {
    if (index < last) {
      setDir(1);
      setIndex((i) => i + 1);
    }
  };
  const back = () => {
    if (index > 0) {
      setDir(-1);
      setIndex((i) => i - 1);
    }
  };

  // Grey peek cards behind the second card (remaining items after the visible pair).
  const peekCount = Math.min(2, CARDS.length - 1 - (index + 1));

  return (
    <div className="flex flex-col gap-2">
      {/* Front card — draggable, flies out on swipe */}
      <div className="relative" style={{ height: CARD_H }}>
        <AnimatePresence initial={false} custom={dir}>
          <motion.div
            key={index}
            custom={dir}
            className="absolute inset-x-0 top-0"
            variants={{
              enter: (d: number) => ({ y: d > 0 ? 40 : -40, opacity: 0, scale: 0.96 }),
              center: { y: 0, opacity: 1, scale: 1 },
              exit: (d: number) => ({ y: d > 0 ? -130 : 130, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={SPRING}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.5}
            onDragEnd={(_, info) => {
              if (info.offset.y < -48) advance();
              else if (info.offset.y > 48) back();
            }}
          >
            <AttentionCard {...CARDS[index]} onAction={advance} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Second card + peeking cards behind it */}
      <div className="relative" style={{ height: CARD_H + peekCount * 9 }}>
        {Array.from({ length: peekCount }).map((_, i) => {
          const d = i + 1;
          return (
            <div
              key={d}
              className="absolute inset-x-0 top-0 rounded-xl"
              style={{
                zIndex: 5 - d,
                height: CARD_H,
                transform: `translateY(${d * 9}px) scale(${1 - d * 0.04})`,
                background: d === 1 ? "#ece9e0" : "#e2ded2",
              }}
            />
          );
        })}
        <motion.div key={index + 1} className="absolute inset-x-0 top-0" style={{ zIndex: 10 }}>
          <AttentionCard {...CARDS[index + 1]} onAction={advance} />
        </motion.div>
      </div>
    </div>
  );
}

export default NeedAttentionStack;
