import { BottomSheet } from "../BottomSheet";
import { ButtonDock } from "../ButtonDock";
import { FONT, MUTED } from "../../lib/theme";

/**
 * UploadErrorDialog — blocking notice for an upload that never reached OCR (file too large /
 * unsupported type), shown as a sheet instead of a toast so the client has a clear next step.
 * Single "Re-upload" CTA re-invokes the scanner/picker directly, same as every other in-flow
 * re-upload action (DuplicateDecision, AddInvoiceDetails' own file row).
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
  body?: string;
  onClose?: () => void;
  onReupload?: () => void;
}) {
  return (
    <BottomSheet open={open} title={title} onClose={onClose} compact footer={<ButtonDock type="single" primaryLabel="Re-upload" onPrimary={onReupload} />}>
      <p className="body-sm" style={{ ...FONT, color: MUTED }}>
        {body}
      </p>
    </BottomSheet>
  );
}

export default UploadErrorDialog;
