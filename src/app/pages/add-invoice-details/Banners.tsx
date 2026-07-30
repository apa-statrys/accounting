// The three informational banners at the top of the invoice editor (upload flow, DES-716).
import CloseIcon from "@mui/icons-material/Close";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { FONT } from "../../lib/theme";

/** "N out of M extracted" — only when a field couldn't be read (OCR-missing case). */
export function CoverageBanner({ fieldsExtracted, fieldsTotal }: { fieldsExtracted: number; fieldsTotal: number }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-[#f6f1ff] px-3.5 py-3">
      <AutoAwesomeIcon style={{ fontSize: 18, color: "#7c3aed", marginTop: 1 }} />
      <p className="text-[13px] leading-[1.35] text-[#4b3f63]" style={FONT}>
        {fieldsExtracted} out of {fieldsTotal} extracted. Please review before creating.
      </p>
    </div>
  );
}

/** OCR-failure notice (couldn't read the file) — takes priority over the coverage summary. */
export function ExtractionFailedBanner({ onReupload, onDismiss }: { onReupload?: () => void; onDismiss: () => void }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border px-3.5 py-3" style={{ background: "var(--bg-warning-subtle)", borderColor: "var(--border-warning-subtle)" }}>
      <ErrorOutlineIcon style={{ fontSize: 18, color: "var(--icon-warning-primary)", marginTop: 1 }} />
      <div className="flex-1">
        <p className="text-[13px] leading-[1.35]" style={{ ...FONT, color: "var(--text-warning-primary)" }}>
          We couldn’t read this file. Please enter the details below.
        </p>
        {onReupload && (
          <button
            type="button"
            onClick={onReupload}
            className="mt-1 text-[13px] font-medium underline"
            style={{ ...FONT, color: "var(--text-warning-primary)" }}
          >
            Upload a clearer file
          </button>
        )}
      </div>
      <button type="button" onClick={onDismiss} aria-label="Dismiss" className="shrink-0">
        <CloseIcon style={{ fontSize: 16, color: "var(--icon-warning-primary)" }} />
      </button>
    </div>
  );
}

/** Duplicate found — informational; the action lives in the dock ("Continue existing draft"). */
export function DuplicateBanner() {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border px-3.5 py-3" style={{ background: "var(--bg-warning-subtle)", borderColor: "var(--border-warning-subtle)" }}>
      <ErrorOutlineIcon style={{ fontSize: 18, color: "var(--icon-warning-primary)", marginTop: 1 }} />
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold leading-[1.3]" style={{ ...FONT, color: "var(--text-warning-primary)" }}>Duplicate invoice found</p>
        <p className="text-[12px] leading-[1.35] mt-0.5" style={{ ...FONT, color: "var(--text-warning-primary)" }}>
          An invoice with this number already exists.
        </p>
      </div>
    </div>
  );
}
