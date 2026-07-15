import { BottomSheet } from "../../components/BottomSheet";
import { ButtonDock } from "../../components/ButtonDock";
import { Tile } from "../../components/Tile";
import { TextInput } from "../../components/TextInput";

/** Required reason for raising a credit note (DES-719) — fixed enum + "Other" (reveals a free-text
 *  Description inside this sheet, matching the ticket's "dropdown + optional free text"). */
export const CREDIT_REASONS = ["Return", "Defect", "Pricing error", "Goodwill", "Dispute", "Other"];

interface ReasonSheetProps {
  open: boolean;
  onClose: () => void;
  reason: string;
  setReason: (r: string) => void;
  /** Free-text note — required only when "Other" is chosen. */
  reasonNote: string;
  setReasonNote: (n: string) => void;
}

/** Reason picker — required (DES-719). Tap a preset to select it; "Other" reveals a required free-text
 *  Description right here in the sheet. Confirm with Done. */
export function ReasonSheet({ open, onClose, reason, setReason, reasonNote, setReasonNote }: ReasonSheetProps) {
  const needsNote = reason === "Other";
  const canDone = reason !== "" && (!needsNote || reasonNote.trim() !== "");
  return (
    <BottomSheet
      open={open}
      title="Reason for credit"
      onClose={onClose}
      footer={
        <ButtonDock
          type="single"
          primaryLabel="Done"
          primaryDisabled={!canDone}
          onPrimary={onClose}
          homeIndicator
        />
      }
    >
      <div className="flex flex-col gap-2">
        {CREDIT_REASONS.map((r) => (
          <Tile
            key={r}
            title={r}
            showDescription={false}
            showIcon={false}
            selected={reason === r}
            onClick={() => setReason(r)}
          />
        ))}

        {/* Free-text description — shown only for "Other", required so the custom reason is explained. */}
        {needsNote && (
          <div className="pt-1">
            <TextInput
              label="Enter reason of credit note"
              required
              size="md"
              showHint={false}
              placeholder="Enter description of your credit reason"
              value={reasonNote}
              onChange={(e) => setReasonNote(e.target.value)}
            />
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
