import { FileText, Eye } from "lucide-react";
import { BottomSheet } from "../BottomSheet";
import styles from "./index.module.css";

export interface UploadedFileInfo {
  name: string;
  size: number;
}

/** The uploaded-file chip with a Preview button. Render the overlay separately (at page root). */
export function UploadedFileCard({ file, onPreview }: { file: UploadedFileInfo; onPreview?: () => void }) {
  return (
    <div className={styles.card}>
      <FileText size={20} strokeWidth={1.75} className={styles.icon} />
      <div className={styles.info}>
        <p className={`${styles.fileName} body-sm`}>{file.name}</p>
        <p className={`${styles.fileSize} caption`}>
          {(file.size / 1024 / 1024).toFixed(1)} MB
        </p>
      </div>
      <button type="button" onClick={onPreview} className={styles.previewButton}>
        <Eye size={15} strokeWidth={2} />
        <span className={styles.previewLabel}>Preview</span>
      </button>
    </div>
  );
}

/**
 * Bottom-sheet viewer for the original uploaded file. Render at the PAGE ROOT (not inside a
 * scroll container, which would clip it). Demo: a representative document, no real bytes.
 */
export function FilePreviewOverlay({ open, file, onClose }: { open: boolean; file: UploadedFileInfo | null; onClose?: () => void }) {
  return (
    <BottomSheet open={open} title="Original file" onClose={onClose} heightClass="h-[72%]">
      <div className={styles.overlayBody}>
        {/* Faux scanned-invoice page standing in for the uploaded document */}
        <div className={styles.docCard}>
          <div className={styles.docHeaderRow}>
            <div className={styles.docHeaderCol}>
              <div className={styles.docHeaderBar} />
              <div className={styles.docHeaderSub} />
            </div>
            <div className={styles.docHeaderSquare} />
          </div>
          <div className={styles.docDivider} />
          <div className={styles.docLines}>
            {[0, 1, 2].map((i) => (
              <div key={i} className={styles.docLineRow}>
                <div className={styles.docLineBar} style={{ width: `${55 - i * 8}%` }} />
                <div className={styles.docLineValue} />
              </div>
            ))}
          </div>
          <div className={styles.docDivider} />
          <div className={styles.docFooterRow}>
            <div className={styles.docFooterLabel} />
            <div className={styles.docFooterValue} />
          </div>
        </div>
        <p className={styles.previewCaption}>
          {file?.name} · preview of your uploaded document
        </p>
      </div>
    </BottomSheet>
  );
}
