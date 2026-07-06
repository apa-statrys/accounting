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

import { FONT } from "../lib/theme";
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
    <div className="px-1" style={FONT}>
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setYearState((y) => y - 1)}
          className="w-9 h-9 flex items-center justify-center text-[#1b1b1b]"
          aria-label="Previous year"
        >
          <ChevronLeftIcon />
        </button>
        <span className="text-[18px] font-bold text-[#1b1b1b]">{year}</span>
        <button
          onClick={() => setYearState((y) => y + 1)}
          className="w-9 h-9 flex items-center justify-center text-[#1b1b1b]"
          aria-label="Next year"
        >
          <ChevronRightIcon />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {MONTHS.map((m, idx) => {
          const current = view.getMonth() === idx && view.getFullYear() === year;
          return (
            <button
              key={m}
              onClick={() => onPick(setYear(setMonth(view, idx), year))}
              className={`py-3 rounded-xl text-[15px] transition-colors ${
                current ? "bg-[#1b1b1b] text-white font-semibold" : "text-[#1b1b1b] hover:bg-[#faf9f4]"
              }`}
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
    <div className="w-full" style={FONT}>
      {/* Header — month/year (with dropdown) on the left, arrows on the right */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setPicking((p) => !p)}
          className="flex items-center gap-1 text-[18px] font-bold text-[#1b1b1b]"
          aria-expanded={picking}
        >
          {format(view, "MMMM yyyy")}
          <ExpandMoreIcon
            className="transition-transform"
            style={{ fontSize: 20, transform: picking ? "rotate(180deg)" : "none" }}
          />
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setView(subMonths(view, 1))}
            className="w-9 h-9 flex items-center justify-center text-[#1b1b1b]"
            aria-label="Previous month"
          >
            <ChevronLeftIcon />
          </button>
          <button
            onClick={() => setView(addMonths(view, 1))}
            className="w-9 h-9 flex items-center justify-center text-[#1b1b1b]"
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
          <div className="grid grid-cols-7">
            {WEEKDAYS.map((w) => (
              <div key={w} className="text-center text-[14px] text-[#808080] py-2">
                {w}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-y-1">
            {cells.map((date, i) =>
              date === null ? (
                <div key={`b${i}`} />
              ) : (
                <div key={date.toISOString()} className="flex items-center justify-center py-1">
                  <button
                    disabled={isDisabled(date)}
                    onClick={() => onChange?.(date)}
                    style={
                      value && isSameDay(date, value)
                        ? { backgroundImage: "var(--gradient-default)" }
                        : undefined
                    }
                    className={`w-9 h-9 flex items-center justify-center rounded-full text-[15px] transition-colors ${
                      value && isSameDay(date, value)
                        ? "text-white font-bold"
                        : isDisabled(date)
                        ? "text-[#c8c8c8]"
                        : "text-[#1b1b1b] hover:bg-[#faf9f4]"
                    }`}
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
