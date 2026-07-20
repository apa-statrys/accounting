import { useState } from "react";
import {
  addMonths,
  subMonths,
  startOfMonth,
  getDay,
  getDaysInMonth,
  startOfDay,
  isSameDay,
  isBefore,
  isAfter,
  setMonth,
  setYear,
  format,
} from "date-fns";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import styles from "./index.module.css";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface CalendarProps {
  value?: Date;
  onChange?: (date: Date) => void;
  /** Disable dates before today. */
  disablePast?: boolean;
  /** Disable (grey out) any date after this day — e.g. the 6-month due-date cap. */
  maxDate?: Date;
}

function MonthYearPicker({ view, onPick }: { view: Date; onPick: (d: Date) => void }) {
  const [year, setYearState] = useState(view.getFullYear());
  return (
    <div className={styles.pickerWrap}>
      <div className={styles.pickerHeader}>
        <button
          onClick={() => setYearState((y) => y - 1)}
          className={styles.navBtn}
          aria-label="Previous year"
        >
          <ChevronLeftIcon />
        </button>
        <span className={styles.title18Bold}>{year}</span>
        <button
          onClick={() => setYearState((y) => y + 1)}
          className={styles.navBtn}
          aria-label="Next year"
        >
          <ChevronRightIcon />
        </button>
      </div>
      <div className={styles.monthGrid}>
        {MONTHS.map((m, idx) => {
          const current = view.getMonth() === idx && view.getFullYear() === year;
          return (
            <button
              key={m}
              onClick={() => onPick(setYear(setMonth(view, idx), year))}
              className={[styles.monthBtn, current ? styles.monthBtnCurrent : ""].filter(Boolean).join(" ")}
            >
              {m}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Calendar({ value, onChange, disablePast = false, maxDate }: CalendarProps) {
  const [view, setView] = useState<Date>(value ?? new Date());
  const [picking, setPicking] = useState(false);

  const firstWeekday = getDay(startOfMonth(view));
  const dayCount = getDaysInMonth(view);
  const today = startOfDay(new Date());
  const maxDay = maxDate ? startOfDay(maxDate) : undefined;
  const isDisabled = (date: Date) =>
    (disablePast && isBefore(date, today)) || (maxDay ? isAfter(date, maxDay) : false);

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= dayCount; d++) cells.push(new Date(view.getFullYear(), view.getMonth(), d));

  return (
    <div className={styles.root}>
      {/* Header — month/year (with dropdown) on the left, arrows on the right */}
      <div className={styles.header}>
        <button
          onClick={() => setPicking((p) => !p)}
          className={[styles.monthYearBtn, styles.title18Bold].join(" ")}
          aria-expanded={picking}
        >
          {format(view, "MMMM yyyy")}
          <ExpandMoreIcon
            className={[styles.chevronIcon, picking ? styles.chevronOpen : ""].filter(Boolean).join(" ")}
          />
        </button>

        <div className={styles.navRow}>
          <button
            onClick={() => setView(subMonths(view, 1))}
            className={styles.navBtn}
            aria-label="Previous month"
          >
            <ChevronLeftIcon />
          </button>
          <button
            onClick={() => setView(addMonths(view, 1))}
            className={styles.navBtn}
            aria-label="Next month"
          >
            <ChevronRightIcon />
          </button>
        </div>
      </div>

      {picking ? (
        <MonthYearPicker
          view={view}
          onPick={(d) => {
            setView(d);
            setPicking(false);
          }}
        />
      ) : (
        <>
          {/* Weekday labels */}
          <div className={styles.weekdayGrid}>
            {WEEKDAYS.map((w) => (
              <div key={w} className={`${styles.weekdayCell} body-sm`}>
                {w}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className={styles.daysGrid}>
            {cells.map((date, i) =>
              date === null ? (
                <div key={`b${i}`} />
              ) : (
                <div key={date.toISOString()} className={styles.dayCell}>
                  <button
                    disabled={isDisabled(date)}
                    onClick={() => onChange?.(date)}
                    className={[
                      styles.dayBtn,
                      value && isSameDay(date, value)
                        ? styles.daySelected
                        : isDisabled(date)
                        ? styles.dayDisabled
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {date.getDate()}
                  </button>
                </div>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Calendar;
