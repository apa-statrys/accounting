import { useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { motion } from "motion/react";
import { BottomSheet, sheetItem, SERVICE_SHEET_HEIGHT } from "./BottomSheet";
import { TextInput } from "./TextInput";
import { ButtonDock } from "./ButtonDock";
import { UnitSheet } from "./UnitSheet";
import type { ServiceLine } from "../types";

interface AddServicesSheetProps {
  open: boolean;
  /** Invoice-level currency — used as the default for this line. */
  invoiceCurrency?: string;
  /** Existing line to edit; when set the form is prefilled and the CTA saves. */
  initial?: Omit<ServiceLine, "id"> | null;
  onClose?: () => void;
  onAdd?: (line: Omit<ServiceLine, "id">) => void;
  /** Remove the line being edited (edit mode only). */
  onRemove?: () => void;
}

const chevron = <ExpandMoreIcon style={{ fontSize: 20, color: "#808080" }} />;

/** Add a service / product line to the invoice. */
export function AddServicesSheet({
  open,
  invoiceCurrency = "",
  initial,
  onClose,
  onAdd,
  onRemove,
}: AddServicesSheetProps) {
  const [serviceName, setServiceName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [unit, setUnit] = useState(initial?.unit ?? "");
  const [quantity, setQuantity] = useState(initial ? String(initial.quantity) : "");
  const [unitPrice, setUnitPrice] = useState(initial ? String(initial.unitPrice) : "");

  const [unitSheetOpen, setUnitSheetOpen] = useState(false);

  // Every line uses the invoice currency — it's shown (read-only) here, not chosen per line.
  const currency = invoiceCurrency;

  // Everything is required except Description.
  const canAdd = Boolean(
    serviceName.trim() && currency && unit && quantity.trim() && unitPrice.trim()
  );

  const handleAdd = () => {
    if (!canAdd) return;
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
  };

  return (
    <>
      <BottomSheet
        open={open}
        title="Services/Products"
        onClose={onClose}
        heightClass={SERVICE_SHEET_HEIGHT}
        footer={
          initial ? (
            <ButtonDock
              type="double"
              secondaryLabel="Remove"
              primaryLabel="Save"
              onSecondary={onRemove}
              onPrimary={handleAdd}
              primaryDisabled={!canAdd}
              homeIndicator
            />
          ) : (
            <ButtonDock
              type="single"
              primaryLabel="Add item"
              onPrimary={handleAdd}
              primaryDisabled={!canAdd}
              homeIndicator
            />
          )
        }
      >
        <div className="flex flex-col gap-4">
          <motion.div variants={sheetItem}>
            <TextInput
              label="Service Name"
              required
              placeholder="e.g. Brand Identity Design"
              size="md"
              showHint={false}
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
            />
          </motion.div>

          <motion.div variants={sheetItem}>
            <TextInput
              label="Description"
              placeholder="e.g. About Service"
              size="md"
              showHint={false}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </motion.div>

          <motion.div variants={sheetItem}>
            <TextInput
              label="Unit Price"
              required
              placeholder="e.g. 10.00"
              size="md"
              showHint={false}
              inputMode="decimal"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              iconLeft={
                <span
                  className="flex items-center text-[15px] font-medium text-[#808080] -ml-0.5 pr-2 mr-1 border-r border-[#e5e5e5]"
                >
                  {currency || "—"}
                </span>
              }
            />
          </motion.div>

          <motion.div variants={sheetItem} className="flex gap-4">
            <TextInput
              label="Quantity"
              required
              placeholder="e.g. 3 Hours"
              size="md"
              showHint={false}
              inputMode="numeric"
              pattern="[0-9]*"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value.replace(/[^0-9]/g, ""))}
              className="flex-1"
            />
            <TextInput
              label="Unit"
              required
              placeholder="e.g. Hour"
              size="md"
              showHint={false}
              iconRight={chevron}
              readOnly
              value={unit}
              onClick={() => setUnitSheetOpen(true)}
              className="flex-1"
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
          setUnitSheetOpen(false);
        }}
      />
    </>
  );
}

export default AddServicesSheet;
