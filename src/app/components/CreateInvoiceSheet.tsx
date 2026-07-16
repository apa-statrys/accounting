import { Plus, Upload } from "lucide-react";
import { motion } from "motion/react";
import { BottomSheet, sheetItem } from "./BottomSheet";
import { Tile } from "../ui/Tile";

interface CreateInvoiceSheetProps {
  open: boolean;
  onClose?: () => void;
  onManual?: () => void;
  onUpload?: () => void;
}

/**
 * "Create" bottom sheet — slides up from the FAB with a list of choices: build
 * manually or upload/scan a file. Recurring (DES-782) is NOT a separate entry here — it's a toggle
 * inside the normal Create Invoice flow. DS Bottomsheets header (grabber, no ✕); choices are
 * DS Tile icon rows (24px icon + title, no description).
 */
export function CreateInvoiceSheet({ open, onClose, onManual, onUpload }: CreateInvoiceSheetProps) {
  return (
    <BottomSheet open={open} title="Create Invoice" onClose={onClose} dsHeader>
      <div className="flex flex-col gap-2">
        <motion.div variants={sheetItem}>
          <Tile
            title="Build an invoice step by step"
            icon={<Plus size={24} strokeWidth={1.75} />}
            reserveTrailing={false}
            onClick={onManual}
          />
        </motion.div>
        <motion.div variants={sheetItem}>
          <Tile
            title="Scan and upload existing invoice"
            icon={<Upload size={24} strokeWidth={1.75} />}
            reserveTrailing={false}
            onClick={onUpload}
          />
        </motion.div>
      </div>
    </BottomSheet>
  );
}

export default CreateInvoiceSheet;
