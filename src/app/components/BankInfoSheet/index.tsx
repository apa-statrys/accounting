import { useState } from "react";
import { motion } from "motion/react";
import { BottomSheet, sheetItem } from "../BottomSheet";
import { TextField } from "../../ui/TextField";
import { ButtonDock } from "../ButtonDock";
import styles from "./index.module.css";

interface BankInfoSheetProps {
  open: boolean;
  /** Back chevron — returns to the receiving-account sheet. */
  onBack?: () => void;
  onClose?: () => void;
  /** Fired when all fields validate — passes the card's last 4 digits for the
   *  "Visa (..1234)" receiving-account label. Prototype-only: nothing is stored. */
  onConfirm?: (last4: string) => void;
}

/**
 * "Use Other Bank Accounts" card-details sheet (user, 15/Jul): card number, expiry + CVV,
 * cardholder name. CTA always enabled — a failed Confirm scrolls to the first invalid field
 * and shows its inline error (form-cta-validation pattern).
 */
export function BankInfoSheet({ open, onBack, onClose, onConfirm }: BankInfoSheetProps) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [holder, setHolder] = useState("");
  // Field errors appear only after a failed Confirm; typing in a field clears its error.
  const [errors, setErrors] = useState<{ card?: string; expiry?: string; cvv?: string; holder?: string }>({});
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const focusKeyboard = () => setKeyboardOpen(true);
  const blurKeyboard = () => setKeyboardOpen(false);

  const confirm = () => {
    const next: typeof errors = {};
    if (!cardNumber.trim()) next.card = "Enter the card number";
    if (!expiry.trim()) next.expiry = "Enter the expiration date";
    if (!cvv.trim()) next.cvv = "Enter the CVV";
    if (!holder.trim()) next.holder = "Enter the cardholder name";
    setErrors(next);
    const firstInvalid = next.card ? "bank-field-card" : next.expiry ? "bank-field-expiry" : next.cvv ? "bank-field-cvv" : next.holder ? "bank-field-holder" : null;
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const digits = cardNumber.replace(/\D/g, "");
    onConfirm?.(digits.slice(-4) || "0000");
  };

  return (
    <BottomSheet
      open={open}
      title="Bank Information"
      onClose={onClose}
      centerTitle
      onBack={onBack}
      backLabel="Back to receiving accounts"
      keyboardOpen={keyboardOpen}
      footer={<ButtonDock type="single" keyboard={keyboardOpen} primaryLabel="Confirm" onPrimary={confirm} />}
    >
      <div className={styles.fields}>
        <motion.div variants={sheetItem}>
          <TextField
            id="bank-field-card"
            label="Card Number"
            mandatory
            placeholder="1234 5678 9012 3456"
            inputMode="numeric"
            value={cardNumber}
            error={!!errors.card}
            caption={errors.card}
            onChange={(v) => { setCardNumber(v); if (errors.card) setErrors((p) => ({ ...p, card: undefined })); }}
            onFocus={focusKeyboard}
            onBlur={blurKeyboard}
          />
        </motion.div>

        <motion.div variants={sheetItem} className={styles.row}>
          <TextField
            id="bank-field-expiry"
            label="Expiration Date"
            mandatory
            placeholder="MM/YY"
            inputMode="numeric"
            className={styles.half}
            value={expiry}
            error={!!errors.expiry}
            caption={errors.expiry}
            onChange={(v) => { setExpiry(v); if (errors.expiry) setErrors((p) => ({ ...p, expiry: undefined })); }}
            onFocus={focusKeyboard}
            onBlur={blurKeyboard}
          />
          <TextField
            id="bank-field-cvv"
            label="CVV"
            mandatory
            placeholder="123"
            inputMode="numeric"
            inputType="password"
            className={styles.half}
            value={cvv}
            error={!!errors.cvv}
            caption={errors.cvv}
            onChange={(v) => { setCvv(v); if (errors.cvv) setErrors((p) => ({ ...p, cvv: undefined })); }}
            onFocus={focusKeyboard}
            onBlur={blurKeyboard}
          />
        </motion.div>

        <motion.div variants={sheetItem}>
          <TextField
            id="bank-field-holder"
            label="Cardholder Name"
            mandatory
            placeholder="Name as shown on card"
            value={holder}
            error={!!errors.holder}
            caption={errors.holder}
            onChange={(v) => { setHolder(v); if (errors.holder) setErrors((p) => ({ ...p, holder: undefined })); }}
            onFocus={focusKeyboard}
            onBlur={blurKeyboard}
          />
        </motion.div>
      </div>
    </BottomSheet>
  );
}

export default BankInfoSheet;
