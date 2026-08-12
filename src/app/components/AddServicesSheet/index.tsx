import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Trash2 } from "lucide-react";
import { PageAppHeader } from "../PageAppHeader";
import { PageHeader } from "../../ui/PageHeader";
import { TextField } from "../../ui/TextField";
import { ButtonDock } from "../ButtonDock";
import { BottomSheet } from "../BottomSheet";
import { Tile } from "../../ui/Tile";
import { CountryFlag } from "../CountryFlag";
import { CURRENCY_COUNTRY } from "../CurrencySheet";
import { FONT, PAGE_PUSH_TRANSITION } from "../../lib/theme";
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
 * Add a service / product line to the invoice — Figma "Add Item" sheet (user, 15/Jul; converted
 * to a full page 2026-08-11 — 4 fields is over this app's 3-field sheet-vs-page threshold): DS
 * header, Line Item / Description / Unit Price (flag + currency prefix) / Quantity with the Unit
 * picker inline in the field. CTA always enabled — a failed click scrolls to the first invalid
 * field and shows its inline error (form-cta-validation pattern).
 *
 * The Unit picker is a standalone `BottomSheet` stacked on top of this page (not an in-page
 * step-swap) — same pattern as InvoiceSettings' Company Details / Business Address pages.
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

  const [unitOpen, setUnitOpen] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const focusKeyboard = (e: React.FocusEvent<HTMLElement>) => { setKeyboardOpen(true); scrollFieldIntoView(e.currentTarget); };
  const blurKeyboard = () => setKeyboardOpen(false);

  // Edit mode only: hide the Save dock until something actually changes (`dirty`), and confirm via
  // the same "Unsaved changes?" sheet + Save/Cancel CTAs as AddCustomerPage/AddInvoiceDetails'
  // editingIssuedInvoice pattern — keeps this form consistent with every other edit flow in the app.
  const dirty = !!initial && (
    serviceName !== (initial.name ?? "") ||
    description !== (initial.description ?? "") ||
    unit !== (initial.unit ?? "Unit") ||
    quantity !== String(initial.quantity) ||
    unitPrice !== String(initial.unitPrice)
  );
  const [discardOpen, setDiscardOpen] = useState(false);
  const requestBack = () => (dirty ? setDiscardOpen(true) : onClose?.());
  // Deleting the line is irreversible — same "are you sure" confirm as every other delete in the
  // app (Sales Invoice List's "Delete Draft Invoice?", InvoiceDetailPage's "Delete this draft?",
  // CreditNoteDetailPage's "Delete credit note?") — the header icon opens this instead of calling
  // onDelete straight away.
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

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
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.root}
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={PAGE_PUSH_TRANSITION}
        >
          <div
            className={styles.body}
            onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
          >
            <PageAppHeader scrolled={scrolled}>
              <PageHeader
                type="center"
                title={initial ? "Edit Item" : "Add Item"}
                onBack={initial ? requestBack : onClose}
                // Edit mode swaps the right-side spacer for a delete icon (Figma MenuPageHeader
                // "More actions" slot) instead of a secondary "Delete" dock button — same header
                // slot CustomerDetailPage's edit-icon button uses. Red (--icon-error-primary)
                // since deleting the line is irreversible (see the app's destructive-color rule).
                showSearch={!!initial}
                rightIcon={initial ? <Trash2 size={20} strokeWidth={1} color="var(--icon-error-primary)" /> : undefined}
                rightLabel="Delete item"
                onRightClick={() => setConfirmDeleteOpen(true)}
              />
            </PageAppHeader>

            <div className={`px-4 pt-5 ${keyboardOpen ? "pb-[380px]" : "pb-28"}`}>
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

                {/* Quantity with the Unit picker inline (Figma) — the trailing "Unit ⌄" opens the
                    standalone Unit BottomSheet stacked on top of this page. TextField's own "unit"
                    type (selectorLabel falls back to "Unit" when none is chosen yet). */}
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
                  onSelectorClick={() => setUnitOpen(true)}
                />
              </div>
            </div>
          </div>

          {initial ? (
            // Editing an item: hidden until something actually changes (`dirty`) — an untouched
            // edit session has nothing to save or cancel, same as AddCustomerPage/AddInvoiceDetails'
            // edit docks. Explicit Save/Cancel (not a lone Save) — Cancel is a direct, unconfirmed
            // discard since it's already an explicit choice right next to Save (the header back
            // chevron is the ambiguous action, so IT confirms via requestBack instead). Delete lives
            // in the header's top-right icon now, not a third dock button.
            dirty && (
              <ButtonDock
                type="double"
                sticky
                primaryLabel="Save"
                secondaryLabel="Cancel"
                onPrimary={handleAdd}
                onSecondary={onClose}
                keyboard={keyboardOpen}
              />
            )
          ) : (
            <ButtonDock
              type="single"
              sticky
              primaryLabel="Add Item"
              onPrimary={handleAdd}
              keyboard={keyboardOpen}
            />
          )}

          {/* Unsaved-changes confirm (edit mode only) — same "Unsaved changes?" sheet + Save/Cancel
              CTAs as AddCustomerPage/AddInvoiceDetails' back-tap confirm. Save persists via the
              same handleAdd the dock's own Save button calls (still runs validation); Cancel
              discards via onClose. */}
          <BottomSheet
            open={discardOpen}
            title="Unsaved changes?"
            onClose={() => setDiscardOpen(false)}
            compact
            footer={
              <ButtonDock
                type="double"
                primaryLabel="Save"
                secondaryLabel="Cancel"
                onPrimary={() => { setDiscardOpen(false); handleAdd(); }}
                onSecondary={() => { setDiscardOpen(false); onClose?.(); }}
              />
            }
          >
            <p className="body-sm" style={{ ...FONT, color: "var(--text-secondary)" }}>
              You have unsaved changes. Save them before you go, or cancel to discard them.
            </p>
          </BottomSheet>

          {/* Delete confirm — same shape as every other delete-confirm in the app (Sales Invoice
              List's Delete Draft Invoice, InvoiceDetailPage's Delete this draft, CreditNoteDetailPage's
              Delete credit note): both actions destructive-styled (see memory:
              destructive-color-by-reversibility) — Delete Item leads as the filled primary, in red;
              Keep Item is the destructive secondary, rendering as a plain neutral outline. */}
          <BottomSheet
            open={confirmDeleteOpen}
            title="Delete this item?"
            onClose={() => setConfirmDeleteOpen(false)}
            compact
            footer={
              <ButtonDock
                type="double"
                primaryLabel="Delete Item"
                primaryDestructive
                secondaryLabel="Keep Item"
                secondaryDestructive
                onPrimary={() => { setConfirmDeleteOpen(false); onDelete?.(); }}
                onSecondary={() => setConfirmDeleteOpen(false)}
              />
            }
          >
            <p className="body-sm" style={{ ...FONT, color: "var(--text-secondary)" }}>
              Are you sure you want to delete this item? This action cannot be undone.
            </p>
          </BottomSheet>

          {/* Unit picker — standalone BottomSheet stacked on top of this page (nested here so it
              z-stacks above it), same shape as the Sort-by sheet elsewhere: a short, fixed list,
              no search needed. */}
          <BottomSheet open={unitOpen} title="Select Unit" onClose={() => setUnitOpen(false)}>
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
                    setUnitOpen(false);
                  }}
                />
              ))}
            </div>
          </BottomSheet>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AddServicesSheet;
