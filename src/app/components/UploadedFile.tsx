import { motion, AnimatePresence } from "motion/react";
import { FileText, Eye } from "lucide-react";
import CloseIcon from "@mui/icons-material/Close";
import StatusBar from "./StatusBar";
import { SheetHeader, HeaderIconButton } from "./SheetHeader";

const FONT = { fontFamily: "GT Walsheim LC, sans-serif" } as const;

export interface UploadedFileInfo {
  name: string;
  size: number;
}

/** The uploaded-file chip with a Preview button. Render the overlay separately (at page root). */
export function UploadedFileCard({ file, onPreview }: { file: UploadedFileInfo; onPreview?: () => void }) {
  return (
    <div className="flex items-center gap-3 bg-[#faf9f4] border border-[rgba(160,160,160,0.25)] rounded-xl px-4 py-3">
      <FileText size={20} strokeWidth={1.75} style={{ color: "#808080" }} />
      <div className="flex-1 min-w-0">
        <p className="text-[14px] leading-[1.3] text-[#1b1b1b] truncate" style={FONT}>{file.name}</p>
        <p className="text-[12px] leading-[1.3] text-[#808080]" style={FONT}>
          {(file.size / 1024 / 1024).toFixed(1)} MB
        </p>
      </div>
      <button
        type="button"
        onClick={onPreview}
        className="shrink-0 h-8 px-3 rounded-lg border border-[rgba(160,160,160,0.4)] bg-white flex items-center gap-1.5 text-[13px] font-medium text-[#1b1b1b]"
        style={FONT}
      >
        <Eye size={15} strokeWidth={2} />
        Preview
      </button>
    </div>
  );
}

/**
 * Full-screen viewer for the original uploaded file. Render at the PAGE ROOT (not inside a
 * scroll container, which would clip it). Demo: a representative document, no real bytes.
 */
export function FilePreviewOverlay({ open, file, onClose }: { open: boolean; file: UploadedFileInfo | null; onClose?: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-50 bg-[#2b2b2b] flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <StatusBar darkMode />
          <SheetHeader
            title="Original file"
            type="inside-page"
            state="fixed"
            leading={
              <HeaderIconButton aria-label="Close" onClick={onClose}>
                <CloseIcon />
              </HeaderIconButton>
            }
            trailing={<span className="w-[30px] h-[30px] block" aria-hidden />}
          />
          <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col items-center gap-3">
            {/* Faux scanned-invoice page standing in for the uploaded document */}
            <div className="w-full bg-white rounded-lg shadow-xl p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1.5">
                  <div className="h-3.5 w-24 rounded bg-[#1b1b1b]" />
                  <div className="h-2 w-20 rounded bg-[#e5e5e5]" />
                </div>
                <div className="h-9 w-9 rounded bg-[#eee]" />
              </div>
              <div className="h-px w-full bg-[#f0f0f0]" />
              <div className="flex flex-col gap-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="h-2.5 rounded bg-[#ececec]" style={{ width: `${55 - i * 8}%` }} />
                    <div className="h-2.5 w-12 rounded bg-[#ececec]" />
                  </div>
                ))}
              </div>
              <div className="h-px w-full bg-[#f0f0f0]" />
              <div className="flex items-center justify-between">
                <div className="h-3 w-16 rounded bg-[#e5e5e5]" />
                <div className="h-3 w-20 rounded bg-[#1b1b1b]" />
              </div>
            </div>
            <p className="text-[12px] leading-[1.4] text-white/55 text-center" style={FONT}>
              {file?.name} · preview of your uploaded document
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
