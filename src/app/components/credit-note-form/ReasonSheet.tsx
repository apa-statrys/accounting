import { BottomSheet } from "../BottomSheet";
import { ButtonDock } from "../ButtonDock";
import { Tile } from "../Tile";

/** Required reason for raising a credit note (DES-719) — a fixed enum, no free-text option. */
export const CREDIT_REASONS = ["Return", "Defect", "Pricing error", "Goodwill", "Dispute"];

interface ReasonSheetProps {
  open: boolean;
  onClose: () => void;
  reason: string;
  setReason: (r: string) => void;
}

/** Reason picker — required (DES-719). Tap a preset to select it; confirm with Done. */
export function ReasonSheet({ open, onClose, reason, setReason }: ReasonSheetProps) {
  return (
    <BottomSheet
      open={open}
      title="Reason for credit"
      onClose={onClose}
      footer={
        <ButtonDock
          type="single"
          primaryLabel="Done"
          primaryDisabled={reason === ""}
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
      </div>
    </BottomSheet>
  );
}
