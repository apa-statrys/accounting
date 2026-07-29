import { useState } from "react";
import { Avatar } from "../Avatar";
import styles from "./index.module.css";

/**
 * Tile — design-system list row (Figma "[APP] Design System" → Tile, node
 * 4222-8331). A 65px row (54px at size="sm"): leading visual (24px icon, 30px
 * country flag, or 40px initials avatar — pass one of icon/flag/avatar), title
 * + optional second line, and a 30px trailing slot (none/chevron/check). The
 * trailing slot is always reserved so rows in one list stay aligned, per Figma.
 * `selected` = brand border + warm surface (pair with trailing="check");
 * onLayer="beige" drops the border for tiles sitting on the beige page bg.
 * Renders a <button> when onClick is given, with its own momentary Pressed
 * state (Figma node 4222-8331 — a `state` axis alongside Selected/Disabled,
 * so it's suppressed on those, not layered on top of them). Styling in
 * index.module.css.
 */

export type TileTrailing = "none" | "chevron" | "check";

interface TileProps {
  /** Usually a plain string; pass a fragment of mixed-weight spans when a row needs a
   *  regular-weight label + medium-weight value inline (e.g. a sort option's "Label: Value"). */
  title: React.ReactNode;
  /** Figma's Size axis — "sm" (54px) is a tighter row for denser lists; padding, gap and
   *  typography stay the same as "md" (65px), only the row height shrinks. Figma still shows
   *  the 40px avatar unshrunk at "sm" (it doesn't fit the 54px row without clipping) — this
   *  hasn't come up in practice since no current avatar Tile opts into "sm"; revisit if it does. */
  size?: "md" | "sm";
  /** Second line under the title (Figma showText). */
  text?: string;
  /** Inline badge rendered after the title (e.g. <Badge label="Primary" />). */
  badge?: React.ReactNode;
  /** Badge pinned to the tile's top-right corner (Figma primary-account tile) —
   *  pass a <Badge size="sm">; the corner radii are reshaped to hug the card corner. */
  cornerBadge?: React.ReactNode;
  /** 24px leading icon (Figma icon-swap slot; inherits the state color). */
  icon?: React.ReactNode;
  /** 30px leading country flag (e.g. <USFlag size={30} />). */
  flag?: React.ReactNode;
  /** Leading 40px initials avatar — pass the initials, e.g. "OR". */
  avatar?: string;
  /** Avatar background tint (CSS color) — Figma shows avatars in varied pastel
   *  tints; defaults to Bg/Beige/primary when omitted. */
  avatarColor?: string;
  trailing?: TileTrailing;
  /** Skip the reserved 30px trailing slot when trailing="none" — for action lists where no row
   *  ever shows a trailing icon, freeing the width for long titles. Keep the default (reserved)
   *  in lists that mix none with check/chevron so titles stay aligned, per Figma. */
  reserveTrailing?: boolean;
  selected?: boolean;
  disabled?: boolean;
  /** Validation error border (e.g. a required Tile left empty on submit) — not a Figma axis,
   *  just this token swapped in for .selected's brand border. */
  error?: boolean;
  /** "beige" = borderless, for tiles on the beige page background. */
  onLayer?: "neutral" | "beige";
  onClick?: () => void;
}

function ChevronRightIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Tile({
  title,
  size = "md",
  text,
  badge,
  cornerBadge,
  icon,
  flag,
  avatar,
  avatarColor,
  trailing = "none",
  reserveTrailing = true,
  selected = false,
  disabled = false,
  error = false,
  onLayer = "neutral",
  onClick,
}: TileProps) {
  const [pressed, setPressed] = useState(false);
  const classes = [
    styles.tile,
    size === "sm" ? styles.sm : "",
    onLayer === "beige" ? styles.beige : "",
    selected ? styles.selected : "",
    disabled ? styles.disabled : "",
    error ? styles.error : "",
    // Pressed is its own `state` axis in Figma (alongside Selected/Disabled), not layered on
    // top of them — only show it on an otherwise-plain, interactive tile.
    pressed && !selected && !disabled && !error ? styles.pressed : "",
  ]
    .filter(Boolean)
    .join(" ");
  const content = (
    <>
      {avatar ? (
        <Avatar
          size="lg"
          initials={avatar}
          color={disabled ? "var(--bg-neutral-disabled)" : avatarColor}
          textColor={disabled ? "var(--text-neutral-inverse-disabled)" : undefined}
        />
      ) : flag ? (
        <span className={styles.flag}>{flag}</span>
      ) : icon ? (
        <span className={styles.icon}>{icon}</span>
      ) : null}
      <span className={styles.textBlock}>
        {badge ? (
          <span className={styles.titleRow}>
            <span className={styles.title}>{title}</span>
            {badge}
          </span>
        ) : (
          <span className={styles.title}>{title}</span>
        )}
        {text && <span className={styles.text}>{text}</span>}
      </span>
      {(trailing !== "none" || reserveTrailing) && (
        <span className={styles.trailing}>
          {trailing === "chevron" && <ChevronRightIcon />}
          {trailing === "check" && (
            <span className={styles.check}>
              <CheckIcon />
            </span>
          )}
        </span>
      )}
      {cornerBadge && <span className={styles.cornerBadge}>{cornerBadge}</span>}
    </>
  );
  if (onClick) {
    return (
      <button
        type="button"
        className={classes}
        onClick={onClick}
        disabled={disabled}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
      >
        {content}
      </button>
    );
  }
  return (
    <div className={classes} aria-disabled={disabled || undefined}>
      {content}
    </div>
  );
}

export default Tile;
