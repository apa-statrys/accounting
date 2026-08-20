import type { ReactNode } from "react";
import { BottomSheet } from "../BottomSheet";
import { ButtonDock } from "../ButtonDock";
import { FONT } from "../../lib/theme";

// Same hand-drawn warning-triangle illustration as DuplicateDecision's "This invoice already
// exists" (Figma "Sales Invoice — Client" node 1959-11709) — every "your upload can't proceed"
// moment shares this one icon.
const warningTriangleIcon = new URL("../../pages/duplicate-decision-warning.svg", import.meta.url).href;

/**
 * UploadErrorDialog — blocking notice for an upload that never reached OCR (file too large /
 * unsupported type), shown as a sheet instead of a toast so the client has a clear next step.
 * Icon + heading + description block mirrors DuplicateDecision's own "This invoice already
 * exists" layout — title stays out of the sheet's own header row so the icon can sit above it,
 * same as that page. No header ✕ (`hideClose`, decided 2026-08-20) — "Cancel" is the explicit way
 * out instead, next to "Choose Another File" (which re-invokes the scanner/picker directly, same
 * as every other in-flow re-upload action — DuplicateDecision, AddInvoiceDetails' own file row).
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
      hideClose
      compact
      footer={
        <ButtonDock
          type="double"
          primaryLabel="Choose Another File"
          secondaryLabel="Cancel"
          onPrimary={onReupload}
          onSecondary={onClose}
        />
      }
    >
      <div className="flex flex-col gap-4">
        <img src={warningTriangleIcon} alt="" width={48} height={45} />
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
