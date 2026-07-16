import { useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { motion } from "motion/react";
import { BottomSheet, sheetItem, SERVICE_SHEET_HEIGHT } from "./BottomSheet";
import { TextInput } from "./TextInput";
import { ButtonDock } from "./ButtonDock";
import { UnitSheet } from "./UnitSheet";
import { CURRENCIES } from "./CurrencySheet";
import type { ServiceLine } from "../types";

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
 * DS header, Service Name / Description / Unit Price (flag + currency prefix) / Quantity with
 * the Unit picker inline in the field. CTA always enabled — a failed click scrolls to the
 * first invalid field and shows its inline error (form-cta-validation pattern).
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

  const [unitSheetOpen, setUnitSheetOpen] = useState(false);

  // Every line uses the invoice currency — it's shown (read-only) here, not chosen per line.
  const currency = invoiceCurrency;
  const currencyFlag = CURRENCIES.find((c) => c.code === currency)?.flag;

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
    <>
      <BottomSheet
        open={open}
        title={initial ? "Edit Item" : "Add Item"}
        onClose={onClose}
        heightClass={SERVICE_SHEET_HEIGHT}
        dsHeader
        footer={
          // Editing an item: single "Save Changes" CTA — removal is done by swiping the line left.
          <ButtonDock
            type="single"
            primaryLabel={initial ? "Save Changes" : "Add Item"}
            onPrimary={handleAdd}
            homeIndicator
          />
        }
      >
        <div className="flex flex-col gap-4">
          <motion.div variants={sheetItem}>
            <TextInput
              id="svc-field-name"
              label="Service Name"
              required
              placeholder="e.g. Brand Identity Design"
              size="md"
              value={serviceName}
              error={errors.name}
              showHint={!!errors.name}
              onChange={(e) => { setServiceName(e.target.value); if (errors.name) setErrors((p) => ({ ...p, name: undefined })); }}
            />
          </motion.div>

          <motion.div variants={sheetItem}>
            <TextInput
              id="svc-field-description"
              label="Description"
              required
              placeholder="e.g. About Service"
              size="md"
              value={description}
              error={errors.description}
              showHint={!!errors.description}
              onChange={(e) => { setDescription(e.target.value); if (errors.description) setErrors((p) => ({ ...p, description: undefined })); }}
            />
          </motion.div>

          <motion.div variants={sheetItem}>
            <TextInput
              id="svc-field-price"
              label="Unit Price"
              required
              placeholder="e.g. 10.00"
              size="md"
              inputMode="decimal"
              value={unitPrice}
              error={errors.price}
              showHint={!!errors.price}
              onChange={(e) => { setUnitPrice(e.target.value); if (errors.price) setErrors((p) => ({ ...p, price: undefined })); }}
              iconLeft={
                <span className="flex items-center gap-1.5 text-[15px] font-medium text-[#1b1b1b] -ml-0.5 mr-1 whitespace-nowrap">
                  {currencyFlag && <span className="text-[18px] leading-none">{currencyFlag}</span>}
                  {currency || "—"}
                </span>
              }
            />
          </motion.div>

          <motion.div variants={sheetItem}>
            {/* Quantity with the Unit picker inline (Figma) — the trailing "Unit ⌄" opens the unit sheet. */}
            <TextInput
              id="svc-field-qty"
              label="Quantity"
              required
              placeholder="e.g. 3"
              size="md"
              inputMode="numeric"
              pattern="[0-9]*"
              value={quantity}
              error={errors.qty}
              showHint={!!errors.qty}
              onChange={(e) => { setQuantity(e.target.value.replace(/[^0-9]/g, "")); if (errors.qty) setErrors((p) => ({ ...p, qty: undefined })); }}
              iconRight={
                <button
                  type="button"
                  onClick={() => setUnitSheetOpen(true)}
                  aria-label="Choose unit"
                  className="flex items-center gap-0.5 text-[15px] font-medium whitespace-nowrap"
                  style={{ color: unit ? "#1b1b1b" : "#808080" }}
                >
                  {unit || "Unit"}
                  <ExpandMoreIcon style={{ fontSize: 20, color: "#808080" }} />
                </button>
              }
            />
          </motion.div>
        </div>
      </BottomSheet>

      <UnitSheet
        open={unitSheetOpen}
        value={unit}
        onClose={() => setUnitSheetOpen(false)}
        onSelect={(u) => {
          setUnit(u);
          if (errors.qty === "Choose a unit") setErrors((p) => ({ ...p, qty: undefined }));
          setUnitSheetOpen(false);
        }}
      />
    </>
  );
}

export default AddServicesSheet;
