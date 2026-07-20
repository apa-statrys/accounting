import { useState } from "react";
import { motion } from "motion/react";
import { BottomSheet, sheetItem } from "../BottomSheet";
import { TextInput } from "../TextInput";
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
      footer={<ButtonDock type="single" homeIndicator primaryLabel="Confirm" onPrimary={confirm} />}
    >
      <div className={styles.fields}>
        <motion.div variants={sheetItem}>
          <TextInput
            id="bank-field-card"
            label="Card Number"
            placeholder="1234 5678 9012 3456"
            inputMode="numeric"
            size="md"
            required
            value={cardNumber}
            error={errors.card}
            onChange={(e) => { setCardNumber(e.target.value); if (errors.card) setErrors((p) => ({ ...p, card: undefined })); }}
          />
        </motion.div>

        <motion.div variants={sheetItem} className={styles.row}>
          <TextInput
            id="bank-field-expiry"
            label="Expiration Date"
            placeholder="MM/YY"
            inputMode="numeric"
            size="md"
            required
            className={styles.half}
            value={expiry}
            error={errors.expiry}
            onChange={(e) => { setExpiry(e.target.value); if (errors.expiry) setErrors((p) => ({ ...p, expiry: undefined })); }}
          />
          <TextInput
            id="bank-field-cvv"
            label="CVV"
            placeholder="123"
            inputMode="numeric"
            type="password"
            size="md"
            required
            className={styles.half}
            value={cvv}
            error={errors.cvv}
            onChange={(e) => { setCvv(e.target.value); if (errors.cvv) setErrors((p) => ({ ...p, cvv: undefined })); }}
          />
        </motion.div>

        <motion.div variants={sheetItem}>
          <TextInput
            id="bank-field-holder"
            label="Cardholder Name"
            placeholder="Name as shown on card"
            size="md"
            required
            value={holder}
            error={errors.holder}
            onChange={(e) => { setHolder(e.target.value); if (errors.holder) setErrors((p) => ({ ...p, holder: undefined })); }}
          />
        </motion.div>
      </div>
    </BottomSheet>
  );
}

export default BankInfoSheet;
