/**
 * Shared submit-time validation focus helper. Every mandatory field marks its focusable DOM node
 * with `data-req="<key>"` (TextField's `dataReq` prop, or the attribute directly on a non-TextField
 * element); on a failed submit, a form calls this with its own precomputed first-invalid key (or an
 * ordered array to try in turn) to scroll that field into view and focus it — one implementation
 * instead of each form re-deriving its own id-lookup/ref/scrollIntoView timing.
 */
export function focusFirstInvalidField(key: string | string[]): void {
  const keys = Array.isArray(key) ? key : [key];
  requestAnimationFrame(() => {
    for (const k of keys) {
      const el = document.querySelector<HTMLElement>(`[data-req="${k}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.focus({ preventScroll: true });
        return;
      }
    }
  });
}
