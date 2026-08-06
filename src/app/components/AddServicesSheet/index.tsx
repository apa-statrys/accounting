import { useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BottomSheet, SERVICE_SHEET_HEIGHT } from "../BottomSheet";
import { TextField } from "../../ui/TextField";
import { ButtonDock } from "../ButtonDock";
import { Tile } from "../../ui/Tile";
import { CountryFlag } from "../CountryFlag";
import { CURRENCY_COUNTRY } from "../CurrencySheet";
import { scrollFieldIntoView } from "../../lib/scrollFieldIntoView";
import { focusFirstInvalidField } from "../../lib/focusFirstInvalidField";
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
  /** Edit mode only — removes this line and closes the sheet. */
  onDelete?: () => void;
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
  onDelete,
}: AddServicesSheetProps) {
  const [serviceName, setServiceName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  // "Unit" is itself a real, selectable entry in UNITS (a generic count) — it's the default,
  // not a placeholder, so an unedited Quantity field is already validly filled.
  const [unit, setUnit] = useState(initial?.unit ?? "Unit");
  const [quantity, setQuantity] = useState(initial ? String(initial.quantity) : "");
  const [unitPrice, setUnitPrice] = useState(initial ? String(initial.unitPrice) : "");
  // Field errors appear only after a failed CTA click; editing a field clears its error.
  const [errors, setErrors] = useState<{ name?: string; description?: string; price?: string; qty?: string }>({});

  const [step, setStep] = useState<"form" | "unit">("form");
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const focusKeyboard = (e: React.FocusEvent<HTMLElement>) => { setKeyboardOpen(true); scrollFieldIntoView(e.currentTarget); };
  const blurKeyboard = () => setKeyboardOpen(false);

  // Edit mode only: the form step has no fixed heightClass here (see the heightClass comment
  // below), so stepping to the shorter Unit list would shrink the sheet the same way InvoiceSettings'
  // pickers did — floor it at the form step's own measured height instead (still lets it grow if a
  // step ever needs more room). Add mode's form step stays pinned to SERVICE_SHEET_HEIGHT and its
  // Unit step deliberately hugs its own shorter content (see that comment) — this floor is gated to
  // `initial` (edit mode) only so it doesn't undo that.
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [formBaseHeight, setFormBaseHeight] = useState<number | undefined>(undefined);
  const stepRef = useRef(step);
  stepRef.current = step;
  useLayoutEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    if (stepRef.current === "form") setFormBaseHeight(el.getBoundingClientRect().height);
    const ro = new ResizeObserver(([entry]) => {
      if (stepRef.current === "form") setFormBaseHeight(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  // Every line uses the invoice currency — it's shown (read-only) here, not chosen per line.
  const currency = invoiceCurrency;
  const currencyCountry = CURRENCY_COUNTRY[currency];

  // DES-817: every line field is required (Item Name, Description, Quantity, Unit Price) — Unit
  // itself defaults to "Unit" (a real, selectable entry in UNITS), so it's never unfilled.
  const handleAdd = () => {
    const next: typeof errors = {};
    if (!serviceName.trim()) next.name = "Enter the service name";
    if (!description.trim()) next.description = "Enter the description";
    if (!unitPrice.trim()) next.price = "Enter the unit price";
    if (!quantity.trim()) next.qty = "Enter the quantity";
    setErrors(next);
    const order = ["name", "description", "price", "qty"] as const;
    const firstKey = order.find((k) => next[k]);
    if (firstKey) {
      focusFirstInvalidField(`service-${firstKey}`);
      return;
    }
    onAdd?.({
      name: serviceName.trim(),
      description: description.trim() || undefined,
      unit,
      quantity: Number(quantity),
      unitPrice: Number(unitPrice),
    });
    // Reset for the next line.
    setServiceName("");
    setDescription("");
    setUnit("Unit");
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
      keyboardOpen={keyboardOpen}
      // The Add flow's form step matches its own fixed height so stepping to/from the Unit picker
      // doesn't resize the sheet; the Unit picker itself is a short, fixed 6-row list, so let it
      // hug its own content instead of inheriting the taller form height (which left empty space
      // below it). Edit mode's form step auto-sizes instead — its double "Save"/"Delete"
      // dock is taller than the single "Add Item" dock this fixed height was sized for, and pinning
      // it anyway forced BottomSheet's footer-overlap mode, crowding the dock flush against the
      // last field with no visual gap. Edit mode floors both its steps at the form step's own
      // measured height (minHeightPx/panelRef above) so its Unit step doesn't shrink the sheet —
      // unlike Add mode's Unit step, which keeps hugging its own shorter content on purpose.
      heightClass={step === "unit" || initial ? undefined : SERVICE_SHEET_HEIGHT}
      minHeightPx={initial ? formBaseHeight : undefined}
      panelRef={panelRef}
      footer={
        step === "unit" ? undefined : initial ? (
          // Editing an item: "Save" + a plain "Delete" secondary (swiping the line left still
          // works too) — Delete isn't marked destructive since the primary here isn't either
          // (see memory: secondaryDestructive needs a destructive primary).
          <ButtonDock
            type="double"
            primaryLabel="Save"
            secondaryLabel="Delete"
            onPrimary={handleAdd}
            onSecondary={onDelete}
            keyboard={keyboardOpen}
          />
        ) : (
          <ButtonDock
            type="single"
            primaryLabel="Add Item"
            onPrimary={handleAdd}
            keyboard={keyboardOpen}
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
                dataReq="service-name"
                label="Line Item"
                mandatory
                placeholder="e.g. Brand Identity Design"
                value={serviceName}
                error={!!errors.name}
                caption={errors.name}
                onChange={(v) => { setServiceName(v); if (errors.name) setErrors((p) => ({ ...p, name: undefined })); }}
                onFocus={focusKeyboard}
                onBlur={blurKeyboard}
              />

              <TextField
                dataReq="service-description"
                label="Description"
                mandatory
                placeholder="e.g. About Service"
                value={description}
                error={!!errors.description}
                caption={errors.description}
                onChange={(v) => { setDescription(v); if (errors.description) setErrors((p) => ({ ...p, description: undefined })); }}
                onFocus={focusKeyboard}
                onBlur={blurKeyboard}
              />

              {/* Currency is fixed per invoice (not chosen per line) — same TextField "currency"
                  type as everywhere else, just with no onSelectorClick since there's nothing to
                  open here. */}
              <TextField
                type="currency"
                dataReq="service-price"
                label="Unit Price"
                mandatory
                placeholder="e.g. 10.00"
                inputMode="decimal"
                value={unitPrice}
                error={!!errors.price}
                caption={errors.price}
                onChange={(v) => { setUnitPrice(v); if (errors.price) setErrors((p) => ({ ...p, price: undefined })); }}
                onFocus={focusKeyboard}
                onBlur={blurKeyboard}
                selectorLabel={currency || "—"}
                selectorIcon={currencyCountry && <CountryFlag name={currencyCountry} size={20} />}
              />

              {/* Quantity with the Unit picker inline (Figma) — the trailing "Unit ⌄" pushes the
                  "unit" step of this same sheet. TextField's own "unit" type (selectorLabel falls
                  back to "Unit" when none is chosen yet). */}
              <TextField
                type="unit"
                dataReq="service-qty"
                label="Quantity"
                mandatory
                placeholder="e.g. 3"
                inputMode="numeric"
                pattern="[0-9]*"
                value={quantity}
                error={!!errors.qty}
                caption={errors.qty}
                onChange={(v) => { setQuantity(v.replace(/[^0-9]/g, "")); if (errors.qty) setErrors((p) => ({ ...p, qty: undefined })); }}
                onFocus={focusKeyboard}
                onBlur={blurKeyboard}
                selectorLabel={unit}
                onSelectorClick={() => setStep("unit")}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </BottomSheet>
  );
}

export default AddServicesSheet;
