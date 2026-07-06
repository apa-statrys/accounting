import { addWeeks, addMonths, addYears } from "date-fns";

/** Recurring-series frequency options (DES-782). */
export const FREQUENCIES = ["Weekly", "Bi-weekly", "Monthly", "Quarterly", "Annually"] as const;
export type Frequency = (typeof FREQUENCIES)[number];

/** Advance one date by a single frequency step. */
function step(date: Date, freq: Frequency): Date {
  switch (freq) {
    case "Weekly": return addWeeks(date, 1);
    case "Bi-weekly": return addWeeks(date, 2);
    case "Monthly": return addMonths(date, 1);
    case "Quarterly": return addMonths(date, 3);
    case "Annually": return addYears(date, 1);
  }
}

/** The next `count` scheduled dates, starting at `start` (the first generation date). */
export function nextDates(start: Date, freq: Frequency, count: number): Date[] {
  const out: Date[] = [];
  let d = start;
  for (let i = 0; i < count; i++) {
    out.push(d);
    d = step(d, freq);
  }
  return out;
}
