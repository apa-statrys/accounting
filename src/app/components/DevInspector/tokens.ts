/**
 * Design-token matching for the DevInspector hover panel. Scans every loaded
 * stylesheet for `--` custom properties (so it stays in sync with
 * styles/tokens/*.css and theme.css automatically, no hardcoded token list),
 * classifies each by its resolved value's shape, then matches a hovered
 * element's computed styles back to the token name that produced them.
 *
 * Colors/shadows are compared by normalizing each candidate token's raw value
 * through a hidden probe element (same browser code path used to compute the
 * hovered element's own style), so "#FF4A15", "rgb(255, 74, 21)" and a
 * var()-chain all compare equal regardless of how they were authored. Lengths
 * (radius/spacing/font-size) are already canonical "Npx" text on both sides,
 * so a plain string comparison is enough.
 */

type TokenKind = "color" | "length" | "shadow" | "other";

interface TokenMeta {
  name: string;
  kind: TokenKind;
}

let tokenCache: TokenMeta[] | null = null;
let probeEl: HTMLDivElement | null = null;

function getProbe(): HTMLDivElement {
  if (probeEl) return probeEl;
  const el = document.createElement("div");
  el.style.position = "fixed";
  el.style.top = "-9999px";
  el.style.left = "-9999px";
  el.style.visibility = "hidden";
  el.style.pointerEvents = "none";
  document.body.appendChild(el);
  probeEl = el;
  return el;
}

function scanRuleList(rules: CSSRuleList, names: Set<string>) {
  for (let i = 0; i < rules.length; i++) {
    // Each rule is wrapped individually — Vite's dev server swaps <style> tags in and out on
    // every HMR update, so a rule can go stale mid-scan. One bad rule shouldn't lose every
    // sibling rule after it (a single try/catch around the whole loop would).
    try {
      const rule = rules[i];
      if (rule instanceof CSSStyleRule) {
        for (let p = 0; p < rule.style.length; p++) {
          const prop = rule.style.item(p);
          if (prop.startsWith("--")) names.add(prop);
        }
      } else if (rule instanceof CSSMediaRule || rule instanceof CSSSupportsRule) {
        scanRuleList(rule.cssRules, names);
      } else if (rule instanceof CSSImportRule && rule.styleSheet) {
        scanRuleList(rule.styleSheet.cssRules, names);
      }
    } catch {
      // transient CSSOM access failure — skip this rule
    }
  }
}

function collectCustomPropertyNames(): string[] {
  const names = new Set<string>();
  for (let i = 0; i < document.styleSheets.length; i++) {
    try {
      const sheet = document.styleSheets.item(i);
      if (sheet) scanRuleList(sheet.cssRules, names);
    } catch {
      // cross-origin or mid-swap stylesheet — skip
    }
  }
  return Array.from(names);
}

/** Forces the next `allTokens()` call to rescan stylesheets from scratch — called each time
 *  the inspector is turned on, so a transient scan glitch never sticks for the whole session. */
export function resetTokenCache() {
  tokenCache = null;
}

function classifyKind(raw: string): TokenKind {
  if (!raw) return "other";
  if (/^-?[\d.]+(px)?$/.test(raw)) return "length";
  if (/drop-shadow\(|(\d+(\.\d+)?px\s+){2,}/.test(raw)) return "shadow";
  const probe = getProbe();
  probe.removeAttribute("style");
  probe.style.color = raw;
  if (probe.style.color) return "color";
  return "other";
}

function allTokens(): TokenMeta[] {
  if (tokenCache) return tokenCache;
  const root = getComputedStyle(document.documentElement);
  tokenCache = collectCustomPropertyNames().map((name) => ({
    name,
    kind: classifyKind(root.getPropertyValue(name).trim()),
  }));
  return tokenCache;
}

/** Several tokens can share the same resolved value (e.g. a color's --brand-5 primitive
 *  and every semantic alias built on it, like --bg-brand-primary and --border-brand-primary,
 *  or a coincidental cross-family match like --radius-md and --space-2 both being 4px) —
 *  `hints` is the calling property's usual token family, listed in preference order (e.g.
 *  fontSize passes ["fs-", "text-"] to prefer the semantic --fs-h6 alias over the raw
 *  --text-base scale entry it's built from). Only falls back to unrelated matches, shortest
 *  name first, when nothing in `names` matches any hint at all. */
function pickBest(names: string[], hints: string[]): string | undefined {
  if (names.length === 0) return undefined;
  const scored = names.map((n) => ({ n, hintIndex: hints.findIndex((h) => n.includes(h)) }));
  scored.sort((a, b) => {
    const aHas = a.hintIndex >= 0, bHas = b.hintIndex >= 0;
    if (aHas !== bHas) return aHas ? -1 : 1;
    if (aHas && bHas && a.hintIndex !== b.hintIndex) return a.hintIndex - b.hintIndex;
    return a.n.length - b.n.length;
  });
  return scored[0].n;
}

function normalizeThrough(cssProp: "color" | "boxShadow", raw: string): string {
  const probe = getProbe();
  probe.removeAttribute("style");
  probe.style[cssProp] = raw;
  return getComputedStyle(probe)[cssProp];
}

function matchNormalized(el: Element, kind: "color" | "shadow", cssProp: "color" | "boxShadow", computed: string, hints: string[]): string | undefined {
  const style = getComputedStyle(el);
  const matches: string[] = [];
  for (const t of allTokens()) {
    if (t.kind !== kind) continue;
    const raw = style.getPropertyValue(t.name).trim();
    if (raw && normalizeThrough(cssProp, raw) === computed) matches.push(t.name);
  }
  return pickBest(matches, hints);
}

/** Colors are not responsive in this codebase, but resolving live at the hovered
 *  element (rather than :root) is no slower and stays correct if that ever changes. */
export function colorToken(el: Element, computed: string, hints: string[]): string | undefined {
  if (!computed || computed === "rgba(0, 0, 0, 0)") return undefined;
  return matchNormalized(el, "color", "color", computed, hints);
}

export function shadowToken(el: Element, computed: string, hints: string[]): string | undefined {
  if (!computed || computed === "none") return undefined;
  return matchNormalized(el, "shadow", "boxShadow", computed, hints);
}

/** Length tokens (radius/spacing/font-size/font-weight) resolved live at the hovered
 *  element — a few font-size tokens do vary under `.mobile-mode` (see styles/fonts.css). */
export function lengthToken(el: Element, computed: string, hints: string[]): string | undefined {
  const style = getComputedStyle(el);
  const matches: string[] = [];
  for (const t of allTokens()) {
    if (t.kind !== "length") continue;
    const raw = style.getPropertyValue(t.name).trim();
    if (raw && raw === computed) matches.push(t.name);
  }
  return pickBest(matches, hints);
}
