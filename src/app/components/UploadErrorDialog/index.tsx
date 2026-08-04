import type { ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { BottomSheet } from "../BottomSheet";
import { ButtonDock } from "../ButtonDock";
import { FONT } from "../../lib/theme";

/**
 * UploadErrorDialog — blocking notice for an upload that never reached OCR (file too large /
 * unsupported type), shown as a sheet instead of a toast so the client has a clear next step.
 * Icon + heading + description block mirrors DuplicateDecision's own "This invoice already
 * exists" layout (same warning-triangle treatment, just the DS lucide icon instead of that
 * page's un-migrated custom SVG) — title stays out of the sheet's own header row so the icon
 * can sit above it, same as that page. Single "Choose Another File" CTA re-invokes the
 * scanner/picker directly, same as every other in-flow re-upload action (DuplicateDecision,
 * AddInvoiceDetails' own file row).
 */
export function UploadErrorDialog({
  open,
  title,
  body,
  onClose,
  onReupload,
}: {
  open: boolean;
  title?: string;
  body?: ReactNode;
  onClose?: () => void;
  onReupload?: () => void;
}) {
  return (
    <BottomSheet
      open={open}
      title=""
      onClose={onClose}
      compact
      footer={<ButtonDock type="single" primaryLabel="Choose Another File" onPrimary={onReupload} />}
    >
      <div className="flex flex-col gap-4">
        <TriangleAlert size={48} strokeWidth={1.5} color="var(--icon-warning-primary)" />
        <div className="flex flex-col gap-2.5">
          <p className="card-title-lg" style={{ color: "var(--text-primary)" }}>{title}</p>
          <p className="text-[14px] leading-[1.4]" style={{ ...FONT, color: "var(--text-secondary)" }}>
            {body}
          </p>
        </div>
      </div>
    </BottomSheet>
  );
}

export default UploadErrorDialog;
