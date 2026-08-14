import { useEffect, useRef, useState } from "react";
import { Crosshair, X } from "lucide-react";
import styles from "./index.module.css";
import { colorToken, lengthToken, resetTokenCache, shadowToken } from "./tokens";

/**
 * DevInspector — Figma-dev-mode-style hover inspector for handoff. Toggle on, then
 * hover any element in the frame to see its computed styling — resolved back to our
 * design-token names where one matches — in the side panel (right-side gutter next
 * to the phone frame). Reads live computed styles, so it needs no per-component
 * wiring — works on every screen already.
 */

interface HoverInfo {
  tag: string;
  className: string;
  size: string;
  rect: DOMRect;
  color: string;
  colorToken?: string;
  background: string;
  backgroundToken?: string;
  fontSize: string;
  fontSizeToken?: string;
  fontWeight: string;
  fontWeightToken?: string;
  lineHeight: string;
  padding: string;
  paddingTokens: string[];
  margin: string;
  marginTokens: string[];
  gap: string;
  gapToken?: string;
  radius: string;
  radiusToken?: string;
  shadow: string;
  shadowToken?: string;
}

function zeroPx(v: string) {
  return v === "0px" ? "0" : v;
}

/** getComputedStyle always returns "rgb(...)"/"rgba(...)" — reformat as hex for display
 *  (8-digit "#RRGGBBAA" when alpha < 1, to keep transparency visible). */
function toHex(raw: string): string {
  const m = raw.match(/rgba?\(([^)]+)\)/);
  if (!m) return raw;
  const [r, g, b, a] = m[1].split(",").map((s) => parseFloat(s.trim()));
  const byte = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  const hex = `#${byte(r)}${byte(g)}${byte(b)}`;
  return (a === undefined || a >= 1 ? hex : `${hex}${byte(a * 255)}`).toUpperCase();
}

/** Matches each side against a length token, dedupes, keeps first-seen order. */
function sideTokens(el: HTMLElement, sides: string[], hints: string[]): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const side of sides) {
    const t = lengthToken(el, side, hints);
    if (t && !seen.has(t)) {
      seen.add(t);
      names.push(t);
    }
  }
  return names;
}

function describeElement(el: HTMLElement): HoverInfo {
  const cs = getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  const className =
    typeof el.className === "string"
      ? el.className.split(" ").filter(Boolean).slice(0, 2).join(" ")
      : "";
  const lineHeight = cs.lineHeight === "normal" ? "normal" : `${Math.round(parseFloat(cs.lineHeight))}px`;
  const paddingSides = [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map(zeroPx);
  const marginSides = [cs.marginTop, cs.marginRight, cs.marginBottom, cs.marginLeft].map(zeroPx);
  const gap = cs.gap && cs.gap !== "normal" ? cs.gap : "";
  const radius = cs.borderRadius;

  return {
    tag: el.tagName.toLowerCase(),
    className,
    rect,
    size: `${Math.round(rect.width)} × ${Math.round(rect.height)}`,
    color: toHex(cs.color),
    colorToken: colorToken(el, cs.color, ["text-", "icon-"]),
    background: toHex(cs.backgroundColor),
    backgroundToken: colorToken(el, cs.backgroundColor, ["bg-"]),
    fontSize: `${parseFloat(cs.fontSize)}px`,
    fontSizeToken: lengthToken(el, cs.fontSize, ["fs-", "text-"]),
    fontWeight: cs.fontWeight,
    fontWeightToken: lengthToken(el, cs.fontWeight, ["fw-"]),
    lineHeight,
    padding: paddingSides.join(" "),
    paddingTokens: sideTokens(el, paddingSides, ["space-"]),
    margin: marginSides.join(" "),
    marginTokens: sideTokens(el, marginSides, ["space-"]),
    gap,
    gapToken: gap && !gap.includes(" ") ? lengthToken(el, gap, ["space-"]) : undefined,
    radius,
    radiusToken: radius && !radius.includes(" ") ? lengthToken(el, radius, ["radius-"]) : undefined,
    shadow: cs.boxShadow,
    shadowToken: shadowToken(el, cs.boxShadow, ["shadow-"]),
  };
}

/** A row's value, with the matched token name (if any) rendered as a smaller
 *  accent line underneath — mirrors Figma dev mode's "bound variable" chip. */
function Value({ raw, token }: { raw: string; token?: string }) {
  return (
    <dd>
      {raw}
      {token && <span className={styles.tokenName}>{token}</span>}
    </dd>
  );
}

/** Same as Value, but for a field that can resolve to several distinct tokens
 *  at once (padding/margin, one match per side). */
function MultiValue({ raw, tokens }: { raw: string; tokens: string[] }) {
  return (
    <dd>
      {raw}
      {tokens.length > 0 && <span className={styles.tokenName}>{tokens.join(", ")}</span>}
    </dd>
  );
}

export function DevInspector() {
  const [active, setActive] = useState(false);
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) {
      setHover(null);
      return;
    }
    resetTokenCache();
    function onOver(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target || rootRef.current?.contains(target)) return;
      setHover(describeElement(target));
    }
    function onOut(e: MouseEvent) {
      if (!e.relatedTarget) setHover(null);
    }
    document.addEventListener("mouseover", onOver, true);
    document.addEventListener("mouseout", onOut, true);
    return () => {
      document.removeEventListener("mouseover", onOver, true);
      document.removeEventListener("mouseout", onOut, true);
    };
  }, [active]);

  return (
    <div ref={rootRef}>
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setActive((a) => !a)}
        aria-pressed={active}
        aria-label={active ? "Turn off style inspector" : "Turn on style inspector"}
      >
        {active ? <X size={18} strokeWidth={1.67} /> : <Crosshair size={18} strokeWidth={1.67} />}
      </button>

      {active && hover && (
        <div
          className={styles.highlight}
          style={{
            top: hover.rect.top,
            left: hover.rect.left,
            width: hover.rect.width,
            height: hover.rect.height,
          }}
        />
      )}

      {active && hover && (
        <div className={styles.panel}>
          <p className={styles.tagLine}>
            &lt;{hover.tag}&gt;
            {hover.className && <span className={styles.classLine}> .{hover.className.replace(/ /g, ".")}</span>}
          </p>
          <dl className={styles.grid}>
            <dt>Size</dt>
            <dd>{hover.size}</dd>

            <dt>Color</dt>
            <Value raw={hover.color} token={hover.colorToken} />

            <dt>Background</dt>
            <Value raw={hover.background} token={hover.backgroundToken} />

            <dt>Font size</dt>
            <Value raw={hover.fontSize} token={hover.fontSizeToken} />

            <dt>Font weight</dt>
            <Value raw={hover.fontWeight} token={hover.fontWeightToken} />

            <dt>Line height</dt>
            <dd>{hover.lineHeight}</dd>

            <dt>Padding</dt>
            <MultiValue raw={hover.padding} tokens={hover.paddingTokens} />

            <dt>Margin</dt>
            <MultiValue raw={hover.margin} tokens={hover.marginTokens} />

            {hover.gap && (
              <>
                <dt>Gap</dt>
                <Value raw={hover.gap} token={hover.gapToken} />
              </>
            )}

            <dt>Radius</dt>
            <Value raw={hover.radius} token={hover.radiusToken} />

            {hover.shadow !== "none" && (
              <>
                <dt>Shadow</dt>
                <dd className={styles.shadowValue}>
                  {hover.shadow}
                  {hover.shadowToken && <span className={styles.tokenName}>{hover.shadowToken}</span>}
                </dd>
              </>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}
