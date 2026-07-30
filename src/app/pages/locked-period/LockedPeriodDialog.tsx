import { BottomSheet } from "../../components/BottomSheet";
import { ButtonDock } from "../../components/ButtonDock";
import { FONT, MUTED } from "../../lib/theme";

/**
 * LockedPeriodDialog — the blocking notice shown when a locked action is attempted in a closed
 * accounting period (DES-751). Used over the Invoice/Credit-Note detail page (e.g. trying to edit a
 * credit note dated in the closed period). Single "Got it" acknowledgement; no ✕ (it's a hard stop).
 */
export function LockedPeriodDialog({
  open = true,
  title = "Editing isn’t available",
  body = "This credit note can’t be edited because its date ([DD/MM/YYYY]) falls in a closed accounting period. Contact your accountant for assistance.",
  onClose,
}: {
  open?: boolean;
  title?: string;
  body?: string;
  onClose?: () => void;
}) {
  return (
    <BottomSheet
      open={open}
      title={title}
      onClose={onClose}
      compact
      footer={<ButtonDock type="single" primaryLabel="OK" onPrimary={onClose} />}
    >
      <p className="body-sm" style={{ ...FONT, color: MUTED }}>
        {body}
      </p>
    </BottomSheet>
  );
}

export default LockedPeriodDialog;
