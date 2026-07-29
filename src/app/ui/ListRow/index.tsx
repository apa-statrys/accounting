import { ListText } from "../ListText";
import { SwipeActions } from "../SwipeActions";
import { Toggle } from "../Toggle";
import styles from "./index.module.css";

/**
 * ListRow — design-system list row for use inside ui/ListCard (Figma "[APP] Design
 * System" → ListRow, node 4291-7669). Layout is inferred from props rather than
 * Figma's separate Simple/with-Description axis: no `description` → a single regular-
 * weight label; with `description` → a medium-weight label + secondary description
 * line, matching Figma's two distinct text-weight rules exactly.
 *
 * Trailing edge: `value` (+ optional `valueDescription`/`valueFlag`) renders via
 * ui/ListText, followed by a chevron when `trailing="chevron"`; `trailing="toggle"`
 * renders a ui/Toggle instead (value is ignored in that case).
 *
 * `swiped` shows the Figma "onSwipe" revealed state (ui/SwipeActions beside a
 * highlighted peek row) — purely presentational, like SwipeActions itself; driving
 * it from an actual swipe/drag gesture is the caller's job.
 */

export type ListRowTrailing = "none" | "chevron" | "toggle";

interface ListRowProps {
  label: string;
  /** Second line under the label — also switches the label to medium weight (Figma
   *  "with Description" layout). */
  description?: string;
  /** Full-width line below the row (Figma "showCaption"). */
  caption?: string;
  trailing?: ListRowTrailing;
  /** Value text rendered via ui/ListText, before the chevron (ignored for trailing="toggle"). */
  value?: string;
  /** Second line under `value`, right-aligned (ui/ListText's "+description" layout). */
  valueDescription?: string;
  /** Leading icon before `value` (ui/ListText's "Currency" layout, e.g. a country flag). */
  valueFlag?: React.ReactNode;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Hides the bottom divider — pass on the last row in a ListCard. */
  last?: boolean;
  onClick?: () => void;
  /** Shows the Figma "onSwipe" revealed state instead of the row's normal trailing content. */
  swiped?: boolean;
  onDelete?: () => void;
  onMore?: () => void;
  showMoreAction?: boolean;
}

/** 30px slot (matches ui/Tile's trailing chevron) around a 20px glyph. */
function ChevronRightIcon() {
  return (
    <span className={styles.chevron}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function ListRow({
  label,
  description,
  caption,
  trailing = "none",
  value,
  valueDescription,
  valueFlag,
  checked,
  onCheckedChange,
  last = false,
  onClick,
  swiped = false,
  onDelete,
  onMore,
  showMoreAction = true,
}: ListRowProps) {
  const labelBlock = description ? (
    <span className={styles.labelBlock}>
      <span className={styles.labelMedium}>{label}</span>
      <span className={styles.description}>{description}</span>
    </span>
  ) : (
    <span className={styles.labelInline}>{label}</span>
  );

  const valueNode = value ? <ListText text={value} description={valueDescription} flag={valueFlag} /> : null;

  const trailingNode =
    trailing === "toggle" ? (
      <Toggle checked={!!checked} onChange={(next) => onCheckedChange?.(next)} aria-label={label} />
    ) : (
      (valueNode || trailing === "chevron") && (
        <span className={styles.trailingGroup}>
          {valueNode}
          {trailing === "chevron" && <ChevronRightIcon />}
        </span>
      )
    );

  const rootClasses = [styles.root, last ? styles.noBorder : "", swiped ? styles.swiped : "", onClick && !swiped ? styles.clickable : ""]
    .filter(Boolean)
    .join(" ");

  if (swiped) {
    // "with Description" layout stacks the peek into a column so the caption can sit
    // full-width below the label/trailing row (Figma node 4291-7669); "Simple" (no
    // description) keeps the single-line row peek.
    return (
      <div className={rootClasses}>
        <div className={description ? styles.swipePeekStacked : styles.swipePeek}>
          {description ? (
            <>
              <div className={styles.swipePeekRow}>
                {labelBlock}
                {trailing !== "toggle" && trailingNode}
              </div>
              {caption && <p className={styles.caption}>{caption}</p>}
            </>
          ) : (
            <>
              {labelBlock}
              {trailing !== "toggle" && trailingNode}
            </>
          )}
        </div>
        <SwipeActions showMore={showMoreAction} onMore={onMore} onDelete={onDelete} />
      </div>
    );
  }

  const body = (
    <>
      <div className={styles.row}>
        {labelBlock}
        {trailingNode}
      </div>
      {caption && <p className={styles.caption}>{caption}</p>}
    </>
  );

  return onClick ? (
    <button type="button" className={rootClasses} onClick={onClick}>
      {body}
    </button>
  ) : (
    <div className={rootClasses}>{body}</div>
  );
}

export default ListRow;
