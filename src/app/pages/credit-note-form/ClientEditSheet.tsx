import { useEffect, useState } from "react";
import { BottomSheet } from "../../components/BottomSheet";
import { ButtonDock } from "../../components/ButtonDock";
import { TextInput } from "../../components/TextInput";
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
      footer={
        <ButtonDock
          type="single"
          primaryLabel="Save"
          onPrimary={handleSave}
          homeIndicator
        />
      }
    >
      <div className="flex flex-col gap-3">
        <TextInput label="Customer name" value={draftName} onChange={(e) => setDraftName(e.target.value)} required showHint={showErrors && !!nameErr} error={showErrors ? nameErr : undefined} />
        <TextInput label="Email address" type="email" value={draftEmail} onChange={(e) => setDraftEmail(e.target.value)} required showHint={showErrors && !!emailErr} error={showErrors ? emailErr : undefined} />
      </div>
    </BottomSheet>
  );
}
