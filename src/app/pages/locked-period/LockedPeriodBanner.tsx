import { Info } from "lucide-react";
import { FONT } from "../../lib/theme";

/**
 * LockedPeriodBanner — non-blocking "Accounting period closed" notice (DES-751). Explains that
 * documents in a closed accounting period can't be created/edited. Shared by the Locked Period
 * Information-Banner screen, the Upload-Invoice demo, and the locked invoice-detail page.
 * `tone`: "amber" (default alert) or "neutral" (quiet grey informational).
 */

const TONES = {
  // Matches ui/Banner's warning rule exactly: only the icon tints amber, text stays ink — no override.
  amber: {
    bg: "var(--bg-warning-subtle)",
    border: "var(--border-warning-subtle)",
    title: "var(--text-primary)",
    body: "var(--text-primary)",
    icon: "var(--icon-warning-primary)",
    link: "var(--text-primary)",
  },
  neutral: {
    bg: "var(--bg-neutral-tertiary)",
    border: "var(--border-neutral-secondary)",
    title: "var(--text-primary)",
    body: "var(--text-secondary)",
    icon: "var(--icon-secondary)",
    link: "var(--text-secondary)",
  },
} as const;

export function LockedPeriodBanner({
  title = "Accounting period closed",
  body = "Invoices and credit notes dated on or before DD/MM/YYYY can’t be created, edited, voided, or cancelled because this accounting period has been closed.",
  showContact = true,
  onContact,
  tone = "amber",
}: {
  title?: string;
  body?: string;
  showContact?: boolean;
  onContact?: () => void;
  tone?: keyof typeof TONES;
}) {
  const c = TONES[tone];
  return (
    <div className="flex items-start gap-2.5 rounded-2xl px-4 py-3.5" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
      <Info size={18} color={c.icon} style={{ marginTop: 1, flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold leading-[1.3]" style={{ ...FONT, color: c.title }}>{title}</p>
        <p className="text-[13px] leading-[1.4] mt-1" style={{ ...FONT, color: c.body }}>{body}</p>
        {showContact && (
          <button
            type="button"
            onClick={onContact}
            className="mt-2 text-[13px] font-semibold underline underline-offset-2"
            style={{ ...FONT, color: c.link }}
          >
            Contact support
          </button>
        )}
      </div>
    </div>
  );
}

export default LockedPeriodBanner;
