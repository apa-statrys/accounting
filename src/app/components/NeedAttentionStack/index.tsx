import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ATTENTION_TASKS } from "../../data/attentionTasks";
import { ActionRequired } from "../../ui/ActionRequired";
import styles from "./index.module.css";

const CARD_H = 60;

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
    <div onPointerDownCapture={(e) => e.stopPropagation()}>
      <ActionRequired title={title} description={sub} actionLabel={action} onAction={onAction} />
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
    <div className={styles.stack}>
      {/* Front card — draggable, flies out on swipe */}
      <div className={styles.frontSlot} style={{ height: CARD_H }}>
        <AnimatePresence initial={false} custom={dir}>
          <motion.div
            key={index}
            custom={dir}
            className={styles.slot}
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
      <div className={styles.backSlot} style={{ height: CARD_H + peekCount * 9 }}>
        {Array.from({ length: peekCount }).map((_, i) => {
          const d = i + 1;
          return (
            <div
              key={d}
              className={styles.peek}
              style={{
                zIndex: 5 - d,
                height: CARD_H,
                transform: `translateY(${d * 9}px) scale(${1 - d * 0.04})`,
                background: d === 1 ? "var(--bg-neutral-tertiary)" : "var(--bg-neutral-tertiary-active)",
              }}
            />
          );
        })}
        <motion.div key={index + 1} className={styles.second}>
          <AttentionCard {...CARDS[index + 1]} onAction={advance} />
        </motion.div>
      </div>
    </div>
  );
}

export default NeedAttentionStack;
