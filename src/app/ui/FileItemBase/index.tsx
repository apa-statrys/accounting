import styles from "./index.module.css";

/**
 * FileItemBase — design-system file-attachment row (Figma "[APP] Design System" →
 * FileItemBase, node 4655-4008). A file icon (with a colored format tag, e.g. "PDF") + name +
 * size, in one of three states:
 *   completed — just the size, trailing delete/replace/download action
 *   loading   — a progress-tinted fill behind the row + size + an upload "N% ⬆" line (always
 *               shows the delete/cancel action regardless of `action`)
 *   error     — red border, "Upload failed, please try again." + a "Try Again" link, stacked
 *               top-aligned since the row grows taller
 * `action` picks the non-loading trailing control: "delete" (trash icon), "replace" (text
 * button, e.g. for a re-upload flow), "download" (download icon, e.g. a completed file the user
 * can save — Send Invoice's Share/Download tab), or "none" (no trailing control at all — not a
 * Figma axis, for a read-only context with nothing to change, e.g. a past decision/summary
 * screen). Pass `onClick` to make the whole row tappable (e.g. open a preview) — the trailing
 * action's own click stops propagation so it doesn't also fire that.
 */

export type FileItemState = "completed" | "loading" | "error";
export type FileItemAction = "delete" | "replace" | "download" | "none";

interface FileItemBaseProps {
  name: string;
  /** Human-readable size, e.g. "200 KB" — hidden in the error state. */
  size?: string;
  /** Format tag on the file icon (Figma "pdf") — any short label. */
  fileType?: string;
  state?: FileItemState;
  /** 0–100, only meaningful while state="loading". */
  progress?: number;
  /** Trailing action when not loading. Loading always shows delete (cancel upload). */
  action?: FileItemAction;
  /** Tap the row itself (e.g. open a preview) — ignored while loading. */
  onClick?: () => void;
  onDelete?: () => void;
  onReplace?: () => void;
  onDownload?: () => void;
  /** Error state's "Try Again" link. */
  onRetry?: () => void;
  className?: string;
}

function FileIcon({ label }: { label: string }) {
  return (
    <span className={styles.icon} aria-hidden="true">
      <svg width="21" height="27" viewBox="0 0 21 27" fill="none">
        <path
          d="M2.74 0.5H12.04L20.49 8.66V24.26C20.49 25.49 19.49 26.49 18.26 26.49H2.74C1.51 26.49 0.51 25.49 0.51 24.26V2.74C0.51 1.51 1.51 0.5 2.74 0.5Z"
          fill="white"
          stroke="#C8D2E1"
          strokeWidth="1.03"
        />
        <path
          d="M12.04 0.5V7.5C12.04 8.15 12.5 8.66 13.15 8.66H20.49"
          stroke="#C8D2E1"
          strokeWidth="1.03"
          strokeLinecap="round"
        />
      </svg>
      <span className={styles.tag}>{label}</span>
    </span>
  );
}

function TrashIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 16 17.6667" fill="none" aria-hidden="true">
      <path
        d="M6.33333 8V13M9.66667 8V13M13.8333 3.83333V15.5C13.8333 15.942 13.6577 16.366 13.3452 16.6785C13.0326 16.9911 12.6087 17.1667 12.1667 17.1667H3.83333C3.39131 17.1667 2.96738 16.9911 2.65482 16.6785C2.34226 16.366 2.16667 15.942 2.16667 15.5V3.83333M0.5 3.83333H15.5M4.66667 3.83333V2.16667C4.66667 1.72464 4.84226 1.30072 5.15482 0.988155C5.46738 0.675595 5.89131 0.5 6.33333 0.5H9.66667C10.1087 0.5 10.5326 0.675595 10.8452 0.988155C11.1577 1.30072 11.3333 1.72464 11.3333 2.16667V3.83333"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 8.5 8.5" fill="none" aria-hidden="true">
      <path
        d="M4.25 0.5V5.5M2.16667 2.58333L4.25 0.5L6.33333 2.58333M8 5.5V7.16667C8 7.38768 7.9122 7.59964 7.75592 7.75592C7.59964 7.9122 7.38768 8 7.16667 8H1.33333C1.11232 8 0.900358 7.9122 0.744078 7.75592C0.587797 7.59964 0.5 7.38768 0.5 7.16667V5.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FileItemBase({
  name,
  size = "200 KB",
  fileType = "pdf",
  state = "completed",
  progress = 0,
  action = "delete",
  onClick,
  onDelete,
  onReplace,
  onDownload,
  onRetry,
  className,
}: FileItemBaseProps) {
  const isError = state === "error";
  const isLoading = state === "loading";
  const pct = Math.min(100, Math.max(0, progress));

  const classes = [styles.root, isError ? styles.error : "", onClick ? styles.clickable : "", className || ""]
    .filter(Boolean)
    .join(" ");

  const trailing =
    !isLoading && action === "replace" ? (
      <button
        type="button"
        className={styles.replaceBtn}
        onClick={(e) => { e.stopPropagation(); onReplace?.(); }}
      >
        Replace
      </button>
    ) : !isLoading && action === "download" ? (
      <button
        type="button"
        className={styles.iconBtn}
        aria-label="Download file"
        onClick={(e) => { e.stopPropagation(); onDownload?.(); }}
      >
        <DownloadIcon />
      </button>
    ) : !isLoading && action === "none" ? null : (
      <button
        type="button"
        className={styles.iconBtn}
        aria-label="Remove file"
        onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
      >
        <TrashIcon />
      </button>
    );

  return (
    <div className={classes} onClick={onClick} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined}>
      {isLoading && <span className={styles.progressFill} style={{ width: `${pct}%` }} aria-hidden="true" />}

      <FileIcon label={fileType} />

      <div className={styles.body}>
        <p className={styles.name}>{name}</p>
        {isError ? (
          <>
            <p className={styles.errorCaption}>Upload failed, please try again.</p>
            <button type="button" className={styles.retry} onClick={(e) => { e.stopPropagation(); onRetry?.(); }}>
              Try Again
            </button>
          </>
        ) : (
          <div className={styles.metaRow}>
            <span className={styles.meta}>{size}</span>
            {isLoading && (
              <>
                <span className={styles.divider} aria-hidden="true" />
                <span className={styles.metaRow} style={{ color: "var(--icon-secondary)" }}>
                  <UploadIcon />
                  <span className={styles.meta}>{pct}%</span>
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {trailing}
    </div>
  );
}

export default FileItemBase;
