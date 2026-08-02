import { Banner } from "../../ui/Banner";

/**
 * LockedPeriodBanner — "Accounting period closed" notice (DES-751), a thin ui/Banner wrapper
 * carrying this alert's default copy. Explains that documents in a closed accounting period can't
 * be created/edited. Shared by the Locked Period Information-Banner screen, the Upload-Invoice
 * demo, and the locked invoice-detail/credit-note-detail pages.
 */
export function LockedPeriodBanner({
  title = "Accounting period closed",
  body = "Invoices and credit notes dated on or before 31 Dec 2026 can’t be created, edited, voided, or cancelled because this accounting period has been closed.",
  showContact = true,
  onContact,
}: {
  title?: string;
  body?: string;
  showContact?: boolean;
  onContact?: () => void;
}) {
  return (
    <Banner
      color="warning"
      title={title}
      text={body}
      linkLabel="Contact support"
      onLinkClick={showContact ? onContact : undefined}
    />
  );
}

export default LockedPeriodBanner;
