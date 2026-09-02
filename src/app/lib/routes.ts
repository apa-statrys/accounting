import type { Screen } from "../types";

/**
 * Screen ↔ URL path mapping — shallow routing only: the address bar reflects which screen is
 * open (and the browser back/forward buttons work), but a fresh load of a deep path always lands
 * on that screen's DEFAULT instance. It does not restore which invoice/customer/draft was open —
 * that would mean threading IDs through the URL and rehydrating App.tsx's state from them, a much
 * bigger follow-up. Unlike `/#showcase` (hash-based specifically to need no server config, see
 * main.tsx), these are real paths, so the host needs an SPA rewrite (see vercel.json) or a direct
 * load of a deep path 404s.
 */
const SCREEN_PATHS: Record<Screen, string> = {
  dashboard: "/",
  list: "/invoices",
  customer: "/create-invoice/customer",
  details: "/create-invoice/details",
  extracting: "/create-invoice/extracting",
  send: "/send",
  invoiceDetail: "/invoice-detail",
  needAttention: "/need-attention",
  duplicateCheck: "/create-invoice/duplicate-check",
  settings: "/settings",
  creditNote: "/credit-note",
  refundCreditNote: "/refund-credit-note",
  hub: "/menu",
  creditNotes: "/credit-notes",
  customers: "/customers",
  customerDetail: "/customers/detail",
  addCustomer: "/customers/add",
  editCustomer: "/customers/edit",
  generalError: "/error",
  notFound: "/not-found",
  networkError: "/network-error",
};

const PATH_SCREENS: Partial<Record<string, Screen>> = Object.fromEntries(
  Object.entries(SCREEN_PATHS).map(([screen, path]) => [path, screen as Screen])
);

export function pathForScreen(screen: Screen): string {
  return SCREEN_PATHS[screen];
}

/** Falls back to "dashboard" for any path that isn't one of the screens above (unknown/typo'd
 *  URL, or the bare "/" the app is served from). */
export function screenForPath(path: string): Screen {
  return PATH_SCREENS[path] ?? "dashboard";
}
