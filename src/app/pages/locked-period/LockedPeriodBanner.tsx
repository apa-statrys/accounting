import { Info } from "lucide-react";
import { FONT } from "../../lib/theme";

/**
 * LockedPeriodBanner — the amber "Accounting period closed" notice (DES-751). Non-blocking; explains
 * that documents in a closed accounting period can't be created/edited. Shared by the Locked Period
 * Information-Banner screen and the Upload-Invoice demo (as a top-of-form alert).
 */
export function LockedPeriodBanner({
  body = "Invoices and credit notes dated on or before DD/MM/YYYY can’t be created, edited, voided, or cancelled because this accounting period has been closed.",
  showContact = true,
  onContact,
}: {
  body?: string;
  showContact?: boolean;
  onContact?: () => void;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-2xl bg-[#fff7ed] border border-[#ffd9a8] px-4 py-3.5">
      <Info size={18} color="#b45309" style={{ marginTop: 1, flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold leading-[1.3] text-[#7a4a12]" style={FONT}>Accounting period closed</p>
        <p className="text-[13px] leading-[1.4] text-[#7a4a12] mt-1" style={FONT}>{body}</p>
        {showContact && (
          <button
            type="button"
            onClick={onContact}
            className="mt-2 text-[13px] font-semibold text-[#b45309] underline underline-offset-2"
            style={FONT}
          >
            Contact support
          </button>
        )}
      </div>
    </div>
  );
}

export default LockedPeriodBanner;
