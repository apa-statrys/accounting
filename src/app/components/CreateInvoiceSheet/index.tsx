import { useState } from "react";
import { Plus, Upload } from "lucide-react";
import { motion } from "motion/react";
import { BottomSheet, sheetItem } from "../BottomSheet";
import { Tile } from "../../ui/Tile";
import { ScanDocument } from "../ScanDocument";
import styles from "./index.module.css";

interface CreateInvoiceSheetProps {
  open: boolean;
  onClose?: () => void;
  onManual?: () => void;
  onUpload?: (pageCount: number) => void;
}

/**
 * "Create" bottom sheet — slides up from the FAB with a list of choices: build
 * manually or scan/upload a file. No header ✕ (`hideClose`, decided 2026-08-20 — a plain
 * Tile-row chooser like this dismisses via picking a row or tapping the scrim, same as the
 * ⋯ actions menus); choices are DS Tile icon rows (24px icon + title, no description).
 * "Scan and upload" opens the native document-scanner mock (ScanDocument) on top of this
 * sheet — its own Close (X) exits the whole Create flow (never falls back to this chooser).
 * ScanDocument handles its own keep/retake-per-page + add-another/finish loop internally;
 * `onUpload` only fires once, on Done, with the total page count — all pages are one invoice.
 */
export function CreateInvoiceSheet({ open, onClose, onManual, onUpload }: CreateInvoiceSheetProps) {
  const [scanOpen, setScanOpen] = useState(false);

  const handleClose = () => {
    setScanOpen(false);
    onClose?.();
  };

  return (
    <>
      <BottomSheet open={open} title="Create Invoice" onClose={handleClose} hideClose>
        <div className={styles.list}>
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
              onClick={() => setScanOpen(true)}
            />
          </motion.div>
        </div>
      </BottomSheet>

      <ScanDocument
        open={open && scanOpen}
        onClose={handleClose}
        onCapture={(pageCount) => { setScanOpen(false); onUpload?.(pageCount); }}
      />
    </>
  );
}

export default CreateInvoiceSheet;
