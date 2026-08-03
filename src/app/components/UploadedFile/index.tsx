import { BottomSheet } from "../BottomSheet";
import { ButtonDock } from "../ButtonDock";
import styles from "./index.module.css";

export interface UploadedFileInfo {
  name: string;
  size: number;
}

/**
 * Bottom-sheet viewer for the original uploaded file. Render at the PAGE ROOT (not inside a
 * scroll container, which would clip it). Demo: a representative document, no real bytes.
 * Title is the actual file name, not a generic label. `onReupload` is opt-in (e.g. the
 * duplicate-invoice decision page) — omit it anywhere reuploading doesn't make sense and the
 * sheet stays footerless.
 */
export function FilePreviewOverlay({
  open,
  file,
  onClose,
  onReupload,
}: {
  open: boolean;
  file: UploadedFileInfo | null;
  onClose?: () => void;
  onReupload?: () => void;
}) {
  return (
    <BottomSheet
      open={open}
      title={file?.name ?? "Original file"}
      onClose={onClose}
      heightClass="h-[72%]"
      footer={onReupload ? <ButtonDock type="single" primaryLabel="Re-upload" onPrimary={onReupload} /> : undefined}
    >
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
          Preview of your uploaded document
        </p>
      </div>
    </BottomSheet>
  );
}
