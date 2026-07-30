import { useEffect, useState } from "react";
import { BottomSheet } from "../../components/BottomSheet";
import { ButtonDock } from "../../components/ButtonDock";
import { TextField } from "../../ui/TextField";
import { EMAIL_RE } from "../../lib/format";

interface ClientEditSheetProps {
  open: boolean;
  onClose: () => void;
  draftName: string;
  draftEmail: string;
  setDraftName: (v: string) => void;
  setDraftEmail: (v: string) => void;
  onSave: () => void;
}

/** Edit client details — applies to this credit note only (not the invoice or client record). */
export function ClientEditSheet({ open, onClose, draftName, draftEmail, setDraftName, setDraftEmail, onSave }: ClientEditSheetProps) {
  // CTA stays enabled (app-wide pattern, see memory form-cta-validation); a failed Save reveals
  // inline errors on the offending field instead of greying the button out.
  const [showErrors, setShowErrors] = useState(false);
  useEffect(() => { if (open) setShowErrors(false); }, [open]);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const nameErr = draftName.trim().length === 0 ? "Enter a customer name" : undefined;
  const emailErr = !EMAIL_RE.test(draftEmail.trim()) ? "Enter a valid email address" : undefined;

  const handleSave = () => {
    if (nameErr || emailErr) { setShowErrors(true); return; }
    onSave();
  };

  return (
    <BottomSheet
      open={open}
      title="Edit client details"
      onClose={onClose}
      keyboardOpen={keyboardOpen}
      footer={
        <ButtonDock
          type="single"
          primaryLabel="Save"
          onPrimary={handleSave}
          keyboard={keyboardOpen}
        />
      }
    >
      <div className="flex flex-col gap-3">
        <TextField
          label="Customer name"
          value={draftName}
          onChange={setDraftName}
          mandatory
          error={showErrors && !!nameErr}
          caption={showErrors ? nameErr : undefined}
          onFocus={() => setKeyboardOpen(true)}
          onBlur={() => setKeyboardOpen(false)}
        />
        <TextField
          label="Email address"
          inputType="email"
          value={draftEmail}
          onChange={setDraftEmail}
          mandatory
          error={showErrors && !!emailErr}
          caption={showErrors ? emailErr : undefined}
          onFocus={() => setKeyboardOpen(true)}
          onBlur={() => setKeyboardOpen(false)}
        />
      </div>
    </BottomSheet>
  );
}
