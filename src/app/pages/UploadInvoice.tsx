import { useState } from "react";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import PhotoLibraryOutlinedIcon from "@mui/icons-material/PhotoLibraryOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { motion } from "motion/react";
import { BottomSheet, sheetItem } from "../components/BottomSheet";
import { ButtonDock } from "../components/ButtonDock";
import { ScanDocument } from "./ScanDocument";

import { FONT } from "../lib/theme";

// File rules (ticket: accepted formats + max size; duplicate/invalid blocked).
const ACCEPTED = ["application/pdf", "image/png", "image/jpeg"];
const MAX_MB = 10;

/**
 * Build a stand-in File so the upload flow is always demonstrable inside the
 * Figma Make preview, where the sandboxed iframe can block the native file dialog.
 * (In a published build you'd swap these for real picked files.)
 */
function makeDemoFile(name: string, type: string, sizeMB: number): File {
  return new File([new ArrayBuffer(Math.round(sizeMB * 1024 * 1024))], name, { type });
}

/** Short uppercase format label from a file's MIME type (PDF / JPG / PNG). */
function typeLabel(f: File): string {
  if (f.type === "application/pdf") return "PDF";
  if (f.type === "image/png") return "PNG";
  if (f.type === "image/jpeg") return "JPG";
  return (f.name.split(".").pop() || "FILE").toUpperCase();
}

/** File-rule row (label + value), the previous "Accepted file types / Maximum file size" style. */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-[rgba(160,160,160,0.2)] last:border-b-0">
      <span className="text-[14px] leading-[1.3] text-[#808080]" style={FONT}>
        {label}
      </span>
      <span className="text-[14px] font-medium leading-[1.3] text-[#1b1b1b]" style={FONT}>
        {value}
      </span>
    </div>
  );
}

/** One tappable source row in the picker (icon + label, whole row tappable). */
function SourceRow({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick?: () => void }) {
  return (
    <motion.button
      variants={sheetItem}
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 rounded-xl bg-[#faf9f4] border border-[rgba(160,160,160,0.18)] px-4 py-3.5 text-left transition-colors hover:bg-[#f2f0e8]"
    >
      <span className="shrink-0 text-[#1b1b1b] flex" aria-hidden>{icon}</span>
      <span className="text-[15px] text-[#1b1b1b]" style={FONT}>{label}</span>
    </motion.button>
  );
}

interface UploadInvoiceProps {
  onBack?: () => void;
  onContinue?: (files: File[]) => void;
  /** Pre-attached files — re-seeds the sheet when reopened (e.g. Back from the duplicate page). */
  initialFiles?: File[];
}

/** Add Existing Invoice — pick a source (camera / photos / files), with type/size guidance. */
export function UploadInvoice({ onBack, onContinue, initialFiles = [] }: UploadInvoiceProps) {
  const [files, setFiles] = useState<File[]>(initialFiles);
  const [scanOpen, setScanOpen] = useState(false);
  // Validation-failure message — drives the (CTA-less) file-rules modal.
  const [error, setError] = useState<string | null>(null);

  /** Validate against the file rules; returns an error message or null. */
  const validate = (file: File): string | null => {
    if (!ACCEPTED.includes(file.type)) return "This file type isn't supported.";
    if (file.size > MAX_MB * 1024 * 1024) return `This file is larger than ${MAX_MB} MB.`;
    if (files.some((f) => f.name === file.name && f.size === file.size)) return "This file has already been added.";
    return null;
  };

  const addFile = (file: File) => {
    const err = validate(file);
    if (err) {
      setError(err); // shown inline above the sources
      return;
    }
    setError(null);
    setFiles((prev) => [...prev, file]);
  };

  // Demo file sources go STRAIGHT to OCR — the picked demo file is fixed, so the separate "Continue"
  // step just hid the extraction screen. Validation still runs (rejects oversized/unsupported).
  const pickAndContinue = (file: File) => {
    const err = validate(file);
    if (err) { setError(err); return; }
    setError(null);
    onContinue?.([file]);
  };

  const removeFile = (i: number) => {
    setError(null);
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  };

  const hasFiles = files.length > 0;

  return (
    <>
      <BottomSheet
        open
        title="Add Existing Invoice"
        onClose={onBack}
        footer={
          // Continue appears only once a file is attached — the source picker has no CTA.
          hasFiles ? (
            <ButtonDock
              type="single"
              primaryLabel="Continue"
              onPrimary={() => onContinue?.(files)}
              homeIndicator
            />
          ) : undefined
        }
      >
        <div className="flex flex-col gap-5">
          {!hasFiles ? (
            <>
              {/* Validation error — shown inline above the sources. */}
              {error && (
                <div className="flex items-start gap-2.5 rounded-xl bg-[#fdecea] border border-[#f5c6c0] px-3.5 py-3">
                  <ErrorOutlineIcon style={{ fontSize: 18, color: "#d92d20", marginTop: 1 }} />
                  <p className="text-[13px] leading-[1.35] text-[#8a1c12]" style={FONT}>{error}</p>
                </div>
              )}

              {/* Source selection — the picker IS the sheet (no dropzone middle step). */}
              <div className="flex flex-col gap-2">
                <SourceRow
                  label="Take Photo"
                  icon={<PhotoCameraOutlinedIcon style={{ fontSize: 22 }} />}
                  onClick={() => { setError(null); setScanOpen(true); }}
                />
                <SourceRow
                  label="Choose from Photos"
                  icon={<PhotoLibraryOutlinedIcon style={{ fontSize: 22 }} />}
                  onClick={() => pickAndContinue(makeDemoFile("invoice-scan.png", "image/png", 1.2))}
                />
                <SourceRow
                  label="Browse Files"
                  icon={<InsertDriveFileOutlinedIcon style={{ fontSize: 22 }} />}
                  onClick={() => pickAndContinue(makeDemoFile("invoice.pdf", "application/pdf", 0.4))}
                />
              </div>

              {/* Accepted types + size — always visible under the sources. */}
              <div className="w-full">
                <InfoRow label="Accepted file types" value="PDF, JPG, PNG" />
                <InfoRow label="Maximum file size" value="10 MB" />
              </div>
            </>
          ) : (
            /* Picked file(s) — name, type + size, with remove. */
            <motion.div variants={sheetItem} className="flex flex-col gap-2">
              {files.map((f, i) => (
                <div
                  key={`${f.name}-${i}`}
                  className="flex items-center gap-3 bg-[#faf9f4] border border-[rgba(160,160,160,0.18)] rounded-xl px-4 py-3"
                >
                  <InsertDriveFileOutlinedIcon style={{ fontSize: 22, color: "#808080" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] leading-[1.3] text-[#1b1b1b] truncate" style={FONT}>{f.name}</p>
                    <p className="text-[12px] leading-[1.3] text-[#808080]" style={FONT}>
                      {typeLabel(f)} · {(f.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                  <button type="button" onClick={() => removeFile(i)} aria-label="Remove" className="shrink-0">
                    <DeleteOutlineIcon style={{ fontSize: 18, color: "#808080" }} />
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </BottomSheet>

      {/* Camera + scanner demo — capture returns an oversized photo → "file too large" error. */}
      <ScanDocument
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onCapture={() => {
          setScanOpen(false);
          addFile(makeDemoFile("invoice-photo.jpg", "image/jpeg", 12));
        }}
      />
    </>
  );
}

export default UploadInvoice;
