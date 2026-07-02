import { BottomSheet } from "../BottomSheet";
import { ButtonDock } from "../ButtonDock";
import { Tile } from "../Tile";
import { TextInput } from "../TextInput";

/** Required reason for raising a credit note (DES-719). Dropdown + optional free-text note;
 *  "Others" swaps the note field for a required free-text reason. */
export const CREDIT_REASONS = ["Return", "Defect", "Pricing error", "Goodwill", "Dispute", "Others"];

interface ReasonSheetProps {
  open: boolean;
  onClose: () => void;
  reason: string;
  reasonNote: string;
  setReason: (r: string) => void;
  setReasonNote: (n: string) => void;
}

/** Reason picker — required (DES-719). A preset closes on tap; "Others" reveals a free-text
 *  input below it (captured in-sheet) and a Done button to confirm. */
export function ReasonSheet({ open, onClose, reason, reasonNote, setReason, setReasonNote }: ReasonSheetProps) {
  const isOtherReason = reason === "Others";
  return (
    <BottomSheet
      open={open}
      title="Reason for credit"
      onClose={onClose}
      footer={
        <ButtonDock
          type="single"
          primaryLabel="Done"
          primaryDisabled={reason === "" || (isOtherReason && reasonNote.trim() === "")}
          onPrimary={onClose}
          homeIndicator
        />
      }
    >
      <div className="flex flex-col gap-2">
        {CREDIT_REASONS.map((r) => (
          <div key={r} className="flex flex-col gap-2">
            <Tile
              title={r}
              showDescription={false}
              showIcon={false}
              selected={reason === r}
              onClick={() => {
                // Select the reason; confirm with Done. "Others" reveals the free-text input below.
                setReason(r);
                if (r !== "Others") setReasonNote("");
              }}
            />
            {r === "Others" && isOtherReason && (
              <TextInput
                placeholder="Describe the reason for this credit"
                value={reasonNote}
                onChange={(e) => setReasonNote(e.target.value)}
                showHint={false}
                autoFocus
              />
            )}
          </div>
        ))}
      </div>
    </BottomSheet>
  );
}
