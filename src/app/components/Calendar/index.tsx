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

import styles from "./index.module.css";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface CalendarProps {
  value?: Date;
  onChange?: (date: Date) => void;
  /** Disable dates before today. */
  disablePast?: boolean;
  /** Disable (grey out) any date after this day — e.g. the 6-month due-date cap. */
  maxDate?: Date;
}

/* Thin-stroke chevrons matching the DS convention (e.g. ui/PageHeader's ChevronLeftIcon) —
   not lucide/MUI, since this component mimics native iOS chrome rather than the app's own DS. */
function ChevronLeft() {
  return (
    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ChevronRight() {
  return (
    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
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
          <ChevronLeft />
        </button>
        <span className={styles.title17}>{year}</span>
        <button
          onClick={() => setYearState((y) => y + 1)}
          className={styles.navBtn}
          aria-label="Next year"
        >
          <ChevronRight />
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
      {/* Header — month/year (with dropdown) on the left, prev/next arrows on the right */}
      <div className={styles.header}>
        <button
          onClick={() => setPicking((p) => !p)}
          className={[styles.monthYearBtn, styles.title17].join(" ")}
          aria-expanded={picking}
        >
          {format(view, "MMMM yyyy")}
          <span className={[styles.chevronIcon, picking ? styles.chevronOpen : ""].filter(Boolean).join(" ")}>
            <ChevronRight />
          </span>
        </button>

        <div className={styles.navRow}>
          <button
            onClick={() => setView(subMonths(view, 1))}
            className={styles.navBtn}
            aria-label="Previous month"
          >
            <ChevronLeft />
          </button>
          <button
            onClick={() => setView(addMonths(view, 1))}
            className={styles.navBtn}
            aria-label="Next month"
          >
            <ChevronRight />
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
              <div key={w} className={styles.weekdayCell}>
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
