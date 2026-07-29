import { useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { AnimatePresence, motion } from "motion/react";
import { BottomSheet, SERVICE_SHEET_HEIGHT } from "../BottomSheet";
import { TextField } from "../../ui/TextField";
import { ButtonDock } from "../ButtonDock";
import { Tile } from "../../ui/Tile";
import { CountryFlag } from "../CountryFlag";
import { CURRENCY_COUNTRY } from "../CurrencySheet";
import type { ServiceLine } from "../../types";
import styles from "./index.module.css";

const UNITS = ["Unit", "Hour", "Day", "Month", "Session", "Pair"];

interface AddServicesSheetProps {
  open: boolean;
  /** Invoice-level currency — used as the default for this line. */
  invoiceCurrency?: string;
  /** Existing line to edit; when set the form is prefilled and the CTA saves. */
  initial?: Omit<ServiceLine, "id"> | null;
  onClose?: () => void;
  onAdd?: (line: Omit<ServiceLine, "id">) => void;
}

/**
 * Add a service / product line to the invoice — Figma "Add Item" sheet (user, 15/Jul):
 * DS header, Line Item / Description / Unit Price (flag + currency prefix) / Quantity with
 * the Unit picker inline in the field. CTA always enabled — a failed click scrolls to the
 * first invalid field and shows its inline error (form-cta-validation pattern).
 *
 * The Unit picker is a "next level" of this SAME sheet (title/back swap with `step`, content
 * slides in/out), not a second BottomSheet stacked on top — see memory: sub-level-drawer-same-sheet.
 */
export function AddServicesSheet({
  open,
  invoiceCurrency = "",
  initial,
  onClose,
  onAdd,
}: AddServicesSheetProps) {
  const [serviceName, setServiceName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [unit, setUnit] = useState(initial?.unit ?? "");
  const [quantity, setQuantity] = useState(initial ? String(initial.quantity) : "");
  const [unitPrice, setUnitPrice] = useState(initial ? String(initial.unitPrice) : "");
  // Field errors appear only after a failed CTA click; editing a field clears its error.
  const [errors, setErrors] = useState<{ name?: string; description?: string; price?: string; qty?: string }>({});

  const [step, setStep] = useState<"form" | "unit">("form");

  // Every line uses the invoice currency — it's shown (read-only) here, not chosen per line.
  const currency = invoiceCurrency;
  const currencyCountry = CURRENCY_COUNTRY[currency];

  // DES-817: every line field is required (Item Name, Description, Quantity, Unit, Unit Price).
  const handleAdd = () => {
    const next: typeof errors = {};
    if (!serviceName.trim()) next.name = "Enter the service name";
    if (!description.trim()) next.description = "Enter the description";
    if (!unitPrice.trim()) next.price = "Enter the unit price";
    if (!quantity.trim()) next.qty = "Enter the quantity";
    else if (!unit) next.qty = "Choose a unit";
    setErrors(next);
    const firstInvalid = next.name ? "svc-field-name" : next.description ? "svc-field-description" : next.price ? "svc-field-price" : next.qty ? "svc-field-qty" : null;
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    onAdd?.({
      name: serviceName.trim(),
      description: description.trim() || undefined,
      currency,
      unit,
      quantity: Number(quantity),
      unitPrice: Number(unitPrice),
    });
    // Reset for the next line.
    setServiceName("");
    setDescription("");
    setUnit("");
    setQuantity("");
    setUnitPrice("");
    setErrors({});
  };

  return (
    <BottomSheet
      open={open}
      title={step === "unit" ? "Select Unit" : initial ? "Edit Item" : "Add Item"}
      centerTitle={step === "unit"}
      onBack={step === "unit" ? () => setStep("form") : undefined}
      backLabel="Back to item"
      onClose={() => {
        onClose?.();
        setStep("form");
      }}
      heightClass={SERVICE_SHEET_HEIGHT}
      footer={
        step === "unit" ? undefined : (
          // Editing an item: single "Save Changes" CTA — removal is done by swiping the line left.
          <ButtonDock
            type="single"
            primaryLabel={initial ? "Save Changes" : "Add Item"}
            onPrimary={handleAdd}
            homeIndicator
          />
        )
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        {step === "unit" ? (
          <motion.div
            key="unit"
            initial={{ x: 24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 24, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <div className={styles.unitList}>
              {UNITS.map((u) => (
                <Tile
                  key={u}
                  size="sm"
                  title={u}
                  selected={unit === u}
                  trailing={unit === u ? "check" : "none"}
                  onClick={() => {
                    setUnit(u);
                    if (errors.qty === "Choose a unit") setErrors((p) => ({ ...p, qty: undefined }));
                    setStep("form");
                  }}
                />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ x: -24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -24, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <div className={styles.fields}>
              <TextField
                id="svc-field-name"
                label="Line Item"
                mandatory
                placeholder="e.g. Brand Identity Design"
                value={serviceName}
                error={!!errors.name}
                caption={errors.name}
                onChange={(v) => { setServiceName(v); if (errors.name) setErrors((p) => ({ ...p, name: undefined })); }}
              />

              <TextField
                id="svc-field-description"
                label="Description"
                mandatory
                placeholder="e.g. About Service"
                value={description}
                error={!!errors.description}
                caption={errors.description}
                onChange={(v) => { setDescription(v); if (errors.description) setErrors((p) => ({ ...p, description: undefined })); }}
              />

              <TextField
                type="left-icon"
                id="svc-field-price"
                label="Unit Price"
                mandatory
                placeholder="e.g. 10.00"
                inputMode="decimal"
                value={unitPrice}
                error={!!errors.price}
                caption={errors.price}
                onChange={(v) => { setUnitPrice(v); if (errors.price) setErrors((p) => ({ ...p, price: undefined })); }}
                icon={
                  <span className={styles.priceCurrency}>
                    {currencyCountry && <CountryFlag name={currencyCountry} size={18} />}
                    {currency || "—"}
                  </span>
                }
              />

              {/* Quantity with the Unit picker inline (Figma) — the trailing "Unit ⌄" pushes the
                  "unit" step of this same sheet. */}
              <TextField
                id="svc-field-qty"
                label="Quantity"
                mandatory
                placeholder="e.g. 3"
                inputMode="numeric"
                pattern="[0-9]*"
                value={quantity}
                error={!!errors.qty}
                caption={errors.qty}
                onChange={(v) => { setQuantity(v.replace(/[^0-9]/g, "")); if (errors.qty) setErrors((p) => ({ ...p, qty: undefined })); }}
                iconRight={
                  <button
                    type="button"
                    onClick={() => setStep("unit")}
                    aria-label="Choose unit"
                    className={[styles.unitButton, unit ? styles.unitButtonFilled : styles.unitButtonEmpty].join(" ")}
                  >
                    {unit || "Unit"}
                    <ExpandMoreIcon className={styles.unitIcon} />
                  </button>
                }
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </BottomSheet>
  );
}

export default AddServicesSheet;
