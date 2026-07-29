import { BottomSheet } from "../../components/BottomSheet";
import { ButtonDock } from "../../components/ButtonDock";
import { TextField } from "../../ui/TextField";

interface ClientEditSheetProps {
  open: boolean;
  onClose: () => void;
  draftName: string;
  draftEmail: string;
  setDraftName: (v: string) => void;
  setDraftEmail: (v: string) => void;
  dirty: boolean;
  valid: boolean;
  onSave: () => void;
}

/** Edit client details — applies to this credit note only (not the invoice or client record). */
export function ClientEditSheet({ open, onClose, draftName, draftEmail, setDraftName, setDraftEmail, dirty, valid, onSave }: ClientEditSheetProps) {
  return (
    <BottomSheet
      open={open}
      title="Edit client details"
      onClose={onClose}
      footer={
        <ButtonDock
          type="single"
          primaryLabel="Save"
          primaryDisabled={!dirty || !valid}
          onPrimary={onSave}
          homeIndicator
        />
      }
    >
      <div className="flex flex-col gap-3">
        <TextField label="Customer name" value={draftName} onChange={setDraftName} mandatory />
        <TextField label="Email address" inputType="email" value={draftEmail} onChange={setDraftEmail} mandatory />
      </div>
    </BottomSheet>
  );
}
