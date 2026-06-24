import { useState } from "react";
import PhotoLibraryOutlinedIcon from "@mui/icons-material/PhotoLibraryOutlined";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { motion, AnimatePresence } from "motion/react";
import { BottomSheet, sheetItem } from "./BottomSheet";
import { ButtonDock } from "./ButtonDock";
import { Dropzone } from "./Dropzone";

const FONT = { fontFamily: "GT Walsheim LC, sans-serif" } as const;

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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-[rgba(160,160,160,0.2)]">
      <span className="text-[14px] leading-[1.3] text-[#808080]" style={FONT}>
        {label}
      </span>
      <span className="text-[14px] font-medium leading-[1.3] text-[#1b1b1b]" style={FONT}>
        {value}
      </span>
    </div>
  );
}

interface UploadInvoiceProps {
  onBack?: () => void;
  onContinue?: (files: File[]) => void;
}

/** Upload Invoice — pick files from library or files, with type/size guidance. */
export function UploadInvoice({ onBack, onContinue }: UploadInvoiceProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Validate against the file rules; returns an error message or null. */
  const validate = (file: File): string | null => {
    if (!ACCEPTED.includes(file.type)) return "Unsupported file type. Use PDF, JPG, or PNG.";
    if (file.size > MAX_MB * 1024 * 1024) return `File is too large. Maximum size is ${MAX_MB} MB.`;
    if (files.some((f) => f.name === file.name && f.size === file.size)) return "This file has already been added.";
    return null;
  };

  const addFile = (file: File) => {
    setMenuOpen(false);
    const err = validate(file);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setFiles((prev) => [...prev, file]);
  };

  const removeFile = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <>
      <BottomSheet
        open
        title="Upload Invoice"
        onClose={onBack}
        footer={
          <ButtonDock
            type="single"
            overflow
            primaryLabel="Continue"
            primaryDisabled={files.length === 0}
            onPrimary={() => onContinue?.(files)}
            homeIndicator
          />
        }
      >
        <div className="flex flex-col gap-5">
          {/* Validation error */}
          <AnimatePresence initial={false}>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-start gap-2.5 rounded-xl bg-[#fdecea] border border-[#f5c6c0] px-3.5 py-3">
                  <ErrorOutlineIcon style={{ fontSize: 18, color: "#d92d20", marginTop: 1 }} />
                  <p className="text-[13px] leading-[1.35] text-[#8a1c12]" style={FONT}>{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div variants={sheetItem}>
            {files.length === 0 ? (
              <Dropzone hint="Select one file under 10 MB" onClick={() => setMenuOpen(true)} />
            ) : (
              <div className="flex flex-col gap-2">
                {files.map((f, i) => (
                  <div
                    key={`${f.name}-${i}`}
                    className="flex items-center gap-3 bg-[#faf9f4] rounded-xl px-4 py-3"
                  >
                    <span className="flex-1 min-w-0 text-[14px] leading-[1.3] text-[#1b1b1b] truncate" style={FONT}>
                      {f.name}
                    </span>
                    <span className="text-[12px] leading-[1.3] text-[#808080] shrink-0" style={FONT}>
                      {(f.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                    <button type="button" onClick={() => removeFile(i)} aria-label="Remove" className="shrink-0">
                      <DeleteOutlineIcon style={{ fontSize: 18, color: "#808080" }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Guidance */}
          <motion.div variants={sheetItem} className="w-full">
            <InfoRow label="Accepted file types" value="PDF, JPG, PNG" />
            <InfoRow label="Maximum file size" value="10 MB" />
          </motion.div>

          {/* Demo triggers: the oversized-file rejection, and a valid-but-unreadable scan (OCR finds nothing) */}
          <motion.div variants={sheetItem} className="flex flex-col items-start gap-1.5">
            <button
              type="button"
              onClick={() => addFile(makeDemoFile("invoice-hires.pdf", "application/pdf", 12))}
              className="text-[12px] text-[#a0a0a0] underline"
              style={FONT}
            >
              Simulate an invalid file
            </button>
            <button
              type="button"
              onClick={() => addFile(makeDemoFile("blank-unreadable-scan.png", "image/png", 0.3))}
              className="text-[12px] text-[#a0a0a0] underline"
              style={FONT}
            >
              Simulate an unreadable scan
            </button>
          </motion.div>
        </div>
      </BottomSheet>

      {/* Choose-source — a small action sheet stacked over the upload sheet */}
      <BottomSheet open={menuOpen} title="Add a file" onClose={() => setMenuOpen(false)}>
        <div className="flex flex-col gap-2">
          <motion.button
            variants={sheetItem}
            type="button"
            onClick={() => addFile(makeDemoFile("invoice-scan.png", "image/png", 1.2))}
            className="w-full flex items-center justify-between rounded-xl bg-[#faf9f4] px-4 py-3.5 text-left transition-colors hover:bg-[#f2f0e8]"
          >
            <span className="text-[15px] text-[#1b1b1b]" style={FONT}>Choose from library</span>
            <PhotoLibraryOutlinedIcon style={{ fontSize: 20, color: "#1b1b1b" }} />
          </motion.button>
          <motion.button
            variants={sheetItem}
            type="button"
            onClick={() => addFile(makeDemoFile("invoice.pdf", "application/pdf", 0.4))}
            className="w-full flex items-center justify-between rounded-xl bg-[#faf9f4] px-4 py-3.5 text-left transition-colors hover:bg-[#f2f0e8]"
          >
            <span className="text-[15px] text-[#1b1b1b]" style={FONT}>Choose from files</span>
            <FolderOutlinedIcon style={{ fontSize: 20, color: "#1b1b1b" }} />
          </motion.button>
        </div>
      </BottomSheet>
    </>
  );
}

export default UploadInvoice;
