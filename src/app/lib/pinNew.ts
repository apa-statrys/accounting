import type { EntityKind, NewFlag } from "../types";

/**
 * Pins the row matching `flag` to the front of `rows` — call this as the LAST step, after any
 * sort/filter, so an active sort can never bury a just-created record (pinning is not a sort).
 * Returns `rows` unchanged when `flag` is null, targets a different `kind`, or its id isn't present
 * (e.g. filtered/searched out). Pure — never mutates `rows`; every other row keeps its relative order.
 */
export function pinNew<T>(rows: T[], flag: NewFlag, kind: EntityKind, idOf: (row: T) => string): T[] {
  if (!flag || flag.kind !== kind) return rows;
  const idx = rows.findIndex((row) => idOf(row) === flag.id);
  if (idx <= 0) return rows;
  return [rows[idx], ...rows.slice(0, idx), ...rows.slice(idx + 1)];
}
