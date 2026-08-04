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
  onUpload?: () => void;
}

/**
 * "Create" bottom sheet — slides up from the FAB with a list of choices: build
 * manually or scan/upload a file. DS Bottomsheets header (grabber, no ✕); choices are
 * DS Tile icon rows (24px icon + title, no description). "Scan and upload" opens the native
 * document-scanner mock (ScanDocument) on top of this sheet — its own Close (X) exits the whole
 * Create flow (never falls back to this chooser); capture/import both proceed straight to OCR.
 */
export function CreateInvoiceSheet({ open, onClose, onManual, onUpload }: CreateInvoiceSheetProps) {
  const [scanOpen, setScanOpen] = useState(false);

  const handleClose = () => {
    setScanOpen(false);
    onClose?.();
  };

  return (
    <>
      <BottomSheet open={open} title="Create Invoice" onClose={handleClose}>
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
        onCapture={() => { setScanOpen(false); onUpload?.(); }}
        onImport={() => { setScanOpen(false); onUpload?.(); }}
      />
    </>
  );
}

export default CreateInvoiceSheet;
