/** Scroll a just-focused field into view — pair with the `setKeyboardOpen(true)` a field's
 *  onFocus already fires. That resize alone doesn't reposition scroll, so a lower field can end
 *  up hidden behind the dock/keyboard mock once it slides in. The 300ms delay waits out
 *  ButtonDock's keyboard-mock slide-in (motion transition, 250ms) so the final layout is in
 *  place before measuring where to scroll. */
export function scrollFieldIntoView(el: HTMLElement | null) {
  if (!el) return;
  setTimeout(() => {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 300);
}
