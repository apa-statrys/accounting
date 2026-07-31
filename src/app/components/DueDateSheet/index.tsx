import { useState } from "react";
import { addMonths, startOfDay, format } from "date-fns";
import { AnimatePresence, motion } from "motion/react";
import { BottomSheet, sheetItem, stepSlide } from "../BottomSheet";
import { Tile } from "../../ui/Tile";
import { Calendar } from "../Calendar";
import styles from "./index.module.css";

// DES-715: users choose 30 / 60 / 90 days or a custom date (below).
const DUE_OPTIONS = [
  { id: "30", title: "Next 30 days", description: "Due 15 Jul 2026" },
  { id: "60", title: "Next 60 days", description: "Due 14 Aug 2026" },
  { id: "90", title: "Next 90 days", description: "Due 13 Sep 2026" },
];

interface DueDateSheetProps {
  open: boolean;
  /** Currently selected option title. */
  value?: string;
  onClose?: () => void;
  onSelect?: (title: string) => void;
}

export function DueDateSheet({ open, value, onClose, onSelect }: DueDateSheetProps) {
  // The custom-date calendar is a "next level" of this SAME sheet (title/back swap with
  // `step`, content slides in/out), not a second BottomSheet stacked on top — see
  // memory: sub-level-drawer-same-sheet.
  const [step, setStep] = useState<"list" | "calendar">("list");

  // Custom due dates are capped at 6 months out — dates beyond that are disabled on the calendar.
  const today = startOfDay(new Date());
  const maxDate = addMonths(today, 6);

  // A custom date is any value that isn't one of the presets (it's stored as the formatted date string).
  const isCustom = !!value && !DUE_OPTIONS.some((o) => o.title === value);

  return (
    <BottomSheet
      open={open}
      title={step === "calendar" ? "Custom Due Date" : "Select Due Date"}
      onBack={step === "calendar" ? () => setStep("list") : undefined}
      onClose={() => {
        onClose?.();
        setStep("list");
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {step === "calendar" ? (
          <motion.div
            key="calendar"
            initial={{ x: 24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 24, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <Calendar
              disablePast
              maxDate={maxDate}
              onChange={(d) => {
                onSelect?.(format(d, "d MMM yyyy"));
                setStep("list");
              }}
            />
          </motion.div>
        ) : (
          <motion.div key="list" variants={stepSlide(-1)} initial="closed" animate="open" exit="closed">
            <div className={styles.optionsList}>
              {DUE_OPTIONS.map((o) => (
                <motion.div key={o.id} variants={sheetItem}>
                  <Tile
                    title={o.title}
                    text={o.description}
                    selected={value === o.title}
                    trailing={value === o.title ? "check" : "none"}
                    onClick={() => onSelect?.(o.title)}
                  />
                </motion.div>
              ))}
              <motion.div variants={sheetItem}>
                <Tile title="Custom Date" selected={isCustom} trailing="chevron" onClick={() => setStep("calendar")} />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </BottomSheet>
  );
}

export default DueDateSheet;
