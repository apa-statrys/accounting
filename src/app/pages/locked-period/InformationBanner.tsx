import { Dashboard } from "../Dashboard";
import { LockedPeriodBanner } from "./LockedPeriodBanner";

/**
 * Locked Period — Information Banner. The real Sales Invoices dashboard with a non-blocking notice
 * inserted under the title, explaining that an accountant-locked period (DES-751: lock periods are
 * set on the admin app, read-only on the client app) can't be edited. All actions are locked on this
 * demo screen. Pairs with the Create Invoice locked-calendar screen.
 */
export function InformationBanner({
  onBack,
  onSettings,
  onOpenInvoices,
  onContact,
}: {
  onBack?: () => void;
  onSettings?: () => void;
  onOpenInvoices?: () => void;
  onContact?: () => void;
}) {
  // This demo screen LOCKS all actions: nothing on the dashboard is tappable (create, settings,
  // rows, the banner link…), reflecting a closed accounting period. `pointer-events: none` on the
  // wrapper disables every control at once; use QuickNav to leave.
  return (
    <div style={{ pointerEvents: "none" }}>
      <Dashboard
        onMenu={onBack}
        onSettings={onSettings}
        onOpenInvoices={onOpenInvoices}
        noticeBanner={<LockedPeriodBanner onContact={onContact} />}
      />
    </div>
  );
}

export default InformationBanner;
