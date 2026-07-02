import type { HeroScenario } from "../types";

/** Hero-card demo states (dev switcher on the QuickNav). */
export const HERO_SCENARIOS: HeroScenario[] = [
  {
    label: "Happy path",
    expected: "20,000.00", pct: 75,
    collected: "15,000.00", collectedCount: 6,
    outstanding: "5,000.00", outstandingCount: 2, overdue: 0,
  },
  {
    label: "Some overdue",
    expected: "20,000.00", pct: 75,
    collected: "15,000.00", collectedCount: 6,
    outstanding: "5,000.00", outstandingCount: 2, overdue: 1,
  },
  {
    label: "All overdue",
    expected: "20,000.00", pct: 75,
    collected: "15,000.00", collectedCount: 6,
    outstanding: "5,000.00", outstandingCount: 2, overdue: 2,
  },
  {
    label: "Fully collected",
    expected: "20,000.00", pct: 100,
    collected: "20,000.00", collectedCount: 8,
    outstanding: "0.00", outstandingCount: 0, overdue: 0,
  },
  {
    label: "Nothing collected",
    expected: "20,000.00", pct: 0,
    collected: "0.00", collectedCount: 0,
    outstanding: "20,000.00", outstandingCount: 8, overdue: 0,
  },
];
